const express = require('express');
const { ROLES } = require('../constants/roles');
const { protect } = require('../middlewares/auth.middleware');
const { getDashboard } = require('../controllers/dashboard.controller');
const router = express.Router();

// Authentication Middleware
router.use(protect);

// Role Middleware
router.use(authorize(ROLES.CANDIDATE));

router.get('/dashboard', getDashboard)

module.exports = router;