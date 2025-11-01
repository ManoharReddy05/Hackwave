// src/models/Leaderboard.js
import mongoose from "mongoose";

const leaderboardSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" }, // NEW
  entries: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      score: Number,
      attempts: Number,
      lastAttempt: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

export default mongoose.model("Leaderboard", leaderboardSchema);
