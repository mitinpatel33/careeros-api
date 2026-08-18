const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const publicRoutes = require("./routes/public-resume.routes");
const aiRoutes = require("./routes/ai.routes");
const { errorHandler, notFound } = require("./middlewares/error.middleware");
const { setupSwagger } = require("../swagger");
const { success } = require("zod");
const ejs = require("ejs");

const app = express();

setupSwagger(app);

// view engine setup
app.engine("html", ejs.renderFile); // tell Express to use EJS for .html files
app.set("view engine", "html"); // keep your existing engine setting
app.set("views", path.join(__dirname, "views"));

const allowedOrigins = [
  "http://localhost:5173",
  "https://careeros-ui.vercel.app", // Replace with your frontend Vercel URL
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS Not Allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
  }),
);

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

app.use(notFound);
app.use(errorHandler);

module.exports = app;
