const { query, pool } = require('../config/db');

/**
 * Validates supplier data and lead time.
 * If lead time is invalid (<= 0, null, NaN), returns validation flags and fallback.
 */
function validateSupplierData(supplier, productFallbackLeadTime = 7) {
  if (!supplier) {
    return {
      isValid: false,
      leadTimeDays: Math.max(1, Number(productFallbackLeadTime) || 7),
      error: 'No supplier linked to product',
      warning: 'Supplier information is missing. Using product default lead time estimate.',
    };
  }

  const leadTime = Number(supplier.lead_time_days);
  if (isNaN(leadTime) || leadTime <= 0) {
    return {
      isValid: false,
      leadTimeDays: Math.max(1, Number(productFallbackLeadTime) || 7),
      error: `Invalid supplier lead time (${supplier.lead_time_days})`,
      warning: `Supplier "${supplier.name}" has invalid lead time (${supplier.lead_time_days} days). Lead time must be a positive integer. Using fallback estimate of 7 days.`,
    };
  }

  return {
    isValid: true,
    leadTimeDays: leadTime,
    error: null,
    warning: null,
  };
}

/**
 * Validates demand period and returns safe positive integer.
 */
function validateDemandPeriod(periodDays) {
  const days = parseInt(periodDays, 10);
  if (isNaN(days) || days <= 0) {
    throw new Error('Demand period must be a positive integer greater than 0.');
  }
  return days;
}

/**
 * Calculates replenishment metrics and recommendations across active products.
 *
 * Formulas:
 * 1. Avg Daily Demand = Total Demand in Period / Demand Period Days
 * 2. Reorder Point = Avg Daily Demand × Lead Time + Safety Stock
 * 3. Inventory Position = On-Hand + Confirmed Incoming − Reserved
 * 4. Replenishment triggered when: Inventory Position <= Reorder Point
 *
 * Guaranteed:
 * - All computed values are labeled as estimates.
 * - States explicit limitation when demand history is insufficient (< 2 orders or 0 demand).
 * - Never auto-creates purchase orders.
 */
