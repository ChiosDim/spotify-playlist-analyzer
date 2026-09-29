import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import * as Sentry from "@sentry/node";

import apiRouter from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Security + performance
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://127.0.0.1:5173",
    credentials: true,
  })
);

// Body + cookie parsing
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Structured request logging
app.use(
  pinoHttp({
    autoLogging: process.env.NODE_ENV !== "test",
    level: process.env.NODE_ENV === "test" ? "silent" : "info",
  })
);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", env: process.env.NODE_ENV } });
});

// Feature routes
app.use("/api", apiRouter);

// 404 (only runs if no route matched)
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
