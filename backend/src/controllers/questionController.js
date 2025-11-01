// src/controllers/questionController.js
import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";
import Group from "../models/Group.js";

// Create a new question for a quiz
export const createQuestion = async (req, res) => {
  try {
    const { 
      quizId, 
      questionText, 
      questionType, 
      options, 
      correctAnswer, 
      points, 
      explanation, 
      difficulty, 
      tags 
    } = req.body;

    if (!quizId || !questionText) {
      return res.status(400).json({ message: "quizId and questionText are required" });
    }

    // Verify quiz exists
    const quiz = await Quiz.findById(quizId).populate("group");
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Check if user has permission (is group admin or quiz creator)
    const group = await Group.findById(quiz.group);
    const isAdmin = group.admins.some(adminId => adminId.toString() === req.user._id.toString());
    const isCreator = quiz.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: "Only quiz creator or group admins can add questions" });
    }

    // Create question
    const question = new Question({
      quiz: quizId,
      questionText,
      questionType: questionType || "multiple-choice",
      options: options || [],
      correctAnswer,
      points: points || 1,
      explanation,
      difficulty: difficulty || quiz.difficulty || "medium",
      tags: tags || [],
      createdBy: req.user._id,
    });

    await question.save();

    // Add question to quiz
    quiz.questions.push(question._id);
    await quiz.save();

    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all questions for a specific quiz
export const getQuestionsForQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId).populate("group");
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Check if user has access to the group
    const group = await Group.findById(quiz.group);
    if (group.isPrivate && !group.members.some(m => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Must be a member to view questions" });
    }

    const questions = await Question.find({ quiz: quizId })
      .populate("createdBy", "username displayName")
      .sort({ createdAt: 1 });

    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single question by ID
export const getQuestionById = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findById(questionId)
      .populate("quiz")
      .populate("createdBy", "username displayName");

    if (!question) return res.status(404).json({ message: "Question not found" });

    // Verify access through quiz and group
    const quiz = await Quiz.findById(question.quiz).populate("group");
    const group = await Group.findById(quiz.group);

    if (group.isPrivate && !group.members.some(m => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a question
export const updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const updates = req.body;

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });

    // Check permissions
    const quiz = await Quiz.findById(question.quiz).populate("group");
    const group = await Group.findById(quiz.group);
    const isAdmin = group.admins.some(adminId => adminId.toString() === req.user._id.toString());
    const isCreator = question.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: "Only question creator or group admins can update" });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (key !== "_id" && key !== "quiz" && key !== "createdBy") {
        question[key] = updates[key];
      }
    });

    await question.save();
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a question
export const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });

    // Check permissions
    const quiz = await Quiz.findById(question.quiz).populate("group");
    const group = await Group.findById(quiz.group);
    const isAdmin = group.admins.some(adminId => adminId.toString() === req.user._id.toString());
    const isCreator = question.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: "Only question creator or group admins can delete" });
    }

    // Remove from quiz
    quiz.questions = quiz.questions.filter(q => q.toString() !== questionId);
    await quiz.save();

    // Delete question
    await Question.findByIdAndDelete(questionId);

    res.json({ message: "Question deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Bulk create questions for a quiz
export const bulkCreateQuestions = async (req, res) => {
  try {
    const { quizId, questions } = req.body;

    if (!quizId || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ message: "quizId and questions array are required" });
    }

    const quiz = await Quiz.findById(quizId).populate("group");
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Check permissions
    const group = await Group.findById(quiz.group);
    const isAdmin = group.admins.some(adminId => adminId.toString() === req.user._id.toString());
    const isCreator = quiz.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: "Only quiz creator or group admins can add questions" });
    }

    // Create all questions
    const createdQuestions = await Question.insertMany(
      questions.map(q => ({
        ...q,
        quiz: quizId,
        createdBy: req.user._id,
        difficulty: q.difficulty || quiz.difficulty || "medium",
      }))
    );

    // Add all question IDs to quiz
    quiz.questions.push(...createdQuestions.map(q => q._id));
    await quiz.save();

    res.status(201).json(createdQuestions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
