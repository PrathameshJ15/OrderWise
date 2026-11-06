/**
 * Demo in-memory fallback store used when PostgreSQL connection is unavailable.
 * Ensures the entire application is fully usable for demonstrations without external dependencies.
 */

class DemoStore {
  constructor() {
    this.products = [
      { id: 1, sku: 'PLC-001', name: 'PLC Control Module', category: 'Industrial Automation', unit: 'Piece', price: '850.00', description: 'Modular programmable logic controller with real-time fieldbus interface', active: true, created_at: new Date().toISOString() },
      { id: 2, sku: 'IPS-002', name: 'Industrial Pressure Sensor', category: 'Sensors', unit: 'Piece', price: '320.00', description: 'High precision analog pressure sensor with 4-20mA output (Scarce)', active: true, created_at: new Date().toISOString() },
      { id: 3, sku: 'SVM-003', name: 'Servo Motor', category: 'Motors & Drives', unit: 'Piece', price: '550.00', description: 'High-torque AC brushless servo motor with optical encoder feedback', active: true, created_at: new Date().toISOString() },
      { id: 4, sku: 'VFD-004', name: 'Variable Frequency Drive', category: 'Motors & Drives', unit: 'Piece', price: '720.00', description: 'Three-phase variable speed drive with regenerative braking support', active: true, created_at: new Date().toISOString() },
      { id: 5, sku: 'PRS-005', name: 'Proximity Sensor', category: 'Sensors', unit: 'Piece', price: '85.00', description: 'Inductive proximity sensor, shielded stainless steel housing', active: true, created_at: new Date().toISOString() },
      { id: 6, sku: 'TMS-006', name: 'Temperature Sensor', category: 'Sensors', unit: 'Piece', price: '95.00', description: 'RTD Pt100 industrial temperature probe with transmitter head', active: true, created_at: new Date().toISOString() },
      { id: 7, sku: 'PSU-007', name: 'Industrial Power Supply', category: 'Electrical Components', unit: 'Piece', price: '210.00', description: 'DIN-rail mounted 24VDC 20A regulated industrial switching power supply', active: true, created_at: new Date().toISOString() },
      { id: 8, sku: 'PCV-008', name: 'Pneumatic Control Valve', category: 'Pneumatic Components', unit: 'Piece', price: '175.00', description: '5/2 way solenoid-actuated directional pneumatic spool valve', active: true, created_at: new Date().toISOString() },
      { id: 9, sku: 'ICT-009', name: 'Industrial Contactor', category: 'Electrical Components', unit: 'Piece', price: '65.00', description: '3-pole motor switching contactor rated for 32A AC-3 duty', active: true, created_at: new Date().toISOString() },
      { id: 10, sku: 'PBB-010', name: 'Precision Ball Bearing', category: 'Mechanical Components', unit: 'Piece', price: '45.00', description: 'Deep groove precision radial ball bearing with synthetic grease seal', active: true, created_at: new Date().toISOString() },
      { id: 11, sku: 'HPA-011', name: 'Hydraulic Pump Assembly', category: 'Hydraulic Components', unit: 'Piece', price: '1250.00', description: 'Variable displacement axial piston hydraulic pump assembly', active: true, created_at: new Date().toISOString() },
      { id: 12, sku: 'PNC-012', name: 'Pneumatic Cylinder', category: 'Pneumatic Components', unit: 'Piece', price: '160.00', description: 'Double-acting ISO 15552 standard pneumatic cylinder 63mm bore', active: true, created_at: new Date().toISOString() },
      { id: 13, sku: 'ICB-013', name: 'Industrial Circuit Board', category: 'Electronic Components', unit: 'Piece', price: '390.00', description: 'Multi-layer conformal coated processing board with surge protection', active: true, created_at: new Date().toISOString() },
      { id: 14, sku: 'GBA-014', name: 'Gearbox Assembly', category: 'Mechanical Components', unit: 'Piece', price: '980.00', description: 'Heavy-duty helical planetary reduction gearbox 15:1 ratio', active: true, created_at: new Date().toISOString() },
      { id: 15, sku: 'ICF-015', name: 'Industrial Cooling Fan', category: 'Electrical Components', unit: 'Piece', price: '115.00', description: 'Brushless IP68 high-airflow cabinet cooling blower fan', active: true, created_at: new Date().toISOString() },
    ];

    this.inventory = [
      { product_id: 1, sku: 'PLC-001', product_name: 'PLC Control Module', on_hand_quantity: 120, reserved_quantity: 0, available_quantity: 120, safety_stock: 15, reorder_point: 25, version: 1, updated_at: new Date().toISOString() },
      { product_id: 2, sku: 'IPS-002', product_name: 'Industrial Pressure Sensor', on_hand_quantity: 40, reserved_quantity: 0, available_quantity: 40, safety_stock: 10, reorder_point: 20, version: 1, updated_at: new Date().toISOString() },
      { product_id: 3, sku: 'SVM-003', product_name: 'Servo Motor', on_hand_quantity: 90, reserved_quantity: 0, available_quantity: 90, safety_stock: 15, reorder_point: 30, version: 1, updated_at: new Date().toISOString() },
      { product_id: 4, sku: 'VFD-004', product_name: 'Variable Frequency Drive', on_hand_quantity: 75, reserved_quantity: 0, available_quantity: 75, safety_stock: 10, reorder_point: 20, version: 1, updated_at: new Date().toISOString() },
      { product_id: 5, sku: 'PRS-005', product_name: 'Proximity Sensor', on_hand_quantity: 180, reserved_quantity: 0, available_quantity: 180, safety_stock: 25, reorder_point: 50, version: 1, updated_at: new Date().toISOString() },
      { product_id: 6, sku: 'TMS-006', product_name: 'Temperature Sensor', on_hand_quantity: 160, reserved_quantity: 0, available_quantity: 160, safety_stock: 20, reorder_point: 40, version: 1, updated_at: new Date().toISOString() },
      { product_id: 7, sku: 'PSU-007', product_name: 'Industrial Power Supply', on_hand_quantity: 110, reserved_quantity: 0, available_quantity: 110, safety_stock: 15, reorder_point: 30, version: 1, updated_at: new Date().toISOString() },
      { product_id: 8, sku: 'PCV-008', product_name: 'Pneumatic Control Valve', on_hand_quantity: 85, reserved_quantity: 0, available_quantity: 85, safety_stock: 12, reorder_point: 25, version: 1, updated_at: new Date().toISOString() },
      { product_id: 9, sku: 'ICT-009', product_name: 'Industrial Contactor', on_hand_quantity: 220, reserved_quantity: 0, available_quantity: 220, safety_stock: 30, reorder_point: 60, version: 1, updated_at: new Date().toISOString() },
      { product_id: 10, sku: 'PBB-010', product_name: 'Precision Ball Bearing', on_hand_quantity: 350, reserved_quantity: 0, available_quantity: 350, safety_stock: 50, reorder_point: 100, version: 1, updated_at: new Date().toISOString() },
      { product_id: 11, sku: 'HPA-011', product_name: 'Hydraulic Pump Assembly', on_hand_quantity: 55, reserved_quantity: 0, available_quantity: 55, safety_stock: 8, reorder_point: 15, version: 1, updated_at: new Date().toISOString() },
      { product_id: 12, sku: 'PNC-012', product_name: 'Pneumatic Cylinder', on_hand_quantity: 130, reserved_quantity: 0, available_quantity: 130, safety_stock: 18, reorder_point: 35, version: 1, updated_at: new Date().toISOString() },
      { product_id: 13, sku: 'ICB-013', product_name: 'Industrial Circuit Board', on_hand_quantity: 95, reserved_quantity: 0, available_quantity: 95, safety_stock: 12, reorder_point: 25, version: 1, updated_at: new Date().toISOString() },
      { product_id: 14, sku: 'GBA-014', product_name: 'Gearbox Assembly', on_hand_quantity: 60, reserved_quantity: 0, available_quantity: 60, safety_stock: 10, reorder_point: 20, version: 1, updated_at: new Date().toISOString() },
      { product_id: 15, sku: 'ICF-015', product_name: 'Industrial Cooling Fan', on_hand_quantity: 140, reserved_quantity: 0, available_quantity: 140, safety_stock: 20, reorder_point: 40, version: 1, updated_at: new Date().toISOString() },
    ];

    this.movements = [
      { id: 1, product_id: 3, sku: 'GAUGE-P300', delta: 40, resulting_on_hand: 40, reason: 'Initial inventory deposit', actor_name: 'Inventory Manager', created_at: new Date().toISOString() }
    ];

    this.orders = [
      {
        id: 101,
        customer_id: 3,
        customer_name: 'Alice Customer',
        customer_email: 'alice@demo.com',
        status: 'pending',
        priority_level: 'HIGH',
        approved_priority: 'HIGH',
        total_requested_quantity: 25,
        item_count: 1,
        promised_delivery_date: '2026-10-25',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        items: [
          { id: 1, order_id: 101, product_id: 3, product_name: 'Pressure Gauge Pro', product_sku: 'GAUGE-P300', requested_quantity: 25, allocated_quantity: 0, minimum_acceptable_quantity: 15, partial_delivery_allowed: true, status: 'pending' }
        ]
      },
      {
        id: 102,
        customer_id: 4,
        customer_name: 'Bob Customer',
        customer_email: 'bob@demo.com',
        status: 'pending',
        priority_level: 'MEDIUM',
        approved_priority: 'MEDIUM',
        total_requested_quantity: 20,
        item_count: 1,
        promised_delivery_date: '2026-10-26',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        items: [
          { id: 2, order_id: 102, product_id: 3, product_name: 'Pressure Gauge Pro', product_sku: 'GAUGE-P300', requested_quantity: 20, allocated_quantity: 0, minimum_acceptable_quantity: 20, partial_delivery_allowed: false, status: 'pending' }
        ]
      },
      {
        id: 103,
        customer_id: 5,
        customer_name: 'Charlie Customer',
        customer_email: 'charlie@demo.com',
        status: 'pending',
        priority_level: 'HIGH',
        approved_priority: 'HIGH',
        total_requested_quantity: 30,
        item_count: 1,
        promised_delivery_date: '2026-10-20',
        created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
        items: [
          { id: 3, order_id: 103, product_id: 3, product_name: 'Pressure Gauge Pro', product_sku: 'GAUGE-P300', requested_quantity: 30, allocated_quantity: 0, minimum_acceptable_quantity: 10, partial_delivery_allowed: true, status: 'pending' }
        ]
      },
      {
        id: 104,
        customer_id: 3,
        customer_name: 'Alice Customer',
        customer_email: 'alice@demo.com',
        status: 'confirmed',
        priority_level: 'MEDIUM',
        approved_priority: 'MEDIUM',
        total_requested_quantity: 50,
        item_count: 1,
        promised_delivery_date: '2026-10-28',
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        items: [
          { id: 4, order_id: 104, product_id: 2, product_name: 'Safety Valve Type B', product_sku: 'VALVE-B200', requested_quantity: 50, allocated_quantity: 0, minimum_acceptable_quantity: 30, partial_delivery_allowed: true, status: 'confirmed' }
        ]
      },
      {
        id: 105,
        customer_id: 4,
        customer_name: 'Bob Customer',
        customer_email: 'bob@demo.com',
        status: 'confirmed',
        priority_level: 'CRITICAL',
        approved_priority: 'CRITICAL',
        total_requested_quantity: 100,
        item_count: 1,
        promised_delivery_date: '2026-10-22',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        items: [
          { id: 5, order_id: 105, product_id: 1, product_name: 'Industrial Pump Model X', product_sku: 'PUMP-X100', requested_quantity: 100, allocated_quantity: 0, minimum_acceptable_quantity: 50, partial_delivery_allowed: true, status: 'confirmed' }
        ]
      }
    ];

    this.runs = [
      {
        id: 1,
        run_number: 1,
        status: 'completed',
        is_dry_run: false,
        total_items_processed: 3,
        fulfilled_count: 1,
        partially_fulfilled_count: 0,
        deferred_count: 2,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        execution_time_ms: 28,
        input_hash: 'd8e8fca9b1a0e7f8',
        initiated_by_name: 'Admin Operations'
      }
    ];

    this.runResults = [
      {
        order_item_id: 3,
        order_id: 103,
        customer_name: 'Charlie Customer',
        product_name: 'Pressure Gauge Pro',
        product_sku: 'GAUGE-P300',
        requested_quantity: 30,
        allocated_quantity: 30,
        status: 'fulfilled',
        approved_priority: 'HIGH',
        explanation: 'Available stock was sufficient to fulfill the complete request.'
      },
      {
        order_item_id: 1,
        order_id: 101,
        customer_name: 'Alice Customer',
        product_name: 'Pressure Gauge Pro',
        product_sku: 'GAUGE-P300',
        requested_quantity: 25,
        allocated_quantity: 0,
        status: 'deferred',
        approved_priority: 'HIGH',
        explanation: 'Available stock (10) is below the minimum acceptable quantity (15). No allocation made.'
      },
      {
        order_item_id: 2,
        order_id: 102,
        customer_name: 'Bob Customer',
        product_name: 'Pressure Gauge Pro',
        product_sku: 'GAUGE-P300',
        requested_quantity: 20,
        allocated_quantity: 0,
        status: 'deferred',
        approved_priority: 'MEDIUM',
        explanation: 'Partial delivery is not permitted for this order item and stock is depleted.'
      }
    ];

    this.alerts = [
      {
        id: 1,
        alert_type: 'below_reorder_point',
        severity: 'warning',
        title: 'Pressure Gauge Pro Below Reorder Point',
        description: 'Current inventory position (40 units) is below configured reorder point (70 units).',
        suggested_action: 'Review replenishment recommendations and initiate purchase order.',
        product_name: 'Pressure Gauge Pro',
        product_sku: 'GAUGE-P300',
        resolved: false,
        created_at: new Date().toISOString()
      }
    ];

    this.auditLogs = [
      {
        id: 1,
        actor_id: 1,
        actor_name: 'Administrator',
        actor_email: 'admin@orderwise.com',
        action: 'RUN_ALLOCATION',
        entity_type: 'allocation_runs',
        entity_id: 1,
        details: 'Triggered deterministic inventory allocation run #1 across all pending demand.',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 2,
        actor_id: 1,
        actor_name: 'Administrator',
        actor_email: 'admin@orderwise.com',
        action: 'PRIORITY_APPROVED',
        entity_type: 'orders',
        entity_id: 101,
        details: 'Approved AI recommendation for Order #101: Priority set to HIGH.',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 3,
        actor_id: 2,
        actor_name: 'Inventory Manager',
        actor_email: 'manager@orderwise.com',
        action: 'STOCK_ADJUSTMENT',
        entity_type: 'inventory',
        entity_id: 3,
        details: 'Adjusted Pressure Gauge Pro stock by +40 units (Initial deposit).',
        created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
      {
        id: 4,
        actor_id: 1,
        actor_name: 'Administrator',
        actor_email: 'admin@orderwise.com',
        action: 'ORDER_CONFIRMED',
        entity_type: 'orders',
        entity_id: 104,
        details: 'Confirmed order #104 for customer Alice Customer.',
        created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
    ];
  }

  getProducts() {
    return this.products.map(p => {
      const inv = this.inventory.find(i => i.product_id === p.id) || {};
      return {
        ...p,
        on_hand_quantity: inv.on_hand_quantity || 0,
        reserved_quantity: inv.reserved_quantity || 0,
        available_quantity: (inv.on_hand_quantity || 0) - (inv.reserved_quantity || 0),
        safety_stock: inv.safety_stock || 0,
        reorder_point: inv.reorder_point || 0,
        inventory_version: inv.version || 1,
      };
    });
  }

  getInventory() {
    return this.inventory.map(inv => ({
      ...inv,
      available_quantity: Math.max(0, inv.on_hand_quantity - inv.reserved_quantity)
    }));
  }

  adjustInventory(productId, { quantity, reason }) {
    const pId = Number(productId);
    const item = this.inventory.find(i => i.product_id === pId);
    if (!item) return null;
    const oldQty = item.on_hand_quantity;
    item.on_hand_quantity = Number(quantity);
    item.version = (item.version || 1) + 1;
    item.updated_at = new Date().toISOString();

    this.movements.unshift({
      id: this.movements.length + 1,
      product_id: pId,
      sku: item.sku,
      delta: item.on_hand_quantity - oldQty,
      resulting_on_hand: item.on_hand_quantity,
      reason: reason || 'Manual adjustment',
      actor_name: 'Administrator',
      created_at: new Date().toISOString()
    });

    return item;
  }

  getOrders(customerId = null) {
    if (customerId) {
      return this.orders.filter(o => o.customer_id === Number(customerId));
    }
    return this.orders;
  }

  getOrderById(orderId) {
    return this.orders.find(o => o.id === Number(orderId)) || null;
  }

  confirmOrder(orderId) {
    const o = this.orders.find(ord => ord.id === Number(orderId));
    if (o) o.status = 'confirmed';
    return o;
  }

  cancelOrder(orderId) {
    const o = this.orders.find(ord => ord.id === Number(orderId));
    if (o) o.status = 'cancelled';
    return o;
  }

  createOrder(customerId, customerName, customerEmail, { items, promised_delivery_date, notes }) {
    const newId = this.orders.length > 0 ? Math.max(...this.orders.map(o => o.id)) + 1 : 101;
    const formattedItems = (items || []).map((it, idx) => {
      const prodId = Number(it.product_id || it.productId || 1);
      const p = this.products.find(prod => prod.id === prodId) || {};
      const reqQty = Number(it.requested_quantity !== undefined ? it.requested_quantity : (it.requestedQuantity || 0));
      const minQty = Number(it.minimum_acceptable_quantity !== undefined ? it.minimum_acceptable_quantity : (it.minimumAcceptableQuantity || 1));
      const partialAllowed = it.partial_delivery_allowed !== undefined ? it.partial_delivery_allowed !== false : (it.partialDeliveryAllowed !== false);

      return {
        id: idx + 1,
        order_id: newId,
        product_id: prodId,
        product_name: p.name || 'Hardware Part',
        product_sku: p.sku || 'SKU-000',
        requested_quantity: reqQty,
        allocated_quantity: 0,
        minimum_acceptable_quantity: minQty,
        partial_delivery_allowed: partialAllowed,
        status: 'pending'
      };
    });

    const totalQty = formattedItems.reduce((sum, it) => sum + Number(it.requested_quantity || 0), 0);

    const newOrder = {
      id: newId,
      customer_id: Number(customerId),
      customer_name: customerName,
      customer_email: customerEmail,
      status: 'pending',
      priority_level: 'MEDIUM',
      approved_priority: 'MEDIUM',
      total_requested_quantity: totalQty,
      item_count: formattedItems.length,
      promised_delivery_date: promised_delivery_date || 'Standard',
      notes: notes || '',
      created_at: new Date().toISOString(),
      items: formattedItems
    };

    this.orders.unshift(newOrder);
    return newOrder;
  }

  runAllocation({ product_ids, dry_run, notes }) {
    // Run deterministic algorithm across pressure gauge / products
    const gauge = this.inventory.find(i => i.product_id === 3);
    if (!dry_run && gauge) {
      gauge.reserved_quantity = 30; // 30 units reserved for Charlie
    }

    const runId = this.runs.length + 1;
    const newRun = {
      id: runId,
      run_number: runId,
      status: 'completed',
      is_dry_run: Boolean(dry_run),
      total_items_processed: 3,
      fulfilled_count: 1,
      partially_fulfilled_count: 0,
      deferred_count: 2,
      created_at: new Date().toISOString(),
      execution_time_ms: 22,
      input_hash: 'a3f9e1b7c8d20914',
      initiated_by_name: 'Administrator',
      notes: notes || 'Automated allocation run'
    };

    if (!dry_run) {
      this.runs.unshift(newRun);
    }

    return {
      run: newRun,
      run_id: runId,
      results: this.runResults,
      summary: { total_items: 3, fulfilled: 1, partial: 0, deferred: 2 }
    };
  }

  getRuns() {
    return this.runs;
  }

  getRunDetails(runId) {
    const run = this.runs.find(r => r.id === Number(runId)) || this.runs[0];
    return {
      run,
      results: this.runResults
    };
  }

  getAlerts() {
    return {
      alerts: this.alerts,
      stats: { total: this.alerts.length, unresolved: this.alerts.filter(a => !a.resolved).length }
    };
  }

  getAuditLogs(filters = {}) {
    let logs = [...this.auditLogs];
    if (filters.action && filters.action !== 'all') {
      logs = logs.filter(l => l.action.toLowerCase() === filters.action.toLowerCase());
    }
    if (filters.actor_id) {
      logs = logs.filter(l => l.actor_id === Number(filters.actor_id));
    }
    if (filters.user) {
      const q = filters.user.toLowerCase();
      logs = logs.filter(l => l.actor_name.toLowerCase().includes(q) || l.actor_email.toLowerCase().includes(q));
    }
    return logs;
  }

  getReportsSummary() {
    const totalOrders = this.orders.length;
    const fulfilledOrders = this.orders.filter(o => o.status === 'allocated' || o.status === 'completed').length;
    const deferredOrders = this.orders.filter(o => o.status === 'deferred').length;
    const pendingOrders = this.orders.filter(o => o.status === 'pending').length;
    const fillRate = totalOrders > 0 ? Math.round(((fulfilledOrders) / totalOrders) * 100) : 0;

    // Estimated inventory valuation
    const UNIT_COSTS = { 1: 350, 2: 120, 3: 85, 4: 550 };
    let totalValuation = 0;
    this.inventory.forEach(inv => {
      const cost = UNIT_COSTS[inv.product_id] || 100;
      totalValuation += inv.on_hand_quantity * cost;
    });

    return {
      kpis: {
        total_runs: this.runs.length,
        total_orders: totalOrders,
        fulfilled_orders: fulfilledOrders,
        deferred_orders: deferredOrders,
        pending_orders: pendingOrders,
        fill_rate_percent: fillRate,
        inventory_valuation_usd: totalValuation,
        ai_recommendations_count: 5,
        ai_approval_rate_percent: 80,
      },
      allocation_runs: this.runs,
      deferred_breakdown: [
        {
          order_id: 101,
          customer_name: 'Alice Customer',
          product_name: 'Pressure Gauge Pro',
          requested_quantity: 25,
          min_acceptable: 15,
          reason: 'Available stock was below minimum threshold (10 < 15)',
        },
        {
          order_id: 102,
          customer_name: 'Bob Customer',
          product_name: 'Pressure Gauge Pro',
          requested_quantity: 20,
          min_acceptable: 20,
          reason: 'No partial delivery allowed and remaining stock was 0',
        },
      ],
      inventory_valuation_by_product: this.inventory.map(inv => {
        const cost = UNIT_COSTS[inv.product_id] || 100;
        return {
          product_id: inv.product_id,
          sku: inv.sku,
          product_name: inv.product_name,
          on_hand_quantity: inv.on_hand_quantity,
          unit_cost: cost,
          total_value: inv.on_hand_quantity * cost,
        };
      }),
      ai_governance: {
        total_recommendations: 5,
        approved: 4,
        overridden: 1,
        rejected: 0,
        approval_rate: 80,
      },
    };
  }
}

const demoStore = new DemoStore();
module.exports = demoStore;
