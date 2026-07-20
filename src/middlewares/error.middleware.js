const errorResponse = require("../utils/apiResponse");

exports.notFound = (req, res, next) => {
  return errorResponse(res, `Route not found: ${req.originalUrl}`, 404);
};

exports.errorHandler = (error, req, res, next) => {
  console.error("API Error:", error);

  const statusCode = error.statusCode || 500;

  return errorResponse(
    res,
    error.message || "Internal server error",
    statusCode,
  );
};
