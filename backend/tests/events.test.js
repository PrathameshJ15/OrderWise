const request = require('supertest');
const app = require('../src/app');
const eventHub = require('../src/services/eventHub');
const jwt = require('jsonwebtoken');
const { env } = require('../src/config/env');

describe('Phase 12: Real-Time Updates & In-App Notifications', () => {
  const adminToken = jwt.sign(
    { userId: 1, id: 1, role: 'admin', email: 'admin@orderwise.com', name: 'Admin User' },
    env.JWT_SECRET
  );

  const customerAliceToken = jwt.sign(
    { userId: 3, id: 3, role: 'customer', email: 'alice@demo.com', name: 'Alice Customer' },
    env.JWT_SECRET
  );

  const customerBobToken = jwt.sign(
    { userId: 4, id: 4, role: 'customer', email: 'bob@demo.com', name: 'Bob Customer' },
    env.JWT_SECRET
  );

  it('rejects unauthenticated requests to /api/events', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(401);
  });

  it('fetches notification list for authenticated customer', async () => {
    const res = await request(app)
      .get('/api/events/notifications')
      .set('Authorization', `Bearer ${customerAliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.notifications).toBeDefined();
    expect(typeof res.body.data.unreadCount).toBe('number');
  });

  it('marks notifications as read', async () => {
    const res = await request(app)
      .patch('/api/events/notifications/read')
      .set('Authorization', `Bearer ${customerAliceToken}`)
      .send({ id: 'all' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('enforces customer isolation: customer never receives another customer’s events', async () => {
    // Mock SSE clients for Alice and Bob
    const aliceEvents = [];
    const bobEvents = [];

    const mockAliceRes = {
      write: (str) => {
        if (str.startsWith('data:')) {
          aliceEvents.push(JSON.parse(str.replace('data:', '').trim()));
        }
      },
      on: () => {},
    };

    const mockBobRes = {
      write: (str) => {
        if (str.startsWith('data:')) {
          bobEvents.push(JSON.parse(str.replace('data:', '').trim()));
        }
      },
      on: () => {},
    };

    eventHub.registerClient({ userId: 3, role: 'customer', email: 'alice@demo.com' }, mockAliceRes);
    eventHub.registerClient({ userId: 4, role: 'customer', email: 'bob@demo.com' }, mockBobRes);

    // Broadcast event exclusively for Alice (order #101)
    await eventHub.broadcastEvent({
      type: 'order_status_changed',
      title: 'Order Status Changed',
      message: 'Your order has been updated.',
      data: { orderId: 101 },
      targetCustomerIds: [3], // Alice only
      targetRoles: ['admin'],
    });

    // Check Alice received it
    const aliceReceived = aliceEvents.some((e) => e.data?.orderId === 101);
    expect(aliceReceived).toBe(true);

    // Check Bob DID NOT receive Alice's order event
    const bobReceived = bobEvents.some((e) => e.data?.orderId === 101);
    expect(bobReceived).toBe(false);
  });
});
