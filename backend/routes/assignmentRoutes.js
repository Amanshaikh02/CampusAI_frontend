const express = require('express');
const router = express.Router();
const {
  getAssignments,
  getTeachersForStudent,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getMySubmission,
  getAssignmentSubmissions,
  reviewSubmission
} = require('../controllers/assignmentController');
const { requireRole } = require('../middleware/auth');

// 1. Teachers list for student (Teacher-first assignment view)
router.get('/teachers', requireRole('student'), getTeachersForStudent);

// 2. Submission grading & review route
router.put('/submissions/:submissionId/review', requireRole('faculty', 'teacher', 'admin'), reviewSubmission);

// 3. Main Assignment collection routes
router.get('/', getAssignments);
router.get('/:id', getAssignmentById);
router.post('/', requireRole('faculty', 'teacher', 'admin'), createAssignment);
router.put('/:id', requireRole('faculty', 'teacher', 'admin'), updateAssignment);
router.delete('/:id', requireRole('faculty', 'teacher', 'admin'), deleteAssignment);

// 4. Student Submission routes
router.post('/:id/submit', requireRole('student'), submitAssignment);
router.get('/:id/my-submission', requireRole('student'), getMySubmission);
router.get('/:id/submissions', requireRole('faculty', 'teacher', 'admin'), getAssignmentSubmissions);

module.exports = router;
