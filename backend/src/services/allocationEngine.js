const { PRIORITY_RANKS } = require('./aiService');

/**
 * Builds standard explanation JSON object for an allocation decision.
 */
function buildExplanation(item, allocated, status, reason, stockAtRunTime) {
  return {
    requested_quantity: item.requested_quantity,
    allocated_quantity: allocated,
    approved_priority: item.approved_priority || 'MEDIUM',
    promised_delivery_date: item.promised_delivery_date,
    stock_at_allocation: stockAtRunTime,
    partial_delivery_allowed: item.partial_delivery_allowed,
    minimum_acceptable_quantity: item.minimum_acceptable_quantity,
    status: status,
    reason: reason,
  };
}

/**
 * Core Deterministic Allocation Engine.
 * Operates purely using authoritative order_priorities and inventory state in PostgreSQL.
 * Has ZERO dependency on Groq / external AI services.
 */
async function runAllocationEngine(productIds, client) {
  const results = [];

  for (const productId of productIds) {
    // 1. Lock inventory row for this product to prevent concurrent modifications
    const invRes = await client.query(
      `SELECT product_id, on_hand_quantity, reserved_quantity, version
       FROM inventory
       WHERE product_id = $1
       FOR UPDATE`,
      [productId]
    );

    if (invRes.rowCount === 0) {
      continue;
    }

    const inventory = invRes.rows[0];
    const availableStock = inventory.on_hand_quantity - inventory.reserved_quantity;

    // 2. Fetch eligible order items sorted deterministically per Section 7.1
    const itemsRes = await client.query(
      `SELECT oi.id as order_item_id, oi.order_id, oi.product_id,
              oi.requested_quantity, oi.minimum_acceptable_quantity, oi.partial_delivery_allowed,
              coalesce(op.approved_priority, 'MEDIUM') as approved_priority,
              coalesce(op.priority_rank, 2) as priority_rank,
              o.promised_delivery_date, o.created_at, o.customer_id,
              p.name as product_name, u.name as customer_name
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       JOIN users u ON u.id = o.customer_id
       LEFT JOIN order_priorities op ON op.order_id = o.id
       WHERE oi.product_id = $1
         AND o.status IN ('pending', 'confirmed')
       ORDER BY coalesce(op.priority_rank, 2) DESC,
                o.promised_delivery_date ASC NULLS LAST,
                o.created_at ASC,
                o.id ASC,
                oi.id ASC`,
      [productId]
    );

    let remainingStock = availableStock;
    let productTotalAllocated = 0;

    // 3. Allocate to each item in priority order
    for (const item of itemsRes.rows) {
      let allocated = 0;
      let status = 'deferred';
      let reason = '';

      if (remainingStock >= item.requested_quantity) {
        // Case A: Full fulfillment
        allocated = item.requested_quantity;
        status = 'fulfilled';
        reason = 'Available stock was sufficient to fulfill the complete request.';
      } else if (
        item.partial_delivery_allowed === true &&
        remainingStock >= item.minimum_acceptable_quantity
      ) {
        // Case B: Partial fulfillment
        allocated = remainingStock;
        status = 'partially_fulfilled';
        reason =
          'Available stock was insufficient for the full request. Partial delivery was permitted and the available quantity met the minimum acceptable quantity.';
      } else {
        // Case C or D: Deferred
        allocated = 0;
        status = 'deferred';
        if (item.partial_delivery_allowed === false) {
          reason = 'Partial delivery is not permitted for this order item.';
        } else {
          reason = `Available stock (${remainingStock}) is below the minimum acceptable quantity (${item.minimum_acceptable_quantity}). No allocation made.`;
        }
      }

      remainingStock -= allocated;
      productTotalAllocated += allocated;

      results.push({
        order_item_id: item.order_item_id,
        order_id: item.order_id,
        customer_name: item.customer_name,
        product_name: item.product_name,
        product_id: item.product_id,
        requested_quantity: item.requested_quantity,
        allocated_quantity: allocated,
        status: status,
        approved_priority: item.approved_priority,
        promised_delivery_date: item.promised_delivery_date,
        stock_at_allocation: availableStock,
        partial_delivery_allowed: item.partial_delivery_allowed,
        minimum_acceptable_quantity: item.minimum_acceptable_quantity,
        explanation: buildExplanation(item, allocated, status, reason, availableStock),
      });
    }

    // 4. Update inventory reserved quantity
    await client.query(
      `UPDATE inventory
       SET reserved_quantity = reserved_quantity + $1,
           version = version + 1,
           updated_at = NOW()
       WHERE product_id = $2`,
      [productTotalAllocated, productId]
    );
  }

  return results;
}

module.exports = {
  runAllocationEngine,
  buildExplanation,
};
