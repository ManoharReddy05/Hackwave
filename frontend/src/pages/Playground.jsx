import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export default function Playground() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [playground, setPlayground] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchGroupAndPlayground();
    
    // Cleanup: leave playground when component unmounts
    return () => {
      leavePlayground();
    };
  }, [groupId]);

  const fetchGroupAndPlayground = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch group details
      const groupResponse = await axios.get(`${BASE_URL}/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroup(groupResponse.data);

      // Fetch or create playground for this group
      const playgroundResponse = await axios.get(`${BASE_URL}/api/playground/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlayground(playgroundResponse.data);
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || "Failed to load playground");
    } finally {
      setLoading(false);
    }
  };

  const leavePlayground = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${BASE_URL}/api/playground/${groupId}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Error leaving playground:", err);
    }
  };

  const handleLeavePlayground = () => {
    leavePlayground();
    navigate(`/groups/${groupId}`);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading playground...</div>
      </div>
    );
  }

  if (error || !playground) {
    return (
      <div className="page-container">
        <div className="error-message">{error || "Failed to load playground"}</div>
        <Link to={`/groups/${groupId}`} className="btn btn-secondary">Back to Group</Link>
      </div>
    );
  }

  return (
    <div className="playground-container">
      {/* Left Side - Canvas */}
      <div className="playground-canvas">
        <div className="canvas-header">
          <Link to={`/groups/${groupId}`} className="back-button">
            ← Back to Group
          </Link>
          <h2>{group?.name} - Playground</h2>
          <div className="canvas-info">
            <span className="active-users">👥 {playground.activeUsers} active</span>
          </div>
        </div>
        <div className="canvas-wrapper">
          <iframe
            src={playground.canvasUrl}
            title="Collaborative Canvas"
            className="canvas-iframe"
            allow="camera; microphone; display-capture"
          />
        </div>
      </div>

      {/* Right Side - Options Panel */}
      <div className="playground-sidebar">
        <div className="sidebar-header">
          <h3>Quick Actions</h3>
        </div>

        <div className="sidebar-options">
          <button
            className="sidebar-option-card"
            onClick={() => navigate(`/groups/${groupId}`, { state: { activeTab: 'quizzes' } })}
          >
            <div className="option-icon">📝</div>
            <div className="option-content">
              <h4>Go to Quiz</h4>
              <p>Take or create quizzes</p>
            </div>
            <div className="option-arrow">→</div>
          </button>

          <button
            className="sidebar-option-card"
            onClick={() => navigate(`/groups/${groupId}/discussions`)}
          >
            <div className="option-icon">💬</div>
            <div className="option-content">
              <h4>Discussion Threads</h4>
              <p>Join conversations</p>
            </div>
            <div className="option-arrow">→</div>
          </button>

          <button
            className="sidebar-option-card"
            onClick={() => navigate(`/groups/${groupId}/sessions`)}
          >
            <div className="option-icon">🎯</div>
            <div className="option-content">
              <h4>Join a Session</h4>
              <p>View active sessions</p>
            </div>
            <div className="option-arrow">→</div>
          </button>

          <button
            className="sidebar-option-card"
            onClick={() => navigate(`/groups/${groupId}`)}
          >
            <div className="option-icon">📊</div>
            <div className="option-content">
              <h4>Group Overview</h4>
              <p>View group details</p>
            </div>
            <div className="option-arrow">→</div>
          </button>

          <button
            className="sidebar-option-card"
            onClick={() => navigate(`/groups/${groupId}/members`)}
          >
            <div className="option-icon">🎨</div>
            <div className="option-content">
              <h4>Users in Canvas</h4>
              <p>See active collaborators</p>
            </div>
            <div className="option-arrow">→</div>
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="session-info">
            <p className="session-label">Current Session</p>
            <p className="session-value">Live Collaboration</p>
            <p className="session-detail">Board ID: {playground.boardId}</p>
          </div>
          <button 
            className="btn btn-danger btn-small" 
            style={{ width: '100%' }}
            onClick={handleLeavePlayground}
          >
            Leave Playground
          </button>
        </div>
      </div>
    </div>
  );
}
