const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
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

    req.user = {
      userId: decoded.userId || decoded.id,
      id: decoded.userId || decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
    };

    try {
      const userRes = await query(
        `SELECT id, name, email, role, active FROM users WHERE id = $1 LIMIT 1;`,
        [req.user.userId]
      );

      if (userRes && userRes.rowCount > 0) {
        const user = userRes.rows[0];
        if (!user.active) {
          return errorResponse(res, 'Account is deactivated', 'UNAUTHORIZED', null, 401);
        }
        req.user.name = user.name;
        req.user.email = user.email;
        req.user.role = user.role;
      }
    } catch {
      // If DB is offline or mock, continue with JWT token payload
    }

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError || err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Authentication token has expired', 'TOKEN_EXPIRED', null, 401);
    }
    return errorResponse(res, 'Invalid authentication token', 'INVALID_TOKEN', null, 401);
  }
}

authenticate.authenticate = authenticate;
authenticate.auth = authenticate;
module.exports = authenticate;
