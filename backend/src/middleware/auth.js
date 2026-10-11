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

    // Look up active user in DB
    const userRes = await query(
      `SELECT id, name, email, role, active FROM users WHERE id = $1 LIMIT 1;`,
      [decoded.userId || decoded.id]
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
    if (err instanceof jwt.TokenExpiredError || err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Authentication token has expired', 'TOKEN_EXPIRED', null, 401);
    }
    return errorResponse(res, 'Invalid authentication token', 'INVALID_TOKEN', null, 401);
  }
}

// Support both `const auth = require(...)` and `const { authenticate } = require(...)`
module.exports = authenticate;
module.exports.authenticate = authenticate;
module.exports.auth = authenticate;
