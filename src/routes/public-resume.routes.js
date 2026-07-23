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

// router.get("/", slugFromSubdomain, async (req, res, next) => {
//   try {
//     const { slug } = req;
//     if (!slug) {
//       throw appError(`Resume not found`, 404);
//     }

//     const user = await User.findOne({
//       profileSlug: slug,
//       isPublished: true,
//     }).select("_id");
//     if (!user) return res.status(404).send("Resume not found");

//     const profile = await getFullProfile(user._id);
//     res.render("resumeTemplate", { profile });
//   } catch (error) {
//     next(error);
//   }
// });

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
    careerObjective: profile.summary?.careerObjective || "",

    // ✅ Experience – schema: designation, companyName, startDate, endDate, description
    experience: (profile.experience || []).map((exp) => ({
      title: exp.designation || "", // was 'jobTitle'
      company: exp.companyName || "",
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
      field: edu.fieldOfStudy || "", // was 'field'
    })),

    // ✅ Skills – schema: skillName, proficiency (enum)
    skills: (profile.skills || []).map((skill) => ({
      skillName: skill.skillName || "",
      proficiency: skill.proficiency || "Intermediate",
    })),

    // ✅ Projects – schema: projectName, description, projectUrl
    projects: (profile.projects || []).map((proj) => ({
      name: proj.projectName || "", // was 'name'
      description: proj.description || "",
      link: proj.projectUrl || "", // was 'link'
    })),

    // ✅ Certificates – schema: certificateName, issuedBy, issuedDate
    certificates: (profile.certificates || []).map((cert) => ({
      name: cert.certificateName || "", // was 'name'
      issuer: cert.issuedBy || "", // was 'issuer'
      date: formatDate(cert.issuedDate), // was 'date'
    })),

    // ✅ Achievements – schema: title, description (we use title)
    achievements: (profile.achievements || []).map((ach) => ({
      title: ach.title || "",
    })),

    // ✅ Languages – schema: languageName, proficiencyLevel
    languages: (profile.languages || []).map((lang) => ({
      language: lang.languageName || "", // was 'language'
      proficiency: lang.proficiencyLevel || "Fluent", // was 'proficiency'
    })),

    // ✅ Social – schema: linkedInUrl, gitHubUrl, portfolioUrl, websiteUrl
    social: {
      linkedin: profile.social?.linkedInUrl || "",
      github: profile.social?.gitHubUrl || "",
      portfolio: profile.social?.portfolioUrl || "",
      website: profile.social?.websiteUrl || "",
    },

    // Contact – schema: email, mobile, etc.
    contact: profile.contact || {},
  };

  console.log("mappedProfile", mappedProfile);
  res.render("resumeTemplate", { profile: mappedProfile });
});

module.exports = router;
