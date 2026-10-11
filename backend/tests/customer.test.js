const request = require('supertest');
const app = require('../src/app');
const { query } = require('../src/config/db');

describe('Customer Portal & API Acceptance Tests', () => {
  let aliceToken;
  let bobToken;
  let aliceId;
  let bobId;
  let aliceOrderId;
  let bobOrderId;

  beforeAll(async () => {
    // Login as Alice
    const aliceRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@demo.com', password: 'Alice123!' });
    
    expect(aliceRes.status).toBe(200);
    aliceToken = aliceRes.body.token;
    aliceId = aliceRes.body.user.id;

    // Login as Bob
    const bobRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@demo.com', password: 'Bob123!' });

    expect(bobRes.status).toBe(200);
    bobToken = bobRes.body.token;
    bobId = bobRes.body.user.id;

    // Retrieve an order owned by Bob
    const bobOrders = await request(app)
      .get('/api/orders/my')
      .set('Authorization', `Bearer ${bobToken}`);

    expect(bobOrders.status).toBe(200);
    expect(bobOrders.body.orders.length).toBeGreaterThan(0);
    bobOrderId = bobOrders.body.orders[0].id;
  });

  describe('Authentication & Registration', () => {
    it('registers a new customer successfully', async () => {
      const uniqueEmail = `testuser_${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: uniqueEmail,
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(uniqueEmail);
      expect(res.body.user.role).toBe('customer');
    });

    it('rejects registration with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice Duplicate',
          email: 'alice@demo.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
    });

    it('returns current user profile with GET /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('alice@demo.com');
      expect(res.body.role).toBe('customer');
    });
  });

  describe('Product Catalog', () => {
    it('returns active products with accurate available stock', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body.products).toBeInstanceOf(Array);
      expect(res.body.products.length).toBeGreaterThanOrEqual(4);

      const gauge = res.body.products.find((p) => p.sku === 'GAUGE-P300');
      expect(gauge).toBeDefined();
      expect(gauge.on_hand_quantity).toBe(40);
      expect(gauge.available_stock).toBeDefined();
    });

    it('filters products by search query', async () => {
      const res = await request(app).get('/api/products?q=Pump');
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBe(1);
      expect(res.body.products[0].sku).toBe('PUMP-X100');
    });
  });

  describe('Order Creation & Validation', () => {
    it('rejects order with minimum quantity exceeding requested quantity', async () => {
      const products = await request(app).get('/api/products');
      const prodId = products.body.products[0].id;

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          items: [
            {
              product_id: prodId,
              requested_quantity: 10,
              minimum_acceptable_quantity: 25, // invalid!
              partial_delivery_allowed: true,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot exceed requested quantity/i);
    });

    it('creates a multi-line customer order with realistic fields', async () => {
      const products = await request(app).get('/api/products');
      const prod1 = products.body.products[0].id;
      const prod2 = products.body.products[1].id;

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          promised_delivery_date: '2026-11-15',
          business_notes: 'Urgent factory line maintenance parts requirement.',
          items: [
            {
              product_id: prod1,
              requested_quantity: 12,
              minimum_acceptable_quantity: 6,
              partial_delivery_allowed: true,
            },
            {
              product_id: prod2,
              requested_quantity: 5,
              minimum_acceptable_quantity: 5,
              partial_delivery_allowed: false,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.order).toBeDefined();
      expect(res.body.order.status).toBe('pending');
      expect(res.body.order.items.length).toBe(2);
      aliceOrderId = res.body.order.id;

      // Ensure newly created order item has explicit latest_allocation = null
      expect(res.body.order.items[0].latest_allocation).toBeNull();
    });
  });

  describe('Customer Dashboard & Order Details', () => {
    it('returns real customer dashboard statistics', async () => {
      const res = await request(app)
        .get('/api/orders/stats/my')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.total).toBeGreaterThan(0);
      expect(typeof res.body.stats.pending).toBe('number');
      expect(typeof res.body.stats.fulfilled).toBe('number');
      expect(typeof res.body.stats.partially_fulfilled).toBe('number');
      expect(typeof res.body.stats.deferred).toBe('number');
    });

    it('returns customer order details with customer-friendly status timeline and no invented allocation', async () => {
      const res = await request(app)
        .get(`/api/orders/${aliceOrderId}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      const order = res.body.order;
      expect(order.id).toBe(aliceOrderId);
      expect(order.items.length).toBe(2);

      // Verify each unallocated item has latest_allocation null
      for (const item of order.items) {
        expect(item.latest_allocation).toBeNull();
      }

      // Verify status timeline exists
      expect(order.timeline).toBeInstanceOf(Array);
      expect(order.timeline.length).toBeGreaterThanOrEqual(3);
      expect(order.timeline[0].title).toBe('Order Placed');
      expect(order.timeline[0].status).toBe('completed');
    });
  });

  describe('Customer Isolation & Security Barrier', () => {
    it('prevents customer Alice from viewing customer Bob order (403 Forbidden)', async () => {
      expect(bobOrderId).toBeDefined();

      const res = await request(app)
        .get(`/api/orders/${bobOrderId}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access denied/i);
    });

    it('prevents customer Bob from viewing customer Alice order (403 Forbidden)', async () => {
      expect(aliceOrderId).toBeDefined();

      const res = await request(app)
        .get(`/api/orders/${aliceOrderId}`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access denied/i);
    });

    it('ensures GET /api/orders/my returns ONLY the authenticated customer orders', async () => {
      const aliceOrdersRes = await request(app)
        .get('/api/orders/my')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(aliceOrdersRes.status).toBe(200);
      for (const ord of aliceOrdersRes.body.orders) {
        expect(ord.customer_id).toBe(aliceId);
      }

      const bobOrdersRes = await request(app)
        .get('/api/orders/my')
        .set('Authorization', `Bearer ${bobToken}`);

      expect(bobOrdersRes.status).toBe(200);
      for (const ord of bobOrdersRes.body.orders) {
        expect(ord.customer_id).toBe(bobId);
      }
    });
  });
});
