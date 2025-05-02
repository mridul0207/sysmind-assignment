const Message = require('../models/messageModel');
const User = require('../models/userModel');
const Room = require('../models/roomModel');

const sendMessage = async (req, res) => {
  try {
    const { content, roomId } = req.body;

    if (!content || !roomId) {
      res.status(400);
      throw new Error('Please provide all fields');
    }

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404);
      throw new Error('Room not found');
    }

    // Check if user is in room
    if (!room.users.includes(req.user._id)) {
      res.status(403);
      throw new Error('You are not a member of this room');
    }

    // Create message
    const newMessage = await Message.create({
      sender: req.user._id,
      content,
      roomId,
    });

    // Update latest message
    await Room.findByIdAndUpdate(roomId, { latestMessage: newMessage._id });

    const message = await Message.findById(newMessage._id)
      .populate('sender', 'username email')
      .populate('roomId');

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get messages for a room
// @route   GET /api/messages/:roomId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404);
      throw new Error('Room not found');
    }

    // Check if user is in room
    if (!room.users.includes(req.user._id)) {
      res.status(403);
      throw new Error('You are not a member of this room');
    }

    const messages = await Message.find({ roomId })
      .populate('sender', 'username email')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  sendMessage,
  getMessages,
}; 