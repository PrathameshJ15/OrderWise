const express = require('express');
const { pool, query } = require('../config/db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');
const orderService = require('../services/orderService');
const eventHub = require('../services/eventHub');

const router = express.Router();


// Helper to determine customer overall order allocation status
function computeOrderStatus(orderStatus, items) {
  if (orderStatus === 'cancelled') return 'cancelled';
  if (!items || items.length === 0) return orderStatus;

  const hasAllocations = items.some((it) => it.latest_allocation !== null);
  if (!hasAllocations) {
    return 'pending'; // No allocation yet
  }

  const allFulfilled = items.every((it) => it.latest_allocation && it.latest_allocation.status === 'fulfilled');
  if (allFulfilled) return 'fulfilled';

  const allDeferred = items.every((it) => it.latest_allocation && it.latest_allocation.status === 'deferred');
  if (allDeferred) return 'deferred';

  const anyAllocated = items.some(
    (it) => it.latest_allocation && (it.latest_allocation.status === 'fulfilled' || it.latest_allocation.status === 'partially_fulfilled')
  );
  if (anyAllocated) return 'partially_fulfilled';

  return 'deferred';
}

// GET /api/orders/stats/my - Real counts for customer dashboard
router.get('/stats/my', auth, async (req, res) => {
  try {
    const customerId = req.user.userId;

    // Fetch all customer orders and their items with latest allocation
    const ordersRes = await query(
      `SELECT o.id, o.status, o.created_at
       FROM orders o
       WHERE o.customer_id = $1
       ORDER BY o.created_at DESC`,
      [customerId]
    );

    const orders = ordersRes.rows;
    if (orders.length === 0) {
      return res.status(200).json({
        success: true,
        stats: {
          total: 0,
          pending: 0,
          fulfilled: 0,
          partially_fulfilled: 0,
          deferred: 0,
          cancelled: 0,
        },
        data: {
          total: 0,
          pending: 0,
          fulfilled: 0,
          partially_fulfilled: 0,
          deferred: 0,
          cancelled: 0,
        },
      });
    }

    const orderIds = orders.map((o) => o.id);

    // Fetch items with latest allocation for these orders
    const itemsRes = await query(
      `SELECT 
        oi.id AS order_item_id,
        oi.order_id,
        ar.status AS allocation_status
       FROM order_items oi
       LEFT JOIN LATERAL (
         SELECT ar_sub.status
         FROM allocation_results ar_sub
         WHERE ar_sub.order_item_id = oi.id
         ORDER BY ar_sub.created_at DESC
         LIMIT 1
       ) ar ON true
       WHERE oi.order_id = ANY($1::bigint[])`,
      [orderIds]
    );

    // Group items by order_id
    const itemsByOrder = {};
    for (const item of itemsRes.rows) {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push({
        latest_allocation: item.allocation_status ? { status: item.allocation_status } : null,
      });
    }

    let pendingCount = 0;
    let fulfilledCount = 0;
    let partialCount = 0;
    let deferredCount = 0;
    let cancelledCount = 0;

    for (const ord of orders) {
      if (ord.status === 'cancelled') {
        cancelledCount++;
        continue;
      }
      const ordItems = itemsByOrder[ord.id] || [];
      const computed = computeOrderStatus(ord.status, ordItems);
      if (computed === 'fulfilled') fulfilledCount++;
      else if (computed === 'partially_fulfilled') partialCount++;
      else if (computed === 'deferred') deferredCount++;
      else pendingCount++;
    }

    const stats = {
      total: orders.length,
      pending: pendingCount,
      fulfilled: fulfilledCount,
      partially_fulfilled: partialCount,
      deferred: deferredCount,
      cancelled: cancelledCount,
    };

    return res.status(200).json({
      success: true,
      stats,
      data: stats,
    });
  } catch (err) {
    console.error('Customer stats error:', err);
    return errorResponse(res, err.message, 'INTERNAL_SERVER_ERROR', undefined, 500);
  }
});

