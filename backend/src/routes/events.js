const express = require('express');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { successResponse } = require('../utils/response');
const eventHub = require('../services/eventHub');

const router = express.Router();

/**
 * GET /api/events
 * Server-Sent Events endpoint. Authenticated with role and customer-scoped stream.
 */
router.get(
  '/',
  authenticate,
  (req, res) => {
    // Set headers for SSE stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering if proxied
    res.flushHeaders?.();

    // Keep alive ping interval
    const pingInterval = setInterval(() => {
      try {
        res.write(': keepalive ping\n\n');
      } catch {
        clearInterval(pingInterval);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(pingInterval);
    });

    // Register with eventHub
    eventHub.registerClient(req.user, res);
  }
);

/**
 * GET /api/events/notifications
 * In-app notifications list and unread count.
 */
router.get(
  '/notifications',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = await eventHub.getUserNotifications(req.user);
    return successResponse(res, data);
  })
);

/**
 * PATCH /api/events/notifications/read
 * Mark notification(s) as read.
 * Body: { id: 123 } or { id: 'all' }
 */
router.patch(
  '/notifications/read',
  authenticate,
  asyncHandler(async (req, res) => {
    const id = req.body.id || 'all';
    await eventHub.markAsRead(id, req.user);
    return successResponse(res, { success: true, markedRead: id });
  })
);

module.exports = router;
