const express = require('express');
const router = express.Router();

const { getPatients, getStudents, getClientDetails } = require('../controllers/dashboardController');

router.get('/patients', getPatients);
router.get('/students', getStudents);
router.get('/client/:id', getClientDetails);

module.exports = router;