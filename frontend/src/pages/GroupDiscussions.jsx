import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function GroupDiscussions() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [discussionData, setDiscussionData] = useState({
    title: "",
    content: "",
    tags: "",
  });

  useEffect(() => {
    fetchGroupAndThreads();
  }, [groupId]);

  const fetchGroupAndThreads = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch group details
      const groupRes = await axios.get(`http://localhost:5000/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroup(groupRes.data);

      // Fetch threads for this group
      const threadsRes = await axios.get("http://localhost:5000/api/threads", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter threads by groupId
      const groupThreads = threadsRes.data.filter(thread => 
        thread.groupId === groupId || thread.groupId?._id === groupId
      );
      setThreads(groupThreads);
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load discussions.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartDiscussion = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const tagsArray = discussionData.tags.split(',').map(t => t.trim()).filter(t => t);
      
      await axios.post("http://localhost:5000/api/threads", {
        title: discussionData.title,
        content: discussionData.content,
        groupId: groupId,
        tags: tagsArray,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowCreateModal(false);
      setDiscussionData({ title: "", content: "", tags: "" });
      fetchGroupAndThreads();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create discussion thread");
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading discussions...</div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="page-container">
        <div className="error-message">{error || "Group not found"}</div>
        <Link to={`/groups/${groupId}`} className="btn btn-secondary">Back to Group</Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Link to={`/groups/${groupId}`} className="back-button">
            ← Back to Group
          </Link>
          <h1 className="page-title">{group.name} - Discussions</h1>
          <p className="page-subtitle">Join the conversation with your group members</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          💬 Start Discussion
        </button>
      </div>

      {/* Discussions List */}
      <div className="threads-list">
        {threads.length === 0 ? (
          <div className="no-data-card">
            <p className="no-data">No discussions yet. Start one to get the conversation going!</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              Create First Discussion
            </button>
          </div>
        ) : (
          threads.map((thread) => (
            <div 
              key={thread._id} 
              className="thread-card"
              onClick={() => navigate(`/thread/${thread._id}`)}
            >
              <div className="thread-header">
                <h3 className="thread-title">{thread.title}</h3>
                <span className="thread-date">
                  {new Date(thread.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <p className="thread-content">
                {thread.content?.substring(0, 150)}
                {thread.content?.length > 150 ? "..." : ""}
              </p>
              
              <div className="thread-footer">
                <div className="thread-meta">
                  <span className="thread-author">
                    By {thread.author?.username || thread.author?.displayName || "Anonymous"}
                  </span>
                  <span className="thread-stats">
                    💬 {thread.posts?.length || 0} replies
                  </span>
                  {thread.upvotes?.length > 0 && (
                    <span className="thread-stats">
                      👍 {thread.upvotes.length}
                    </span>
                  )}
                </div>
                
                {thread.tags && thread.tags.length > 0 && (
                  <div className="thread-tags">
                    {thread.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Start Discussion Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Start a Discussion</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
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
                  onClick={() => setShowCreateModal(false)}
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
