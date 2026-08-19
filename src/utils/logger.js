// src/utils/logger.js
const { createLogger, format, transports } = require("winston");

// Determine execution environment
const isVercel =
  process.env.VERCEL || process.env.NEXT_RUNTIME || process.env.NOW_BUILDER;
const isProduction = process.env.NODE_ENV === "production";

// Base log formatting
const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.splat(),
  format.json(),
);

// Base transports configuration (Console output)
const loggerTransports = [
  new transports.Console({
    format:
      isVercel || isProduction
        ? logFormat
        : format.combine(
            format.colorize(),
            format.printf(({ timestamp, level, message, stack }) => {
              return `[${timestamp}] ${level}: ${stack || message}`;
            }),
          ),
  }),
];

// Attach file rotation transports ONLY when running outside Vercel/Production
if (!isVercel && !isProduction) {
  try {
    const DailyRotateFile = require("winston-daily-rotate-file");
    const path = require("path");
    const fs = require("fs");

    const logDir = path.join(__dirname, "../../logs");

    // Ensure logs directory exists locally
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    loggerTransports.push(
      new DailyRotateFile({
        filename: path.join(logDir, "error-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        level: "error",
        maxSize: "20m",
        maxFiles: "14d",
        zippedArchive: true,
      }),
      new DailyRotateFile({
        filename: path.join(logDir, "combined-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        maxSize: "20m",
        maxFiles: "14d",
        zippedArchive: true,
      }),
    );
  } catch (err) {
    // Graceful fallback if winston-daily-rotate-file is not installed locally
    console.warn("File logging disabled:", err.message);
  }
}

// Instantiate Winston Logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  transports: loggerTransports,
});

module.exports = logger;
