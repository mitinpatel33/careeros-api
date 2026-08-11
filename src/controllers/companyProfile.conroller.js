const fs = require("fs");
const path = require("path");


const { successResponse } = require("../utils/apiResponse.js");
const { asyncHandler } = require("../utils/asyncHandler");
const { appError } = require("../utils/appError");
const { CompanyProfile } = require("../models/company-profile.model.js");



// -------------------------------
// GET /company-profile
// -------------------------------
exports.getProfile =
    asyncHandler(async (req, res) => {
        const data = await CompanyProfile.findOne({
            userId: req.user._id,
        }).lean();

        return successResponse(res, "Company profile fetched successfully.", data);
    });

// -------------------------------
// POST /company-profile
// PUT  /company-profile
// -------------------------------
exports.saveProfile =
    asyncHandler(async (req, res) => {
        const data = await CompanyProfile.findOneAndUpdate(
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
                returnDocument: "after",
                upsert: true,
                runValidators: true,
            },
        ).lean();

        return successResponse(res, "Company profile saved successfully.", data);
    });


// -------------------------------
// DELETE /company-profile
// -------------------------------
exports.deleteProfile =
    asyncHandler(async (req, res) => {
        const deleted = await CompanyProfile.findOneAndDelete({
            userId: req.user._id,
        }).lean();

        if (!deleted) {
            throw appError("Company profile not found.", 404);
        }

        if (deleted.logoUrl) {
            const logoPath = path.join(__dirname, "..", "..", deleted.logoUrl);
            fs.promises.unlink(logoPath).catch(() => { });
        }

        return successResponse(res, "Company profile deleted successfully.", null);
    });

// -------------------------------
// POST /company-profile/logo
// Multipart upload, field name: "logo"
// -------------------------------
exports.uploadLogo =
    asyncHandler(async (req, res) => {
        if (!req.file) {
            throw appError("No logo file uploaded.", 400);
        }

        const newLogoUrl = `/uploads/company-logos/${req.file.filename}`;

        const previous = await CompanyProfile.findOne({
            userId: req.user._id,
        }).lean();

        const data = await CompanyProfile.findOneAndUpdate(
            {
                userId: req.user._id,
            },
            {
                $set: {
                    logoUrl: newLogoUrl,
                    userId: req.user._id,
                },
            },
            {
                returnDocument: "after",
                upsert: true,
                runValidators: true,
            },
        ).lean();

        if (previous?.logoUrl) {
            const oldPath = path.join(__dirname, "..", "..", previous.logoUrl);
            fs.promises.unlink(oldPath).catch(() => { });
        }

        return successResponse(res, "Logo uploaded successfully.", data);
    });