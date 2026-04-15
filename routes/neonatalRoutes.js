const express = require('express');
const router = express.Router();

const { saveNeonatal } = require('../controllers/neonatalControllers');

router.post('/save', saveNeonatal);

module.exports = router;