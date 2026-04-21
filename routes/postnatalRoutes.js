const express = require('express');
const router = express.Router();

const { savePostnatal,updatePostnatal } = require('../controllers/postnatalControllers');

router.post('/save', savePostnatal);
router.put('/update/:id', updatePostnatal);
module.exports = router;