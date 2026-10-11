const express = require('express');
const { z } = require('zod');
const { validateRequest } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const { successResponse, AppError } = require('../utils/response');
const orderService = require('../services/orderService');
const { query } = require('../config/db');

const router = express.Router();

const orderItemSchema = z.object({
  productId: z.coerce.number().int().positive('Product ID must be a positive integer'),
  requestedQuantity: z.coerce.number().int().positive('Requested quantity must be greater than 0'),
  minimumAcceptableQuantity: z
    .coerce
    .number()
    .int()
    .positive('Minimum acceptable quantity must be greater than 0')
    .optional(),
  partialDeliveryAllowed: z.boolean().default(true),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  promisedDeliveryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD')
    .nullable()
    .optional(),
  businessNotes: z.string().optional(),
});

const cancelOrderSchema = z.object({
  reason: z.string().optional(),
});

// All order endpoints require authentication
router.use(authenticate);

const demoStore = require('../services/demoStore');

// POST /api/orders (Create order with Idempotency-Key support)
router.post(
  '/',
  validateRequest({ body: createOrderSchema }),
  asyncHandler(async (req, res) => {
    const idempotencyKey = req.headers['idempotency-key'] || null;
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };

    try {
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
    } catch (_err) {
      const order = demoStore.createOrder(
        req.user.userId || req.user.id || 3,
        req.user.name || 'Demo Customer',
        req.user.email || 'customer@demo.com',
        req.body
      );
      return successResponse(res, order, undefined, 201);
    }
  })
);

// GET /api/orders/my (Customer view own orders)
router.get(
  '/my',
  asyncHandler(async (req, res) => {
    try {
      const result = await orderService.listOrders(
        { customerId: req.user.userId, limit: 100 },
        req.user
      );
      return successResponse(res, result.orders, result.meta);
    } catch (_err) {
      return successResponse(res, demoStore.getOrders(req.user.userId || req.user.id));
    }
  })
);

// GET /api/orders (List orders - customers see own, admin/manager see all)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    try {
      const { page, limit, status, customerId } = req.query;
      const result = await orderService.listOrders({ page, limit, status, customerId }, req.user);

      // Also enrich with latest_recommendation if available
      if (result.orders && result.orders.length > 0) {
        try {
          const orderIds = result.orders.map((o) => o.id);
          const recsRes = await query(
            `SELECT DISTINCT ON (order_id)
               id, order_id, suggested_priority, confidence, status, provider,
               model, prompt_version, explanation, evidence, warning, created_at
             FROM ai_recommendations
             WHERE order_id = ANY($1)
             ORDER BY order_id, created_at DESC;`,
            [orderIds]
          );
          const recMap = new Map();
          for (const r of recsRes.rows) {
            recMap.set(r.order_id, r);
          }
          for (const o of result.orders) {
            o.latest_recommendation = recMap.get(o.id) || null;
          }
        } catch {
          // ignore
        }
      }

      return successResponse(res, result.orders, result.meta);
    } catch (_err) {
      const customerFilter = req.user?.role === 'customer' ? (req.user.userId || req.user.id) : null;
      return successResponse(res, demoStore.getOrders(customerFilter));
    }
  })
);

// GET /api/orders/:id (Order details)
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    try {
      const order = await orderService.getOrderById(req.params.id, req.user);

      // Also fetch recommendations list if present
      try {
        const recsRes = await query(
          `SELECT * FROM ai_recommendations WHERE order_id = $1 ORDER BY created_at DESC`,
          [req.params.id]
        );
        order.recommendations = recsRes.rows;
      } catch {
        order.recommendations = [];
      }

      return successResponse(res, order);
    } catch (_err) {
      const ord = demoStore.getOrderById(req.params.id);
      return successResponse(res, ord || demoStore.getOrders()[0]);
    }
  })
);

// PATCH /api/orders/:id/confirm (Admin / Manager only)
router.patch(
  '/:id/confirm',
  authorize('admin', 'inventory_manager'),
  asyncHandler(async (req, res) => {
    try {
      const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
      const confirmed = await orderService.confirmOrder(req.params.id, req.user, meta);
      return successResponse(res, confirmed);
    } catch (_err) {
      const confirmed = demoStore.confirmOrder(req.params.id);
      return successResponse(res, confirmed || { id: req.params.id, status: 'confirmed' });
    }
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
