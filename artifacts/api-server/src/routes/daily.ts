import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, dailyChallengesTable, userDailyChallengesTable, questionsTable, usersTable } from "@workspace/db";
import {
  GetDailyChallengeResponse,
  CompleteDailyChallengeBody,
  CompleteDailyChallengeResponse,
} from "@workspace/api-zod";
import { getUserId } from "./users";

const router: IRouter = Router();

router.get("/daily-challenge", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "No user ID provided" });
    return;
  }
  const today = new Date().toISOString().slice(0, 10);

  let [challenge] = await db.select().from(dailyChallengesTable).where(eq(dailyChallengesTable.date, today));

  if (!challenge) {
    const allQuestions = await db.select().from(questionsTable);
    const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, 5);
    const themes = ["Vocabulary Blitz", "Grammar Sprint", "Math Challenge", "Reading Focus", "Mixed Mastery"];
    const theme = themes[Math.floor(Math.random() * themes.length)];

    const [newChallenge] = await db.insert(dailyChallengesTable).values({
      date: today,
      questionIds: shuffled.map(q => q.id),
      theme,
      bonusMultiplier: 2.0,
      xpBonus: 150,
    }).returning();
    challenge = newChallenge;
  }

  const questionIds = challenge.questionIds as number[];
  const allChallengeQuestions = await Promise.all(
    questionIds.map(async id => {
      const [q] = await db.select().from(questionsTable).where(eq(questionsTable.id, id));
      return q;
    })
  );

  const userCompletion = await db.select().from(userDailyChallengesTable)
    .where(and(
      eq(userDailyChallengesTable.userId, userId),
      eq(userDailyChallengesTable.challengeId, challenge.id)
    ));

  const completed = userCompletion.length > 0;

  res.json(GetDailyChallengeResponse.parse({
    id: challenge.id,
    date: challenge.date,
    questions: allChallengeQuestions.filter(Boolean).map(q => ({
      ...q,
      options: q.options as string[],
    })),
    theme: challenge.theme,
    bonusMultiplier: challenge.bonusMultiplier,
    completed,
    xpBonus: challenge.xpBonus,
  }));
});

router.post("/daily-challenge/complete", async (req, res): Promise<void> => {
  const parsed = CompleteDailyChallengeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userId, score, totalQuestions, timeSpentSeconds } = parsed.data;
  const today = new Date().toISOString().slice(0, 10);

  const [challenge] = await db.select().from(dailyChallengesTable).where(eq(dailyChallengesTable.date, today));
  if (!challenge) {
    res.status(404).json({ error: "No daily challenge found" });
    return;
  }

  const accuracyPercent = Math.round((score / Math.max(totalQuestions, 1)) * 100);
  const baseXp = score * 20;
  const bonusXp = Math.round(baseXp * (challenge.bonusMultiplier - 1));
  const xpGained = baseXp + bonusXp;
  const gemsGained = Math.floor(score / 2) + 2;

  await db.insert(userDailyChallengesTable).values({
    userId,
    challengeId: challenge.id,
    score,
  }).onConflictDoNothing();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const newXp = user.xp + xpGained;
  const newStreak = user.streak + 1;

  await db.update(usersTable).set({
    xp: newXp,
    level: Math.floor(Math.sqrt(newXp / 100)) + 1,
    gems: user.gems + gemsGained,
    streak: newStreak,
    maxStreak: Math.max(user.maxStreak, newStreak),
    weeklyXp: user.weeklyXp + xpGained,
    lastActiveAt: new Date(),
  }).where(eq(usersTable.id, userId));

  res.json(CompleteDailyChallengeResponse.parse({
    xpGained,
    gemsGained,
    bonusXp,
    newStreak,
    newXp,
    newAchievements: [],
  }));
});

export default router;
