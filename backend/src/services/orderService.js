const { query, getClient } = require('../config/db');
const { AppError } = require('../utils/response');
const { logAuditEvent } = require('../utils/audit');
const { validateTransition, ORDER_STATUS } = require('./orderStateMachine');

async function getOrderById(orderId, reqUser) {
  const orderRes = await query(
    `SELECT 
       o.id,
       o.customer_id,
       u.name as customer_name,
       u.email as customer_email,
       o.status,
       o.promised_delivery_date,
       o.business_notes,
       o.idempotency_key,
       o.created_at,
       o.updated_at,
       op.approved_priority,
       op.priority_rank,
       op.notes as priority_notes
     FROM orders o
     JOIN users u ON u.id = o.customer_id
     LEFT JOIN order_priorities op ON op.order_id = o.id
     WHERE o.id = $1
     LIMIT 1;`,
    [orderId]
  );

  if (orderRes.rowCount === 0) {
    throw new AppError(`Order with ID ${orderId} not found`, 'NOT_FOUND', 404);
  }

  const order = orderRes.rows[0];

  // Enforce customer ownership isolation
  if (reqUser && reqUser.role === 'customer' && String(order.customer_id) !== String(reqUser.userId)) {
    throw new AppError('Access denied: customers can only view their own orders', 'FORBIDDEN', 403);
  }

  // Fetch items with product metadata
  const itemsRes = await query(
    `SELECT 
       oi.id,
       oi.product_id,
       p.sku,
       p.name as product_name,
       p.unit,
       oi.requested_quantity,
       oi.minimum_acceptable_quantity,
       oi.partial_delivery_allowed,
       oi.created_at
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1
     ORDER BY oi.id ASC;`,
    [orderId]
  );

  order.items = itemsRes.rows;
  return order;
}

