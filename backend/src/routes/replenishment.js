const express = require('express');
const { query } = require('../config/db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');
const {
  getReplenishmentRecommendations,
  createDraftPurchaseOrder,
  approvePurchaseOrder,
} = require('../services/replenishmentService');

const router = express.Router();

router.use(auth);

/**
 * GET /api/replenishment
 * Returns replenishment recommendations and calculated formulas.
 * Accessible to admin and inventory_manager.
 */
router.get(
  '/',
  rbac('admin', 'inventory_manager'),
  asyncHandler(async (req, res) => {
    const { demand_period_days } = req.query;
    const period = demand_period_days ? parseInt(demand_period_days, 10) : 30;

    const data = await getReplenishmentRecommendations(period);
    return successResponse(res, data);
  })
);

/**
 * GET /api/replenishment/suppliers
 * Returns list of active suppliers for replenishment order creation
 */
router.get(
  '/suppliers',
  rbac('admin', 'inventory_manager'),
  asyncHandler(async (req, res) => {
    const supRes = await query(
      `SELECT id, name, code, contact_email, lead_time_days, active
       FROM suppliers
       WHERE active = true
       ORDER BY name ASC`
    );
    return successResponse(res, { suppliers: supRes.rows });
  })
);

/**
 * GET /api/replenishment/pos
 * Returns purchase orders with line items
 */
router.get(
  '/pos',
  rbac('admin', 'inventory_manager'),
  asyncHandler(async (req, res) => {
    const { status } = req.query;
    const params = [];
    let filter = '';

    if (status && status !== 'ALL') {
      params.push(status);
      filter = `WHERE po.status = $1`;
    }

    const posRes = await query(
      `SELECT po.*, s.name as supplier_name, s.code as supplier_code,
              json_agg(
                json_build_object(
                  'id', poi.id,
                  'product_id', poi.product_id,
                  'product_name', p.name,
                  'sku', p.sku,
                  'quantity_ordered', poi.quantity_ordered,
                  'quantity_received', poi.quantity_received
                )
              ) as items
       FROM purchase_orders po
       JOIN suppliers s ON s.id = po.supplier_id
       JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
       JOIN products p ON p.id = poi.product_id
       ${filter}
       GROUP BY po.id, s.name, s.code
       ORDER BY po.id DESC
       LIMIT 50`,
      params
    );

    return successResponse(res, { purchase_orders: posRes.rows });
  })
);

/**
 * POST /api/replenishment/draft-po
 * Creates a DRAFT purchase order. Does NOT auto-order.
 * Requires admin or inventory_manager.
 */
router.post(
  '/draft-po',
  rbac('admin', 'inventory_manager'),
  asyncHandler(async (req, res) => {
    const { supplier_id, items, notes } = req.body;

    const po = await createDraftPurchaseOrder({
      supplierId: supplier_id,
      items,
      notes,
      userId: req.user.userId,
    });

    return successResponse(
      res,
      {
        purchase_order: po,
        message: 'Draft purchase order created successfully. Awaiting admin approval.',
      },
      undefined,
      201
    );
  })
);

/**
 * PATCH /api/replenishment/po/:id/approve (also supports POST)
 * Admin explicitly approves a draft PO, transitioning it to 'ordered'.
 * Strictly admin-only (inventory_manager cannot approve).
 */
router.patch(
  '/po/:id/approve',
  rbac('admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const po = await approvePurchaseOrder(parseInt(id, 10), req.user.userId);
    return successResponse(res, {
      purchase_order: po,
      message: `Purchase order ${po.po_number} has been officially approved and marked as 'ordered'.`,
    });
  })
);

router.post(
  '/po/:id/approve',
  rbac('admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const po = await approvePurchaseOrder(parseInt(id, 10), req.user.userId);
    return successResponse(res, {
      purchase_order: po,
      message: `Purchase order ${po.po_number} has been officially approved and marked as 'ordered'.`,
    });
  })
);

module.exports = router;
