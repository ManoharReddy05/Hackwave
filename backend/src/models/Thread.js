import mongoose from "mongoose";

const threadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true }, // Added field
  author: { type: String, default: "Anonymous" },
  createdAt: { type: Date, default: Date.now },
});

const Thread = mongoose.model("Thread", threadSchema);
export default Thread;
