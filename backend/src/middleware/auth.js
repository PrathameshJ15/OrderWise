const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { errorResponse } = require('../utils/response');

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Authentication token required', 'UNAUTHORIZED', undefined, 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return errorResponse(res, 'Invalid authorization format', 'UNAUTHORIZED', undefined, 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      userId: decoded.userId || decoded.id,
      id: decoded.userId || decoded.id,
      role: decoded.role,
      email: decoded.email,
    };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token has expired', 'TOKEN_EXPIRED', undefined, 401);
    }
    return errorResponse(res, 'Invalid authentication token', 'INVALID_TOKEN', undefined, 401);
  }
}

// Optional auth: populates req.user if present, but doesn't block if missing
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      userId: decoded.userId || decoded.id,
      id: decoded.userId || decoded.id,
      role: decoded.role,
      email: decoded.email,
    };
  } catch {
    // Ignore invalid token in optional auth
  }

  return next();
}

module.exports = { auth, optionalAuth };
