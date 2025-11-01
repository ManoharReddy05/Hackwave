import Thread from "../models/Thread.js";
import Post from "../models/Post.js";

// Get all threads
export const getThreads = async (req, res) => {
  try {
    const { groupId } = req.query;
    
    let query = {};
    if (groupId) {
      query.groupId = groupId;
    }
    
    const threads = await Thread.find(query)
      .populate('author', 'username displayName')
      .populate('groupId', 'name')
      .sort({ createdAt: -1 });
    res.json(threads);
  } catch (error) {
    res.status(500).json({ message: "Error fetching threads", error });
  }
};

// Create a new thread
export const createThread = async (req, res) => {
  try {
    const { title, content, groupId, tags } = req.body;
    const author = req.user.id;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required." });
    }

    const thread = await Thread.create({ 
      title, 
      content, 
      author,
      groupId: groupId || null,
      tags: tags || []
    });
    
    const populatedThread = await Thread.findById(thread._id)
      .populate('author', 'username displayName')
      .populate('groupId', 'name');
    
    res.status(201).json(populatedThread);
  } catch (error) {
    res.status(500).json({ message: "Error creating thread", error });
  }
};

// Get a thread with all its posts
export const getThreadWithPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const thread = await Thread.findById(id)
      .populate('author', 'username displayName')
      .populate('groupId', 'name');

    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    const posts = await Post.find({ threadId: id })
      .populate('author', 'username displayName')
      .sort({ createdAt: 1 });

    // Optional: build nested structure if using replies
    const buildNestedPosts = (postsArr, parentId = null) =>
      postsArr
        .filter(p => String(p.parentPostId) === String(parentId))
        .map(p => ({
          ...p._doc,
          replies: buildNestedPosts(postsArr, p._id),
        }));

    const nestedPosts = buildNestedPosts(posts);
    res.json({ thread, posts: nestedPosts });
  } catch (error) {
    res.status(500).json({ message: "Error fetching thread", error });
  }
};
// Delete a thread and its posts
export const deleteThreadWithPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const thread = await Thread.findById(id); 
    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }
    
    await Post.deleteMany({ threadId: id });
    await Thread.findByIdAndDelete(id);
    res.json({ message: "Thread deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting thread", error });
  }
};
