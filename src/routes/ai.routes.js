const express = require('express');
const { generateSummary, suggestSkills, enhanceDescription, suggestSocial, suggestCertificate } = require('../controllers/ai.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { ROLES } = require('../constants/roles');
const router = express.Router();

// Authentication Middleware
router.use(protect);

// Role Middleware
router.use(authorize(ROLES.CANDIDATE));

router.post('/generate-summary', generateSummary);
router.post('/suggest-skills', suggestSkills);
router.post('/enhance-description', enhanceDescription);
router.post('/suggest-social', suggestSocial);
router.post('/suggest-certificate', suggestCertificate);

module.exports = router;