import Post from "../models/Post.js";

// Add a post or reply
export const addPost = async (req, res) => {
  const { threadId, content, author, parentPostId = null } = req.body;
  const post = await Post.create({ threadId, content, author, parentPostId });
  res.status(201).json(post);
};

// Get posts for a thread
export const getPostsByThread = async (req, res) => {
  const { threadId } = req.params;
  const posts = await Post.find({ threadId }).sort({ createdAt: 1 });
  res.json(posts);
};
// Delete a post
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    await Post.findByIdAndDelete(id);
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting post", error });
  }
};
