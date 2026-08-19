// src/middlewares/error.middleware.js
const { errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

exports.notFound = (req, res, next) => {
  logger.warn(`404 Not Found - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  return errorResponse(res, `Route not found: ${req.originalUrl}`, 404);
};

exports.errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const errorMessage = error.message || 'Internal server error';

  const logPayload = {
    message: errorMessage,
    statusCode,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    stack: error.stack,
  };

  // Log 5xx errors as 'error' and 4xx client errors as 'warn'
  if (statusCode >= 500) {
    logger.error(`API Error: ${errorMessage}`, logPayload);
  } else {
    logger.warn(`API Warning: ${errorMessage}`, logPayload);
  }

  return errorResponse(res, errorMessage, statusCode);
};