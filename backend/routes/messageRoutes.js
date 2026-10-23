const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  markMessageRead,
  deleteMessage
} = require('../controllers/messageController');

router.route('/')
  .get(getMessages)
  .post(sendMessage);

router.route('/:id/read')
  .put(markMessageRead);

router.route('/:id')
  .put(markMessageRead)
  .delete(deleteMessage);

module.exports = router;
