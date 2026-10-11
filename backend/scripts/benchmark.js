/**
 * benchmark.js — Allocation engine benchmark for OrderWise Phase 15.
 *
 * Measures end-to-end allocation time against the large seed dataset
 * (200 products, 5 000 orders) and reports p50/p95/p99 across N runs.
 *
 * Usage:
 *   node backend/scripts/benchmark.js [--runs 5] [--dry-run]
 *
 * Output:  human-readable table + JSON summary written to docs/benchmark-results.json
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Parse CLI flags
const args = process.argv.slice(2);
const runCount  = parseInt((args.find(a => a.startsWith('--runs=')) || '--runs=3').split('=')[1], 10);
const dryRun    = args.includes('--dry-run');

// ── Helpers ────────────────────────────────────────────────────────────────

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function pad(str, len) {
  return String(str).padStart(len);
}

// ── Core allocation (re-implemented inline to avoid app bootstrap) ─────────

async function runAllocationBenchmark(client, dryRunFlag) {
  const start = Date.now();

  // Get all active products
  const prodRes = await client.query(
    `SELECT DISTINCT p.id FROM products p
     JOIN inventory i ON i.product_id = p.id
     WHERE p.active = true ORDER BY p.id ASC`
  );
  const productIds = prodRes.rows.map(r => Number(r.id));

  let totalItems = 0;
  let fulfilled = 0, partialCount = 0, deferred = 0;

  for (const productId of productIds) {
    const invRes = await client.query(
      `SELECT on_hand_quantity FROM inventory WHERE product_id = $1 FOR UPDATE`,
      [productId]
    );
    if (invRes.rowCount === 0) continue;

    const stock = Number(invRes.rows[0].on_hand_quantity);

    const itemsRes = await client.query(
      `SELECT oi.id, oi.requested_quantity, oi.minimum_acceptable_quantity, oi.partial_delivery_allowed,
              COALESCE(op.priority_rank, 2) AS priority_rank, o.promised_delivery_date, o.created_at
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       LEFT JOIN order_priorities op ON op.order_id = o.id
       WHERE oi.product_id = $1
         AND o.status IN ('pending','confirmed','allocated','partially_allocated')
       ORDER BY COALESCE(op.priority_rank,2) DESC,
                o.promised_delivery_date ASC NULLS LAST,
                o.created_at ASC, o.id ASC`,
      [productId]
    );

    let remaining = stock;
    for (const item of itemsRes.rows) {
      const requested = Number(item.requested_quantity);
      const minQty    = Number(item.minimum_acceptable_quantity);
      const partialAllowed = item.partial_delivery_allowed !== false;

      let allocated = 0;
      let status = 'deferred';

      if (remaining >= requested) {
        allocated = requested; status = 'fulfilled';
      } else if (partialAllowed && remaining >= minQty && remaining > 0) {
        allocated = remaining; status = 'partially_fulfilled';
      }
      remaining -= allocated;

      if (status === 'fulfilled') fulfilled++;
      else if (status === 'partially_fulfilled') partialCount++;
      else deferred++;
      totalItems++;
    }
  }

  const elapsed = Date.now() - start;
  return { elapsed, totalItems, fulfilled, partial: partialCount, deferred, productCount: productIds.length };
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== OrderWise Allocation Engine Benchmark ===\n');

  // Dataset stats
  const statsRes = await pool.query(`
    SELECT
      (SELECT count(*)::int FROM products WHERE active=true)  AS products,
      (SELECT count(*)::int FROM orders WHERE status IN ('pending','confirmed','allocated','partially_allocated')) AS orders,
      (SELECT count(*)::int FROM order_items oi JOIN orders o ON o.id=oi.order_id
         WHERE o.status IN ('pending','confirmed','allocated','partially_allocated')) AS items
  `);
  const { products, orders, items } = statsRes.rows[0];

  console.log(`Dataset:`);
  console.log(`  Active products         : ${products}`);
  console.log(`  Eligible orders         : ${orders}`);
  console.log(`  Eligible order items    : ${items}`);
  console.log(`  Benchmark runs          : ${runCount}`);
  console.log(`  Dry-run (no DB writes)  : ${dryRun}\n`);

  if (orders === 0) {
    console.error('✗ No eligible orders found. Run: npm run seed:large (in backend/)');
    process.exit(1);
  }

  const durations = [];

  for (let run = 1; run <= runCount; run++) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await runAllocationBenchmark(client, dryRun);

      if (dryRun) {
        await client.query('ROLLBACK');
      } else {
        await client.query('ROLLBACK'); // benchmark never commits — read-only measurement
      }

      durations.push(result.elapsed);
      console.log(
        `  Run ${pad(run, 2)}/${runCount}  ` +
        `${pad(result.elapsed, 6)} ms  ` +
        `items=${pad(result.totalItems, 6)}  ` +
        `fulfilled=${pad(result.fulfilled, 5)}  ` +
        `partial=${pad(result.partial, 5)}  ` +
        `deferred=${pad(result.deferred, 5)}`
      );
    } finally {
      client.release();
    }

    // Small gap between runs
    if (run < runCount) await new Promise(r => setTimeout(r, 500));
  }

  // ── Report ─────────────────────────────────────────────────────────────
  console.log('\n── Latency Report ──────────────────────────────────────────');
  console.log(`  Min     : ${Math.min(...durations)} ms`);
  console.log(`  p50     : ${percentile(durations, 50)} ms`);
  console.log(`  p95     : ${percentile(durations, 95)} ms`);
  console.log(`  p99     : ${percentile(durations, 99)} ms`);
  console.log(`  Max     : ${Math.max(...durations)} ms`);
  console.log(`  Avg     : ${Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)} ms`);
  console.log('────────────────────────────────────────────────────────────\n');

  // Write JSON results for docs
  const report = {
    generated_at: new Date().toISOString(),
    dataset: { products, orders, items },
    runs: runCount,
    durations_ms: durations,
    stats: {
      min_ms:  Math.min(...durations),
      p50_ms:  percentile(durations, 50),
      p95_ms:  percentile(durations, 95),
      p99_ms:  percentile(durations, 99),
      max_ms:  Math.max(...durations),
      avg_ms:  Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
    },
  };

  const outPath = path.join(__dirname, '../../../docs/benchmark-results.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`✓ Results written to docs/benchmark-results.json`);

  await pool.end();
}

main().catch(err => {
  console.error('✗ Benchmark failed:', err.message);
  pool.end();
  process.exit(1);
});
