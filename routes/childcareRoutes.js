const express = require('express');
const router = express.Router();

const { saveChildcare } = require('../controllers/childcareControllers');

router.post('/save', saveChildcare);

module.exports = router;