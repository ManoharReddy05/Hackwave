// src/models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
  // reactions, attachments etc. can be stored in meta
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);
