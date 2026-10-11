const request = require('supertest');
const app = require('../src/app');
const { query, pool } = require('../src/config/db');
const { seed } = require('../src/db/seeds/demo');
const {
  validateSupplierData,
  validateDemandPeriod,
  getReplenishmentRecommendations,
  createDraftPurchaseOrder,
  approvePurchaseOrder,
} = require('../src/services/replenishmentService');
const {
  scanAndGenerateAlerts,
  getAlerts,
  acknowledgeAlert,
  resolveAlert,
} = require('../src/services/alertService');

describe('Phase 11: Supply Intelligence (Alerts and Replenishment) Acceptance Gate Tests', () => {
  let adminToken;
  let managerToken;
  let customerToken;
  let pressureGaugeId;
  let pumpId;
  let supplierGaugeId;

  beforeAll(async () => {
    // Fresh database seed
    await seed();

    // Login admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@orderwise.com', password: 'Admin123!' });
    adminToken = adminLogin.body.data.token;

    // Login inventory manager
    const managerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'manager@orderwise.com', password: 'Manager123!' });
    managerToken = managerLogin.body.data.token;

    // Login customer
    const customerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@demo.com', password: 'Alice123!' });
    customerToken = customerLogin.body.data.token;

    // Fetch product & supplier IDs
    const gaugeRes = await query("SELECT id FROM products WHERE sku = 'GAUGE-P300'");
    pressureGaugeId = gaugeRes.rows[0].id;

    const pumpRes = await query("SELECT id FROM products WHERE sku = 'PUMP-X100'");
    pumpId = pumpRes.rows[0].id;

    const supRes = await query("SELECT id FROM suppliers WHERE code = 'SUP-GAUGEMASTER'");
    supplierGaugeId = supRes.rows[0].id;
  });

  describe('1. Acceptance Gate: Low Stock Condition', () => {
    it('detects low stock & below reorder point and recommends replenishment', async () => {
      // Set Pressure Gauge Pro to low stock (on_hand = 8, reserved = 0, safety = 10, reorder = 20)
      await query(
        'UPDATE inventory SET on_hand_quantity = 8, reserved_quantity = 0, safety_stock = 10, reorder_point = 20 WHERE product_id = $1',
        [pressureGaugeId]
      );

      // Run alert scan
      const scanResult = await scanAndGenerateAlerts();
      expect(scanResult).toBeDefined();

      // Verify alert generation via GET /api/alerts
      const alertsRes = await request(app)
        .get(`/api/alerts?product_id=${pressureGaugeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(alertsRes.status).toBe(200);
      const alerts = alertsRes.body.data.alerts;

      const lowStockAlert = alerts.find(
        (a) => a.alert_type === 'low_stock' && parseInt(a.product_id, 10) === parseInt(pressureGaugeId, 10)
      );
      expect(lowStockAlert).toBeDefined();
      expect(lowStockAlert.severity).toMatch(/warning|critical/);
      expect(lowStockAlert.recommended_action).toBeDefined();
      expect(lowStockAlert.status).toBe('active');

      // Verify replenishment recommendations via GET /api/replenishment
      const repRes = await request(app)
        .get('/api/replenishment')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(repRes.status).toBe(200);
      const gaugeRep = repRes.body.data.recommendations.find(
        (r) => parseInt(r.product_id, 10) === parseInt(pressureGaugeId, 10)
      );

      expect(gaugeRep).toBeDefined();
      expect(gaugeRep.needs_replenishment).toBe(true);
      expect(gaugeRep.inventory_position).toBeLessThanOrEqual(gaugeRep.effective_reorder_point);
      expect(gaugeRep.suggested_reorder_quantity).toBeGreaterThan(0);
      expect(gaugeRep.is_estimate).toBe(true);
      expect(gaugeRep.formula_breakdown).toBeDefined();
    });
  });

  describe('2. Acceptance Gate: Sufficient Stock Condition', () => {
    it('verifies product with sufficient stock does NOT trigger alerts or replenishment', async () => {
      // Control Panel Unit (stock = 200, reserved = 0, safety = 25, reorder = 50)
      const ctrlRes = await query("SELECT id FROM products WHERE sku = 'CTRL-U400'");
      const ctrlId = ctrlRes.rows[0].id;

      await query(
        'UPDATE inventory SET on_hand_quantity = 250, reserved_quantity = 0, safety_stock = 25, reorder_point = 50 WHERE product_id = $1',
        [ctrlId]
      );

      const repRes = await request(app)
        .get('/api/replenishment')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(repRes.status).toBe(200);
      const ctrlRep = repRes.body.data.recommendations.find(
        (r) => parseInt(r.product_id, 10) === parseInt(ctrlId, 10)
      );

      expect(ctrlRep).toBeDefined();
      expect(ctrlRep.needs_replenishment).toBe(false);
      expect(ctrlRep.shortage_risk).toBe('low');
      expect(ctrlRep.suggested_reorder_quantity).toBe(0);

      // Verify no active low_stock or stockout alerts for this product
      const alertsRes = await request(app)
        .get(`/api/alerts?product_id=${ctrlId}&status=active`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(alertsRes.status).toBe(200);
      const activeAlerts = alertsRes.body.data.alerts;
      expect(activeAlerts.find((a) => a.alert_type === 'low_stock')).toBeUndefined();
      expect(activeAlerts.find((a) => a.alert_type === 'potential_stockout')).toBeUndefined();
    });
  });

  describe('3. Acceptance Gate: Incoming Stock Factor in Inventory Position', () => {
    it('confirmed incoming stock raises Inventory Position (On-Hand + Incoming - Reserved)', async () => {
      // 1. Initial state: on_hand = 15, reserved = 0, safety = 10, reorder = 30
      await query(
        'UPDATE inventory SET on_hand_quantity = 15, reserved_quantity = 0, safety_stock = 10, reorder_point = 30 WHERE product_id = $1',
        [pressureGaugeId]
      );

      // Before incoming PO: inventory position is 15 <= 30 (needs replenishment)
      const beforeRep = await getReplenishmentRecommendations(30);
      const beforeGauge = beforeRep.recommendations.find(
        (r) => parseInt(r.product_id, 10) === parseInt(pressureGaugeId, 10)
      );
      expect(beforeGauge.confirmed_incoming).toBe(0);
      expect(beforeGauge.inventory_position).toBe(15);
      expect(beforeGauge.needs_replenishment).toBe(true);

      // 2. Create and approve a purchase order for 50 units (status: 'ordered')
      const draftPo = await createDraftPurchaseOrder({
        supplierId: supplierGaugeId,
        items: [{ product_id: pressureGaugeId, quantity: 50 }],
        notes: 'Replenishment order for Pressure Gauge Pro',
        userId: 1,
      });

      expect(draftPo.status).toBe('draft');

      // Admin approves draft PO -> transitions to 'ordered'
      const approvedPo = await approvePurchaseOrder(draftPo.id, 1);
      expect(approvedPo.status).toBe('ordered');

      // 3. After incoming PO: Inventory Position = 15 + 50 - 0 = 65 > 30 (replenishment satisfied)
      const afterRep = await getReplenishmentRecommendations(30);
      const afterGauge = afterRep.recommendations.find(
        (r) => parseInt(r.product_id, 10) === parseInt(pressureGaugeId, 10)
      );

      expect(afterGauge.confirmed_incoming).toBe(50);
      expect(afterGauge.inventory_position).toBe(65);
      expect(afterGauge.needs_replenishment).toBe(false);

      // Clean up test PO
      await query('DELETE FROM purchase_orders WHERE id = $1', [draftPo.id]);
    });
  });

  describe('4. Acceptance Gate: No Demand History Handling & Limitation Labeling', () => {
    let zeroDemandProdId;

    beforeAll(async () => {
      // Create brand new product with zero order history
      const newProdRes = await query(
        `INSERT INTO products (sku, name, description, unit, active, default_lead_time_days)
         VALUES ('SENSOR-NEW01', 'Novel IoT Sensor Prototype', 'Prototype with zero past demand', 'units', true, 10)
         RETURNING id`
      );
      zeroDemandProdId = newProdRes.rows[0].id;

      await query(
        `INSERT INTO inventory (product_id, on_hand_quantity, reserved_quantity, safety_stock, reorder_point)
         VALUES ($1, 20, 0, 5, 10)`,
        [zeroDemandProdId]
      );
    });

    it('correctly detects lack of demand history and states explicit limitation note without errors', async () => {
      const repData = await getReplenishmentRecommendations(30);
      const zeroProdRep = repData.recommendations.find(
        (r) => parseInt(r.product_id, 10) === parseInt(zeroDemandProdId, 10)
      );

      expect(zeroProdRep).toBeDefined();
      expect(zeroProdRep.total_demand_in_period).toBe(0);
      expect(zeroProdRep.order_count_in_period).toBe(0);
      expect(zeroProdRep.average_daily_demand).toBe(0);
      expect(zeroProdRep.has_sufficient_demand_history).toBe(false);

      // Limitation stated explicitly
      expect(zeroProdRep.limitation_note).toContain('No demand history recorded');
      expect(zeroProdRep.limitation_note).toContain('preliminary baseline estimates');

      // Formula breakdown and estimate label
      expect(zeroProdRep.is_estimate).toBe(true);
      expect(zeroProdRep.estimate_label).toContain('estimates');
      expect(isNaN(zeroProdRep.calculated_reorder_point)).toBe(false);
    });

    afterAll(async () => {
      await query('DELETE FROM inventory WHERE product_id = $1', [zeroDemandProdId]);
      await query('DELETE FROM products WHERE id = $1', [zeroDemandProdId]);
    });
  });

  describe('5. Acceptance Gate: Invalid Supplier Data Validation', () => {
    it('validates supplier lead time and handles invalid/missing supplier gracefully', () => {
      // Null supplier
      const resNull = validateSupplierData(null, 7);
      expect(resNull.isValid).toBe(false);
      expect(resNull.leadTimeDays).toBe(7);
      expect(resNull.warning).toContain('Supplier information is missing');

      // Negative lead time
      const resNegative = validateSupplierData({ name: 'Faulty Vendor', lead_time_days: -5 }, 10);
      expect(resNegative.isValid).toBe(false);
      expect(resNegative.leadTimeDays).toBe(10);
      expect(resNegative.error).toContain('Invalid supplier lead time');

      // Zero lead time
      const resZero = validateSupplierData({ name: 'Zero Vendor', lead_time_days: 0 }, 5);
      expect(resZero.isValid).toBe(false);
      expect(resZero.leadTimeDays).toBe(5);

      // Valid supplier
      const resValid = validateSupplierData({ name: 'Good Vendor', lead_time_days: 14 });
      expect(resValid.isValid).toBe(true);
      expect(resValid.leadTimeDays).toBe(14);
      expect(resValid.error).toBeNull();
    });

    it('validates demand period parameter', () => {
      expect(validateDemandPeriod(30)).toBe(30);
      expect(validateDemandPeriod('45')).toBe(45);
      expect(() => validateDemandPeriod(-5)).toThrow(/positive integer/);
      expect(() => validateDemandPeriod('invalid')).toThrow(/positive integer/);
    });
  });

  describe('6. Governance & Purchase Order Workflow (Never auto-create POs)', () => {
    it('creates draft PO via POST /api/replenishment/draft-po with status draft', async () => {
      const res = await request(app)
        .post('/api/replenishment/draft-po')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          supplier_id: supplierGaugeId,
          items: [{ product_id: pressureGaugeId, quantity: 25 }],
          notes: 'Test manual replenishment order',
        });

      expect(res.status).toBe(201);
      const po = res.body.data.purchase_order;
      expect(po.status).toBe('draft');
      expect(po.items).toHaveLength(1);
      expect(po.items[0].quantity_ordered).toBe(25);

      // Admin approves draft PO via PATCH /api/replenishment/po/:id/approve
      const approveRes = await request(app)
        .patch(`/api/replenishment/po/${po.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.purchase_order.status).toBe('ordered');

      // Clean up
      await query('DELETE FROM purchase_orders WHERE id = $1', [po.id]);
    });

    it('rejects customer role from creating or approving purchase orders', async () => {
      const resCreate = await request(app)
        .post('/api/replenishment/draft-po')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ supplier_id: supplierGaugeId, items: [{ product_id: pressureGaugeId, quantity: 10 }] });

      expect(resCreate.status).toBe(403);
    });
  });

  describe('7. Alert Deduplication, Acknowledge & Resolve Lifecycle', () => {
    it('avoids creating duplicate alerts for the same condition', async () => {
      // Run scan twice in succession
      const scan1 = await scanAndGenerateAlerts();
      const scan2 = await scanAndGenerateAlerts();

      // Second scan should create 0 duplicates for unchanged conditions
      expect(scan2.newly_created_count).toBe(0);
    });

    it('supports acknowledge and resolve lifecycle on active alerts', async () => {
      // Fetch an active alert
      const alertsRes = await request(app)
        .get('/api/alerts?status=active')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(alertsRes.status).toBe(200);
      const alerts = alertsRes.body.data.alerts;

      if (alerts.length > 0) {
        const targetAlert = alerts[0];

        // 1. Acknowledge
        const ackRes = await request(app)
          .patch(`/api/alerts/${targetAlert.id}/acknowledge`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(ackRes.status).toBe(200);
        expect(ackRes.body.data.alert.status).toBe('acknowledged');

        // 2. Resolve
        const resRes = await request(app)
          .patch(`/api/alerts/${targetAlert.id}/resolve`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(resRes.status).toBe(200);
        expect(resRes.body.data.alert.status).toBe('resolved');
      }
    });
  });

  afterAll(async () => {
    // Restore demo seed
    await seed();
  });
});
