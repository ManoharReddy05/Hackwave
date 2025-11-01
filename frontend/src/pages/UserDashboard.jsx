import { useState, useEffect } from "react";
import axios from "../utils/axios";
import "./UserDashboard.css";

export default function UserDashboard() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/users/dashboard");
      setUserData(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const {
    user,
    ranking,
    streak,
    overallPerformance,
    quizAnalytics,
    upcomingSessions,
    discussionContribution,
    badges,
    groupRanking,
    groupsJoined,
  } = userData;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="user-welcome">
          <h1>Welcome back, {user.displayName || user.username}!</h1>
          <div className="user-badges-inline">
            <span className="badge-item rank-badge">
              <span className="badge-icon">🏅</span> Rank #{ranking || "N/A"}
            </span>
            <span className="badge-item streak-badge">
              <span className="badge-icon">🔥</span> {streak || 0} Day Streak
            </span>
          </div>
        </div>
        <div className="header-badges">
          {badges.topContributor && (
            <span className="achievement-badge">Top Contributor</span>
          )}
          {badges.quickLearner && (
            <span className="achievement-badge">Quick Learner</span>
          )}
          {badges.teamPlayer && (
            <span className="achievement-badge">Team Player</span>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card performance-card">
          <div className="stat-header">
            <span className="stat-icon">📈</span>
            <span className="stat-label">Overall Performance</span>
          </div>
          <div className="stat-value">{overallPerformance.percentage}%</div>
          <div className="stat-change positive">
            {overallPerformance.changeFromLastMonth > 0 && "+"}
            {overallPerformance.changeFromLastMonth}% from last month
          </div>
        </div>

        <div className="stat-card discussions-card">
          <div className="stat-header">
            <span className="stat-icon">💬</span>
            <span className="stat-label">Discussions</span>
          </div>
          <div className="stat-value">{discussionContribution.participated}</div>
          <div className="stat-subtext">Participated</div>
        </div>

        <div className="stat-card groups-card">
          <div className="stat-header">
            <span className="stat-icon">👥</span>
            <span className="stat-label">Groups</span>
          </div>
          <div className="stat-value">{groupsJoined.total}</div>
          <div className="stat-subtext">Active groups</div>
        </div>

        <div className="stat-card rank-card">
          <div className="stat-header">
            <span className="stat-icon">🏆</span>
            <span className="stat-label">Group Rank</span>
          </div>
          <div className="stat-value">
            {groupRanking.position > 0 ? `#${groupRanking.position}` : "N/A"}
          </div>
          <div className="stat-subtext">
            {groupRanking.position > 0 ? "In your groups" : "Join groups to compete"}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Quiz Analytics */}
        <div className="dashboard-card quiz-analytics-card">
          <h2 className="card-title">Quiz Analytics</h2>
          <p className="card-subtitle">Your performance across different subjects</p>

          <div className="quiz-summary">
            <div className="quiz-summary-item">
              <span className="summary-label">Average Score</span>
              <span className="summary-value">{quizAnalytics.averageScore}%</span>
            </div>
          </div>

          <div className="subjects-tabs">
            <button className="tab-btn active">All Subjects</button>
            <button className="tab-btn">Recent</button>
            <button className="tab-btn">Performance</button>
          </div>

          <div className="subjects-list">
            {quizAnalytics.subjects.map((subject) => (
              <div key={subject.name} className="subject-item">
                <div className="subject-info">
                  <span className="subject-name">{subject.name}</span>
                  <span className="subject-score">{subject.score}/{subject.maxScore}</span>
                </div>
                <div className="subject-progress">
                  <div
                    className="progress-bar"
                    style={{ width: `${(subject.score / subject.maxScore) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="dashboard-card upcoming-sessions-card">
          <h2 className="card-title">Upcoming Sessions</h2>
          <p className="card-subtitle">Your scheduled learning sessions</p>

          <div className="sessions-list">
            {upcomingSessions.length > 0 ? (
              upcomingSessions.map((session) => (
                <div key={session._id} className="session-item">
                  <div className="session-header">
                    <h3 className="session-title">{session.title}</h3>
                    {session.isLive && (
                      <span className="live-badge">Live</span>
                    )}
                    {session.type === "discussion" && (
                      <span className="session-type-badge">Discussion</span>
                    )}
                  </div>
                  <div className="session-details">
                    <div className="session-detail">
                      <span className="detail-icon">📅</span>
                      <span>{session.date}</span>
                    </div>
                    <div className="session-detail">
                      <span className="detail-icon">⏰</span>
                      <span>{session.time}</span>
                    </div>
                    <div className="session-detail">
                      <span className="detail-icon">📍</span>
                      <span>{session.location}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📅</span>
                <p>No upcoming sessions scheduled</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="dashboard-bottom">
        {/* Discussion Contribution */}
        <div className="dashboard-card contribution-card">
          <h2 className="card-title">Discussion Contribution</h2>
          <div className="contribution-stats">
            <div className="contribution-item">
              <span className="contribution-value">{discussionContribution.threadsCreated}</span>
              <span className="contribution-label">Threads Created</span>
            </div>
            <div className="contribution-item">
              <span className="contribution-value">{discussionContribution.commentsPosted}</span>
              <span className="contribution-label">Comments Posted</span>
            </div>
            <div className="contribution-item">
              <span className="contribution-value">{discussionContribution.helpfulVotes}</span>
              <span className="contribution-label">Helpful Votes</span>
            </div>
            <div className="contribution-item">
              <span className="contribution-value">{discussionContribution.participated}</span>
              <span className="contribution-label">Discussions Joined</span>
            </div>
          </div>
        </div>

        {/* Badges & Achievements */}
        <div className="dashboard-card badges-card">
          <h2 className="card-title">Badges & Achievements</h2>
          <div className="badges-grid">
            <div className={`badge-tile ${badges.topContributor ? 'earned' : 'locked'}`}>
              <span className="badge-emoji">🌟</span>
              <span className="badge-name">Top Contributor</span>
            </div>
            <div className={`badge-tile ${badges.quickLearner ? 'earned' : 'locked'}`}>
              <span className="badge-emoji">⚡</span>
              <span className="badge-name">Quick Learner</span>
            </div>
            <div className={`badge-tile ${badges.teamPlayer ? 'earned' : 'locked'}`}>
              <span className="badge-emoji">🤝</span>
              <span className="badge-name">Team Player</span>
            </div>
            <div className={`badge-tile ${badges.streakMaster ? 'earned' : 'locked'}`}>
              <span className="badge-emoji">🔥</span>
              <span className="badge-name">Streak Master</span>
            </div>
            <div className={`badge-tile ${badges.quizMaster ? 'earned' : 'locked'}`}>
              <span className="badge-emoji">📚</span>
              <span className="badge-name">Quiz Master</span>
            </div>
            <div className={`badge-tile ${badges.perfectScore ? 'earned' : 'locked'}`}>
              <span className="badge-emoji">💯</span>
              <span className="badge-name">Perfect Score</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
