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
} = require("../controllers/candidateProfile.controller");

const { personalInfo } = require("../validations/candidateProfile.validation");

// const validateRequest = require("../middlewares/validate.middleware");

const router = express.Router();

// Authentication Middleware
router.use(protect);

// Role Middleware
router.use(authorize(ROLES.CANDIDATE));

// ===============================
// Profile Common APIs
// ===============================

router.get("/completion", getCompletion);

router.post("/publish", publishProfile);

// ===============================
// Single Object Sections
// ===============================

const singleSections = ["personal", "summary", "contact", "social", "settings"];

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
