/**
 * largeSeed.js — Large-scale benchmark dataset for OrderWise performance testing.
 *
 * Seeds:
 *  - 200 products (with inventory rows)
 *  - 4 customers (reuses demo users or creates if not present)
 *  - 5 000 orders, ~1-3 items each → ~8 000-10 000 order_items
 *  - Order priorities for every order (MEDIUM/HIGH/CRITICAL mix)
 *
 * Usage:
 *   node backend/src/db/seeds/largeSeed.js
 *
 * Safe to run multiple times — it truncates large-seed data only
 * (orders/products created by this script) via a prefix marker.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PRODUCT_COUNT = 200;
const ORDER_COUNT   = 5000;
const MAX_ITEMS_PER_ORDER = 3;
const SKU_PREFIX    = 'BENCH-';

const PRIORITIES = ['LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'HIGH', 'CRITICAL'];
const PRIORITY_RANKS = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isoDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

async function run() {
  const client = await pool.connect();
  try {
    console.log('=== OrderWise Large Seed ===\n');

    // ── 1. Ensure demo users exist ────────────────────────────────────────
    const usersRes = await client.query(
      `SELECT id, role FROM users WHERE email IN ('alice@demo.com','bob@demo.com','charlie@demo.com') ORDER BY id`
    );
    let customerIds = usersRes.rows.filter(u => u.role === 'customer').map(u => Number(u.id));
    if (customerIds.length === 0) {
      console.warn('⚠  No customer users found. Run demo.js seed first.');
      return;
    }
    console.log(`✓ Using ${customerIds.length} customers: ${customerIds.join(', ')}`);

    // Get admin id for priorities
    const adminRes = await client.query(`SELECT id FROM users WHERE role='admin' LIMIT 1`);
    const adminId = adminRes.rows[0]?.id || customerIds[0];

    // ── 2. Clean up previous large-seed data ─────────────────────────────
    console.log('\n→ Cleaning previous benchmark data…');
    await client.query('BEGIN');

    // Delete allocation results for large-seed orders
    await client.query(`
      DELETE FROM allocation_results ar
      USING order_items oi, orders o, products p
      WHERE ar.order_item_id = oi.id
        AND oi.order_id = o.id
        AND oi.product_id = p.id
        AND p.sku LIKE $1
    `, [SKU_PREFIX + '%']);

    await client.query(`
      DELETE FROM order_items oi
      USING orders o, products p
      WHERE oi.order_id = o.id AND oi.product_id = p.id AND p.sku LIKE $1
    `, [SKU_PREFIX + '%']);

    await client.query(`
      DELETE FROM order_priorities op
      USING orders o, order_items oi, products p
      WHERE op.order_id = o.id
        AND oi.order_id = o.id
        AND oi.product_id = p.id
        AND p.sku LIKE $1
    `, [SKU_PREFIX + '%']);

    // Orders that reference bench products
    await client.query(`
      DELETE FROM orders o
      WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id)
        AND o.business_notes = 'bench'
    `);

    // Inventory + products
    await client.query(`DELETE FROM inventory WHERE product_id IN (SELECT id FROM products WHERE sku LIKE $1)`, [SKU_PREFIX + '%']);
    await client.query(`DELETE FROM products WHERE sku LIKE $1`, [SKU_PREFIX + '%']);

    await client.query('COMMIT');
    console.log('✓ Cleanup done.');

    // ── 3. Insert 200 products + inventory ───────────────────────────────
    console.log(`\n→ Inserting ${PRODUCT_COUNT} products…`);
    await client.query('BEGIN');

    const productIds = [];
    for (let i = 1; i <= PRODUCT_COUNT; i++) {
      const sku  = `${SKU_PREFIX}P${String(i).padStart(4, '0')}`;
      const name = `Bench Product ${i}`;
      const stock = rnd(0, 500);   // mix of scarce and ample stock
      const safety = Math.floor(stock * 0.1);
      const reorder = Math.floor(stock * 0.2);

      const pRes = await client.query(
        `INSERT INTO products (sku, name, description, unit, active)
         VALUES ($1, $2, $3, 'units', true)
         ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [sku, name, `Benchmark product ${i} for load testing`]
      );
      const productId = Number(pRes.rows[0].id);
      productIds.push(productId);

      await client.query(
        `INSERT INTO inventory (product_id, on_hand_quantity, reserved_quantity, safety_stock, reorder_point)
         VALUES ($1, $2, 0, $3, $4)
         ON CONFLICT (product_id) DO UPDATE
           SET on_hand_quantity = EXCLUDED.on_hand_quantity,
               safety_stock = EXCLUDED.safety_stock,
               reorder_point = EXCLUDED.reorder_point`,
        [productId, stock, safety, reorder]
      );
    }

    await client.query('COMMIT');
    console.log(`✓ Inserted ${productIds.length} products.`);

    // ── 4. Insert 5 000 orders ───────────────────────────────────────────
    console.log(`\n→ Inserting ${ORDER_COUNT} orders (batched)…`);

    const BATCH = 200;
    let totalItems = 0;

    for (let batch = 0; batch < ORDER_COUNT; batch += BATCH) {
      await client.query('BEGIN');
      const batchEnd = Math.min(batch + BATCH, ORDER_COUNT);

      for (let i = batch; i < batchEnd; i++) {
        const customerId = pick(customerIds);
        const deliveryDays = rnd(-5, 60);  // some overdue, some future
        const deliveryDate = isoDate(deliveryDays);
        const priority = pick(PRIORITIES);
        const rank = PRIORITY_RANKS[priority];

        const orderRes = await client.query(
          `INSERT INTO orders (customer_id, status, promised_delivery_date, business_notes)
           VALUES ($1, 'pending', $2, 'bench')
           RETURNING id`,
          [customerId, deliveryDate]
        );
        const orderId = Number(orderRes.rows[0].id);

        // 1-3 items per order, using random products
        const itemCount = rnd(1, MAX_ITEMS_PER_ORDER);
        const usedProducts = new Set();

        for (let j = 0; j < itemCount; j++) {
          let productId;
          let attempts = 0;
          do {
            productId = pick(productIds);
            attempts++;
          } while (usedProducts.has(productId) && attempts < 10);
          usedProducts.add(productId);

          const requested = rnd(1, 50);
          const partialAllowed = Math.random() > 0.3;
          const minQty = partialAllowed ? rnd(1, requested) : requested;

          await client.query(
            `INSERT INTO order_items (order_id, product_id, requested_quantity, minimum_acceptable_quantity, partial_delivery_allowed)
             VALUES ($1, $2, $3, $4, $5)`,
            [orderId, productId, requested, minQty, partialAllowed]
          );
          totalItems++;
        }

        // Priority record
        await client.query(
          `INSERT INTO order_priorities (order_id, approved_priority, priority_rank, notes, approved_by)
           VALUES ($1, $2, $3, 'Benchmark seed', $4)
           ON CONFLICT (order_id) DO NOTHING`,
          [orderId, priority, rank, adminId]
        );
      }

      await client.query('COMMIT');
      process.stdout.write(`  ${Math.min(batch + BATCH, ORDER_COUNT)}/${ORDER_COUNT} orders\r`);
    }

    console.log(`\n✓ Inserted ${ORDER_COUNT} orders, ~${totalItems} order items.`);

    // ── 5. Summary ────────────────────────────────────────────────────────
    const countRes = await client.query(`
      SELECT
        (SELECT count(*) FROM products WHERE sku LIKE $1)   AS products,
        (SELECT count(*) FROM orders WHERE business_notes='bench') AS orders,
        (SELECT count(*) FROM order_items oi
           JOIN orders o ON o.id = oi.order_id
           WHERE o.business_notes='bench')                  AS items
    `, [SKU_PREFIX + '%']);

    const { products, orders, items } = countRes.rows[0];
    console.log('\n=== Seed Complete ===');
    console.log(`  Products : ${products}`);
    console.log(`  Orders   : ${orders}`);
    console.log(`  Items    : ${items}`);
    console.log('\nRun the benchmark:');
    console.log('  node backend/scripts/benchmark.js\n');

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('\n✗ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
