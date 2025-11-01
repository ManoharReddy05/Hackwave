import express from "express";
import { addPost } from "../controllers/postController.js";
import { getPostsByThread } from "../controllers/postController.js";
import { deletePost } from "../controllers/postController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, addPost);
router.get("/:threadId", authMiddleware, getPostsByThread);
router.delete("/:id", authMiddleware, deletePost);
export default router;
