const express = require('express');
const router = express.Router();

const { getPatients, getStudents } = require('../controllers/dashboardController');

router.get('/patients', getPatients);
router.get('/students', getStudents);

module.exports = router;