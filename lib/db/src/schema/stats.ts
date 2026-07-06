import { pgTable, serial, integer, text, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userDailyStatsTable = pgTable("user_daily_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(),
  xpGained: integer("xp_gained").notNull().default(0),
  questionsAnswered: integer("questions_answered").notNull().default(0),
  questionsCorrect: integer("questions_correct").notNull().default(0),
});

export const userCategoryStatsTable = pgTable("user_category_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  category: text("category").notNull(),
  totalAnswered: integer("total_answered").notNull().default(0),
  totalCorrect: integer("total_correct").notNull().default(0),
}, (t) => [unique("uq_user_category").on(t.userId, t.category)]);

export const insertUserDailyStatsSchema = createInsertSchema(userDailyStatsTable).omit({ id: true });
export const insertUserCategoryStatsSchema = createInsertSchema(userCategoryStatsTable).omit({ id: true });
export type UserDailyStats = typeof userDailyStatsTable.$inferSelect;
export type UserCategoryStats = typeof userCategoryStatsTable.$inferSelect;
