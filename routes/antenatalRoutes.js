const express = require('express');
const router = express.Router();

const {
    saveAntenatal,
    getAntenatalBySurveyId
} = require('../controllers/antenatalControllers');

/* ============================= */
/* SAVE ANTENATAL */
/* ============================= */
router.post('/save', saveAntenatal);

/* ============================= */
/* GET BY SURVEY ID */
/* ============================= */
router.get('/:survey_id', getAntenatalBySurveyId);

module.exports = router;