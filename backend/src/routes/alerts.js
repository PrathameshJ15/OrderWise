const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const {
  getAlerts,
  getAlertStats,
  evaluateAndGenerateAlerts,
  resolveAlert,
  deleteAlert,
} = require('../services/alertService');

const router = express.Router();

/**
 * GET /api/alerts
 * List alerts with filtering and stats.
 * Roles: admin, inventory_manager
 */
router.get(
  '/',
  authenticate,
  authorize('admin', 'inventory_manager'),
  asyncHandler(async (req, res) => {
    const { resolved, severity, alert_type, product_id, page, limit } = req.query;

    const [alertData, stats] = await Promise.all([
      getAlerts({
        resolved,
        severity,
        alertType: alert_type,
        productId: product_id,
        page,
        limit,
      }),
      getAlertStats(),
    ]);

    res.json({
      success: true,
      data: {
        alerts: alertData.alerts,
        stats,
      },
      meta: alertData.meta,
    });
  })
);

/**
 * POST /api/alerts/scan
 * Evaluates live system state and generates fresh alerts.
 * Roles: admin, inventory_manager
 */
router.post(
  '/scan',
  authenticate,
  authorize('admin', 'inventory_manager'),
  asyncHandler(async (req, res) => {
    const scanResult = await evaluateAndGenerateAlerts();

    res.json({
      success: true,
      data: scanResult,
    });
  })
);

/**
 * PATCH /api/alerts/:id/resolve
 * Marks an alert as resolved.
 * Roles: admin, inventory_manager
 */
router.patch(
  '/:id/resolve',
  authenticate,
  authorize('admin', 'inventory_manager'),
  asyncHandler(async (req, res) => {
    const alertId = req.params.id;
    const resolvedAlert = await resolveAlert(alertId, req.user.userId);

    if (!resolvedAlert) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Alert #${alertId} not found.`,
        },
      });
    }

    res.json({
      success: true,
      data: {
        alert: resolvedAlert,
      },
    });
  })
);

/**
 * DELETE /api/alerts/:id
 * Removes an alert completely.
 * Roles: admin
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const alertId = req.params.id;
    const deleted = await deleteAlert(alertId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Alert #${alertId} not found.`,
        },
      });
    }

    res.json({
      success: true,
      data: {
        id: Number(alertId),
        deleted: true,
      },
    });
  })
);

module.exports = router;
