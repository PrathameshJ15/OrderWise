const request = require('supertest');
const app = require('../src/app');
const { generateToken, generateRefreshToken } = require('../src/services/authService');
const { validateJwtSecretStrength } = require('../src/config/env');
const logger = require('../src/utils/logger');

// Test accounts conforming to DEMO_USERS in authService
const TOKENS = {
  admin: generateToken({ id: 1, name: 'Admin Operations', role: 'admin', email: 'admin@orderwise.com' }),
  inventory_manager: generateToken({ id: 2, name: 'Inventory Manager', role: 'inventory_manager', email: 'manager@orderwise.com' }),
  customer_alice: generateToken({ id: 3, name: 'Alice Customer', role: 'customer', email: 'alice@demo.com' }),
  customer_bob: generateToken({ id: 4, name: 'Bob Customer', role: 'customer', email: 'bob@demo.com' }),
};

describe('Phase 14: Security Hardening & OWASP Compliance Tests', () => {

  describe('1. OWASP Top 10 Security Headers & Configuration', () => {
    it('returns strict security headers from Helmet', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);

      // Verify Helmet headers
      expect(res.headers['x-dns-prefetch-control']).toBe('off');
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(res.headers['x-powered-by']).toBeUndefined(); // Information disclosure prevention
    });
  });

  describe('2. Comprehensive Authorization Matrix (Endpoints × Roles)', () => {
    // Matrix definition: [method, path, body, expectedStatusCodesByRole: { guest, customer, inventory_manager, admin }]
    const matrix = [
      {
        name: 'Public Health Check',
        method: 'get',
        path: '/api/health',
        body: null,
        expected: { guest: 200, customer: 200, inventory_manager: 200, admin: 200 },
      },
      {
        name: 'Public Product Catalog Read',
        method: 'get',
        path: '/api/products',
        body: null,
        expected: { guest: 200, customer: 200, inventory_manager: 200, admin: 200 },
      },
      {
        name: 'Auth Session Profile (/api/auth/me)',
        method: 'get',
        path: '/api/auth/me',
        body: null,
        expected: { guest: 401, customer: 200, inventory_manager: 200, admin: 200 },
      },
      {
        name: 'Admin-Only Route (/api/auth/admin-only)',
        method: 'get',
        path: '/api/auth/admin-only',
        body: null,
        expected: { guest: 401, customer: 403, inventory_manager: 403, admin: 200 },
      },
      {
        name: 'Product Creation (Admin only)',
        method: 'post',
        path: '/api/products',
        body: { sku: 'TEST-SKU-99', name: 'Security Test Part', unit: 'units' },
        expected: { guest: 401, customer: 403, inventory_manager: 403, admin: 201 },
      },
      {
        name: 'Inventory Balances Read (Manager / Admin)',
        method: 'get',
        path: '/api/inventory',
        body: null,
        expected: { guest: 401, customer: 403, inventory_manager: 200, admin: 200 },
      },
      {
        name: 'Inventory Stock Adjustment (Manager / Admin)',
        method: 'put',
        path: '/api/inventory/3',
        body: { quantity: 45, reason: 'Security adjustment audit test', expectedVersion: 1 },
        expected: { guest: 401, customer: 403, inventory_manager: 200, admin: 200 },
      },
      {
        name: 'Orders List (/api/orders)',
        method: 'get',
        path: '/api/orders',
        body: null,
        expected: { guest: 401, customer: 200, inventory_manager: 200, admin: 200 },
      },
      {
        name: 'Customer Own Orders (/api/orders/my)',
        method: 'get',
        path: '/api/orders/my',
        body: null,
        expected: { guest: 401, customer: 200, inventory_manager: 200, admin: 200 },
      },
      {
        name: 'Confirm Order (Manager / Admin)',
        method: 'patch',
        path: '/api/orders/101/confirm',
        body: {},
        expected: { guest: 401, customer: 403, inventory_manager: 200, admin: 200 },
      },
      {
        name: 'Allocation Engine Execution (Admin only)',
        method: 'post',
        path: '/api/allocation/run',
        body: { productIds: [3], dryRun: true },
        expected: { guest: 401, customer: 403, inventory_manager: 403, admin: 200 },
      },
      {
        name: 'Allocation Runs History (Admin only)',
        method: 'get',
        path: '/api/allocation/runs',
        body: null,
        expected: { guest: 401, customer: 403, inventory_manager: 403, admin: 200 },
      },
      {
        name: 'AI Priority Recommendations List (Admin only)',
        method: 'get',
        path: '/api/ai/recommendations',
        body: null,
        expected: { guest: 401, customer: 403, inventory_manager: 403, admin: 200 },
      },
      {
        name: 'Priority Approvals Workflow (Admin only)',
        method: 'post',
        path: '/api/priorities/approve',
        body: { recommendation_id: 1, decision: 'approved', final_priority: 'HIGH' },
        expected: { guest: 401, customer: 403, inventory_manager: 403, admin: 200 },
      },
      {
        name: 'Simulation Lab Runs (Admin only)',
        method: 'get',
        path: '/api/simulations',
        body: null,
        expected: { guest: 401, customer: 403, inventory_manager: 403, admin: 200 },
      },
      {
        name: 'Shortage Alerts Directory (Manager / Admin)',
        method: 'get',
        path: '/api/alerts',
        body: null,
        expected: { guest: 401, customer: 403, inventory_manager: 200, admin: 200 },
      },
      {
        name: 'Replenishment Intelligence (Manager / Admin)',
        method: 'get',
        path: '/api/replenishment',
        body: null,
        expected: { guest: 401, customer: 403, inventory_manager: 200, admin: 200 },
      },
      {
        name: 'Executive Reports Summary (Manager / Admin)',
        method: 'get',
        path: '/api/reports/summary',
        body: null,
        expected: { guest: 401, customer: 403, inventory_manager: 200, admin: 200 },
      },
    ];

    const roles = [
      { role: 'guest', token: null },
      { role: 'customer', token: TOKENS.customer_alice },
      { role: 'inventory_manager', token: TOKENS.inventory_manager },
      { role: 'admin', token: TOKENS.admin },
    ];

    roles.forEach(({ role, token }) => {
      describe(`Role: ${role.toUpperCase()}`, () => {
        matrix.forEach((endpoint) => {
          it(`${endpoint.method.toUpperCase()} ${endpoint.path} -> expects HTTP ${endpoint.expected[role]}`, async () => {
            let req = request(app)[endpoint.method](endpoint.path);
            if (token) {
              req = req.set('Authorization', `Bearer ${token}`);
            }
            if (endpoint.body) {
              req = req.send(endpoint.body);
            }

            const res = await req;
            expect(res.status).toBe(endpoint.expected[role]);
          });
        });
      });
    });
  });

  describe('3. Insecure Direct Object Reference (IDOR) Protection', () => {
    it('prevents customer Alice from accessing customer Bob order details', async () => {
      // Order 102 belongs to Bob (customer_id: 4)
      const res = await request(app)
        .get('/api/orders/102')
        .set('Authorization', `Bearer ${TOKENS.customer_alice}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows customer Alice to access her own order details (Order 101)', async () => {
      const res = await request(app)
        .get('/api/orders/101')
        .set('Authorization', `Bearer ${TOKENS.customer_alice}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(101);
    });

    it('allows Admin to view any customer order (Order 102)', async () => {
      const res = await request(app)
        .get('/api/orders/102')
        .set('Authorization', `Bearer ${TOKENS.admin}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(102);
    });

    it('prevents customer Alice from cancelling customer Bob order', async () => {
      const res = await request(app)
        .patch('/api/orders/102/cancel')
        .set('Authorization', `Bearer ${TOKENS.customer_alice}`)
        .send({ reason: 'Malicious cancellation attempt' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Mass Assignment Protection', () => {
    it('ignores client-supplied role: "admin" during registration and forces "customer"', async () => {
      const randomEmail = `hacker_${Date.now()}@exploit.com`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Privilege Escalation Attempt',
          email: randomEmail,
          password: 'Password123!',
          role: 'admin', // Attempted privilege escalation
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('customer'); // Must be forced to customer
      expect(res.body.data.user.role).not.toBe('admin');
    });

    it('ignores client-supplied status and priority on order creation', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${TOKENS.customer_alice}`)
        .send({
          items: [
            {
              productId: 3,
              requestedQuantity: 5,
              minimumAcceptableQuantity: 5,
              partialDeliveryAllowed: true,
            },
          ],
          status: 'fulfilled', // Client attempts to force fulfilled
          priority: 'CRITICAL', // Client attempts to force critical priority
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending'); // Must always start as pending
      expect(res.body.data.approved_priority).not.toBe('CRITICAL');
    });
  });

  describe('5. Oversized Payload & Denial of Service Protection', () => {
    it('rejects oversized JSON request payloads exceeding 500KB with HTTP 413', async () => {
      // Construct a payload slightly over 500KB
      const hugeString = 'X'.repeat(550 * 1024);
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${TOKENS.customer_alice}`)
        .send({
          businessNotes: hugeString,
          items: [{ productId: 3, requestedQuantity: 1 }],
        });

      expect(res.status).toBe(413);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    });
  });

  describe('6. Sensitive Data Masking in Logger', () => {
    it('redacts sensitive fields: password, tokens, and authorization headers', () => {
      const dirtyObject = {
        name: 'Alice',
        email: 'alice@demo.com',
        password: 'PlainTextPassword123!',
        jwt_secret: 'supersecretstring',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjN9.SignatureHere1234567890',
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjN9.SignatureHere1234567890',
        subObject: {
          password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz',
          apiKey: 'gsk_super_secret_groq_key',
        },
      };

      const cleaned = logger.sanitizeValue('root', dirtyObject);

      expect(cleaned.password).toBe('[REDACTED]');
      expect(cleaned.jwt_secret).toBe('[REDACTED]');
      expect(cleaned.token).toBe('[REDACTED]');
      expect(cleaned.authorization).toBe('[REDACTED]');
      expect(cleaned.subObject.password_hash).toBe('[REDACTED]');
      expect(cleaned.subObject.apiKey).toBe('[REDACTED]');
      expect(cleaned.name).toBe('Alice');
      expect(cleaned.email).toBe('alice@demo.com');
    });
  });

  describe('7. JWT Secret Strength Validation at Startup', () => {
    it('rejects secrets shorter than 32 characters in all environments', () => {
      expect(() => validateJwtSecretStrength('short_secret_123', 'development')).toThrow(
        /must be at least 32 characters long/i
      );
    });

    it('rejects placeholder or default secrets in production environment', () => {
      expect(() =>
        validateJwtSecretStrength('replace_with_long_random_string_min_64_chars_1234567890123456789012', 'production')
      ).toThrow(/insecure or default placeholder jwt_secret/i);
    });

    it('rejects secrets shorter than 64 characters in production environment', () => {
      const valid32 = 'a'.repeat(40);
      expect(() => validateJwtSecretStrength(valid32, 'production')).toThrow(
        /must be at least 64 characters long per agents\.md/i
      );
    });

    it('accepts strong, 64-character entropy secrets in production', () => {
      const strong64 = '9e8c7b6a5d4f3e2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a';
      expect(validateJwtSecretStrength(strong64, 'production')).toBe(true);
    });
  });

  describe('8. Refresh Token Rotation Support', () => {
    it('issues access token and refresh token upon login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@demo.com',
          password: 'Alice123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('rotates refresh token and returns new session via POST /api/auth/refresh', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@demo.com',
          password: 'Alice123!',
        });

      const refreshToken = loginRes.body.data.refreshToken;

      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.token).toBeDefined();
      expect(refreshRes.body.data.refreshToken).toBeDefined();
      expect(refreshRes.body.data.user.email).toBe('alice@demo.com');
    });

    it('rejects invalid or tampered refresh tokens with HTTP 401', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'tampered.refresh.token.string' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

