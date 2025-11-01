// src/controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
};

export const register = async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: "Missing fields" });

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ message: "User with that email or username already exists" });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({ username, email, passwordHash, displayName });
    await user.save();

    const token = signToken(user._id);
    res.status(201).json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = signToken(user._id);
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
