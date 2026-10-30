const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, required: true },

    // unique already creates the index; do not add index:true as well
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: true,
    },

    passwordHash: {
      type: String,
      required: function () {
        return this.provider === "email";
      },
      default: null,
      select: false, // never loaded unless asked for
    },

    provider: {
      type: String,
      enum: ["email", "google", "facebook"],
      default: "email",
    },
    googleId: { type: String, unique: true, sparse: true },
    facebookId: { type: String, unique: true, sparse: true },
    avatar: String,

    role: {
      type: String,
      enum: ["Candidate", "Company", "Admin"],
      default: "Candidate",
    },
    isActive: { type: Boolean, default: true },

    // looked up on refresh + logout, so it needs an index
    refreshToken: {
      type: String,
      default: null,
      select: false,
      index: true,
      sparse: true,
    },

    profileSlug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    publishedUrl: String,
    isPublished: { type: Boolean, default: false },
    publishedAt: Date,
  },
  { timestamps: true },
);

module.exports.User = mongoose.model("users", userSchema);
