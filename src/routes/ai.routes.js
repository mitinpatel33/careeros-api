const express = require("express");
const {
  generateSummary,
  suggestSkills,
  enhanceDescription,
  suggestSocial,
  suggestCertificate,
} = require("../controllers/ai.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");
const { ROLES } = require("../constants/roles");
const router = express.Router();

// Authentication Middleware
router.use(protect);

// Role Middleware
router.use(authorize(ROLES.CANDIDATE));

/**
 * @swagger
 * /api/ai/generate-summary:
 *   post:
 *     summary: Generate a professional summary
 *     description: Generate a professional resume summary using AI.
 *     tags:
 *       - AI
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AIRequest'
 *
 *     responses:
 *       200:
 *         description: Generated summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIResponse'
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Candidate role required
 */
router.post("/generate-summary", generateSummary);

/**
 * @swagger
 * /api/ai/suggest-skills:
 *   post:
 *     summary: Suggest skills
 *     description: Suggest technical and professional skills based on input.
 *     tags:
 *       - AI
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AIRequest'
 *
 *     responses:
 *       200:
 *         description: Suggested skills
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIResponse'
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Candidate role required
 */
router.post("/suggest-skills", suggestSkills);

/**
 * @swagger
 * /api/ai/enhance-description:
 *   post:
 *     summary: Enhance description
 *     description: Improve a work experience or project description using AI.
 *     tags:
 *       - AI
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AIRequest'
 *
 *     responses:
 *       200:
 *         description: Enhanced description
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIResponse'
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Candidate role required
 */
router.post("/enhance-description", enhanceDescription);

/**
 * @swagger
 * /api/ai/suggest-social:
 *   post:
 *     summary: Suggest social links
 *     description: Suggest useful social media or professional profile links.
 *     tags:
 *       - AI
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AIRequest'
 *
 *     responses:
 *       200:
 *         description: Suggested social links
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIResponse'
 */
router.post("/suggest-social", suggestSocial);

/**
 * @swagger
 * /api/ai/suggest-certificate:
 *   post:
 *     summary: Suggest certifications
 *     description: Suggest certifications based on candidate profile.
 *     tags:
 *       - AI
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AIRequest'
 *
 *     responses:
 *       200:
 *         description: Suggested certifications
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIResponse'
 */
router.post("/suggest-certificate", suggestCertificate);

module.exports = router;
