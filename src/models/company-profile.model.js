const mongoose = require("mongoose");

const companyProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
            unique: true,
            index: true,
        },

        companyName: {
            type: String,
            trim: true,
        },

        website: {
            type: String,
            trim: true,
        },

        industry: {
            type: String,
            trim: true,
        },

        companySize: {
            type: String,
            trim: true,
        },

        companyEmail: {
            type: String,
            trim: true,
            lowercase: true,
        },

        location: {
            type: String,
            trim: true,
        },

        aboutCompany: {
            type: String,
            trim: true,
        },

        logoUrl: String,

        verificationStatus: {
            type: String,
            enum: ["Pending", "Verified", "Rejected"],
            default: "Pending",
        },
    },
    {
        timestamps: true,
    },
);

module.exports.CompanyProfile = mongoose.model(
    "companyProfile",
    companyProfileSchema,
);