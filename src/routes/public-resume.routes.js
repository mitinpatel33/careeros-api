const express = require("express");
const {
  slugFromSubdomain,
} = require("../middlewares/slugFromSubdomain.middleware");
const { User } = require("../models/user.model");
const {
  getFullProfile,
  fetchFullProfileByUserId,
} = require("../controllers/candidateProfile.controller");
const moment = require("moment");

const router = express.Router();

/**
 * @swagger
 * /api/resume/{slug}:
 *   get:
 *     summary: Get public resume by slug
 *     description: Retrieve a publicly published candidate resume.
 *     tags:
 *       - Public
 *
 *     security: []
 *
 *     parameters:
 *       - name: slug
 *         in: path
 *         required: true
 *         description: Unique candidate profile slug
 *         schema:
 *           type: string
 *         example: mitin-patel
 *
 *     responses:
 *       200:
 *         description: Public resume retrieved successfully
 *
 *       404:
 *         description: Resume not found
 */
router.get("/resume/:slug", async (req, res) => {
  const { slug } = req.params;
  const user = await User.findOne({ profileSlug: slug, isPublished: true });
  if (!user) return res.status(404).send("Resume not found");
  const profile = await fetchFullProfileByUserId(user._id);

  // Map the data to match the template expectations

  const formatDate = (date) => (date ? moment(date).format("MM-DD-YYYY") : "");
  const mappedProfile = {
    personal: profile.personal || {},

    // ✅ Career Objective – from the summary schema
    summary: profile.summary || {},

    // ✅ Experience – schema: designation, companyName, startDate, endDate, description
    experience: (profile.experience || []).map((exp) => ({
      title: exp.designation || "", // was 'jobTitle'
      companyName: exp.companyName || "",
      location: exp.location || "",
      employmentType: exp.employmentType || "",
      startDate: formatDate(exp.startDate),
      endDate: exp.isCurrentCompany ? "Present" : formatDate(exp.endDate),
      description: exp.description || "",
    })),

    // ✅ Education – schema: degree, instituteName, startDate, endDate, fieldOfStudy
    education: (profile.education || []).map((edu) => ({
      degree: edu.degree || "",
      institution: edu.instituteName || "",
      startDate: formatDate(edu.startDate),
      endDate: formatDate(edu.endDate) || "Present",
      percentage: edu.percentage || "",
      field: edu.fieldOfStudy || "", // was 'field'
    })),

    // ✅ Skills – schema: skillName, proficiency (enum)
    skills: (profile.skills || []).map((skill) => ({
      skillName: skill.skillName || "",
      proficiency: skill.proficiency || "Intermediate",
      experienceInYears: skill.experienceInYears || "",
    })),

    // ✅ Projects – schema: projectName, description, projectUrl
    projects: (profile.projects || []).map((proj) => ({
      name: proj.projectName || "", // was 'name'
      description: proj.description || "",
      link: proj.projectUrl || "", // was 'link'
      techStack: proj.technologies || {},
      startDate: proj.StartDate || "",
      endDate: proj.endDate || "",
    })),

    // ✅ Certificates – schema: certificateName, issuedBy, issuedDate
    certificates: (profile.certificates || []).map((cert) => ({
      certificateName: cert.certificateName || "", // was 'name'
      issuedBy: cert.issuedBy || "", // was 'issuer'
      issuedDate: formatDate(cert.issuedDate), // was 'date'
    })),

    // ✅ Achievements – schema: title, description (we use title)
    achievements: (profile.achievements || []).map((ach) => ({
      title: ach.title || "",
      description: ach.description || "",
    })),

    // ✅ Languages – schema: languageName, proficiencyLevel
    languages: (profile.languages || []).map((lang) => ({
      language: lang.languageName || "", // was 'language'
      proficiency: lang.proficiencyLevel || "Fluent", // was 'proficiency'
    })),

    // ✅ Social – schema: linkedInUrl, gitHubUrl, portfolioUrl, websiteUrl
    social: {
      linkedInUrl: profile.social?.linkedInUrl || "",
      gitHubUrl: profile.social?.gitHubUrl || "",
      portfolioUrl: profile.social?.portfolioUrl || "",
      websiteUrl: profile.social?.websiteUrl || "",
    },

    // Contact – schema: email, mobile, etc.
    contact: profile.contact || {},
  };

  res.render("resumeTemplate", { profile: mappedProfile });
});

module.exports = router;
