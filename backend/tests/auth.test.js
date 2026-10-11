const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { env } = require('../src/config/env');
const { query } = require('../src/config/db');
const { resetLoginAttempts } = require('../src/services/authService');

describe('Phase 3 Authentication & RBAC Tests', () => {
  beforeEach(() => {
    resetLoginAttempts('alice@demo.com');
    resetLoginAttempts('attacker@demo.com');
    resetLoginAttempts('locked@demo.com');
  });

  describe('Registration & Password Policy', () => {
    it('registers a new customer successfully with hashed password', async () => {
      const email = `testuser_${Date.now()}@example.com`;
      const res = await request(app).post('/api/auth/register').send({
        name: 'New Customer',
        email,
        password: 'Password123!',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(email);
      expect(res.body.data.user.role).toBe('customer');
      expect(res.body.data.user).not.toHaveProperty('password');
      expect(res.body.data.user).not.toHaveProperty('password_hash');
      expect(res.body.data.token).toBeDefined();

      // Verify in DB that password was hashed
      const dbUser = await query('SELECT password_hash FROM users WHERE email = $1', [email]);
      expect(dbUser.rows[0].password_hash).not.toBe('Password123!');
      expect(dbUser.rows[0].password_hash.startsWith('$2')).toBe(true);
    });

    it('strictly forces role to customer even if client attempts self-assigning admin', async () => {
      const email = `sneaky_admin_${Date.now()}@example.com`;
      const res = await request(app).post('/api/auth/register').send({
        name: 'Sneaky User',
        email,
        password: 'Password123!',
        role: 'admin', // Malicious attempt to elevate privileges
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('customer');

      const dbUser = await query('SELECT role FROM users WHERE email = $1', [email]);
      expect(dbUser.rows[0].role).toBe('customer');
    });

    it('rejects passwords shorter than 8 characters or lacking numbers', async () => {
      const shortRes = await request(app).post('/api/auth/register').send({
        name: 'Short Pass',
        email: 'short@example.com',
        password: 'Pass1',
      });
      expect(shortRes.status).toBe(400);
      expect(shortRes.body.error.code).toBe('VALIDATION_ERROR');

      const noNumRes = await request(app).post('/api/auth/register').send({
        name: 'No Number',
        email: 'nonum@example.com',
        password: 'PasswordOnly',
      });
      expect(noNumRes.status).toBe(400);
      expect(noNumRes.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Login & Security Controls', () => {
    it('authenticates valid credentials and issues JWT token', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'admin@orderwise.com',
        password: 'Admin123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('admin');
      expect(res.body.data.user).not.toHaveProperty('password_hash');
      expect(res.body.data.token).toBeDefined();

      // Verify token payload
      const decoded = jwt.verify(res.body.data.token, env.JWT_SECRET);
      expect(decoded.role).toBe('admin');
      expect(decoded.email).toBe('admin@orderwise.com');
    });

    it('returns generic error for bad password (no user enumeration)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'alice@demo.com',
        password: 'WrongPassword999!',
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.error.message).toMatch(/invalid email or password/i);
    });

    it('returns identical generic error for non-existent email (no user enumeration)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody_exists@randomdomain.test',
        password: 'SomePassword123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.error.message).toMatch(/invalid email or password/i);
    });

    it('locks account after 5 consecutive failed login attempts', async () => {
      const targetEmail = `locked_${Date.now()}@demo.com`;
      // Create user
      await request(app).post('/api/auth/register').send({
        name: 'Target Account',
        email: targetEmail,
        password: 'Password123!',
      });

      // Attempt 5 bad logins
      for (let i = 0; i < 4; i++) {
        const failRes = await request(app).post('/api/auth/login').send({
          email: targetEmail,
          password: 'WrongPassword!',
        });
        expect(failRes.status).toBe(401);
      }

      // 5th failed attempt triggers lockout
      const fifthRes = await request(app).post('/api/auth/login').send({
        email: targetEmail,
        password: 'WrongPassword!',
      });
      expect(fifthRes.status).toBe(429);
      expect(fifthRes.body.error.code).toBe('ACCOUNT_LOCKED');

      // Even correct password is now blocked while locked
      const blockedRes = await request(app).post('/api/auth/login').send({
        email: targetEmail,
        password: 'Password123!',
      });
      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.error.code).toBe('ACCOUNT_LOCKED');
    });
  });

  describe('JWT Verification & Protected Routes', () => {
    it('GET /api/auth/me returns current user profile when valid token supplied', async () => {
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'alice@demo.com',
        password: 'Alice123!',
      });
      const token = loginRes.body.data.token;

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.user.email).toBe('alice@demo.com');
      expect(meRes.body.data.user.role).toBe('customer');
    });

    it('rejects requests with missing token (401)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects requests with malformed or tampered token (401)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_tampered_token_xyz');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('rejects expired JWT token with TOKEN_EXPIRED (401)', async () => {
      const userRes = await query(`SELECT id, role, email FROM users WHERE email = 'alice@demo.com'`);
      const user = userRes.rows[0];

      // Create an expired token (expired 10 seconds ago)
      const expiredToken = jwt.sign(
        { userId: user.id, role: user.role, email: user.email },
        env.JWT_SECRET,
        { expiresIn: '-10s' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('RBAC & Customer Ownership Enforcement', () => {
    it('denies customer access to admin-only route with 403 FORBIDDEN', async () => {
      const customerLogin = await request(app).post('/api/auth/login').send({
        email: 'alice@demo.com',
        password: 'Alice123!',
      });
      const customerToken = customerLogin.body.data.token;

      const res = await request(app)
        .get('/api/auth/admin-only')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('permits admin access to admin-only route with 200 OK', async () => {
      const adminLogin = await request(app).post('/api/auth/login').send({
        email: 'admin@orderwise.com',
        password: 'Admin123!',
      });
      const adminToken = adminLogin.body.data.token;

      const res = await request(app)
        .get('/api/auth/admin-only')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Welcome Admin');
    });

    it('blocks Customer A from accessing Customer B resource (403 FORBIDDEN)', async () => {
      const aliceLogin = await request(app).post('/api/auth/login').send({
        email: 'alice@demo.com',
        password: 'Alice123!',
      });
      const aliceToken = aliceLogin.body.data.token;
      const aliceId = aliceLogin.body.data.user.id;

      const bobRes = await query(`SELECT id FROM users WHERE email = 'bob@demo.com'`);
      const bobId = bobRes.rows[0].id;

      // Alice accesses Alice's resource -> 200 OK
      const allowedRes = await request(app)
        .get(`/api/auth/customer-resource/${aliceId}`)
        .set('Authorization', `Bearer ${aliceToken}`);
      expect(allowedRes.status).toBe(200);

      // Alice accesses Bob's resource -> 403 FORBIDDEN
      const deniedRes = await request(app)
        .get(`/api/auth/customer-resource/${bobId}`)
        .set('Authorization', `Bearer ${aliceToken}`);
      expect(deniedRes.status).toBe(403);
      expect(deniedRes.body.error.code).toBe('FORBIDDEN');
      expect(deniedRes.body.error.message).toMatch(/only access your own/i);
    });

    it('allows Admin to view any customer resource', async () => {
      const adminLogin = await request(app).post('/api/auth/login').send({
        email: 'admin@orderwise.com',
        password: 'Admin123!',
      });
      const adminToken = adminLogin.body.data.token;

      const bobRes = await query(`SELECT id FROM users WHERE email = 'bob@demo.com'`);
      const bobId = bobRes.rows[0].id;

      const res = await request(app)
        .get(`/api/auth/customer-resource/${bobId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Audit Logging Verification', () => {
    it('records login failure and success events in audit_logs table', async () => {
      // Trigger a failure
      await request(app).post('/api/auth/login').send({
        email: 'alice@demo.com',
        password: 'BadPassword!',
      });

      // Trigger a success
      await request(app).post('/api/auth/login').send({
        email: 'alice@demo.com',
        password: 'Alice123!',
      });

      const auditRes = await query(
        `SELECT action FROM audit_logs WHERE action IN ('LOGIN_FAILED_BAD_PASSWORD', 'LOGIN_SUCCESS') ORDER BY id DESC LIMIT 2;`
      );

      const actions = auditRes.rows.map((r) => r.action);
      expect(actions).toContain('LOGIN_SUCCESS');
      expect(actions).toContain('LOGIN_FAILED_BAD_PASSWORD');
    });
  });
});
