const { AppError, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

function errorHandler(err, req, res, _next) {
  logger.error(`Error processing ${req.method} ${req.originalUrl}: ${err.message}`, {
    stack: err.stack,
    requestId: req.id,
  });

  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.code, err.details, err.statusCode);
  }

  // Handle body-parser JSON syntax errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, 'Malformed JSON payload', 'INVALID_JSON', null, 400);
  }

  // Handle body-parser payload too large (413)
  if (err.status === 413 || err.type === 'entity.too.large') {
    return errorResponse(
      res,
      'Request payload exceeds maximum permitted size of 500KB',
      'PAYLOAD_TOO_LARGE',
      null,
      413
    );
  }

  // Default to internal server error
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred'
      : err.message || 'An internal server error occurred';

  return errorResponse(
    res,
    message,
    'INTERNAL_SERVER_ERROR',
    process.env.NODE_ENV === 'production' ? undefined : { stack: err.stack },
    500
  );
}

module.exports = errorHandler;
