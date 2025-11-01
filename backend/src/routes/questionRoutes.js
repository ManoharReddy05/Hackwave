// src/routes/questionRoutes.js
import express from "express";
import {
  createQuestion,
  getQuestionsForQuiz,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  bulkCreateQuestions,
} from "../controllers/questionController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Create a single question
router.post("/", authMiddleware, createQuestion);

// Bulk create questions
router.post("/bulk", authMiddleware, bulkCreateQuestions);

// Get all questions for a quiz
router.get("/quiz/:quizId", authMiddleware, getQuestionsForQuiz);

// Get a specific question by ID
router.get("/:questionId", authMiddleware, getQuestionById);

// Update a question
router.put("/:questionId", authMiddleware, updateQuestion);

// Delete a question
router.delete("/:questionId", authMiddleware, deleteQuestion);

export default router;
