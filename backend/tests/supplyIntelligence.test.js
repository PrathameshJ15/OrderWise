const request = require('supertest');
const app = require('../src/app');
const { calculateReplenishment } = require('../src/services/replenishmentService');

describe('Phase 11: Supply Intelligence (Alerts & Replenishment)', () => {
  let adminToken;
  let managerToken;
  let customerToken;

  beforeAll(async () => {
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

    const custRes = await request(app).post('/api/auth/login').send({
      email: 'alice@demo.com',
      password: 'Alice123!',
    });
    customerToken = custRes.body.data.token;
  });

  describe('Pure Replenishment Calculator', () => {
    it('calculates dynamic reorder point and inventory position correctly', () => {
      const result = calculateReplenishment({
        productId: 3,
        productName: 'Pressure Gauge Pro',
        sku: 'GAUGE-P300',
        onHandQuantity: 40,
        reservedQuantity: 30,
        safetyStock: 10,
        configuredReorderPoint: 20,
        incomingStock: 0,
        averageDailyDemand: 8,
        leadTimeDays: 5,
      });

      // (8 * 5) + 10 = 50 dynamic reorder point
      // inventory position = 40 + 0 - 30 = 10
      // 10 <= 50 -> REORDER_RECOMMENDED
      expect(result.inventory_position).toBe(10);
      expect(result.reorder_point).toBe(50);
      expect(result.flag).toBe('REORDER_RECOMMENDED');
      // target = 8 * 5 * 2 = 80; suggested = 80 - 10 = 70
      expect(result.suggested_reorder_quantity).toBe(70);
      expect(result.estimated_shortage_risk).toBe('high');
      expect(result.note).toContain('estimate');
    });

    it('identifies critical shortage risk when inventory position is 0 or negative', () => {
      const result = calculateReplenishment({
        productId: 1,
        productName: 'Exhausted Pump',
        sku: 'PUMP-001',
        onHandQuantity: 20,
        reservedQuantity: 20,
        safetyStock: 15,
        configuredReorderPoint: 30,
        incomingStock: 0,
        averageDailyDemand: 5,
        leadTimeDays: 7,
      });

      expect(result.inventory_position).toBe(0);
      expect(result.estimated_shortage_risk).toBe('critical');
      expect(result.flag).toBe('REORDER_RECOMMENDED');
    });

    it('reports adequate stock when inventory position exceeds reorder point', () => {
      const result = calculateReplenishment({
        productId: 4,
        productName: 'Control Panel Unit',
        sku: 'CTRL-U400',
        onHandQuantity: 200,
        reservedQuantity: 0,
        safetyStock: 25,
        configuredReorderPoint: 50,
        incomingStock: 50,
        averageDailyDemand: 5,
        leadTimeDays: 5,
      });

      // dynamic = (5 * 5) + 25 = 50; effective = 50
      // position = 200 + 50 - 0 = 250
      // 250 > 50 -> ADEQUATE_STOCK
      expect(result.inventory_position).toBe(250);
      expect(result.flag).toBe('ADEQUATE_STOCK');
      expect(result.suggested_reorder_quantity).toBe(0);
      expect(result.estimated_shortage_risk).toBe('low');
    });
  });

  describe('Replenishment Endpoints (GET /api/replenishment)', () => {
    it('allows admin and inventory_manager to retrieve recommendations', async () => {
      const res = await request(app)
        .get('/api/replenishment')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.recommendations)).toBe(true);
      expect(res.body.data.recommendations.length).toBeGreaterThan(0);

      const gauge = res.body.data.recommendations.find((r) => r.sku === 'GAUGE-P300');
      expect(gauge).toBeDefined();
      expect(gauge.product_name).toBe('Pressure Gauge Pro');
      expect(gauge.formula_used).toBeDefined();
    });

    it('allows fetching single product replenishment details', async () => {
      const listRes = await request(app)
        .get('/api/replenishment')
        .set('Authorization', `Bearer ${adminToken}`);

      const firstProduct = listRes.body.data.recommendations[0];

      const res = await request(app)
        .get(`/api/replenishment/${firstProduct.product_id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendation.product_id).toBe(firstProduct.product_id);
    });

    it('returns 404 for non-existent product replenishment query', async () => {
      const res = await request(app)
        .get('/api/replenishment/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('blocks customers from viewing replenishment data (RBAC)', async () => {
      const res = await request(app)
        .get('/api/replenishment')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Alerts Endpoints (GET / POST / PATCH / DELETE /api/alerts)', () => {
    it('runs scan and returns generated telemetry alerts', async () => {
      const scanRes = await request(app)
        .post('/api/alerts/scan')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(scanRes.status).toBe(200);
      expect(scanRes.body.success).toBe(true);
      expect(scanRes.body.data.evaluated_at).toBeDefined();
      expect(typeof scanRes.body.data.created_count).toBe('number');
    });

    it('fetches alerts list with stats counters', async () => {
      const res = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.alerts)).toBe(true);
      expect(res.body.data.stats).toBeDefined();
      expect(typeof res.body.data.stats.unresolved).toBe('number');
      expect(typeof res.body.data.stats.critical).toBe('number');
      expect(typeof res.body.data.stats.warning).toBe('number');
    });

    it('filters alerts by resolved status and severity', async () => {
      const res = await request(app)
        .get('/api/alerts?resolved=false&severity=critical')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      for (const alert of res.body.data.alerts) {
        expect(alert.resolved).toBe(false);
        expect(alert.severity).toBe('critical');
      }
    });

    it('resolves an active alert successfully', async () => {
      // Find an unresolved alert or create one
      const listRes = await request(app)
        .get('/api/alerts?resolved=false')
        .set('Authorization', `Bearer ${adminToken}`);

      let alertToResolve = listRes.body.data.alerts[0];

      if (!alertToResolve) {
        // Trigger a scan to ensure alerts exist
        await request(app).post('/api/alerts/scan').set('Authorization', `Bearer ${adminToken}`);
        const refetch = await request(app).get('/api/alerts').set('Authorization', `Bearer ${adminToken}`);
        alertToResolve = refetch.body.data.alerts[0];
      }

      expect(alertToResolve).toBeDefined();

      const patchRes = await request(app)
        .patch(`/api/alerts/${alertToResolve.id}/resolve`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.success).toBe(true);
      expect(patchRes.body.data.alert.resolved).toBe(true);
      expect(patchRes.body.data.alert.resolved_at).toBeDefined();
    });

    it('blocks customer role from resolving or accessing alerts', async () => {
      const getRes = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(getRes.status).toBe(403);
      expect(getRes.body.error.code).toBe('FORBIDDEN');

      const patchRes = await request(app)
        .patch('/api/alerts/1/resolve')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(patchRes.status).toBe(403);
      expect(patchRes.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks inventory_manager from deleting alerts (admin only)', async () => {
      const delRes = await request(app)
        .delete('/api/alerts/999999')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(delRes.status).toBe(403);
      expect(delRes.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 404 when resolving non-existent alert', async () => {
      const res = await request(app)
        .patch('/api/alerts/9999999/resolve')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
