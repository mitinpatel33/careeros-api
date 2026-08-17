const mongoose = require("mongoose");
const {
  JOB_TYPES,
  WORKPLACE_TYPES,
  SALARY_PERIODS,
  JOB_STATUS,
} = require("../constants/jobs");

const jobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    jobTitle: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      index: true,
    },
    jobDescription: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
    },
    jobType: {
      type: String,
      enum: Object.values(JOB_TYPES),
      default: JOB_TYPES.FULL_TIME,
    },
    workplaceType: {
      type: String,
      enum: Object.values(WORKPLACE_TYPES),
      default: WORKPLACE_TYPES.ON_SITE,
    },
    experience: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    minimumSalary: {
      type: Number,
      default: 0,
    },
    maximumSalary: {
      type: Number,
      default: 0,
    },
    salaryCurrency: {
      type: String,
      default: "USD",
      trim: true,
    },
    salaryPeriod: {
      type: String,
      enum: Object.values(SALARY_PERIODS),
      default: SALARY_PERIODS.YEARLY,
    },
    skills: {
      type: [String],
      default: [],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(JOB_STATUS),
      default: JOB_STATUS.ACTIVE,
      index: true,
    },
    requirements: {
      type: [String],
      default: [],
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    applicationDeadline: {
      type: Date,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search functionality
jobSchema.index({
  jobTitle: "text",
  jobDescription: "text",
  department: "text",
});

module.exports.Job = mongoose.model("jobs", jobSchema);
