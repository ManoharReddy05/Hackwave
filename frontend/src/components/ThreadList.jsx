import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axios";
import "./ThreadList.css";

export default function ThreadList() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/threads")
    .then(res => {
      // Filter to show only general discussions (not group-specific)
      const generalThreads = res.data.filter(thread => !thread.groupId);
      // const generalThreads = res.data;
      setThreads(generalThreads);
      setLoading(false);
    })
    .catch(err => {
      console.error("Error loading threads:", err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading discussions...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">General Discussion Threads</h1>
          <p className="page-subtitle">Join the conversation and share your ideas with everyone</p>
        </div>
        <Link to="/create" className="btn btn-primary">
          + New Thread
        </Link>
      </div>

      <div className="thread-list">
        {threads.length === 0 ? (
          <p className="no-data">No threads yet. Be the first to create one!</p>
        ) : (
          threads.map(t => (
            <Link
              to={`/thread/${t._id}`}
              key={t._id}
              className="thread-card"
            >
              <h2>{t.title}</h2>
              {t.content && (
                <p className="thread-preview">
                  {t.content.length > 120 ? t.content.slice(0, 120) + "..." : t.content}
                </p>
              )}
              <small className="thread-meta">
                {t.author?.username || t.author?.displayName || t.author || "Anonymous"} • {new Date(t.createdAt).toLocaleString()}
              </small>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
