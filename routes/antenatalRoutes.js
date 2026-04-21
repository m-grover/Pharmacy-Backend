const express = require('express');
const router = express.Router();

const {
    saveAntenatal,
    getAntenatalBySurveyId,
    updateAntenatal
} = require('../controllers/antenatalControllers');

/* ============================= */
/* SAVE ANTENATAL */
/* ============================= */
router.post('/save', saveAntenatal);

router.put('/update/:id', updateAntenatal);

/* ============================= */
/* GET BY SURVEY ID */
/* ============================= */
router.get('/:survey_id', getAntenatalBySurveyId);

module.exports = router;