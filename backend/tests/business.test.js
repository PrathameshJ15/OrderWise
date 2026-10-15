const request = require('supertest');
const app = require('../src/app');
const { query } = require('../src/config/db');

describe('Phase 4 Core Business APIs Tests', () => {
  let adminToken;
  let managerToken;
  let aliceToken;
  let bobToken;

  beforeAll(async () => {
    // Login admin
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@orderwise.com',
      password: 'Admin123!',
    });
    adminToken = adminLogin.body.data.token;

    // Login manager
    const managerLogin = await request(app).post('/api/auth/login').send({
      email: 'manager@orderwise.com',
      password: 'Manager123!',
    });
    managerToken = managerLogin.body.data.token;

    // Login Alice
    const aliceLogin = await request(app).post('/api/auth/login').send({
      email: 'alice@demo.com',
      password: 'Alice123!',
    });
    aliceToken = aliceLogin.body.data.token;

    // Login Bob
    const bobLogin = await request(app).post('/api/auth/login').send({
      email: 'bob@demo.com',
      password: 'Bob123!',
    });
    bobToken = bobLogin.body.data.token;
  });

  describe('Products CRUD & RBAC', () => {
    let createdProductId;

    it('GET /api/products returns paginated list with inventory metrics', async () => {
      const res = await request(app).get('/api/products?page=1&limit=10');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total');

      const pump = res.body.data.find((p) => p.sku === 'PUMP-X100');
      expect(pump).toBeDefined();
      expect(pump).toHaveProperty('on_hand_quantity');
      expect(pump).toHaveProperty('available_quantity');
    });

    it('denies customer from creating product (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          sku: 'NEW-PUMP',
          name: 'Unauthorized Pump',
        });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows Admin to create product with inventory initialization (201 Created)', async () => {
      const sku = `TEST-PROD-${Date.now()}`;
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sku,
          name: 'Industrial Flow Meter',
          description: 'High pressure digital flow meter',
          unit: 'units',
          initialStock: 50,
          safetyStock: 10,
          reorderPoint: 15,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.sku).toBe(sku);
      expect(res.body.data.on_hand_quantity).toBe(50);
      expect(res.body.data.available_quantity).toBe(50);
      createdProductId = res.body.data.id;
    });

    it('allows Admin to update product details', async () => {
      const res = await request(app)
        .put(`/api/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Flow Meter Pro',
          description: 'Upgraded sensor firmware',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Flow Meter Pro');
    });

    it('allows Admin to soft-delete/deactivate product', async () => {
      const res = await request(app)
        .delete(`/api/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Verify product is inactive
      const checkRes = await request(app).get(`/api/products/${createdProductId}`);
      expect(checkRes.body.data.active).toBe(false);
    });
  });

  describe('Inventory Rules & Adjustments', () => {
    let scarceProductId;

    beforeAll(async () => {
      const prodRes = await query(`SELECT id FROM products WHERE sku = 'GAUGE-P300'`);
      scarceProductId = prodRes.rows[0].id;
    });

    it('GET /api/inventory returns full stock overview with available = on_hand - reserved', async () => {
      const res = await request(app)
        .get('/api/inventory')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      const gauge = res.body.data.find((i) => i.sku === 'GAUGE-P300');
      expect(gauge).toBeDefined();
      expect(gauge.available_quantity).toBe(gauge.on_hand_quantity - gauge.reserved_quantity);
    });

    it('allows manual adjustment with mandatory reason and recorded actor', async () => {
      const currentRes = await request(app)
        .get(`/api/inventory/${scarceProductId}`)
        .set('Authorization', `Bearer ${managerToken}`);
      const initialStock = currentRes.body.data.on_hand_quantity;

      const adjustRes = await request(app)
        .put(`/api/inventory/${scarceProductId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          adjustmentType: 'delta',
          quantity: 10,
          reason: 'Received urgent buffer shipment from vendor',
        });

      expect(adjustRes.status).toBe(200);
      expect(adjustRes.body.data.on_hand_quantity).toBe(initialStock + 10);

      // Verify movement ledger entry was created
      const moveRes = await request(app)
        .get(`/api/inventory/${scarceProductId}/movements`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(moveRes.status).toBe(200);
      expect(moveRes.body.data.length).toBeGreaterThan(0);
      expect(moveRes.body.data[0].reason).toBe('Received urgent buffer shipment from vendor');
      expect(moveRes.body.data[0].quantity).toBe(10);
    });

    it('rejects adjustment without mandatory reason (400 VALIDATION_ERROR)', async () => {
      const res = await request(app)
        .put(`/api/inventory/${scarceProductId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          adjustmentType: 'delta',
          quantity: 5,
          reason: '', // missing reason
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('prevents negative stock with INSUFFICIENT_STOCK error', async () => {
      const res = await request(app)
        .put(`/api/inventory/${scarceProductId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          adjustmentType: 'set',
          quantity: -20, // Negative quantity
          reason: 'Faulty warehouse count input',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
      expect(res.body.error.message).toMatch(/cannot be negative/i);
    });
  });

  describe('Orders Creation, Idempotency & State Machine', () => {
    let pumpProductId;
    let valveProductId;
    let createdOrderId;

    beforeAll(async () => {
      const p1 = await query(`SELECT id FROM products WHERE sku = 'PUMP-X100'`);
      const p2 = await query(`SELECT id FROM products WHERE sku = 'VALVE-B200'`);
      pumpProductId = p1.rows[0].id;
      valveProductId = p2.rows[0].id;
    });

    it('creates multi-item order with validated quantities, leaving stock UNTOUCHED', async () => {
      // Check inventory before order creation
      const preInv = await query(`SELECT on_hand_quantity, reserved_quantity FROM inventory WHERE product_id = $1`, [pumpProductId]);

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          promisedDeliveryDate: '2026-11-15',
          businessNotes: 'Routine refinery maintenance order',
          items: [
            {
              productId: pumpProductId,
              requestedQuantity: 10,
              minimumAcceptableQuantity: 5,
              partialDeliveryAllowed: true,
            },
            {
              productId: valveProductId,
              requestedQuantity: 20,
              minimumAcceptableQuantity: 20,
              partialDeliveryAllowed: false,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(2);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.approved_priority).toBe('MEDIUM'); // System assigned default!
      createdOrderId = res.body.data.id;

      // CRITICAL VERIFICATION: Order creation MUST leave inventory stock completely unchanged
      const postInv = await query(`SELECT on_hand_quantity, reserved_quantity FROM inventory WHERE product_id = $1`, [pumpProductId]);
      expect(postInv.rows[0].on_hand_quantity).toBe(preInv.rows[0].on_hand_quantity);
      expect(postInv.rows[0].reserved_quantity).toBe(preInv.rows[0].reserved_quantity);
    });

    it('rejects order with minimum quantity exceeding requested quantity (400 INVALID_QUANTITY)', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          items: [
            {
              productId: pumpProductId,
              requestedQuantity: 10,
              minimumAcceptableQuantity: 25, // Invalid: min > requested
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_QUANTITY');
    });

    it('replaying the same Idempotency-Key returns the identical order without duplication', async () => {
      const idempotencyKey = `idem_key_${Date.now()}`;

      // First request
      const firstRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${aliceToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          businessNotes: 'Idempotency test order',
          items: [
            { productId: pumpProductId, requestedQuantity: 5, minimumAcceptableQuantity: 5 },
          ],
        });

      expect(firstRes.status).toBe(201);
      const firstOrderId = firstRes.body.data.id;

      // Repeated request with same idempotency key (e.g. user double-click)
      const secondRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${aliceToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          businessNotes: 'Idempotency test order',
          items: [
            { productId: pumpProductId, requestedQuantity: 5, minimumAcceptableQuantity: 5 },
          ],
        });

      expect(secondRes.status).toBe(200);
      expect(secondRes.body.data.id).toBe(firstOrderId);
      expect(secondRes.body.meta).toHaveProperty('idempotentReplay', true);

      // Verify only 1 order exists with this idempotency key in DB
      const dbCount = await query(`SELECT count(*)::int as count FROM orders WHERE idempotency_key = $1`, [idempotencyKey]);
      expect(dbCount.rows[0].count).toBe(1);
    });

    it('allows Admin to confirm a pending order (State Machine: pending -> confirmed)', async () => {
      const res = await request(app)
        .patch(`/api/orders/${createdOrderId}/confirm`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('confirmed');
    });

    it('blocks illegal state transition (e.g. confirmed -> completed without shipping)', async () => {
      const { validateTransition } = require('../src/services/orderStateMachine');
      expect(() => validateTransition('confirmed', 'completed')).toThrow(/Illegal order state transition/i);
    });

    it('allows customer to cancel their own order (State Machine: confirmed -> cancelled)', async () => {
      const res = await request(app)
        .patch(`/api/orders/${createdOrderId}/cancel`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ reason: 'Project postponed by client' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('cancelled');
    });

    it('blocks Customer Bob from accessing Customer Alice order (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .get(`/api/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows Customer Alice to access her own order details (200 OK)', async () => {
      const res = await request(app)
        .get(`/api/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdOrderId);
    });
  });
});
