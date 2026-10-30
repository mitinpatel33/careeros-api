const bcrypt = require("bcrypt"); // native, ~4x faster than bcryptjs
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");
const { User } = require("../models/user.model");
const { asyncHandler } = require("../utils/asyncHandler");
const { appError } = require("../utils/appError");
const { successResponse } = require("../utils/apiResponse");
const { verifyGoogle, verifyFacebook } = require("../utils/socialAuth");

const BCRYPT_ROUNDS = 10;
const SESSION_FIELDS = "firstName lastName email role isActive";
// compared against when the email doesn't exist, so timing doesn't reveal valid emails
const DUMMY_HASH = bcrypt.hashSync("dummy-password", BCRYPT_ROUNDS);

const buildAuthResponse = (user, accessToken) => ({
  userId: user._id,
  fullName: `${user.firstName} ${user.lastName}`,
  email: user.email,
  role: user.role,
  token: accessToken,
});

const setRefreshCookie = (res, refreshToken) =>
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

// Mongoose doc with changes / new -> save(); plain or unchanged -> one cheap updateOne
const persistRefreshToken = (user, refreshToken) => {
  if (typeof user.save === "function" && (user.isNew || user.isModified())) {
    user.refreshToken = refreshToken;
    return user.save();
  }
  return User.updateOne({ _id: user._id }, { $set: { refreshToken } });
};

const issueSession = async (res, user, message, status = 200) => {
  if (!user.isActive) throw appError("User account is inactive.", 400);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  setRefreshCookie(res, refreshToken);
  await persistRefreshToken(user, refreshToken);

  return successResponse(
    res,
    message,
    buildAuthResponse(user, accessToken),
    status,
  );
};

/* ------------------------------- signup ------------------------------- */
exports.signup = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, registrationType } = req.body;

  if (!firstName || !lastName || !email || !password || !registrationType) {
    throw appError("Required fields are missing.", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // hash and duplicate check run in parallel
  const [existing, passwordHash] = await Promise.all([
    User.exists({ email: normalizedEmail }),
    bcrypt.hash(password, BCRYPT_ROUNDS),
  ]);
  if (existing) throw appError("Email already exists.", 400);

  // pre-generate _id so tokens can be signed before the single insert (no second save)
  const _id = new mongoose.Types.ObjectId();
  const draft = { _id, role: registrationType };
  const accessToken = generateAccessToken(draft);
  const refreshToken = generateRefreshToken(draft);

  const user = await User.create({
    _id,
    firstName,
    lastName,
    email: normalizedEmail,
    passwordHash,
    role: registrationType,
    isActive: true,
    refreshToken,
  });

  setRefreshCookie(res, refreshToken);
  return successResponse(
    res,
    "Signup successfully.",
    buildAuthResponse(user, accessToken),
    201,
  );
});

/* --------------------------- social login ---------------------------- */
const socialLogin = async (res, provider, token) => {
  if (!token) throw appError("Social token is required.", 400);

  const profile =
    provider === "google"
      ? await verifyGoogle(token)
      : await verifyFacebook(token);
  const idField = provider === "google" ? "googleId" : "facebookId";

  // one query instead of two sequential ones
  let user = await User.findOne({
    $or: [{ [idField]: profile.providerId }, { email: profile.email }],
  });

  let isNew = false;
  if (!user) {
    isNew = true;
    user = new User({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      role: "Candidate",
      provider,
      isActive: true,
    });
  }

  if (!user[idField]) user[idField] = profile.providerId;
  if (!user.avatar && profile.avatar) user.avatar = profile.avatar;

  return issueSession(
    res,
    user,
    isNew ? "Signup successfully." : "Login successfully.",
    isNew ? 201 : 200,
  );
};

/* ------------------------------- login -------------------------------- */
exports.login = asyncHandler(async (req, res) => {
  const { email, password, provider = "email", token } = req.body;

  if (provider === "google" || provider === "facebook") {
    return socialLogin(res, provider, token);
  }
  if (!email || !password)
    throw appError("Email and password are required.", 400);

  // lean + only needed fields; uses the unique email index
  const user = await User.findOne({ email: email.toLowerCase().trim() })
    .select(`+passwordHash ${SESSION_FIELDS}`)
    .lean();

  // always run one compare so response time is the same for unknown emails
  const isValid = await bcrypt.compare(
    password,
    user?.passwordHash || DUMMY_HASH,
  );
  if (!user || !user.passwordHash || !isValid) {
    throw appError("Invalid email or password.", 401);
  }

  return issueSession(res, user, "Login successfully.");
});

/* ---------------------------- refresh token ---------------------------- */
exports.refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
  if (!refreshToken) throw appError("Refresh token is required.", 400);

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw appError("Invalid refresh token.", 401);
  }

  const user = await User.findById(decoded.userId)
    .select(`+refreshToken ${SESSION_FIELDS}`)
    .lean();

  if (!user || !user.isActive || user.refreshToken !== refreshToken) {
    throw appError("Invalid refresh token.", 401);
  }

  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  setRefreshCookie(res, newRefreshToken);
  await User.updateOne(
    { _id: user._id },
    { $set: { refreshToken: newRefreshToken } },
  );

  return successResponse(
    res,
    "Token refreshed successfully.",
    buildAuthResponse(user, accessToken),
  );
});

/* ------------------------------- logout -------------------------------- */
exports.logout = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
  if (!refreshToken) throw appError("Refresh token is required.", 400);

  await User.updateOne({ refreshToken }, { $set: { refreshToken: null } });
  res.clearCookie("refreshToken");

  return successResponse(res, "Logout successfully.", null);
});
