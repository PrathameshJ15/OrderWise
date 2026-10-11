const bcrypt = require('bcryptjs');
const { pool } = require('../../config/db');

async function seed(client = null) {
  const runner = client || pool;
  console.log('[SEED] Starting idempotent database seed...');

  // 1. Seed Users
  const passwordSaltRounds = 10;
  const usersToSeed = [
    { name: 'System Admin', email: 'admin@orderwise.com', role: 'admin', pass: 'Admin123!' },
    { name: 'Warehouse Lead', email: 'manager@orderwise.com', role: 'inventory_manager', pass: 'Manager123!' },
    { name: 'Alice Smith Corp', email: 'alice@demo.com', role: 'customer', pass: 'Alice123!' },
    { name: 'Bob Industries', email: 'bob@demo.com', role: 'customer', pass: 'Bob123!' },
    { name: 'Charlie Logistics', email: 'charlie@demo.com', role: 'customer', pass: 'Charlie123!' },
    { name: 'David Dynamics', email: 'david@demo.com', role: 'customer', pass: 'David123!' },
    { name: 'Eva Energy Systems', email: 'eva@demo.com', role: 'customer', pass: 'Eva123!' },
  ];

  const userMap = {};

  for (const u of usersToSeed) {
    const passwordHash = bcrypt.hashSync(u.pass, passwordSaltRounds);
    const res = await runner.query(
      `INSERT INTO users (name, email, password_hash, role, active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (email) 
       DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, password_hash = EXCLUDED.password_hash
       RETURNING id, email, role;`,
      [u.name, u.email, passwordHash, u.role]
    );
    userMap[res.rows[0].email] = res.rows[0].id;
  }
  console.log(`[SEED] Seeded ${Object.keys(userMap).length} users.`);

  // 2. Seed Products & Inventory
  const productsToSeed = [
    {
      sku: 'PUMP-X100',
      name: 'Industrial Pump Model X',
      description: 'Heavy duty fluid extraction pump with ceramic impeller',
      unit: 'units',
      stock: 150,
      safety: 20,
      reorder: 30,
    },
    {
      sku: 'VALVE-B200',
      name: 'Safety Valve Type B',
      description: 'Brass spring-loaded pressure relief valve',
      unit: 'units',
      stock: 80,
      safety: 15,
      reorder: 25,
    },
    {
      sku: 'GAUGE-P300',
      name: 'Pressure Gauge Pro',
      description: 'High-precision digital gauge with telemetry (Scarce)',
      unit: 'units',
      stock: 40, // scarce item!
      safety: 10,
      reorder: 20,
    },
    {
      sku: 'CTRL-U400',
      name: 'Control Panel Unit',
      description: 'Programmable multi-sensor industrial controller',
      unit: 'units',
      stock: 200,
      safety: 25,
      reorder: 50,
    },
  ];

  const productMap = {};

  for (const p of productsToSeed) {
    const pRes = await runner.query(
      `INSERT INTO products (sku, name, description, unit, active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (sku)
       DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, unit = EXCLUDED.unit
       RETURNING id, sku;`,
      [p.sku, p.name, p.description, p.unit]
    );
    const pId = pRes.rows[0].id;
    productMap[p.sku] = pId;

    // Seed inventory row
    await runner.query(
      `INSERT INTO inventory (product_id, on_hand_quantity, reserved_quantity, safety_stock, reorder_point, version, updated_by)
       VALUES ($1, $2, 0, $3, $4, 1, $5)
       ON CONFLICT (product_id)
       DO UPDATE SET 
         on_hand_quantity = EXCLUDED.on_hand_quantity,
          reserved_quantity = 0,
         safety_stock = EXCLUDED.safety_stock,
         reorder_point = EXCLUDED.reorder_point;`,
      [pId, p.stock, p.safety, p.reorder, userMap['manager@orderwise.com']]
    );
  }
  console.log(`[SEED] Seeded ${Object.keys(productMap).length} products with inventory.`);

  // 3. Seed Suppliers
  const suppliersToSeed = [
    { code: 'SUP-VALVETECH', name: 'ValveTech Precision Ltd', email: 'sales@valvetech.example', lead: 5 },
    { code: 'SUP-GAUGEMASTER', name: 'GaugeMaster Instruments', email: 'orders@gaugemaster.example', lead: 14 },
    { code: 'SUP-HYDRACORE', name: 'HydraCore Pumps & Drives', email: 'contact@hydracore.example', lead: 10 },
  ];

  for (const s of suppliersToSeed) {
    await runner.query(
      `INSERT INTO suppliers (code, name, contact_email, lead_time_days, active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (code)
       DO UPDATE SET name = EXCLUDED.name, lead_time_days = EXCLUDED.lead_time_days;`,
      [s.code, s.name, s.email, s.lead]
    );
  }
  console.log(`[SEED] Seeded suppliers.`);

  // Link products to default suppliers
  const supValve = await runner.query("SELECT id FROM suppliers WHERE code = 'SUP-VALVETECH'");
  const supGauge = await runner.query("SELECT id FROM suppliers WHERE code = 'SUP-GAUGEMASTER'");
  const supPump = await runner.query("SELECT id FROM suppliers WHERE code = 'SUP-HYDRACORE'");

  if (supValve.rowCount > 0) {
    await runner.query("UPDATE products SET default_supplier_id = $1, default_lead_time_days = 5 WHERE sku = 'VALVE-B200'", [supValve.rows[0].id]);
  }
  if (supGauge.rowCount > 0) {
    await runner.query("UPDATE products SET default_supplier_id = $1, default_lead_time_days = 14 WHERE sku = 'GAUGE-P300'", [supGauge.rows[0].id]);
  }
  if (supPump.rowCount > 0) {
    await runner.query("UPDATE products SET default_supplier_id = $1, default_lead_time_days = 10 WHERE sku = 'PUMP-X100'", [supPump.rows[0].id]);
    await runner.query("UPDATE products SET default_supplier_id = $1, default_lead_time_days = 10 WHERE sku = 'CTRL-U400'", [supPump.rows[0].id]);
  }

  // 4. Seed Competing Orders
  // Designed so that Pressure Gauge Pro (stock = 40) creates conflict and every outcome:
  // - Eva (CRITICAL=4, qty 10, partial false) -> gets 10 (Fulfilled)
  // - Charlie (HIGH=3, date 2026-10-20, qty 30, partial true, min 10) -> gets 30 (Fulfilled, wins tie-break over Alice)
  // - Alice (HIGH=3, date 2026-10-25, qty 25, partial true, min 15) -> 0 stock remaining, below min 15 -> DEFERRED
  // - Bob (MEDIUM=2, qty 20, partial false, min 20) -> 0 stock -> DEFERRED
  // - David (LOW=1, qty 15, partial true, min 5) -> 0 stock -> DEFERRED

  const ordersToSeed = [
    {
      customerEmail: 'eva@demo.com',
      notes: 'CRITICAL EMERGENCY: Offshore oil rig shut down pending replacement pressure telemetry.',
      promisedDate: '2026-10-21',
      items: [
        { sku: 'GAUGE-P300', qty: 10, min: 10, partial: false },
      ],
      priority: { label: 'CRITICAL', rank: 4, notes: 'Offshore rig shutdown priority approved' },
    },
    {
      customerEmail: 'charlie@demo.com',
      notes: 'Refinery expansion Phase 2 milestone delivery. Earlier delivery commitment.',
      promisedDate: '2026-10-20',
      items: [
        { sku: 'GAUGE-P300', qty: 30, min: 10, partial: true },
      ],
      priority: { label: 'HIGH', rank: 3, notes: 'High value expansion project contract' },
    },
    {
      customerEmail: 'alice@demo.com',
      notes: 'Chemical processing maintenance overhaul. Late October delivery.',
      promisedDate: '2026-10-25',
      items: [
        { sku: 'GAUGE-P300', qty: 25, min: 15, partial: true },
        { sku: 'VALVE-B200', qty: 50, min: 30, partial: true },
      ],
      priority: { label: 'HIGH', rank: 3, notes: 'Routine plant maintenance schedule' },
    },
    {
      customerEmail: 'bob@demo.com',
      notes: 'Standard quarterly pipeline spares replacement.',
      promisedDate: '2026-10-22',
      items: [
        { sku: 'GAUGE-P300', qty: 20, min: 20, partial: false },
        { sku: 'PUMP-X100', qty: 100, min: 50, partial: true },
      ],
      priority: { label: 'MEDIUM', rank: 2, notes: 'Quarterly inventory replenishments' },
    },
    {
      customerEmail: 'david@demo.com',
      notes: 'Secondary line backup reserve stock.',
      promisedDate: '2026-10-18',
      items: [
        { sku: 'GAUGE-P300', qty: 15, min: 5, partial: true },
      ],
      priority: { label: 'LOW', rank: 1, notes: 'Non-critical buffer replenishment' },
    },
  ];

  const seedNotes = ordersToSeed.map((o) => o.notes);
  await runner.query('DELETE FROM orders WHERE NOT (business_notes = ANY($1::text[]))', [seedNotes]);

  for (const o of ordersToSeed) {
    const customerId = userMap[o.customerEmail];
    
    // Check if order already exists with identical business notes for this customer
    const existingOrder = await runner.query(
      `SELECT id FROM orders WHERE customer_id = $1 AND business_notes = $2 LIMIT 1;`,
      [customerId, o.notes]
    );

    let orderId;
    if (existingOrder.rowCount > 0) {
      orderId = existingOrder.rows[0].id;
      // Update promised delivery date
      await runner.query(
        `UPDATE orders SET promised_delivery_date = $1, status = 'pending' WHERE id = $2;`,
        [o.promisedDate, orderId]
      );
    } else {
      const orderInsert = await runner.query(
        `INSERT INTO orders (customer_id, status, promised_delivery_date, business_notes)
         VALUES ($1, 'pending', $2, $3)
         RETURNING id;`,
        [customerId, o.promisedDate, o.notes]
      );
      orderId = orderInsert.rows[0].id;
    }

    // Seed Order Items
    for (const item of o.items) {
      const productId = productMap[item.sku];
      await runner.query(
        `INSERT INTO order_items (order_id, product_id, requested_quantity, minimum_acceptable_quantity, partial_delivery_allowed)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (order_id, product_id)
         DO UPDATE SET 
           requested_quantity = EXCLUDED.requested_quantity,
           minimum_acceptable_quantity = EXCLUDED.minimum_acceptable_quantity,
           partial_delivery_allowed = EXCLUDED.partial_delivery_allowed;`,
        [orderId, productId, item.qty, item.min, item.partial]
      );
    }

    // Seed Approved Priority
    await runner.query(
      `INSERT INTO order_priorities (order_id, approved_priority, priority_rank, notes, approved_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (order_id)
       DO UPDATE SET 
         approved_priority = EXCLUDED.approved_priority,
         priority_rank = EXCLUDED.priority_rank,
         notes = EXCLUDED.notes;`,
      [orderId, o.priority.label, o.priority.rank, o.priority.notes, userMap['admin@orderwise.com']]
    );
  }

  console.log(`[SEED] Seeded ${ordersToSeed.length} competing orders with priorities.`);

  try {
    const { scanAndGenerateAlerts } = require('../../services/alertService');
    const alertResults = await scanAndGenerateAlerts(runner);
    console.log(`[SEED] Generated ${alertResults.newly_created_count} proactive supply alerts.`);
  } catch (err) {
    console.warn('[SEED] Alert scan warning:', err.message);
  }

  console.log('[SEED] Demo data successfully loaded!');
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seed completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

module.exports = { seed };
