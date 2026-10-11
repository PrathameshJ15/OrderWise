const { pool } = require('../config/db');
const { getReplenishmentRecommendations } = require('./replenishmentService');

/**
 * Evaluates live system state and generates alerts for:
 * 1. below_reorder_point (Inventory position <= reorder point)
 * 2. low_inventory (Available stock <= safety stock)
 * 3. product_shortage (Available stock == 0)
 * 4. order_at_risk (Critical or High priority orders with deferred/unfulfilled items)
 * 5. supplier_delay (Purchase orders past expected delivery date)
 * 
 * Idempotent: Does not create duplicate unresolved alerts for the same entity and type.
 */
async function evaluateAndGenerateAlerts(client = null) {
  const runner = client || pool;
  const createdAlerts = [];

  // 1. Evaluate Inventory and Replenishment Telemetry
  const recommendations = await getReplenishmentRecommendations(null, runner);

  for (const rec of recommendations) {
    // Check if unresolved alert already exists for this product
    const existingCheck = await runner.query(
      `SELECT id, alert_type FROM alerts WHERE product_id = $1 AND resolved = false;`,
      [rec.product_id]
    );
    const existingTypes = new Set(existingCheck.rows.map((r) => r.alert_type));

    // A. Product Shortage (Zero Available Stock)
    if (rec.available_stock === 0 && !existingTypes.has('product_shortage')) {
      const ins = await runner.query(
        `INSERT INTO alerts (alert_type, severity, title, description, suggested_action, product_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, title;`,
        [
          'product_shortage',
          'critical',
          `Zero Available Stock: ${rec.product_name} (${rec.sku})`,
          `All physical units are reserved or exhausted. 0 available units out of ${rec.current_stock} on hand.`,
          'Review incoming shipments or initiate immediate emergency replenishment.',
          rec.product_id,
          JSON.stringify({ available: rec.available_stock, on_hand: rec.current_stock, reserved: rec.reserved_quantity }),
        ]
      );
      createdAlerts.push(ins.rows[0]);
    }

    // B. Low Inventory (Below or at Safety Stock)
    if (
      rec.available_stock > 0 &&
      rec.available_stock <= rec.safety_stock &&
      !existingTypes.has('low_inventory')
    ) {
      const ins = await runner.query(
        `INSERT INTO alerts (alert_type, severity, title, description, suggested_action, product_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, title;`,
        [
          'low_inventory',
          'warning',
          `Low Inventory Buffer: ${rec.product_name} (${rec.sku})`,
          `Available stock (${rec.available_stock}) is at or below the safety threshold (${rec.safety_stock}).`,
          'Monitor upcoming order allocations and verify supplier delivery timelines.',
          rec.product_id,
          JSON.stringify({ available: rec.available_stock, safety: rec.safety_stock }),
        ]
      );
      createdAlerts.push(ins.rows[0]);
    }

    // C. Below Reorder Point
    if (rec.flag === 'REORDER_RECOMMENDED' && !existingTypes.has('below_reorder_point')) {
      const severity = rec.inventory_position <= 0 ? 'critical' : 'warning';
      const ins = await runner.query(
        `INSERT INTO alerts (alert_type, severity, title, description, suggested_action, product_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, title;`,
        [
          'below_reorder_point',
          severity,
          `${rec.product_name} Below Reorder Point`,
          `Current inventory position (${rec.inventory_position} units) is at or below the effective reorder point (${rec.reorder_point} units). Suggested reorder: ${rec.suggested_reorder_quantity} ${rec.unit}.`,
          'Review Replenishment Advisor calculations and draft a purchase order.',
          rec.product_id,
          JSON.stringify({
            inventory_position: rec.inventory_position,
            reorder_point: rec.reorder_point,
            suggested_reorder_quantity: rec.suggested_reorder_quantity,
          }),
        ]
      );
      createdAlerts.push(ins.rows[0]);
    }
  }

  // 2. Evaluate Delayed Purchase Orders
  const delayedPOs = await runner.query(`
    SELECT po.id, po.po_number, po.expected_delivery_date, s.name AS supplier_name
    FROM purchase_orders po
    JOIN suppliers s ON s.id = po.supplier_id
    WHERE po.status IN ('ordered', 'in_transit')
      AND po.expected_delivery_date < CURRENT_DATE;
  `);

  for (const po of delayedPOs.rows) {
    const existingPoAlert = await runner.query(
      `SELECT id FROM alerts WHERE alert_type = 'supplier_delay' AND metadata->>'po_number' = $1 AND resolved = false;`,
      [po.po_number]
    );

    if (existingPoAlert.rows.length === 0) {
      const ins = await runner.query(
        `INSERT INTO alerts (alert_type, severity, title, description, suggested_action, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, title;`,
        [
          'supplier_delay',
          'warning',
          `Delayed Supplier Shipment: PO ${po.po_number}`,
          `Purchase order from ${po.supplier_name} was expected on ${po.expected_delivery_date} and is overdue.`,
          'Contact supplier representative to receive shipment tracking update.',
          JSON.stringify({ po_number: po.po_number, po_id: po.id, supplier: po.supplier_name }),
        ]
      );
      createdAlerts.push(ins.rows[0]);
    }
  }

  // 3. Evaluate High/Critical Orders at Risk
  const ordersAtRisk = await runner.query(`
    SELECT DISTINCT o.id AS order_id, u.name AS customer_name, op.approved_priority, o.promised_delivery_date
    FROM orders o
    JOIN users u ON u.id = o.customer_id
    JOIN order_priorities op ON op.order_id = o.id
    JOIN order_items oi ON oi.order_id = o.id
    JOIN inventory i ON i.product_id = oi.product_id
    WHERE o.status IN ('pending', 'confirmed')
      AND op.approved_priority IN ('CRITICAL', 'HIGH')
      AND (i.on_hand_quantity - i.reserved_quantity) < oi.minimum_acceptable_quantity;
  `);

  for (const ord of ordersAtRisk.rows) {
    const existingOrderAlert = await runner.query(
      `SELECT id FROM alerts WHERE alert_type = 'order_at_risk' AND order_id = $1 AND resolved = false;`,
      [ord.order_id]
    );

    if (existingOrderAlert.rows.length === 0) {
      const severity = ord.approved_priority === 'CRITICAL' ? 'critical' : 'warning';
      const ins = await runner.query(
        `INSERT INTO alerts (alert_type, severity, title, description, suggested_action, order_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, title;`,
        [
          'order_at_risk',
          severity,
          `${ord.approved_priority} Order at Risk: #${ord.order_id} (${ord.customer_name})`,
          `High-importance order promised by ${ord.promised_delivery_date || 'scheduled date'} cannot be fulfilled with current available inventory.`,
          'Prioritize incoming supplier stock or simulate allocation adjustments.',
          ord.order_id,
          JSON.stringify({ priority: ord.approved_priority, customer: ord.customer_name }),
        ]
      );
      createdAlerts.push(ins.rows[0]);
    }
  }

  return {
    evaluated_at: new Date().toISOString(),
    created_count: createdAlerts.length,
    created_alerts: createdAlerts,
  };
}

