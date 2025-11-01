import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export default function CreateThread() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${BASE_URL}/api/threads`, 
        { title, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate("/threads");
    } catch (err) {
      console.error("Failed to create thread:", err);
      setError(err.response?.data?.message || "Failed to create thread");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="auth-card" style={{ maxWidth: "800px", margin: "2rem auto" }}>
        <h2 className="auth-title">Create a New Thread</h2>
        <p className="auth-subtitle">Start a new discussion topic</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="title">Thread Title *</label>
            <input
              type="text"
              id="title"
              placeholder="Enter an engaging title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              placeholder="Share your thoughts, questions, or ideas..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={8}
              required
              disabled={loading}
            />
          </div>

          <div className="modal-actions">
            <Link to="/threads" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Thread"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
