import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, achievementsTable, userAchievementsTable } from "@workspace/db";
import {
  ListAchievementsResponse,
  GetUserAchievementsResponse,
} from "@workspace/api-zod";
import { getUserId } from "./users";

const router: IRouter = Router();

router.get("/achievements", async (req, res): Promise<void> => {
  const achievements = await db.select().from(achievementsTable);
  res.json(ListAchievementsResponse.parse(achievements.map(a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    icon: a.icon,
    xpReward: a.xpReward,
    category: a.category,
    rarity: a.rarity,
  }))));
});

router.get("/achievements/user", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "No user ID provided" });
    return;
  }
  const userAchs = await db.select().from(userAchievementsTable)
    .where(eq(userAchievementsTable.userId, userId));

  const result = await Promise.all(userAchs.map(async ua => {
    const [ach] = await db.select().from(achievementsTable).where(eq(achievementsTable.id, ua.achievementId));
    return {
      achievement: {
        id: ach.id,
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        xpReward: ach.xpReward,
        category: ach.category,
        rarity: ach.rarity,
      },
      earnedAt: ua.earnedAt.toISOString(),
    };
  }));

  res.json(GetUserAchievementsResponse.parse(result));
});

export default router;
