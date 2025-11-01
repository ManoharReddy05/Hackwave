// src/controllers/resultController.js
import Result from "../models/Result.js";
import Quiz from "../models/Quiz.js";
import Question from "../models/Question.js";
import Group from "../models/Group.js";
import Leaderboard from "../models/Leaderboard.js";

// Submit quiz answers and calculate result
export const submitQuizResult = async (req, res) => {
  try {
    const { quizId, answers, timeTaken } = req.body;

    if (!quizId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: "quizId and answers array are required" });
    }

    // Get quiz with questions
    const quiz = await Quiz.findById(quizId).populate("questions");
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Check if quiz is active and published
    if (!quiz.isActive) {
      return res.status(403).json({ message: "This quiz is no longer active" });
    }

    if (!quiz.isPublished) {
      return res.status(403).json({ message: "This quiz is not yet published" });
    }

    // Verify user is member of the group
    const group = await Group.findById(quiz.group);
    if (!group.members.some(m => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Must be a group member to take quiz" });
    }

    // Check schedule if quiz is scheduled
    if (quiz.isScheduled) {
      const now = new Date();
      const start = new Date(quiz.scheduledStartTime);
      const end = new Date(quiz.scheduledEndTime);

      if (now < start) {
        return res.status(403).json({ 
          message: "Quiz has not started yet",
          startTime: quiz.scheduledStartTime
        });
      }

      if (now > end) {
        return res.status(403).json({ 
          message: "Quiz submission period has ended",
          endTime: quiz.scheduledEndTime
        });
      }
    }

    // Count previous attempts
    const previousResults = await Result.countDocuments({ quiz: quizId, user: req.user._id });
    const attemptNumber = previousResults + 1;

    // Check max attempts limit
    if (quiz.maxAttempts && previousResults >= quiz.maxAttempts) {
      return res.status(403).json({ 
        message: `Maximum attempts (${quiz.maxAttempts}) reached`,
        attemptsUsed: previousResults,
        maxAttempts: quiz.maxAttempts
      });
    }

    // Evaluate answers
    let totalScore = 0;
    let maxScore = 0;
    const evaluatedAnswers = [];

    for (const answer of answers) {
      const question = await Question.findById(answer.questionId);
      if (!question) continue;

      maxScore += question.points;

      let isCorrect = false;
      let pointsEarned = 0;

      // Check answer based on question type
      if (question.questionType === "multiple-choice") {
        const correctOption = question.options.find(opt => opt.isCorrect);
        isCorrect = correctOption && answer.selectedOption === question.options.indexOf(correctOption);
      } else if (question.questionType === "true-false") {
        isCorrect = answer.selectedOption?.toString().toLowerCase() === question.correctAnswer?.toLowerCase();
      } else if (question.questionType === "short-answer") {
        // Case-insensitive comparison for short answers
        isCorrect = answer.selectedOption?.toString().toLowerCase().trim() === 
                    question.correctAnswer?.toLowerCase().trim();
      }

      if (isCorrect) {
        pointsEarned = question.points;
        totalScore += pointsEarned;
      }

      evaluatedAnswers.push({
        question: question._id,
        selectedOption: answer.selectedOption,
        isCorrect,
        pointsEarned,
      });
    }

    const percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const isPassed = percentageScore >= (quiz.passingScore || 60);

    // Create result
    const result = new Result({
      quiz: quizId,
      user: req.user._id,
      group: quiz.group,
      answers: evaluatedAnswers,
      totalScore,
      maxScore,
      percentageScore,
      timeTaken,
      attemptNumber,
      isPassed,
    });

    await result.save();

    // Update quiz statistics
    quiz.totalAttempts = (quiz.totalAttempts || 0) + 1;
    const allResults = await Result.find({ quiz: quizId });
    quiz.averageScore = allResults.reduce((sum, r) => sum + r.percentageScore, 0) / allResults.length;
    await quiz.save();

    // Update leaderboard
    await updateLeaderboard(quiz.group, quizId, req.user._id, totalScore, attemptNumber);

    // Populate the result before sending
    const populatedResult = await Result.findById(result._id)
      .populate("quiz", "title description")
      .populate("user", "username displayName")
      .populate("answers.question");

    res.status(201).json(populatedResult);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper function to update leaderboard
async function updateLeaderboard(groupId, quizId, userId, score, attempts) {
  let leaderboard = await Leaderboard.findOne({ quiz: quizId, group: groupId });

  if (!leaderboard) {
    leaderboard = new Leaderboard({
      quiz: quizId,
      group: groupId,
      entries: [],
    });
  }

  const existingEntry = leaderboard.entries.find(
    entry => entry.user.toString() === userId.toString()
  );

  if (existingEntry) {
    // Update if new score is higher
    if (score > existingEntry.score) {
      existingEntry.score = score;
    }
    existingEntry.attempts = attempts;
    existingEntry.lastAttempt = new Date();
  } else {
    leaderboard.entries.push({
      user: userId,
      score,
      attempts,
      lastAttempt: new Date(),
    });
  }

  // Sort entries by score (descending)
  leaderboard.entries.sort((a, b) => b.score - a.score);

  await leaderboard.save();
}

// Get all results for a quiz
export const getResultsForQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Check if user is admin or viewing their own results
    const group = await Group.findById(quiz.group);
    const isAdmin = group.admins.some(adminId => adminId.toString() === req.user._id.toString());

    let query = { quiz: quizId };
    if (!isAdmin) {
      // Non-admins can only see their own results
      query.user = req.user._id;
    }

    const results = await Result.find(query)
      .populate("user", "username displayName")
      .populate("quiz", "title description")
      .sort({ completedAt: -1 });

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user's results for a specific quiz
export const getUserResultsForQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const results = await Result.find({ quiz: quizId, user: req.user._id })
      .populate("quiz", "title description difficulty")
      .populate("answers.question")
      .sort({ attemptNumber: -1 });

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a specific result by ID
export const getResultById = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findById(resultId)
      .populate("quiz", "title description")
      .populate("user", "username displayName")
      .populate("answers.question");

    if (!result) return res.status(404).json({ message: "Result not found" });

    // Check permissions (user can see their own result, or admin can see all)
    const group = await Group.findById(result.group);
    const isAdmin = group.admins.some(adminId => adminId.toString() === req.user._id.toString());
    const isOwner = result.user._id.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all results for a user across all quizzes
export const getUserResults = async (req, res) => {
  try {
    const results = await Result.find({ user: req.user._id })
      .populate("quiz", "title description difficulty")
      .populate("group", "name")
      .sort({ completedAt: -1 });

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get results statistics for a quiz
export const getQuizStatistics = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Check if user is admin
    const group = await Group.findById(quiz.group);
    const isAdmin = group.admins.some(adminId => adminId.toString() === req.user._id.toString());

    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can view quiz statistics" });
    }

    const results = await Result.find({ quiz: quizId });

    const stats = {
      totalAttempts: results.length,
      uniqueUsers: [...new Set(results.map(r => r.user.toString()))].length,
      averageScore: results.reduce((sum, r) => sum + r.percentageScore, 0) / results.length || 0,
      highestScore: Math.max(...results.map(r => r.percentageScore), 0),
      lowestScore: Math.min(...results.map(r => r.percentageScore), 100),
      passRate: (results.filter(r => r.isPassed).length / results.length) * 100 || 0,
      averageTimeTaken: results.reduce((sum, r) => sum + (r.timeTaken || 0), 0) / results.length || 0,
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a result (admin only)
export const deleteResult = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findById(resultId);
    if (!result) return res.status(404).json({ message: "Result not found" });

    // Check if user is admin
    const group = await Group.findById(result.group);
    const isAdmin = group.admins.some(adminId => adminId.toString() === req.user._id.toString());

    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can delete results" });
    }

    await Result.findByIdAndDelete(resultId);
    res.json({ message: "Result deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
