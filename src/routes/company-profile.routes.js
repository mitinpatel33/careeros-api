const express = require("express");

const { protect, authorize } = require("../middlewares/auth.middleware");
const { ROLES } = require("../constants/roles");
const { saveProfile, deleteProfile, getProfile, uploadLogo } = require("../controllers/companyProfile.conroller");
const uploadCompanyLogo = require("../middlewares/companyLogoUpload.middleware");

// const validateRequest = require('../middlewares/validate.middleware');
// const { companyProfile } = require('../validations/companyProfile.validation');

const router = express.Router();

// Authentication Middleware
router.use(protect);

// Role Middleware
router.use(authorize(ROLES.COMPANY));

// ===============================
// Company Profile
// ===============================

router.get("/", getProfile);

router.post(
    "/",
    // validateRequest(companyProfile),
    saveProfile,
);

router.put(
    "/",
    // validateRequest(companyProfile),
    saveProfile,
);

router.delete("/", deleteProfile);

// ===============================
// Logo Upload
// ===============================

router.post("/logo", uploadCompanyLogo.single("logo"), uploadLogo);

module.exports = router;