/**
 * verifyMockData.js — read-only verification report for the mock dataset.
 * Usage: npm run seed:mock:verify  (or: node src/db/seeds/verifyMockData.js)
 * Prints row counts, per-product inventory, and every scenario outcome.
 * Read-only: performs SELECTs only. Never prints connection details.
 */
require('dotenv').config();
const { Client } = require('pg');
const { env } = require('../../config/env');

async function main() {
  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();

  const one = async (sql, params) => (await client.query(sql, params)).rows[0];
  const rows = async (sql, params) => (await client.query(sql, params)).rows;

  console.log('=== OrderWise Mock Data Verification (read-only) ===\n');

  /* ---- Dataset counts ---- */
  const counts = await one(`
    SELECT
      (SELECT count(*) FROM users WHERE email LIKE '%@mockmail.test')::int AS mock_users,
      (SELECT count(*) FROM products WHERE sku LIKE 'OW-%')::int AS mock_products,
      (SELECT count(*) FROM inventory i JOIN products p ON p.id=i.product_id WHERE p.sku LIKE 'OW-%')::int AS mock_inventory,
      (SELECT count(*) FROM suppliers WHERE code LIKE 'SUP-%' AND code ~ '^(SUP-BHARAT|SUP-DECCAN|SUP-GUJSEAL|SUP-CHENFLW)$')::int AS mock_suppliers,
      (SELECT count(*) FROM purchase_orders WHERE po_number LIKE 'PO-2026-OW-%')::int AS mock_pos,
      (SELECT count(*) FROM orders WHERE idempotency_key LIKE 'mockdata:order:%')::int AS mock_orders,
      (SELECT count(*) FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.idempotency_key LIKE 'mockdata:order:%')::int AS mock_order_items,
      (SELECT count(*) FROM order_priorities op JOIN orders o ON o.id=op.order_id WHERE o.idempotency_key LIKE 'mockdata:order:%')::int AS mock_priorities,
      (SELECT count(*) FROM allocation_runs WHERE notes LIKE 'MOCKDATA%')::int AS mock_runs,
      (SELECT count(*) FROM allocation_results ar JOIN order_items oi ON oi.id=ar.order_item_id JOIN orders o ON o.id=oi.order_id WHERE o.idempotency_key LIKE 'mockdata:order:%')::int AS mock_alloc_results,
      (SELECT count(*) FROM ai_recommendations r JOIN orders o ON o.id=r.order_id WHERE o.idempotency_key LIKE 'mockdata:order:%')::int AS mock_ai_recs,
      (SELECT count(*) FROM priority_approvals pa JOIN orders o ON o.id=pa.order_id WHERE o.idempotency_key LIKE 'mockdata:order:%')::int AS mock_approvals,
      (SELECT count(*) FROM inventory_movements m JOIN products p ON p.id=m.product_id WHERE p.sku LIKE 'OW-%')::int AS mock_movements,
      (SELECT count(*) FROM audit_logs a JOIN users u ON u.id=a.actor_id WHERE u.email LIKE '%@mockmail.test')::int AS mock_audit,
      (SELECT count(*) FROM alerts al JOIN products p ON p.id=al.product_id WHERE p.sku LIKE 'OW-%')::int AS mock_alerts
  `);
  console.log('Counts:', JSON.stringify(counts));

  /* ---- Allocation run summaries ---- */
  const runs = await rows(`
    SELECT id, notes, total_items_considered, total_items_fulfilled,
           total_items_partially_fulfilled, total_items_deferred
    FROM allocation_runs WHERE notes LIKE 'MOCKDATA%' ORDER BY id
  `);
  console.log('\nRuns:');
  runs.forEach((r) => console.log(`  #${r.id} items=${r.total_items_considered} fulfilled=${r.total_items_fulfilled} partial=${r.total_items_partially_fulfilled} deferred=${r.total_items_deferred} — ${r.notes}`));

  /* ---- Deferred / partial detail for the latest full run ---- */
  const lastFullRun = runs.length > 0 ? runs[runs.length - 1].id : null;
  if (lastFullRun) {
    const notFulfilled = await rows(`
      SELECT p.sku, o.idempotency_key AS order_key, ar.requested_quantity AS req,
             ar.allocated_quantity AS alloc, ar.status
      FROM allocation_results ar
      JOIN order_items oi ON oi.id = ar.order_item_id
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      WHERE ar.allocation_run_id = $1 AND ar.status != 'fulfilled'
      ORDER BY p.sku, o.idempotency_key
    `, [lastFullRun]);
    console.log(`\nNon-fulfilled results in run #${lastFullRun}:`);
    notFulfilled.forEach((r) => console.log(`  ${r.sku} ${r.order_key} req=${r.req} alloc=${r.alloc} ${r.status}`));
  }

  /* ---- Inventory per mock product ---- */
  const inv = await rows(`
    SELECT p.sku, i.on_hand_quantity AS on_hand, i.reserved_quantity AS reserved
    FROM inventory i JOIN products p ON p.id = i.product_id
    WHERE p.sku LIKE 'OW-%' ORDER BY p.sku
  `);
  console.log('\nInventory (mock products):');
  inv.forEach((r) => console.log(`  ${r.sku} on_hand=${r.on_hand} reserved=${r.reserved}`));

  /* ---- Order statuses (customer portal mix) ---- */
  const statuses = await rows(`
    SELECT idempotency_key AS key, status FROM orders
    WHERE idempotency_key LIKE 'mockdata:order:%' ORDER BY idempotency_key
  `);
  const byStatus = {};
  statuses.forEach((s) => { byStatus[s.status] = (byStatus[s.status] || 0) + 1; });
  console.log('\nOrder statuses:', JSON.stringify(byStatus));

  /* ---- AI recommendation status mix ---- */
  const recMix = await rows(`
    SELECT r.status, count(*)::int AS n FROM ai_recommendations r
    JOIN orders o ON o.id = r.order_id
    WHERE o.idempotency_key LIKE 'mockdata:order:%' GROUP BY r.status ORDER BY r.status
  `);
  console.log('AI recommendation statuses:', JSON.stringify(recMix.map((r) => `${r.status}=${r.n}`).join(', ')));

  /* ---- Deferred detail for the latest full (run-1 style) run ---- */
  const fullRuns = await rows(
    `SELECT id FROM allocation_runs WHERE notes LIKE 'MOCKDATA run 1%' ORDER BY id DESC LIMIT 1`
  );
  if (fullRuns.length > 0) {
    const run1Id = fullRuns[0].id;
    const notFulfilled = await rows(`
      SELECT p.sku, o.idempotency_key AS order_key, ar.requested_quantity AS req,
             ar.allocated_quantity AS alloc, ar.status
      FROM allocation_results ar
      JOIN order_items oi ON oi.id = ar.order_item_id
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      WHERE ar.allocation_run_id = $1 AND ar.status <> 'fulfilled'
      ORDER BY p.sku, o.idempotency_key
    `, [run1Id]);
    console.log(`\nNon-fulfilled results in baseline run #${run1Id}:`);
    notFulfilled.forEach((r) => console.log(`  ${r.sku} ${r.order_key} req=${r.req} alloc=${r.alloc} ${r.status}`));

    /* ---- Oversubscribed products (eligible demand > stock) ---- */
    const over = await rows(`
      SELECT p.sku, SUM(oi.requested_quantity)::int AS demand, count(*)::int AS items
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE p.sku LIKE 'OW-%'
        AND o.status IN ('pending', 'confirmed', 'allocated', 'partially_allocated')
      GROUP BY p.sku
      HAVING SUM(oi.requested_quantity) > (SELECT on_hand_quantity FROM inventory i WHERE i.product_id = p.id)
      ORDER BY p.sku
    `);
    console.log('\nOversubscribed products (eligible demand > stock):');
    over.forEach((r) => console.log(`  ${r.sku} demand=${r.demand} items=${r.items}`));

    /* ---- Alerts by type (all alerts referencing mock products) ---- */
    const alertMix = await rows(`
      SELECT al.alert_type, al.severity, count(*)::int AS n
      FROM alerts al JOIN products p ON p.id = al.product_id
      WHERE p.sku LIKE 'OW-%'
      GROUP BY al.alert_type, al.severity ORDER BY al.alert_type
    `);
    console.log('\nAlerts referencing mock products:');
    alertMix.forEach((r) => console.log(`  ${r.alert_type}/${r.severity} x${r.n}`));
  }

  await client.end();
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[VERIFY] failed:', err.message);
    process.exit(1);
  });
}

module.exports = { main };
