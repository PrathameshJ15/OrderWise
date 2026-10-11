const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { errorResponse } = require('../utils/response');

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Authentication token required', 'UNAUTHORIZED', {}, 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      userId: decoded.userId || decoded.id,
      role: decoded.role,
      email: decoded.email,
    };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Authentication token has expired', 'TOKEN_EXPIRED', {}, 401);
    }
    return errorResponse(res, 'Invalid authentication token', 'UNAUTHORIZED', {}, 401);
  }
}

module.exports = auth;
