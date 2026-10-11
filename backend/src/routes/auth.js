const express = require('express');
const { z } = require('zod');
const { validateRequest } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { checkOwnership } = require('../middleware/ownership');
const asyncHandler = require('../middleware/asyncHandler');
const { successResponse } = require('../utils/response');
const authService = require('../services/authService');
const { logAuditEvent } = require('../utils/audit');

const router = express.Router();

// Validation Schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('A valid email address is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  // Optional role in payload — will be strictly ignored by service
  role: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('A valid email address is required'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/register
router.post(
  '/register',
  validateRequest({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const result = await authService.registerCustomer(req.body, meta);
    return successResponse(res, result, undefined, 201);
  })
);

// POST /api/auth/login
router.post(
  '/login',
  validateRequest({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const result = await authService.loginUser(req.body, meta);
    return successResponse(res, result);
  })
);

// GET /api/auth/me
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    return successResponse(res, { user: req.user });
  })
);

// POST /api/auth/logout
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    await logAuditEvent({
      actorId: req.user.userId,
      action: 'LOGOUT',
      entityType: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return successResponse(res, { message: 'Logged out successfully' });
  })
);

// RBAC & Ownership verification routes for acceptance gate testing
router.get(
  '/admin-only',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    return successResponse(res, { message: 'Welcome Admin', user: req.user });
  })
);

router.get(
  '/customer-resource/:customerId',
  authenticate,
  checkOwnership('customerId'),
  asyncHandler(async (req, res) => {
    return successResponse(res, {
      message: 'Resource accessed successfully',
      customerId: req.params.customerId,
      viewerId: req.user.userId,
    });
  })
);

module.exports = router;
