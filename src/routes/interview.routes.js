const express = require("express");
const router = express.Router();
const {
  getCategories,
  getJobTitlesAndStats,
  createCustomJobTitle,
  getSkillsForJobTitle,
  fetchOrGenerateQuestions,
  fetchOrGenerateMockTest,
  getRecentActivity,
} = require("../controllers/interview.controller");

router.get("/categories", getCategories);
router.get("/job-titles", getJobTitlesAndStats);
router.post("/job-titles/custom", createCustomJobTitle);
router.get("/job-titles/:id/skills", getSkillsForJobTitle);
router.post("/questions/ai", fetchOrGenerateQuestions);
router.post("/mock-test/ai", fetchOrGenerateMockTest);
router.get("/activity/:userId", getRecentActivity);

module.exports = router;
