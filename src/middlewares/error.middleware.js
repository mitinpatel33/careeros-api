const errorResponse = require("../utils/apiResponse");

export const notFound = (req, res, next) => {
  return errorResponse(res, `Route not found: ${req.originalUrl}`, 404);
};

export const errorHandler = (error, req, res, next) => {
  console.error("API Error:", error);

  const statusCode = error.statusCode || 500;

  return errorResponse(
    res,
    error.message || "Internal server error",
    statusCode,
  );
};
