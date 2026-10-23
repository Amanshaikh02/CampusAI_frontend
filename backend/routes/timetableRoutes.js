const express = require('express');
const router = express.Router();
const {
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  sendTimetable,
  getMyTimetable,
  getAllSentTimetables
} = require('../controllers/timetableController');
const { requireRole } = require('../middleware/auth');

// Timetable CRUD slots (Accessible to all authenticated users for viewing, admin for mutations)
router.get('/entries', getEntries);
router.post('/entries', requireRole('admin'), createEntry);
router.put('/entries/:id', requireRole('admin'), updateEntry);
router.delete('/entries/:id', requireRole('admin'), deleteEntry);

// Publish & history
router.post('/send', requireRole('admin'), sendTimetable);
router.get('/sent-history', requireRole('admin'), getAllSentTimetables);

// Student and faculty timetable view
router.get('/my-timetable', getMyTimetable);

module.exports = router;
