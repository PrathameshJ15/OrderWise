const {
  calculateSupplierMetrics,
  getSupplierPerformanceOverview,
} = require('../src/services/supplierIntelligenceService');

describe('Phase 18: Supplier Performance Intelligence Acceptance Tests', () => {
  const dummySupplier = {
    id: 10,
    code: 'SUP-TEST',
    name: 'Test Precision Supplies',
    contact_email: 'test@precision.example',
    lead_time_days: 7,
  };

  describe('1. On-Time Delivery Rate & Actual Lead Time Calculations', () => {
    it('calculates 100% on-time delivery when all actual deliveries meet expected delivery date', () => {
      const pos = [
        {
          id: 1,
          supplier_id: 10,
          status: 'received',
          expected_delivery_date: '2026-10-15',
          actual_delivery_date: '2026-10-14', // on time
          created_at: '2026-10-07T00:00:00Z', // 7 days lead time
        },
        {
          id: 2,
          supplier_id: 10,
          status: 'received',
          expected_delivery_date: '2026-10-20',
          actual_delivery_date: '2026-10-20', // on time
          created_at: '2026-10-13T00:00:00Z', // 7 days lead time
        },
      ];

      const metrics = calculateSupplierMetrics(dummySupplier, pos);

      expect(metrics.has_sufficient_data).toBe(true);
      expect(metrics.data_status).toBe('VERIFIED_HISTORY');
      expect(metrics.on_time_delivery_rate_percent).toBe(100);
      expect(metrics.average_actual_lead_time_days).toBe(7);
      expect(metrics.lead_time_variance_days).toBe(0);
      expect(metrics.reliability_rating).toBe('EXCELLENT');
    });

    it('accurately computes degraded on-time rate when shipments arrive past expected delivery date', () => {
      const pos = [
        {
          id: 1,
          supplier_id: 10,
          status: 'received',
          expected_delivery_date: '2026-10-10',
          actual_delivery_date: '2026-10-14', // 4 days late
          created_at: '2026-10-01T00:00:00Z', // 13 days lead time
        },
        {
          id: 2,
          supplier_id: 10,
          status: 'received',
          expected_delivery_date: '2026-10-20',
          actual_delivery_date: '2026-10-20', // on time
          created_at: '2026-10-13T00:00:00Z', // 7 days lead time
        },
      ];

      const metrics = calculateSupplierMetrics(dummySupplier, pos);

      expect(metrics.has_sufficient_data).toBe(true);
      expect(metrics.on_time_delivery_rate_percent).toBe(50); // 1 out of 2
      expect(metrics.average_actual_lead_time_days).toBe(10); // (13 + 7)/2
      expect(metrics.lead_time_variance_days).toBe(3); // 10 - 7
      expect(metrics.reliability_rating).toBe('NEEDS_ATTENTION');
    });
  });

  describe('2. Safe Handling of Insufficient or Missing Delivery History', () => {
    it('returns INSUFFICIENT_DATA and UNRATED without inventing fake scores when zero completed deliveries exist', () => {
      const pos = [
        {
          id: 1,
          supplier_id: 10,
          status: 'draft',
          expected_delivery_date: null,
          actual_delivery_date: null,
        },
      ];

      const metrics = calculateSupplierMetrics(dummySupplier, pos);

      expect(metrics.has_sufficient_data).toBe(false);
      expect(metrics.data_status).toBe('INSUFFICIENT_DATA');
      expect(metrics.on_time_delivery_rate_percent).toBeNull();
      expect(metrics.average_actual_lead_time_days).toBeNull();
      expect(metrics.reliability_rating).toBe('UNRATED');
      expect(metrics.explanation).toContain('No completed purchase order deliveries');
    });

    it('returns null when supplier object is undefined or invalid', () => {
      expect(calculateSupplierMetrics(null)).toBeNull();
    });
  });

  describe('3. Delayed Active Shipment Detection', () => {
    it('flags active purchase orders where expected delivery date has passed', () => {
      const pastDate = '2025-01-01';
      const pos = [
        {
          id: 99,
          po_number: 'PO-DELAYED-1',
          supplier_id: 10,
          status: 'ordered',
          expected_delivery_date: pastDate,
          actual_delivery_date: null,
        },
      ];

      const metrics = calculateSupplierMetrics(dummySupplier, pos);

      expect(metrics.delayed_active_orders_count).toBe(1);
      expect(metrics.delayed_orders).toHaveLength(1);
      expect(metrics.delayed_orders[0].po_number).toBe('PO-DELAYED-1');
    });
  });

  describe('4. Multi-Supplier Network Overview', () => {
    it('returns structured scorecard and network summary overview', async () => {
      const overview = await getSupplierPerformanceOverview();

      expect(overview).toHaveProperty('suppliers');
      expect(overview).toHaveProperty('network_summary');
      expect(overview).toHaveProperty('meta');
      expect(overview.meta.classification).toBe('SUPPLIER_PERFORMANCE_INTELLIGENCE');
      expect(overview.suppliers.length).toBeGreaterThan(0);
      expect(overview.network_summary.total_active_suppliers).toBeGreaterThan(0);
    });

    it('filters for a single supplier when supplierId option is provided', async () => {
      const overview = await getSupplierPerformanceOverview({ supplierId: 1 });

      expect(overview.suppliers).toHaveLength(1);
      expect(overview.suppliers[0].supplier_id).toBe(1);
    });
  });
});
