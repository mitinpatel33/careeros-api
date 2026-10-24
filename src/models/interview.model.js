const mongoose = require("mongoose");
const { Schema } = mongoose;

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/* Categories: IT & Software, Law, School, College, Medical, ... */
const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    kind: {
      type: String,
      enum: ["professional", "student"],
      default: "professional",
    },
    skillLabel: { type: String, default: "Skill" }, // "Skill" | "Subject" | "Topic"
    icon: String,
    color: String,
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
categorySchema.pre("validate", function (next) {
  if (this.name && (!this.slug || this.isModified("name")))
    this.slug = slugify(this.name);
  next();
});
const Category = mongoose.model("jobCategory", categorySchema);

/* Job titles / courses / study levels */
const jobTitleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "jobCategory",
      default: null,
    },
    icon: String,
    isCustom: { type: Boolean, default: false }, // typed by a user, not curated
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
jobTitleSchema.pre("validate", function (next) {
  if (this.title && !this.slug) this.slug = slugify(this.title);
  next();
});
jobTitleSchema.index({ isActive: 1, isCustom: 1, categoryId: 1, title: 1 });
const JobTitle = mongoose.model("jobTitle", jobTitleSchema);

/* Skills / subjects / topics per job title */
const jobTitleSkillSchema = new Schema(
  {
    jobTitleId: {
      type: Schema.Types.ObjectId,
      ref: "jobTitle",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);
jobTitleSkillSchema.index({ jobTitleId: 1, name: 1 }, { unique: true });
const JobTitleSkill = mongoose.model("jobTitleSkill", jobTitleSkillSchema);

/* AI questions (cache) */
const interviewQuestionSchema = new Schema(
  {
    jobTitleId: {
      type: Schema.Types.ObjectId,
      ref: "jobTitle",
      required: true,
    },
    skillName: { type: String, required: true, trim: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    explanationWithExample: String,
  },
  { timestamps: true },
);
interviewQuestionSchema.index({ jobTitleId: 1, skillName: 1, difficulty: 1 });
const InterviewQuestion = mongoose.model(
  "interviewQuestion",
  interviewQuestionSchema,
);

/* Mock tests (cache) */
const mockTestSchema = new Schema(
  {
    title: { type: String, required: true },
    jobTitleId: {
      type: Schema.Types.ObjectId,
      ref: "jobTitle",
      required: true,
    },
    skillName: String,
    difficulty: {
      type: String,
      enum: ["Basic", "Intermediate", "Advanced"],
      default: "Basic",
    },
    questions: [
      {
        _id: false,
        questionText: String,
        options: [String],
        correctAnswer: String,
        explanation: String,
      },
    ],
  },
  { timestamps: true },
);
mockTestSchema.index({ jobTitleId: 1, skillName: 1, difficulty: 1 });
const MockTest = mongoose.model("mockTest", mockTestSchema);

/* Candidate activity */
const candidateActivitySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "users", required: true },
    activityType: {
      type: String,
      enum: ["Mock Test Completed", "AI Questions", "Mock Test Started"],
      required: true,
    },
    title: { type: String, required: true },
    category: String,
    score: String,
    status: {
      type: String,
      enum: ["Completed", "Practiced", "In Progress"],
      default: "In Progress",
    },
  },
  { timestamps: true },
);
candidateActivitySchema.index({ userId: 1, createdAt: -1 });
const CandidateActivity = mongoose.model(
  "candidateActivity",
  candidateActivitySchema,
);

module.exports = {
  Category,
  JobTitle,
  JobTitleSkill,
  InterviewQuestion,
  MockTest,
  CandidateActivity,
  slugify,
};
