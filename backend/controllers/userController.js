const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret_key', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400);
      throw new Error('Please include all fields');
    }

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        isOnline: user.isOnline,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Update online status
      user.isOnline = true;
      await user.save();

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        isOnline: user.isOnline,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        isOnline: user.isOnline,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/users/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    // Update online status
    const user = await User.findById(req.user._id);
    if (user) {
      user.isOnline = false;
      await user.save();
      res.json({ message: 'Logged out successfully' });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  getUsers,
  logoutUser,
}; 