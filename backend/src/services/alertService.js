const { query, pool } = require('../config/db');

/**
 * Supported Alert Types
 */
const ALERT_TYPES = {
  LOW_STOCK: 'low_stock',
  POTENTIAL_STOCKOUT: 'potential_stockout',
  BELOW_REORDER_POINT: 'below_reorder_point',
  ORDER_AT_RISK: 'order_at_risk',
  SUPPLIER_DELAY: 'supplier_delay',
  ALLOCATION_CHANGE_COMPETING: 'allocation_change_competing',
};

/**
 * Scan system state and generate proactive supply alerts.
 * Avoids duplicates for the same condition: If an active/unresolved alert with the same condition_key exists, skips insertion.
 */
async function scanAndGenerateAlerts(client = null) {
  const db = client || { query };
  const generatedAlerts = [];

  // 1. Fetch products, inventory, confirmed incoming stock
  const inventoryRes = await db.query(
    `SELECT p.id as product_id, p.name as product_name, p.sku,
            i.on_hand_quantity, i.reserved_quantity, i.safety_stock, i.reorder_point,
            COALESCE(incoming.confirmed_incoming, 0)::int as confirmed_incoming
     FROM products p
     JOIN inventory i ON i.product_id = p.id
     LEFT JOIN (
       SELECT poi.product_id, SUM(poi.quantity_ordered - poi.quantity_received)::int as confirmed_incoming
       FROM purchase_order_items poi
       JOIN purchase_orders po ON po.id = poi.purchase_order_id
       WHERE po.status IN ('ordered', 'in_transit')
       GROUP BY poi.product_id
     ) incoming ON incoming.product_id = p.id
     WHERE p.active = true`
  );

  for (const item of inventoryRes.rows) {
    const prodId = parseInt(item.product_id, 10);
    const onHand = parseInt(item.on_hand_quantity, 10);
    const reserved = parseInt(item.reserved_quantity, 10);
    const safetyStock = parseInt(item.safety_stock, 10);
    const reorderPoint = parseInt(item.reorder_point, 10);
    const incoming = parseInt(item.confirmed_incoming, 10);
    const available = onHand - reserved;
    const inventoryPosition = onHand + incoming - reserved;

    // A. Potential Stockout Alert
    if (inventoryPosition <= 0 || (available <= 0 && onHand <= safetyStock)) {
      generatedAlerts.push({
        alert_type: ALERT_TYPES.POTENTIAL_STOCKOUT,
        severity: 'critical',
        title: `Potential Stockout Risk: ${item.product_name} (${item.sku})`,
        description: `Inventory position is critical (${inventoryPosition} units). Available stock is ${available} units with ${reserved} units reserved.`,
        product_id: prodId,
        order_id: null,
        purchase_order_id: null,
        recommended_action: 'Initiate emergency replenishment order immediately and review high-priority order reservations.',
        condition_key: `potential_stockout:product:${prodId}`,
        metadata: { onHand, reserved, available, incoming, inventoryPosition, safetyStock },
      });
    }

    // B. Low Stock Alert
    if (available <= safetyStock && available > 0) {
      generatedAlerts.push({
        alert_type: ALERT_TYPES.LOW_STOCK,
        severity: available <= Math.floor(safetyStock / 2) ? 'critical' : 'warning',
        title: `Low Stock Warning: ${item.product_name} (${item.sku})`,
        description: `Available stock (${available} units) has dropped below safety stock threshold (${safetyStock} units).`,
        product_id: prodId,
        order_id: null,
        purchase_order_id: null,
        recommended_action: 'Place replenishment order with primary supplier to restore minimum safety stock buffer.',
        condition_key: `low_stock:product:${prodId}`,
        metadata: { onHand, reserved, available, incoming, safetyStock },
      });
    }

    // C. Below Reorder Point Alert
    if (inventoryPosition <= reorderPoint && inventoryPosition > 0) {
      generatedAlerts.push({
        alert_type: ALERT_TYPES.BELOW_REORDER_POINT,
        severity: 'warning',
        title: `Below Reorder Point: ${item.product_name} (${item.sku})`,
        description: `Inventory position (${inventoryPosition} units) is below reorder point (${reorderPoint} units).`,
        product_id: prodId,
        order_id: null,
        purchase_order_id: null,
        recommended_action: `Review Supply Intelligence recommendations and generate draft purchase order for estimated deficit.`,
        condition_key: `below_reorder_point:product:${prodId}`,
        metadata: { onHand, reserved, incoming, inventoryPosition, reorderPoint },
      });
    }
  }

  // 2. Orders At Risk (Deferred high/critical priority orders or delivery date within 3 days without full allocation)
  const ordersAtRiskRes = await db.query(
    `SELECT oi.id as order_item_id, oi.order_id, oi.product_id, oi.requested_quantity,
            o.promised_delivery_date, o.status as order_status,
            op.approved_priority, op.priority_rank,
            p.name as product_name, p.sku,
            COALESCE(ar.allocated_quantity, 0) as allocated_quantity,
            COALESCE(ar.status, 'pending') as allocation_status
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     LEFT JOIN order_priorities op ON op.order_id = o.id
     LEFT JOIN (
       SELECT DISTINCT ON (order_item_id) order_item_id, allocated_quantity, status
       FROM allocation_results
       ORDER BY order_item_id, id DESC
     ) ar ON ar.order_item_id = oi.id
     WHERE o.status IN ('pending', 'confirmed')
       AND (
         (op.priority_rank >= 3 AND ar.status = 'deferred')
         OR (o.promised_delivery_date <= CURRENT_DATE + interval '3 days' AND COALESCE(ar.allocated_quantity, 0) < oi.requested_quantity)
       )`
  );

  for (const item of ordersAtRiskRes.rows) {
    const isCriticalPriority = item.approved_priority === 'CRITICAL';
    const isDeliveryImminent = item.promised_delivery_date && new Date(item.promised_delivery_date) <= new Date(Date.now() + 3 * 86400000);

    generatedAlerts.push({
      alert_type: ALERT_TYPES.ORDER_AT_RISK,
      severity: isCriticalPriority ? 'critical' : 'warning',
      title: `Order At Risk: Order #${item.order_id} (${item.approved_priority || 'Standard'})`,
      description: `Order item #${item.order_item_id} for ${item.product_name} (${item.requested_quantity} units) is ${item.allocation_status}. Promised delivery: ${item.promised_delivery_date ? new Date(item.promised_delivery_date).toLocaleDateString() : 'Unspecified'}.`,
      product_id: parseInt(item.product_id, 10),
      order_id: parseInt(item.order_id, 10),
      purchase_order_id: null,
      recommended_action: isDeliveryImminent
        ? 'Expedite incoming shipments or perform manual priority override to reallocate units.'
        : 'Review competing priority queue and schedule replenishment.',
      condition_key: `order_at_risk:order:${item.order_id}:item:${item.order_item_id}`,
      metadata: {
        order_item_id: item.order_item_id,
        priority: item.approved_priority,
        allocation_status: item.allocation_status,
        promised_date: item.promised_delivery_date,
      },
    });
  }

  // 3. Supplier Delays (Purchase orders overdue: status in ('ordered', 'in_transit') and expected_delivery_date < CURRENT_DATE)
  const delayedPoRes = await db.query(
    `SELECT po.id as po_id, po.po_number, po.expected_delivery_date, po.status,
            s.id as supplier_id, s.name as supplier_name, s.contact_email
     FROM purchase_orders po
     JOIN suppliers s ON s.id = po.supplier_id
     WHERE po.status IN ('ordered', 'in_transit')
       AND po.expected_delivery_date < CURRENT_DATE`
  );

  for (const po of delayedPoRes.rows) {
    generatedAlerts.push({
      alert_type: ALERT_TYPES.SUPPLIER_DELAY,
      severity: 'warning',
      title: `Supplier Delivery Delayed: ${po.po_number}`,
      description: `Purchase order ${po.po_number} from ${po.supplier_name} was expected on ${new Date(po.expected_delivery_date).toLocaleDateString()} but has not arrived.`,
      product_id: null,
      order_id: null,
      purchase_order_id: parseInt(po.po_id, 10),
      recommended_action: `Contact ${po.supplier_name} (${po.contact_email || 'supplier'}) to confirm updated shipment tracking and revised ETA.`,
      condition_key: `supplier_delay:po:${po.po_id}`,
      metadata: { po_number: po.po_number, supplier_name: po.supplier_name, expected_date: po.expected_delivery_date },
    });
  }

  // 4. Insert alerts avoiding duplicates
  const newlyCreated = [];

  for (const alert of generatedAlerts) {
    // Check if active alert already exists with same condition_key
    const existing = await db.query(
      `SELECT id FROM alerts WHERE condition_key = $1 AND status != 'resolved' LIMIT 1`,
      [alert.condition_key]
    );

    if (existing.rowCount === 0) {
      try {
        const insertRes = await db.query(
          `INSERT INTO alerts (
            alert_type, severity, title, description, product_id, order_id, purchase_order_id,
            recommended_action, condition_key, status, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10)
          ON CONFLICT (condition_key) WHERE status != 'resolved' DO NOTHING
          RETURNING *`,
          [
            alert.alert_type,
            alert.severity,
            alert.title,
            alert.description,
            alert.product_id,
            alert.order_id,
            alert.purchase_order_id,
            alert.recommended_action,
            alert.condition_key,
            JSON.stringify(alert.metadata || {}),
          ]
        );

        if (insertRes.rowCount > 0) {
          newlyCreated.push(insertRes.rows[0]);
        }
      } catch (err) {
        // Handle race conditions cleanly
        if (!err.message.includes('unique constraint') && !err.message.includes('duplicate key')) {
          throw err;
        }
      }
    }
  }

  return {
    scanned_count: generatedAlerts.length,
    newly_created_count: newlyCreated.length,
    new_alerts: newlyCreated,
  };
}

