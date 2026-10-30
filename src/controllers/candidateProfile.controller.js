const mongoose = require("mongoose");
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
const {
  extractTextFromBuffer,
  parseResumeData,
} = require("../services/resumeParser.service.js");
const { successResponse } = require("../utils/apiResponse.js");
const { asyncHandler } = require("../utils/asyncHandler");
const { appError } = require("../utils/appError"); // was missing -> 404s crashed as 500

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

const ALL_MODELS = { ...singleSectionModels, ...collectionSectionModels };
const LIST_SORT = { displayOrder: 1, createdAt: -1 }; // matches the compound index

/* ------------------------------ helpers ------------------------------ */
// never let the client overwrite ownership / system fields
const clean = ({ _id, userId, createdAt, updatedAt, __v, ...rest } = {}) =>
  rest;

const assertId = (id, section) => {
  if (!mongoose.isValidObjectId(id))
    throw appError(`${section} record not found.`, 404);
};

/**
 * Replace a user's list in ONE round trip (ordered bulkWrite: deleteMany, then inserts).
 * Mongoose validates/casts every insert before anything is sent, so invalid input
 * can no longer wipe the old data (the old deleteMany -> insertMany could).
 */
const replaceCollection = async (Model, userId, items) => {
  const now = new Date();
  const docs = items.map((item, i) => ({
    ...clean(item),
    _id: new mongoose.Types.ObjectId(),
    userId,
    displayOrder: i, // keep the order the user submitted
    createdAt: now,
    updatedAt: now,
  }));

  if (!docs.length) {
    await Model.deleteMany({ userId });
    return [];
  }

  await Model.bulkWrite([
    { deleteMany: { filter: { userId } } },
    ...docs.map((document) => ({ insertOne: { document } })),
  ]);
  return docs;
};

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "www",
  "support",
  "blog",
  "help",
  "login",
  "signup",
]);

const slugError = (slug, { checkReserved = true } = {}) => {
  if (!slug || slug.length < 3 || slug.length > 30)
    return "Slug must be 3-30 characters.";
  if (!/^[a-z0-9-]+$/.test(slug))
    return "Only lowercase letters, numbers, and hyphens.";
  if (checkReserved && RESERVED_SLUGS.has(slug)) return "This URL is reserved.";
  return null;
};

/* --------------------------- single sections --------------------------- */
exports.getSingleSection = (section) =>
  asyncHandler(async (req, res) => {
    const data = await singleSectionModels[section]
      .findOne({ userId: req.user._id })
      .lean();
    return successResponse(res, `${section} fetched successfully.`, data);
  });

exports.saveSingleSection = (section) =>
  asyncHandler(async (req, res) => {
    const data = await singleSectionModels[section]
      .findOneAndUpdate(
        { userId: req.user._id },
        { $set: { ...clean(req.body), userId: req.user._id } },
        {
          returnDocument: "after",
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      )
      .lean();
    return successResponse(res, `${section} saved successfully.`, data);
  });

exports.deleteSingleSection = (section) =>
  asyncHandler(async (req, res) => {
    await singleSectionModels[section].deleteOne({ userId: req.user._id });
    return successResponse(res, `${section} deleted successfully.`, null);
  });

/* ------------------------------ collections ------------------------------ */
exports.getCollection = (section) =>
  asyncHandler(async (req, res) => {
    const data = await collectionSectionModels[section]
      .find({ userId: req.user._id })
      .sort(LIST_SORT)
      .lean();
    return successResponse(res, `${section} fetched successfully.`, data);
  });

exports.getCollectionById = (section) =>
  asyncHandler(async (req, res) => {
    assertId(req.params.id, section);
    const data = await collectionSectionModels[section]
      .findOne({ _id: req.params.id, userId: req.user._id })
      .lean();
    if (!data) throw appError(`${section} record not found.`, 404);
    return successResponse(res, `${section} fetched successfully.`, data);
  });

exports.saveCollection = (section) =>
  asyncHandler(async (req, res) => {
    const Model = collectionSectionModels[section];
    const userId = req.user._id;

    // update one record
    if (req.params.id) {
      assertId(req.params.id, section);
      const data = await Model.findOneAndUpdate(
        { _id: req.params.id, userId },
        { $set: clean(req.body) },
        { returnDocument: "after", runValidators: true },
      ).lean();
      if (!data) throw appError(`${section} record not found.`, 404);
      return successResponse(res, `${section} saved successfully.`, data);
    }

    // replace the whole list
    if (!Array.isArray(req.body))
      throw appError("An array of records is required.", 400);
    const data = await replaceCollection(Model, userId, req.body);
    return successResponse(res, `${section} saved successfully.`, data);
  });

exports.deleteCollection = (section) =>
  asyncHandler(async (req, res) => {
    assertId(req.params.id, section);
    const { deletedCount } = await collectionSectionModels[section].deleteOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!deletedCount) throw appError(`${section} record not found.`, 404);
    return successResponse(res, `${section} deleted successfully.`, null);
  });

