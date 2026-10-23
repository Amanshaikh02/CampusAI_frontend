const express = require('express');
const router = express.Router();
const {
  getStudentPerformanceAnalytics,
  getFacultySubjectsAnalytics,
  getFacultySubjectStudentsAnalytics,
  searchStudentsForAnalytics
} = require('../controllers/analyticsController');
const { protect, requireRole } = require('../middleware/auth');

// Direct Analytics Routes (/api/analytics/...)
router.get('/student-performance', protect, getStudentPerformanceAnalytics);
router.get('/faculty-subjects', protect, requireRole('faculty', 'teacher', 'admin'), getFacultySubjectsAnalytics);
router.get('/faculty-students', protect, requireRole('faculty', 'teacher', 'admin'), getFacultySubjectStudentsAnalytics);
router.get('/search-students', protect, requireRole('faculty', 'teacher', 'admin'), searchStudentsForAnalytics);

module.exports = router;
