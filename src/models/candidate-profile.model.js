const mongoose = require("mongoose");

const baseOptions = {
  timestamps: true,
};

export const CandidatePersonalInfo = mongoose.model(
  "candidatePersonalInfo",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        unique: true,
        index: true,
      },

      firstName: String,
      lastName: String,
      jobTitle: String,
      dateOfBirth: Date,
      gender: String,
      maritalStatus: String,
      nationality: String,
      photoUrl: String,
    },
    baseOptions,
  ),
);

export const candidateSummary = mongoose.model(
  "candidateSummary",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
      },

      summary: String,
      careerObjective: String,
    },
    baseOptions,
  ),
);

export const candidateContactInfo = mongoose.Aggregate(
  "candidareContactInfo",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
      },

      email: String,
      mobile: String,
      alternateMobile: String,
      address: String,
      city: String,
      State: String,
      country: String,
      pincode: String,
    },

    baseOptions,
  ),
);

export const candidateSocialInfo = mongoose.model(
  "candidateSocialInfo",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
      },

      linkedInUrl: String,
      gitHubUrl: String,
      portfolioUrl: String,
      websiteUrl: String,
    },
    baseOptions,
  ),
);

export const candidateSkills = mongoose.model("candidate");

export const candidateEducation = mongoose.model(
  "candidateEduction",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
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
    baseOptions,
  ),
);

export const candidateExperience = mongoose.model(
  "candidateExperience",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
      },

      companyName: "String",
      designation: String,
      employmentType: String,
      location: String,
      startDate: Date,
      endDate: Date,
      isCurrentCompany: {
        type: Boolean,
        default: false,
      },
      description: String,
    },
    baseOptions,
  ),
);

export const candidateProject = mongoose.model(
  "candidateProject",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
      },

      projectName: String,
      role: String,
      description: String,
      technologies: String,
      projectUrl: String,
    },
    baseOptions,
  ),
);

export const candidateCertificate = mongoose.model(
  "candidateCertificate",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
      },

      certificateName: String,
      issuedBy: String,
      issuedDate: String,
      credentialId: String,
      credentialUrl: String,
    },
    baseOptions,
  ),
);

export const candidateAchievement = mongoose.model(
  "candidateAchievement",
  new mongoose.Schema(
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
    baseOptions,
  ),
);

export const language = mongoose.model(
  "language",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        index: true,
      },

      languageName: String,
      proficiencyLevel: String,
    },
    baseOptions,
  ),
);

export const setting = mongoose.model(
  "setting",
  new mongoose.Schema(
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
    baseOptions,
  ),
);
