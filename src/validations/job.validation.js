const Joi = require("joi");
const {
  JOB_TYPES,
  WORKPLACE_TYPES,
  SALARY_PERIODS,
  JOB_STATUS,
} = require("../constants/jobs");

const createJobSchema = Joi.object({
  jobTitle: Joi.string().required().trim().messages({
    "string.empty": "Job title is required",
    "any.required": "Job title is required",
  }),

  department: Joi.string().trim().allow("").optional(),

  jobDescription: Joi.string().required().trim().messages({
    "string.empty": "Job description is required",
    "any.required": "Job description is required",
  }),

  jobType: Joi.string()
    .valid(...Object.values(JOB_TYPES))
    .default(JOB_TYPES.FULL_TIME),

  workplaceType: Joi.string()
    .valid(...Object.values(WORKPLACE_TYPES))
    .default(WORKPLACE_TYPES.ON_SITE),

  experience: Joi.string().trim().default("Mid Level"),

  location: Joi.string().trim().allow("").optional(),

  minimumSalary: Joi.number().min(0).default(0),
  maximumSalary: Joi.number().min(0).default(0),
  salaryCurrency: Joi.string().default("USD"),
  salaryPeriod: Joi.string()
    .valid(...Object.values(SALARY_PERIODS))
    .default(SALARY_PERIODS.YEARLY),

  skills: Joi.array().items(Joi.string().trim()).default([]),

  status: Joi.string()
    .valid(...Object.values(JOB_STATUS))
    .default(JOB_STATUS.ACTIVE),

  requirements: Joi.array().items(Joi.string().trim()).default([]),

  responsibilities: Joi.array().items(Joi.string().trim()).default([]),

  applicationDeadline: Joi.date().iso().allow(null).optional(),
  viewsCount: Joi.number().min(0).default(0),
  applicationsCount: Joi.number().min(0).default(0),
});

const updateJobSchema = Joi.object({
  jobTitle: Joi.string().trim().optional(),
  department: Joi.string().trim().allow("").optional(),
  jobDescription: Joi.string().trim().optional(),
  jobType: Joi.string()
    .valid(...Object.values(JOB_TYPES))
    .optional(),
  workplaceType: Joi.string()
    .valid(...Object.values(WORKPLACE_TYPES))
    .optional(),
  experience: Joi.string().trim().optional(),
  location: Joi.string().trim().allow("").optional(),
  minimumSalary: Joi.number().min(0).optional(),
  maximumSalary: Joi.number().min(0).optional(),
  salaryCurrency: Joi.string().optional(),
  salaryPeriod: Joi.string()
    .valid(...Object.values(SALARY_PERIODS))
    .optional(),
  skills: Joi.array().items(Joi.string().trim()).optional(),
  status: Joi.string()
    .valid(...Object.values(JOB_STATUS))
    .optional(),
  requirements: Joi.array().items(Joi.string().trim()).optional(),
  responsibilities: Joi.array().items(Joi.string().trim()).optional(),
  applicationDeadline: Joi.date().iso().allow(null).optional(),
  viewsCount: Joi.number().min(0).optional(),
  applicationsCount: Joi.number().min(0).optional(),
}).min(1);

const updateJobStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(JOB_STATUS))
    .required()
    .messages({
      "any.only": `Status must be one of: ${Object.values(JOB_STATUS).join(", ")}`,
      "any.required": "Status is required",
    }),
});

module.exports = {
  createJobSchema,
  updateJobSchema,
  updateJobStatusSchema,
};
