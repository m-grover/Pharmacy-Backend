const express = require('express');
const router = express.Router();

const { addEconomic } = require('../controllers/economicController');

router.post('/add', addEconomic);

module.exports = router;