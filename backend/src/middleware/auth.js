const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { errorResponse } = require('../utils/response');

function auth(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return errorResponse(res, 'Authentication token required', 'UNAUTHORIZED', {}, 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      userId: decoded.userId || decoded.id,
      id: decoded.userId || decoded.id,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
    };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Authentication token has expired', 'TOKEN_EXPIRED', {}, 401);
    }
    return errorResponse(res, 'Invalid authentication token', 'UNAUTHORIZED', {}, 401);
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
      name: decoded.name,
    };
  } catch {
    // Ignore invalid token in optional auth
  }

  return next();
}

module.exports = auth;
module.exports.auth = auth;
module.exports.authenticate = auth;
module.exports.optionalAuth = optionalAuth;
