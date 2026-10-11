const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const { env } = require('../src/config/env');
const intelligenceService = require('../src/services/intelligenceService');

describe('Phase 18 (Stretch): Advanced Intelligence & Explainability', () => {
  const adminToken = jwt.sign(
    { userId: 1, id: 1, role: 'admin', email: 'admin@orderwise.com', name: 'Admin User' },
    env.JWT_SECRET
  );

  const managerToken = jwt.sign(
    { userId: 2, id: 2, role: 'inventory_manager', email: 'manager@orderwise.com', name: 'Inventory Manager' },
    env.JWT_SECRET
  );

  const customerToken = jwt.sign(
    { userId: 3, id: 3, role: 'customer', email: 'alice@demo.com', name: 'Alice Customer' },
    env.JWT_SECRET
  );

  describe('1. Demand Forecasting Mathematical Models', () => {
    it('calculates Single Exponential Smoothing (SES) with widening 95% confidence interval', () => {
      const series = [100, 110, 115, 120, 125, 130];
      const result = intelligenceService.calculateExponentialSmoothing(series, 0.3, 3);

      expect(result.forecast).toHaveLength(3);
      expect(result.model_params.confidence_level).toBe('95%');
      expect(result.model_params.algorithm).toContain('Exponential Smoothing');

      const f1 = result.forecast[0];
      const f2 = result.forecast[1];
      const f3 = result.forecast[2];

      // Point forecasts are positive numbers
      expect(f1.point_forecast).toBeGreaterThan(0);
      // Lower bound <= point forecast <= Upper bound
      expect(f1.lower_bound_95).toBeLessThanOrEqual(f1.point_forecast);
      expect(f1.upper_bound_95).toBeGreaterThanOrEqual(f1.point_forecast);

      // Prediction interval margin expands as forecast horizon h increases
      const interval1 = f1.upper_bound_95 - f1.lower_bound_95;
      const interval3 = f3.upper_bound_95 - f3.lower_bound_95;
      expect(interval3).toBeGreaterThanOrEqual(interval1);
    });

    it('calculates Simple Moving Average (SMA) rolling forecasts', () => {
      const series = [50, 60, 70];
      const forecast = intelligenceService.calculateMovingAverage(series, 3, 2);

      expect(forecast).toHaveLength(2);
      expect(forecast[0].point_forecast).toBe(60); // (50+60+70)/3 = 60
      expect(forecast[0].window_size).toBe(3);
    });

    it('handles empty or short historical series safely without throwing', () => {
      const emptySes = intelligenceService.calculateExponentialSmoothing([], 0.3);
      expect(emptySes).toEqual([]);

      const shortSma = intelligenceService.calculateMovingAverage([10], 3);
      expect(shortSma).toEqual([]);
    });
  });

  describe('2. Fairness, Service Metrics & Anti-Starvation Governance', () => {
    it('evaluates priority fill rates, on-time delivery and flags starved orders', async () => {
      const metrics = await intelligenceService.getFairnessAndServiceMetrics();

      expect(metrics).toHaveProperty('fill_rate_by_priority');
      expect(metrics).toHaveProperty('overall_service_level');
      expect(metrics).toHaveProperty('anti_starvation_monitor');

      // Check priority tiers are evaluated
      const levels = metrics.fill_rate_by_priority.map((p) => p.priority_level);
      expect(levels).toEqual(expect.arrayContaining(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']));

      // On-time rate is a valid percentage
      expect(typeof metrics.overall_service_level.on_time_delivery_rate_percent).toBe('number');
      expect(metrics.overall_service_level.on_time_delivery_rate_percent).toBeGreaterThanOrEqual(0);
      expect(metrics.overall_service_level.on_time_delivery_rate_percent).toBeLessThanOrEqual(100);

      // Anti-starvation monitor strictly requires human approval for aging actions
      if (metrics.anti_starvation_monitor.starved_orders.length > 0) {
        const sampleStarved = metrics.anti_starvation_monitor.starved_orders[0];
        expect(sampleStarved.suggested_aging_action.requires_human_approval).toBe(true);
        expect(sampleStarved.suggested_aging_action.policy_status).toBe('PROPOSED_ADVISORY_ONLY');
        expect(sampleStarved.suggested_aging_action.disclaimer).toContain('CANNOT be executed automatically');
      }
    });
  });

  describe('3. Natural-Language Run Explainability Synthesis', () => {
    it('synthesizes human-readable narrative run summary identifying bottlenecks', () => {
      const fakeRun = {
        id: 42,
        total_items_processed: 3,
        fulfilled_count: 1,
        partially_fulfilled_count: 0,
        deferred_count: 2,
      };

      const fakeResults = [
        {
          order_item_id: 1,
          customer_name: 'Charlie Heavy Industries',
          product_name: 'Pressure Gauge Pro',
          product_sku: 'GAUGE-P300',
          requested_quantity: 30,
          allocated_quantity: 30,
          status: 'fulfilled',
        },
        {
          order_item_id: 2,
          customer_name: 'Alice Manufacturing',
          product_name: 'Pressure Gauge Pro',
          product_sku: 'GAUGE-P300',
          requested_quantity: 25,
          allocated_quantity: 0,
          status: 'deferred',
        },
        {
          order_item_id: 3,
          customer_name: 'Bob Precision Tools',
          product_name: 'Pressure Gauge Pro',
          product_sku: 'GAUGE-P300',
          requested_quantity: 20,
          allocated_quantity: 0,
          status: 'deferred',
        },
      ];

      const explanation = intelligenceService.generateRunExplanation(fakeRun, fakeResults);

      expect(explanation.run_id).toBe(42);
      expect(explanation.headline).toContain('Run #42');
      expect(explanation.headline).toContain('Pressure Gauge Pro');
      expect(explanation.key_bottleneck_product).toBe('Pressure Gauge Pro');
      expect(explanation.narrative_summary).toContain('fulfilled 1 completely');
      expect(explanation.narrative_summary).toContain('critical inventory bottleneck was Pressure Gauge Pro');
      expect(explanation.classification).toBe('EXPLAINABLE_AI_SYNTHESIS');
    });

    it('handles smooth runs without deferrals accurately in narrative', () => {
      const fakeRun = { id: 10, total_items_processed: 2, fulfilled_count: 2, deferred_count: 0 };
      const fakeResults = [
        {
          order_item_id: 1,
          customer_name: 'Alpha Corp',
          product_name: 'Industrial Pump',
          requested_quantity: 10,
          allocated_quantity: 10,
          status: 'fulfilled',
        },
      ];

      const explanation = intelligenceService.generateRunExplanation(fakeRun, fakeResults);
      expect(explanation.headline).toContain('100% fill rate');
      expect(explanation.narrative_summary).toContain('Warehouse stock was adequate');
    });
  });

  describe('4. Multi-Warehouse Topology & Inventory Distribution', () => {
    it('provides multi-node warehouse network summary and balance', () => {
      const overview = intelligenceService.getMultiWarehouseOverview();

      expect(overview.warehouses).toHaveLength(3);
      expect(overview.network_summary.total_warehouses).toBe(3);
      expect(overview.network_summary.network_total_stock).toBeGreaterThan(0);
      expect(overview.routing_strategy).toBe('PROXIMITY_FIRST_WITH_STOCK_FALLBACK');
      expect(overview.classification).toBe('MULTI_WAREHOUSE_STRETCH_EXPERIMENTAL');

      const nodeCodes = overview.warehouses.map((w) => w.code);
      expect(nodeCodes).toContain('ORD-CENTRAL');
      expect(nodeCodes).toContain('RNO-WEST');
      expect(nodeCodes).toContain('ABE-EAST');
    });
  });

  describe('5. Advanced Intelligence REST API Endpoints & RBAC Guards', () => {
    it('GET /api/intelligence/forecast - returns demand projections with disclaimer for admin', async () => {
      const res = await request(app)
        .get('/api/intelligence/forecast')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.forecasts.length).toBeGreaterThan(0);

      const firstForecast = res.body.data.forecasts[0];
      expect(firstForecast.status_label).toBe('EXPERIMENTAL_ESTIMATE');
      expect(firstForecast.disclaimer).toContain('algorithmic estimate');
      expect(firstForecast.exponential_smoothing).toBeDefined();
    });

    it('GET /api/intelligence/forecast - supports filtering by product_id and alpha parameter', async () => {
      const res = await request(app)
        .get('/api/intelligence/forecast?product_id=3&alpha=0.5')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.meta.smoothing_alpha).toBe(0.5);
      expect(res.body.data.forecasts.every((f) => f.product_id === 3)).toBe(true);
    });

    it('GET /api/intelligence/fairness - returns fairness and service metrics for admin/manager', async () => {
      const res = await request(app)
        .get('/api/intelligence/fairness')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fill_rate_by_priority).toBeDefined();
      expect(res.body.data.anti_starvation_monitor).toBeDefined();
    });

    it('GET /api/intelligence/explain/:runId - returns narrative summary for an existing run', async () => {
      const res = await request(app)
        .get('/api/intelligence/explain/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.headline).toBeDefined();
      expect(res.body.data.narrative_summary).toBeDefined();
      expect(res.body.data.classification).toBe('EXPLAINABLE_AI_SYNTHESIS');
    });

    it('GET /api/intelligence/warehouses - returns multi-warehouse overview', async () => {
      const res = await request(app)
        .get('/api/intelligence/warehouses')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.warehouses).toHaveLength(3);
    });

    it('enforces RBAC - denies unauthenticated requests (401)', async () => {
      const res = await request(app).get('/api/intelligence/forecast');
      expect(res.status).toBe(401);
    });

    it('enforces RBAC - denies customer role from intelligence endpoints (403)', async () => {
      const resForecast = await request(app)
        .get('/api/intelligence/forecast')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(resForecast.status).toBe(403);

      const resFairness = await request(app)
        .get('/api/intelligence/fairness')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(resFairness.status).toBe(403);

      const resExplain = await request(app)
        .get('/api/intelligence/explain/1')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(resExplain.status).toBe(403);

      const resWarehouses = await request(app)
        .get('/api/intelligence/warehouses')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(resWarehouses.status).toBe(403);
    });
  });
});
