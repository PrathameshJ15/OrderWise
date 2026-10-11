const { pool } = require('../config/db');

/**
 * Pure calculation function for replenishment metrics.
 * Reusable for testing and simulations without DB access.
 */
function calculateReplenishment({
  productId,
  productName,
  sku,
  unit = 'units',
  onHandQuantity = 0,
  reservedQuantity = 0,
  safetyStock = 0,
  configuredReorderPoint = 0,
  incomingStock = 0,
  averageDailyDemand = 5,
  leadTimeDays = 7,
}) {
  const onHand = Number(onHandQuantity);
  const reserved = Number(reservedQuantity);
  const safety = Number(safetyStock);
  const incoming = Number(incomingStock);
  const leadTime = Number(leadTimeDays) || 7;
  const dailyDemand = Math.max(1, Number(averageDailyDemand) || 1);

  // Available stock immediately free
  const availableStock = Math.max(0, onHand - reserved);

  // Dynamic Reorder Point = (average_daily_demand * lead_time_days) + safety_stock
  const dynamicReorderPoint = (dailyDemand * leadTime) + safety;

  // Use configured reorder point if higher than dynamic, or use dynamic
  const effectiveReorderPoint = Math.max(configuredReorderPoint || 0, dynamicReorderPoint);

  // Inventory Position = on_hand + incoming - reserved
  const inventoryPosition = onHand + incoming - reserved;

  const isReorderRecommended = inventoryPosition <= effectiveReorderPoint;

  let suggestedReorderQty = 0;
  let estimatedShortageRisk = 'low';

  if (isReorderRecommended) {
    // Formula: (average_daily_demand * lead_time_days * 2) - inventory_position
    const targetStock = dailyDemand * leadTime * 2;
    suggestedReorderQty = Math.max(0, targetStock - inventoryPosition);

    if (inventoryPosition <= 0) {
      estimatedShortageRisk = 'critical';
    } else if (inventoryPosition <= safety) {
      estimatedShortageRisk = 'high';
    } else {
      estimatedShortageRisk = 'medium';
    }
  }

  const formulaUsed = `(${dailyDemand} × ${leadTime}) + ${safety} = ${dynamicReorderPoint} dynamic reorder point; inventory position ${inventoryPosition} ${
    isReorderRecommended ? '<=' : '>'
  } ${effectiveReorderPoint}`;

  return {
    product_id: Number(productId),
    product_name: productName,
    sku,
    unit,
    current_stock: onHand,
    reserved_quantity: reserved,
    available_stock: availableStock,
    safety_stock: safety,
    configured_reorder_point: configuredReorderPoint,
    reorder_point: effectiveReorderPoint,
    average_daily_demand: dailyDemand,
    supplier_lead_time_days: leadTime,
    incoming_stock: incoming,
    inventory_position: inventoryPosition,
    flag: isReorderRecommended ? 'REORDER_RECOMMENDED' : 'ADEQUATE_STOCK',
    estimated_shortage_risk: estimatedShortageRisk,
    suggested_reorder_quantity: Math.round(suggestedReorderQty),
    formula_used: formulaUsed,
    note: 'This is an estimate based on recent demand data. Review before placing an order.',
  };
}

/**
 * Evaluates replenishment recommendations across all active products or a single product.
 */
async function getReplenishmentRecommendations(productId = null, client = null) {
  const runner = client || pool;

  // 1. Fetch products, inventory, supplier lead times, and incoming PO quantities
  const query = `
    SELECT 
      p.id AS product_id,
      p.name AS product_name,
      p.sku,
      p.unit,
      COALESCE(i.on_hand_quantity, 0) AS on_hand_quantity,
      COALESCE(i.reserved_quantity, 0) AS reserved_quantity,
      COALESCE(i.safety_stock, 0) AS safety_stock,
      COALESCE(i.reorder_point, 0) AS reorder_point,
      -- Lead time from active suppliers
      COALESCE((
        SELECT s.lead_time_days 
        FROM suppliers s 
        WHERE s.active = true 
        ORDER BY s.lead_time_days ASC 
        LIMIT 1
      ), 7) AS lead_time_days,
      -- Confirmed incoming stock from purchase orders (ordered or in_transit)
      COALESCE((
        SELECT SUM(poi.quantity_ordered - poi.quantity_received)
        FROM purchase_order_items poi
        JOIN purchase_orders po ON po.id = poi.purchase_order_id
        WHERE poi.product_id = p.id
          AND po.status IN ('ordered', 'in_transit')
      ), 0) AS incoming_stock,
      -- Total demand across recent non-cancelled orders
      COALESCE((
        SELECT SUM(oi.requested_quantity)
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE oi.product_id = p.id
          AND o.status NOT IN ('cancelled')
      ), 0) AS total_demand
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    WHERE p.active = true
      ${productId ? 'AND p.id = $1' : ''}
    ORDER BY p.id ASC;
  `;

  const params = productId ? [productId] : [];
  const { rows } = await runner.query(query, params);

  const recommendations = rows.map((row) => {
    // Estimate daily demand: total requested quantity divided by a baseline 14-day cycle (min 1)
    const rawDemand = Number(row.total_demand);
    const estimatedDailyDemand = rawDemand > 0 ? Math.max(1, Math.round(rawDemand / 14)) : 5;

    return calculateReplenishment({
      productId: row.product_id,
      productName: row.product_name,
      sku: row.sku,
      unit: row.unit,
      onHandQuantity: row.on_hand_quantity,
      reservedQuantity: row.reserved_quantity,
      safetyStock: row.safety_stock,
      configuredReorderPoint: row.reorder_point,
      incomingStock: row.incoming_stock,
      averageDailyDemand: estimatedDailyDemand,
      leadTimeDays: row.lead_time_days,
    });
  });

  return recommendations;
}

module.exports = {
  calculateReplenishment,
  getReplenishmentRecommendations,
};
