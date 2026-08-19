// src/utils/logger.js
const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');

// Define log format
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Daily Rotate Transport for Error Logs (5xx / Critical errors)
const errorRotateTransport = new transports.DailyRotateFile({
  filename: `${logDir}/error-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

// Daily Rotate Transport for Combined Logs (All HTTP/App Logs)
const combinedRotateTransport = new transports.DailyRotateFile({
  filename: `${logDir}/combined-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    errorRotateTransport,
    combinedRotateTransport,
  ],
});

// If not in production, log formatted output to console
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, stack }) => {
          return `[${timestamp}] ${level}: ${stack || message}`;
        })
      ),
    })
  );
}

module.exports = logger;