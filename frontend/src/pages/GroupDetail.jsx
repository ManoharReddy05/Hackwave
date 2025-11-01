import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import api from "../utils/axios";
import GroupThreadList from "../components/GroupThreadList";

export default function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  // Threads are rendered via GroupThreadList; use refresh token to trigger reloads
  const [discussionsRefresh, setDiscussionsRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || "overview");
  const [isMember, setIsMember] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [sessionData, setSessionData] = useState({
    title: "",
    description: "",
    scheduledTime: "",
  });
  const [discussionData, setDiscussionData] = useState({
    title: "",
    content: "",
    tags: "",
  });
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId, activeTab]);

  const fetchGroupDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      
      const response = await api.get(`/groups/${groupId}`);
      
      setGroup(response.data);
      setMembers(response.data.members || []);
      
      // Check if current user is a member
      const isMemberCheck = response.data.members?.some(m => m._id === userId || m === userId);
      setIsMember(isMemberCheck);
      
      // Fetch quizzes if on quizzes tab
      if (activeTab === "quizzes" && isMemberCheck) {
        fetchQuizzes();
      }
      
    } catch (err) {
      console.error("Error fetching group details:", err);
      setError("Failed to load group details.");
    } finally {
      setLoading(false);
    }
  };

  // Threads loaded by GroupThreadList component

  const fetchQuizzes = async () => {
    setLoadingQuizzes(true);
    try {
      const response = await api.get(`/quizzes/group/${groupId}`);
      console.log('📝 Received quizzes:', response.data.length);
      const aiQuizzes = response.data.filter(q => q.isAIGenerated);
      const manualQuizzes = response.data.filter(q => !q.isAIGenerated);
      console.log(`   - ${manualQuizzes.length} manual quizzes`);
      console.log(`   - ${aiQuizzes.length} AI-generated quizzes`);
      if (aiQuizzes.length > 0) {
        console.log('   AI Quiz details:', aiQuizzes.map(q => ({ title: q.title, id: q._id })));
      }
      setQuizzes(response.data);
    } catch (err) {
      console.error("Error fetching quizzes:", err);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const handleJoinGroup = async () => {
    try {
      const token = localStorage.getItem("token");
      await api.post(`/groups/${groupId}/join`, {});
      fetchGroupDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to join group");
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    
    try {
      const token = localStorage.getItem("token");
      await api.post(`/groups/${groupId}/leave`, {});
      navigate("/groups");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to leave group");
    }
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await api.post(`/groups/${groupId}/sessions`, sessionData);
      setShowSessionModal(false);
      setSessionData({ title: "", description: "", scheduledTime: "" });
      alert("Session created successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create session");
    }
  };

  const handleOpenPlayground = () => {
    // Navigate to the playground page for this group
    navigate(`/groups/${groupId}/playground`);
  };

  const handleStartDiscussion = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const tagsArray = discussionData.tags.split(',').map(t => t.trim()).filter(t => t);
      
      await api.post("/threads", {
        title: discussionData.title,
        content: discussionData.content,
        groupId: groupId,
        tags: tagsArray,
      });
      
      setShowDiscussionModal(false);
      setDiscussionData({ title: "", content: "", tags: "" });
      alert("Discussion thread created successfully!");
      // Trigger refresh in GroupThreadList
      setDiscussionsRefresh((c) => c + 1);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create discussion thread");
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading group details...</div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="page-container">
        <div className="error-message">{error || "Group not found"}</div>
        <Link to="/groups" className="btn btn-secondary">Back to Groups</Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Group Header */}
      <div className="group-detail-header">
        <Link to="/groups" className="back-button">
          ← Back to Groups
        </Link>
        
        <div className="group-detail-title">
          <div>
            <h1 className="page-title">{group.name}</h1>
            {group.isPrivate && (
              <span className="badge badge-private">🔒 Private</span>
            )}
          </div>
          <div className="group-header-actions">
            {!isMember ? (
              <button onClick={handleJoinGroup} className="btn btn-primary">
                Join Group
              </button>
            ) : (
              <>
                <button onClick={() => setShowSessionModal(true)} className="btn btn-primary">
                  Start a Session
                </button>
                <button onClick={() => setShowDiscussionModal(true)} className="btn btn-primary">
                  💬 Start Discussion
                </button>
                <button onClick={handleOpenPlayground} className="btn btn-secondary">
                  🎨 Playground
                </button>
                <button onClick={handleLeaveGroup} className="btn btn-danger">
                  Leave Group
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => navigate(`/groups/${groupId}/dashboard`)}
        >
          📊 Dashboard
        </button>
        <button
          className={`tab-button ${activeTab === "discussions" ? "active" : ""}`}
          onClick={() => setActiveTab("discussions")}
        >
          Discussions
        </button>
        <button
          className={`tab-button ${activeTab === "members" ? "active" : ""}`}
          onClick={() => setActiveTab("members")}
        >
          Members ({members.length})
        </button>
        <button
          className={`tab-button ${activeTab === "sessions" ? "active" : ""}`}
          onClick={() => setActiveTab("sessions")}
        >
          Sessions
        </button>
        <button
          className={`tab-button ${activeTab === "quizzes" ? "active" : ""}`}
          onClick={() => setActiveTab("quizzes")}
        >
          Quizzes
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="overview-content">
            <div className="info-card">
              <h3>About This Group</h3>
              <p>{group.description || "No description provided."}</p>
              
              <div className="group-stats-detail">
                <div className="stat-detail-item">
                  <span className="stat-label">Members</span>
                  <span className="stat-value">{members.length}</span>
                </div>
                <div className="stat-detail-item">
                  <span className="stat-label">Admins</span>
                  <span className="stat-value">{group.admins?.length || 0}</span>
                </div>
                <div className="stat-detail-item">
                  <span className="stat-label">Created</span>
                  <span className="stat-value">
                    {new Date(group.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3>Quick Actions</h3>
              <div className="quick-actions-grid">
                <button 
                  className="action-card"
                  onClick={() => setShowSessionModal(true)}
                  disabled={!isMember}
                >
                  <span className="action-icon">🎯</span>
                  <h4>Start Session</h4>
                  <p>Begin a new study session</p>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => setShowDiscussionModal(true)}
                  disabled={!isMember}
                >
                  <span className="action-icon">💬</span>
                  <h4>Start Discussion</h4>
                  <p>Create a new thread</p>
                </button>
                
                <button 
                  className="action-card"
                  onClick={handleOpenPlayground}
                  disabled={!isMember}
                >
                  <span className="action-icon">🎨</span>
                  <h4>Playground</h4>
                  <p>Collaborate on canvas</p>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => setActiveTab("quizzes")}
                  disabled={!isMember}
                >
                  <span className="action-icon">📝</span>
                  <h4>Take Quiz</h4>
                  <p>Test your knowledge</p>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => setActiveTab("members")}
                >
                  <span className="action-icon">👥</span>
                  <h4>View Members</h4>
                  <p>See all group members</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Discussions Tab */}
        {activeTab === "discussions" && (
          <div className="discussions-content">
            <GroupThreadList
              groupId={groupId}
              isMember={isMember}
              onNewDiscussion={() => setShowDiscussionModal(true)}
              refreshToken={discussionsRefresh}
            />
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div className="members-content">
            <h3>Group Members</h3>
            <div className="members-grid">
              {members.length === 0 ? (
                <p className="no-data">No members yet.</p>
              ) : (
                members.map((member) => (
                  <div key={member._id || member} className="member-card">
                    <div className="member-avatar">
                      {member.displayName?.[0]?.toUpperCase() || 
                       member.username?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="member-info">
                      <h4>{member.displayName || member.username || "User"}</h4>
                      <p>@{member.username || "username"}</p>
                      {group.admins?.includes(member._id || member) && (
                        <span className="badge badge-admin">Admin</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          <div className="sessions-content">
            <div className="sessions-header">
              <h3>Study Sessions</h3>
              {isMember && (
                <button 
                  onClick={() => setShowSessionModal(true)}
                  className="btn btn-primary btn-small"
                >
                  + New Session
                </button>
              )}
            </div>
            <div className="sessions-list">
              <p className="no-data">No sessions scheduled yet. Start one to get going!</p>
            </div>
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === "quizzes" && (
          <div className="quizzes-content">
            <div className="quizzes-header">
              <h3>Group Quizzes</h3>
              {isMember && (
                <button 
                  onClick={() => navigate(`/groups/${groupId}/create-quiz`)}
                  className="btn btn-primary btn-small"
                >
                  + Create Quiz
                </button>
              )}
            </div>
            
            {loadingQuizzes ? (
              <div className="loading-spinner">Loading quizzes...</div>
            ) : quizzes.length === 0 ? (
              <div className="no-data">
                <p>No quizzes available yet.</p>
                {isMember && (
                  <button 
                    onClick={() => navigate(`/groups/${groupId}/create-quiz`)}
                    className="btn btn-primary"
                  >
                    Create First Quiz
                  </button>
                )}
              </div>
            ) : (
              <div className="quizzes-grid">
                {quizzes.map((quiz) => (
                  <div key={quiz._id} className="quiz-card">
                    <div className="quiz-card-header">
                      <h4>{quiz.title}</h4>
                      <span className={`badge badge-${quiz.difficulty}`}>
                        {quiz.difficulty}
                      </span>
                    </div>
                    
                    {quiz.description && (
                      <p className="quiz-description">{quiz.description}</p>
                    )}
                    
                    {/* Show schedule info if quiz is scheduled */}
                    {quiz.scheduledStartTime && quiz.scheduledEndTime && (
                      <div className="quiz-schedule">
                        <div className="schedule-item">
                          <span className="schedule-icon">📅</span>
                          <div className="schedule-text">
                            <small>Starts:</small>
                            <span>{new Date(quiz.scheduledStartTime).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="schedule-item">
                          <span className="schedule-icon">🔔</span>
                          <div className="schedule-text">
                            <small>Ends:</small>
                            <span>{new Date(quiz.scheduledEndTime).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="quiz-meta">
                      <span className="meta-item">
                        📝 {quiz.questions?.length || 0} questions
                      </span>
                      {quiz.timeLimit && (
                        <span className="meta-item">
                          ⏱️ {Math.floor(quiz.timeLimit / 60)} mins
                        </span>
                      )}
                      {quiz.isAIGenerated && (
                        <span className="meta-item">🤖 AI Generated</span>
                      )}
                    </div>
                    
                    <div className="quiz-actions">
                      <button 
                        onClick={() => navigate(`/groups/${groupId}/quiz/${quiz._id}`)}
                        className="btn btn-primary btn-small"
                      >
                        Take Quiz
                      </button>
                      <button 
                        onClick={() => navigate(`/groups/${groupId}/quiz/${quiz._id}/results`)}
                        className="btn btn-secondary btn-small"
                      >
                        View Results
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Start Session Modal */}
      {showSessionModal && (
        <div className="modal-overlay" onClick={() => setShowSessionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Start a New Session</h2>
              <button 
                className="modal-close"
                onClick={() => setShowSessionModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleStartSession} className="modal-form">
              <div className="form-group">
                <label htmlFor="sessionTitle">Session Title *</label>
                <input
                  type="text"
                  id="sessionTitle"
                  value={sessionData.title}
                  onChange={(e) => setSessionData({ ...sessionData, title: e.target.value })}
                  placeholder="e.g., Chapter 5 Study Session"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="sessionDescription">Description</label>
                <textarea
                  id="sessionDescription"
                  value={sessionData.description}
                  onChange={(e) => setSessionData({ ...sessionData, description: e.target.value })}
                  placeholder="What will you cover in this session?"
                  rows="4"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="sessionTime">Scheduled Time (Optional)</label>
                <input
                  type="datetime-local"
                  id="sessionTime"
                  value={sessionData.scheduledTime}
                  onChange={(e) => setSessionData({ ...sessionData, scheduledTime: e.target.value })}
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowSessionModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Start Discussion Modal */}
      {showDiscussionModal && (
        <div className="modal-overlay" onClick={() => setShowDiscussionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Start a Discussion</h2>
              <button 
                className="modal-close"
                onClick={() => setShowDiscussionModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleStartDiscussion} className="modal-form">
              <div className="form-group">
                <label htmlFor="discussionTitle">Discussion Title *</label>
                <input
                  type="text"
                  id="discussionTitle"
                  value={discussionData.title}
                  onChange={(e) => setDiscussionData({ ...discussionData, title: e.target.value })}
                  placeholder="e.g., How to solve problem X?"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="discussionContent">Content *</label>
                <textarea
                  id="discussionContent"
                  value={discussionData.content}
                  onChange={(e) => setDiscussionData({ ...discussionData, content: e.target.value })}
                  placeholder="Describe your question or topic in detail..."
                  rows="6"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="discussionTags">Tags (comma-separated)</label>
                <input
                  type="text"
                  id="discussionTags"
                  value={discussionData.tags}
                  onChange={(e) => setDiscussionData({ ...discussionData, tags: e.target.value })}
                  placeholder="e.g., math, calculus, homework"
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowDiscussionModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Discussion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
