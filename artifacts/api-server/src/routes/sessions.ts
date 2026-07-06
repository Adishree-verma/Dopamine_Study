import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, sessionsTable, questionsTable, usersTable, userAchievementsTable, achievementsTable } from "@workspace/db";
import {
  StartSessionBody,
  ListSessionsQueryParams,
  ListSessionsResponse,
  CompleteSessionParams,
  CompleteSessionBody,
  CompleteSessionResponse,
} from "@workspace/api-zod";
import { getUserId } from "./users";

const router: IRouter = Router();

router.post("/sessions", async (req, res): Promise<void> => {
  const parsed = StartSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userId, mode, category, difficulty, questionCount = 10 } = parsed.data;

  let allQuestions = await db.select().from(questionsTable);
  if (category) allQuestions = allQuestions.filter(q => q.category === category);
  if (difficulty) allQuestions = allQuestions.filter(q => q.difficulty === difficulty);

  // Prefer unseen questions to avoid repeats
  const completedSessions = await db.select({ questionIds: sessionsTable.questionIds })
    .from(sessionsTable)
    .where(and(eq(sessionsTable.userId, userId), eq(sessionsTable.status, "completed")));
  const seenIds = new Set(completedSessions.flatMap(s => (s.questionIds as number[])));

  let pool = allQuestions.filter(q => !seenIds.has(q.id));
  if (pool.length < questionCount) pool = allQuestions;

  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, questionCount);
  const questionIds = shuffled.map(q => q.id);

  const [session] = await db.insert(sessionsTable).values({
    userId,
    mode,
    questionIds,
    status: "active",
    totalQuestions: shuffled.length,
  }).returning();

  res.status(201).json({
    id: session.id,
    userId: session.userId,
    mode: session.mode,
    questions: shuffled.map(q => ({ ...q, options: q.options as string[] })),
    status: session.status,
    score: session.score ?? null,
    totalQuestions: session.totalQuestions,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
  });
});

router.get("/sessions", async (req, res): Promise<void> => {
  const parsed = ListSessionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "No user ID provided" });
    return;
  }
  const limit = parsed.data.limit ?? 10;

  const sessions = await db.select().from(sessionsTable)
    .where(eq(sessionsTable.userId, userId))
    .orderBy(desc(sessionsTable.startedAt))
    .limit(limit);

  res.json(ListSessionsResponse.parse(sessions.map(s => ({
    id: s.id,
    userId: s.userId,
    mode: s.mode,
    questions: [],
    status: s.status,
    score: s.score ?? null,
    totalQuestions: s.totalQuestions,
    startedAt: s.startedAt.toISOString(),
    completedAt: s.completedAt?.toISOString() ?? null,
  }))));
});

router.post("/sessions/:id/complete", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CompleteSessionParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CompleteSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userId, score, totalQuestions, timeSpentSeconds } = parsed.data;
  const accuracyPercent = Math.round((score / Math.max(totalQuestions, 1)) * 100);

  const xpGained = score * 15 + Math.floor(accuracyPercent / 10) * 10;
  const gemsGained = accuracyPercent >= 80 ? Math.floor(score / 5) + 1 : 0;

  await db.update(sessionsTable).set({
    status: "completed",
    score,
    timeSpentSeconds,
    completedAt: new Date(),
  }).where(eq(sessionsTable.id, params.data.id));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const newXp = user.xp + xpGained;
  const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
  const leveledUp = newLevel > user.level;

  await db.update(usersTable).set({
    xp: newXp,
    level: newLevel,
    gems: user.gems + gemsGained,
    weeklyXp: user.weeklyXp + xpGained,
  }).where(eq(usersTable.id, userId));

  const newAchievements: any[] = [];
  const totalSessions = await db.select().from(sessionsTable)
    .where(and(eq(sessionsTable.userId, userId), eq(sessionsTable.status, "completed")));

  const allAchievements = await db.select().from(achievementsTable);
  const earnedIds = (await db.select().from(userAchievementsTable)
    .where(eq(userAchievementsTable.userId, userId))).map(a => a.achievementId);

  for (const ach of allAchievements) {
    if (earnedIds.includes(ach.id)) continue;
    let earned = false;
    if (ach.requirementType === "sessions" && totalSessions.length >= ach.requirementValue) earned = true;
    if (ach.requirementType === "perfect_session" && accuracyPercent === 100) earned = true;
    if (ach.requirementType === "level" && newLevel >= ach.requirementValue) earned = true;

    if (earned) {
      await db.insert(userAchievementsTable).values({ userId, achievementId: ach.id });
      newAchievements.push({
        id: ach.id,
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        xpReward: ach.xpReward,
        category: ach.category,
        rarity: ach.rarity,
      });
    }
  }

  res.json(CompleteSessionResponse.parse({
    score,
    totalQuestions,
    xpGained,
    gemsGained,
    newXp,
    newLevel,
    accuracyPercent,
    newAchievements,
    leveledUp,
  }));
});

export default router;
