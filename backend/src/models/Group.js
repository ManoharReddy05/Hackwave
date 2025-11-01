// src/models/Group.js
import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  slug: { type: String, index: true }, // optional friendly id
  description: String,
  isPrivate: { type: Boolean, default: false },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  // group-level settings for quizzes, chat, features
  settings: {
    quizRequiresAdmin: { type: Boolean, default: false },
    defaultTimeLimit: { type: Number, default: 600 }, // seconds
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
}, { timestamps: true });

export default mongoose.model("Group", groupSchema);
