// index.js (root or src/index.js depending on your structure)

import dotenv from "dotenv";
dotenv.config(); // Load environment variables FIRST before any other imports

import express from "express";
import cors from "cors";
import connectDB from "./src/config.js/db.js";

// --- Route Imports ---
import authRoutes from "./src/routes/authRoutes.js";
import quizRoutes from "./src/routes/quizRoutes.js";
import questionRoutes from "./src/routes/questionRoutes.js";
import resultRoutes from "./src/routes/resultRoutes.js";
import leaderboardRoutes from "./src/routes/leaderboardRoutes.js";
import groupRoutes from "./src/routes/groupRoutes.js";
import messageRoutes from "./src/routes/messageRoutes.js";

// Threads + Posts (Reddit-style)
import threadRoutes from "./src/routes/threadRoutes.js";
import postRoutes from "./src/routes/postRoutes.js";

// ===== Initialize App =====
const app = express();

// ===== Middleware =====
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// ===== Connect Database =====
connectDB();

// ===== API ROUTES =====

// Auth & User Management
app.use("/api/auth", authRoutes);

// Groups, Messages, and Collaboration
app.use("/api/groups", groupRoutes);
app.use("/api/messages", messageRoutes);

// Quizzes, Questions, and Results
app.use("/api/quiz", quizRoutes);
app.use("/api/question", questionRoutes);
app.use("/api/result", resultRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// Threads and Posts (for discussions, forum-like groups)
app.use("/api/threads", threadRoutes);
app.use("/api/posts", postRoutes);

// ===== Root Route =====
app.get("/", (req, res) => {
  res.send("Unified Smart Quiz + Threads Backend is Running");
});

// ===== Server Start =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
