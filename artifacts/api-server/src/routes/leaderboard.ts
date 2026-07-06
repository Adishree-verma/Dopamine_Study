import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { GetLeaderboardQueryParams, GetLeaderboardResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res): Promise<void> => {
  const parsed = GetLeaderboardQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const limit = parsed.data.limit ?? 20;

  const users = await db.select().from(usersTable).orderBy(desc(usersTable.weeklyXp)).limit(limit);

  const result = users.map((u, idx) => ({
    rank: idx + 1,
    userId: u.id,
    username: u.username,
    avatar: u.avatar ?? null,
    weeklyXp: u.weeklyXp,
    level: u.level,
    streak: u.streak,
  }));

  res.json(GetLeaderboardResponse.parse(result));
});

export default router;
