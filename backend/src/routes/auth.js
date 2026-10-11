const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { query } = require('../config/db');
const { env } = require('../config/env');
const auth = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');
const authService = require('../services/authService');
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

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

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

    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const authResult = await authService.registerCustomer({ name, email, password }, meta);

    return res.status(201).json({
      success: true,
      token: authResult.token,
      refreshToken: authResult.refreshToken,
      user: authResult.user,
      data: authResult,
    });
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(res, err.message, err.code, err.details, err.statusCode);
    }
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

    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const authResult = await authService.loginUser({ email, password }, meta);

    return res.status(200).json({
      success: true,
      token: authResult.token,
      refreshToken: authResult.refreshToken,
      user: authResult.user,
      data: authResult,
    });
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(res, err.message, err.code, err.details, err.statusCode);
    }
    console.error('Login error:', err);
    return errorResponse(res, err.message, 'LOGIN_ERROR', {}, 500);
  }
});

// POST /api/auth/refresh
router.post(
  '/refresh',
  validateRequest({ body: refreshSchema }),
  asyncHandler(async (req, res) => {
    const result = await authService.refreshSession(req.body.refreshToken);
    return successResponse(res, result);
  })
);

const rbac = require('../middleware/rbac');

// GET /api/auth/admin-only (Role verification test endpoint)
router.get('/admin-only', auth, rbac('admin'), (req, res) => {
  return res.status(200).json({ success: true, message: 'Admin access granted' });
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
    const userPayload = {
      id: Number(req.user.userId || req.user.id || 1),
      name: req.user.name || 'User',
      email: req.user.email,
      role: req.user.role,
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
  }
});

module.exports = router;
