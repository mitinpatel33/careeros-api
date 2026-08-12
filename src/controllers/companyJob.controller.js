const { Job } = require("../models/job.model");
const { JOB_STATUS } = require("../constants/jobs");
const { successResponse } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const { appError } = require("../utils/appError");

// ----------------------------------------------------
// POST /api/company/jobs
// Create a new job posting for the logged-in company
// ----------------------------------------------------
exports.createJob = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const newJob = await Job.create({
    ...req.body,
    userId,
  });

  return successResponse(res, "Job created successfully.", newJob, 201);
});

// ----------------------------------------------------
// GET /api/company/jobs
// Fetch paginated jobs posted by the authenticated company
// Query params: page, limit, status, search, department, sortBy, sortOrder
// ----------------------------------------------------
exports.getCompanyJobs = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const { status, search, department, sortBy = "createdAt", sortOrder = "desc" } = req.query;

  const query = { userId };

  if (status) {
    query.status = status;
  }

  if (department) {
    query.department = { $regex: department, $options: "i" };
  }

  if (search) {
    query.$or = [
      { jobTitle: { $regex: search, $options: "i" } },
      { jobDescription: { $regex: search, $options: "i" } },
      { department: { $regex: search, $options: "i" } },
      { skills: { $in: [new RegExp(search, "i")] } },
    ];
  }

  const sort = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  const [jobs, total] = await Promise.all([
    Job.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Job.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return successResponse(res, "Company jobs fetched successfully.", {
    jobs,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  });
});

// ----------------------------------------------------
// GET /api/company/jobs/stats
// Get high-level statistics for company job postings
// ----------------------------------------------------
exports.getCompanyJobStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stats = await Job.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalJobs: { $sum: 1 },
        activeJobs: {
          $sum: { $cond: [{ $eq: ["$status", JOB_STATUS.ACTIVE] }, 1, 0] },
        },
        closedJobs: {
          $sum: { $cond: [{ $eq: ["$status", JOB_STATUS.CLOSED] }, 1, 0] },
        },
        draftJobs: {
          $sum: { $cond: [{ $eq: ["$status", JOB_STATUS.DRAFT] }, 1, 0] },
        },
        archivedJobs: {
          $sum: { $cond: [{ $eq: ["$status", JOB_STATUS.ARCHIVED] }, 1, 0] },
        },
        totalApplications: { $sum: "$applicationsCount" },
        totalViews: { $sum: "$viewsCount" },
      },
    },
  ]);

  const result = stats[0] || {
    totalJobs: 0,
    activeJobs: 0,
    closedJobs: 0,
    draftJobs: 0,
    archivedJobs: 0,
    totalApplications: 0,
    totalViews: 0,
  };

  delete result._id;

  return successResponse(res, "Company job statistics fetched successfully.", result);
});

// ----------------------------------------------------
// GET /api/company/jobs/:id
// Get single job details (owned by authenticated company)
// ----------------------------------------------------
exports.getCompanyJobById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const job = await Job.findOne({ _id: id, userId }).lean();

  if (!job) {
    throw appError("Job posting not found.", 404);
  }

  return successResponse(res, "Job details fetched successfully.", job);
});

// ----------------------------------------------------
// PUT /api/company/jobs/:id
// Update job details (owned by authenticated company)
// ----------------------------------------------------
exports.updateJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const updatedJob = await Job.findOneAndUpdate(
    { _id: id, userId },
    { $set: req.body },
    {
      returnDocument: "after",
      runValidators: true,
    }
  ).lean();

  if (!updatedJob) {
    throw appError("Job posting not found or access denied.", 404);
  }

  return successResponse(res, "Job updated successfully.", updatedJob);
});

// ----------------------------------------------------
// PATCH /api/company/jobs/:id/status
// Change job status (Active, Draft, Closed, Archived)
// ----------------------------------------------------
exports.updateJobStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user._id;

  const updatedJob = await Job.findOneAndUpdate(
    { _id: id, userId },
    { $set: { status } },
    { returnDocument: "after" }
  ).lean();

  if (!updatedJob) {
    throw appError("Job posting not found or access denied.", 404);
  }

  return successResponse(res, `Job status updated to '${status}'.`, updatedJob);
});

// ----------------------------------------------------
// DELETE /api/company/jobs/:id
// Delete a job posting (owned by authenticated company)
// ----------------------------------------------------
exports.deleteJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const deletedJob = await Job.findOneAndDelete({ _id: id, userId }).lean();

  if (!deletedJob) {
    throw appError("Job posting not found or access denied.", 404);
  }

  return successResponse(res, "Job posting deleted successfully.", null);
});
