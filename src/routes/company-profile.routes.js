const express = require("express");

const { protect, authorize } = require("../middlewares/auth.middleware");
const { ROLES } = require("../constants/roles");
const { saveProfile, deleteProfile, getProfile, uploadLogo } = require("../controllers/companyProfile.conroller");
const uploadCompanyLogo = require("../middlewares/companyLogoUpload.middleware");

const router = express.Router();

// Authentication Middleware
router.use(protect);

// Role Middleware
router.use(authorize(ROLES.COMPANY));

// Get By User ID
router.get("/", getProfile);

// Create / Update
router.post("/", saveProfile,);
router.put("/", saveProfile,);

// Delete
router.delete("/", deleteProfile);

// Logo Upload
router.post("/logo", uploadCompanyLogo.single("logo"), uploadLogo);

module.exports = router;