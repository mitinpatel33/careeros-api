const Joi = require("joi");
const {
  ProfilePersonalInfo,
  ProfileSkill,
  ProfileExperience,
} = require("../models/candidate-profile.model");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { generateContent } = require("../services/gemini.service");
const logger = require("../utils/logger");

// --- Validation schemas ---
const suggestSkillsSchema = Joi.object({
  jobTitle: Joi.string().trim().default("Software Developer"),
});

const enhanceDescriptionSchema = Joi.object({
  text: Joi.string().min(1).required(),
});

const suggestSocialSchema = Joi.object({
  jobTitle: Joi.string().trim().default("Software Developer"),
});

const suggestCertificateSchema = Joi.object({
  jobTitle: Joi.string().trim().default("Software Developer"),
  skills: Joi.array().items(Joi.string()),
});

const PROMPTS = {
  SUMMARY: (jobTitle, skillList, expYears) =>
    `You are a career coach. Based on the following details:
Job Title: ${jobTitle || "Software Developer"}
Skills: ${skillList || "Software Engineering"}
Years of Experience: ${expYears}

Write a concise professional summary (3-4 sentences) and a career objective (2-3 sentences).
Do not include markdown code block formatting. Return valid JSON strictly matching this schema:
{
  "professionalSummary": "string",
  "careerObjective": "string"
}`,

  SKILLS: (jobTitle) =>
    `List top 10 technical skills for a ${jobTitle || "Software Developer"}.
Return a valid JSON array of strings containing only the skill names.
Example: ["React", "Node.js", "Python"]`,

  ENHANCE: (text) =>
    `Improve the following description for a resume bullet point.
Make it more impactful, professional, and quantifiable if possible.
Return only the improved text, no extra commentary or quotes.
Input: '${text}'`,

  SOCIAL: (jobTitle) =>
    `For a ${jobTitle || "Software Developer"}, suggest typical professional social/profile URLs.
Return valid JSON with keys: linkedInUrl, gitHubUrl, portfolioUrl, websiteUrl, twitterUrl, stackOverflowUrl, leetCodeUrl.
If a platform is not relevant, set its value to an empty string.`,

  CERTIFICATES: (jobTitle, skillList) =>
    `For a ${jobTitle || "Software Developer"} with skills in ${skillList || ""},
suggest 5 relevant professional certifications.
Return a valid JSON array of objects with keys: certificateName, issuedBy.`,
};
// --- Controllers ---
exports.generateSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const [personalInfo, skillsInfo, experienceInfo] = await Promise.all([
      ProfilePersonalInfo.findOne({ userId }).lean(),
      ProfileSkill.find({ userId }).lean(),
      ProfileExperience.find({ userId }).lean(),
    ]);

    const skillList = skillsInfo?.map((s) => s.skillName).join(", ") || "";
    const expYears = experienceInfo?.length || 0;

    const prompt = PROMPTS.SUMMARY(personalInfo?.jobTitle, skillList, expYears);

    const parsed = await generateContent(prompt, {}, true);
    if (parsed.professionalSummary) {
      return successResponse(res, "Summary fetched successfully.", parsed);
    }
    // fallback: return raw text
    return successResponse(res, "Summary fetched (raw).", {
      professionalSummary: parsed.professionalSummary || "",
      careerObjective: "",
    });
  } catch (error) {
    logger.error("generateSummary error:", error);
    return errorResponse(res, "Failed to generate summary", error.message);
  }
};

exports.suggestSkills = async (req, res) => {
  try {
    const { error, value } = suggestSkillsSchema.validate(req.body);
    if (error)
      return errorResponse(res, "Validation error", error.details[0].message);

    const { jobTitle } = value;
    const prompt = PROMPTS.SKILLS(jobTitle);
    const parsed = await generateContent(prompt, { jobTitle }, true);

    if (Array.isArray(parsed)) {
      return successResponse(res, "Skills suggested successfully.", parsed);
    }
    // fallback: split by comma
    const skills = (parsed.raw || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return successResponse(res, "Skills suggested (fallback).", skills);
  } catch (error) {
    logger.error("suggestSkills error:", error);
    return errorResponse(res, "Failed to suggest skills", error.message);
  }
};

exports.enhanceDescription = async (req, res) => {
  try {
    const { error, value } = enhanceDescriptionSchema.validate(req.body);
    if (error)
      return errorResponse(res, "Validation error", error.details[0].message);

    const { text } = value;
    const prompt = PROMPTS.ENHANCE(text);
    const result = await generateContent(prompt, {}, false); // no JSON parsing
    const enhanced = result.raw || result;
    return successResponse(res, "Description enhanced successfully.", {
      enhanced: enhanced.trim(),
    });
  } catch (error) {
    logger.error("enhanceDescription error:", error);
    return errorResponse(res, "Failed to enhance description", error.message);
  }
};

exports.suggestSocial = async (req, res) => {
  try {
    const { error, value } = suggestSocialSchema.validate(req.body);
    if (error)
      return errorResponse(res, "Validation error", error.details[0].message);

    const { jobTitle } = value;
    const prompt = PROMPTS.SOCIAL(jobTitle);
    const parsed = await generateContent(prompt, { jobTitle }, true);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return successResponse(
        res,
        "Social URLs suggested successfully.",
        parsed,
      );
    }
    // fallback: empty object
    return successResponse(res, "Social URLs suggested (fallback).", {
      linkedInUrl: "",
      gitHubUrl: "",
      portfolioUrl: "",
      websiteUrl: "",
      twitterUrl: "",
      stackOverflowUrl: "",
      leetCodeUrl: "",
    });
  } catch (error) {
    logger.error("suggestSocial error:", error);
    return errorResponse(res, "Failed to suggest social URLs", error.message);
  }
};

exports.suggestCertificate = async (req, res) => {
  try {
    const { error, value } = suggestCertificateSchema.validate(req.body);
    if (error)
      return errorResponse(res, "Validation error", error.details[0].message);

    const { jobTitle, skills = [] } = value;
    const skillList = skills.join(", ");
    const prompt = PROMPTS.CERTIFICATES(jobTitle, skillList);
    const parsed = await generateContent(prompt, { jobTitle, skillList }, true);

    if (Array.isArray(parsed)) {
      return successResponse(
        res,
        "Certificates suggested successfully.",
        parsed,
      );
    }
    return successResponse(res, "Certificates suggested (fallback).", []);
  } catch (error) {
    logger.error("suggestCertificate error:", error);
    return errorResponse(res, "Failed to suggest certificates", error.message);
  }
};
