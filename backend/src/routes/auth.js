const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { env } = require('../config/env');
const auth = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/response');

const router = express.Router();

// Helper to sign JWT token
function signToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 'Name, email, and password are required', 'VALIDATION_ERROR', {}, 400);
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      return errorResponse(res, 'Invalid email address', 'VALIDATION_ERROR', {}, 400);
    }

    if (typeof password !== 'string' || password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters long', 'VALIDATION_ERROR', {}, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rowCount > 0) {
      return errorResponse(res, 'A user with this email already exists', 'CONFLICT', {}, 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, active)
       VALUES ($1, $2, $3, 'customer', true)
       RETURNING id, name, email, role, created_at`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    const newUser = result.rows[0];
    const token = signToken(newUser);

    const responsePayload = {
      token,
      user: {
        id: Number(newUser.id),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    };

    return res.status(201).json({
      success: true,
      ...responsePayload,
      data: responsePayload,
    });
  } catch (err) {
    console.error('Registration error:', err);
    return errorResponse(res, err.message, 'REGISTRATION_ERROR', {}, 500);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 'VALIDATION_ERROR', {}, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const result = await query(
      `SELECT id, name, email, password_hash, role, active FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'Invalid email or password', 'INVALID_CREDENTIALS', {}, 401);
    }

    const user = result.rows[0];
    if (!user.active) {
      return errorResponse(res, 'Account is deactivated', 'ACCOUNT_DISABLED', {}, 403);
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return errorResponse(res, 'Invalid email or password', 'INVALID_CREDENTIALS', {}, 401);
    }

    const token = signToken(user);
    const userPayload = {
      id: Number(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return res.status(200).json({
      success: true,
      token,
      user: userPayload,
      data: {
        token,
        user: userPayload,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return errorResponse(res, err.message, 'LOGIN_ERROR', {}, 500);
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, role, created_at FROM users WHERE id = $1`,
      [req.user.userId]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'User not found', 'NOT_FOUND', {}, 404);
    }

    const user = result.rows[0];
    const userPayload = {
      id: Number(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return res.status(200).json({
      success: true,
      id: userPayload.id,
      name: userPayload.name,
      email: userPayload.email,
      role: userPayload.role,
      user: userPayload,
      data: userPayload,
    });
  } catch (err) {
    console.error('Auth me error:', err);
    return errorResponse(res, err.message, 'INTERNAL_SERVER_ERROR', {}, 500);
  }
});

module.exports = router;
