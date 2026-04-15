const express = require('express');
const router = express.Router();

const { addFamily } = require('../controllers/familyController');

router.post('/add', addFamily);

module.exports = router;