const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      required: true,
    },

    lastName: {
      type: String,
      trim: true,
      required: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      required: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ['Candidate', 'Company', 'Admin'],
      default: 'Candidate',
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    refreshToken: {
      type: String,
      default: null,
    },
    profileSlug: {
      type: String,
      unique: true,
      sparse: true, // allows multiple nulls before first publish
      lowercase: true,
      trim: true,
    },
    publishedUrl: String,
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: Date,
  },
  {
    timestamps: true,
  },
);

module.exports.User = mongoose.model('users', userSchema);
