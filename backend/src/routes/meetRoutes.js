import express from "express";
import {
  googleAuth,
  googleAuthCallback,
  createMeet,
} from "../controllers/meetController.js";

const router = express.Router();

// Google OAuth setup
router.get("/auth/google", googleAuth);
router.get("/auth/google/callback", googleAuthCallback);

// Create Google Meet event
router.post("/create-meet", createMeet);

export default router;
