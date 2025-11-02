import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import api from "../utils/axios";
import { uploadFiles, generateQuiz, sendFollowUpQuery } from "../utils/aiKnowledgeApi";
import GroupThreadList from "../components/GroupThreadList";
import "./GroupDetail.css";

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
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [summaryResult, setSummaryResult] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [followUpAnswer, setFollowUpAnswer] = useState(null);
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (PDF, DOC, DOCX, TXT)
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a valid file (PDF, DOC, DOCX, or TXT)');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size should not exceed 10MB');
        return;
      }
      setSelectedFile(file);
      setSummaryResult(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setSummaryResult(null);
  };

  const handleSummarize = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setIsSummarizing(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Call the AI Knowledge API to upload and summarize
      const response = await uploadFiles([selectedFile]);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Extract summary for the uploaded file
      const summary = response.summaries[selectedFile.name];
      
      // Extract key points from summary (split by periods or bullet points)
      const keyPoints = summary
        .split(/[.!?]\s+/)
        .filter(point => point.trim().length > 20)
        .slice(0, 5)
        .map(point => point.trim());
      
      // Estimate word count and page count
      const wordCount = summary.split(/\s+/).length;
      const pageCount = Math.ceil(wordCount / 300); // ~300 words per page
      
      setSummaryResult({
        title: selectedFile.name,
        summary: summary,
        keyPoints: keyPoints.length > 0 ? keyPoints : [
          "Document successfully summarized",
          "Review the summary above for details"
        ],
        wordCount: wordCount,
        pageCount: pageCount,
      });
    } catch (err) {
      clearInterval(progressInterval);
      console.error("Summarization error:", err);
      alert(err.response?.data?.message || "Failed to summarize document. Please try again.");
      setUploadProgress(0);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateQuizFromSummary = async () => {
    if (!summaryResult) {
      alert('Please upload and summarize a document first');
      return;
    }

    const confirmed = window.confirm(
      'Generate a quiz with 1 questions based on the uploaded document?'
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      
      const response = await generateQuiz(
        1, // number of questions
        `Quiz: ${summaryResult.title}`,
        `Auto-generated quiz based on ${summaryResult.title}`,
        groupId // associate quiz with this group in backend
      );
      
      if (response.quiz && response.quiz.quizId) {
        alert('Quiz generated successfully!');
        // Navigate to the quizzes tab to show the new quiz
        setActiveTab('quizzes');
        fetchQuizzes(); // Refresh quiz list
      } else {
        alert(response.message || 'Could not generate quiz from the document');
      }
    } catch (err) {
      console.error("Quiz generation error:", err);
      alert(err.response?.data?.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAskFollowUp = async (e) => {
    e.preventDefault();
    
    if (!followUpQuestion.trim()) {
      alert('Please enter a question');
      return;
    }

    if (!summaryResult) {
      alert('Please upload and summarize a document first');
      return;
    }

    setIsLoadingAnswer(true);
    
    try {
      const response = await sendFollowUpQuery(followUpQuestion);
      
      const newConversation = {
        question: followUpQuestion,
        answer: response.response,
        timestamp: new Date().toISOString(),
      };
      
      setConversationHistory([...conversationHistory, newConversation]);
      setFollowUpAnswer(response.response);
      setFollowUpQuestion('');
    } catch (err) {
      console.error("Follow-up question error:", err);
      alert(err.response?.data?.message || 'Failed to get answer. Please try again.');
    } finally {
      setIsLoadingAnswer(false);
    }
  };

  const handleClearConversation = () => {
    setConversationHistory([]);
    setFollowUpAnswer(null);
    setFollowUpQuestion('');
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
        <button
          className={`tab-button ${activeTab === "summarizer" ? "active" : ""}`}
          onClick={() => setActiveTab("summarizer")}
        >
          📄 Summarizer
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

        {/* Summarizer Tab */}
        {activeTab === "summarizer" && (
          <div className="summarizer-content">
            <div className="summarizer-header">
              <h3>📄 Document Summarizer</h3>
              <p className="summarizer-description">
                Upload your documents and get AI-powered summaries with key points extracted.
              </p>
            </div>

            {!isMember ? (
              <div className="no-data">
                <p>You must be a member of this group to use the summarizer.</p>
                <button onClick={handleJoinGroup} className="btn btn-primary">
                  Join Group
                </button>
              </div>
            ) : (
              <div className="summarizer-container">
                {/* File Upload Section */}
                <div className="upload-section">
                  <div className="upload-card">
                    <div className="upload-icon">📤</div>
                    <h4>Upload Document</h4>
                    <p className="upload-hint">
                      Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)
                    </p>

                    {!selectedFile ? (
                      <div className="upload-area">
                        <input
                          type="file"
                          id="fileInput"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleFileSelect}
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="fileInput" className="upload-label">
                          <div className="upload-placeholder">
                            <span className="upload-placeholder-icon">📁</span>
                            <span>Click to browse or drag and drop</span>
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div className="selected-file-card">
                        <div className="file-info">
                          <div className="file-icon">
                            {selectedFile.type.includes('pdf') ? '📕' : 
                             selectedFile.type.includes('word') ? '📘' : '📄'}
                          </div>
                          <div className="file-details">
                            <h5 className="file-name">{selectedFile.name}</h5>
                            <p className="file-size">
                              {(selectedFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <button 
                            className="remove-file-btn"
                            onClick={handleRemoveFile}
                            disabled={isSummarizing}
                          >
                            ✕
                          </button>
                        </div>

                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="upload-progress">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                            <span className="progress-text">{uploadProgress}%</span>
                          </div>
                        )}

                        <button 
                          className="btn btn-primary btn-summarize"
                          onClick={handleSummarize}
                          disabled={isSummarizing}
                        >
                          {isSummarizing ? (
                            <>
                              <span className="spinner-small"></span>
                              Summarizing...
                            </>
                          ) : (
                            <>
                              ✨ Generate Summary
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tips Section */}
                  <div className="tips-card">
                    <h4>💡 Tips for Best Results</h4>
                    <ul className="tips-list">
                      <li>📄 Upload clear, text-based documents</li>
                      <li>📏 Longer documents may take more time to process</li>
                      <li>🎯 The AI will extract key points and main ideas</li>
                      <li>💾 Save important summaries for future reference</li>
                    </ul>
                  </div>
                </div>

                {/* Summary Results Section */}
                {summaryResult && (
                  <>
                    <div className="summary-results">
                      <div className="results-header">
                        <h3>📋 Summary Results</h3>
                        <div className="result-meta">
                          <span className="meta-badge">
                            📄 {summaryResult.pageCount} pages
                          </span>
                          <span className="meta-badge">
                            ✍️ {summaryResult.wordCount} words
                          </span>
                        </div>
                      </div>

                      <div className="summary-card">
                        <div className="summary-header-section">
                          <span className="summary-icon">📝</span>
                          <h4>Document: {summaryResult.title}</h4>
                        </div>
                        
                        <div className="summary-text">
                          <h5>Summary</h5>
                          <p>{summaryResult.summary}</p>
                        </div>

                        <div className="key-points-section">
                          <h5>🎯 Key Points</h5>
                          <ul className="key-points-list">
                            {summaryResult.keyPoints.map((point, index) => (
                              <li key={index}>
                                <span className="point-number">{index + 1}</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="summary-actions">
                          <button className="btn btn-secondary">
                            📥 Download Summary
                          </button>
                          <button className="btn btn-secondary">
                            📋 Copy to Clipboard
                          </button>
                          <button className="btn btn-primary" onClick={handleRemoveFile}>
                            ➕ Summarize Another
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Follow-Up Questions Section */}
                    <div className="followup-section">
                      <div className="followup-header">
                        <div className="followup-title-wrapper">
                          <h3>💭 Ask Follow-Up Questions</h3>
                          <p className="followup-subtitle">
                            Get AI-powered answers based on the summarized content
                          </p>
                        </div>
                        {conversationHistory.length > 0 && (
                          <button 
                            className="btn btn-secondary btn-small"
                            onClick={handleClearConversation}
                          >
                            🗑️ Clear History
                          </button>
                        )}
                      </div>

                      {/* Conversation History */}
                      {conversationHistory.length > 0 && (
                        <div className="conversation-history">
                          {conversationHistory.map((item, index) => (
                            <div key={index} className="conversation-item">
                              <div className="question-bubble">
                                <div className="bubble-header">
                                  <span className="bubble-icon">❓</span>
                                  <span className="bubble-label">Your Question</span>
                                </div>
                                <p>{item.question}</p>
                              </div>
                              <div className="answer-bubble">
                                <div className="bubble-header">
                                  <span className="bubble-icon">🤖</span>
                                  <span className="bubble-label">AI Answer</span>
                                </div>
                                <p>{item.answer}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ask Question Form */}
                      <div className="followup-form-card">
                        <form onSubmit={handleAskFollowUp} className="followup-form">
                          <div className="form-group-followup">
                            <label htmlFor="followUpQuestion">
                              Ask a question about the document
                            </label>
                            <div className="input-with-button">
                              <textarea
                                id="followUpQuestion"
                                value={followUpQuestion}
                                onChange={(e) => setFollowUpQuestion(e.target.value)}
                                placeholder="e.g., What are the main concepts discussed? Can you explain the methodology?"
                                rows="3"
                                disabled={isLoadingAnswer}
                                className="followup-textarea"
                              />
                              <button 
                                type="submit"
                                className="btn btn-primary btn-ask"
                                disabled={isLoadingAnswer || !followUpQuestion.trim()}
                              >
                                {isLoadingAnswer ? (
                                  <>
                                    <span className="spinner-small"></span>
                                    Getting Answer...
                                  </>
                                ) : (
                                  <>
                                    💬 Ask Question
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </form>

                        {/* Suggested Questions */}
                        {conversationHistory.length === 0 && (
                          <div className="suggested-questions">
                            <h5>💡 Suggested Questions:</h5>
                            <div className="suggestion-chips">
                              <button 
                                className="suggestion-chip"
                                onClick={() => setFollowUpQuestion("What are the main topics covered in this document?")}
                                disabled={isLoadingAnswer}
                              >
                                What are the main topics?
                              </button>
                              <button 
                                className="suggestion-chip"
                                onClick={() => setFollowUpQuestion("Can you explain the key concepts in simpler terms?")}
                                disabled={isLoadingAnswer}
                              >
                                Explain key concepts
                              </button>
                              <button 
                                className="suggestion-chip"
                                onClick={() => setFollowUpQuestion("What are the practical applications mentioned?")}
                                disabled={isLoadingAnswer}
                              >
                                Practical applications
                              </button>
                              <button 
                                className="suggestion-chip"
                                onClick={() => setFollowUpQuestion("What should I focus on for better understanding?")}
                                disabled={isLoadingAnswer}
                              >
                                What to focus on?
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="followup-tip">
                        <span className="tip-icon">💡</span>
                        <p>
                          Ask specific questions to get detailed answers about the document content
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* History Section (Placeholder) */}
                {!summaryResult && selectedFile === null && (
                  <div className="history-section">
                    <h4>📚 Recent Summaries</h4>
                    <div className="no-data">
                      <p>No summaries yet. Upload a document to get started!</p>
                    </div>
                  </div>
                )}

                {/* Create Quiz Section */}
                <div className="create-quiz-section">
                  <div className="create-quiz-card">
                    <div className="create-quiz-content">
                      <div className="quiz-icon-large">📝</div>
                      <div className="quiz-text">
                        <h4>Generate Quiz from Summary</h4>
                        <p>Create an AI-powered quiz based on the document summary to test understanding</p>
                      </div>
                    </div>
                    <button 
                      className="btn btn-primary btn-create-quiz"
                      onClick={handleGenerateQuizFromSummary}
                      disabled={!summaryResult}
                    >
                      ➕ Create Quiz
                    </button>
                  </div>
                </div>

                {/* Get Feedback Section */}
                <div className="feedback-section">
                  <div className="feedback-header">
                    <div className="feedback-title-wrapper">
                      <h3>💬 Get Feedback on Quiz Results</h3>
                      <p className="feedback-subtitle">Review your performance and get personalized insights</p>
                    </div>
                  </div>

                  <div className="feedback-content">
                    <div className="feedback-card">
                      <div className="feedback-card-header">
                        <div className="feedback-icon-wrapper">
                          <span className="feedback-icon">📊</span>
                        </div>
                        <div className="feedback-info">
                          <h4>Performance Analysis</h4>
                          <p>Get detailed breakdown of your quiz performance</p>
                        </div>
                      </div>
                      <div className="feedback-stats">
                        <div className="feedback-stat-item">
                          <span className="stat-icon">✅</span>
                          <div className="stat-content">
                            <span className="stat-label">Accuracy</span>
                            <span className="stat-placeholder">--</span>
                          </div>
                        </div>
                        <div className="feedback-stat-item">
                          <span className="stat-icon">⏱️</span>
                          <div className="stat-content">
                            <span className="stat-label">Time Taken</span>
                            <span className="stat-placeholder">--</span>
                          </div>
                        </div>
                        <div className="feedback-stat-item">
                          <span className="stat-icon">🎯</span>
                          <div className="stat-content">
                            <span className="stat-label">Score</span>
                            <span className="stat-placeholder">--</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="feedback-card">
                      <div className="feedback-card-header">
                        <div className="feedback-icon-wrapper">
                          <span className="feedback-icon">🤖</span>
                        </div>
                        <div className="feedback-info">
                          <h4>AI-Powered Insights</h4>
                          <p>Get personalized recommendations to improve</p>
                        </div>
                      </div>
                      <div className="feedback-insights">
                        <div className="insight-item">
                          <span className="insight-badge">💡 Tip</span>
                          <p>Take quizzes after reviewing the summary for better retention</p>
                        </div>
                        <div className="insight-item">
                          <span className="insight-badge">📈 Improvement</span>
                          <p>Focus on areas where you scored below 70%</p>
                        </div>
                        <div className="insight-item">
                          <span className="insight-badge">🎓 Strength</span>
                          <p>You excel in conceptual understanding questions</p>
                        </div>
                      </div>
                    </div>

                    <div className="feedback-card">
                      <div className="feedback-card-header">
                        <div className="feedback-icon-wrapper">
                          <span className="feedback-icon">📝</span>
                        </div>
                        <div className="feedback-info">
                          <h4>Detailed Question Review</h4>
                          <p>See which questions you got right or wrong</p>
                        </div>
                      </div>
                      <div className="feedback-cta">
                        <button className="btn btn-primary btn-full">
                          View Detailed Feedback
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="feedback-note">
                    <span className="note-icon">ℹ️</span>
                    <p>Complete a quiz to see your personalized feedback and insights</p>
                  </div>
                </div>
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
