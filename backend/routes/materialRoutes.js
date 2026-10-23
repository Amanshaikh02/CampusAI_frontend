const express = require('express');
const router = express.Router();
const {
  getMaterials,
  createMaterial,
  deleteMaterial
} = require('../controllers/materialController');
const { requireRole } = require('../middleware/auth');

router.get('/', getMaterials);
router.post('/', requireRole('faculty', 'teacher', 'admin'), createMaterial);
router.delete('/:id', requireRole('faculty', 'teacher', 'admin'), deleteMaterial);

module.exports = router;
