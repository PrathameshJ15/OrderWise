const express = require('express');
const { query } = require('../config/db');
const { auth } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { successResponse, errorResponse } = require('../utils/response');

const router = express.Router();

// GET /api/products - Public/Auth: list active products with stock levels
router.get('/', async (req, res) => {
  try {
    const { q, available_only } = req.query;

    let sql = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.description,
        p.unit,
        p.active,
        COALESCE(i.on_hand_quantity, 0) AS on_hand_quantity,
        COALESCE(i.reserved_quantity, 0) AS reserved_quantity,
        GREATEST(0, COALESCE(i.on_hand_quantity, 0) - COALESCE(i.reserved_quantity, 0)) AS available_stock,
        COALESCE(i.safety_stock, 0) AS safety_stock,
        COALESCE(i.reorder_point, 0) AS reorder_point
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.active = true
    `;
    const params = [];

    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      sql += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
    }

    if (available_only === 'true') {
      sql += ` AND (COALESCE(i.on_hand_quantity, 0) - COALESCE(i.reserved_quantity, 0)) > 0`;
    }

    sql += ` ORDER BY p.name ASC`;

    const result = await query(sql, params);
    const products = result.rows.map((row) => ({
      ...row,
      id: Number(row.id),
      on_hand_quantity: Number(row.on_hand_quantity),
      reserved_quantity: Number(row.reserved_quantity),
      available_stock: Number(row.available_stock),
      safety_stock: Number(row.safety_stock),
      reorder_point: Number(row.reorder_point),
    }));

    return res.status(200).json({
      success: true,
      products,
      data: { products },
    });
  } catch (err) {
    console.error('Get products error:', err);
    return errorResponse(res, err.message, 'INTERNAL_SERVER_ERROR', undefined, 500);
  }
});

// GET /api/products/:id - Single product
router.get('/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const result = await query(
      `SELECT 
        p.id,
        p.sku,
        p.name,
        p.description,
        p.unit,
        p.active,
        COALESCE(i.on_hand_quantity, 0) AS on_hand_quantity,
        COALESCE(i.reserved_quantity, 0) AS reserved_quantity,
        GREATEST(0, COALESCE(i.on_hand_quantity, 0) - COALESCE(i.reserved_quantity, 0)) AS available_stock,
        COALESCE(i.safety_stock, 0) AS safety_stock,
        COALESCE(i.reorder_point, 0) AS reorder_point
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.id = $1`,
      [productId]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'Product not found', 'NOT_FOUND', undefined, 404);
    }

    const row = result.rows[0];
    const product = {
      ...row,
      id: Number(row.id),
      on_hand_quantity: Number(row.on_hand_quantity),
      reserved_quantity: Number(row.reserved_quantity),
      available_stock: Number(row.available_stock),
      safety_stock: Number(row.safety_stock),
      reorder_point: Number(row.reorder_point),
    };

    return res.status(200).json({
      success: true,
      product,
      data: { product },
    });
  } catch (err) {
    console.error('Get product by id error:', err);
    return errorResponse(res, err.message, 'INTERNAL_SERVER_ERROR', undefined, 500);
  }
});

// POST /api/products - Admin only
router.post('/', auth, rbac('admin'), async (req, res) => {
  try {
    const { sku, name, description, unit, initial_stock = 0, safety_stock = 0, reorder_point = 0 } = req.body;

    if (!sku || !name) {
      return errorResponse(res, 'SKU and product name are required', 'VALIDATION_ERROR', undefined, 400);
    }

    const insertResult = await query(
      `INSERT INTO products (sku, name, description, unit, active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [sku.trim().toUpperCase(), name.trim(), description || '', unit || 'units']
    );

    const product = insertResult.rows[0];

    await query(
      `INSERT INTO inventory (product_id, on_hand_quantity, reserved_quantity, safety_stock, reorder_point, version, updated_by)
       VALUES ($1, $2, 0, $3, $4, 1, $5)
       ON CONFLICT (product_id) DO NOTHING`,
      [product.id, Math.max(0, initial_stock), Math.max(0, safety_stock), Math.max(0, reorder_point), req.user.userId]
    );

    return res.status(201).json({
      success: true,
      product,
      data: { product },
    });
  } catch (err) {
    console.error('Create product error:', err);
    return errorResponse(res, err.message, 'INTERNAL_SERVER_ERROR', undefined, 500);
  }
});

module.exports = router;
