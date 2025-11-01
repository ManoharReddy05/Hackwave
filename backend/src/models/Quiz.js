// src/models/Quiz.js
import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  difficulty: { type: String, enum: ["easy", "medium", "hard"] },
  timeLimit: Number, // seconds
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isAIGenerated: { type: Boolean, default: false },
  
  // Schedule fields
  scheduledStartTime: { type: Date },
  scheduledEndTime: { type: Date },
  isScheduled: { type: Boolean, default: false },
  
  // Additional features
  maxAttempts: { type: Number, default: null }, // null = unlimited
  shuffleQuestions: { type: Boolean, default: false },
  shuffleOptions: { type: Boolean, default: false },
  showResults: { 
    type: String, 
    enum: ["immediately", "after_deadline", "manual", "never"], 
    default: "immediately" 
  },
  passingScore: { type: Number, default: 60 },
  
  // Status
  isPublished: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  
  // Statistics
  totalAttempts: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
}, { timestamps: true });

// Indexes for better query performance
quizSchema.index({ group: 1, isPublished: 1, isActive: 1 });
quizSchema.index({ scheduledStartTime: 1, scheduledEndTime: 1 });
quizSchema.index({ createdBy: 1 });

export default mongoose.model("Quiz", quizSchema);
