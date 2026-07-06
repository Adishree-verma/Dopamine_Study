import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, questionsTable, usersTable, userAchievementsTable, achievementsTable, userDailyStatsTable, userCategoryStatsTable } from "@workspace/db";
import {
  ListQuestionsQueryParams,
  ListQuestionsResponse,
  AnswerQuestionParams,
  AnswerQuestionBody,
  AnswerQuestionResponse,
} from "@workspace/api-zod";
import { getUserId } from "./users";

const router: IRouter = Router();

router.get("/questions", async (req, res): Promise<void> => {
  const parsed = ListQuestionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { category, difficulty, limit = 20, offset = 0 } = parsed.data;

  let query = db.select().from(questionsTable);
  const conditions = [];
  if (category) conditions.push(eq(questionsTable.category, category));
  if (difficulty) conditions.push(eq(questionsTable.difficulty, difficulty));

  const questions = await (conditions.length > 0
    ? query.where(and(...conditions)).limit(limit).offset(offset)
    : query.limit(limit).offset(offset));

  res.json(ListQuestionsResponse.parse(questions.map(q => ({
    ...q,
    options: q.options as string[],
  }))));
});

router.post("/questions/:id/answer", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AnswerQuestionParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AnswerQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, params.data.id));
  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  const correct = parsed.data.selectedIndex === question.correctIndex;
  const userId = parsed.data.userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  let xpGained = 0;
  let streakBonus = 0;
  let gemsGained = 0;
  const newStreak = correct ? user.streak + 1 : 0;

  if (correct) {
    xpGained = question.xpReward;
    streakBonus = Math.min(Math.floor(newStreak / 3) * 5, 25);
    xpGained += streakBonus;
    gemsGained = newStreak % 5 === 0 && newStreak > 0 ? 1 : 0;
  }

  const newXp = user.xp + xpGained;
  const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
  const newMaxStreak = Math.max(user.maxStreak, newStreak);

  const today = new Date().toISOString().slice(0, 10);

  await db.update(usersTable).set({
    xp: newXp,
    level: newLevel,
    streak: newStreak,
    maxStreak: newMaxStreak,
    gems: user.gems + gemsGained,
    totalAnswered: user.totalAnswered + 1,
    totalCorrect: user.totalCorrect + (correct ? 1 : 0),
    weeklyXp: user.weeklyXp + xpGained,
    lastActiveAt: new Date(),
  }).where(eq(usersTable.id, userId));

  // Update daily stats
  const [existingDaily] = await db.select().from(userDailyStatsTable)
    .where(and(eq(userDailyStatsTable.userId, userId), eq(userDailyStatsTable.date, today)));
  if (existingDaily) {
    await db.update(userDailyStatsTable).set({
      xpGained: existingDaily.xpGained + xpGained,
      questionsAnswered: existingDaily.questionsAnswered + 1,
      questionsCorrect: existingDaily.questionsCorrect + (correct ? 1 : 0),
    }).where(eq(userDailyStatsTable.id, existingDaily.id));
  } else {
    await db.insert(userDailyStatsTable).values({
      userId,
      date: today,
      xpGained,
      questionsAnswered: 1,
      questionsCorrect: correct ? 1 : 0,
    });
  }

  // Update category stats
  const [existingCat] = await db.select().from(userCategoryStatsTable)
    .where(and(
      eq(userCategoryStatsTable.userId, userId),
      eq(userCategoryStatsTable.category, question.category)
    ));
  if (existingCat) {
    await db.update(userCategoryStatsTable).set({
      totalAnswered: existingCat.totalAnswered + 1,
      totalCorrect: existingCat.totalCorrect + (correct ? 1 : 0),
    }).where(eq(userCategoryStatsTable.id, existingCat.id));
  } else {
    await db.insert(userCategoryStatsTable).values({
      userId,
      category: question.category,
      totalAnswered: 1,
      totalCorrect: correct ? 1 : 0,
    });
  }

  // Check achievements
  const newAchievements: any[] = [];
  const updatedUser = {
    ...user,
    xp: newXp,
    level: newLevel,
    streak: newStreak,
    totalAnswered: user.totalAnswered + 1,
    totalCorrect: user.totalCorrect + (correct ? 1 : 0),
  };
  const allAchievements = await db.select().from(achievementsTable);
  const earnedIds = (await db.select().from(userAchievementsTable)
    .where(eq(userAchievementsTable.userId, userId))).map(a => a.achievementId);

  for (const ach of allAchievements) {
    if (earnedIds.includes(ach.id)) continue;
    let earned = false;
    if (ach.requirementType === "streak" && updatedUser.streak >= ach.requirementValue) earned = true;
    if (ach.requirementType === "total_correct" && updatedUser.totalCorrect >= ach.requirementValue) earned = true;
    if (ach.requirementType === "total_answered" && updatedUser.totalAnswered >= ach.requirementValue) earned = true;
    if (ach.requirementType === "level" && updatedUser.level >= ach.requirementValue) earned = true;
    if (ach.requirementType === "xp" && updatedUser.xp >= ach.requirementValue) earned = true;

    if (earned) {
      await db.insert(userAchievementsTable).values({ userId, achievementId: ach.id });
      await db.update(usersTable).set({ xp: newXp + ach.xpReward }).where(eq(usersTable.id, userId));
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

  res.json(AnswerQuestionResponse.parse({
    correct,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    xpGained,
    streakBonus,
    newXp,
    newLevel,
    newStreak,
    gemsGained,
    newAchievements,
  }));
});

export default router;
