const mongoose = require("mongoose");
const { Schema } = mongoose;

const OPTIONS = { timestamps: true, versionKey: false };

const userRef = (extra = {}) => ({
  type: Schema.Types.ObjectId,
  ref: "users",
  required: true,
  ...extra,
});

// ONE document per user: unique already builds the index (no extra index:true)
const singleSchema = (fields) =>
  new Schema({ userId: userRef({ unique: true }), ...fields }, OPTIONS);

// MANY documents per user: the compound index serves filter + sort with no in-memory sort,
// and its userId prefix covers plain { userId } lookups too
const listSchema = (fields) => {
  const schema = new Schema(
    {
      userId: userRef(),
      displayOrder: { type: Number, default: 0 },
      ...fields,
    },
    OPTIONS,
  );
  schema.index({ userId: 1, displayOrder: 1, createdAt: -1 });
  return schema;
};

const str = { type: String, trim: true };

/* ------------------------------ single ------------------------------ */
module.exports.ProfilePersonalInfo = mongoose.model(
  "candidatePersonalInfo",
  singleSchema({
    firstName: str,
    lastName: str,
    jobTitleId: { type: Schema.Types.ObjectId, ref: "jobTitle", index: true },
    jobTitle: str,
    dateOfBirth: Date,
    gender: str,
    maritalStatus: str,
    nationality: str,
    photoUrl: String,
  }),
);

module.exports.ProfileSummary = mongoose.model(
  "candidateSummary",
  singleSchema({ professionalSummary: str, careerObjective: str }),
);

module.exports.ProfileContactInfo = mongoose.model(
  "candidateContactInfo",
  singleSchema({
    email: { ...str, lowercase: true },
    mobile: str,
    alternateMobile: str,
    address: String,
    city: str,
    state: str,
    country: str,
    pincode: str,
  }),
);

module.exports.ProfileSocialInfo = mongoose.model(
  "candidateSocialInfo",
  singleSchema({
    linkedInUrl: String,
    gitHubUrl: String,
    portfolioUrl: String,
    websiteUrl: String,
  }),
);

module.exports.ProfileSetting = mongoose.model(
  "candidateSetting",
  singleSchema({
    isPublished: { type: Boolean, default: false },
    completionPercentage: { type: Number, default: 0 },
  }),
);

/* ------------------------------- lists ------------------------------ */
module.exports.ProfileSkill = mongoose.model(
  "candidateSkill",
  listSchema({
    skillName: { ...str, required: true },
    proficiency: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
      default: "Intermediate",
    },
    experienceInYears: { type: Number, default: 0 },
  }),
);

module.exports.ProfileEducation = mongoose.model(
  "candidateEducation",
  listSchema({
    instituteName: String,
    degree: String,
    fieldOfStudy: String,
    startDate: Date,
    endDate: Date,
    percentage: Number,
    grade: String,
    description: String,
  }),
);

module.exports.ProfileExperience = mongoose.model(
  "candidateExperience",
  listSchema({
    companyName: String,
    designation: String,
    employmentType: String,
    location: String,
    startDate: Date,
    endDate: Date,
    isCurrentCompany: { type: Boolean, default: false },
    description: String,
  }),
);

module.exports.ProfileProject = mongoose.model(
  "candidateProject",
  listSchema({
    projectName: String,
    role: String,
    description: String,
    technologies: [String],
    projectUrl: String,
  }),
);

module.exports.ProfileCertificate = mongoose.model(
  "candidateCertificate",
  listSchema({
    certificateName: String,
    issuedBy: String,
    issuedDate: Date,
    credentialId: String,
    credentialUrl: String,
  }),
);

module.exports.ProfileAchievement = mongoose.model(
  "candidateAchievement",
  listSchema({ title: String, description: String, achievementDate: Date }),
);

module.exports.ProfileLanguage = mongoose.model(
  "candidateLanguage",
  listSchema({
    languageName: String,
    proficiencyLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Fluent", "Native"],
    },
  }),
);
