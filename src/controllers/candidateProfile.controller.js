const {
  ProfileAchievement,
  ProfileCertificate,
  ProfileContactInfo,
  ProfileEducation,
  ProfileExperience,
  ProfileLanguage,
  ProfilePersonalInfo,
  ProfileProject,
  ProfileSkill,
  ProfileSocialInfo,
  ProfileSummary,
  ProfileSetting,
} = require("../models/candidate-profile.model.js");
const { User } = require("../models/user.model.js");
const { successResponse } = require("../utils/apiResponse.js");
const { asyncHandler } = require("../utils/asyncHandler");

const singleSectionModels = {
  personal: ProfilePersonalInfo,
  summary: ProfileSummary,
  contact: ProfileContactInfo,
  social: ProfileSocialInfo,
  settings: ProfileSetting,
};

const collectionSectionModels = {
  skills: ProfileSkill,
  educations: ProfileEducation,
  experiences: ProfileExperience,
  projects: ProfileProject,
  certificates: ProfileCertificate,
  achievements: ProfileAchievement,
  languages: ProfileLanguage,
};

exports.getSingleSection = (section) =>
  asyncHandler(async (req, res) => {
    const Model = singleSectionModels[section];

    const data = await Model.findOne({
      userId: req.user._id,
    }).lean();

    return successResponse(res, `${section} fetched successfully.`, data);
  });

exports.saveSingleSection = (section) =>
  asyncHandler(async (req, res) => {
    const Model = singleSectionModels[section];

    const data = await Model.findOneAndUpdate(
      {
        userId: req.user._id,
      },
      {
        $set: {
          ...req.body,
          userId: req.user._id,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    ).lean();

    return successResponse(res, `${section} saved successfully.`, data);
  });

exports.deleteSingleSection = (section) =>
  asyncHandler(async (req, res) => {
    const Model = singleSectionModels[section];

    await Model.deleteOne({
      userId: req.user._id,
    });

    return successResponse(res, `${section} deleted successfully.`, null);
  });

exports.getCollection = (section) =>
  asyncHandler(async (req, res) => {
    const Model = collectionSectionModels[section];

    const data = await Model.find({
      userId: req.user._id,
    })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return successResponse(res, `${section} fetched successfully.`, data);
  });

exports.getCollectionById = (section) =>
  asyncHandler(async (req, res) => {
    const Model = collectionSectionModels[section];

    const data = await Model.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!data) {
      throw appError(`${section} record not found.`, 404);
    }

    return successResponse(res, `${section} fetched successfully.`, data);
  });

exports.saveCollection = (section) =>
  asyncHandler(async (req, res) => {
    const Model = collectionSectionModels[section];

    let data;

    if (req.params.id) {
      data = await Model.findOneAndUpdate(
        {
          _id: req.params.id,
          userId: req.user._id,
        },
        {
          $set: req.body,
        },
        {
          new: true,
          runValidators: true,
        },
      ).lean();

      if (!data) {
        throw appError(`${section} record not found.`, 404);
      }
    } else {
      const payload = req.body.map((item) => ({
        ...item,
        userId: req.user._id,
      }));

      data = await Model.insertMany(payload);
    }

    return successResponse(res, `${section} saved successfully.`, data);
  });

exports.deleteCollection = (section) =>
  asyncHandler(async (req, res) => {
    const Model = collectionSectionModels[section];

    const deleted = await Model.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!deleted) {
      throw appError(`${section} record not found.`, 404);
    }

    return successResponse(res, `${section} deleted successfully.`, null);
  });

exports.getCompletion = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [
    personal,
    summary,
    contact,
    social,
    skills,
    educations,
    experiences,
    projects,
    certificates,
    achievements,
    languages,
  ] = await Promise.all([
    ProfilePersonalInfo.exists({ userId }),
    ProfileSummary.exists({ userId }),
    ProfileContactInfo.exists({ userId }),
    ProfileSocialInfo.exists({ userId }),
    ProfileSkill.exists({ userId }),
    ProfileEducation.exists({ userId }),
    ProfileExperience.exists({ userId }),
    ProfileProject.exists({ userId }),
    ProfileCertificate.exists({ userId }),
    ProfileAchievement.exists({ userId }),
    ProfileLanguage.exists({ userId }),
  ]);

  const completedSteps = [];

  let completionPercentage = 0;

  const add = (condition, step, weight) => {
    if (condition) {
      completedSteps.push(step);
      completionPercentage += weight;
    }
  };

  add(personal, "personal", 10);
  add(summary, "summary", 10);
  add(contact, "contact", 10);
  add(social, "social", 5);
  add(skills, "skills", 15);
  add(educations, "educations", 15);
  add(experiences, "experiences", 15);
  add(projects, "projects", 10);
  add(certificates, "certificates", 5);
  add(achievements, "achievements", 2.5);
  add(languages, "languages", 2.5);

  return successResponse(res, "Completion fetched successfully.", {
    completionPercentage,
    completedSteps,
  });
});

