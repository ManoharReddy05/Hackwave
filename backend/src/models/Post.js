import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: "Thread", required: true },
  parentPostId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
  content: { type: String, required: true },
  author: { type: String, default: "Anonymous" },
  createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model("Post", postSchema);
export default Post;
