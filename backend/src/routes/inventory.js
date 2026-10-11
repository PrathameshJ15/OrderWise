const express = require('express');
const { z } = require('zod');
const { validateRequest } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const { successResponse } = require('../utils/response');
const inventoryService = require('../services/inventoryService');

const router = express.Router();

const adjustStockSchema = z.object({
  adjustmentType: z.enum(['set', 'delta']).optional().default('delta'),
  quantity: z.number().int().optional(),
  on_hand_quantity: z.number().int().optional(),
  reason: z.string().min(3, 'A clear reason is required for inventory adjustments'),
  expectedVersion: z.number().int().optional(),
  expected_version: z.number().int().optional(),
}).refine(data => data.quantity !== undefined || data.on_hand_quantity !== undefined, {
  message: 'Either quantity or on_hand_quantity must be provided',
});

// All inventory operations require admin or inventory_manager authority
router.use(authenticate);
router.use(authorize('admin', 'inventory_manager'));

// GET /api/inventory
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const list = await inventoryService.listInventory();
    return successResponse(res, list);
  })
);

// GET /api/inventory/:productId
router.get(
  '/:productId',
  asyncHandler(async (req, res) => {
    const item = await inventoryService.getInventoryByProductId(req.params.productId);
    return successResponse(res, item);
  })
);

// PUT /api/inventory/:productId
router.put(
  '/:productId',
  validateRequest({ body: adjustStockSchema }),
  asyncHandler(async (req, res) => {
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const payload = {
      adjustmentType: req.body.on_hand_quantity !== undefined ? 'set' : (req.body.adjustmentType || 'delta'),
      quantity: req.body.on_hand_quantity !== undefined ? req.body.on_hand_quantity : req.body.quantity,
      reason: req.body.reason,
      expectedVersion: req.body.expectedVersion ?? req.body.expected_version,
    };
    const updated = await inventoryService.adjustStock(
      req.params.productId,
      payload,
      req.user.userId,
      meta
    );
    return successResponse(res, updated);
  })
);

// GET /api/inventory/:productId/movements
router.get(
  '/:productId/movements',
  asyncHandler(async (req, res) => {
    const movements = await inventoryService.getMovements(req.params.productId);
    return successResponse(res, movements);
  })
);

module.exports = router;
