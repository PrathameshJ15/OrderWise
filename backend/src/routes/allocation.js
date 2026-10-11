const express = require('express');
const { z } = require('zod');
const { validateRequest } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const { successResponse } = require('../utils/response');
const allocationEngine = require('../services/allocationEngine');

const router = express.Router();

// All allocation endpoints require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

const runAllocationSchema = z.object({
  product_ids: z.union([z.array(z.coerce.number().int().positive()), z.literal('all')]).optional(),
  productIds: z.union([z.array(z.coerce.number().int().positive()), z.literal('all')]).optional(),
  notes: z.string().optional(),
  dry_run: z.boolean().optional(),
  dryRun: z.boolean().optional(),
});

// POST /api/allocation/run (Admin only)
router.post(
  '/run',
  validateRequest({ body: runAllocationSchema }),
  asyncHandler(async (req, res) => {
    const productIds = req.body.product_ids ?? req.body.productIds ?? 'all';
    const dryRun = Boolean(req.body.dry_run ?? req.body.dryRun ?? false);
    const notes = req.body.notes || '';
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };

    const result = await allocationEngine.runAllocationEngine({
      productIds,
      initiatedBy: req.user.userId,
      notes,
      dryRun,
      reqMeta: meta,
    });

    return successResponse(res, result, undefined, 200);
  })
);

// GET /api/allocation/runs (Admin only - List history)
router.get(
  '/runs',
  asyncHandler(async (req, res) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const status = req.query.status || null;

    const data = await allocationEngine.getAllocationRuns({ page, limit, status });
    return successResponse(res, data.runs, { pagination: data.pagination });
  })
);

// GET /api/allocation/runs/:id (Admin only - Get run details)
router.get(
  '/runs/:id',
  asyncHandler(async (req, res) => {
    const runId = req.params.id;
    const data = await allocationEngine.getAllocationRunById(runId);
    return successResponse(res, data);
  })
);

module.exports = router;
