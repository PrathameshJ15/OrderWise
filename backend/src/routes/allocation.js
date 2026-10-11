const express = require('express');
const { pool, query } = require('../config/db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');
const { runAllocationEngine } = require('../services/allocationEngine');

const router = express.Router();

router.use(auth);
router.use(rbac('admin'));

// POST /api/allocation/run - Runs allocation engine inside transaction
router.post(
  '/run',
  asyncHandler(async (req, res) => {
    let { product_ids, notes } = req.body || {};

    let targetProductIds = [];
    if (product_ids === 'all' || !product_ids || product_ids.length === 0) {
      const allProds = await query('SELECT id FROM products WHERE active = true ORDER BY id');
      targetProductIds = allProds.rows.map((p) => p.id);
    } else if (Array.isArray(product_ids)) {
      targetProductIds = product_ids;
    } else {
      targetProductIds = [product_ids];
    }

    const startTime = Date.now();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create allocation_run record with status in_progress
      const runRes = await client.query(
        `INSERT INTO allocation_runs (run_type, status, initiated_by, notes)
         VALUES ('manual', 'in_progress', $1, $2)
         RETURNING *`,
        [req.user.userId, notes || null]
      );
      const runId = runRes.rows[0].id;

      // Execute deterministic allocation engine
      const results = await runAllocationEngine(targetProductIds, client);

      let fulfilled = 0;
      let partiallyFulfilled = 0;
      let deferred = 0;

      // Save each result into allocation_results
      for (const item of results) {
        if (item.status === 'fulfilled') fulfilled++;
        else if (item.status === 'partially_fulfilled') partiallyFulfilled++;
        else deferred++;

        await client.query(
          `INSERT INTO allocation_results (
            allocation_run_id, order_item_id, requested_quantity, allocated_quantity,
            status, explanation
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            runId,
            item.order_item_id,
            item.requested_quantity,
            item.allocated_quantity,
            item.status,
            JSON.stringify(item.explanation),
          ]
        );
      }

      const durationMs = Date.now() - startTime;

      // Update allocation run summary
      const updatedRunRes = await client.query(
        `UPDATE allocation_runs
         SET status = 'completed',
             total_items_considered = $1,
             total_items_fulfilled = $2,
             total_items_partially_fulfilled = $3,
             total_items_deferred = $4,
             duration_ms = $5,
             completed_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [results.length, fulfilled, partiallyFulfilled, deferred, durationMs, runId]
      );

      await client.query('COMMIT');

      return successResponse(res, {
        run: updatedRunRes.rows[0],
        summary: {
          total_items_processed: results.length,
          fulfilled,
          partially_fulfilled: partiallyFulfilled,
          deferred,
        },
        results,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

// GET /api/allocation/runs - History
router.get(
  '/runs',
  asyncHandler(async (req, res) => {
    const runsRes = await query(
      `SELECT r.*, u.name as initiated_by_name
       FROM allocation_runs r
       LEFT JOIN users u ON u.id = r.initiated_by
       ORDER BY r.created_at DESC
       LIMIT 50`
    );
    return successResponse(res, { runs: runsRes.rows });
  })
);

// GET /api/allocation/runs/:id - Details for single run
router.get(
  '/runs/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const runRes = await query(
      `SELECT r.*, u.name as initiated_by_name
       FROM allocation_runs r
       LEFT JOIN users u ON u.id = r.initiated_by
       WHERE r.id = $1`,
      [id]
    );

    if (runRes.rowCount === 0) {
      return errorResponse(res, 'Allocation run not found', 'NOT_FOUND', {}, 404);
    }

    const resultsRes = await query(
      `SELECT ar.*, oi.order_id, p.name as product_name, p.sku,
              u.name as customer_name
       FROM allocation_results ar
       JOIN order_items oi ON oi.id = ar.order_item_id
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       JOIN users u ON u.id = o.customer_id
       WHERE ar.allocation_run_id = $1
       ORDER BY ar.id ASC`,
      [id]
    );

    return successResponse(res, {
      run: runRes.rows[0],
      results: resultsRes.rows,
    });
  })
);

// GET /api/allocation/impact/:runId - Compare run against immediately preceding run
router.get(
  '/impact/:runId',
  asyncHandler(async (req, res) => {
    const { runId } = req.params;
    const currentRunId = parseInt(runId, 10);

    const prevRunRes = await query(
      `SELECT id FROM allocation_runs
       WHERE id < $1 AND status = 'completed'
       ORDER BY id DESC
       LIMIT 1`,
      [currentRunId]
    );

    if (prevRunRes.rowCount === 0) {
      return errorResponse(res, 'No previous allocation run found to compare against.', 'NOT_FOUND', {}, 404);
    }

    const { compareRuns } = require('../services/impactAnalyzer');
    const previousRunId = prevRunRes.rows[0].id;
    const comparison = await compareRuns(previousRunId, currentRunId);

    return successResponse(res, { impact: comparison });
  })
);

module.exports = router;
