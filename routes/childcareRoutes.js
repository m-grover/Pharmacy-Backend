const express = require('express');
const router = express.Router();

const { saveChildcare, updateChildcare } = require('../controllers/childcareControllers');

router.post('/save', saveChildcare);
router.put('/update/:id', updateChildcare);
module.exports = router;