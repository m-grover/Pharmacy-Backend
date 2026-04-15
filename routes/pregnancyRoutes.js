const express = require('express');
const router = express.Router();

const { addPregnancy } = require('../controllers/pregnancyController');

router.post('/add', addPregnancy);

module.exports = router;