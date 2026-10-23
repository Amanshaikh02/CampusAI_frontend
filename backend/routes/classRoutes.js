const express = require('express');
const router = express.Router();
const {
  getClasses,
  createClass,
  deleteClass
} = require('../controllers/academicController');
const { requireRole } = require('../middleware/auth');

router.get('/', getClasses);
router.post('/', requireRole('admin'), createClass);
router.delete('/:id', requireRole('admin'), deleteClass);

module.exports = router;
