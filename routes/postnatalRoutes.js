const express = require('express');
const router = express.Router();

const { savePostnatal } = require('../controllers/postnatalControllers');

router.post('/save', savePostnatal);

module.exports = router;