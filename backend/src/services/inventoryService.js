const { query, getClient } = require('../config/db');
const { AppError } = require('../utils/response');
const { logAuditEvent } = require('../utils/audit');

async function listInventory() {
  const sql = `
    SELECT 
      p.id as product_id,
      p.sku,
      p.name,
      p.unit,
      p.active as product_active,
      i.on_hand_quantity,
      i.reserved_quantity,
      (i.on_hand_quantity - i.reserved_quantity) AS available_quantity,
      i.safety_stock,
      i.reorder_point,
      i.version,
      i.updated_at,
      u.name as updated_by_name
    FROM inventory i
    JOIN products p ON p.id = i.product_id
    LEFT JOIN users u ON u.id = i.updated_by
    ORDER BY p.name ASC;
  `;
  const res = await query(sql);
  return res.rows;
}

async function getInventoryByProductId(productId) {
  const sql = `
    SELECT 
      p.id as product_id,
      p.sku,
      p.name,
      p.unit,
      p.active as product_active,
      i.on_hand_quantity,
      i.reserved_quantity,
      (i.on_hand_quantity - i.reserved_quantity) AS available_quantity,
      i.safety_stock,
      i.reorder_point,
      i.version,
      i.updated_at
    FROM inventory i
    JOIN products p ON p.id = i.product_id
    WHERE i.product_id = $1
    LIMIT 1;
  `;
  const res = await query(sql, [productId]);
  if (res.rowCount === 0) {
    throw new AppError(`Inventory for product ID ${productId} not found`, 'NOT_FOUND', 404);
  }
  return res.rows[0];
}

async function adjustStock(productId, { adjustmentType = 'delta', quantity, reason, expectedVersion }, userId, reqMeta = {}) {
  if (!reason || reason.trim().length < 3) {
    throw new AppError('A valid adjustment reason is mandatory (minimum 3 characters)', 'VALIDATION_ERROR', 400);
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Lock inventory row for update
    const lockRes = await client.query(
      `SELECT product_id, on_hand_quantity, reserved_quantity, version 
       FROM inventory 
       WHERE product_id = $1 
       FOR UPDATE;`,
      [productId]
    );

    if (lockRes.rowCount === 0) {
      throw new AppError(`Inventory row for product ID ${productId} not found`, 'NOT_FOUND', 404);
    }

    const current = lockRes.rows[0];

    // Optimistic locking check if expectedVersion was supplied
    if (expectedVersion !== undefined && current.version !== expectedVersion) {
      throw new AppError(
        `Optimistic lock failure: inventory version is ${current.version}, expected ${expectedVersion}. Please reload and retry.`,
        'VERSION_CONFLICT',
        409
      );
    }

    let newOnHand;
    let delta;

    if (adjustmentType === 'set') {
      newOnHand = quantity;
      delta = newOnHand - current.on_hand_quantity;
    } else {
      // delta adjustment
      delta = quantity;
      newOnHand = current.on_hand_quantity + delta;
    }

    // HARD CONSTRAINT: Prevent negative stock
    if (newOnHand < 0) {
      throw new AppError(
        `Adjustment rejected: physical on-hand stock cannot be negative (calculated: ${newOnHand})`,
        'INSUFFICIENT_STOCK',
        400,
        { calculatedStock: newOnHand, currentStock: current.on_hand_quantity }
      );
    }

    // HARD CONSTRAINT: on_hand cannot fall below reserved_quantity
    if (newOnHand < current.reserved_quantity) {
      throw new AppError(
        `Adjustment rejected: physical on-hand stock (${newOnHand}) cannot be less than currently reserved stock (${current.reserved_quantity})`,
        'INSUFFICIENT_STOCK',
        400,
        { calculatedStock: newOnHand, reservedStock: current.reserved_quantity }
      );
    }

    // Update inventory row (increment version, record updater, note that reserved_quantity is NOT modified)
    const updateRes = await client.query(
      `UPDATE inventory 
       SET on_hand_quantity = $1, version = version + 1, updated_at = NOW(), updated_by = $2
       WHERE product_id = $3
       RETURNING *;`,
      [newOnHand, userId, productId]
    );

    // Record in inventory movements ledger
    await client.query(
      `INSERT INTO inventory_movements 
       (product_id, movement_type, quantity, previous_on_hand, new_on_hand, reference_type, reference_id, created_by)
       VALUES ($1, 'adjustment', $2, $3, $4, $5, null, $6);`,
      [productId, delta, current.on_hand_quantity, newOnHand, reason.trim(), userId]
    );

    await client.query('COMMIT');

    await logAuditEvent({
      actorId: userId,
      action: 'ADJUST_INVENTORY',
      entityType: 'inventory',
      entityId: productId,
      beforeState: current,
      afterState: updateRes.rows[0],
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent,
    });

    return await getInventoryByProductId(productId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getMovements(productId) {
  const sql = `
    SELECT 
      im.id,
      im.product_id,
      p.sku,
      p.name as product_name,
      im.movement_type,
      im.quantity,
      im.previous_on_hand,
      im.new_on_hand,
      im.reference_type as reason,
      im.created_at,
      u.name as actor_name
    FROM inventory_movements im
    JOIN products p ON p.id = im.product_id
    LEFT JOIN users u ON u.id = im.created_by
    WHERE im.product_id = $1
    ORDER BY im.created_at DESC;
  `;
  const res = await query(sql, [productId]);
  return res.rows;
}

module.exports = {
  listInventory,
  getInventoryByProductId,
  adjustStock,
  getMovements,
};
