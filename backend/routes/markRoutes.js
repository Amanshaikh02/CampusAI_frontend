const express = require('express');
const router = express.Router();
const {
  getMarks,
  createMark,
  bulkSaveMarks,
  sendMarksheetEmail,
  deleteMark
} = require('../controllers/markController');
const {
  getStudentPerformanceAnalytics,
  getFacultySubjectsAnalytics,
  getFacultySubjectStudentsAnalytics,
  searchStudentsForAnalytics
} = require('../controllers/analyticsController');
const { protect, requireRole } = require('../middleware/auth');

// Student Performance Analytics Routes
router.get('/analytics/student-performance', protect, getStudentPerformanceAnalytics);
router.get(
  '/analytics/faculty-subjects',
  protect,
  requireRole('faculty', 'teacher', 'admin'),
  getFacultySubjectsAnalytics
);
router.get(
  '/analytics/faculty-students',
  protect,
  requireRole('faculty', 'teacher', 'admin'),
  getFacultySubjectStudentsAnalytics
);
router.get(
  '/analytics/search-students',
  protect,
  requireRole('faculty', 'teacher', 'admin'),
  searchStudentsForAnalytics
);

// Standard Mark Management Routes
router.get('/', protect, getMarks);
router.post('/', protect, requireRole('faculty', 'teacher', 'admin'), createMark);
router.post('/bulk', protect, requireRole('faculty', 'teacher', 'admin'), bulkSaveMarks);
router.post('/send-email', protect, requireRole('faculty', 'teacher', 'admin'), sendMarksheetEmail);
router.delete('/:id', protect, requireRole('faculty', 'teacher', 'admin'), deleteMark);

module.exports = router;
