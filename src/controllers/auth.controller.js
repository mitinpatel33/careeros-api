const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken } = require('../utils/token');
const { User } = require('../models/user.model');
const { asyncHandler } = require('../utils/asyncHandler');
const { appError } = require('../utils/appError');
const { successResponse } = require('../utils/apiResponse');

const buildAuthResponse = (user, accessToken, refreshToken) => ({
  userId: user._id,
  fullName: `${user.firstName} ${user.lastName}`,
  email: user.email,
  role: user.role,
  token: accessToken,
});

exports.signup = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, registrationType } = req.body;

  if (!firstName || !lastName || !email || !password || !registrationType) {
    throw appError('Required fields are missing.', 400);
  }

  const existingUser = await User.findOne({
    email: email.toLowerCase(),
  }).lean();

  if (existingUser) {
    throw appError('Email already exists.', 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    firstName,
    lastName,
    email,
    passwordHash,
    role: registrationType,
    isActive: true,
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  return successResponse(
    res,
    'Signup successfully.',
    buildAuthResponse(user, accessToken, refreshToken),
    201,
  );
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw appError('Email and password are required.', 400);
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
  });

  if (!user) {
    throw appError('Invalid email or password.', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw appError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw appError('User account is inactive.', 400);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  user.refreshToken = refreshToken;
  await user.save();

  return successResponse(
    res,
    'Login successfully.',
    buildAuthResponse(user, accessToken, refreshToken),
  );
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw appError('Refresh token is required.', 400);
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  const user = await User.findById(decoded.userId);

  if (!user || user.refreshToken !== refreshToken) {
    throw appError('Invalid refresh token.', 401);
  }

  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  user.refreshToken = newRefreshToken;
  await user.save();

  return successResponse(
    res,
    'Token refreshed successfully.',
    buildAuthResponse(user, accessToken, newRefreshToken),
  );
});

exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw appError('Refresh token is required.', 400);
  }

  await User.updateOne(
    { refreshToken },
    {
      $set: {
        refreshToken: null,
      },
    },
  );

  return successResponse(res, 'Logout successfully.', null);
});
