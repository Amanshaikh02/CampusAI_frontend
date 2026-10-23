const express = require('express');
const router = express.Router();
const { searchUsers, getStudentInsights } = require('../controllers/searchController');
const { protect } = require('../middleware/auth');

// Flexible middleware: verifies JWT session when Bearer token is passed, allows query otherwise
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return protect(req, res, next);
  }
  next();
};

// @route   GET /api/search/student-insights
// @desc    Aggregation query returning exact counts of students grouped by Department -> Semester -> Division
// @access  Public / Authenticated
router.get('/student-insights', optionalAuth, getStudentInsights);

// @route   GET /api/search
// @desc    Dynamic search for students and faculty with filters
// @access  Public / Authenticated
router.get('/', optionalAuth, searchUsers);

module.exports = router;

