// src/models/Result.js
import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  answers: [
    {
      question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
      selectedOption: mongoose.Schema.Types.Mixed, // Index for multiple choice or text for short answer
      isCorrect: { type: Boolean, default: false },
      pointsEarned: { type: Number, default: 0 }
    }
  ],
  totalScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  percentageScore: { type: Number, default: 0 },
  timeTaken: { type: Number }, // Time taken in seconds
  attemptNumber: { type: Number, default: 1 },
  completedAt: { type: Date, default: Date.now },
  isPassed: { type: Boolean, default: false }, // Based on passing threshold
}, { timestamps: true });

// Index for faster queries
resultSchema.index({ quiz: 1, user: 1 });
resultSchema.index({ group: 1, totalScore: -1 });

export default mongoose.model("Result", resultSchema);
