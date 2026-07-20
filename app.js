const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./src/routes/auth.routes');
const profileRoutes = require('./src/routes/profile.routes')
const { errorHandler, notFound } = require('./src/middlewares/error.middleware');
const { success } = require('zod');

const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if(process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
}));

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "CareerOs API running...",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/candidate/profile", profileRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;