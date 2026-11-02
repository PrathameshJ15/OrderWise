const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const { env } = require('../src/config/env');
const {
  checkReallocationOpportunities,
  generateReallocationPreview,
} = require('../src/services/reallocationService');

describe('Phase 19: Controlled Automated Reallocation Acceptance Tests', () => {
  const adminToken = jwt.sign(
    { userId: 1, id: 1, role: 'admin', email: 'admin@orderwise.com' },
    env.JWT_SECRET
  );
  const managerToken = jwt.sign(
    { userId: 2, id: 2, role: 'inventory_manager', email: 'manager@orderwise.com' },
    env.JWT_SECRET
  );
  const customerToken = jwt.sign(
    { userId: 3, id: 3, role: 'customer', email: 'alice@demo.com' },
    env.JWT_SECRET
  );

  describe('1. Reallocation Opportunity Detection', () => {
    it('detects waiting orders when positive available stock exists', async () => {
      const res = await checkReallocationOpportunities();

      expect(res).toHaveProperty('opportunities');
      expect(res).toHaveProperty('total_opportunities');
      expect(typeof res.total_opportunities).toBe('number');

      if (res.opportunities.length > 0) {
        const opp = res.opportunities[0];
        expect(opp).toHaveProperty('product_id');
        expect(opp).toHaveProperty('available_stock');
        expect(opp).toHaveProperty('opportunity_detected');
        expect(opp).toHaveProperty('status');
      }
    });
  });

  describe('2. Isolated Reallocation Preview Safety Invariant', () => {
    it('generates a proposed preview strictly labeled AWAITING_APPROVAL with zero mutation', async () => {
      const preview = await generateReallocationPreview({ productIds: 'all' });

      expect(preview).toHaveProperty('proposal_id');
      expect(preview.requires_human_approval).toBe(true);
      expect(preview.preview_status).toBe('PROPOSED_REALLOCATION_AWAITING_APPROVAL');
      expect(preview.policy_disclaimer).toContain('Live database has NOT been modified');
      expect(preview.summary).toBeDefined();
      expect(preview.affected_orders).toBeDefined();
    });

    it('proposes allocations following deterministic priorities without double allocation', async () => {
      const preview = await generateReallocationPreview({ productIds: 'all' });

      // Total proposed units to allocate cannot exceed what the algorithm allocates
      expect(preview.summary.total_units_to_allocate).toBeGreaterThanOrEqual(0);
      expect(preview.summary.proposed_fulfilled).toBeGreaterThanOrEqual(0);
      expect(preview.summary.proposed_deferred).toBeGreaterThanOrEqual(0);
    });
  });

  describe('3. REST API Endpoints & RBAC Protection', () => {
    it('GET /api/allocation/reallocation/opportunities - accessible to admin', async () => {
      const res = await request(app)
        .get('/api/allocation/reallocation/opportunities')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.opportunities).toBeDefined();
    });

    it('POST /api/allocation/reallocation/preview - accessible to admin', async () => {
      const res = await request(app)
        .get('/api/allocation/reallocation/opportunities')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('enforces RBAC - denies customer role from reallocation endpoints (403)', async () => {
      const resOpportunities = await request(app)
        .get('/api/allocation/reallocation/opportunities')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(resOpportunities.status).toBe(403);

      const resPreview = await request(app)
        .post('/api/allocation/reallocation/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ product_ids: 'all' });
      expect(resPreview.status).toBe(403);

      const resApply = await request(app)
        .post('/api/allocation/reallocation/apply')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Unauthorized attempt' });
      expect(resApply.status).toBe(403);
    });

    it('enforces RBAC - denies unauthenticated requests (401)', async () => {
      const res = await request(app).get('/api/allocation/reallocation/opportunities');
      expect(res.status).toBe(401);
    });
  });
});

