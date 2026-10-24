const {
  Category,
  JobTitle,
  JobTitleSkill,
  InterviewQuestion,
  MockTest,
  CandidateActivity,
  slugify,
} = require("../models/interview.model");
const {
  generateSkillsAI,
  generateInterviewQuestionsAI,
  generateMockTestAI,
} = require("../services/ai.service");

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const MOCK_LEVELS = ["Basic", "Intermediate", "Advanced"];
const STATS_TTL_MS = 60_000;
const CATEGORIES_TTL_MS = 5 * 60_000;
const QUESTION_FIELDS =
  "jobTitleId skillName question answer difficulty explanationWithExample";
const QUESTION_BATCH = 5;
const MAX_EXCLUDE = 1000;

/* ----------------------------- helpers ----------------------------- */
const isObjectId = (v) => typeof v === "string" && /^[a-f\d]{24}$/i.test(v);
const cleanText = (v, max = 60) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const httpError = (status, message) =>
  Object.assign(new Error(message), { status });
const sendError = (res, error) => {
  const status = error.status || 500;
  if (status === 500) console.error(error);
  res.status(status).json({
    success: false,
    message:
      status === 500
        ? "Something went wrong. Please try again."
        : error.message,
  });
};

const callAI = async (fn) => {
  try {
    return await fn();
  } catch (error) {
    console.error(
      "AI error:",
      error.status || "",
      String(error.message).slice(0, 200),
    );
    const busy =
      [429, 503].includes(error.status) ||
      /timed out/i.test(error.message || "");
    throw httpError(
      busy ? 503 : 502,
      busy
        ? "AI is busy right now. Please try again in a few seconds."
        : "AI generation failed. Please try again.",
    );
  }
};

// Concurrent identical requests share one AI call
const inflight = new Map();
const once = (key, fn) => {
  if (inflight.has(key)) return inflight.get(key);
  const promise = fn().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
};

// Small in-memory TTL cache (use Redis if you run several servers)
const ttl = (ms, load) => {
  let value,
    expires = 0;
  return async () => {
    if (value && expires > Date.now()) return value;
    value = await load();
    expires = Date.now() + ms;
    return value;
  };
};

const getStats = ttl(STATS_TTL_MS, async () => {
  const [totalJobTitles, totalQuestions, totalMockTests] = await Promise.all([
    JobTitle.countDocuments({ isActive: true, isCustom: { $ne: true } }),
    InterviewQuestion.estimatedDocumentCount(),
    MockTest.estimatedDocumentCount(),
  ]);
  return { totalJobTitles, totalQuestions, totalMockTests, successRate: "92%" };
});

const getCategoriesCached = ttl(CATEGORIES_TTL_MS, () =>
  Category.find({ isActive: true })
    .select("name slug kind skillLabel icon color")
    .sort({ order: 1, name: 1 })
    .lean(),
);

// Job + category in one round trip; gives the AI the audience context
const loadJobContext = async (jobTitleId) => {
  const job = await JobTitle.findById(jobTitleId)
    .select("title categoryId")
    .populate({ path: "categoryId", select: "name kind skillLabel" })
    .lean();
  if (!job) throw httpError(404, "Job title not found");
  const cat = job.categoryId || {};
  return {
    title: job.title,
    categoryName: cat.name || "General",
    kind: cat.kind || "professional",
    skillLabel: cat.skillLabel || "Skill",
  };
};

// Never send correct answers before the test is taken
const toPublicTest = (t) => ({
  _id: t._id,
  title: t.title,
  jobTitleId: t.jobTitleId,
  skillName: t.skillName,
  difficulty: t.difficulty,
  questions: t.questions.map(({ questionText, options }) => ({
    questionText,
    options,
  })),
});

/* 0. Categories */
exports.getCategories = async (req, res) => {
  try {
    res.status(200).json({ success: true, data: await getCategoriesCached() });
  } catch (error) {
    sendError(res, error);
  }
};

/* 1. Job titles + stats (filter by category / search) */
exports.getJobTitlesAndStats = async (req, res) => {
  try {
    const search = cleanText(req.query.search);
    const { categoryId } = req.query;
    if (categoryId && !isObjectId(categoryId))
      throw httpError(400, "categoryId is invalid");

    const query = { isActive: true, isCustom: { $ne: true } };
    if (categoryId) query.categoryId = categoryId;
    if (search) query.title = { $regex: escapeRegex(search), $options: "i" };

    const [data, stats] = await Promise.all([
      JobTitle.find(query)
        .select("title slug categoryId icon")
        .sort({ title: 1 })
        .limit(100)
        .lean(),
      getStats(),
    ]);

    res.status(200).json({ success: true, stats, data });
  } catch (error) {
    sendError(res, error);
  }
};

