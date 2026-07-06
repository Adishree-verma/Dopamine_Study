import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, usersTable, sessionsTable, userFlashcardProgressTable, userDailyStatsTable, userCategoryStatsTable } from "@workspace/db";
import {
  GetMyStatsResponse,
  GetProgressHistoryResponse,
  GetCategoryStatsResponse,
} from "@workspace/api-zod";
import { getUserId } from "./users";

const router: IRouter = Router();

router.get("/stats/me", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "No user ID provided" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const allUsers = await db.select().from(usersTable).orderBy(desc(usersTable.weeklyXp));
  const rank = allUsers.findIndex(u => u.id === userId) + 1;

  const sessions = await db.select().from(sessionsTable)
    .where(and(eq(sessionsTable.userId, userId), eq(sessionsTable.status, "completed")));

  const masteredCards = await db.select().from(userFlashcardProgressTable)
    .where(and(eq(userFlashcardProgressTable.userId, userId)));
  const flashcardsMastered = masteredCards.filter(p => p.repetitions >= 3).length;

  const accuracyPercent = user.totalAnswered > 0
    ? Math.round((user.totalCorrect / user.totalAnswered) * 100)
    : 0;

  res.json(GetMyStatsResponse.parse({
    totalXp: user.xp,
    totalSessions: sessions.length,
    totalCorrect: user.totalCorrect,
    totalAnswered: user.totalAnswered,
    accuracyPercent,
    currentStreak: user.streak,
    maxStreak: user.maxStreak,
    level: user.level,
    rank,
    gemsEarned: user.gems,
    flashcardsMastered,
  }));
});

router.get("/stats/progress", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "No user ID provided" });
    return;
  }

  const days: { date: string; xpGained: number; questionsAnswered: number; accuracy: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

    const [stats] = await db.select().from(userDailyStatsTable)
      .where(and(eq(userDailyStatsTable.userId, userId), eq(userDailyStatsTable.date, dateStr)));

    days.push({
      date: dateStr,
      xpGained: stats?.xpGained ?? 0,
      questionsAnswered: stats?.questionsAnswered ?? 0,
      accuracy: stats && stats.questionsAnswered > 0
        ? Math.round((stats.questionsCorrect / stats.questionsAnswered) * 100)
        : 0,
    });
  }

  res.json(GetProgressHistoryResponse.parse(days));
});

router.get("/stats/categories", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "No user ID provided" });
    return;
  }

  const categories = ["math", "reading", "writing", "vocabulary", "grammar"];

  const catRows = await db.select().from(userCategoryStatsTable)
    .where(eq(userCategoryStatsTable.userId, userId));

  const result = categories.map(cat => {
    const row = catRows.find(r => r.category === cat);
    const totalAnswered = row?.totalAnswered ?? 0;
    const totalCorrect = row?.totalCorrect ?? 0;
    const accuracyPercent = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    return {
      category: cat,
      totalAnswered,
      totalCorrect,
      accuracyPercent,
      avgXpPerQuestion: totalAnswered > 0 ? Math.round((totalCorrect * 15) / totalAnswered) : 0,
    };
  });

  res.json(GetCategoryStatsResponse.parse(result));
});

export default router;
