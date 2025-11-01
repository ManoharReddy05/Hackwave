// src/routes/messageRoutes.js
import express from "express";
import { postMessage, getGroupMessages } from "../controllers/messageController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router({ mergeParams: true });

router.get("/:groupId", authMiddleware, getGroupMessages);
router.post("/:groupId", authMiddleware, postMessage);

export default router;

