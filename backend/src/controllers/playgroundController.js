import Playground from "../models/Playground.js";
import Group from "../models/Group.js";

// @desc    Get playground for a specific group (or create if doesn't exist)
// @route   GET /api/playground/:groupId
// @access  Private (must be group member)
export const getPlayground = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check if user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some(m => m.toString() === userId) ||
                     group.admins.some(a => a.toString() === userId);

    if (!isMember) {
      return res.status(403).json({ message: "You must be a group member to access the playground" });
    }

    // Get or create playground
    let playground = await Playground.getOrCreateForGroup(groupId);

    // Add user to active users if not already there
    const isActiveUser = playground.activeUsers.some(u => u.userId.toString() === userId);
    if (!isActiveUser) {
      playground.activeUsers.push({ userId, joinedAt: new Date() });
      await playground.save();
    }

    res.json({
      _id: playground._id,
      groupId: playground.groupId,
      canvasUrl: playground.getFullCanvasUrl(),
      boardId: playground.boardId,
      activeUsers: playground.activeUsers.length,
      settings: playground.settings,
      createdAt: playground.createdAt,
    });
  } catch (error) {
    console.error("Error getting playground:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update playground settings
// @route   PUT /api/playground/:groupId/settings
// @access  Private (must be group admin)
export const updatePlaygroundSettings = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const { settings } = req.body;

    // Check if user is an admin of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isAdmin = group.admins.some(a => a.toString() === userId);
    if (!isAdmin) {
      return res.status(403).json({ message: "Only group admins can update playground settings" });
    }

    // Get or create playground
    let playground = await Playground.getOrCreateForGroup(groupId);

    // Update settings
    playground.settings = { ...playground.settings, ...settings };
    await playground.save();

    res.json({
      message: "Playground settings updated",
      settings: playground.settings,
    });
  } catch (error) {
    console.error("Error updating playground settings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Record user leaving playground
// @route   POST /api/playground/:groupId/leave
// @access  Private
export const leavePlayground = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const playground = await Playground.findOne({ groupId });
    if (!playground) {
      return res.status(404).json({ message: "Playground not found" });
    }

    // Remove user from active users
    playground.activeUsers = playground.activeUsers.filter(
      u => u.userId.toString() !== userId
    );
    await playground.save();

    res.json({ message: "Left playground successfully" });
  } catch (error) {
    console.error("Error leaving playground:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Save a snapshot of the playground
// @route   POST /api/playground/:groupId/snapshot
// @access  Private (must be group member)
export const saveSnapshot = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const { snapshotUrl } = req.body;

    // Check if user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some(m => m.toString() === userId) ||
                     group.admins.some(a => a.toString() === userId);

    if (!isMember) {
      return res.status(403).json({ message: "You must be a group member to save snapshots" });
    }

    const playground = await Playground.findOne({ groupId });
    if (!playground) {
      return res.status(404).json({ message: "Playground not found" });
    }

    // Add snapshot
    playground.snapshots.push({
      timestamp: new Date(),
      snapshotUrl,
      createdBy: userId,
    });

    // Keep only last 10 snapshots
    if (playground.snapshots.length > 10) {
      playground.snapshots = playground.snapshots.slice(-10);
    }

    await playground.save();

    res.json({
      message: "Snapshot saved successfully",
      snapshot: playground.snapshots[playground.snapshots.length - 1],
    });
  } catch (error) {
    console.error("Error saving snapshot:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get playground snapshots
// @route   GET /api/playground/:groupId/snapshots
// @access  Private (must be group member)
export const getSnapshots = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check if user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some(m => m.toString() === userId) ||
                     group.admins.some(a => a.toString() === userId);

    if (!isMember) {
      return res.status(403).json({ message: "You must be a group member to view snapshots" });
    }

    const playground = await Playground.findOne({ groupId }).populate('snapshots.createdBy', 'username displayName');
    if (!playground) {
      return res.status(404).json({ message: "Playground not found" });
    }

    res.json({
      snapshots: playground.snapshots,
    });
  } catch (error) {
    console.error("Error getting snapshots:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
