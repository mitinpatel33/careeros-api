const express = require("express");

const { protect, authorize } = require("../middlewares/auth.middleware");

const { ROLES } = require("../constants/roles");

const multer = require("multer");

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
  bulkSaveProfile,
  importResume,
} = require("../controllers/candidateProfile.controller");

const router = express.Router();

// Memory Storage for fastest processing (Zero local disk I/O latency)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    const validMimetypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (validMimetypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Unsupported file format. Please upload PDF or Word documents.",
        ),
      );
    }
  },
});

router.use(protect);
router.use(authorize(ROLES.CANDIDATE));

const singleSections = ["personal", "summary", "contact", "social", "settings"];

/**
 * @swagger
 * /profile/import-resume:
 *   post:
 *     summary: Parse resume using Gemini AI without saving to database
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Parsed JSON structure ready for client state/form initialization
 */
router.post("/import-resume", upload.single("file"), importResume);

/**
 * @swagger
 * /profile/bulk-save:
 *   post:
 *     summary: Save or replace all updated profile sections at once after user review/editing
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: All profile sections saved successfully
 */
router.post("/bulk-save", bulkSaveProfile);

/**
 * @swagger
 * /profile/completion:
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
 * /profile/check-slug:
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
 * /profile/publish:
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
