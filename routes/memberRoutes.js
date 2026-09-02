const express = require('express');
const router  = express.Router();

const {
  addMember,
  updateMember,
  getMemberById,
  getByAadhar,
  saveVersion,
  getVersionHistory,
} = require('../controllers/memberController');

// ── POST ──────────────────────────────────────────────────
router.post('/add',           addMember);
router.post('/version/:id',   saveVersion);

// ── SPECIFIC GET routes MUST come before /:id ─────────────
// Both spellings supported so frontend works regardless
router.get('/aadhaar/:aadhar',  getByAadhar);   // double-a (what frontend sends)
router.get('/aadhar/:aadhar',   getByAadhar);   // single-a (fallback)
router.get('/history/:id',      getVersionHistory);

// ── GENERIC /:id MUST be LAST — catches everything else ───
router.get('/:id',            getMemberById);
router.put('/update/:id',     updateMember);

module.exports = router;

// const express = require('express');
// const router = express.Router();

// const { addMember, getMemberById, updateMember} = require('../controllers/memberController');

// router.post('/add', addMember);

// /* ✅ ADD THIS */
// router.get('/:id', getMemberById);
// router.put('/update/:id', updateMember);

// module.exports = router;