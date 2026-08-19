// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");
const ejs = require("ejs");

const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const publicRoutes = require("./routes/public-resume.routes");
const aiRoutes = require("./routes/ai.routes");
const { errorHandler, notFound } = require("./middlewares/error.middleware");
const { setupSwagger } = require("../swagger");
const httpLogger = require("./middlewares/httpLogger.middleware");

const app = express();

// Enable proxy trust for Vercel/reverse proxies (Fixes rate-limit error)
app.set("trust proxy", 1);

// Initialize Swagger Documentation
setupSwagger(app);

// View engine setup
app.engine("html", ejs.renderFile);
app.set("view engine", "html");
app.set("views", path.join(__dirname, "views"));

// CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://careeros-ui.vercel.app",
  "https://careeros-api-22tq.vercel.app",
  "https://careeros-api-beta.vercel.app",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS Not Allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "accept"],
  }),
);

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 1. Attach Request Logger Middleware
app.use(httpLogger);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Global Rate Limiter
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
  }),
);

// Routes
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CareerOs API running...",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/candidate/profile", profileRoutes);
app.use("/api/ai", aiRoutes);
app.use("/", publicRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
