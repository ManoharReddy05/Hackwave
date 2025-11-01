// src/routes/leaderboardRoutes.js
import express from "express";
import {
  getLeaderboardForQuiz,
  getLeaderboardForGroup,
  getUserRankForQuiz,
  getUserRankForGroup,
  resetQuizLeaderboard,
  getGlobalLeaderboard,
} from "../controllers/leaderboardController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Get global leaderboard (top performers across all groups)
router.get("/global", authMiddleware, getGlobalLeaderboard);

// Get leaderboard for a specific quiz
router.get("/quiz/:quizId", authMiddleware, getLeaderboardForQuiz);

// Get leaderboard for a group (aggregated across all quizzes)
router.get("/group/:groupId", authMiddleware, getLeaderboardForGroup);

// Get user's rank in a specific quiz
router.get("/quiz/:quizId/my-rank", authMiddleware, getUserRankForQuiz);

// Get user's rank in a group
router.get("/group/:groupId/my-rank", authMiddleware, getUserRankForGroup);

// Reset leaderboard for a quiz (admin only)
router.delete("/quiz/:quizId/reset", authMiddleware, resetQuizLeaderboard);

export default router;
