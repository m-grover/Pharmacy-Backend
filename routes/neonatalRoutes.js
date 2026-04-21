const express = require('express');
const router = express.Router();

const { saveNeonatal, updateNeonatal } = require('../controllers/neonatalControllers');

router.post('/save', saveNeonatal);
router.put('/update/:id', updateNeonatal);
module.exports = router;