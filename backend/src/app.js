import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import passport from "passport";
import * as Sentry from "@sentry/node";

import apiRouter from "./routes/index.js";
import authRouter from "./routes/authRoutes.js";
import spotifyRouter from "./routes/spotifyRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { buildSessionMiddleware } from "./middleware/sessionMiddleware.js";
import { configurePassport } from "./config/passport.js";

const app = express();

app.set("trust proxy", 1); // behind Fly.io's proxy — needed for secure cookies

// Security + performance
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://127.0.0.1:5173",
    credentials: true,
  })
);

// Request parsing and logging
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(
  pinoHttp({
    autoLogging: process.env.NODE_ENV !== "test",
    level: process.env.NODE_ENV === "test" ? "silent" : "info",
    redact: ["req.headers.cookie", "req.headers.authorization"],
  })
);

// Session + Passport (must come before routes that use req.user)
app.use(buildSessionMiddleware());
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Health
app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", env: process.env.NODE_ENV } });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/spotify", spotifyRouter);
app.use("/api", apiRouter); // CSV routes

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    code: "NOT_FOUND",
  });
});

// Sentry: capture unexpected errors first
Sentry.setupExpressErrorHandler(app);
// Our own error formatter, runs after Sentry
app.use(errorHandler);

export default app;
