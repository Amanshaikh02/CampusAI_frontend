const express = require('express');
const router = express.Router();
const {
  getEvents,
  createEvent,
  deleteEvent
} = require('../controllers/eventController');
const { requireRole } = require('../middleware/auth');

router.get('/', getEvents);
router.post('/', requireRole('admin'), createEvent);
router.delete('/:id', requireRole('admin'), deleteEvent);

module.exports = router;
