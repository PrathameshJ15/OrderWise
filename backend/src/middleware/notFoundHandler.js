const { errorResponse } = require('../utils/response');

function notFoundHandler(req, res) {
  return errorResponse(
    res,
    `Route ${req.method} ${req.originalUrl} not found`,
    'NOT_FOUND',
    { path: req.originalUrl, method: req.method },
    404
  );
}

module.exports = notFoundHandler;
