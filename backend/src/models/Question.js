// src/models/Question.js
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  questionText: { type: String, required: true },
  questionType: { 
    type: String, 
    enum: ["multiple-choice", "true-false", "short-answer"], 
    default: "multiple-choice" 
  },
  options: [
    {
      text: { type: String, required: true },
      isCorrect: { type: Boolean, default: false }
    }
  ],
  correctAnswer: String, // For short-answer or true-false types
  points: { type: Number, default: 1 },
  explanation: String, // Optional explanation for the correct answer
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  tags: [String], // For categorization
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isAIGenerated: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Question", questionSchema);