async function createOrder(
  { items, promisedDeliveryDate = null, businessNotes = '' },
  customerId,
  idempotencyKey = null,
  reqMeta = {}
) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('Order must contain at least one item', 'VALIDATION_ERROR', 400);
  }

  // 1. Idempotency Key check: if provided, check if already created
  if (idempotencyKey && idempotencyKey.trim() !== '') {
    const existingRes = await query(
      `SELECT id FROM orders WHERE customer_id = $1 AND idempotency_key = $2 LIMIT 1;`,
      [customerId, idempotencyKey.trim()]
    );
    if (existingRes.rowCount > 0) {
      const existingOrder = await getOrderById(existingRes.rows[0].id, {
        role: 'customer',
        userId: customerId,
      });
      existingOrder._idempotentReplay = true;
      return existingOrder;
    }
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 2. Validate all products exist and are active, and quantities are valid
    for (const item of items) {
      const prodRes = await client.query(
        'SELECT id, sku, name, active FROM products WHERE id = $1 LIMIT 1;',
        [item.productId]
      );
      if (prodRes.rowCount === 0) {
        throw new AppError(`Product with ID ${item.productId} not found`, 'NOT_FOUND', 404);
      }
      if (!prodRes.rows[0].active) {
        throw new AppError(
          `Product "${prodRes.rows[0].name}" (${prodRes.rows[0].sku}) is inactive and cannot be ordered`,
          'PRODUCT_INACTIVE',
          400
        );
      }

      const reqQty = Number(item.requestedQuantity);
      const minQty = Number(item.minimumAcceptableQuantity || reqQty);

      if (isNaN(reqQty) || reqQty <= 0) {
        throw new AppError(
          `Requested quantity for product ${prodRes.rows[0].sku} must be greater than 0`,
          'INVALID_QUANTITY',
          400
        );
      }

      if (isNaN(minQty) || minQty <= 0) {
        throw new AppError(
          `Minimum acceptable quantity for product ${prodRes.rows[0].sku} must be greater than 0`,
          'INVALID_QUANTITY',
          400
        );
      }

      if (minQty > reqQty) {
        throw new AppError(
          `Minimum acceptable quantity (${minQty}) cannot exceed requested quantity (${reqQty}) for product ${prodRes.rows[0].sku}`,
          'INVALID_QUANTITY',
          400
        );
      }
    }

    // 3. Insert order record (status = 'pending')
    // NOTE: Order creation NEVER touches inventory or allocates stock.
    const orderInsert = await client.query(
      `INSERT INTO orders (customer_id, status, promised_delivery_date, business_notes, idempotency_key)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id;`,
      [
        customerId,
        ORDER_STATUS.PENDING,
        promisedDeliveryDate,
        businessNotes,
        idempotencyKey ? idempotencyKey.trim() : null,
      ]
    );
    const orderId = orderInsert.rows[0].id;

    // 4. Insert order items
    for (const item of items) {
      const reqQty = Number(item.requestedQuantity);
      const minQty = Number(item.minimumAcceptableQuantity || reqQty);
      const partialAllowed =
        item.partialDeliveryAllowed !== undefined ? Boolean(item.partialDeliveryAllowed) : true;

      await client.query(
        `INSERT INTO order_items (order_id, product_id, requested_quantity, minimum_acceptable_quantity, partial_delivery_allowed)
         VALUES ($1, $2, $3, $4, $5);`,
        [orderId, item.productId, reqQty, minQty, partialAllowed]
      );
    }

    // 5. Assign default priority (Customers cannot set priority!)
    await client.query(
      `INSERT INTO order_priorities (order_id, approved_priority, priority_rank, notes)
       VALUES ($1, 'MEDIUM', 2, 'Default system priority assigned on submission');`,
      [orderId]
    );

    await client.query('COMMIT');

    await logAuditEvent({
      actorId: customerId,
      action: 'CREATE_ORDER',
      entityType: 'orders',
      entityId: orderId,
      afterState: { orderId, itemCount: items.length },
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent,
    });

    return await getOrderById(orderId, { role: 'customer', userId: customerId });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listOrders({ page = 1, limit = 20, status = null, customerId = null }, reqUser) {
  const offset = (page - 1) * limit;
  const whereClauses = [];
  const params = [];

  // Customer role can ONLY view their own orders
  if (reqUser.role === 'customer') {
    params.push(reqUser.userId);
    whereClauses.push(`o.customer_id = $${params.length}`);
  } else if (customerId) {
    params.push(customerId);
    whereClauses.push(`o.customer_id = $${params.length}`);
  }

  if (status) {
    params.push(status);
    whereClauses.push(`o.status = $${params.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countRes = await query(`SELECT count(*)::int as total FROM orders o ${whereSql};`, params);
  const total = countRes.rows[0].total;

  params.push(limit);
  const limitIndex = params.length;
  params.push(offset);
  const offsetIndex = params.length;

  const sql = `
    SELECT 
      o.id,
      o.customer_id,
      u.name as customer_name,
      u.email as customer_email,
      o.status,
      o.promised_delivery_date,
      o.business_notes,
      o.created_at,
      o.updated_at,
      op.approved_priority,
      op.priority_rank,
      COUNT(oi.id)::int as item_count,
      COALESCE(SUM(oi.requested_quantity), 0)::int as total_requested_quantity
    FROM orders o
    JOIN users u ON u.id = o.customer_id
    LEFT JOIN order_priorities op ON op.order_id = o.id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    ${whereSql}
    GROUP BY o.id, u.name, u.email, op.approved_priority, op.priority_rank
    ORDER BY o.created_at DESC
    LIMIT $${limitIndex} OFFSET $${offsetIndex};
  `;

  const rowsRes = await query(sql, params);

  return {
    orders: rowsRes.rows,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function confirmOrder(orderId, reqUser, reqMeta = {}) {
  const current = await getOrderById(orderId, reqUser);

  // Validate state machine transition
  validateTransition(current.status, ORDER_STATUS.CONFIRMED);

  await query(
    `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`,
    [ORDER_STATUS.CONFIRMED, orderId]
  );

  await logAuditEvent({
    actorId: reqUser.userId,
    action: 'CONFIRM_ORDER',
    entityType: 'orders',
    entityId: orderId,
    beforeState: { status: current.status },
    afterState: { status: ORDER_STATUS.CONFIRMED },
    ipAddress: reqMeta.ip,
    userAgent: reqMeta.userAgent,
  });

  return await getOrderById(orderId, reqUser);
}

async function cancelOrder(orderId, reqUser, reason = '', reqMeta = {}) {
  const current = await getOrderById(orderId, reqUser);

  // If customer is cancelling, ensure it's their own order
  if (reqUser.role === 'customer' && String(current.customer_id) !== String(reqUser.userId)) {
    throw new AppError('Access denied: customers can only cancel their own orders', 'FORBIDDEN', 403);
  }

  // Validate state machine transition
  validateTransition(current.status, ORDER_STATUS.CANCELLED);

  await query(
    `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`,
    [ORDER_STATUS.CANCELLED, orderId]
  );

  await logAuditEvent({
    actorId: reqUser.userId,
    action: 'CANCEL_ORDER',
    entityType: 'orders',
    entityId: orderId,
    beforeState: { status: current.status },
    afterState: { status: ORDER_STATUS.CANCELLED, reason },
    ipAddress: reqMeta.ip,
    userAgent: reqMeta.userAgent,
  });

  return await getOrderById(orderId, reqUser);
}

module.exports = {
  createOrder,
  getOrderById,
  listOrders,
  confirmOrder,
  cancelOrder,
};
