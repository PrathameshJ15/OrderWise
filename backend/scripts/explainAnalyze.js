/**
 * explainAnalyze.js — Runs EXPLAIN (ANALYZE, BUFFERS) on the hot query paths
 * and prints query plans to stdout.
 *
 * Usage:
 *   node backend/scripts/explainAnalyze.js
 *
 * Purpose: confirm that indexes added in migration 009 are being used.
 * Look for "Index Scan" or "Index Only Scan" in the plans — NOT "Seq Scan"
 * on large tables.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const QUERIES = [
  {
    label: 'Allocation engine — eligible order items per product (product_id=1)',
    sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
      SELECT oi.id, oi.order_id, oi.product_id,
             oi.requested_quantity, oi.minimum_acceptable_quantity, oi.partial_delivery_allowed,
             COALESCE(op.priority_rank, 2) AS priority_rank,
             o.promised_delivery_date, o.created_at
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN order_priorities op ON op.order_id = o.id
      WHERE oi.product_id = 1
        AND o.status IN ('pending', 'confirmed', 'allocated', 'partially_allocated')
      ORDER BY COALESCE(op.priority_rank, 2) DESC,
               o.promised_delivery_date ASC NULLS LAST,
               o.created_at ASC, o.id ASC`,
    params: [],
  },
  {
    label: 'Customer portal — my orders list (customer_id=2)',
    sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
      SELECT o.id, o.status, o.created_at, op.approved_priority
      FROM orders o
      LEFT JOIN order_priorities op ON op.order_id = o.id
      WHERE o.customer_id = 2
      ORDER BY o.created_at DESC
      LIMIT 50 OFFSET 0`,
    params: [],
  },
  {
    label: 'LATERAL allocation result lookup for order items',
    sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
      SELECT oi.id, oi.order_id, ar.status, ar.allocated_quantity
      FROM order_items oi
      LEFT JOIN LATERAL (
        SELECT ar_sub.status, ar_sub.allocated_quantity
        FROM allocation_results ar_sub
        WHERE ar_sub.order_item_id = oi.id
        ORDER BY ar_sub.created_at DESC
        LIMIT 1
      ) ar ON true
      WHERE oi.order_id = 1`,
    params: [],
  },
  {
    label: 'Inventory lock — per product',
    sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
      SELECT product_id, on_hand_quantity, reserved_quantity
      FROM inventory
      WHERE product_id = 1`,
    params: [],
  },
  {
    label: 'Admin orders list — status filter',
    sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
      SELECT o.id, o.status, o.created_at, u.name
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      LEFT JOIN order_priorities op ON op.order_id = o.id
      WHERE o.status = 'pending'
      ORDER BY o.created_at DESC
      LIMIT 50 OFFSET 0`,
    params: [],
  },
];

async function main() {
  console.log('=== OrderWise EXPLAIN ANALYZE — Hot Query Plans ===\n');
  const client = await pool.connect();

  try {
    for (const q of QUERIES) {
      console.log('────────────────────────────────────────────────────────────');
      console.log(`Query: ${q.label}`);
      console.log('────────────────────────────────────────────────────────────');
      try {
        const res = await client.query(q.sql, q.params);
        res.rows.forEach(r => console.log(r['QUERY PLAN']));
      } catch (err) {
        console.error(`  ✗ Error: ${err.message}`);
      }
      console.log('');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  pool.end();
  process.exit(1);
});
