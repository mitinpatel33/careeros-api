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

// Trust reverse proxy (Required for Vercel rate-limiter and IP tracking)
app.set("trust proxy", 1);

// Configure CORS to accept local and production Swagger requests
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin Swagger requests)
      if (!origin) return callback(null, true);
      
      // Dynamic origin acceptance for Vercel previews and localhost
      if (
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(new Error("CORS Not Allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "accept", "Origin", "X-Requested-With"],
  })
);

// Disable CSP restriction for inline Swagger styles
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging middleware
app.use(httpLogger);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Global Rate Limiter
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
  })
);

// Attach Swagger Docs
setupSwagger(app);

// Application Routes
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

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;