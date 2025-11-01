// src/models/Quiz.js
import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true }, // NEW
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  difficulty: { type: String, enum: ["easy", "medium", "hard"] },
  timeLimit: Number, // seconds
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isAIGenerated: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Quiz", quizSchema);
