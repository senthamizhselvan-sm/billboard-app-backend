const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

const JWT_SECRET = "your_secret_here"; // Move to .env in production

// Register
router.post("/register", async (req, res) => {
  try {
    console.log("Registration attempt:", req.body);
    const { username, password, role } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: "Username already exists" });

    const user = new User({ username, password, role });
    await user.save();
    console.log("User registered successfully:", username);
    res.json({ success: true, message: "User registered" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

    res.json({
      success: true,
      token,
      user: { id: user._id, username: user.username, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Forgot Password - Reset to temporary password
router.post("/forgot-password", async (req, res) => {
  try {
    console.log("Forgot password attempt:", req.body);
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    user.password = tempPassword;
    await user.save();
    
    console.log("Password reset for user:", username);
    res.json({ 
      success: true, 
      message: "Password reset successfully",
      tempPassword: tempPassword  // In production, send via email instead
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Change Password
router.post("/change-password", async (req, res) => {
  try {
    console.log("Change password attempt:", req.body);
    const { username, currentPassword, newPassword } = req.body;
    
    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const match = await user.comparePassword(currentPassword);
    if (!match) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update to new password
    user.password = newPassword;
    await user.save();
    
    console.log("Password changed for user:", username);
    res.json({ 
      success: true, 
      message: "Password changed successfully"
    });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
