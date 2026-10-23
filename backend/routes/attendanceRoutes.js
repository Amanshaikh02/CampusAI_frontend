const express = require('express');
const router = express.Router();
const {
  getMySubjects,
  getSubjectRoster,
  saveAttendanceSession,
  getMyAttendance,
  getAllAssignments,
  createFacultyAssignment,
  getAttendance,
  createAttendance,
  deleteAttendance
} = require('../controllers/attendanceController');
const { protect, requireRole } = require('../middleware/auth');

// Faculty & Admin: Assigned subjects
router.get('/my-subjects', protect, requireRole('faculty', 'teacher', 'admin'), getMySubjects);

// Faculty & Admin: Roster for an assigned subject on a specific date
router.get('/roster', protect, requireRole('faculty', 'teacher', 'admin'), getSubjectRoster);

// Faculty & Admin: Save/Update daily attendance session
router.post('/session', protect, requireRole('faculty', 'teacher', 'admin'), saveAttendanceSession);

// Student: Subject-wise attendance summary & daily history
router.get('/my', protect, requireRole('student', 'admin'), getMyAttendance);

// Admin: Academic subject mappings
router.get('/assignments', protect, requireRole('admin', 'faculty', 'teacher'), getAllAssignments);
router.post('/assignments', protect, requireRole('admin'), createFacultyAssignment);

// Legacy routes (backward compatibility)
router.get('/', protect, getAttendance);
router.post('/', protect, requireRole('faculty', 'teacher', 'admin'), createAttendance);
router.delete('/:id', protect, requireRole('faculty', 'teacher', 'admin'), deleteAttendance);

module.exports = router;
