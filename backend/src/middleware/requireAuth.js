import { HttpError } from "../utils/HttpError.js";

/**
 * Rejects the request with 401 if no authenticated user is present.
 * Attach to any route that needs a logged-in user.
 */
export function requireAuth(req, _res, next) {
  if (!req.user) {
    return next(new HttpError(401, "Authentication required", "AUTH_REQUIRED"));
  }
  next();
}
