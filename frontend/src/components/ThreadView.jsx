import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/axios";
import "./ThreadView.css";

export default function ThreadView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comment, setComment] = useState("");
  const [replyContent, setReplyContent] = useState({});
  const [collapsedPosts, setCollapsedPosts] = useState({}); // Track collapsed state

  const countReplies = (post) => {
    if (!post.replies || post.replies.length === 0) return 0;
    return post.replies.length + post.replies.reduce((sum, p) => sum + countReplies(p), 0);
  };

  // Helper to format reply count text
  const formatReplyText = (count) => {
    if (count === 0) return "No replies";
    if (count === 1) return "1 reply";
    return `${count} replies`;
  };

  useEffect(() => {
    // Guard: if no token, redirect to login
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    api.get(`/threads/${id}`)
      .then(res => {
        setThread(res.data.thread);
        setPosts(res.data.posts);
      })
      .catch(err => console.error(err));
  }, [id]);

  const handleAddComment = async e => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const res = await api.post("/posts", { threadId: id, content: comment });
      setPosts([...posts, res.data]);
      setComment("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddReply = async (parentPostId) => {
    const content = replyContent[parentPostId];
    if (!content?.trim()) return;
    try {
      const res = await api.post("/posts", { threadId: id, content, parentPostId });
      const insertReply = (postsArr) => postsArr.map(p => {
        if (p._id === parentPostId) return { ...p, replies: [...(p.replies || []), res.data] };
        if (p.replies) return { ...p, replies: insertReply(p.replies) };
        return p;
      });
      setPosts(insertReply(posts));
      setReplyContent({ ...replyContent, [parentPostId]: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCollapse = (postId) => {
    setCollapsedPosts({ ...collapsedPosts, [postId]: !collapsedPosts[postId] });
  };

  const renderPosts = (postsArr, level = 0) => {
    return postsArr.map(post => (
      <div key={post._id} className="comment" style={{ marginLeft: level * 20 }}>
        <p>{post.content}</p>
        <small>
          By {post.author?.username || post.author?.displayName || post.author || "Anonymous"}
        </small>

        {post.replies && post.replies.length > 0 && (
  <button className="collapse-btn" onClick={() => toggleCollapse(post._id)}>
    {collapsedPosts[post._id]
      ? `Show ${formatReplyText(countReplies(post))}`
      : "Hide replies"}
  </button>
)}


        {!collapsedPosts[post._id] && post.replies && post.replies.length > 0 && (
          <div className="comment-replies">
            {renderPosts(post.replies, level + 1)}
          </div>
        )}

        <div className="reply-form">
          <input
            type="text"
            placeholder="Reply..."
            value={replyContent[post._id] || ""}
            onChange={e => setReplyContent({ ...replyContent, [post._id]: e.target.value })}
          />
          <button type="button" onClick={() => handleAddReply(post._id)}>Reply</button>
        </div>
      </div>
    ));
  };

  if (!thread) return <div className="thread-container">Loading...</div>;

  return (
    <div className="thread-container">
      <h1>{thread.title}</h1>
      <p className="thread-author">
        By {thread.author?.username || thread.author?.displayName || thread.author || "Anonymous"}
      </p>
      <p className="thread-content">{thread.content}</p>
      <div className="comments-section">
        <h2>Comments</h2>
        {renderPosts(posts)}
      </div>

      <form className="add-comment-form" onSubmit={handleAddComment}>
        <input
          type="text"
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Add a comment..."
          required
        />
        <button type="submit">Post</button>
      </form>
    </div>
  );
}
