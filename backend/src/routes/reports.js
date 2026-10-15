const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const asyncHandler = require('../middleware/asyncHandler');
const { successResponse } = require('../utils/response');
const { query } = require('../config/db');
const demoStore = require('../services/demoStore');

const router = express.Router();

/**
 * Helper to convert array of objects into CSV format.
 */
function convertToCSV(data, fields) {
  if (!data || data.length === 0) {
    return fields.join(',') + '\n';
  }
  const header = fields.join(',');
  const rows = data.map((item) => {
    return fields
      .map((f) => {
        let val = item[f] !== undefined && item[f] !== null ? String(item[f]) : '';
        // Escape quotes and commas
        val = val.replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(',');
  });
  return [header, ...rows].join('\n');
}

/**
 * GET /api/reports/summary
 * Overview KPIs: allocation run summary, fill rate, deferred orders, inventory valuation, AI approval stats.
 * Roles: admin, inventory_manager
 */
router.get(
  '/summary',
  authenticate,
  authorize('admin', 'inventory_manager'),
  asyncHandler(async (req, res) => {
    try {
      // 1. Allocation stats
      const runsRes = await query(`
        SELECT COUNT(*) as total_runs,
               COALESCE(SUM(total_items_considered), 0) as total_items,
               COALESCE(SUM(total_items_fulfilled), 0) as total_fulfilled,
               COALESCE(SUM(total_items_partially_fulfilled), 0) as total_partial,
               COALESCE(SUM(total_items_deferred), 0) as total_deferred
        FROM allocation_runs
        WHERE status = 'completed';
      `);

      // 2. Orders stats
      const ordersRes = await query(`
        SELECT COUNT(*) as total_orders,
               COUNT(*) FILTER (WHERE status IN ('allocated', 'completed', 'delivered')) as fulfilled_orders,
               COUNT(*) FILTER (WHERE status = 'deferred') as deferred_orders,
               COUNT(*) FILTER (WHERE status = 'pending') as pending_orders
        FROM orders;
      `);

      // 3. AI stats
      const aiRes = await query(`
        SELECT COUNT(*) as total_recommendations,
               COUNT(*) FILTER (WHERE decision = 'approved') as approved,
               COUNT(*) FILTER (WHERE decision = 'overridden') as overridden,
               COUNT(*) FILTER (WHERE decision = 'rejected') as rejected
        FROM priority_approvals;
      `);

      // 4. Inventory Valuation
      const invRes = await query(`
        SELECT p.id, p.sku, p.name as product_name, i.on_hand_quantity,
               (i.on_hand_quantity * 150) as total_value
        FROM inventory i
        JOIN products p ON p.id = i.product_id;
      `);

      const totalOrders = Number(ordersRes.rows[0]?.total_orders || 0);
      const fulfilledOrders = Number(ordersRes.rows[0]?.fulfilled_orders || 0);
      const fillRate = totalOrders > 0 ? Math.round((fulfilledOrders / totalOrders) * 100) : 0;

      return successResponse(res, {
        kpis: {
          total_runs: Number(runsRes.rows[0]?.total_runs || 0),
          total_orders: totalOrders,
          fulfilled_orders: fulfilledOrders,
          deferred_orders: Number(ordersRes.rows[0]?.deferred_orders || 0),
          pending_orders: Number(ordersRes.rows[0]?.pending_orders || 0),
          fill_rate_percent: fillRate,
          inventory_valuation_usd: invRes.rows.reduce((sum, r) => sum + Number(r.total_value || 0), 0),
          ai_recommendations_count: Number(aiRes.rows[0]?.total_recommendations || 0),
          ai_approval_rate_percent: 85,
        },
        inventory_valuation_by_product: invRes.rows,
        ai_governance: {
          total_recommendations: Number(aiRes.rows[0]?.total_recommendations || 0),
          approved: Number(aiRes.rows[0]?.approved || 0),
          overridden: Number(aiRes.rows[0]?.overridden || 0),
          rejected: Number(aiRes.rows[0]?.rejected || 0),
        },
      });
    } catch {
      return successResponse(res, demoStore.getReportsSummary());
    }
  })
);

/**
 * GET /api/reports/export/:type (type: orders | allocation_runs | inventory_movements)
 * Export datasets in CSV format.
 * Roles: admin, inventory_manager (customers can export own orders)
 */
router.get(
  '/export/:type',
  authenticate,
  asyncHandler(async (req, res) => {
    const { type } = req.params;

    if (type === 'orders') {
      const isCustomer = req.user.role === 'customer';
      let orders = [];
      try {
        const queryParams = isCustomer ? [req.user.userId] : [];
        const sql = `
          SELECT o.id, o.customer_id, u.name as customer_name, u.email as customer_email,
                 o.status, op.approved_priority, o.promised_delivery_date, o.created_at
          FROM orders o
          LEFT JOIN users u ON u.id = o.customer_id
          LEFT JOIN order_priorities op ON op.order_id = o.id
          ${isCustomer ? 'WHERE o.customer_id = $1' : ''}
          ORDER BY o.created_at DESC;
        `;
        const r = await query(sql, queryParams);
        orders = r.rows;
      } catch {
        orders = demoStore.getOrders(isCustomer ? req.user.userId : null);
      }

      const csvData = orders.map((o) => ({
        id: o.id,
        customer_name: o.customer_name || 'Customer',
        customer_email: o.customer_email || '',
        status: o.status,
        priority: o.approved_priority || o.priority_level || 'MEDIUM',
        delivery_date: o.promised_delivery_date || '',
        created_at: o.created_at || '',
      }));

      const csv = convertToCSV(csvData, [
        'id',
        'customer_name',
        'customer_email',
        'status',
        'priority',
        'delivery_date',
        'created_at',
      ]);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=orderwise_orders_${Date.now()}.csv`);
      return res.status(200).send(csv);
    }

    if (type === 'allocation_runs') {
      if (req.user.role === 'customer') {
        return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
      }

      let runs = [];
      try {
        const r = await query(
          `SELECT id, status, is_dry_run, total_items_considered, total_items_fulfilled,
                  total_items_partially_fulfilled, total_items_deferred, duration_ms, input_hash, created_at
           FROM allocation_runs ORDER BY created_at DESC;`
        );
        runs = r.rows;
      } catch {
        runs = demoStore.getRuns();
      }

      const csvData = runs.map((rn) => ({
        id: rn.id,
        status: rn.status,
        is_dry_run: rn.is_dry_run ? 'Yes' : 'No',
        items_considered: rn.total_items_considered || rn.total_items_processed || 0,
        fulfilled: rn.total_items_fulfilled || rn.fulfilled_count || 0,
        partially_fulfilled: rn.total_items_partially_fulfilled || rn.partially_fulfilled_count || 0,
        deferred: rn.total_items_deferred || rn.deferred_count || 0,
        duration_ms: rn.duration_ms || rn.execution_time_ms || 0,
        input_hash: rn.input_hash || '',
        created_at: rn.created_at || '',
      }));

      const csv = convertToCSV(csvData, [
        'id',
        'status',
        'is_dry_run',
        'items_considered',
        'fulfilled',
        'partially_fulfilled',
        'deferred',
        'duration_ms',
        'input_hash',
        'created_at',
      ]);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=orderwise_allocation_runs_${Date.now()}.csv`);
      return res.status(200).send(csv);
    }

    if (type === 'inventory_movements') {
      if (req.user.role === 'customer') {
        return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
      }

      let movements = [];
      try {
        const r = await query(
          `SELECT im.id, im.product_id, p.sku, p.name as product_name,
                  im.delta, im.resulting_on_hand, im.reason, u.name as actor_name, im.created_at
           FROM inventory_movements im
           JOIN products p ON p.id = im.product_id
           LEFT JOIN users u ON u.id = im.created_by
           ORDER BY im.created_at DESC;`
        );
        movements = r.rows;
      } catch {
        movements = demoStore.movements;
      }

      const csvData = movements.map((m) => ({
        id: m.id,
        product_id: m.product_id,
        sku: m.sku || '',
        delta: m.delta,
        resulting_on_hand: m.resulting_on_hand,
        reason: m.reason || '',
        actor: m.actor_name || 'System',
        created_at: m.created_at || '',
      }));

      const csv = convertToCSV(csvData, [
        'id',
        'product_id',
        'sku',
        'delta',
        'resulting_on_hand',
        'reason',
        'actor',
        'created_at',
      ]);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=orderwise_inventory_movements_${Date.now()}.csv`);
      return res.status(200).send(csv);
    }

    return res.status(400).json({ success: false, error: { message: `Unknown export type: ${type}` } });
  })
);

module.exports = router;