/**
 * Record an allocation change alert affecting competing orders
 */
async function createAllocationChangeAlert({ orderId, orderItemId, productId, productName, previousStatus, currentStatus, reason }, client = null) {
  const db = client || { query };
  const conditionKey = `allocation_change_competing:order:${orderId}:item:${orderItemId}`;

  const res = await db.query(
    `INSERT INTO alerts (
      alert_type, severity, title, description, product_id, order_id,
      recommended_action, condition_key, status, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9)
    ON CONFLICT (condition_key) WHERE status != 'resolved' DO NOTHING
    RETURNING *`,
    [
      ALERT_TYPES.ALLOCATION_CHANGE_COMPETING,
      'warning',
      `Allocation Shift: Order #${orderId} Deferred`,
      `Allocation for ${productName} shifted from ${previousStatus} to ${currentStatus}. ${reason || ''}`,
      productId,
      orderId,
      'Notify customer of delivery shift and check availability in subsequent replenishment cycle.',
      conditionKey,
      JSON.stringify({ orderItemId, previousStatus, currentStatus, reason }),
    ]
  );

  return res.rows[0] || null;
}

/**
 * Get alerts with filtering and pagination
 */
async function getAlerts({ status, severity, alert_type, product_id, page = 1, limit = 50 }, client = null) {
  const db = client || { query };
  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

  const conditions = [];
  const params = [];

  if (status && status !== 'ALL') {
    params.push(status);
    conditions.push(`a.status = $${params.length}`);
  }

  if (severity && severity !== 'ALL') {
    params.push(severity);
    conditions.push(`a.severity = $${params.length}`);
  }

  if (alert_type && alert_type !== 'ALL') {
    params.push(alert_type);
    conditions.push(`a.alert_type = $${params.length}`);
  }

  if (product_id) {
    params.push(parseInt(product_id, 10));
    conditions.push(`a.product_id = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await db.query(
    `SELECT COUNT(*)::int as total,
            COUNT(*) FILTER (WHERE a.status = 'active')::int as active_count,
            COUNT(*) FILTER (WHERE a.status = 'acknowledged')::int as acknowledged_count,
            COUNT(*) FILTER (WHERE a.status = 'resolved')::int as resolved_count,
            COUNT(*) FILTER (WHERE a.severity = 'critical' AND a.status != 'resolved')::int as critical_unresolved
     FROM alerts a ${whereClause}`,
    params
  );

  params.push(parseInt(limit, 10));
  params.push(offset);

  const querySql = `
    SELECT a.*,
           p.name as product_name, p.sku,
           o.customer_id, u.name as customer_name,
           po.po_number, s.name as supplier_name,
           ack_user.name as acknowledged_by_name,
           res_user.name as resolved_by_name
    FROM alerts a
    LEFT JOIN products p ON p.id = a.product_id
    LEFT JOIN orders o ON o.id = a.order_id
    LEFT JOIN users u ON u.id = o.customer_id
    LEFT JOIN purchase_orders po ON po.id = a.purchase_order_id
    LEFT JOIN suppliers s ON s.id = po.supplier_id
    LEFT JOIN users ack_user ON ack_user.id = a.acknowledged_by
    LEFT JOIN users res_user ON res_user.id = a.resolved_by
    ${whereClause}
    ORDER BY
      CASE a.severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END ASC,
      CASE a.status WHEN 'active' THEN 1 WHEN 'acknowledged' THEN 2 ELSE 3 END ASC,
      a.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const alertsRes = await db.query(querySql, params);

  return {
    alerts: alertsRes.rows,
    summary: countRes.rows[0],
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: countRes.rows[0].total,
    },
  };
}

/**
 * Acknowledge an alert
 */
async function acknowledgeAlert(alertId, userId, client = null) {
  const db = client || { query };

  const res = await db.query(
    `UPDATE alerts
     SET status = 'acknowledged', acknowledged_at = NOW(), acknowledged_by = $1, updated_at = NOW()
     WHERE id = $2 AND status = 'active'
     RETURNING *`,
    [userId, alertId]
  );

  if (res.rowCount === 0) {
    const existing = await db.query('SELECT * FROM alerts WHERE id = $1', [alertId]);
    if (existing.rowCount === 0) throw new Error(`Alert #${alertId} not found.`);
    return existing.rows[0];
  }

  return res.rows[0];
}

/**
 * Resolve an alert
 */
async function resolveAlert(alertId, userId, client = null) {
  const db = client || { query };

  const res = await db.query(
    `UPDATE alerts
     SET status = 'resolved', resolved_at = NOW(), resolved_by = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [userId, alertId]
  );

  if (res.rowCount === 0) {
    throw new Error(`Alert #${alertId} not found.`);
  }

  return res.rows[0];
}

module.exports = {
  ALERT_TYPES,
  scanAndGenerateAlerts,
  createAllocationChangeAlert,
  getAlerts,
  acknowledgeAlert,
  resolveAlert,
};
