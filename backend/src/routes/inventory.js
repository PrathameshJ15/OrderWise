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
  adjustmentType: z.enum(['set', 'delta']).default('delta'),
  quantity: z.number().int(),
  reason: z.string().min(3, 'A clear reason is required for inventory adjustments'),
  expectedVersion: z.number().int().optional(),
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
    const updated = await inventoryService.adjustStock(
      req.params.productId,
      req.body,
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
