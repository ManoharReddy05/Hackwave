import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axios";
import "./ThreadList.css";

export default function GroupThreadList({ groupId, isMember = false, onNewDiscussion, refreshToken }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    api
      .get("/threads", { params: { groupId } })
      .then((res) => {
        if (ignore) return;
        setThreads(res.data || []);
      })
      .catch((err) => {
        if (ignore) return;
        console.error("Error loading group threads:", err);
        setError("Failed to load discussions.");
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [groupId, refreshToken]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading discussions...</div>
      </div>
    );
  }

  return (
    <div className="threads-list">
      <div className="discussions-header">
        <h3>Group Discussions</h3>
        {isMember && (
          <button className="btn btn-primary btn-small" onClick={onNewDiscussion}>
            💬 New Discussion
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {threads.length === 0 ? (
        <div className="no-data-card">
          <p className="no-data">
            No discussions yet in this group. Start one to get the conversation going!
          </p>
          {isMember && (
            <button className="btn btn-primary" onClick={onNewDiscussion}>
              Create First Discussion
            </button>
          )}
        </div>
      ) : (
        threads.map((t) => (
          <Link to={`/thread/${t._id}`} key={t._id} className="thread-card">
            <div className="thread-header">
              <h3 className="thread-title">{t.title}</h3>
              <span className="thread-date">{new Date(t.createdAt).toLocaleDateString()}</span>
            </div>
            {t.content && (
              <p className="thread-content">
                {t.content.length > 150 ? t.content.slice(0, 150) + "..." : t.content}
              </p>
            )}
            <div className="thread-footer">
              <div className="thread-meta">
                <span className="thread-author">
                  By {t.author?.username || t.author?.displayName || t.author || "Anonymous"}
                </span>
                <span className="thread-stats">💬 {t.posts?.length || 0} replies</span>
                {t.upvotes?.length > 0 && (
                  <span className="thread-stats">👍 {t.upvotes.length}</span>
                )}
              </div>
              {t.tags && t.tags.length > 0 && (
                <div className="thread-tags">
                  {t.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
