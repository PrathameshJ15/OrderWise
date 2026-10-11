/**
 * Standard API response builders for OrderWise.
 * Guarantees compatibility with both Phase 1 and AGENTS.md Section 15 specifications.
 */

function successResponse(res, data = null, meta = undefined, statusCode = 200) {
  const body = {
    success: true,
    data,
  };

  if (meta !== undefined) {
    body.meta = meta;
  }

  return res.status(statusCode).json(body);
}

function errorResponse(
  res,
  message = 'An unexpected error occurred',
  code = 'INTERNAL_SERVER_ERROR',
  details = undefined,
  statusCode = 500
) {
  const errorObj = {
    code,
    message,
  };

  if (details !== undefined) {
    errorObj.details = details;
  }

  return res.status(statusCode).json({
    success: false,
    error: errorObj,
    // Top-level aliases for AGENTS.md Section 15 compatibility
    message,
    code,
    details: details || {},
  });
}

class AppError extends Error {
  constructor(message, code = 'INTERNAL_SERVER_ERROR', statusCode = 500, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  successResponse,
  errorResponse,
  AppError,
};
