import express from "express";
import { getThreads, createThread, getThreadWithPosts, deleteThreadWithPosts } from "../controllers/threadController.js";

const router = express.Router();

router.get("/", getThreads);
router.post("/", createThread);
router.get("/:id", getThreadWithPosts);
router.delete("/:id", deleteThreadWithPosts);
export default router;
