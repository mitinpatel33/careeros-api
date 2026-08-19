const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");
const ejs = require("ejs");

const connectDB = require("./config/db"); // Imported DB manager
const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const publicRoutes = require("./routes/public-resume.routes");
const aiRoutes = require("./routes/ai.routes");
const { errorHandler, notFound } = require("./middlewares/error.middleware");
const { setupSwagger } = require("../swagger");
const httpLogger = require("./middlewares/httpLogger.middleware");

const app = express();

// Enable proxy trust for Vercel/reverse proxies
app.set("trust proxy", 1);

// Ensure MongoDB is connected BEFORE handling any API request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// Configure CORS for dynamic environments (Local + Vercel Preview/Prod)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5000",
  "http://127.0.0.1:5173",
  process.env.CLIENT_URL,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      if (
        allowedOrigins.includes(origin) ||
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

// Configure Helmet without blocking Swagger UI assets
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging middleware
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

// View engine setup
app.engine("html", ejs.renderFile);
app.set("view engine", "html");
app.set("views", path.join(__dirname, "views"));

// Attach Swagger Documentation
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