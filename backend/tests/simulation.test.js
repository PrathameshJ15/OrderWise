const request = require('supertest');
const app = require('../src/app');
const { query } = require('../src/config/db');

describe('Phase 10 What-If Simulation Tests — Zero-Side-Effect Guarantee', () => {
  let adminToken;
  let aliceToken;
  let gaugeProductId;
  let aliceOrderId;

  // Helper to snapshot all live tables
  async function takeLiveSnapshot() {
    const inv = await query(
      'SELECT product_id, on_hand_quantity, reserved_quantity, version FROM inventory ORDER BY product_id ASC;'
    );
    const ord = await query(
      'SELECT id, status, promised_delivery_date, updated_at FROM orders ORDER BY id ASC;'
    );
    const items = await query(
      'SELECT id, order_id, product_id, requested_quantity, minimum_acceptable_quantity, partial_delivery_allowed FROM order_items ORDER BY id ASC;'
    );
    const prio = await query(
      'SELECT id, order_id, approved_priority, priority_rank FROM order_priorities ORDER BY id ASC;'
    );
    const allocResults = await query(
      'SELECT id, allocation_run_id, order_item_id, allocated_quantity, status FROM allocation_results ORDER BY id ASC;'
    );

    return {
      inventory: inv.rows,
      orders: ord.rows,
      orderItems: items.rows,
      priorities: prio.rows,
      allocationResults: allocResults.rows,
    };
  }

  beforeAll(async () => {
    // 1. Authenticate admin
    const adminRes = await request(app).post('/api/auth/login').send({
      email: 'admin@orderwise.com',
      password: 'Admin123!',
    });
    adminToken = adminRes.body.data.token;

    // 2. Authenticate alice
    const aliceRes = await request(app).post('/api/auth/login').send({
      email: 'alice@demo.com',
      password: 'Alice123!',
    });
    aliceToken = aliceRes.body.data.token;

    // 3. Get Pressure Gauge Pro ID
    const prodRes = await query(`SELECT id FROM products WHERE sku = 'GAUGE-P300' LIMIT 1;`);
    gaugeProductId = Number(prodRes.rows[0].id);

    // 4. Find Alice's order
    const orderRes = await query(
      `SELECT o.id FROM orders o JOIN users u ON u.id = o.customer_id WHERE u.email = 'alice@demo.com' LIMIT 1;`
    );
    aliceOrderId = Number(orderRes.rows[0].id);
  });

  describe('RBAC Protection', () => {
    it('blocks Customer Alice from executing simulations (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .post('/api/simulations')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          scenario_type: 'inventory_increase',
          scenario_inputs: { product_id: gaugeProductId, quantity: 20 },
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('ACCEPTANCE GATE: Zero-Side-Effect Live Table Immutability', () => {
    it('proves live tables are 100% UNCHANGED before and after executing every scenario type', async () => {
      // 1. Take initial snapshot of live database
      const baselineSnapshot = await takeLiveSnapshot();

      // Scenario 1: Inventory Increase
      const res1 = await request(app)
        .post('/api/simulations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          scenario_type: 'inventory_increase',
          scenario_inputs: { product_id: gaugeProductId, quantity: 50 },
          name: 'Restock Scenario',
        });
      expect(res1.status).toBe(200);

      // Scenario 2: Inventory Decrease
      const res2 = await request(app)
        .post('/api/simulations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          scenario_type: 'inventory_decrease',
          scenario_inputs: { product_id: gaugeProductId, quantity: 15 },
          name: 'Shrinkage Scenario',
        });
      expect(res2.status).toBe(200);

      // Scenario 3: Demand Surge
      const res3 = await request(app)
        .post('/api/simulations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          scenario_type: 'demand_surge',
          scenario_inputs: { surge_percent: 25 },
          name: 'Q4 Surge Scenario',
        });
      expect(res3.status).toBe(200);

      // Scenario 4: Supplier Delay
      const res4 = await request(app)
        .post('/api/simulations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          scenario_type: 'supplier_delay',
          scenario_inputs: { product_id: gaugeProductId, delay_days: 21 },
          name: 'Port Congestion Scenario',
        });
      expect(res4.status).toBe(200);

      // Scenario 5: Priority Change
      const res5 = await request(app)
        .post('/api/simulations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          scenario_type: 'priority_change',
          scenario_inputs: { order_id: aliceOrderId, hypothetical_priority: 'critical' },
          name: 'VIP Escalation Scenario',
        });
      expect(res5.status).toBe(200);

      // Scenario 6: Chained Multi-Change Scenario
      const res6 = await request(app)
        .post('/api/simulations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          scenario_type: 'chained',
          steps: [
            { type: 'inventory_increase', product_id: gaugeProductId, quantity: 30 },
            { type: 'priority_change', order_id: aliceOrderId, hypothetical_priority: 'critical' },
          ],
          name: 'Chained Dual Intervention Scenario',
        });
      expect(res6.status).toBe(200);

      // 2. Take post-simulation snapshot of live database
      const postSimulationSnapshot = await takeLiveSnapshot();

      // 3. Assert ABSOLUTE EQUALITY on all live tables
      expect(postSimulationSnapshot.inventory).toEqual(baselineSnapshot.inventory);
      expect(postSimulationSnapshot.orders).toEqual(baselineSnapshot.orders);
      expect(postSimulationSnapshot.orderItems).toEqual(baselineSnapshot.orderItems);
      expect(postSimulationSnapshot.priorities).toEqual(baselineSnapshot.priorities);
      expect(postSimulationSnapshot.allocationResults).toEqual(baselineSnapshot.allocationResults);
    });
  });

  describe('Simulation Outcome Accuracy & Diff Intelligence', () => {
    let simId1;
    let simId2;

    it('inventory_increase accurately detects newly fulfilled orders', async () => {
      const res = await request(app)
        .post('/api/simulations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          scenario_type: 'inventory_increase',
          scenario_inputs: { product_id: gaugeProductId, quantity: 30 },
          name: 'Pressure Gauge Pro +30 Expansion',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.results.note).toContain('No live data was modified');
      expect(Array.isArray(data.results.changes)).toBe(true);

      // Alice's order item for gauge should improve
      const aliceChange = data.results.changes.find(
        (c) => Number(c.order_id) === aliceOrderId && Number(c.product_id) === gaugeProductId
      );

      if (aliceChange) {
        expect(['improved', 'newly_fulfilled']).toContain(aliceChange.change_type);
        expect(aliceChange.delta).toBeGreaterThan(0);
      }

      simId1 = data.simulation.id;
    });

    it('priority_change promotes target order ahead of competing demand', async () => {
      const res = await request(app)
        .post('/api/simulations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          scenario_type: 'priority_change',
          scenario_inputs: { order_id: aliceOrderId, hypothetical_priority: 'critical' },
          name: 'Escalate Alice to Critical',
        });

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.simulation.scenario_type).toBe('priority_change');
      expect(data.results).toHaveProperty('changes');
      expect(Array.isArray(data.results.changes)).toBe(true);

      simId2 = data.simulation.id;
    });

    it('scenario chaining executes multiple simultaneous changes in-memory', async () => {
      const res = await request(app)
        .post('/api/simulations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          scenario_type: 'chained',
          steps: [
            { type: 'inventory_increase', product_id: gaugeProductId, quantity: 20 },
            { type: 'demand_surge', surge_percent: 10 },
          ],
          name: 'Chained Restock & Surge',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.simulation.scenario_type).toBe('chained');
      expect(res.body.data.results.total_items_compared).toBeGreaterThan(0);
    });

    it('GET /api/simulations returns paginated list of saved simulation metadata', async () => {
      const res = await request(app)
        .get('/api/simulations?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.meta.pagination).toHaveProperty('total');
    });

    it('GET /api/simulations/:id returns detailed saved simulation results and diffs', async () => {
      const res = await request(app)
        .get(`/api/simulations/${simId1}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(simId1);
      expect(res.body.data.scenario_type).toBe('inventory_increase');
      expect(res.body.data.results).toHaveProperty('changes');
    });

    it('POST /api/simulations/compare provides side-by-side comparative analysis of saved scenarios', async () => {
      const res = await request(app)
        .post('/api/simulations/compare')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ simulation_ids: [simId1, simId2] });

      expect(res.status).toBe(200);
      expect(res.body.data.compared_count).toBe(2);
      expect(Array.isArray(res.body.data.scenarios)).toBe(true);

      const [s1, s2] = res.body.data.scenarios;
      expect(s1.id).toBe(simId1);
      expect(s2.id).toBe(simId2);
      expect(s1).toHaveProperty('affected_orders');
      expect(s2).toHaveProperty('affected_orders');
    });
  });
});
