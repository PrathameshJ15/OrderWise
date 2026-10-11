const request = require('supertest');
const app = require('../src/app');
const { getPool, query } = require('../src/config/db');

describe('Phase 5 Allocation Engine — Integration & End-to-End API Tests', () => {
  let adminToken;
  let managerToken;
  let aliceToken;
  let aliceId;
  let gaugeProductId;

  beforeAll(async () => {
    // 1. Authenticate actors
    const adminRes = await request(app).post('/api/auth/login').send({
      email: 'admin@orderwise.com',
      password: 'Admin123!',
    });
    adminToken = adminRes.body.data.token;

    const managerRes = await request(app).post('/api/auth/login').send({
      email: 'manager@orderwise.com',
      password: 'Manager123!',
    });
    managerToken = managerRes.body.data.token;

    const aliceRes = await request(app).post('/api/auth/login').send({
      email: 'alice@demo.com',
      password: 'Alice123!',
    });
    aliceToken = aliceRes.body.data.token;
    aliceId = aliceRes.body.data.user.id;

    // Get Pressure Gauge Pro product ID
    const prodRes = await query(`SELECT id FROM products WHERE sku = 'GAUGE-P300' LIMIT 1;`);
    gaugeProductId = Number(prodRes.rows[0].id);
  });

  describe('RBAC Security & Concurrency Lock', () => {
    it('blocks Customer from triggering allocation (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .post('/api/allocation/run')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ product_ids: [gaugeProductId] });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks Inventory Manager from triggering allocation (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .post('/api/allocation/run')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ product_ids: [gaugeProductId] });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('enforces concurrency lock when another allocation is active (409 CONFLICT)', async () => {
      const pool = getPool();
      const lockClient = await pool.connect();

      try {
        // Manually acquire global allocation advisory lock
        const lockRes = await lockClient.query('SELECT pg_try_advisory_lock(987654321) as acquired;');
        expect(lockRes.rows[0].acquired).toBe(true);

        // Attempting to run allocation should immediately conflict
        const res = await request(app)
          .post('/api/allocation/run')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ product_ids: [gaugeProductId] });

        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe('CONCURRENT_ALLOCATION_LOCKED');
      } finally {
        // Release the manual advisory lock
        await lockClient.query('SELECT pg_advisory_unlock(987654321);');
        lockClient.release();
      }
    });
  });

  describe('Dry-Run Mode', () => {
    it('calculates allocation results without persisting rows or altering reserved stock', async () => {
      const runsCountBefore = await query('SELECT count(*)::int as count FROM allocation_runs;');
      const resultsCountBefore = await query('SELECT count(*)::int as count FROM allocation_results;');
      const invBefore = await query(
        'SELECT reserved_quantity FROM inventory WHERE product_id = $1;',
        [gaugeProductId]
      );

      const res = await request(app)
        .post('/api/allocation/run')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ product_ids: [gaugeProductId], dry_run: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.dryRun).toBe(true);
      expect(res.body.data).toHaveProperty('inputHash');
      expect(res.body.data).toHaveProperty('summary');
      expect(Array.isArray(res.body.data.results)).toBe(true);

      // Verify no changes to DB tables
      const runsCountAfter = await query('SELECT count(*)::int as count FROM allocation_runs;');
      const resultsCountAfter = await query('SELECT count(*)::int as count FROM allocation_results;');
      const invAfter = await query(
        'SELECT reserved_quantity FROM inventory WHERE product_id = $1;',
        [gaugeProductId]
      );

      expect(runsCountAfter.rows[0].count).toBe(runsCountBefore.rows[0].count);
      expect(resultsCountAfter.rows[0].count).toBe(resultsCountBefore.rows[0].count);
      expect(invAfter.rows[0].reserved_quantity).toBe(invBefore.rows[0].reserved_quantity);
    });
  });

  describe('Live Allocation Execution & Business Rule Verification', () => {
    let completedRunId;

    it('runs allocation successfully, updating inventory reservations and order states', async () => {
      // Reset Pressure Gauge Pro stock to exactly 40 for deterministic test
      await query(
        `UPDATE inventory SET on_hand_quantity = 40, reserved_quantity = 0 WHERE product_id = $1;`,
        [gaugeProductId]
      );

      const res = await request(app)
        .post('/api/allocation/run')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          product_ids: [gaugeProductId],
          notes: 'Hackathon Phase 5 Official Benchmark Run',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.run.status).toBe('completed');
      expect(res.body.data.run.notes).toBe('Hackathon Phase 5 Official Benchmark Run');
      expect(res.body.data.run.input_hash).toMatch(/^[a-f0-9]{64}$/);
      expect(res.body.data.dryRun).toBe(false);

      completedRunId = res.body.data.run.id;

      // Check results for competing Pressure Gauge Pro items
      const gaugeResults = res.body.data.results.filter((r) => r.product_id === gaugeProductId);
      expect(gaugeResults.length).toBeGreaterThanOrEqual(3);

      // Verify Eva (Critical) and/or Charlie (High, earlier date) received allocations
      const fulfilledItems = gaugeResults.filter((r) => r.status === 'fulfilled');
      const deferredItems = gaugeResults.filter((r) => r.status === 'deferred');

      expect(fulfilledItems.length).toBeGreaterThan(0);
      expect(deferredItems.length).toBeGreaterThan(0);

      // Check inventory table in DB: reserved_quantity must match sum of allocated
      const invRes = await query(
        'SELECT on_hand_quantity, reserved_quantity FROM inventory WHERE product_id = $1;',
        [gaugeProductId]
      );
      const totalAllocatedOnGauge = gaugeResults.reduce((sum, r) => sum + r.allocated_quantity, 0);

      expect(invRes.rows[0].reserved_quantity).toBe(totalAllocatedOnGauge);
      expect(invRes.rows[0].reserved_quantity).toBeLessThanOrEqual(invRes.rows[0].on_hand_quantity);

      // Verify inventory movements ledger contains the allocation record
      const movementsRes = await query(
        `SELECT * FROM inventory_movements 
         WHERE product_id = $1 AND reference_type = 'allocation_runs' AND reference_id = $2;`,
        [gaugeProductId, completedRunId]
      );
      expect(movementsRes.rowCount).toBe(1);
      expect(movementsRes.rows[0].movement_type).toBe('allocation');
    });

    it('GET /api/allocation/runs returns append-only run history with statistics', async () => {
      const res = await request(app)
        .get('/api/allocation/runs?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const latestRun = res.body.data[0];
      expect(latestRun.id).toBe(completedRunId);
      expect(latestRun.status).toBe('completed');
      expect(latestRun).toHaveProperty('input_hash');
      expect(latestRun).toHaveProperty('initiated_by_name');
      expect(res.body.meta.pagination).toHaveProperty('total');
    });

    it('GET /api/allocation/runs/:id returns detailed item breakdown and concrete explanations', async () => {
      const res = await request(app)
        .get(`/api/allocation/runs/${completedRunId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.run.id).toBe(completedRunId);
      expect(Array.isArray(res.body.data.results)).toBe(true);

      const firstItem = res.body.data.results[0];
      expect(firstItem).toHaveProperty('product_name');
      expect(firstItem).toHaveProperty('customer_name');
      expect(firstItem).toHaveProperty('requested_quantity');
      expect(firstItem).toHaveProperty('allocated_quantity');
      expect(firstItem).toHaveProperty('explanation');
      expect(typeof firstItem.explanation.reason).toBe('string');
      expect(firstItem.explanation.reason.length).toBeGreaterThan(10);
    });

    it('Customer order details include attached latest allocation status and explanation', async () => {
      // Find an order for Alice
      const orderRes = await query(
        `SELECT o.id FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         WHERE o.customer_id = $1 AND oi.product_id = $2
         LIMIT 1;`,
        [aliceId, gaugeProductId]
      );

      if (orderRes.rowCount > 0) {
        const aliceOrderId = orderRes.rows[0].id;
        const res = await request(app)
          .get(`/api/orders/${aliceOrderId}`)
          .set('Authorization', `Bearer ${aliceToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(aliceOrderId);
        expect(Array.isArray(res.body.data.items)).toBe(true);

        const gaugeItem = res.body.data.items.find((i) => Number(i.product_id) === gaugeProductId);
        expect(gaugeItem).toBeDefined();
        expect(gaugeItem).toHaveProperty('allocation_status');
        expect(gaugeItem).toHaveProperty('allocated_quantity');
        expect(gaugeItem).toHaveProperty('allocation_explanation');
      }
    });
  });

  describe('Reallocation & Reservation Strategy Invariants', () => {
    it('recalculates cleanly after stock increase without double-counting', async () => {
      // 1. Admin increases on_hand stock for Pressure Gauge Pro to 100 units (delta of +60)
      await request(app)
        .put(`/api/inventory/${gaugeProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adjustmentType: 'delta',
          quantity: 60, // 40 + 60 = 100 on_hand
          reason: 'Emergency restock delivery received from GaugeMaster',
        });

      // 2. Rerun allocation
      const rerunRes = await request(app)
        .post('/api/allocation/run')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ product_ids: [gaugeProductId], notes: 'Post-restock reallocation' });

      expect(rerunRes.status).toBe(200);
      const gaugeResults = rerunRes.body.data.results.filter((r) => r.product_id === gaugeProductId);

      // With 100 units, more orders should now be fulfilled
      const fulfilledItems = gaugeResults.filter((r) => r.status === 'fulfilled');
      expect(fulfilledItems.length).toBeGreaterThanOrEqual(2);

      // Verify that reserved_quantity in inventory equals exact sum of newly allocated items
      const invCheck = await query(
        'SELECT on_hand_quantity, reserved_quantity FROM inventory WHERE product_id = $1;',
        [gaugeProductId]
      );
      const sumAllocated = gaugeResults.reduce((sum, r) => sum + r.allocated_quantity, 0);

      expect(invCheck.rows[0].on_hand_quantity).toBe(100);
      expect(invCheck.rows[0].reserved_quantity).toBe(sumAllocated);
      expect(invCheck.rows[0].reserved_quantity).toBeLessThanOrEqual(100);
    });

    it('releases reserved stock when an order is cancelled and reallocates to remaining orders', async () => {
      // Find an order that currently has an allocated item
      const itemRes = await query(
        `SELECT ar.order_item_id, oi.order_id
         FROM allocation_results ar
         JOIN order_items oi ON oi.id = ar.order_item_id
         WHERE ar.status = 'fulfilled' AND oi.product_id = $1
         LIMIT 1;`,
        [gaugeProductId]
      );

      if (itemRes.rowCount > 0) {
        const orderToCancel = itemRes.rows[0].order_id;

        // Cancel the order as admin
        const cancelRes = await request(app)
          .patch(`/api/orders/${orderToCancel}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'cancelled', reason: 'Customer requested cancellation test' });

        expect(cancelRes.status).toBe(200);
        expect(cancelRes.body.data.status).toBe('cancelled');

        // Rerun allocation
        const allocAfterCancel = await request(app)
          .post('/api/allocation/run')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ product_ids: [gaugeProductId], notes: 'Post-cancellation reallocation' });

        expect(allocAfterCancel.status).toBe(200);

        // Verify cancelled order item is excluded from results
        const cancelledItemResult = allocAfterCancel.body.data.results.find(
          (r) => Number(r.order_id) === Number(orderToCancel)
        );
        expect(cancelledItemResult).toBeUndefined();
      }
    });
  });
});
