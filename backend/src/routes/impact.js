const express = require('express');
const { query } = require('../config/db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');
const { compareRuns } = require('../services/impactAnalyzer');

const router = express.Router();

// Require admin authentication for impact analysis
router.use(auth);
router.use(rbac('admin'));

/**
 * GET /api/impact/compare?baseRun=&targetRun=
 * Compares two allocation runs. Defaults to the two latest completed runs.
 */
router.get(
  '/compare',
  asyncHandler(async (req, res) => {
    const { baseRun, targetRun } = req.query;

    const baseRunId = baseRun ? parseInt(baseRun, 10) : null;
    const targetRunId = targetRun ? parseInt(targetRun, 10) : null;

    try {
      const comparison = await compareRuns(baseRunId, targetRunId);
      return successResponse(res, comparison);
    } catch (err) {
      return errorResponse(res, err.message, 'COMPARISON_ERROR', {}, 400);
    }
  })
);

/**
 * GET /api/impact/runs
 * Returns list of completed allocation runs available for comparison selection.
 */
router.get(
  '/runs',
  asyncHandler(async (req, res) => {
    const runsRes = await query(
      `SELECT r.id, r.run_type, r.status, r.total_items_considered,
              r.total_items_fulfilled, r.total_items_partially_fulfilled,
              r.total_items_deferred, r.duration_ms, r.notes,
              r.created_at, r.completed_at,
              u.name as initiated_by_name
       FROM allocation_runs r
       LEFT JOIN users u ON u.id = r.initiated_by
       WHERE r.status = 'completed'
       ORDER BY r.id DESC
       LIMIT 50`
    );

    return successResponse(res, { runs: runsRes.rows });
  })
);

module.exports = router;