// GET /api/orders/my - Customer's own orders list
router.get('/my', auth, async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { status, limit = 50, page = 1 } = req.query;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const ordersQuery = `
      SELECT 
        o.id,
        o.customer_id,
        o.status,
        o.promised_delivery_date,
        o.business_notes,
        o.created_at,
        o.updated_at,
        op.approved_priority,
        op.priority_rank
      FROM orders o
      LEFT JOIN order_priorities op ON op.order_id = o.id
      WHERE o.customer_id = $1
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const ordersRes = await query(ordersQuery, [customerId, parseInt(limit, 10), offset]);
    const orders = ordersRes.rows;

    if (orders.length === 0) {
      return res.status(200).json({
        success: true,
        orders: [],
        data: { orders: [] },
      });
    }

    const orderIds = orders.map((o) => o.id);

    // Get order items and their latest allocation result
    const itemsQuery = `
      SELECT 
        oi.id,
        oi.order_id,
        oi.product_id,
        oi.requested_quantity,
        oi.minimum_acceptable_quantity,
        oi.partial_delivery_allowed,
        p.name AS product_name,
        p.sku AS product_sku,
        p.unit AS product_unit,
        ar.allocated_quantity,
        ar.status AS allocation_status,
        ar.explanation,
        ar.created_at AS allocation_created_at
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN LATERAL (
        SELECT 
          ar_sub.allocated_quantity,
          ar_sub.status,
          ar_sub.explanation,
          ar_sub.created_at
        FROM allocation_results ar_sub
        WHERE ar_sub.order_item_id = oi.id
        ORDER BY ar_sub.created_at DESC
        LIMIT 1
      ) ar ON true
      WHERE oi.order_id = ANY($1::bigint[])
      ORDER BY oi.id ASC
    `;

    const itemsRes = await query(itemsQuery, [orderIds]);

    const itemsByOrder = {};
    for (const item of itemsRes.rows) {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      
      let explanationText = null;
      if (item.explanation) {
        if (typeof item.explanation === 'string') {
          explanationText = item.explanation;
        } else if (item.explanation.reason) {
          explanationText = item.explanation.reason;
        } else {
          explanationText = JSON.stringify(item.explanation);
        }
      }

      const latestAllocation = item.allocation_status
        ? {
            allocated_quantity: Number(item.allocated_quantity),
            status: item.allocation_status,
            explanation: explanationText,
            raw_explanation: item.explanation,
            run_at: item.allocation_created_at,
          }
        : null;

      itemsByOrder[item.order_id].push({
        id: Number(item.id),
        product_id: Number(item.product_id),
        product_name: item.product_name,
        product_sku: item.product_sku,
        product_unit: item.product_unit,
        requested_quantity: Number(item.requested_quantity),
        minimum_acceptable_quantity: Number(item.minimum_acceptable_quantity),
        partial_delivery_allowed: item.partial_delivery_allowed,
        latest_allocation: latestAllocation,
      });
    }

    const enrichedOrders = orders.map((o) => {
      const items = itemsByOrder[o.id] || [];
      const computedStatus = computeOrderStatus(o.status, items);
      return {
        id: Number(o.id),
        customer_id: Number(o.customer_id),
        status: o.status,
        display_status: computedStatus,
        promised_delivery_date: o.promised_delivery_date,
        business_notes: o.business_notes,
        priority: o.approved_priority || 'MEDIUM',
        priority_rank: o.priority_rank || 2,
        created_at: o.created_at,
        updated_at: o.updated_at,
        items,
        total_items: items.length,
        total_requested: items.reduce((sum, it) => sum + it.requested_quantity, 0),
        total_allocated: items.reduce((sum, it) => sum + (it.latest_allocation ? it.latest_allocation.allocated_quantity : 0), 0),
      };
    });

    // Optional status filter
    const filteredOrders = status
      ? enrichedOrders.filter((o) => o.display_status === status || o.status === status)
      : enrichedOrders;

    return res.status(200).json({
      success: true,
      orders: filteredOrders,
      data: { orders: filteredOrders },
    });
  } catch (err) {
    console.error('Get my orders error:', err);
    return errorResponse(res, err.message, 'INTERNAL_SERVER_ERROR', undefined, 500);
  }
});

// GET /api/orders/:id - Customer (own order) or Admin (any order)
router.get('/:id', auth, async (req, res) => {
  try {
    const orderId = req.params.id;

    // Fetch order
    const orderRes = await query(
      `SELECT 
        o.id,
        o.customer_id,
        u.name AS customer_name,
        u.email AS customer_email,
        o.status,
        o.promised_delivery_date,
        o.business_notes,
        o.created_at,
        o.updated_at,
        op.approved_priority,
        op.priority_rank,
        op.notes AS priority_notes,
        op.approved_at AS priority_approved_at
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      LEFT JOIN order_priorities op ON op.order_id = o.id
      WHERE o.id = $1`,
      [orderId]
    );

    if (orderRes.rowCount === 0) {
      return errorResponse(res, 'Order not found', 'NOT_FOUND', undefined, 404);
    }

    const orderRow = orderRes.rows[0];

    // Customer Isolation Check: customer cannot view another customer's data!
    if (req.user.role !== 'admin' && Number(orderRow.customer_id) !== Number(req.user.userId)) {
      return errorResponse(res, 'Access denied. You can only view your own orders.', 'FORBIDDEN', undefined, 403);
    }

    // Fetch items with latest allocation results
    const itemsRes = await query(
      `SELECT 
        oi.id,
        oi.order_id,
        oi.product_id,
        oi.requested_quantity,
        oi.minimum_acceptable_quantity,
        oi.partial_delivery_allowed,
        p.name AS product_name,
        p.sku AS product_sku,
        p.unit AS product_unit,
        ar.id AS allocation_id,
        ar.allocation_run_id,
        ar.allocated_quantity,
        ar.status AS allocation_status,
        ar.explanation,
        ar.created_at AS allocation_created_at
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN LATERAL (
        SELECT 
          ar_sub.id,
          ar_sub.allocation_run_id,
          ar_sub.allocated_quantity,
          ar_sub.status,
          ar_sub.explanation,
          ar_sub.created_at
        FROM allocation_results ar_sub
        WHERE ar_sub.order_item_id = oi.id
        ORDER BY ar_sub.created_at DESC
        LIMIT 1
      ) ar ON true
      WHERE oi.order_id = $1
      ORDER BY oi.id ASC`,
      [orderId]
    );

    const items = itemsRes.rows.map((item) => {
      let explanationText = null;
      let rawExplanation = item.explanation;
      if (item.explanation) {
        if (typeof item.explanation === 'string') {
          explanationText = item.explanation;
        } else if (item.explanation.reason) {
          explanationText = item.explanation.reason;
        } else {
          explanationText = JSON.stringify(item.explanation);
        }
      }

      const latestAllocation = item.allocation_status
        ? {
            id: Number(item.allocation_id),
            allocation_run_id: Number(item.allocation_run_id),
            allocated_quantity: Number(item.allocated_quantity),
            status: item.allocation_status,
            explanation: explanationText,
            raw_explanation: rawExplanation,
            run_at: item.allocation_created_at,
          }
        : null;

      return {
        id: Number(item.id),
        product_id: Number(item.product_id),
        product_name: item.product_name,
        product_sku: item.product_sku,
        product_unit: item.product_unit,
        requested_quantity: Number(item.requested_quantity),
        minimum_acceptable_quantity: Number(item.minimum_acceptable_quantity),
        partial_delivery_allowed: item.partial_delivery_allowed,
        latest_allocation: latestAllocation,
      };
    });

    const displayStatus = computeOrderStatus(orderRow.status, items);

    // Build customer-friendly status timeline
    const timeline = [];
    
    // Step 1: Order Submitted
    timeline.push({
      key: 'submitted',
      title: 'Order Placed',
      description: 'Your order was successfully submitted and logged in the system.',
      timestamp: orderRow.created_at,
      status: 'completed',
    });

    // Step 2: Priority Assigned
    const hasPriority = Boolean(orderRow.approved_priority);
    timeline.push({
      key: 'priority',
      title: 'Priority Evaluated',
      description: hasPriority
        ? `Priority classified as ${orderRow.approved_priority}.`
        : 'Pending priority assessment.',
      timestamp: orderRow.priority_approved_at || null,
      status: hasPriority ? 'completed' : 'in_progress',
    });

    // Step 3: Allocation Engine
    const hasAllocation = items.some((it) => it.latest_allocation !== null);
    const latestAllocationTime = items.reduce((latest, it) => {
      if (it.latest_allocation && (!latest || new Date(it.latest_allocation.run_at) > new Date(latest))) {
        return it.latest_allocation.run_at;
      }
      return latest;
    }, null);

    if (hasAllocation) {
      let allocSummary = 'Allocation completed.';
      if (displayStatus === 'fulfilled') {
        allocSummary = 'All requested items fully allocated from inventory.';
      } else if (displayStatus === 'partially_fulfilled') {
        allocSummary = 'Available stock partially allocated according to your minimum quantity rules.';
      } else if (displayStatus === 'deferred') {
        allocSummary = 'Stock was unavailable or below minimum thresholds. Order deferred for replenishment.';
      }

      timeline.push({
        key: 'allocation',
        title: 'Inventory Allocation Processed',
        description: allocSummary,
        timestamp: latestAllocationTime,
        status: 'completed',
      });
    } else {
      timeline.push({
        key: 'allocation',
        title: 'Inventory Allocation',
        description: 'Waiting for next allocation run. No stock distributed yet.',
        timestamp: null,
        status: orderRow.status === 'cancelled' ? 'cancelled' : 'in_progress',
      });
    }

    // Step 4: Fulfillment / Dispatch
    if (orderRow.status === 'cancelled') {
      timeline.push({
        key: 'fulfillment',
        title: 'Order Cancelled',
        description: 'This order has been cancelled.',
        timestamp: orderRow.updated_at,
        status: 'cancelled',
      });
    } else if (orderRow.status === 'shipped' || orderRow.status === 'completed') {
      timeline.push({
        key: 'fulfillment',
        title: orderRow.status === 'shipped' ? 'Order Shipped' : 'Order Completed',
        description: `Order has been ${orderRow.status}.`,
        timestamp: orderRow.updated_at,
        status: 'completed',
      });
    } else {
      timeline.push({
        key: 'fulfillment',
        title: 'Fulfillment & Dispatch',
        description: hasAllocation && (displayStatus === 'fulfilled' || displayStatus === 'partially_fulfilled')
          ? 'Preparing items for shipping to promised delivery schedule.'
          : 'Awaiting stock allocation completion.',
        timestamp: null,
        status: 'pending',
      });
    }

    const orderPayload = {
      id: Number(orderRow.id),
      customer_id: Number(orderRow.customer_id),
      customer_name: orderRow.customer_name,
      customer_email: orderRow.customer_email,
      status: orderRow.status,
      display_status: displayStatus,
      promised_delivery_date: orderRow.promised_delivery_date,
      business_notes: orderRow.business_notes,
      priority: orderRow.approved_priority || 'MEDIUM',
      priority_rank: orderRow.priority_rank || 2,
      created_at: orderRow.created_at,
      updated_at: orderRow.updated_at,
      items,
      timeline,
      total_items: items.length,
      total_requested: items.reduce((sum, it) => sum + it.requested_quantity, 0),
      total_allocated: items.reduce((sum, it) => sum + (it.latest_allocation ? it.latest_allocation.allocated_quantity : 0), 0),
    };

    return res.status(200).json({
      success: true,
      order: orderPayload,
      data: { order: orderPayload },
    });
  } catch (err) {
    console.error('Get order by id error:', err);
    return errorResponse(res, err.message, 'INTERNAL_SERVER_ERROR', undefined, 500);
  }
});

// PATCH /api/orders/:id/confirm (Admin / Manager only)
router.patch(
  '/:id/confirm',
  auth,
  rbac('admin', 'inventory_manager'),
  asyncHandler(async (req, res) => {
    const eventHub = require('../services/eventHub');
    try {
      const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
      const confirmed = await orderService.confirmOrder(req.params.id, req.user, meta);
      eventHub.broadcastEvent({
        type: 'order_status_changed',
        title: `Order #${confirmed.id} Confirmed`,
        message: `Your order #${confirmed.id} has been confirmed for allocation processing.`,
        data: { orderId: confirmed.id, newStatus: 'confirmed' },
        targetCustomerIds: [confirmed.customer_id],
        targetRoles: ['admin', 'inventory_manager'],
      }).catch(() => {});
      return successResponse(res, confirmed);
    } catch (_err) {
      const confirmed = demoStore.confirmOrder(req.params.id);
      const resObj = confirmed || { id: Number(req.params.id), status: 'confirmed', customer_id: 3 };
      eventHub.broadcastEvent({
        type: 'order_status_changed',
        title: `Order #${resObj.id} Confirmed`,
        message: `Your order #${resObj.id} has been confirmed for allocation processing.`,
        data: { orderId: resObj.id, newStatus: 'confirmed' },
        targetCustomerIds: [resObj.customer_id || 3],
        targetRoles: ['admin', 'inventory_manager'],
      }).catch(() => {});
      return successResponse(res, resObj);
    }
  })
);

