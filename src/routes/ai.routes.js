const express = require('express');
const { generateSummary, suggestSkills, enhanceDescription, suggestSocial, suggestCertificate } = require('../controllers/ai.controller');
const router = express.Router();

router.post('/generate-summary', generateSummary);
router.post('/suggest-skills', suggestSkills);
router.post('/enhance-description', enhanceDescription);
router.post('/suggest-social', suggestSocial);
router.post('/suggest-certificate', suggestCertificate);

module.exports = router;