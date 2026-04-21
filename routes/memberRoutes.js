const express = require('express');
const router = express.Router();

const { addMember, getMemberById, updateMember} = require('../controllers/memberController');

router.post('/add', addMember);

/* ✅ ADD THIS */
router.get('/:id', getMemberById);
router.put('/update/:id', updateMember);

module.exports = router;