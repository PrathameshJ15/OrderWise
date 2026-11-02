const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const { env } = require('../src/config/env');
const {
  calculateSupplierMetrics,
  getSupplierPerformanceOverview,
} = require('../src/services/supplierIntelligenceService');

describe('Phase 18: Supplier Performance Intelligence Acceptance Tests', () => {
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

  describe('1. Metric Calculations & Delivery Evaluation', () => {
    const mockSupplier = {
      id: 10,
      code: 'SUP-ACME',
      name: 'ACME Industrial Ltd',
      contact_email: 'supply@acme.example',
      lead_time_days: 7,
    };

    it('calculates 100% on-time delivery rate when all deliveries arrive on or before expected date', () => {
      const mockPOs = [
        {
          id: 1,
          supplier_id: 10,
          status: 'received',
          expected_delivery_date: '2026-10-15',
          actual_delivery_date: '2026-10-14', // 1 day early
          created_at: '2026-10-07T00:00:00Z',
        },
        {
          id: 2,
          supplier_id: 10,
          status: 'received',
          expected_delivery_date: '2026-10-25',
          actual_delivery_date: '2026-10-25', // On time
          created_at: '2026-10-18T00:00:00Z',
        },
      ];

      const metrics = calculateSupplierMetrics(mockSupplier, mockPOs);

      expect(metrics.has_sufficient_data).toBe(true);
      expect(metrics.data_status).toBe('VERIFIED_HISTORY');
      expect(metrics.on_time_delivery_rate_percent).toBe(100);
      expect(metrics.completed_deliveries_count).toBe(2);
      expect(metrics.reliability_rating).toBe('EXCELLENT');
    });

    it('detects delayed shipments and computes accurate variance when actual date exceeds expected date', () => {
      const mockPOs = [
        {
          id: 1,
          supplier_id: 10,
          status: 'received',
          expected_delivery_date: '2026-10-10',
          actual_delivery_date: '2026-10-10', // on-time
          created_at: '2026-10-03T00:00:00Z',
        },
        {
          id: 2,
          supplier_id: 10,
          status: 'received',
          expected_delivery_date: '2026-10-20',
          actual_delivery_date: '2026-10-26', // 6 days late!
          created_at: '2026-10-10T00:00:00Z',
        },
      ];

      const metrics = calculateSupplierMetrics(mockSupplier, mockPOs);

      expect(metrics.has_sufficient_data).toBe(true);
      expect(metrics.on_time_delivery_rate_percent).toBe(50); // 1 of 2 on time
      expect(metrics.average_actual_lead_time_days).toBeGreaterThan(mockSupplier.lead_time_days);
      expect(metrics.reliability_rating).toBe('NEEDS_ATTENTION');
    });

    it('identifies delayed-delivery indicators on active shipments past expected date', () => {
      const mockPOs = [
        {
          id: 1,
          po_number: 'PO-LATE-1',
          supplier_id: 10,
          status: 'ordered',
          expected_delivery_date: '2020-01-01', // definitely in the past
          actual_delivery_date: null,
        },
      ];

      const metrics = calculateSupplierMetrics(mockSupplier, mockPOs);

      expect(metrics.delayed_active_orders_count).toBe(1);
      expect(metrics.delayed_orders[0].po_number).toBe('PO-LATE-1');
    });

    it('strictly labels zero delivery history as INSUFFICIENT_DATA and NEVER invents scores', () => {
      const newSupplier = {
        id: 99,
        code: 'SUP-NEW',
        name: 'Brand New Supplier Corp',
        lead_time_days: 10,
      };

      const metrics = calculateSupplierMetrics(newSupplier, []);

      expect(metrics.has_sufficient_data).toBe(false);
      expect(metrics.data_status).toBe('INSUFFICIENT_DATA');
      expect(metrics.on_time_delivery_rate_percent).toBeNull();
      expect(metrics.average_actual_lead_time_days).toBeNull();
      expect(metrics.reliability_rating).toBe('UNRATED');
      expect(metrics.explanation).toContain('No completed purchase order deliveries');
    });

    it('safely handles missing delivery dates without NaN or crash', () => {
      const mockPOs = [
        {
          id: 1,
          supplier_id: 10,
          status: 'received',
          expected_delivery_date: null,
          actual_delivery_date: null,
        },
      ];

      const metrics = calculateSupplierMetrics(mockSupplier, mockPOs);
      expect(metrics.has_sufficient_data).toBe(false);
      expect(metrics.missing_dates_count).toBe(1);
    });
  });

  describe('2. Supplier Performance Overview Integration', () => {
    it('returns structured supplier performance overview across network', async () => {
      const overview = await getSupplierPerformanceOverview();

      expect(overview).toHaveProperty('suppliers');
      expect(overview).toHaveProperty('network_summary');
      expect(overview).toHaveProperty('meta');
      expect(overview.meta.classification).toBe('SUPPLIER_PERFORMANCE_INTELLIGENCE');
      expect(overview.suppliers.length).toBeGreaterThan(0);
    });
  });

  describe('3. REST API Endpoints & RBAC Protection', () => {
    it('GET /api/replenishment/suppliers/performance - accessible to admin and manager', async () => {
      const res = await request(app)
        .get('/api/replenishment/suppliers/performance')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.suppliers).toBeDefined();
    });

    it('enforces RBAC - rejects customer role with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/replenishment/suppliers/performance')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('enforces RBAC - rejects unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/replenishment/suppliers/performance');
      expect(res.status).toBe(401);
    });
  });
});

