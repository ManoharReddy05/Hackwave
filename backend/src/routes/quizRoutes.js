// src/routes/quizRoutes.js
import express from "express";
import { 
  createQuiz, 
  getQuizzesForGroup, 
    getAIQuizzes,
  getQuizById, 
  checkQuizAvailability,
  updateQuiz,
  toggleQuizActive,
  deleteQuiz,
  getQuizStatistics
} from "../controllers/quizController.js";
import { authMiddleware } from "../middleware/auth.js";


const router = express.Router();

// Create quiz
router.post("/", authMiddleware, createQuiz);

// Get all quizzes for a group
router.get("/group/:groupId", authMiddleware, getQuizzesForGroup);

// Get AI-generated quizzes
router.get("/ai-generated", authMiddleware, getAIQuizzes);

// Get specific quiz by ID
router.get("/:quizId", authMiddleware, getQuizById);

// Check quiz availability
router.get("/:quizId/availability", authMiddleware, checkQuizAvailability);

// Get quiz statistics
router.get("/:quizId/statistics", authMiddleware, getQuizStatistics);

// Update quiz
router.patch("/:quizId", authMiddleware, updateQuiz);

// Toggle quiz active status
router.patch("/:quizId/toggle-active", authMiddleware, toggleQuizActive);

// Delete quiz
router.delete("/:quizId", authMiddleware, deleteQuiz);

export default router;
