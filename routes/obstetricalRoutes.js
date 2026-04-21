const express = require('express');
const router = express.Router();

const { saveObstetrical, updateObstetrical } = require('../controllers/obstetricalControllers');

router.post('/save', saveObstetrical);
router.put('/update/:id', updateObstetrical);
module.exports = router;