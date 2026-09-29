/**
 * Typed HTTP error. Throw this anywhere in a controller and the global
 * error handler will translate it into a JSON response with the right status.
 */
export class HttpError extends Error {
  /**
   * @param {number} status - HTTP status code (400, 404, 500, etc.)
   * @param {string} message - Human-readable error message
   * @param {string} [code] - Machine-readable error code for the frontend
   * @param {object} [details] - Optional structured details
   */
  constructor(status, message, code = "ERROR", details = undefined) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (msg, code = "BAD_REQUEST", details) =>
  new HttpError(400, msg, code, details);

export const notFound = (msg = "Not found", code = "NOT_FOUND") => new HttpError(404, msg, code);
