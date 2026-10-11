const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
<<<<<<< HEAD
const { query } = require('../config/db');
const { errorResponse } = require('../utils/response');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Authentication token required', 'UNAUTHORIZED', null, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Look up active user in DB
    const userRes = await query(
      `SELECT id, name, email, role, active FROM users WHERE id = $1 LIMIT 1;`,
      [decoded.userId]
    );

    if (userRes.rowCount === 0) {
      return errorResponse(res, 'User no longer exists', 'UNAUTHORIZED', null, 401);
    }

    const user = userRes.rows[0];

    if (!user.active) {
      return errorResponse(res, 'Account is deactivated', 'UNAUTHORIZED', null, 401);
    }

    req.user = {
      userId: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return errorResponse(res, 'Authentication token has expired', 'TOKEN_EXPIRED', null, 401);
    }
    return errorResponse(res, 'Invalid authentication token', 'INVALID_TOKEN', null, 401);
  }
}

module.exports = { authenticate, auth: authenticate };
=======
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
>>>>>>> origin/main
