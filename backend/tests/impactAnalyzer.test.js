const request = require('supertest');
const app = require('../src/app');
const { query, pool } = require('../src/config/db');
const { seed } = require('../src/db/seeds/demo');
const {
  CLASSIFICATIONS,
  classifyChange,
  compareRuns,
} = require('../src/services/impactAnalyzer');

describe('Phase 9: Allocation Impact Analyzer Acceptance Gate Tests', () => {
  let adminToken;
  let customerToken;
  let pressureGaugeId;

  beforeAll(async () => {
    // Seed fresh demo dataset
    await seed();

    // Login admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@orderwise.com', password: 'Admin123!' });
    adminToken = adminLogin.body.data.token;

    // Login customer
    const customerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@demo.com', password: 'Alice123!' });
    customerToken = customerLogin.body.data.token;

    // Fetch Pressure Gauge Pro product ID
    const prodRes = await query("SELECT id FROM products WHERE sku = 'GAUGE-P300'");
    pressureGaugeId = prodRes.rows[0].id;
  });

  describe('1. Classification Rules Pure Logic (Documented & Tested)', () => {
    it('classifies identical quantities and status as UNCHANGED', () => {
      const prev = { allocated_quantity: 20, status: 'fulfilled' };
      const curr = { allocated_quantity: 20, status: 'fulfilled' };
      const res = classifyChange(prev, curr);
      expect(res.classification).toBe(CLASSIFICATIONS.UNCHANGED);
      expect(res.changed).toBe(false);
      expect(res.change_direction).toBe('unchanged');
    });

    it('classifies transition to fulfilled as NEWLY_FULFILLED', () => {
      const prev = { allocated_quantity: 0, status: 'deferred' };
      const curr = { allocated_quantity: 25, status: 'fulfilled' };
      const res = classifyChange(prev, curr);
      expect(res.classification).toBe(CLASSIFICATIONS.NEWLY_FULFILLED);
      expect(res.changed).toBe(true);
      expect(res.change_direction).toBe('improved');
    });

    it('classifies transition from partial/fulfilled to deferred as NEWLY_DEFERRED', () => {
      const prev = { allocated_quantity: 15, status: 'partially_fulfilled' };
      const curr = { allocated_quantity: 0, status: 'deferred' };
      const res = classifyChange(prev, curr);
      expect(res.classification).toBe(CLASSIFICATIONS.NEWLY_DEFERRED);
      expect(res.changed).toBe(true);
      expect(res.change_direction).toBe('degraded');
    });

    it('classifies quantity gain without changing to fulfilled as IMPROVED', () => {
      const prev = { allocated_quantity: 10, status: 'partially_fulfilled' };
      const curr = { allocated_quantity: 18, status: 'partially_fulfilled' };
      const res = classifyChange(prev, curr);
      expect(res.classification).toBe(CLASSIFICATIONS.IMPROVED);
      expect(res.changed).toBe(true);
      expect(res.change_direction).toBe('improved');
    });

    it('classifies quantity drop without becoming deferred as DEGRADED', () => {
      const prev = { allocated_quantity: 20, status: 'partially_fulfilled' };
      const curr = { allocated_quantity: 12, status: 'partially_fulfilled' };
      const res = classifyChange(prev, curr);
      expect(res.classification).toBe(CLASSIFICATIONS.DEGRADED);
      expect(res.changed).toBe(true);
      expect(res.change_direction).toBe('degraded');
    });

    it('classifies item only in target as NEW_ITEM', () => {
      const curr = { allocated_quantity: 10, status: 'fulfilled' };
      const res = classifyChange(null, curr);
      expect(res.classification).toBe(CLASSIFICATIONS.NEW_ITEM);
      expect(res.changed).toBe(true);
      expect(res.change_direction).toBe('new');
    });

    it('classifies item only in base as REMOVED_ITEM', () => {
      const prev = { allocated_quantity: 15, status: 'fulfilled' };
      const res = classifyChange(prev, null);
      expect(res.classification).toBe(CLASSIFICATIONS.REMOVED_ITEM);
      expect(res.changed).toBe(true);
      expect(res.change_direction).toBe('removed');
    });
  });

  describe('2. End-to-End Acceptance Scenarios across Allocation Runs', () => {
    let run1Id;
    let run2Id;
    let run3Id;
    let run4Id;
    let run5Id;
    let run6Id;

    it('creates baseline allocation run 1', async () => {
      // Run allocation on all products
      const res = await request(app)
        .post('/api/allocation/run')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ product_ids: [pressureGaugeId], notes: 'Baseline Run 1' });

      expect(res.status).toBe(200);
      run1Id = res.body.data.run.id;
      expect(run1Id).toBeDefined();
    });

    it('Scenario: Inventory Up -> triggers NEWLY_FULFILLED and cause attribution STOCK_INCREASED', async () => {
      // 1. Record inventory adjustment: increase Pressure Gauge stock by 50 units (40 -> 90)
      await query('UPDATE inventory SET on_hand_quantity = 90, reserved_quantity = 0 WHERE product_id = $1', [
        pressureGaugeId,
      ]);
      await query(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, before_state, after_state)
         VALUES (1, 'INVENTORY_ADJUSTED', 'inventory', $1, '{"on_hand_quantity": 40}', '{"on_hand_quantity": 90}')`,
        [pressureGaugeId]
      );
      await query(
        `INSERT INTO inventory_movements (product_id, movement_type, quantity, previous_on_hand, new_on_hand)
         VALUES ($1, 'receipt', 50, 40, 90)`,
        [pressureGaugeId]
      );

      // 2. Run allocation run 2
      const resRun2 = await request(app)
        .post('/api/allocation/run')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ product_ids: [pressureGaugeId], notes: 'Run 2: After Stock Increase' });

      expect(resRun2.status).toBe(200);
      run2Id = resRun2.body.data.run.id;

      // 3. Compare run 1 and run 2 via GET /api/impact/compare
      const compareRes = await request(app)
        .get(`/api/impact/compare?baseRun=${run1Id}&targetRun=${run2Id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(compareRes.status).toBe(200);
      const data = compareRes.body.data;
      expect(data.summary.improvements).toBeGreaterThanOrEqual(1);

      // Check item-level diff
      const improvedItem = data.changes.find(
        (c) => c.classification === 'NEWLY_FULFILLED' || c.classification === 'IMPROVED'
      );
      expect(improvedItem).toBeDefined();
      expect(improvedItem.delta).toBeGreaterThan(0);
      expect(improvedItem.cause_attribution.cause_type).toBe('STOCK_INCREASED');
      expect(improvedItem.cause_attribution.description).toContain('Stock for Pressure Gauge Pro increased');
    });

    it('Scenario: Inventory Down -> triggers DEGRADED or NEWLY_DEFERRED and cause attribution STOCK_DECREASED', async () => {
      // 1. Decrease inventory from 90 to 20 units
      await query('UPDATE inventory SET on_hand_quantity = 20, reserved_quantity = 0 WHERE product_id = $1', [
        pressureGaugeId,
      ]);
      await query(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, before_state, after_state)
         VALUES (1, 'INVENTORY_ADJUSTED', 'inventory', $1, '{"on_hand_quantity": 90}', '{"on_hand_quantity": 20}')`,
        [pressureGaugeId]
      );
      await query(
        `INSERT INTO inventory_movements (product_id, movement_type, quantity, previous_on_hand, new_on_hand)
         VALUES ($1, 'adjustment', -70, 90, 20)`,
        [pressureGaugeId]
      );

      // 2. Run allocation run 3
      const resRun3 = await request(app)
        .post('/api/allocation/run')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ product_ids: [pressureGaugeId], notes: 'Run 3: After Stock Drop' });

      expect(resRun3.status).toBe(200);
      run3Id = resRun3.body.data.run.id;

      // 3. Compare run 2 and run 3
      const compareRes = await request(app)
        .get(`/api/impact/compare?baseRun=${run2Id}&targetRun=${run3Id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(compareRes.status).toBe(200);
      const data = compareRes.body.data;
      expect(data.summary.degradations).toBeGreaterThanOrEqual(1);

      const degradedItem = data.changes.find(
        (c) => c.classification === 'NEWLY_DEFERRED' || c.classification === 'DEGRADED'
      );
      expect(degradedItem).toBeDefined();
      expect(degradedItem.delta).toBeLessThan(0);
      expect(degradedItem.cause_attribution.cause_type).toBe('STOCK_DECREASED');
    });

    it('Scenario: Priority Change -> attributes PRIORITY_CHANGED to audit log / approval', async () => {
      // Set stock to 35 so competing priority matters
      await query('UPDATE inventory SET on_hand_quantity = 35, reserved_quantity = 0 WHERE product_id = $1', [
        pressureGaugeId,
      ]);

      // Find Bob's order
      const bobOrderRes = await query(
        `SELECT o.id FROM orders o
         JOIN users u ON u.id = o.customer_id
         WHERE u.email = 'bob@demo.com' LIMIT 1`
      );
      const bobOrderId = bobOrderRes.rows[0].id;

      // Elevate Bob's priority to CRITICAL via approval
      await request(app)
        .post('/api/priorities/approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          order_id: bobOrderId,
          decision: 'overridden',
          final_priority: 'CRITICAL',
          override_reason: 'VIP emergency production line escalation',
        });

      // Run allocation run 4
      const resRun4 = await request(app)
        .post('/api/allocation/run')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ product_ids: [pressureGaugeId], notes: 'Run 4: Bob Priority Raised to CRITICAL' });

      expect(resRun4.status).toBe(200);
      run4Id = resRun4.body.data.run.id;

      // Compare run 3 and run 4
      const compareRes = await request(app)
        .get(`/api/impact/compare?baseRun=${run3Id}&targetRun=${run4Id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(compareRes.status).toBe(200);
      const data = compareRes.body.data;

      // Bob's order item should show improved allocation with PRIORITY_CHANGED attribution
      const bobChange = data.changes.find((c) => parseInt(c.order_id, 10) === parseInt(bobOrderId, 10));
      expect(bobChange).toBeDefined();
      expect(bobChange.changed).toBe(true);
      expect(bobChange.cause_attribution.cause_type).toBe('PRIORITY_CHANGED');
      expect(bobChange.cause_attribution.description).toContain('CRITICAL');
    });

    it('Scenario: New Order -> classifies new item as NEW_ITEM', async () => {
      // Create a brand new order for Charlie
      const charlieUser = await query("SELECT id FROM users WHERE email = 'charlie@demo.com'");
      const charlieId = charlieUser.rows[0].id;

      const newOrderRes = await query(
        `INSERT INTO orders (customer_id, status, promised_delivery_date, business_notes)
         VALUES ($1, 'confirmed', NOW() + interval '5 days', 'Supplementary emergency line order')
         RETURNING id`,
        [charlieId]
      );
      const newOrderId = newOrderRes.rows[0].id;

      // Insert order priority
      await query(
        `INSERT INTO order_priorities (order_id, approved_priority, priority_rank, notes, approved_by)
         VALUES ($1, 'HIGH', 3, 'Approved standard high', 1)`,
        [newOrderId]
      );

      // Insert new order item
      const newItemRes = await query(
        `INSERT INTO order_items (order_id, product_id, requested_quantity, minimum_acceptable_quantity, partial_delivery_allowed)
         VALUES ($1, $2, 10, 5, true)
         RETURNING id`,
        [newOrderId, pressureGaugeId]
      );
      const newItemId = newItemRes.rows[0].id;

      // Run allocation run 5
      const resRun5 = await request(app)
        .post('/api/allocation/run')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ product_ids: [pressureGaugeId], notes: 'Run 5: New Order Added' });

      expect(resRun5.status).toBe(200);
      run5Id = resRun5.body.data.run.id;

      // Compare run 4 and run 5
      const compareRes = await request(app)
        .get(`/api/impact/compare?baseRun=${run4Id}&targetRun=${run5Id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(compareRes.status).toBe(200);
      const data = compareRes.body.data;
      expect(data.summary.by_classification.NEW_ITEM).toBeGreaterThanOrEqual(1);

      const newItemChange = data.changes.find((c) => parseInt(c.order_item_id, 10) === parseInt(newItemId, 10));
      expect(newItemChange).toBeDefined();
      expect(newItemChange.classification).toBe(CLASSIFICATIONS.NEW_ITEM);
      expect(newItemChange.cause_attribution.cause_type).toBe('NEW_ORDER_ENTERED');
    });

    it('Scenario: Unchanged -> all items marked UNCHANGED when state is identical', async () => {
      // Run allocation run 6 immediately without mutating state
      const resRun6 = await request(app)
        .post('/api/allocation/run')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ product_ids: [pressureGaugeId], notes: 'Run 6: Identical state re-run' });

      expect(resRun6.status).toBe(200);
      run6Id = resRun6.body.data.run.id;

      // Compare run 5 and run 6
      const compareRes = await request(app)
        .get(`/api/impact/compare?baseRun=${run5Id}&targetRun=${run6Id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(compareRes.status).toBe(200);
      const data = compareRes.body.data;

      expect(data.summary.total_changed).toBe(0);
      expect(data.summary.total_unchanged).toBe(data.summary.total_items_compared);
      expect(data.summary.by_classification.UNCHANGED).toBe(data.summary.total_items_compared);

      for (const item of data.changes) {
        expect(item.classification).toBe(CLASSIFICATIONS.UNCHANGED);
        expect(item.changed).toBe(false);
        expect(item.delta).toBe(0);
        expect(item.cause_attribution.cause_type).toBe('STABLE');
      }
    });

    it('Defaults to comparing the two latest completed runs when query params are omitted', async () => {
      const defaultRes = await request(app)
        .get('/api/impact/compare')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(defaultRes.status).toBe(200);
      const data = defaultRes.body.data;

      // Target should be run6, Base should be run5
      expect(data.target_run.id).toBe(parseInt(run6Id, 10));
      expect(data.base_run.id).toBe(parseInt(run5Id, 10));
    });

    it('Also supports GET /api/allocation/impact/:runId route', async () => {
      const res = await request(app)
        .get(`/api/allocation/impact/${run6Id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.impact).toBeDefined();
      expect(res.body.data.impact.target_run.id).toBe(parseInt(run6Id, 10));
      expect(res.body.data.impact.base_run.id).toBe(parseInt(run5Id, 10));
    });
  });

  describe('3. Invariant: Past Runs & Results are NEVER modified', () => {
    it('running impact comparisons does not alter historical allocation runs or results', async () => {
      // Snapshot state
      const runsCountBefore = await query('SELECT count(*)::int as count FROM allocation_runs');
      const resultsCountBefore = await query('SELECT count(*)::int as count FROM allocation_results');
      const sampleResultsBefore = await query(
        'SELECT id, allocation_run_id, allocated_quantity, status FROM allocation_results ORDER BY id LIMIT 20'
      );

      // Perform multiple impact comparisons
      await request(app).get('/api/impact/compare').set('Authorization', `Bearer ${adminToken}`);
      await request(app).get('/api/impact/compare?baseRun=1&targetRun=2').set('Authorization', `Bearer ${adminToken}`);

      const runsCountAfter = await query('SELECT count(*)::int as count FROM allocation_runs');
      const resultsCountAfter = await query('SELECT count(*)::int as count FROM allocation_results');
      const sampleResultsAfter = await query(
        'SELECT id, allocation_run_id, allocated_quantity, status FROM allocation_results ORDER BY id LIMIT 20'
      );

      expect(runsCountAfter.rows[0].count).toBe(runsCountBefore.rows[0].count);
      expect(resultsCountAfter.rows[0].count).toBe(resultsCountBefore.rows[0].count);
      expect(sampleResultsAfter.rows).toEqual(sampleResultsBefore.rows);
    });
  });

  describe('4. RBAC & Security Gates', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/impact/compare');
      expect(res.status).toBe(401);
    });

    it('rejects customer role with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/impact/compare')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  afterAll(async () => {
    // Clean up test order items and restore demo seed
    await seed();
  });
});
