const express = require("express");

const { protect, authorize } = require("../middlewares/auth.middleware");
const { ROLES } = require("../constants/roles");
const validateRequest = require("../middlewares/validate.middleware");
const {
  createJobSchema,
  updateJobSchema,
  updateJobStatusSchema,
} = require("../validations/job.validation");
const {
  createJob,
  getCompanyJobs,
  getCompanyJobStats,
  getCompanyJobById,
  updateJob,
  updateJobStatus,
  deleteJob,
} = require("../controllers/companyJob.controller");

const router = express.Router();

// Require authentication for all job management routes
router.use(protect);

// Allow Company and Admin roles to manage company job postings
router.use(authorize(ROLES.COMPANY, ROLES.ADMIN));

// Get Job Statistics for company dashboard
router.get("/stats", getCompanyJobStats);

// Get list of company jobs / Create new job
router
  .route("/")
  .get(getCompanyJobs)
  .post(validateRequest(createJobSchema), createJob);

// Get single job / Update job / Delete job
router
  .route("/:id")
  .get(getCompanyJobById)
  .put(validateRequest(updateJobSchema), updateJob)
  .delete(deleteJob);

// Update job status (Active, Closed, Draft, Archived)
router.patch(
  "/:id/status",
  validateRequest(updateJobStatusSchema),
  updateJobStatus
);

module.exports = router;
