/**
 * metrics.js route — GET /api/metrics
 * Returns in-process performance metrics snapshot.
 * Restricted to admin role only.
 */

const express = require('express');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { getMetrics } = require('../utils/metrics');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

// GET /api/metrics  (admin only)
router.get(
  '/',
  auth,
  rbac('admin'),
  asyncHandler(async (req, res) => {
    const snapshot = getMetrics();
    return successResponse(res, snapshot);
  })
);

module.exports = router;
