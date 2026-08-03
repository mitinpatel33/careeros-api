const mongoose = require("mongoose");

const candidatePersonalInfoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
      index: true,
    },

    firstName: {
      type: String,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    jobTitle: {
      type: String,
      trim: true,
    },

    dateOfBirth: Date,

    gender: {
      type: String,
      trim: true,
    },

    maritalStatus: {
      type: String,
      trim: true,
    },

    nationality: {
      type: String,
      trim: true,
    },

    photoUrl: String,
  },
  {
    timestamps: true,
  },
);

module.exports.ProfilePersonalInfo = mongoose.model(
  "candidatePersonalInfo",
  candidatePersonalInfoSchema,
);

const candidateSummarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
      index: true,
    },

    professionalSummary: {
      type: String,
      trim: true,
    },

    careerObjective: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports.ProfileSummary = mongoose.model(
  "candidateSummary",
  candidateSummarySchema,
);

const candidateContactInfoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
      index: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    mobile: {
      type: String,
      trim: true,
    },

    alternateMobile: {
      type: String,
      trim: true,
    },

    address: String,

    city: {
      type: String,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
    },

    country: {
      type: String,
      trim: true,
    },

    pincode: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports.ProfileContactInfo = mongoose.model(
  "candidateContactInfo",
  candidateContactInfoSchema,
);

const candidateSocialInfoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
      index: true,
    },

    linkedInUrl: { type: String },
    gitHubUrl: { type: String },
    portfolioUrl: { type: String },
    websiteUrl: { type: String },
  },
  {
    timestamps: true,
  },
);

module.exports.ProfileSocialInfo = mongoose.model(
  "candidateSocialInfo",
  candidateSocialInfoSchema,
);

const candidateSkillSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },

    skillName: {
      type: String,
      required: true,
      trim: true,
    },

    proficiency: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
      default: "Intermediate",
    },

    experienceInYears: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports.ProfileSkill = mongoose.model(
  "candidateSkill",
  candidateSkillSchema,
);

const candidateEducationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },

    instituteName: String,
    degree: String,
    fieldOfStudy: String,

    startDate: Date,
    endDate: Date,

    percentage: Number,

    grade: String,

    description: String,
  },
  {
    timestamps: true,
  },
);

module.exports.ProfileEducation = mongoose.model(
  "candidateEducation",
  candidateEducationSchema,
);

const candidateExperienceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },

    companyName: { type: String },

    designation: { type: String },

    employmentType: { type: String },

    location: { type: String },

    startDate: { type: Date },

    endDate: { type: Date },

    isCurrentCompany: {
      type: Boolean,
      default: false,
    },

    description: String,
  },
  {
    timestamps: true,
  },
);

module.exports.ProfileExperience = mongoose.model(
  "candidateExperience",
  candidateExperienceSchema,
);

const candidateProjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },

    projectName: String,

    role: String,

    description: String,

    technologies: [String],

    projectUrl: String,
  },
  {
    timestamps: true,
  },
);

module.exports.ProfileProject = mongoose.model(
  "candidateProject",
  candidateProjectSchema,
);

const candidateCertificateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },

    certificateName: String,

    issuedBy: String,

    issuedDate: Date,

    credentialId: String,

    credentialUrl: String,
  },
  {
    timestamps: true,
  },
);

module.exports.ProfileCertificate = mongoose.model(
  "candidateCertificate",
  candidateCertificateSchema,
);

const candidateAchievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },

    title: String,

    description: String,

    achievementDate: Date,
  },
  {
    timestamps: true,
  },
);

module.exports.ProfileAchievement = mongoose.model(
  "candidateAchievement",
  candidateAchievementSchema,
);

const candidateLanguageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },

    languageName: String,

    proficiencyLevel: {
      type: String,
      enum: ["Basic", "Intermediate", "Professional", "Native"],
    },
  },
  {
    timestamps: true,
  },
);

module.exports.ProfileLanguage = mongoose.model(
  "candidateLanguage",
  candidateLanguageSchema,
);

const candidateSettingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
      index: true,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    completionPercentage: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports.ProfileSetting = mongoose.model(
  "candidateSetting",
  candidateSettingSchema,
);
