const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
} = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');

// All message routes are protected
router.post('/', protect, sendMessage);
router.get('/:roomId', protect, getMessages);

module.exports = router; 