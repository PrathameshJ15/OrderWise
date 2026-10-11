/**
 * Demo in-memory fallback store used when PostgreSQL connection is unavailable.
 * Ensures the entire application is fully usable for demonstrations without external dependencies.
 */

class DemoStore {
  constructor() {
    this.products = [
      { id: 1, sku: 'PUMP-X100', name: 'Industrial Pump Model X', description: 'High pressure centrifugal pump', unit: 'units', active: true, created_at: new Date().toISOString() },
      { id: 2, sku: 'VALVE-B200', name: 'Safety Valve Type B', description: 'Brass pressure release safety valve', unit: 'units', active: true, created_at: new Date().toISOString() },
      { id: 3, sku: 'GAUGE-P300', name: 'Pressure Gauge Pro', description: 'High precision analog pressure gauge', unit: 'units', active: true, created_at: new Date().toISOString() },
      { id: 4, sku: 'CTRL-U400', name: 'Control Panel Unit', description: 'Digital controller unit', unit: 'units', active: true, created_at: new Date().toISOString() },
    ];

    this.inventory = [
      { product_id: 1, sku: 'PUMP-X100', product_name: 'Industrial Pump Model X', on_hand_quantity: 150, reserved_quantity: 0, available_quantity: 150, safety_stock: 20, reorder_point: 40, version: 1, updated_at: new Date().toISOString() },
      { product_id: 2, sku: 'VALVE-B200', product_name: 'Safety Valve Type B', on_hand_quantity: 80, reserved_quantity: 0, available_quantity: 80, safety_stock: 15, reorder_point: 30, version: 1, updated_at: new Date().toISOString() },
      { product_id: 3, sku: 'GAUGE-P300', product_name: 'Pressure Gauge Pro', on_hand_quantity: 40, reserved_quantity: 0, available_quantity: 40, safety_stock: 15, reorder_point: 70, version: 1, updated_at: new Date().toISOString() },
      { product_id: 4, sku: 'CTRL-U400', product_name: 'Control Panel Unit', on_hand_quantity: 200, reserved_quantity: 0, available_quantity: 200, safety_stock: 25, reorder_point: 50, version: 1, updated_at: new Date().toISOString() },
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
    const totalQty = (items || []).reduce((sum, it) => sum + Number(it.requested_quantity || 0), 0);
    const formattedItems = (items || []).map((it, idx) => {
      const p = this.products.find(prod => prod.id === Number(it.product_id)) || {};
      return {
        id: idx + 1,
        order_id: newId,
        product_id: it.product_id,
        product_name: p.name || 'Hardware Part',
        product_sku: p.sku || 'SKU-000',
        requested_quantity: Number(it.requested_quantity),
        allocated_quantity: 0,
        minimum_acceptable_quantity: Number(it.minimum_acceptable_quantity || 1),
        partial_delivery_allowed: it.partial_delivery_allowed !== false,
        status: 'pending'
      };
    });

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
}

const demoStore = new DemoStore();
module.exports = demoStore;