async function getReplenishmentRecommendations(demandPeriodDays = 30, client = null) {
  const db = client || { query };
  const period = validateDemandPeriod(demandPeriodDays);

  // 1. Fetch products with inventory and default supplier
  const productsRes = await db.query(
    `SELECT p.id as product_id, p.sku, p.name as product_name, p.unit,
            p.default_supplier_id, p.default_lead_time_days,
            i.on_hand_quantity, i.reserved_quantity, i.safety_stock, i.reorder_point as configured_reorder_point,
            s.id as supplier_id, s.name as supplier_name, s.code as supplier_code,
            s.contact_email as supplier_email, s.lead_time_days as supplier_lead_time_days, s.active as supplier_active
     FROM products p
     JOIN inventory i ON i.product_id = p.id
     LEFT JOIN suppliers s ON s.id = p.default_supplier_id
     WHERE p.active = true
     ORDER BY p.id ASC`
  );

  // 2. Fetch confirmed incoming stock from purchase orders (status: 'ordered', 'in_transit')
  const incomingRes = await db.query(
    `SELECT poi.product_id,
            COALESCE(SUM(poi.quantity_ordered - poi.quantity_received), 0)::int as confirmed_incoming
     FROM purchase_order_items poi
     JOIN purchase_orders po ON po.id = poi.purchase_order_id
     WHERE po.status IN ('ordered', 'in_transit')
     GROUP BY poi.product_id`
  );

  const incomingMap = new Map();
  for (const row of incomingRes.rows) {
    incomingMap.set(parseInt(row.product_id, 10), parseInt(row.confirmed_incoming, 10));
  }

  // 3. Fetch historical demand within demandPeriodDays
  const demandRes = await db.query(
    `SELECT oi.product_id,
            COALESCE(SUM(oi.requested_quantity), 0)::int as total_demand,
            COUNT(DISTINCT o.id)::int as order_count,
            MIN(o.created_at) as earliest_order_date,
            MAX(o.created_at) as latest_order_date
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.status NOT IN ('cancelled')
       AND o.created_at >= NOW() - ($1 || ' days')::interval
     GROUP BY oi.product_id`,
    [period]
  );

  const demandMap = new Map();
  for (const row of demandRes.rows) {
    demandMap.set(parseInt(row.product_id, 10), {
      total_demand: parseInt(row.total_demand, 10),
      order_count: parseInt(row.order_count, 10),
      earliest_order_date: row.earliest_order_date,
      latest_order_date: row.latest_order_date,
    });
  }

  const recommendations = [];

  for (const prod of productsRes.rows) {
    const prodId = parseInt(prod.product_id, 10);
    const onHand = parseInt(prod.on_hand_quantity, 10);
    const reserved = parseInt(prod.reserved_quantity, 10);
    const safetyStock = parseInt(prod.safety_stock, 10);
    const configuredReorder = parseInt(prod.configured_reorder_point, 10);
    const confirmedIncoming = incomingMap.get(prodId) || 0;

    // Supplier & Lead time validation
    const supplier = prod.supplier_id
      ? {
          id: prod.supplier_id,
          name: prod.supplier_name,
          code: prod.supplier_code,
          email: prod.supplier_email,
          lead_time_days: prod.supplier_lead_time_days,
        }
      : null;

    const supplierValidation = validateSupplierData(supplier, prod.default_lead_time_days);
    const leadTimeDays = supplierValidation.leadTimeDays;

    // Demand analysis & Insufficient History check
    const demandInfo = demandMap.get(prodId) || { total_demand: 0, order_count: 0 };
    const totalDemand = demandInfo.total_demand;
    const orderCount = demandInfo.order_count;

    const hasSufficientDemandHistory = orderCount >= 2 && totalDemand > 0;
    const avgDailyDemand = Number((totalDemand / period).toFixed(2));

    let limitationNote = null;
    if (!hasSufficientDemandHistory) {
      limitationNote = orderCount === 0
        ? `No demand history recorded in the past ${period} days. Demand values are preliminary baseline estimates. Review manually before creating purchase orders.`
        : `Insufficient demand history (${orderCount} order in ${period} days). Statistical confidence is low. Label values as preliminary estimates.`;
    }

    // Formulas:
    // Reorder Point = Avg Daily Demand × Lead Time + Safety Stock
    const calculatedReorderPoint = Math.ceil(avgDailyDemand * leadTimeDays + safetyStock);
    // Effective reorder point takes into account calculated and configured safety thresholds
    const effectiveReorderPoint = Math.max(calculatedReorderPoint, configuredReorder);

    // Inventory Position = On-Hand + Confirmed Incoming − Reserved
    const inventoryPosition = onHand + confirmedIncoming - reserved;

    // Replenishment triggered when Position <= Reorder Point
    const needsReplenishment = inventoryPosition <= effectiveReorderPoint;

    // Suggested order quantity (brings inventory position up to 1.5x reorder point or minimum buffer)
    let suggestedQuantity = 0;
    if (needsReplenishment) {
      const targetBuffer = Math.ceil(effectiveReorderPoint * 1.5);
      suggestedQuantity = Math.max(1, targetBuffer - inventoryPosition);
    }

    // Shortage Risk Classification
    let shortageRisk = 'low';
    if (inventoryPosition <= 0) shortageRisk = 'critical';
    else if (inventoryPosition <= safetyStock) shortageRisk = 'high';
    else if (needsReplenishment) shortageRisk = 'medium';

    recommendations.push({
      product_id: prodId,
      sku: prod.sku,
      product_name: prod.product_name,
      unit: prod.unit,
      on_hand_quantity: onHand,
      reserved_quantity: reserved,
      available_stock: onHand - reserved,
      confirmed_incoming: confirmedIncoming,
      inventory_position: inventoryPosition,
      safety_stock: safetyStock,
      configured_reorder_point: configuredReorder,
      calculated_reorder_point: calculatedReorderPoint,
      effective_reorder_point: effectiveReorderPoint,
      average_daily_demand: avgDailyDemand,
      demand_period_days: period,
      total_demand_in_period: totalDemand,
      order_count_in_period: orderCount,
      has_sufficient_demand_history: hasSufficientDemandHistory,
      limitation_note: limitationNote,
      lead_time_days: leadTimeDays,
      supplier: supplier ? { id: supplier.id, name: supplier.name, code: supplier.code } : null,
      supplier_validation: {
        is_valid: supplierValidation.isValid,
        error: supplierValidation.error,
        warning: supplierValidation.warning,
      },
      needs_replenishment: needsReplenishment,
      suggested_reorder_quantity: suggestedQuantity,
      shortage_risk: shortageRisk,
      is_estimate: true,
      estimate_label: 'Values are estimates based on historical demand models and supplier lead times.',
      formula_breakdown: {
        reorder_point_formula: `(${avgDailyDemand} daily demand × ${leadTimeDays}d lead time) + ${safetyStock} safety stock = ${calculatedReorderPoint}`,
        inventory_position_formula: `${onHand} on-hand + ${confirmedIncoming} incoming - ${reserved} reserved = ${inventoryPosition}`,
        replenishment_trigger: `${inventoryPosition} position <= ${effectiveReorderPoint} reorder point -> ${needsReplenishment ? 'REPLENISH' : 'OK'}`,
      },
    });
  }

  return {
    demand_period_days: period,
    total_products_evaluated: recommendations.length,
    replenishment_needed_count: recommendations.filter((r) => r.needs_replenishment).length,
    critical_stock_count: recommendations.filter((r) => r.shortage_risk === 'critical').length,
    recommendations,
  };
}

