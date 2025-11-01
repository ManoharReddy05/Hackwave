import express from "express";
import { addPost } from "../controllers/postController.js";
import { getPostsByThread } from "../controllers/postController.js";
import { deletePost } from "../controllers/postController.js";

const router = express.Router();

router.post("/", addPost);
router.get("/:threadId", getPostsByThread);
router.delete("/:id", deletePost);
export default router;
