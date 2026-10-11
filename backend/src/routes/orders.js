const express = require('express');
const { query, pool } = require('../config/db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

const router = express.Router();

router.use(auth);

// GET /api/orders - Admin only: all orders with customer info, items, priorities, and recommendation status
router.get(
  '/',
  rbac('admin'),
  asyncHandler(async (req, res) => {
    const ordersRes = await query(
      `SELECT o.id, o.customer_id, o.status, o.promised_delivery_date, o.business_notes, o.created_at,
              u.name as customer_name, u.email as customer_email,
              op.approved_priority, op.priority_rank,
              (
                SELECT json_build_object(
                  'id', rec.id,
                  'suggested_priority', rec.suggested_priority,
                  'confidence', rec.confidence,
                  'status', rec.status,
                  'provider', rec.provider,
                  'model', rec.model,
                  'prompt_version', rec.prompt_version,
                  'explanation', rec.explanation,
                  'evidence', rec.evidence,
                  'warning', rec.warning
                )
                FROM ai_recommendations rec
                WHERE rec.order_id = o.id
                ORDER BY rec.created_at DESC
                LIMIT 1
              ) as latest_recommendation
       FROM orders o
       JOIN users u ON u.id = o.customer_id
       LEFT JOIN order_priorities op ON op.order_id = o.id
       ORDER BY o.created_at DESC`
    );

    const orders = ordersRes.rows;

    if (orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
      const itemsRes = await query(
        `SELECT oi.*, p.name as product_name, p.sku
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ANY($1)
         ORDER BY oi.id ASC`,
        [orderIds]
      );

      const itemsByOrder = {};
      for (const item of itemsRes.rows) {
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
        itemsByOrder[item.order_id].push(item);
      }

      for (const o of orders) {
        o.items = itemsByOrder[o.id] || [];
      }
    }

    return successResponse(res, { orders });
  })
);

// GET /api/orders/:id - Auth
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const orderRes = await query(
      `SELECT o.*, u.name as customer_name, u.email as customer_email,
              op.approved_priority, op.priority_rank
       FROM orders o
       JOIN users u ON u.id = o.customer_id
       LEFT JOIN order_priorities op ON op.order_id = o.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderRes.rowCount === 0) {
      return errorResponse(res, 'Order not found', 'NOT_FOUND', {}, 404);
    }

    const order = orderRes.rows[0];

    // Customer can only view own orders
    if (req.user.role === 'customer' && order.customer_id !== req.user.userId) {
      return errorResponse(res, 'Access denied.', 'FORBIDDEN', {}, 403);
    }

    const itemsRes = await query(
      `SELECT oi.*, p.name as product_name, p.sku
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1`,
      [id]
    );
    order.items = itemsRes.rows;

    const recsRes = await query(
      `SELECT * FROM ai_recommendations WHERE order_id = $1 ORDER BY created_at DESC`,
      [id]
    );
    order.recommendations = recsRes.rows;

    return successResponse(res, { order });
  })
);

module.exports = router;
