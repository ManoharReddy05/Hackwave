import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "../utils/axios";
import "./GroupDashboard.css";

export default function GroupDashboard() {
  const { groupId } = useParams();
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGroupDashboard();
  }, [groupId]);

  const fetchGroupDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/groups/${groupId}/dashboard`);
      setGroupData(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching group dashboard:", err);
      setError(err.response?.data?.message || "Failed to load group dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="group-dashboard-container">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="group-dashboard-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const {
    group,
    totalStudents,
    totalHours,
    groupRanking,
    totalSessions,
    averageContribution,
    topicsCompleted,
    sessionsThisWeek,
    students,
  } = groupData;

  return (
    <div className="group-dashboard-container">
      {/* Header */}
      <div className="group-dashboard-header">
        <div className="group-info">
          <div className="group-icon">👥</div>
          <div>
            <h1 className="group-name">{group.name}</h1>
            <p className="group-tagline">{group.description || "Elite Group"}</p>
          </div>
        </div>
        <div className="group-rank-display">
          <span className="rank-number">#{groupRanking || "N/A"}</span>
          <span className="rank-label">Rank</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="group-stats-grid">
        <div className="group-stat-card students-card">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">👥</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Total Students</h3>
            <p className="stat-value">{totalStudents}</p>
          </div>
        </div>

        <div className="group-stat-card hours-card">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">⏱️</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Total Hours</h3>
            <p className="stat-value">{totalHours || 0}</p>
            {sessionsThisWeek > 0 && (
              <p className="stat-change">+{Math.round(sessionsThisWeek * 0.5)}h this week</p>
            )}
          </div>
        </div>

        <div className="group-stat-card topics-card">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">📚</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Topics Completed</h3>
            <p className="stat-value">{topicsCompleted}</p>
          </div>
        </div>

        <div className="group-stat-card sessions-card">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">📅</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Sessions</h3>
            <p className="stat-value">{totalSessions || 0}</p>
            {sessionsThisWeek > 0 && (
              <p className="stat-change">{sessionsThisWeek} this week</p>
            )}
          </div>
        </div>
      </div>

      {/* Contribution Banner */}
      <div className="contribution-banner">
        <div className="banner-icon">📊</div>
        <div className="banner-content">
          <h3>Average Contribution</h3>
          <p className="contribution-percentage">{averageContribution}%</p>
        </div>
        <div className="banner-trend">
          <span className="trend-icon">📈</span>
        </div>
      </div>

      {/* Students Section */}
      <div className="students-section">
        <div className="section-header">
          <h2 className="section-title">Students</h2>
          <span className="member-count">{students.length} members</span>
        </div>

        <div className="students-grid">
          {students.map((student) => (
            <div key={student._id} className="student-card">
              <div className="student-avatar">
                {student.avatar ? (
                  <img src={student.avatar} alt={student.displayName} />
                ) : (
                  <div className="avatar-placeholder">
                    {student.displayName?.charAt(0) || student.username?.charAt(0) || "?"}
                  </div>
                )}
              </div>
              <div className="student-info">
                <h3 className="student-name">{student.displayName || student.username}</h3>
                <p className="student-username">@{student.username}</p>
              </div>
              <div className="student-stats">
                <div className="student-stat">
                  <span className="stat-label">Rank</span>
                  <span className="stat-value">#{student.ranking || "N/A"}</span>
                </div>
                <div className="student-stat">
                  <span className="stat-label">Score</span>
                  <span className="stat-value">{student.score || 0}</span>
                </div>
                <div className="student-stat">
                  <span className="stat-label">Sessions</span>
                  <span className="stat-value">{student.sessionsAttended || 0}</span>
                </div>
              </div>
              {student.badges && student.badges.length > 0 && (
                <div className="student-badges">
                  {student.badges.slice(0, 3).map((badge, idx) => (
                    <span key={idx} className="mini-badge" title={badge}>
                      {badge === "topContributor" && "🌟"}
                      {badge === "quickLearner" && "⚡"}
                      {badge === "teamPlayer" && "🤝"}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
