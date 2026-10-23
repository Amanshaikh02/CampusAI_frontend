const express = require('express');
const router = express.Router();
const {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
} = require('../controllers/academicController');
const { requireRole } = require('../middleware/auth');

router.get('/', getSubjects);
router.get('/:id', getSubjectById);
router.post('/', requireRole('admin'), createSubject);
router.put('/:id', requireRole('admin'), updateSubject);
router.delete('/:id', requireRole('admin'), deleteSubject);

module.exports = router;
