// src/controllers/quizController.js
import Quiz from "../models/Quiz.js";
import Group from "../models/Group.js";
import Question from "../models/Question.js";
import Result from "../models/Result.js";

export const createQuiz = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      questionIds = [], 
      difficulty, 
      timeLimit, 
      groupId,
      scheduledStartTime,
      scheduledEndTime,
      maxAttempts,
      passingScore,
      showResults,
      shuffleQuestions,
      shuffleOptions,
      isPublished = true
    } = req.body;

    if (!groupId) return res.status(400).json({ message: "groupId required" });
    
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Check if user is admin or member who can create quizzes
    const isAdmin = group.admins.some(adminId => adminId.toString() === req.user._id.toString());
    const isMember = group.members.some(memberId => memberId.toString() === req.user._id.toString());
    
    if (!isAdmin && !isMember) {
      return res.status(403).json({ message: "Only group members can create quizzes" });
    }

    // Validate schedule if provided
    if (scheduledStartTime && scheduledEndTime) {
      const start = new Date(scheduledStartTime);
      const end = new Date(scheduledEndTime);
      const now = new Date();

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      if (start < now) {
        return res.status(400).json({ message: "Start time must be in the future" });
      }

      if (end <= start) {
        return res.status(400).json({ message: "End time must be after start time" });
      }
    }

    // Validate maxAttempts
    if (maxAttempts !== null && maxAttempts !== undefined) {
      if (maxAttempts < 1) {
        return res.status(400).json({ message: "Maximum attempts must be at least 1" });
      }
    }

    const quiz = new Quiz({
      title,
      description,
      group: groupId,
      questions: questionIds,
      difficulty,
      timeLimit: timeLimit || group.settings?.defaultTimeLimit || 1800,
      createdBy: req.user._id,
      scheduledStartTime,
      scheduledEndTime,
      isScheduled: !!(scheduledStartTime && scheduledEndTime),
      maxAttempts,
      passingScore: passingScore || 60,
      showResults: showResults || "immediately",
      shuffleQuestions: shuffleQuestions || false,
      shuffleOptions: shuffleOptions || false,
      isPublished
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
    const { includeInactive = false } = req.query;
    
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Check membership for private groups
    if (group.isPrivate && !group.members.some(m => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Must be a member to view quizzes" });
    }

    // Build query to include both group-specific quizzes AND AI-generated quizzes
    const query = { 
      $or: [
        { group: groupId, isAIGenerated: { $ne: true } }, // Group-specific manual quizzes
        { isAIGenerated: true } // All AI-generated quizzes (visible to all groups)
      ],
      isPublished: true 
    };
    if (!includeInactive) {
      query.isActive = true;
    }

    const quizzes = await Quiz.find(query)
      .populate("questions")
      .populate("createdBy", "username displayName")
      .sort({ createdAt: -1 });

    // Add availability status to each quiz
    const now = new Date();
    const quizzesWithStatus = quizzes.map(quiz => {
      const quizObj = quiz.toObject();
      
      if (quiz.isScheduled) {
        const start = new Date(quiz.scheduledStartTime);
        const end = new Date(quiz.scheduledEndTime);
        
        if (now < start) {
          quizObj.availabilityStatus = "not-started";
          quizObj.startsIn = Math.floor((start - now) / 1000);
        } else if (now > end) {
          quizObj.availabilityStatus = "ended";
        } else {
          quizObj.availabilityStatus = "active";
          quizObj.endsIn = Math.floor((end - now) / 1000);
        }
      } else {
        quizObj.availabilityStatus = "always-available";
      }
      
      return quizObj;
    });

    res.json(quizzesWithStatus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//get ai quizzes
export const getAIQuizzes = async (req, res) => {
  try {
    const aiQuizzes = await Quiz.find({ isAIGenerated: true })
      .populate("questions")
      .populate("createdBy", "username displayName")
      .sort({ createdAt: -1 });

    res.json(aiQuizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;
    
    const quiz = await Quiz.findById(quizId)
      .populate("questions")
      .populate("createdBy", "username displayName")
      .populate("group", "name isPrivate members");
    
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Check access permissions
    const group = quiz.group;
    if (group.isPrivate && !group.members.some(m => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Add availability status
    const quizObj = quiz.toObject();
    const now = new Date();
    
    if (quiz.isScheduled) {
      const start = new Date(quiz.scheduledStartTime);
      const end = new Date(quiz.scheduledEndTime);
      
      if (now < start) {
        quizObj.availabilityStatus = "not-started";
        quizObj.startsIn = Math.floor((start - now) / 1000);
      } else if (now > end) {
        quizObj.availabilityStatus = "ended";
      } else {
        quizObj.availabilityStatus = "active";
        quizObj.endsIn = Math.floor((end - now) / 1000);
      }
    } else {
      quizObj.availabilityStatus = "always-available";
    }

    res.json(quizObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const checkQuizAvailability = async (req, res) => {
  try {
    const { quizId } = req.params;
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const now = new Date();
    const response = {
      isAvailable: quiz.isActive && quiz.isPublished,
      status: "available",
      message: null,
    };

    if (!quiz.isActive) {
      response.isAvailable = false;
      response.status = "inactive";
      response.message = "This quiz is no longer active";
      return res.json(response);
    }

    if (!quiz.isPublished) {
      response.isAvailable = false;
      response.status = "unpublished";
      response.message = "This quiz is not yet published";
      return res.json(response);
    }

    // Check schedule
    if (quiz.isScheduled) {
      const start = new Date(quiz.scheduledStartTime);
      const end = new Date(quiz.scheduledEndTime);

      if (now < start) {
        response.isAvailable = false;
        response.status = "not-started";
        response.message = "Quiz has not started yet";
        response.startsIn = Math.floor((start - now) / 1000);
        response.startTime = quiz.scheduledStartTime;
      } else if (now > end) {
        response.isAvailable = false;
        response.status = "ended";
        response.message = "Quiz submission period has ended";
        response.endTime = quiz.scheduledEndTime;
      } else {
        response.status = "active";
        response.endsIn = Math.floor((end - now) / 1000);
        response.endTime = quiz.scheduledEndTime;
      }
    }

    // Check attempts
    if (quiz.maxAttempts && response.isAvailable) {
      const attempts = await Result.countDocuments({
        quiz: quizId,
        user: req.user._id
      });
      response.attemptsUsed = attempts;
      response.attemptsRemaining = quiz.maxAttempts - attempts;
      response.maxAttempts = quiz.maxAttempts;
      
      if (attempts >= quiz.maxAttempts) {
        response.isAvailable = false;
        response.status = "max-attempts";
        response.message = `Maximum attempts (${quiz.maxAttempts}) reached`;
      }
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const updates = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Check permissions
    const group = await Group.findById(quiz.group);
    const isAdmin = group.admins.some(adminId => adminId.toString() === req.user._id.toString());
    const isCreator = quiz.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: "Only quiz creator or group admins can update" });
    }

    // Validate schedule if being updated
    if (updates.scheduledStartTime || updates.scheduledEndTime) {
      const start = new Date(updates.scheduledStartTime || quiz.scheduledStartTime);
      const end = new Date(updates.scheduledEndTime || quiz.scheduledEndTime);
      const now = new Date();

      if (start < now) {
        return res.status(400).json({ message: "Start time must be in the future" });
      }

      if (end <= start) {
        return res.status(400).json({ message: "End time must be after start time" });
      }

      updates.isScheduled = true;
    }

    // Don't allow updating certain fields
    delete updates._id;
    delete updates.createdBy;
    delete updates.group;
    delete updates.createdAt;
    delete updates.updatedAt;

    Object.keys(updates).forEach(key => {
      quiz[key] = updates[key];
    });

    await quiz.save();
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleQuizActive = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Check permissions
    const group = await Group.findById(quiz.group);
    const isAdmin = group.admins.some(adminId => adminId.toString() === req.user._id.toString());
    const isCreator = quiz.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: "Only quiz creator or group admins can toggle status" });
    }

    quiz.isActive = !quiz.isActive;
    await quiz.save();

    res.json({ 
      message: `Quiz ${quiz.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: quiz.isActive 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Check permissions
    const group = await Group.findById(quiz.group);
    const isAdmin = group.admins.some(adminId => adminId.toString() === req.user._id.toString());
    const isCreator = quiz.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: "Only quiz creator or group admins can delete" });
    }

    // Delete associated questions and results
    await Question.deleteMany({ quiz: quizId });
    await Result.deleteMany({ quiz: quizId });
    await Quiz.findByIdAndDelete(quizId);

    res.json({ message: "Quiz and associated data deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getQuizStatistics = async (req, res) => {
  try {
    const { quizId } = req.params;
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Check permissions
    const group = await Group.findById(quiz.group);
    const isAdmin = group.admins.some(adminId => adminId.toString() === req.user._id.toString());
    const isCreator = quiz.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: "Only quiz creator or group admins can view statistics" });
    }

    const results = await Result.find({ quiz: quizId })
      .populate("user", "username displayName")
      .sort({ percentageScore: -1 });

    const stats = {
      totalAttempts: results.length,
      uniqueUsers: [...new Set(results.map(r => r.user._id.toString()))].length,
      averageScore: results.reduce((sum, r) => sum + r.percentageScore, 0) / results.length || 0,
      highestScore: Math.max(...results.map(r => r.percentageScore), 0),
      lowestScore: results.length > 0 ? Math.min(...results.map(r => r.percentageScore)) : 0,
      passRate: results.length > 0 ? (results.filter(r => r.isPassed).length / results.length) * 100 : 0,
      averageTimeTaken: results.reduce((sum, r) => sum + (r.timeTaken || 0), 0) / results.length || 0,
      
      // Score distribution
      scoreDistribution: {
        "0-20": results.filter(r => r.percentageScore < 20).length,
        "20-40": results.filter(r => r.percentageScore >= 20 && r.percentageScore < 40).length,
        "40-60": results.filter(r => r.percentageScore >= 40 && r.percentageScore < 60).length,
        "60-80": results.filter(r => r.percentageScore >= 60 && r.percentageScore < 80).length,
        "80-100": results.filter(r => r.percentageScore >= 80).length,
      },

      // Top performers
      topPerformers: results
        .slice(0, 10)
        .map(r => ({
          user: r.user,
          score: r.percentageScore,
          timeTaken: r.timeTaken,
          attemptNumber: r.attemptNumber,
          completedAt: r.completedAt
        })),
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