/* ------------------------------ completion ------------------------------ */
const COMPLETION_STEPS = [
  ["personal", ProfilePersonalInfo, 10],
  ["summary", ProfileSummary, 10],
  ["contact", ProfileContactInfo, 10],
  ["social", ProfileSocialInfo, 5],
  ["skills", ProfileSkill, 15],
  ["educations", ProfileEducation, 15],
  ["experiences", ProfileExperience, 15],
  ["projects", ProfileProject, 10],
  ["certificates", ProfileCertificate, 5],
  ["achievements", ProfileAchievement, 2.5],
  ["languages", ProfileLanguage, 2.5],
];

exports.getCompletion = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  // exists() is index-only (userId prefix), all 11 run in parallel
  const found = await Promise.all(
    COMPLETION_STEPS.map(([, Model]) => Model.exists({ userId })),
  );

  const completedSteps = [];
  let completionPercentage = 0;
  COMPLETION_STEPS.forEach(([step, , weight], i) => {
    if (found[i]) {
      completedSteps.push(step);
      completionPercentage += weight;
    }
  });

  return successResponse(res, "Completion fetched successfully.", {
    completionPercentage,
    completedSteps,
  });
});

/* ---------------------- full profile (used by public page) ---------------------- */
exports.fetchFullProfileByUserId = async (userId) => {
  const list = (Model) => Model.find({ userId }).sort(LIST_SORT).lean();
  const one = (Model) => Model.findOne({ userId }).lean();

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
    one(ProfilePersonalInfo),
    one(ProfileSummary),
    list(ProfileEducation),
    list(ProfileExperience),
    list(ProfileSkill),
    list(ProfileProject),
    list(ProfileCertificate),
    list(ProfileAchievement),
    list(ProfileLanguage),
    one(ProfileSocialInfo),
    one(ProfileContactInfo),
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

/* ----------------------------- publish helpers ----------------------------- */
// RESUME_DOMAIN may be "localhost:5000", "careeros.com" or a full "https://careeros.com"
const publicUrl = (req, slug) => {
  const base = process.env.RESUME_DOMAIN || req.headers.host;
  const origin = /^https?:\/\//i.test(base)
    ? base
    : `${req.protocol}://${base}`;
  return `${origin.replace(/\/$/, "")}/resume/${slug}`;
};

// keep the settings section in step with the user record
const syncSetting = (userId, isPublished) =>
  ProfileSetting.updateOne(
    { userId },
    { $set: { isPublished } },
    { upsert: true, setDefaultsOnInsert: true },
  );

/* --------------------------------- slug --------------------------------- */
exports.checkSlug = asyncHandler(async (req, res) => {
  const { slug } = req.query;
  const error = slugError(slug);
  if (error) return res.status(400).json({ success: false, message: error });

  const taken = await User.exists({ profileSlug: slug }); // index-only, no document fetch
  res.json({ available: !taken });
});

exports.publishProfile = asyncHandler(async (req, res) => {
  const { slug } = req.body;
  const userId = req.user._id;

  const error = slugError(slug, { checkReserved: false });
  if (error) return res.status(400).json({ success: false, message: error });

  const taken = await User.exists({ profileSlug: slug, _id: { $ne: userId } });
  if (taken) return res.status(400).json({ success: false, message: "This URL is already taken." });

  const fullUrl = publicUrl(req, slug);
  const publishedAt = new Date();

  try {
    await Promise.all([
      User.updateOne(
        { _id: userId },
        { $set: { profileSlug: slug, publishedUrl: fullUrl, isPublished: true, publishedAt } },
      ),
      syncSetting(userId, true),
    ]);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({ success: false, message: "This URL is already taken." });
    }
    throw e;
  }

  res.json({
    success: true,
    message: "Resume published!",
    url: fullUrl,
    data: { profileSlug: slug, publishedUrl: fullUrl, isPublished: true, publishedAt },
  });
});