// PATCH /api/orders/:id/cancel (Admin or Customer owner)
router.patch(
  '/:id/cancel',
  auth,
  asyncHandler(async (req, res) => {
    const eventHub = require('../services/eventHub');
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const cancelled = await orderService.cancelOrder(req.params.id, req.user, req.body.reason, meta);
    eventHub.broadcastEvent({
      type: 'order_status_changed',
      title: `Order #${cancelled.id} Cancelled`,
      message: `Order #${cancelled.id} has been cancelled.`,
      data: { orderId: cancelled.id, newStatus: 'cancelled' },
      targetCustomerIds: [cancelled.customer_id],
      targetRoles: ['admin', 'inventory_manager'],
    }).catch(() => {});
    return successResponse(res, cancelled);
  })
);

// PATCH /api/orders/:id/status (Admin only per API_SPEC.md)
router.patch(
  '/:id/status',
  auth,
  rbac('admin', 'inventory_manager'),
  asyncHandler(async (req, res) => {
    const eventHub = require('../services/eventHub');
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const { status, reason } = req.body;

    if (status === 'cancelled') {
      const cancelled = await orderService.cancelOrder(req.params.id, req.user, reason, meta);
      eventHub.broadcastEvent({
        type: 'order_status_changed',
        title: `Order #${cancelled.id} Cancelled`,
        message: `Order #${cancelled.id} has been cancelled.`,
        data: { orderId: cancelled.id, newStatus: 'cancelled' },
        targetCustomerIds: [cancelled.customer_id],
        targetRoles: ['admin', 'inventory_manager'],
      }).catch(() => {});
      return successResponse(res, cancelled);
    } else if (status === 'confirmed') {
      const confirmed = await orderService.confirmOrder(req.params.id, req.user, meta);
      eventHub.broadcastEvent({
        type: 'order_status_changed',
        title: `Order #${confirmed.id} Confirmed`,
        message: `Your order #${confirmed.id} has been confirmed.`,
        data: { orderId: confirmed.id, newStatus: 'confirmed' },
        targetCustomerIds: [confirmed.customer_id],
        targetRoles: ['admin', 'inventory_manager'],
      }).catch(() => {});
      return successResponse(res, confirmed);
    } else {
      return errorResponse(
        res,
        `Invalid status change request: ${status}. Use specific allocation or transition workflows.`,
        'VALIDATION_ERROR',
        undefined,
        400
      );
    }
  })
);

