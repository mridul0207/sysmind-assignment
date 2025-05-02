const express = require('express');
const router = express.Router();
const {
  accessRoom,
  createGroupRoom,
  getUserRooms,
  getRoomById,
} = require('../controllers/roomController');
const { protect } = require('../middlewares/authMiddleware');

// All room routes are protected
router.post('/', protect, accessRoom);
router.post('/group', protect, createGroupRoom);
router.get('/', protect, getUserRooms);
router.get('/:id', protect, getRoomById);

module.exports = router; 