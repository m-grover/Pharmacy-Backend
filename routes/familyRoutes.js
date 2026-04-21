const express = require('express');
const router = express.Router();

const { addFamily, updateFamily } = require('../controllers/familyController');

router.post('/add', addFamily);
router.put('/update/:id', updateFamily);

module.exports = router;