/**
 * Creates a DRAFT purchase order.
 * Strictly adheres to rule: NEVER auto-approves. Created with status = 'draft'.
 */
async function createDraftPurchaseOrder({ supplierId, items, notes, userId }, client = null) {
  const db = client || { query };

  if (!supplierId) {
    throw new Error('Supplier ID is required to create a draft purchase order.');
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('At least one purchase order item is required.');
  }

  // Validate supplier exists and active
  const supRes = await db.query('SELECT * FROM suppliers WHERE id = $1', [supplierId]);
  if (supRes.rowCount === 0) {
    throw new Error(`Supplier with ID ${supplierId} not found.`);
  }
  const supplier = supRes.rows[0];

  const leadTimeDays = supplier.lead_time_days || 7;
  const expectedDeliveryDate = new Date();
  expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + leadTimeDays);

  const poNumber = `PO-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  // Insert PO with status 'draft'
  const poRes = await db.query(
    `INSERT INTO purchase_orders (po_number, supplier_id, status, expected_delivery_date, notes)
     VALUES ($1, $2, 'draft', $3, $4)
     RETURNING *`,
    [poNumber, supplierId, expectedDeliveryDate.toISOString().slice(0, 10), notes || 'Draft replenishment PO generated from Supply Intelligence']
  );
  const po = poRes.rows[0];

  const createdItems = [];
  for (const item of items) {
    const qty = parseInt(item.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      throw new Error(`Invalid quantity ${item.quantity} for product ID ${item.product_id}. Must be > 0.`);
    }

    const itemRes = await db.query(
      `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity_ordered, quantity_received)
       VALUES ($1, $2, $3, 0)
       RETURNING *`,
      [po.id, item.product_id, qty]
    );
    createdItems.push(itemRes.rows[0]);
  }

  // Record audit log
  await db.query(
    `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, before_state, after_state)
     VALUES ($1, 'DRAFT_PO_CREATED', 'purchase_orders', $2, NULL, $3)`,
    [userId || null, po.id, JSON.stringify({ po_number: po.po_number, status: 'draft', items: createdItems })]
  );

  return {
    ...po,
    items: createdItems,
  };
}

/**
 * Admin approves draft purchase order -> transitions status from 'draft' to 'ordered'.
 */
async function approvePurchaseOrder(poId, userId, client = null) {
  const db = client || { query };

  const checkRes = await db.query('SELECT * FROM purchase_orders WHERE id = $1', [poId]);
  if (checkRes.rowCount === 0) {
    throw new Error(`Purchase order #${poId} not found.`);
  }

  const currentPo = checkRes.rows[0];
  if (currentPo.status !== 'draft') {
    throw new Error(`Cannot approve purchase order #${poId} because its current status is "${currentPo.status}" (must be "draft").`);
  }

  const updateRes = await db.query(
    `UPDATE purchase_orders
     SET status = 'ordered', updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [poId]
  );

  const updatedPo = updateRes.rows[0];

  // Record audit log
  await db.query(
    `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, before_state, after_state)
     VALUES ($1, 'PO_APPROVED', 'purchase_orders', $2, $3, $4)`,
    [userId, poId, JSON.stringify(currentPo), JSON.stringify(updatedPo)]
  );

  return updatedPo;
}

module.exports = {
  validateSupplierData,
  validateDemandPeriod,
  getReplenishmentRecommendations,
  createDraftPurchaseOrder,
  approvePurchaseOrder,
};
