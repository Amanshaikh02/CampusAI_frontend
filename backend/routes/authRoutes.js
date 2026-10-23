const express = require('express');
const router = express.Router();
const {
  registerStudent,
  registerFaculty,
  login,
  loginAdmin,
  loginFaculty,
  loginStudent,
  refresh,
  getMe,
  logout,
  logoutAll,
  getStudents,
  getFaculty
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Public authentication routes
router.post('/register-student', registerStudent);
router.post('/register-faculty', registerFaculty);
router.post('/login', login);
router.post('/login/admin', loginAdmin);
router.post('/login/faculty', loginFaculty);
router.post('/login/student', loginStudent);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected routes (require valid JWT access token)
router.get('/me', authMiddleware, getMe);
router.post('/logout-all', authMiddleware, logoutAll);
router.get('/students', authMiddleware, getStudents);
router.get('/faculty', authMiddleware, getFaculty);

module.exports = router;
