import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, flashcardDecksTable, flashcardsTable, userFlashcardProgressTable } from "@workspace/db";
import {
  GetDeckCardsParams,
  GetDeckCardsResponse,
  ReviewCardParams,
  ReviewCardBody,
  ReviewCardResponse,
  ListDecksResponse,
} from "@workspace/api-zod";
import { getUserId } from "./users";

const router: IRouter = Router();

router.get("/flashcards/decks", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "No user ID provided" });
    return;
  }
  const decks = await db.select().from(flashcardDecksTable);
  const cards = await db.select().from(flashcardsTable);
  const progress = await db.select().from(userFlashcardProgressTable)
    .where(eq(userFlashcardProgressTable.userId, userId));

  const result = decks.map(deck => {
    const deckCards = cards.filter(c => c.deckId === deck.id);
    const masteredIds = progress
      .filter(p => p.repetitions >= 3 && deckCards.some(c => c.id === p.cardId))
      .map(p => p.cardId);

    return {
      id: deck.id,
      title: deck.title,
      description: deck.description,
      category: deck.category,
      cardCount: deckCards.length,
      masteredCount: masteredIds.length,
      color: deck.color,
    };
  });

  res.json(ListDecksResponse.parse(result));
});

router.get("/flashcards/decks/:id/cards", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetDeckCardsParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "No user ID provided" });
    return;
  }
  const cards = await db.select().from(flashcardsTable).where(eq(flashcardsTable.deckId, params.data.id));

  const result = await Promise.all(cards.map(async card => {
    const [prog] = await db.select().from(userFlashcardProgressTable)
      .where(and(
        eq(userFlashcardProgressTable.userId, userId),
        eq(userFlashcardProgressTable.cardId, card.id)
      ));

    if (prog) {
      return {
        id: card.id,
        deckId: card.deckId,
        front: card.front,
        back: card.back,
        example: card.example ?? null,
        nextReviewAt: prog.nextReviewAt.toISOString(),
        easeFactor: prog.easeFactor,
        interval: prog.interval,
        repetitions: prog.repetitions,
      };
    }

    return {
      id: card.id,
      deckId: card.deckId,
      front: card.front,
      back: card.back,
      example: card.example ?? null,
      nextReviewAt: new Date().toISOString(),
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
    };
  }));

  result.sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime());

  res.json(GetDeckCardsResponse.parse(result));
});

router.post("/flashcards/cards/:id/review", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ReviewCardParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ReviewCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userId, quality } = parsed.data;
  const cardId = params.data.id;

  const [card] = await db.select().from(flashcardsTable).where(eq(flashcardsTable.id, cardId));
  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  const [existing] = await db.select().from(userFlashcardProgressTable)
    .where(and(
      eq(userFlashcardProgressTable.userId, userId),
      eq(userFlashcardProgressTable.cardId, cardId)
    ));

  // SM-2 algorithm
  let easeFactor = existing?.easeFactor ?? 2.5;
  let interval = existing?.interval ?? 1;
  let repetitions = existing?.repetitions ?? 0;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  } else {
    repetitions = 0;
    interval = 1;
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  if (existing) {
    await db.update(userFlashcardProgressTable).set({
      easeFactor,
      interval,
      repetitions,
      nextReviewAt,
    }).where(eq(userFlashcardProgressTable.id, existing.id));
  } else {
    await db.insert(userFlashcardProgressTable).values({
      userId,
      cardId,
      easeFactor,
      interval,
      repetitions,
      nextReviewAt,
    });
  }

  res.json(ReviewCardResponse.parse({
    id: card.id,
    deckId: card.deckId,
    front: card.front,
    back: card.back,
    example: card.example ?? null,
    nextReviewAt: nextReviewAt.toISOString(),
    easeFactor,
    interval,
    repetitions,
  }));
});

export default router;
