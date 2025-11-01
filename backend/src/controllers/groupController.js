// src/controllers/groupController.js
import Group from "../models/Group.js";
import User from "../models/User.js";

export const createGroup = async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;
    const group = new Group({ name, description, isPrivate, admins: [req.user._id], members: [req.user._id] });
    await group.save();

    // add group to user
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { groups: group._id } });

    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getGroups = async (req, res) => {
  try {
    const groups = await Group.find().populate("admins", "username displayName").lean();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate("members", "username displayName").lean();
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // If private, require invite (not implemented). For now, only admins can add to private groups.
    if (group.isPrivate && !group.admins.includes(req.user._id)) {
      return res.status(403).json({ message: "Private group - cannot join without invite" });
    }

    await Group.findByIdAndUpdate(group._id, { $addToSet: { members: req.user._id } });
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { groups: group._id } });

    res.json({ message: "Joined group" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    await Group.findByIdAndUpdate(group._id, { $pull: { members: req.user._id, admins: req.user._id } });
    await User.findByIdAndUpdate(req.user._id, { $pull: { groups: group._id } });

    res.json({ message: "Left group" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
