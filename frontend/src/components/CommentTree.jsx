import { useState } from "react";
import axios from "axios";

export default function CommentTree({ comments, threadId, parentId = null }) {
  const [replying, setReplying] = useState(null);
  const [replyContent, setReplyContent] = useState("");

  const handleReply = async (parentId) => {
    const res = await axios.post("/api/posts", {
      threadId,
      parentId,
      content: replyContent,
    });
    window.location.reload(); 
  };

  return (
    <div >
      {comments.map(c => (
        <div key={c._id}>
          <p>{c.content}</p>
          <button
            onClick={() => setReplying(replying === c._id ? null : c._id)}
          >
            Reply
          </button>

          {replying === c._id && (
            <div>
              <textarea
                rows="2"
                onChange={e => setReplyContent(e.target.value)}
              />
              <button
                onClick={() => handleReply(c._id)}
              >
                Submit Reply
              </button>
            </div>
          )}

          {c.replies?.length > 0 && (
            <CommentTree
              comments={c.replies}
              threadId={threadId}
              parentId={c._id}
            />
          )}
        </div>
      ))}
    </div>
  );
}