// POST /candidate/profile/unpublish  (keeps the slug, so republishing restores the same link)
exports.unpublishProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  await Promise.all([
    User.updateOne({ _id: userId }, { $set: { isPublished: false } }),
    syncSetting(userId, false),
  ]);
  return successResponse(res, "Resume unpublished.", null);
});

/* ------------------------------ publish status ------------------------------ */
// GET /candidate/profile/published-url  (one indexed read by _id, 3 fields)
exports.getPublishStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("profileSlug isPublished publishedAt")
    .lean();

  const slug = user?.profileSlug || null;
  const isPublished = Boolean(user?.isPublished && slug);

  return successResponse(res, "Publish status fetched successfully.", {
    profileSlug: slug,
    isPublished,
    // built from the CURRENT domain, so changing RESUME_DOMAIN never leaves stale links
    publishedUrl: isPublished ? publicUrl(req, slug) : null,
    publishedAt: user?.publishedAt ?? null,
  });
});

/* ------------------------------ all sections ------------------------------ */
exports.getProfileSections = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { include } = req.query;

  // only known sections; no `include` -> everything
  const requested = include
    ? [
        ...new Set(
          String(include)
            .split(",")
            .map((s) => s.trim()),
        ),
      ].filter((k) => ALL_MODELS[k])
    : Object.keys(ALL_MODELS);

  const entries = await Promise.all(
    requested.map(async (key) => {
      const Model = ALL_MODELS[key];
      const data = singleSectionModels[key]
        ? await Model.findOne({ userId }).lean()
        : await Model.find({ userId }).sort(LIST_SORT).lean();
      return [key, data];
    }),
  );

  return successResponse(
    res,
    "Sections fetched successfully.",
    Object.fromEntries(entries),
  );
});

/* ------------------------------ resume import ------------------------------ */
exports.importResume = asyncHandler(async (req, res) => {
  if (!req.file)
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded." });

  const rawText = await extractTextFromBuffer(
    req.file.buffer,
    req.file.mimetype,
  );
  const parsedData = await parseResumeData(rawText);

  res.status(200).json({
    success: true,
    message: "Resume parsed successfully",
    data: parsedData,
  });
});

function safeParseDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  const parsed = new Date(String(val).replace(/(\d+)(st|nd|rd|th)/i, "$1"));
  return isNaN(parsed.getTime()) ? null : parsed;
}

const DATE_KEYS = new Set([
  "dateOfBirth",
  "startDate",
  "endDate",
  "issuedDate",
  "achievementDate",
]);

function normalizePayloadDates(data) {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) return data.map(normalizePayloadDates);

  const result = { ...data };
  for (const key of Object.keys(result)) {
    if (DATE_KEYS.has(key)) result[key] = safeParseDate(result[key]);
    else if (result[key] && typeof result[key] === "object")
      result[key] = normalizePayloadDates(result[key]);
  }
  return result;
}

exports.bulkSaveProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const payload = normalizePayloadDates(req.body) || {};

  const singleOps = Object.entries(singleSectionModels)
    .filter(([key]) => payload[key] && Object.keys(payload[key]).length > 0)
    .map(([key, Model]) =>
      // updateOne: nothing to hydrate or return, the response doesn't use it
      Model.updateOne(
        { userId },
        { $set: { ...clean(payload[key]), userId } },
        { upsert: true, runValidators: true, setDefaultsOnInsert: true },
      ),
    );

  const listOps = Object.entries(collectionSectionModels)
    .filter(([key]) => Array.isArray(payload[key]))
    .map(([key, Model]) => replaceCollection(Model, userId, payload[key]));

  await Promise.all([...singleOps, ...listOps]);

  return successResponse(
    res,
    "Full profile imported and saved successfully.",
    null,
  );
});
