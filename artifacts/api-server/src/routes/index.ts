import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import questionsRouter from "./questions";
import sessionsRouter from "./sessions";
import flashcardsRouter from "./flashcards";
import achievementsRouter from "./achievements";
import dailyRouter from "./daily";
import leaderboardRouter from "./leaderboard";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(questionsRouter);
router.use(sessionsRouter);
router.use(flashcardsRouter);
router.use(achievementsRouter);
router.use(dailyRouter);
router.use(leaderboardRouter);
router.use(statsRouter);

export default router;
