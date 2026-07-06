import { Router, type IRouter, type Request } from "express";
import { eq, desc } from "drizzle-orm";
import { db, usersTable, sessionsTable, userFlashcardProgressTable } from "@workspace/db";
import {
  GetMeResponse,
  UpdateMeBody,
  UpdateMeResponse,
  InitUserBody,
  InitUserResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

export function getUserId(req: Request): number | null {
  const header = req.headers["x-user-id"];
  const raw = Array.isArray(header) ? header[0] : header;
  if (!raw) return null;
  const id = parseInt(raw, 10);
  return isNaN(id) ? null : id;
}

router.get("/users/me", async (req, res): Promise<void> => {
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
  res.json(GetMeResponse.parse({
    ...user,
    lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  }));
});

router.patch("/users/me", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "No user ID provided" });
    return;
  }
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [user] = await db.update(usersTable).set(parsed.data).where(eq(usersTable.id, userId)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(UpdateMeResponse.parse({
    ...user,
    lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  }));
});

router.post("/users/init", async (req, res): Promise<void> => {
  const parsed = InitUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(usersTable)
    .where(eq(usersTable.username, parsed.data.username));

  if (existing) {
    res.json(InitUserResponse.parse({
      ...existing,
      lastActiveAt: existing.lastActiveAt?.toISOString() ?? null,
      createdAt: existing.createdAt.toISOString(),
    }));
    return;
  }

  const [user] = await db.insert(usersTable).values({
    username: parsed.data.username,
    avatar: parsed.data.avatar ?? null,
    xp: 0,
    level: 1,
    streak: 0,
    maxStreak: 0,
    gems: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    weeklyXp: 0,
  }).returning();

  res.json(InitUserResponse.parse({
    ...user,
    lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  }));
});

export default router;
