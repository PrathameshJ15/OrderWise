const express = require('express');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');
const {
  scanAndGenerateAlerts,
  getAlerts,
  acknowledgeAlert,
  resolveAlert,
} = require('../services/alertService');

const router = express.Router();

// Require authenticated admin or inventory_manager
router.use(auth);
router.use(rbac('admin', 'inventory_manager'));

/**
 * GET /api/alerts
 * Returns alerts with filtering. Automatically performs a quick scan to detect fresh stock conditions.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, severity, alert_type, product_id, page, limit, no_scan } = req.query;

    if (!no_scan) {
      try {
        await scanAndGenerateAlerts();
      } catch (err) {
        console.warn('Alert scan warning during fetch:', err.message);
      }
    }

    const data = await getAlerts({
      status,
      severity,
      alert_type,
      product_id,
      page: page || 1,
      limit: limit || 50,
    });

    return successResponse(res, data);
  })
);

/**
 * POST /api/alerts/scan
 * Force runs the alert scanner across all products and orders
 */
router.post(
  '/scan',
  asyncHandler(async (req, res) => {
    const result = await scanAndGenerateAlerts();
    return successResponse(res, result);
  })
);

/**
 * PATCH /api/alerts/:id/acknowledge
 * Acknowledges an active alert
 */
router.patch(
  '/:id/acknowledge',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const alert = await acknowledgeAlert(parseInt(id, 10), req.user.userId);
    return successResponse(res, { alert, message: 'Alert acknowledged successfully.' });
  })
);

/**
 * PATCH /api/alerts/:id/resolve
 * Resolves an alert
 */
router.patch(
  '/:id/resolve',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const alert = await resolveAlert(parseInt(id, 10), req.user.userId);
    return successResponse(res, { alert, message: 'Alert resolved successfully.' });
  })
);

module.exports = router;
