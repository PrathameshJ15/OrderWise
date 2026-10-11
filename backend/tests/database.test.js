const { query } = require('../src/config/db');
const { resetTestDatabase } = require('../src/db/reset');
const { seed } = require('../src/db/seeds/demo');

describe('Phase 2 Database Schema, Constraints & Governance Tests', () => {
  it('verifies seeded data counts and state after idempotent seeding', async () => {
    // Run seed again to ensure idempotency
    await seed();

    const usersRes = await query('SELECT count(*)::int as count FROM users');
    expect(usersRes.rows[0].count).toBe(7);

    const productsRes = await query('SELECT count(*)::int as count FROM products');
    expect(productsRes.rows[0].count).toBe(4);

    const inventoryRes = await query('SELECT count(*)::int as count FROM inventory');
    expect(inventoryRes.rows[0].count).toBe(4);

    // Verify Pressure Gauge Pro scarce inventory
    const gaugeRes = await query(
      `SELECT i.on_hand_quantity, i.reserved_quantity, i.version
       FROM inventory i
       JOIN products p ON p.id = i.product_id
       WHERE p.sku = 'GAUGE-P300'`
    );
    expect(gaugeRes.rows[0].on_hand_quantity).toBe(40);
    expect(gaugeRes.rows[0].reserved_quantity).toBe(0);
    expect(gaugeRes.rows[0].version).toBeGreaterThanOrEqual(1);

    const ordersRes = await query('SELECT count(*)::int as count FROM orders');
    expect(ordersRes.rows[0].count).toBe(5);
  });

  it('rejects duplicate SKU with UNIQUE constraint violation (23505)', async () => {
    let error;
    try {
      await query(
        `INSERT INTO products (sku, name) VALUES ('PUMP-X100', 'Duplicate Pump');`
      );
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();
    expect(error.code).toBe('23505'); // unique_violation
    expect(error.message).toMatch(/duplicate key value violates unique constraint/i);
  });

  it('rejects duplicate user email with UNIQUE constraint violation (23505)', async () => {
    let error;
    try {
      await query(
        `INSERT INTO users (name, email, password_hash, role) 
         VALUES ('Alice Duplicate', 'alice@demo.com', 'hash', 'customer');`
      );
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();
    expect(error.code).toBe('23505');
  });

  it('rejects negative stock on inventory with CHECK constraint violation (23514)', async () => {
    let error;
    try {
      await query(
        `UPDATE inventory 
         SET on_hand_quantity = -10 
         WHERE product_id = (SELECT id FROM products WHERE sku = 'GAUGE-P300');`
      );
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();
    expect(error.code).toBe('23514'); // check_violation
  });

  it('rejects reserved_quantity exceeding on_hand_quantity (23514)', async () => {
    let error;
    try {
      await query(
        `UPDATE inventory 
         SET reserved_quantity = 100, on_hand_quantity = 40 
         WHERE product_id = (SELECT id FROM products WHERE sku = 'GAUGE-P300');`
      );
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();
    expect(error.code).toBe('23514');
    expect(error.constraint).toBe('chk_reserved_lte_on_hand');
  });

  it('rejects minimum_acceptable_quantity exceeding requested_quantity (23514)', async () => {
    let error;
    const orderRes = await query('SELECT id FROM orders LIMIT 1');
    const prodRes = await query('SELECT id FROM products LIMIT 1');

    try {
      await query(
        `INSERT INTO order_items (order_id, product_id, requested_quantity, minimum_acceptable_quantity)
         VALUES ($1, $2, 20, 50);`,
        [orderRes.rows[0].id, prodRes.rows[0].id]
      );
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();
    expect(error.code).toBe('23514');
  });

  it('enforces UNIQUE (allocation_run_id, order_item_id) on allocation_results', async () => {
    // Create a dummy run
    const runRes = await query(
      `INSERT INTO allocation_runs (status) VALUES ('in_progress') RETURNING id;`
    );
    const runId = runRes.rows[0].id;
    const itemRes = await query('SELECT id FROM order_items LIMIT 1;');
    const itemId = itemRes.rows[0].id;

    // First insert succeeds
    await query(
      `INSERT INTO allocation_results 
       (allocation_run_id, order_item_id, requested_quantity, allocated_quantity, status, explanation)
       VALUES ($1, $2, 10, 10, 'fulfilled', '{"reason": "test"}'::jsonb);`,
      [runId, itemId]
    );

    // Second insert with same run_id and order_item_id MUST fail
    let error;
    try {
      await query(
        `INSERT INTO allocation_results 
         (allocation_run_id, order_item_id, requested_quantity, allocated_quantity, status, explanation)
         VALUES ($1, $2, 10, 10, 'fulfilled', '{"reason": "duplicate"}'::jsonb);`,
        [runId, itemId]
      );
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe('23505'); // unique violation
    expect(error.constraint).toBe('uq_allocation_run_order_item');

    // Clean up dummy run
    await query(`DELETE FROM allocation_runs WHERE id = $1;`, [runId]);
  });

  it('safe reset script REFUSES to run against development database orderwise_db', async () => {
    const devUrl = 'postgresql://orderwise_user:password@localhost:5432/orderwise_db';
    await expect(resetTestDatabase(devUrl)).rejects.toThrow(/refusing to reset database/i);
  });

  it(
    'safe reset script allows reset against orderwise_test',
    async () => {
      const testUrl = 'postgresql://orderwise_user:password@localhost:5432/orderwise_test';
      await expect(resetTestDatabase(testUrl)).resolves.not.toThrow();
    },
    25000
  );
});
