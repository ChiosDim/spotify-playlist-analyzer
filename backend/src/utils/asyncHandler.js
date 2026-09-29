/**
 * Wraps an async Express handler so thrown errors and rejected promises
 * are forwarded to `next(err)` automatically. Necessary because Express 4
 * does not await async handlers.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
