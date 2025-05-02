const Room = require('../models/roomModel');
const User = require('../models/userModel');

// @desc    Create or fetch One to One Room
// @route   POST /api/rooms
// @access  Private
const accessRoom = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400);
      throw new Error('UserId is required');
    }

    // Check if room exists
    let room = await Room.find({
      isGroup: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate('users', '-password')
      .populate('latestMessage');

    room = await User.populate(room, {
      path: 'latestMessage.sender',
      select: 'username email',
    });

    if (room.length > 0) {
      res.json(room[0]);
    } else {
      // Create new room
      const newRoom = await Room.create({
        name: 'oneOnOne',
        isGroup: false,
        users: [req.user._id, userId],
      });

      const fullRoom = await Room.findOne({ _id: newRoom._id }).populate(
        'users',
        '-password'
      );

      res.status(201).json(fullRoom);
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create Group Room
// @route   POST /api/rooms/group
// @access  Private
const createGroupRoom = async (req, res) => {
  try {
    const { name, users } = req.body;

    if (!name || !users) {
      res.status(400);
      throw new Error('Please provide all fields');
    }

    // Parse users
    let usersList = JSON.parse(users);

    if (usersList.length < 2) {
      res.status(400);
      throw new Error('Group should have at least 3 users (including you)');
    }

    // Add current user to the group
    usersList.push(req.user._id);

    // Create new group
    const groupRoom = await Room.create({
      name,
      isGroup: true,
      users: usersList,
      groupAdmin: req.user._id,
    });

    const fullGroupRoom = await Room.findOne({ _id: groupRoom._id })
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.status(201).json(fullGroupRoom);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all user's rooms
// @route   GET /api/rooms
// @access  Private
const getUserRooms = async (req, res) => {
  try {
    let rooms = await Room.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate('users', '-password')
      .populate('groupAdmin', '-password')
      .populate('latestMessage')
      .sort({ updatedAt: -1 });

    rooms = await User.populate(rooms, {
      path: 'latestMessage.sender',
      select: 'username email',
    });

    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get room by ID
// @route   GET /api/rooms/:id
// @access  Private
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    if (!room) {
      res.status(404);
      throw new Error('Room not found');
    }

    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  accessRoom,
  createGroupRoom,
  getUserRooms,
  getRoomById,
}; 