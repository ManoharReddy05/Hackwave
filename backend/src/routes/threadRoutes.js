import express from "express";
import { getThreads, createThread, getThreadWithPosts, deleteThreadWithPosts } from "../controllers/threadController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getThreads);
router.post("/", authMiddleware, createThread);
router.get("/:id", authMiddleware, getThreadWithPosts);
router.delete("/:id", authMiddleware, deleteThreadWithPosts);
export default router;
