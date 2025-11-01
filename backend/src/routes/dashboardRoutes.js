// src/routes/dashboardRoutes.js
import express from "express";
import { getUserDashboard } from "../controllers/dashboardController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Get user dashboard data
router.get("/", authMiddleware, getUserDashboard);

export default router;
