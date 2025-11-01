import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function CreateThread() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError(""); // clear any old error

    try {
      // Send both title and content to backend
      await axios.post("/api/threads", { title, content });
      navigate("/");
    } catch (err) {
      console.error("Failed to create thread:", err);
      setError(err.response?.data?.message || "Failed to create thread");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        maxWidth: "600px",
        margin: "2rem auto",
      }}
    >
      <h2>Create a New Thread</h2>

      {error && (
        <div style={{ color: "red", fontWeight: "bold" }}>
          {error}
        </div>
      )}

      <input
        type="text"
        placeholder="Enter thread title..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
        style={{
          padding: "0.5rem",
          fontSize: "1rem",
        }}
      />

      <textarea
        placeholder="Write something about your thread..."
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={6}
        required
        style={{
          padding: "0.5rem",
          fontSize: "1rem",
          resize: "vertical",
        }}
      />

      <button
        type="submit"
        style={{
          padding: "0.6rem 1rem",
          fontSize: "1rem",
          cursor: "pointer",
        }}
      >
        Create Thread
      </button>
    </form>
  );
}
