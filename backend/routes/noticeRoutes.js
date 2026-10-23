const express = require('express');
const router = express.Router();
const {
  getNotices,
  createNotice,
  deleteNotice
} = require('../controllers/noticeController');
const { requireRole } = require('../middleware/auth');

router.get('/', getNotices);
router.post('/', requireRole('faculty', 'teacher', 'admin'), createNotice);
router.delete('/:id', requireRole('faculty', 'teacher', 'admin'), deleteNotice);

module.exports = router;
