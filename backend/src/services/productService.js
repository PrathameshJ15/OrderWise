const { query, getClient } = require('../config/db');
const { AppError } = require('../utils/response');
const { logAuditEvent } = require('../utils/audit');

async function listProducts({ page = 1, limit = 20, search = '', active = undefined }) {
  const offset = (page - 1) * limit;
  const whereClauses = [];
  const params = [];

  if (active !== undefined) {
    params.push(active === true || active === 'true');
    whereClauses.push(`p.active = $${params.length}`);
  }

  if (search && search.trim() !== '') {
    params.push(`%${search.trim()}%`);
    whereClauses.push(`(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Get total count
  const countRes = await query(
    `SELECT count(*)::int as total FROM products p ${whereSql};`,
    params
  );
  const total = countRes.rows[0].total;

  // Get paginated rows with inventory metrics
  params.push(limit);
  const limitIndex = params.length;
  params.push(offset);
  const offsetIndex = params.length;

  const dataSql = `
    SELECT 
      p.id,
      p.sku,
      p.name,
      p.description,
      p.unit,
      p.active,
      p.created_at,
      p.updated_at,
      COALESCE(i.on_hand_quantity, 0) as on_hand_quantity,
      COALESCE(i.reserved_quantity, 0) as reserved_quantity,
      COALESCE(i.on_hand_quantity - i.reserved_quantity, 0) as available_quantity,
      COALESCE(i.safety_stock, 0) as safety_stock,
      COALESCE(i.reorder_point, 0) as reorder_point,
      COALESCE(i.version, 1) as inventory_version
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    ${whereSql}
    ORDER BY p.name ASC
    LIMIT $${limitIndex} OFFSET $${offsetIndex};
  `;

  const rowsRes = await query(dataSql, params);

  return {
    products: rowsRes.rows,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getProductById(id) {
  const sql = `
    SELECT 
      p.id,
      p.sku,
      p.name,
      p.description,
      p.unit,
      p.active,
      p.created_at,
      p.updated_at,
      COALESCE(i.on_hand_quantity, 0) as on_hand_quantity,
      COALESCE(i.reserved_quantity, 0) as reserved_quantity,
      COALESCE(i.on_hand_quantity - i.reserved_quantity, 0) as available_quantity,
      COALESCE(i.safety_stock, 0) as safety_stock,
      COALESCE(i.reorder_point, 0) as reorder_point,
      COALESCE(i.version, 1) as inventory_version
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    WHERE p.id = $1
    LIMIT 1;
  `;
  const res = await query(sql, [id]);
  if (res.rowCount === 0) {
    throw new AppError(`Product with ID ${id} not found`, 'NOT_FOUND', 404);
  }
  return res.rows[0];
}

async function createProduct(
  { sku, name, description = '', unit = 'units', initialStock = 0, safetyStock = 0, reorderPoint = 0 },
  userId,
  reqMeta = {}
) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Check unique SKU
    const existing = await client.query('SELECT id FROM products WHERE sku = $1', [sku.trim()]);
    if (existing.rowCount > 0) {
      throw new AppError(`Product with SKU "${sku}" already exists`, 'DUPLICATE_SKU', 409);
    }

    const prodRes = await client.query(
      `INSERT INTO products (sku, name, description, unit, active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *;`,
      [sku.trim().toUpperCase(), name.trim(), description, unit]
    );
    const newProduct = prodRes.rows[0];

    // Initialize inventory record
    await client.query(
      `INSERT INTO inventory (product_id, on_hand_quantity, reserved_quantity, safety_stock, reorder_point, version, updated_by)
       VALUES ($1, $2, 0, $3, $4, 1, $5);`,
      [newProduct.id, initialStock, safetyStock, reorderPoint, userId]
    );

    // If initial stock was provided, write movement log
    if (initialStock > 0) {
      await client.query(
        `INSERT INTO inventory_movements (product_id, movement_type, quantity, previous_on_hand, new_on_hand, reference_type, created_by)
         VALUES ($1, 'receipt', $2, 0, $2, 'initial_stock_creation', $3);`,
        [newProduct.id, initialStock, userId]
      );
    }

    await client.query('COMMIT');

    await logAuditEvent({
      actorId: userId,
      action: 'CREATE_PRODUCT',
      entityType: 'products',
      entityId: newProduct.id,
      afterState: newProduct,
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent,
    });

    return await getProductById(newProduct.id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateProduct(id, { name, description, unit, active }, userId, reqMeta = {}) {
  const current = await getProductById(id);

  const updatedName = name !== undefined ? name.trim() : current.name;
  const updatedDesc = description !== undefined ? description : current.description;
  const updatedUnit = unit !== undefined ? unit : current.unit;
  const updatedActive = active !== undefined ? Boolean(active) : current.active;

  const res = await query(
    `UPDATE products 
     SET name = $1, description = $2, unit = $3, active = $4, updated_at = NOW()
     WHERE id = $5
     RETURNING *;`,
    [updatedName, updatedDesc, updatedUnit, updatedActive, id]
  );

  await logAuditEvent({
    actorId: userId,
    action: 'UPDATE_PRODUCT',
    entityType: 'products',
    entityId: id,
    beforeState: current,
    afterState: res.rows[0],
    ipAddress: reqMeta.ip,
    userAgent: reqMeta.userAgent,
  });

  return await getProductById(id);
}

async function deactivateProduct(id, userId, reqMeta = {}) {
  const current = await getProductById(id);

  const res = await query(
    `UPDATE products 
     SET active = false, updated_at = NOW()
     WHERE id = $1
     RETURNING *;`,
    [id]
  );

  await logAuditEvent({
    actorId: userId,
    action: 'DEACTIVATE_PRODUCT',
    entityType: 'products',
    entityId: id,
    beforeState: current,
    afterState: res.rows[0],
    ipAddress: reqMeta.ip,
    userAgent: reqMeta.userAgent,
  });

  return { message: `Product ${current.sku} has been deactivated`, product: res.rows[0] };
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deactivateProduct,
};
