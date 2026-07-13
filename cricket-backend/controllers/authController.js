const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy_client_id');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: "30d",
  });
};

exports.signup = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const user = await User.create({ username: username || name, email, password });
    
    res.status(201).json({
      message: "User created successfully",
      user: { id: user._id, email: user.email, username: user.username, role: user.role },
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found. Please sign up." });
    }

    const isMatch = user.matchPassword ? await user.matchPassword(password) : await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    res.json({
      message: "Login successful",
      user: { id: user._id, email: user.email, username: user.username, role: user.role },
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    let payload;

    if (process.env.GOOGLE_CLIENT_ID) {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } else {
      // For development/testing without real client ID, we can decode jwt or handle differently.
      // But typically, we expect a real flow. Let's just decode the jwt payload natively here for mock purposes if no client id is set.
      payload = jwt.decode(token);
    }

    const { email, name, sub } = payload;
    let user = await User.findOne({ email });

    if (!user) {
      // Creating a new user via Google
      // We generate a dummy password for oauth users
      const dummyPassword = await bcrypt.hash(sub + email + process.env.JWT_SECRET, 10);
      user = await User.create({ 
        username: name || email.split('@')[0], 
        email, 
        password: dummyPassword 
      });
    }

    res.json({
      message: "Google login successful",
      user: { id: user._id, email: user.email, username: user.username, role: user.role },
      token: generateToken(user._id)
    });
  } catch (err) {
    console.error("Google Login Error:", err);
    res.status(500).json({ message: "Failed to authenticate with Google", error: err.message });
  }
};
