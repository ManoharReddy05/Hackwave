// src/routes/resultRoutes.js
import express from "express";
import {
  submitQuizResult,
  getResultsForQuiz,
  getUserResultsForQuiz,
  getResultById,
  getUserResults,
  getQuizStatistics,
  deleteResult,
} from "../controllers/resultController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Submit quiz result
router.post("/", authMiddleware, submitQuizResult);

// Get all results for a specific quiz (admin can see all, users see their own)
router.get("/quiz/:quizId", authMiddleware, getResultsForQuiz);

// Get user's own results for a specific quiz
router.get("/quiz/:quizId/my-results", authMiddleware, getUserResultsForQuiz);

// Get quiz statistics (admin only)
router.get("/quiz/:quizId/statistics", authMiddleware, getQuizStatistics);

// Get all results for the current user
router.get("/my-results", authMiddleware, getUserResults);

// Get a specific result by ID
router.get("/:resultId", authMiddleware, getResultById);

// Delete a result (admin only)
router.delete("/:resultId", authMiddleware, deleteResult);

export default router;