/**
 * Retrieves paginated alerts with filters.
 */
async function getAlerts({
  resolved = null,
  severity = null,
  alertType = null,
  productId = null,
  page = 1,
  limit = 20,
} = {}, client = null) {
  const runner = client || pool;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];

  if (resolved !== null && resolved !== undefined && resolved !== '') {
    params.push(resolved === true || resolved === 'true');
    conditions.push(`a.resolved = $${params.length}`);
  }

  if (severity) {
    params.push(severity);
    conditions.push(`a.severity = $${params.length}`);
  }

  if (alertType) {
    params.push(alertType);
    conditions.push(`a.alert_type = $${params.length}`);
  }

  if (productId) {
    params.push(Number(productId));
    conditions.push(`a.product_id = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count total matching
  const countQuery = `SELECT COUNT(*) AS total FROM alerts a ${whereClause};`;
  const countRes = await runner.query(countQuery, params);
  const total = parseInt(countRes.rows[0].total, 10);

  // Fetch paginated alerts
  const dataQuery = `
    SELECT 
      a.id,
      a.alert_type,
      a.severity,
      a.title,
      a.description,
      a.suggested_action,
      a.product_id,
      p.name AS product_name,
      p.sku AS product_sku,
      a.order_id,
      a.resolved,
      a.resolved_at,
      u.name AS resolved_by_name,
      a.metadata,
      a.created_at
    FROM alerts a
    LEFT JOIN products p ON p.id = a.product_id
    LEFT JOIN users u ON u.id = a.resolved_by
    ${whereClause}
    ORDER BY 
      CASE WHEN a.resolved THEN 1 ELSE 0 END ASC,
      CASE 
        WHEN a.severity = 'critical' THEN 0 
        WHEN a.severity = 'warning' THEN 1 
        ELSE 2 
      END ASC,
      a.created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2};
  `;

  const { rows } = await runner.query(dataQuery, [...params, limitNum, offset]);

  return {
    alerts: rows,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
}

/**
 * Retrieves aggregate statistics for active alerts.
 */
async function getAlertStats(client = null) {
  const runner = client || pool;

  const query = `
    SELECT 
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE resolved = false) AS unresolved,
      COUNT(*) FILTER (WHERE resolved = false AND severity = 'critical') AS critical,
      COUNT(*) FILTER (WHERE resolved = false AND severity = 'warning') AS warning,
      COUNT(*) FILTER (WHERE resolved = false AND severity = 'info') AS info
    FROM alerts;
  `;

  const { rows } = await runner.query(query);
  const row = rows[0];

  return {
    total: parseInt(row.total, 10),
    unresolved: parseInt(row.unresolved, 10),
    critical: parseInt(row.critical, 10),
    warning: parseInt(row.warning, 10),
    info: parseInt(row.info, 10),
  };
}

/**
 * Resolves an active alert.
 */
async function resolveAlert(alertId, userId, client = null) {
  const runner = client || pool;

  const res = await runner.query(
    `UPDATE alerts
     SET resolved = true,
         resolved_at = NOW(),
         resolved_by = $1
     WHERE id = $2
     RETURNING id, alert_type, title, resolved, resolved_at;`,
    [userId, alertId]
  );

  if (res.rows.length === 0) {
    return null;
  }

  return res.rows[0];
}

/**
 * Dismisses/deletes an alert.
 */
async function deleteAlert(alertId, client = null) {
  const runner = client || pool;

  const res = await runner.query(
    `DELETE FROM alerts WHERE id = $1 RETURNING id;`,
    [alertId]
  );

  return res.rows.length > 0;
}

module.exports = {
  evaluateAndGenerateAlerts,
  getAlerts,
  getAlertStats,
  resolveAlert,
  deleteAlert,
};
