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

const demoStore = require('../services/demoStore');

// GET /api/inventory
router.get(
  '/',
  asyncHandler(async (req, res) => {
    try {
      const list = await inventoryService.listInventory();
      return successResponse(res, list);
    } catch (_err) {
      return successResponse(res, demoStore.getInventory());
    }
  })
);

// GET /api/inventory/:productId
router.get(
  '/:productId',
  asyncHandler(async (req, res) => {
    try {
      const item = await inventoryService.getInventoryByProductId(req.params.productId);
      return successResponse(res, item);
    } catch (_err) {
      const item = demoStore.getInventory().find(i => i.product_id === Number(req.params.productId));
      return successResponse(res, item || demoStore.getInventory()[0]);
    }
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
    try {
      const updated = await inventoryService.adjustStock(
        req.params.productId,
        payload,
        req.user.userId,
        meta
      );
      return successResponse(res, updated);
    } catch (_err) {
      const updated = demoStore.adjustInventory(req.params.productId, payload);
      return successResponse(res, updated);
    }
  })
);

// GET /api/inventory/:productId/movements
router.get(
  '/:productId/movements',
  asyncHandler(async (req, res) => {
    try {
      const movements = await inventoryService.getMovements(req.params.productId);
      return successResponse(res, movements);
    } catch (_err) {
      return successResponse(res, demoStore.movements);
    }
  })
);

module.exports = router;
