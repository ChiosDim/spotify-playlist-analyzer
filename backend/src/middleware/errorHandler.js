import { MulterError } from "multer";
import { ZodError } from "zod";
import { HttpError } from "../utils/HttpError.js";
import { fail } from "../utils/ApiResponse.js";

/**
 * Central error handler. Must be registered AFTER all routes and AFTER
 * Sentry's setupExpressErrorHandler so Sentry captures unexpected errors
 * before we format them.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (res.headersSent) return;

  // Our own typed errors (404, 400, etc.)
  if (err instanceof HttpError) {
    req.log?.warn({ err: { code: err.code, msg: err.message } }, "HTTP error");
    return fail(res, err.status, err.message, err.code, err.details);
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    req.log?.warn({ err }, "Validation error");
    return fail(res, 400, "Validation failed", "VALIDATION_ERROR", {
      issues: err.issues.map((i) => ({ path: i.path, message: i.message })),
    });
  }

  // Multer upload errors
  if (err instanceof MulterError) {
    req.log?.warn({ err }, "Upload error");
    return fail(res, 400, `Upload error: ${err.message}`, err.code);
  }

  // Anything else is a 500. Sentry already captured it upstream.
  req.log?.error({ err }, "Unhandled error");
  console.error(err);
  return fail(res, 500, "Internal server error", "INTERNAL_ERROR");
}
