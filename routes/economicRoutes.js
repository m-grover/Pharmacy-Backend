const express = require('express');
const router = express.Router();

const { addEconomic, updateEconomic } = require('../controllers/economicController');

router.post('/add', addEconomic);
router.put('/update/:id', updateEconomic);
module.exports = router;