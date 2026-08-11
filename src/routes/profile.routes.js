const express = require("express");

const { protect, authorize } = require("../middlewares/auth.middleware");

const { ROLES } = require("../constants/roles");

const {
  getCompletion,
  publishProfile,

  getSingleSection,
  saveSingleSection,
  deleteSingleSection,

  getCollection,
  getCollectionById,
  saveCollection,
  deleteCollection,
  checkSlug,
  getProfileSections,
} = require("../controllers/candidateProfile.controller");

const { personalInfo } = require("../validations/candidateProfile.validation");

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.CANDIDATE));

const singleSections = ["personal", "summary", "contact", "social", "settings"];

/**
 * @swagger
 * /api/profile/completion:
 *   get:
 *     summary: Get profile completion percentage
 *     tags:
 *       - Profile
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Completion score
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 completion:
 *                   type: number
 *                   example: 75
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Candidate role required
 */
router.get("/completion", getCompletion);

/**
 * @swagger
 * /api/profile/check-slug:
 *   get:
 *     summary: Check profile slug availability
 *     tags:
 *       - Profile
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - name: slug
 *         in: query
 *         required: true
 *         description: Profile slug to check
 *         schema:
 *           type: string
 *         example: mitin-patel
 *
 *     responses:
 *       200:
 *         description: Availability result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckSlugResponse'
 *
 *       401:
 *         description: Unauthorized
 */
router.get("/check-slug", checkSlug);

/**
 * @swagger
 * /api/profile/publish:
 *   post:
 *     summary: Publish or unpublish profile
 *     tags:
 *       - Profile
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PublishRequest'
 *
 *     responses:
 *       200:
 *         description: Profile publication status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublishResponse'
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Candidate role required
 */
router.post("/publish", protect, publishProfile);

/**
 * @swagger
 * /sections:
 *   get:
 *     summary: Get all profile sections
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: All sections data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 */
router.get("/sections", getProfileSections);

singleSections.forEach((section) => {
  // Get Section
  router.get(`/${section}`, getSingleSection(section));

  // Create / Update Section
  router.post(
    `/${section}`,
    // validateRequest(personalInfo),
    saveSingleSection(section),
  );

  // Support PUT also
  router.put(
    `/${section}`,
    // validateRequest(personalInfo),
    saveSingleSection(section),
  );

  // Delete Section
  router.delete(`/${section}`, deleteSingleSection(section));
});

// ===============================
// Collection Sections
// ===============================

const collectionSections = [
  "skills",
  "educations",
  "experiences",
  "projects",
  "certificates",
  "achievements",
  "languages",
];

collectionSections.forEach((section) => {
  // Get All
  router.get(`/${section}`, getCollection(section));

  // Get By Id
  router.get(`/${section}/:id`, getCollectionById(section));

  // Create
  router.post(`/${section}`, saveCollection(section));

  // Update
  router.put(`/${section}/:id`, saveCollection(section));

  // Delete
  router.delete(`/${section}/:id`, deleteCollection(section));
});

module.exports = router;
