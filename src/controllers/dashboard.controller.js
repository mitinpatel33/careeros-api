const { ProfilePersonalInfo, ProfileSummary, ProfileContactInfo, ProfileSocialInfo, ProfileSkill, ProfileEducation, ProfileExperience, ProfileProject, ProfileCertificate, ProfileAchievement, ProfileLanguage } = require("../models/candidate-profile.model");
const { User } = require("../models/user.model");
const { successResponse } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

// ─── Helper: Calculate profile completion ─────────────
const calculateCompletion = async (userId) => {
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

  const weights = {
    personal: 10,
    summary: 10,
    contact: 10,
    social: 5,
    skills: 15,
    educations: 15,
    experiences: 15,
    projects: 10,
    certificates: 5,
    achievements: 2.5,
    languages: 2.5,
  };

  let completionPercentage = 0;
  const completedSteps = [];

  const add = (condition, step, weight) => {
    if (condition) {
      completedSteps.push(step);
      completionPercentage += weight;
    }
  };

  add(personal, 'personal', weights.personal);
  add(summary, 'summary', weights.summary);
  add(contact, 'contact', weights.contact);
  add(social, 'social', weights.social);
  add(skills, 'skills', weights.skills);
  add(educations, 'educations', weights.educations);
  add(experiences, 'experiences', weights.experiences);
  add(projects, 'projects', weights.projects);
  add(certificates, 'certificates', weights.certificates);
  add(achievements, 'achievements', weights.achievements);
  add(languages, 'languages', weights.languages);

  return { completionPercentage, completedSteps };
};

// ─── Helper: Human‑readable time ago ──────────────────
const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return `${months} months ago`;
};

// ─── UPDATE: getCompletion to use the helper ──────────
exports.getCompletion = asyncHandler(async (req, res) => {
  const { completionPercentage, completedSteps } = await calculateCompletion(req.user._id);
  return successResponse(res, 'Completion fetched successfully.', {
    completionPercentage,
    completedSteps,
  });
});

// ─── NEW: Dashboard endpoint ──────────────────────────
exports.getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Fetch user basic info (published URL)
  const user = await User.findById(userId)
    .select('publishedUrl profileSlug isPublished firstName lastName')
    .lean();

  // 2. Get profile completion (reuse helper)
  const { completionPercentage, completedSteps } = await calculateCompletion(userId);

  // 3. Count items for "Total Resumes" proxy
  const [expCount, projCount, eduCount] = await Promise.all([
    ProfileExperience.countDocuments({ userId }),
    ProfileProject.countDocuments({ userId }),
    ProfileEducation.countDocuments({ userId }),
  ]);
  const totalResumes = expCount + projCount + eduCount || 1; // at least 1

  // 4. Recent resumes (latest experiences)
  const recentExperiences = await ProfileExperience.find({ userId })
    .sort({ updatedAt: -1 })
    .limit(5)
    .select('title updatedAt')
    .lean();

  const recentResumes = recentExperiences.map((exp) => ({
    name: exp.title || 'Untitled Resume',
    updatedAt: exp.updatedAt,
    timeAgo: timeAgo(exp.updatedAt),
  }));

  // 5. Profile strength – missing sections
  const allSections = [
    'personal', 'summary', 'contact', 'social',
    'skills', 'educations', 'experiences',
    'projects', 'certificates', 'achievements', 'languages',
  ];
  const missingSections = allSections.filter((s) => !completedSteps.includes(s));

  // 6. ATS Score – use completion percentage (could be enhanced later)
  const atsScore = Math.round(completionPercentage);

  // 7. Placeholder metrics (replace with real analytics when available)
  const profileViews = 2450;   // from analytics model
  const downloads = 824;       // from downloads model
  const viewsData = [120, 150, 180, 200, 250, 280]; // chart data
  const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

  // 8. Live resume URL
  const liveUrl = user.publishedUrl || null;

  // 9. Quick actions (static)
  const quickActions = ['Create Resume', 'Import Resume', 'Download PDF'];

  // ─── Response ──────────────────────────────────────────
  const dashboardData = {
    totalResumes,
    profileViews,
    downloads,
    atsScore,
    profileStrength: {
      completionPercentage,
      completedSteps,
      missingSections,
    },
    resumeAnalytics: {
      labels: months,
      data: viewsData,
    },
    recentResumes,
    quickActions,
    liveResumeUrl: liveUrl,
  };

  return successResponse(res, 'Dashboard fetched successfully.', dashboardData);
});