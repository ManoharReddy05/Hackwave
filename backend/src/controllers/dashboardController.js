// src/controllers/dashboardController.js
import User from "../models/User.js";
import Group from "../models/Group.js";
import Quiz from "../models/Quiz.js";
import Result from "../models/Result.js";
import Thread from "../models/Thread.js";
import Post from "../models/Post.js";
import Leaderboard from "../models/Leaderboard.js";

// Get User Dashboard Data
export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user details
    const user = await User.findById(userId).select("username displayName email");

    // Get user's groups
    const userGroups = await Group.find({ members: userId });
    const groupIds = userGroups.map(g => g._id);

    // Calculate ranking (based on quiz results)
    const allUsers = await User.find();
    const userScores = await Promise.all(
      allUsers.map(async (u) => {
        const results = await Result.find({ user: u._id });
        const totalScore = results.reduce((sum, r) => sum + r.percentageScore, 0);
        return { userId: u._id, score: totalScore };
      })
    );
    userScores.sort((a, b) => b.score - a.score);
    const ranking = userScores.findIndex(s => s.userId.toString() === userId.toString()) + 1;

    // Calculate streak (based on recent activity)
    const recentThreads = await Thread.find({ author: userId }).sort({ createdAt: -1 }).limit(30);
    const recentResults = await Result.find({ user: userId }).sort({ completedAt: -1 }).limit(30);
    const recentPosts = await Post.find({ author: userId }).sort({ createdAt: -1 }).limit(30);
    
    // Combine and sort all activity
    const allActivity = [
      ...recentThreads.map(t => ({ date: t.createdAt })),
      ...recentResults.map(r => ({ date: r.completedAt || r.createdAt })),
      ...recentPosts.map(p => ({ date: p.createdAt }))
    ].sort((a, b) => b.date - a.date);
    
    // Calculate streak from consecutive days
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (allActivity.length > 0) {
      const uniqueDays = new Set();
      allActivity.forEach(activity => {
        const activityDate = new Date(activity.date);
        activityDate.setHours(0, 0, 0, 0);
        uniqueDays.add(activityDate.getTime());
      });
      
      const sortedDays = Array.from(uniqueDays).sort((a, b) => b - a);
      let expectedDate = today.getTime();
      
      for (const day of sortedDays) {
        if (day === expectedDate || day === expectedDate - 86400000) {
          streak++;
          expectedDate = day - 86400000;
        } else {
          break;
        }
      }
    }

    // Overall Performance
    const userResults = await Result.find({ user: userId });
    const overallPerformance = {
      percentage: userResults.length > 0 
        ? Math.round(userResults.reduce((sum, r) => sum + r.percentageScore, 0) / userResults.length)
        : 0,
      changeFromLastMonth: 0
    };

    // Calculate change from last month if we have data
    if (userResults.length > 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentResults = userResults.filter(r => new Date(r.completedAt || r.createdAt) >= thirtyDaysAgo);
      const olderResults = userResults.filter(r => new Date(r.completedAt || r.createdAt) < thirtyDaysAgo);
      
      if (recentResults.length > 0 && olderResults.length > 0) {
        const recentAvg = recentResults.reduce((sum, r) => sum + r.percentageScore, 0) / recentResults.length;
        const olderAvg = olderResults.reduce((sum, r) => sum + r.percentageScore, 0) / olderResults.length;
        overallPerformance.changeFromLastMonth = Math.round(recentAvg - olderAvg);
      }
    }

    // Quiz Analytics - Group by quiz difficulty or topics
    const quizDetailsWithResults = await Promise.all(
      userResults.map(async (result) => {
        const quiz = await Quiz.findById(result.quiz).select("difficulty title");
        return { ...result.toObject(), quizInfo: quiz };
      })
    );

    // Group by difficulty to simulate subjects
    const difficultyGroups = {
      easy: quizDetailsWithResults.filter(r => r.quizInfo?.difficulty === "easy"),
      medium: quizDetailsWithResults.filter(r => r.quizInfo?.difficulty === "medium"),
      hard: quizDetailsWithResults.filter(r => r.quizInfo?.difficulty === "hard")
    };

    const subjects = [];
    if (difficultyGroups.easy.length > 0) {
      const avgScore = difficultyGroups.easy.reduce((sum, r) => sum + r.percentageScore, 0) / difficultyGroups.easy.length;
      subjects.push({ 
        name: "Easy Quizzes", 
        score: Math.round(avgScore), 
        maxScore: 100 
      });
    }
    if (difficultyGroups.medium.length > 0) {
      const avgScore = difficultyGroups.medium.reduce((sum, r) => sum + r.percentageScore, 0) / difficultyGroups.medium.length;
      subjects.push({ 
        name: "Medium Quizzes", 
        score: Math.round(avgScore), 
        maxScore: 100 
      });
    }
    if (difficultyGroups.hard.length > 0) {
      const avgScore = difficultyGroups.hard.reduce((sum, r) => sum + r.percentageScore, 0) / difficultyGroups.hard.length;
      subjects.push({ 
        name: "Hard Quizzes", 
        score: Math.round(avgScore), 
        maxScore: 100 
      });
    }

    // If no results yet, show placeholder
    if (subjects.length === 0) {
      subjects.push(
        { name: "No Quiz Attempts Yet", score: 0, maxScore: 100 }
      );
    }

    const quizAnalytics = {
      averageScore: overallPerformance.percentage,
      subjects
    };

    // Upcoming Sessions - Get scheduled quizzes from user's groups
    const now = new Date();
    const upcomingQuizzes = await Quiz.find({
      group: { $in: groupIds },
      isScheduled: true,
      scheduledStartTime: { $gte: now },
      isPublished: true,
      isActive: true
    })
    .sort({ scheduledStartTime: 1 })
    .limit(5)
    .populate("group", "name");

    const upcomingSessions = upcomingQuizzes.map(quiz => {
      const startDate = new Date(quiz.scheduledStartTime);
      const endDate = new Date(quiz.scheduledEndTime);
      
      // Format date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = startDate.toDateString() === tomorrow.toDateString();
      const isToday = startDate.toDateString() === now.toDateString();
      
      let dateStr;
      if (isToday) {
        dateStr = "Today";
      } else if (isTomorrow) {
        dateStr = "Tomorrow, Nov 2";
      } else {
        dateStr = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
      
      // Format time
      const timeStr = `${startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} - ${endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
      
      // Check if live (within 30 minutes of start)
      const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60000);
      const isLive = startDate <= thirtyMinutesFromNow && endDate > now;
      
      return {
        _id: quiz._id.toString(),
        title: quiz.title,
        date: dateStr,
        time: timeStr,
        location: quiz.group?.name || "Group Quiz",
        isLive,
        type: "quiz"
      };
    });

    // Discussion Contribution
    const threadsCreated = await Thread.countDocuments({ author: userId });
    const commentsPosted = await Post.countDocuments({ author: userId });
    
    // Calculate helpful votes from posts
    const postsWithVotes = await Post.find({ author: userId }).select("upvotes downvotes");
    const helpfulVotes = postsWithVotes.reduce((sum, post) => {
      return sum + ((post.upvotes?.length || 0) - (post.downvotes?.length || 0));
    }, 0);
    
    const discussionContribution = {
      participated: await Thread.countDocuments({ 
        $or: [
          { author: userId },
          { _id: { $in: await Post.find({ author: userId }).distinct("thread") } }
        ]
      }),
      threadsCreated,
      commentsPosted,
      helpfulVotes: Math.max(0, helpfulVotes)
    };

    // Badges
    const badges = {
      topContributor: commentsPosted > 20,
      quickLearner: overallPerformance.percentage > 80,
      teamPlayer: userGroups.length >= 3,
      streakMaster: streak >= 7,
      quizMaster: userResults.length >= 10,
      perfectScore: userResults.some(r => r.percentageScore === 100)
    };

    // Group Ranking - Calculate user's average rank across all groups
    let totalRank = 0;
    let groupsWithRanks = 0;
    
    for (const group of userGroups) {
      const groupMembers = await Group.findById(group._id).select("members");
      if (!groupMembers || groupMembers.members.length === 0) continue;
      
      const memberScores = await Promise.all(
        groupMembers.members.map(async (memberId) => {
          const results = await Result.find({ user: memberId, group: group._id });
          const totalScore = results.reduce((sum, r) => sum + r.percentageScore, 0);
          return { userId: memberId, score: totalScore };
        })
      );
      
      memberScores.sort((a, b) => b.score - a.score);
      const userRank = memberScores.findIndex(s => s.userId.toString() === userId.toString()) + 1;
      
      if (userRank > 0) {
        totalRank += userRank;
        groupsWithRanks++;
      }
    }
    
    const groupRanking = {
      position: groupsWithRanks > 0 ? Math.round(totalRank / groupsWithRanks) : 0
    };

    // Groups Joined
    const groupsJoined = {
      total: userGroups.length
    };

    res.json({
      user,
      ranking,
      streak,
      overallPerformance,
      quizAnalytics,
      upcomingSessions,
      discussionContribution,
      badges,
      groupRanking,
      groupsJoined
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Group Dashboard Data
export const getGroupDashboard = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Get group details
    const group = await Group.findById(groupId)
      .populate("members", "username displayName avatar")
      .populate("admins", "username displayName");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is a member
    if (!group.members.some(m => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Total Students
    const totalStudents = group.members.length;

    // Total Hours - Calculate from quiz time limits and completion times
    const groupQuizzes = await Quiz.find({ group: groupId });
    const groupResults = await Result.find({ group: groupId });
    
    let totalSeconds = 0;
    groupResults.forEach(result => {
      totalSeconds += result.timeTaken || 0;
    });
    
    // Add estimated time from threads (5 min per thread)
    const groupThreads = await Thread.countDocuments({ group: groupId });
    totalSeconds += groupThreads * 300; // 5 minutes per thread
    
    const totalHours = Math.round(totalSeconds / 3600);

    // Group Ranking - Compare with other groups based on average performance
    const allGroups = await Group.find();
    const groupScores = await Promise.all(
      allGroups.map(async (g) => {
        const results = await Result.find({ group: g._id });
        const avgScore = results.length > 0 
          ? results.reduce((sum, r) => sum + r.percentageScore, 0) / results.length
          : 0;
        return { groupId: g._id, score: avgScore, memberCount: g.members.length };
      })
    );
    
    groupScores.sort((a, b) => b.score - a.score);
    const groupRanking = groupScores.findIndex(g => g.groupId.toString() === groupId.toString()) + 1;

    // Total Sessions - Count quizzes taken
    const totalSessions = groupResults.length;
    
    // Sessions this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const sessionsThisWeek = groupResults.filter(r => 
      new Date(r.completedAt || r.createdAt) >= oneWeekAgo
    ).length;

    // Average Contribution - Calculate from participation
    const totalPossibleParticipation = totalStudents * groupQuizzes.length;
    const actualParticipation = groupResults.length;
    const averageContribution = totalPossibleParticipation > 0 
      ? Math.round((actualParticipation / totalPossibleParticipation) * 100)
      : 0;

    // Topics Completed - Count unique quizzes completed
    const topicsCompleted = new Set(groupResults.map(r => r.quiz.toString())).size;

    // Get student details with their stats
    const students = await Promise.all(
      group.members.map(async (member) => {
        const results = await Result.find({ user: member._id, group: groupId });
        const threads = await Thread.countDocuments({ author: member._id, group: groupId });
        const posts = await Post.countDocuments({ author: member._id });
        
        const totalScore = results.reduce((sum, r) => sum + r.percentageScore, 0);
        
        // Calculate ranking within group
        const memberScores = await Promise.all(
          group.members.map(async (m) => {
            const mResults = await Result.find({ user: m._id, group: groupId });
            return {
              userId: m._id,
              score: mResults.reduce((sum, r) => sum + r.percentageScore, 0)
            };
          })
        );
        memberScores.sort((a, b) => b.score - a.score);
        const ranking = memberScores.findIndex(s => s.userId.toString() === member._id.toString()) + 1;

        // Determine badges based on actual performance
        const badges = [];
        if (posts > 20) badges.push("topContributor");
        if (results.length > 0 && (totalScore / results.length) > 80) badges.push("quickLearner");
        if (threads > 5) badges.push("teamPlayer");

        return {
          _id: member._id,
          username: member.username,
          displayName: member.displayName,
          avatar: member.avatar,
          ranking,
          score: results.length > 0 ? Math.round(totalScore / results.length) : 0,
          sessionsAttended: results.length,
          badges
        };
      })
    );

    res.json({
      group: {
        _id: group._id,
        name: group.name,
        description: group.description
      },
      totalStudents,
      totalHours,
      groupRanking,
      totalSessions,
      averageContribution,
      topicsCompleted,
      sessionsThisWeek,
      students
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
