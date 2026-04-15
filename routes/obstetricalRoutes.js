const express = require('express');
const router = express.Router();

const { saveObstetrical } = require('../controllers/obstetricalControllers');

router.post('/save', saveObstetrical);

module.exports = router;