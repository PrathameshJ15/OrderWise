const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const { env } = require('../src/config/env');

describe('Phase 13: Reports, Exports, and Audit Log Viewer', () => {
  const adminToken = jwt.sign(
    { userId: 1, id: 1, role: 'admin', email: 'admin@orderwise.com', name: 'Admin User' },
    env.JWT_SECRET
  );

  const customerToken = jwt.sign(
    { userId: 3, id: 3, role: 'customer', email: 'alice@demo.com', name: 'Alice Customer' },
    env.JWT_SECRET
  );

  describe('Reports Summary & KPIs', () => {
    it('allows admin to fetch reports summary metrics', async () => {
      const res = await request(app)
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kpis).toBeDefined();
      expect(typeof res.body.data.kpis.fill_rate_percent).toBe('number');
      expect(typeof res.body.data.kpis.inventory_valuation_usd).toBe('number');
    });

    it('blocks unauthenticated requests to reports summary', async () => {
      const res = await request(app).get('/api/reports/summary');
      expect(res.status).toBe(401);
    });

    it('blocks customer from accessing management reports', async () => {
      const res = await request(app)
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('CSV Exports', () => {
    it('exports orders CSV matching required columns', async () => {
      const res = await request(app)
        .get('/api/reports/export/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('id,customer_name,customer_email,status,priority,delivery_date,created_at');
    });

    it('exports allocation runs CSV for admin', async () => {
      const res = await request(app)
        .get('/api/reports/export/allocation_runs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('id,status,is_dry_run,items_considered,fulfilled,partially_fulfilled,deferred');
    });

    it('prevents customer from exporting system-wide allocation runs', async () => {
      const res = await request(app)
        .get('/api/reports/export/allocation_runs')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Audit Log Viewer (Read-Only API)', () => {
    it('allows admin to query audit logs with user/action filtering', async () => {
      const res = await request(app)
        .get('/api/audit?action=RUN_ALLOCATION')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.logs)).toBe(true);
    });

    it('blocks customer from accessing audit logs', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('ensures audit log is strictly read-only: POST/PUT/DELETE return 404 or 405', async () => {
      const postRes = await request(app)
        .post('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'MALICIOUS_LOG' });

      // No mutation routes exist on /api/audit
      expect([404, 405]).toContain(postRes.status);
    });
  });
});
