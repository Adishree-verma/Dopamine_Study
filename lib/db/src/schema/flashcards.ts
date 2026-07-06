import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const flashcardDecksTable = pgTable("flashcard_decks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull(),
  color: text("color").notNull().default("#6366f1"),
});

export const flashcardsTable = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  deckId: integer("deck_id").notNull().references(() => flashcardDecksTable.id),
  front: text("front").notNull(),
  back: text("back").notNull(),
  example: text("example"),
});

export const userFlashcardProgressTable = pgTable("user_flashcard_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  cardId: integer("card_id").notNull().references(() => flashcardsTable.id),
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(1),
  repetitions: integer("repetitions").notNull().default(0),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFlashcardDeckSchema = createInsertSchema(flashcardDecksTable).omit({ id: true });
export const insertFlashcardSchema = createInsertSchema(flashcardsTable).omit({ id: true });
export const insertUserFlashcardProgressSchema = createInsertSchema(userFlashcardProgressTable).omit({ id: true });

export type FlashcardDeck = typeof flashcardDecksTable.$inferSelect;
export type Flashcard = typeof flashcardsTable.$inferSelect;
export type UserFlashcardProgress = typeof userFlashcardProgressTable.$inferSelect;
