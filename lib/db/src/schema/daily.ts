import { pgTable, text, serial, integer, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dailyChallengesTable = pgTable("daily_challenges", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  questionIds: jsonb("question_ids").notNull().$type<number[]>(),
  theme: text("theme").notNull().default("Mixed"),
  bonusMultiplier: real("bonus_multiplier").notNull().default(2.0),
  xpBonus: integer("xp_bonus").notNull().default(100),
});

export const userDailyChallengesTable = pgTable("user_daily_challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  challengeId: integer("challenge_id").notNull().references(() => dailyChallengesTable.id),
  score: integer("score").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDailyChallengeSchema = createInsertSchema(dailyChallengesTable).omit({ id: true });
export const insertUserDailyChallengeSchema = createInsertSchema(userDailyChallengesTable).omit({ id: true });

export type DailyChallenge = typeof dailyChallengesTable.$inferSelect;
export type UserDailyChallenge = typeof userDailyChallengesTable.$inferSelect;
