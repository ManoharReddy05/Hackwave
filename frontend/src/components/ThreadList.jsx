import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./ThreadList.css"; // ✅ add this

export default function ThreadList() {
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    axios.get("/api/threads").then(res => setThreads(res.data));
  }, []);

  return (
    <div className="thread-list-container">
      <div className="thread-list-header">
        <h1>Discussion Threads</h1>
        <Link to="/create" className="new-thread-btn">
          + New Thread
        </Link>
      </div>

      <div className="thread-list">
        {threads.length === 0 ? (
          <p className="no-threads">No threads yet. Be the first to create one!</p>
        ) : (
          threads.map(t => (
            <Link
              to={`/thread/${t._id}`}
              key={t._id}
              className="thread-card"
            >
              <h2>{t.title}</h2>
              {/* ✅ Display thread content preview */}
              {t.content && (
                <p className="thread-preview">
                  {t.content.length > 120 ? t.content.slice(0, 120) + "..." : t.content}
                </p>
              )}
              <small className="thread-meta">
                {t.author} • {new Date(t.createdAt).toLocaleString()}
              </small>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
