// src/models/User.js
import mongoose from "mongoose";

const featureFlagsSchema = new mongoose.Schema({
  teachbackEnabled: { type: Boolean, default: false },
  aiFeedbackEnabled: { type: Boolean, default: false },
}, { _id: false });

const preferencesSchema = new mongoose.Schema({
  timezone: String,
  locale: String,
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },

  // Profile / onboarding
  displayName: String,
  avatarUrl: String,
  bio: String,

  // Roles & permissions (flexible)
  roles: [{ type: String }], // e.g. ["admin","teacher","student"]

  // Groups the user is a member of
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],

  // Quizzes user created/attempted
  createdQuizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }],

  // Aggregate learning data
  totalScore: { type: Number, default: 0 },
  weakAreas: [{ type: String }],

  // Preferences & feature flags to allow safe future expansion
  preferences: { type: preferencesSchema, default: {} },
  featureFlags: { type: featureFlagsSchema, default: {} },

  // For future: goals, teachback state, canvas preferences (store as JSON)
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },

}, { timestamps: true });

export default mongoose.model("User", userSchema);
