// src/routes/groupRoutes.js
import express from "express";
import {
  createGroup, getGroups, getGroup, joinGroup, leaveGroup
} from "../controllers/groupController.js";
import { getGroupDashboard } from "../controllers/dashboardController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getGroups);
router.get("/:id", authMiddleware, getGroup);
router.get("/:groupId/dashboard", authMiddleware, getGroupDashboard);
router.post("/", authMiddleware, createGroup);
router.post("/:id/join", authMiddleware, joinGroup);
router.post("/:id/leave", authMiddleware, leaveGroup);

export default router;
