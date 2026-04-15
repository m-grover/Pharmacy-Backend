const express = require('express');
const router = express.Router();

const { addMember, getMemberById } = require('../controllers/memberController');

router.post('/add', addMember);

/* ✅ ADD THIS */
router.get('/:id', getMemberById);

module.exports = router;