import mongoose from "mongoose";

const threadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    default: null
  },
  tags: [{ type: String }],
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Thread = mongoose.model("Thread", threadSchema);
export default Thread;
