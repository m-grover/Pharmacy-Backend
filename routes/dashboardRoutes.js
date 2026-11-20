const express = require('express');
const router = express.Router();

const {
  getPatients, getStudents, getClientDetails, getPregnancy, getFamilies,
  updateClient, deleteClient
} = require('../controllers/dashboardController');
const { requireAdmin } = require('../middleware/auth');

router.get('/patients', getPatients);
router.get('/students', getStudents);
router.get('/pregnancy', getPregnancy);
router.get('/families', getFamilies);
router.get('/client/:id', getClientDetails);

/* Admin-only: edit / delete ONE client */
router.put('/client/:id', requireAdmin, updateClient);
router.delete('/client/:id', requireAdmin, deleteClient);

module.exports = router;

// const express = require('express');
// const router = express.Router();

// const { getPatients, getStudents, getClientDetails, getPregnancy, getFamilies } = require('../controllers/dashboardController');

// router.get('/patients', getPatients);
// router.get('/students', getStudents);
// router.get('/pregnancy', getPregnancy);
// router.get('/families', getFamilies);
// router.get('/client/:id', getClientDetails);

// module.exports = router;