// exports.publishProfile = asyncHandler(async (req, res) => {
//   const userId = req.user._id;

//   const setting = await ProfileSetting.findOneAndUpdate(
//     { userId },
//     {
//       $set: {
//         isPublished: true,
//         livePortfolioEnabled: true,
//       },
//     },
//     {
//       new: true,
//       upsert: true,
//     },
//   ).lean();

//   return successResponse(res, "Profile published successfully.", setting);
// });

// controllers/profileController.js

// ✅ Helper – fetch full profile by user ID (reusable)
exports.fetchFullProfileByUserId = async (userId) => {
  const [
    personal,
    summary,
    education,
    experience,
    skills,
    projects,
    certificates,
    achievements,
    languages,
    social,
    contact,
  ] = await Promise.all([
    ProfilePersonalInfo.findOne({ userId }),
    ProfileSummary.findOne({ userId }),
    ProfileEducation.find({ userId }).sort({ displayOrder: 1 }),
    ProfileExperience.find({ userId }).sort({ displayOrder: 1 }),
    ProfileSkill.find({ userId }).sort({ displayOrder: 1 }),
    ProfileProject.find({ userId }).sort({ displayOrder: 1 }),
    ProfileCertificate.find({ userId }).sort({ displayOrder: 1 }),
    ProfileAchievement.find({ userId }).sort({ displayOrder: 1 }),
    ProfileLanguage.find({ userId }).sort({ displayOrder: 1 }),
    ProfileSocialInfo.findOne({ userId }),
    ProfileContactInfo.findOne({ userId }),
  ]);

  return {
    personal,
    summary,
    education,
    experience,
    skills,
    projects,
    certificates,
    achievements,
    languages,
    social,
    contact,
  };
};

// Keep your existing controller for the API (if needed)
// exports.getFullProfile = asyncHandler(async (req, res) => {
//   const profile = await fetchFullProfileByUserId(req._id);
//   res.json({ success: true, data: profile });
// });

exports.checkSlug = asyncHandler(async (req, res) => {
  const { slug } = req.query;
  if (!slug || slug.length < 3 || slug.length > 30) {
    return res
      .status(400)
      .json({ success: false, message: "Slug must be 3‑30 characters." });
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({
      success: false,
      message: "Only lowercase letters, numbers, and hyphens.",
    });
  }
  const reserved = [
    "admin",
    "api",
    "www",
    "support",
    "blog",
    "help",
    "login",
    "signup",
  ];
  if (reserved.includes(slug)) {
    return res
      .status(400)
      .json({ success: false, message: "This URL is reserved." });
  }

  const existingUser = await User.findOne({ profileSlug: slug });
  res.json({ available: !existingUser });
});

// Publish resume (authenticated)
exports.publishProfile = asyncHandler(async (req, res) => {
  const { slug } = req.body;
  const userId = req.user._id;

  if (!slug || slug.length < 3 || slug.length > 30) {
    return res
      .status(400)
      .json({ success: false, message: "Slug must be 3‑30 characters." });
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Only lowercase letters, numbers, and hyphens.",
      });
  }

  const existingOwner = await User.findOne({
    profileSlug: slug,
    _id: { $ne: userId },
  });
  if (existingOwner) {
    return res
      .status(400)
      .json({ success: false, message: "This URL is already taken." });
  }

  const domain = process.env.RESUME_DOMAIN || `${req.headers.host}`;
  const fullUrl = `http://${domain}/resume/${slug}`;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      profileSlug: slug,
      publishedUrl: fullUrl,
      isPublished: true,
      publishedAt: new Date(),
    },
    { new: true },
  );

  res.json({ success: true, message: "Resume published!", url: fullUrl });
});
