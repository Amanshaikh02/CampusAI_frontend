const express = require('express');
const router = express.Router();
const {
  searchUsers,
  getChatHistory,
  getConversations,
  sendMessage,
  markAsRead
} = require('../controllers/chatController');

// Search across all three roles (Admin, Faculty, Student)
router.get('/search', searchUsers);

// Recent conversations list
router.get('/conversations', getConversations);

// Chat history between current user and a target user
router.get('/history/:userId', getChatHistory);

// Send message (REST fallback + Socket emit)
router.post('/send', sendMessage);

// Mark messages as read
router.put('/read/:userId', markAsRead);

module.exports = router;
