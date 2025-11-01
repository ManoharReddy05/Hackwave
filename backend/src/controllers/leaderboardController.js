// src/controllers/leaderboardController.js
import Leaderboard from "../models/Leaderboard.js";
import Quiz from "../models/Quiz.js";
import Group from "../models/Group.js";
import Result from "../models/Result.js";

// Get leaderboard for a specific quiz
export const getLeaderboardForQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { limit = 50 } = req.query;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Verify user has access to the group
    const group = await Group.findById(quiz.group);
    if (group.isPrivate && !group.members.some(m => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Must be a member to view leaderboard" });
    }

    let leaderboard = await Leaderboard.findOne({ quiz: quizId })
      .populate("entries.user", "username displayName")
      .populate("quiz", "title description");

    if (!leaderboard) {
      return res.json({ 
        quiz: quizId, 
        entries: [],
        message: "No leaderboard data available yet" 
      });
    }

    // Limit the number of entries returned
    const limitedEntries = leaderboard.entries.slice(0, parseInt(limit));

    res.json({
      quiz: leaderboard.quiz,
      group: leaderboard.group,
      entries: limitedEntries.map((entry, index) => ({
        rank: index + 1,
        user: entry.user,
        score: entry.score,
        attempts: entry.attempts,
        lastAttempt: entry.lastAttempt,
      })),
      totalEntries: leaderboard.entries.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get leaderboard for a specific group (aggregated across all quizzes)
export const getLeaderboardForGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { limit = 50 } = req.query;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Verify user has access
    if (group.isPrivate && !group.members.some(m => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Must be a member to view leaderboard" });
    }

    // Aggregate scores across all quizzes in the group
    const results = await Result.aggregate([
      { $match: { group: group._id } },
      {
        $group: {
          _id: "$user",
          totalScore: { $sum: "$totalScore" },
          totalQuizzes: { $sum: 1 },
          averageScore: { $avg: "$percentageScore" },
          totalPassed: { 
            $sum: { $cond: ["$isPassed", 1, 0] } 
          },
        },
      },
      { $sort: { totalScore: -1 } },
      { $limit: parseInt(limit) },
    ]);

    // Populate user details
    const populatedResults = await Promise.all(
      results.map(async (result, index) => {
        const user = await require("../models/User.js").default.findById(result._id).select("username displayName");
        return {
          rank: index + 1,
          user,
          totalScore: result.totalScore,
          totalQuizzes: result.totalQuizzes,
          averageScore: Math.round(result.averageScore * 100) / 100,
          totalPassed: result.totalPassed,
        };
      })
    );

    res.json({
      group: groupId,
      entries: populatedResults,
      totalEntries: populatedResults.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user's rank in a quiz leaderboard
export const getUserRankForQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const leaderboard = await Leaderboard.findOne({ quiz: quizId });
    
    if (!leaderboard) {
      return res.json({ 
        message: "No leaderboard data available",
        rank: null,
        score: 0,
        totalParticipants: 0,
      });
    }

    const userEntry = leaderboard.entries.find(
      entry => entry.user.toString() === req.user._id.toString()
    );

    if (!userEntry) {
      return res.json({
        message: "You haven't taken this quiz yet",
        rank: null,
        score: 0,
        totalParticipants: leaderboard.entries.length,
      });
    }

    const rank = leaderboard.entries.findIndex(
      entry => entry.user.toString() === req.user._id.toString()
    ) + 1;

    res.json({
      rank,
      score: userEntry.score,
      attempts: userEntry.attempts,
      lastAttempt: userEntry.lastAttempt,
      totalParticipants: leaderboard.entries.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user's rank in a group (across all quizzes)
export const getUserRankForGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Aggregate user's total score
    const userStats = await Result.aggregate([
      { 
        $match: { 
          group: group._id,
          user: req.user._id,
        } 
      },
      {
        $group: {
          _id: "$user",
          totalScore: { $sum: "$totalScore" },
          totalQuizzes: { $sum: 1 },
          averageScore: { $avg: "$percentageScore" },
        },
      },
    ]);

    if (userStats.length === 0) {
      return res.json({
        message: "You haven't taken any quizzes in this group",
        rank: null,
        totalScore: 0,
        totalQuizzes: 0,
      });
    }

    // Get all users' scores to determine rank
    const allScores = await Result.aggregate([
      { $match: { group: group._id } },
      {
        $group: {
          _id: "$user",
          totalScore: { $sum: "$totalScore" },
        },
      },
      { $sort: { totalScore: -1 } },
    ]);

    const rank = allScores.findIndex(
      score => score._id.toString() === req.user._id.toString()
    ) + 1;

    res.json({
      rank,
      totalScore: userStats[0].totalScore,
      totalQuizzes: userStats[0].totalQuizzes,
      averageScore: Math.round(userStats[0].averageScore * 100) / 100,
      totalParticipants: allScores.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reset leaderboard for a quiz (admin only)
export const resetQuizLeaderboard = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Check if user is admin
    const group = await Group.findById(quiz.group);
    const isAdmin = group.admins.some(adminId => adminId.toString() === req.user._id.toString());

    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can reset leaderboards" });
    }

    const leaderboard = await Leaderboard.findOne({ quiz: quizId });
    if (leaderboard) {
      leaderboard.entries = [];
      await leaderboard.save();
    }

    res.json({ message: "Leaderboard reset successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get top performers across all groups (global leaderboard)
export const getGlobalLeaderboard = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const topPerformers = await Result.aggregate([
      {
        $group: {
          _id: "$user",
          totalScore: { $sum: "$totalScore" },
          totalQuizzes: { $sum: 1 },
          averageScore: { $avg: "$percentageScore" },
          totalPassed: { 
            $sum: { $cond: ["$isPassed", 1, 0] } 
          },
        },
      },
      { $sort: { totalScore: -1 } },
      { $limit: parseInt(limit) },
    ]);

    // Populate user details
    const User = (await import("../models/User.js")).default;
    const populatedResults = await Promise.all(
      topPerformers.map(async (result, index) => {
        const user = await User.findById(result._id).select("username displayName");
        return {
          rank: index + 1,
          user,
          totalScore: result.totalScore,
          totalQuizzes: result.totalQuizzes,
          averageScore: Math.round(result.averageScore * 100) / 100,
          totalPassed: result.totalPassed,
        };
      })
    );

    res.json({
      entries: populatedResults,
      totalEntries: populatedResults.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
