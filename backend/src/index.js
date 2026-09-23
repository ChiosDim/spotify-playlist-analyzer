import "./instrument.mjs"; // ← This MUST come first
import express from "express";
import * as Sentry from "@sentry/node";

const app = express();

// ... your routes ...

Sentry.setupExpressErrorHandler(app); // ← Add this after routes, before other error handlers

app.listen(5000);