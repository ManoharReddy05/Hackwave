// src/controllers/quizController.js
import Quiz from "../models/Quiz.js";
import Group from "../models/Group.js";
import Question from "../models/Question.js";

export const createQuiz = async (req, res) => {
  try {
    const { title, description, questionIds = [], difficulty, timeLimit, groupId } = req.body;

    if (!groupId) return res.status(400).json({ message: "groupId required" });
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // You may add a permission check here (admins only, etc.)
    // If group.settings.quizRequiresAdmin -> check req.user._id in group.admins

    const quiz = new Quiz({
      title,
      description,
      group: groupId,
      questions: questionIds,
      difficulty,
      timeLimit: timeLimit || group.settings.defaultTimeLimit,
      createdBy: req.user._id,
    });

    await quiz.save();
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getQuizzesForGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // if group is private, verify membership
    if (group.isPrivate && !group.members.some(m => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Must be a member to view quizzes" });
    }

    const quizzes = await Quiz.find({ group: groupId }).populate("questions");
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
