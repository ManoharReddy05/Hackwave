// src/controllers/messageController.js
import Message from "../models/Message.js";
import Group from "../models/Group.js";

export const postMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content, parentId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Ensure user is member
    if (!group.members.find(m => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Must be a member to post" });
    }

    const msg = new Message({
      group: groupId,
      user: req.user._id,
      content,
      parentId: parentId || null,
    });
    await msg.save();
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

function buildTree(messages) {
  const map = {};
  messages.forEach(m => { map[m._id] = { ...m._doc, replies: [] }; });
  const roots = [];
  messages.forEach(m => {
    if (m.parentId) {
      if (map[m.parentId]) map[m.parentId].replies.push(map[m._id]);
    } else {
      roots.push(map[m._id]);
    }
  });
  return roots;
}

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // If private group, ensure membership
    if (group.isPrivate && !group.members.some(m => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Must be a member to view messages" });
    }

    const messages = await Message.find({ group: groupId }).sort({ createdAt: 1 }).populate("user", "username displayName");
    const nested = buildTree(messages);
    res.json(nested);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
