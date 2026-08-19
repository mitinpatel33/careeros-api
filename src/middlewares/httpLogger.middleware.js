// src/middlewares/httpLogger.middleware.js
const morgan = require("morgan");
const logger = require("../utils/logger");

// Stream morgan logs into Winston
const stream = {
  write: (message) => logger.info(message.trim()),
};

// Custom Morgan format
const httpLogger = morgan(
  ":remote-addr - :method :url :status :res[content-length] - :response-time ms",
  { stream },
);

module.exports = httpLogger;