/* 1b. User typed a role that isn't listed */
exports.createCustomJobTitle = async (req, res) => {
  try {
    const title = cleanText(req.body?.title, 80);
    if (title.length < 2) throw httpError(400, "Please enter a valid title");
    const slug = slugify(title);
    if (!slug) throw httpError(400, "Please enter a valid title");

    const job = await JobTitle.findOneAndUpdate(
      { slug },
      {
        $setOnInsert: {
          title,
          slug,
          isCustom: true,
          isActive: true,
          categoryId: null,
        },
      },
      { upsert: true, new: true, lean: true, setDefaultsOnInsert: true },
    ).catch((e) =>
      e.code === 11000 ? JobTitle.findOne({ slug }).lean() : Promise.reject(e),
    );

    res.status(201).json({
      success: true,
      data: {
        _id: job._id,
        title: job.title,
        categoryId: job.categoryId,
        icon: job.icon,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};

/* 1c. Skills / subjects for a job title (AI on first use, then cached in DB) */
exports.getSkillsForJobTitle = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) throw httpError(400, "Invalid job title id");

    const cached = await JobTitleSkill.find({ jobTitleId: id })
      .select("name")
      .sort({ order: 1, _id: 1 })
      .lean();
    if (cached.length)
      return res.status(200).json({ success: true, data: cached });

    const data = await once(`s:${id}`, async () => {
      const ctx = await loadJobContext(id);
      const names = await callAI(() => generateSkillsAI(ctx));
      await JobTitleSkill.insertMany(
        names.map((name, order) => ({ jobTitleId: id, name, order })),
        { ordered: false },
      ).catch((e) => {
        if (e.code !== 11000 && !e.writeErrors) throw e;
      });
      return JobTitleSkill.find({ jobTitleId: id })
        .select("name")
        .sort({ order: 1, _id: 1 })
        .lean();
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

/* 2. Fetch or generate questions */
exports.fetchOrGenerateQuestions = async (req, res) => {
  try {
    const {
      jobTitleId,
      skillName,
      difficulty = "Beginner",
      excludeIds = [],
    } = req.body ?? {};
    const skill = cleanText(skillName);

    if (!isObjectId(jobTitleId))
      throw httpError(400, "A valid jobTitleId is required");
    if (!skill) throw httpError(400, "skillName is required");
    if (!DIFFICULTIES.includes(difficulty))
      throw httpError(
        400,
        `difficulty must be one of: ${DIFFICULTIES.join(", ")}`,
      );
    if (
      !Array.isArray(excludeIds) ||
      excludeIds.length > MAX_EXCLUDE ||
      !excludeIds.every(isObjectId)
    )
      throw httpError(400, "excludeIds is invalid");

    const filter = { jobTitleId, skillName: skill, difficulty };
    const nextUnseen = () =>
      InterviewQuestion.find({ ...filter, _id: { $nin: excludeIds } })
        .select(QUESTION_FIELDS)
        .sort({ _id: 1 })
        .limit(QUESTION_BATCH)
        .lean();

    let fresh = await nextUnseen();

    // The user has seen everything we have -> generate a new batch
    if (!fresh.length) {
      await once(`q:${jobTitleId}:${skill}:${difficulty}`, async () => {
        const ctx = await loadJobContext(jobTitleId);
        const existing = await InterviewQuestion.find(filter)
          .select("question")
          .sort({ _id: -1 })
          .limit(200)
          .lean();

        const generated = await callAI(() =>
          generateInterviewQuestionsAI(
            ctx,
            skill,
            difficulty,
            existing.map((q) => q.question),
          ),
        );

        await InterviewQuestion.insertMany(
          generated.map((q) => ({
            jobTitleId,
            skillName: skill,
            difficulty,
            question: q.question,
            answer: q.answer,
            explanationWithExample: q.explanationWithExample,
          })),
        );
      });

      fresh = await nextUnseen();
      if (!fresh.length)
        throw httpError(
          503,
          "Couldn't find new questions right now. Please try again.",
        );
    }

    res.status(200).json({ success: true, data: fresh });
  } catch (error) {
    sendError(res, error);
  }
};

/* 3. Fetch or generate mock test */
exports.fetchOrGenerateMockTest = async (req, res) => {
  try {
    const {
      userId,
      jobTitleId,
      skillName,
      difficulty = "Basic",
    } = req.body ?? {};
    const skill = cleanText(skillName);

    if (!isObjectId(jobTitleId))
      throw httpError(400, "A valid jobTitleId is required");
    if (!MOCK_LEVELS.includes(difficulty))
      throw httpError(
        400,
        `difficulty must be one of: ${MOCK_LEVELS.join(", ")}`,
      );
    if (userId !== undefined && !isObjectId(userId))
      throw httpError(400, "userId is invalid");

    const filter = { jobTitleId, skillName: skill || null, difficulty };
    let mockTest = await MockTest.findOne(filter).lean();

    if (!mockTest) {
      mockTest = await once(
        `m:${jobTitleId}:${skill}:${difficulty}`,
        async () => {
          const ctx = await loadJobContext(jobTitleId);
          const generated = await callAI(() =>
            generateMockTestAI(ctx, skill, difficulty),
          );
          const created = await MockTest.create({
            title:
              generated.title ||
              `${ctx.title}${skill ? ` - ${skill}` : ""} Test`,
            jobTitleId,
            skillName: skill || undefined,
            difficulty,
            questions: generated.questions,
          });
          return created.toObject();
        },
      );
    }

    if (userId) {
      await CandidateActivity.create({
        userId,
        activityType: "Mock Test Started",
        title: `Mock Test Started - ${skill || mockTest.title}`,
        category: skill || undefined,
        status: "In Progress",
      }).catch((err) => console.error("Activity log failed:", err.message));
    }

    res.status(200).json({ success: true, data: toPublicTest(mockTest) });
  } catch (error) {
    sendError(res, error);
  }
};

/* 4. Recent activity */
exports.getRecentActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isObjectId(userId)) throw httpError(400, "userId is invalid");

    const data = await CandidateActivity.find({ userId })
      .select("activityType title category score status createdAt")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.status(200).json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};
