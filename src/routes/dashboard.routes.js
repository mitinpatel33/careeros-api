const express = require("express");
const { ROLES } = require("../constants/roles");
const { protect } = require("../middlewares/auth.middleware");
const { getDashboard } = require("../controllers/dashboard.controller");
const router = express.Router();

// Authentication Middleware
router.use(protect);

// Role Middleware
router.use(authorize(ROLES.CANDIDATE));

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get candidate dashboard data
 *     tags:
 *       - Dashboard
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardData'
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Candidate role required
 */
router.get("/dashboard", getDashboard);

module.exports = router;
