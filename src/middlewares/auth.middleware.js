const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const appError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");

export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw appError("Unauthorozed. Token missing", 401);
  }

  const token = authHeader.split(" ")[1];

  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

  const user = await User.findById(decoded.userId).select("-passwordHash");

  if (!user || user.isActive) {
    throw appError("Unauthorized. Invalid user", 401);
  }

  req.user = user;

  next();
});

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(appError("Forbidden. Access denied", 403));
    }

    next();
  };
};
