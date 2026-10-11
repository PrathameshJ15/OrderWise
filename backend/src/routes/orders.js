const express = require('express');
const { z } = require('zod');
const { validateRequest } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const { successResponse, AppError } = require('../utils/response');
const orderService = require('../services/orderService');

const router = express.Router();

const orderItemSchema = z.object({
  productId: z.coerce.number().int().positive('Product ID must be a positive integer'),
  requestedQuantity: z.coerce.number().int().positive('Requested quantity must be greater than 0'),
  minimumAcceptableQuantity: z.coerce.number().int().positive('Minimum acceptable quantity must be greater than 0').optional(),
  partialDeliveryAllowed: z.boolean().default(true),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  promisedDeliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD').nullable().optional(),
  businessNotes: z.string().optional(),
});

const cancelOrderSchema = z.object({
  reason: z.string().optional(),
});

// All order endpoints require authentication
router.use(authenticate);

// POST /api/orders (Create order with Idempotency-Key support)
router.post(
  '/',
  validateRequest({ body: createOrderSchema }),
  asyncHandler(async (req, res) => {
    const idempotencyKey = req.headers['idempotency-key'] || null;
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };

    const order = await orderService.createOrder(
      req.body,
      req.user.userId,
      idempotencyKey,
      meta
    );

    const isReplay = order._idempotentReplay;
    delete order._idempotentReplay;

    return successResponse(
      res,
      order,
      isReplay ? { idempotentReplay: true } : undefined,
      isReplay ? 200 : 201
    );
  })
);

// GET /api/orders (List orders - customers see own, admin/manager see all)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, status, customerId } = req.query;
    const result = await orderService.listOrders({ page, limit, status, customerId }, req.user);
    return successResponse(res, result.orders, result.meta);
  })
);

// GET /api/orders/:id (Order details)
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await orderService.getOrderById(req.params.id, req.user);
    return successResponse(res, order);
  })
);

// PATCH /api/orders/:id/confirm (Admin / Manager only)
router.patch(
  '/:id/confirm',
  authorize('admin', 'inventory_manager'),
  asyncHandler(async (req, res) => {
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const confirmed = await orderService.confirmOrder(req.params.id, req.user, meta);
    return successResponse(res, confirmed);
  })
);

// PATCH /api/orders/:id/cancel (Admin or Customer owner)
router.patch(
  '/:id/cancel',
  validateRequest({ body: cancelOrderSchema }),
  asyncHandler(async (req, res) => {
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const cancelled = await orderService.cancelOrder(req.params.id, req.user, req.body.reason, meta);
    return successResponse(res, cancelled);
  })
);

// PATCH /api/orders/:id/status (Admin only per API_SPEC.md)
router.patch(
  '/:id/status',
  authorize('admin', 'inventory_manager'),
  asyncHandler(async (req, res) => {
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const { status, reason } = req.body;

    if (status === 'cancelled') {
      const cancelled = await orderService.cancelOrder(req.params.id, req.user, reason, meta);
      return successResponse(res, cancelled);
    } else if (status === 'confirmed') {
      const confirmed = await orderService.confirmOrder(req.params.id, req.user, meta);
      return successResponse(res, confirmed);
    } else {
      throw new AppError(
        `Invalid status change request: ${status}. Use specific allocation or transition workflows.`,
        'VALIDATION_ERROR',
        400
      );
    }
  })
);

module.exports = router;
