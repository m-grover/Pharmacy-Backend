const express = require('express');
const router = express.Router();

const { getPatients, getStudents, getClientDetails, getPregnancy, getFamilies } = require('../controllers/dashboardController');

router.get('/patients', getPatients);
router.get('/students', getStudents);
router.get('/pregnancy', getPregnancy);
router.get('/families', getFamilies);
router.get('/client/:id', getClientDetails);

module.exports = router;