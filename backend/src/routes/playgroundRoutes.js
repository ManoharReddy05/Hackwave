import express from "express";
import {
  getPlayground,
  updatePlaygroundSettings,
  leavePlayground,
  saveSnapshot,
  getSnapshots,
} from "../controllers/playgroundController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Get or create playground for a group
router.get("/:groupId", authMiddleware, getPlayground);

// Update playground settings (admin only)
router.put("/:groupId/settings", authMiddleware, updatePlaygroundSettings);

// Leave playground
router.post("/:groupId/leave", authMiddleware, leavePlayground);

// Save a snapshot
router.post("/:groupId/snapshot", authMiddleware, saveSnapshot);

// Get all snapshots
router.get("/:groupId/snapshots", authMiddleware, getSnapshots);

export default router;
