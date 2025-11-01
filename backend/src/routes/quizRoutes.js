// src/routes/quizRoutes.js
import express from "express";
import { createQuiz, getQuizzesForGroup } from "../controllers/quizController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createQuiz); // expects groupId in body
router.get("/group/:groupId", authMiddleware, getQuizzesForGroup);

export default router;
