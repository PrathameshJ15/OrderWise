const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { env } = require('../config/env');
const auth = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

// POST /api/auth/register
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return errorResponse(res, 'Name, email, and password are required', 'VALIDATION_ERROR', {}, 400);
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rowCount > 0) {
      return errorResponse(res, 'A user with this email already exists', 'CONFLICT', {}, 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'customer')
       RETURNING id, name, email, role, created_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    return successResponse(
      res,
      {
        token,
        user: {
          id: parseInt(user.id, 10),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      undefined,
      201
    );
  })
);

// POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 'VALIDATION_ERROR', {}, 400);
    }

    const result = await query(
      'SELECT id, name, email, password_hash, role, active FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'Invalid email or password', 'INVALID_CREDENTIALS', {}, 401);
    }

    const user = result.rows[0];
    if (!user.active) {
      return errorResponse(res, 'Account is deactivated', 'ACCOUNT_DISABLED', {}, 403);
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return errorResponse(res, 'Invalid email or password', 'INVALID_CREDENTIALS', {}, 401);
    }

    const token = generateToken(user);

    return successResponse(res, {
      token,
      user: {
        id: parseInt(user.id, 10),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  })
);

// GET /api/auth/me
router.get(
  '/me',
  auth,
  asyncHandler(async (req, res) => {
    const result = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'User not found', 'NOT_FOUND', {}, 404);
    }

    const user = result.rows[0];
    return successResponse(res, {
      id: parseInt(user.id, 10),
      name: user.name,
      email: user.email,
      role: user.role,
    });
  })
);

module.exports = router;
