const express = require('express');
const router  = express.Router();

const {
  saveFamilyNeeds,
  getFamilyNeedsById,
} = require('../controllers/familyneedsController');

// POST  /api/familyneeds/save   → called by assessment.js nextPage()
router.post('/save', saveFamilyNeeds);

// GET   /api/familyneeds/:id    → fetch saved assessment by family_id
router.get('/:id', getFamilyNeedsById);

module.exports = router;