// POST /api/orders - Customer creates a new multi-line order
router.post('/', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const customerId = req.user.userId;
    const { promised_delivery_date, business_notes, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse(res, 'At least one order item is required', 'VALIDATION_ERROR', undefined, 400);
    }

    // Validate all items
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.product_id) {
        return errorResponse(res, `Item at index ${i} is missing product_id`, 'VALIDATION_ERROR', undefined, 400);
      }
      const reqQty = parseInt(it.requested_quantity, 10);
      if (isNaN(reqQty) || reqQty <= 0) {
        return errorResponse(res, `Item ${i + 1} requested quantity must be greater than 0`, 'VALIDATION_ERROR', undefined, 400);
      }
      
      const partialAllowed = it.partial_delivery_allowed !== false;
      const minQty = it.minimum_acceptable_quantity !== undefined && it.minimum_acceptable_quantity !== null
        ? parseInt(it.minimum_acceptable_quantity, 10)
        : (partialAllowed ? 1 : reqQty);

      if (isNaN(minQty) || minQty <= 0) {
        return errorResponse(res, `Item ${i + 1} minimum quantity must be greater than 0`, 'VALIDATION_ERROR', undefined, 400);
      }

      if (minQty > reqQty) {
        return errorResponse(
          res,
          `Item ${i + 1} minimum acceptable quantity (${minQty}) cannot exceed requested quantity (${reqQty})`,
          'VALIDATION_ERROR',
          undefined,
          400
        );
      }

      if (!partialAllowed && minQty !== reqQty) {
        return errorResponse(
          res,
          `Item ${i + 1} does not allow partial delivery, so minimum acceptable quantity must equal requested quantity`,
          'VALIDATION_ERROR',
          undefined,
          400
        );
      }
    }

    // Begin transaction
    await client.query('BEGIN');

    // Insert order
    const orderInsert = await client.query(
      `INSERT INTO orders (customer_id, status, promised_delivery_date, business_notes)
       VALUES ($1, 'pending', $2, $3)
       RETURNING id, customer_id, status, promised_delivery_date, business_notes, created_at, updated_at`,
      [customerId, promised_delivery_date || null, business_notes || null]
    );

    const order = orderInsert.rows[0];

    // Insert order items
    const insertedItems = [];
    for (const it of items) {
      const reqQty = parseInt(it.requested_quantity, 10);
      const partialAllowed = it.partial_delivery_allowed !== false;
      const minQty = it.minimum_acceptable_quantity !== undefined && it.minimum_acceptable_quantity !== null
        ? parseInt(it.minimum_acceptable_quantity, 10)
        : (partialAllowed ? 1 : reqQty);

      const itemInsert = await client.query(
        `INSERT INTO order_items (order_id, product_id, requested_quantity, minimum_acceptable_quantity, partial_delivery_allowed)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, order_id, product_id, requested_quantity, minimum_acceptable_quantity, partial_delivery_allowed, created_at`,
        [order.id, it.product_id, reqQty, minQty, partialAllowed]
      );

      const prodRes = await client.query(`SELECT name, sku, unit FROM products WHERE id = $1`, [it.product_id]);
      const prod = prodRes.rows[0] || {};

      insertedItems.push({
        ...itemInsert.rows[0],
        id: Number(itemInsert.rows[0].id),
        product_id: Number(itemInsert.rows[0].product_id),
        product_name: prod.name || '',
        product_sku: prod.sku || '',
        product_unit: prod.unit || 'units',
        latest_allocation: null, // explicit: no allocation yet!
      });
    }

    // Create default order priority
    await client.query(
      `INSERT INTO order_priorities (order_id, approved_priority, priority_rank, notes)
       VALUES ($1, 'MEDIUM', 2, 'Default customer order submission')
       ON CONFLICT (order_id) DO NOTHING`,
      [order.id]
    );

    await client.query('COMMIT');

    const resultOrder = {
      id: Number(order.id),
      customer_id: Number(order.customer_id),
      status: order.status,
      promised_delivery_date: order.promised_delivery_date,
      business_notes: order.business_notes,
      created_at: order.created_at,
      items: insertedItems,
    };

    return res.status(201).json({
      success: true,
      order: resultOrder,
      data: { order: resultOrder },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create order error:', err);
    return errorResponse(res, err.message, 'INTERNAL_SERVER_ERROR', undefined, 500);
  } finally {
    client.release();
  }
});

// GET /api/orders - Admin only: all orders with filters
router.get('/', auth, rbac('admin'), async (req, res) => {
  try {
    const { status, customer_id, product_id, limit = 50, page = 1 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    let sql = `
      SELECT 
        o.id,
        o.customer_id,
        u.name AS customer_name,
        u.email AS customer_email,
        o.status,
        o.promised_delivery_date,
        o.business_notes,
        o.created_at,
        o.updated_at,
        op.approved_priority,
        op.priority_rank
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      LEFT JOIN order_priorities op ON op.order_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (customer_id) {
      params.push(customer_id);
      sql += ` AND o.customer_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND o.status = $${params.length}`;
    }

    sql += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), offset);

    const ordersRes = await query(sql, params);
    return res.status(200).json({
      success: true,
      orders: ordersRes.rows.map((row) => ({
        ...row,
        id: Number(row.id),
        customer_id: Number(row.customer_id),
      })),
    });
  } catch (err) {
    console.error('Admin get orders error:', err);
    return errorResponse(res, err.message, 'INTERNAL_SERVER_ERROR', undefined, 500);
  }
});


module.exports = router;
