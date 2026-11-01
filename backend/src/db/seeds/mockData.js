/**
 * ============================================================================
 * OrderWise — MOCK DATA SEED (deterministic, idempotent, additive-only)
 * ============================================================================
 * Purpose: realistic synthetic dataset for development, testing and hackathon
 * demos. All business data is FICTIONAL. No real personal data is used.
 *
 * Design contracts (do not violate):
 *  - ADDITIVE ONLY: no DELETE statements anywhere in this file.
 *  - Namespace isolation: emails end with "@mockmail.test", SKUs start with
 *    "OW-", order idempotency keys start with "mockdata:order:". Existing
 *    demo/test data (PUMP-X100, GAUGE-P300, alice@demo.com, ...) is untouched.
 *  - The allocation rows are produced by the REAL allocation engine
 *    (backend/src/services/allocationEngine.js) — never hand-written.
 *  - DETERMINISTIC: fixed timestamps (Sep-Oct 2026, UTC), fixed priorities,
 *    fixed bcrypt salt. Re-running produces identical business data.
 *  - IDEMPOTENT: upserts keyed on natural keys + existence lookups; engine
 *    runs only when seeded order items lack allocation coverage.
 *  - SAFE TARGET GUARD: refuses NODE_ENV=production and refuses any
 *    non-local database host unless ACK_MOCK_SEED_EXTERNAL=true is set.
 *    The connection string is never printed.
 *
 * Schema note: targets the LIVE schema of the development database
 * (migrations 001..005_add_idempotency, 006_add_allocation_hash,
 * 007_enhance_simulations, 008_create_alerts applied). Notably:
 *   - products has NO default_supplier_id / default_lead_time_days
 *   - ai_recommendations has NO prompt_version
 *   - alerts uses the migration-008 shape (suggested_action, resolved, ...)
 *   - purchase_orders has NO notes column, notifications table absent
 * ============================================================================
 */

const bcrypt = require('bcryptjs');
const { pool } = require('../../config/db');
const { env } = require('../../config/env');
const allocationEngine = require('../../services/allocationEngine');

/* --------------------------------------------------------------------------
 * Safety constants
 * ------------------------------------------------------------------------ */
const EMAIL_DOMAIN = '@mockmail.test';
const SKU_PREFIX = 'OW-';
const ORDER_KEY_PREFIX = 'mockdata:order:';
const MOCK_PASSWORD = 'Mock@2026';
// Fixed 22-char bcrypt salt (test data only — never use for real users).
const FIXED_BCRYPT_SALT = '$2a$10$OWMockDataSalt2026ABCD';
const PASSWORD_HASH = bcrypt.hashSync(MOCK_PASSWORD, FIXED_BCRYPT_SALT);
const RUN1_NOTE = 'MOCKDATA run 1 — full catalog baseline allocation';
const RUN2_NOTE = 'MOCKDATA run 2 — FMET restock replay allocation';
const FMET_SKU = 'OW-FMET-F600';
const FMET_RESTOCK_TS = '2026-10-10T06:00:00Z';

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1'];

/**
 * Refuses to run in production or against a non-local database unless the
 * operator explicitly acknowledges external-target seeding. Never prints
 * connection details.
 */
function assertSafeTarget() {
  if (env.NODE_ENV === 'production') {
    throw new Error('[MOCK-SEED] REFUSED: NODE_ENV=production. This seed may only target development databases.');
  }
  let host = '(unparsable)';
  try {
    host = new URL(env.DATABASE_URL).hostname;
  } catch {
    /* keep placeholder; do not echo the URL */
  }
  if (!LOCAL_HOSTS.includes(host) && process.env.ACK_MOCK_SEED_EXTERNAL !== 'true') {
    throw new Error(
      `[MOCK-SEED] REFUSED: DATABASE_URL points at a non-local host ("${host}"). ` +
        'This seed is meant for the local embedded development database. ' +
        'To seed an explicitly approved external dev database, set ACK_MOCK_SEED_EXTERNAL=true.'
    );
  }
}

/* --------------------------------------------------------------------------
 * Generic helpers (all parameterized; no string-built values)
 * ------------------------------------------------------------------------ */

/** Upsert helper. conflictCols: e.g. ['email']; updateCols: columns to refresh. */
async function upsert(client, table, conflictCols, insertCols, insertVals, updateCols) {
  const placeholders = insertCols.map((_, i) => `$${i + 1}`);
  let sql = `INSERT INTO ${table} (${insertCols.join(', ')}) VALUES (${placeholders.join(', ')})`;
  if (updateCols && updateCols.length > 0) {
    sql += ` ON CONFLICT (${conflictCols.join(', ')}) DO UPDATE SET ${updateCols
      .map((c) => `${c} = EXCLUDED.${c}`)
      .join(', ')}`;
  } else {
    sql += ` ON CONFLICT (${conflictCols.join(', ')}) DO NOTHING`;
  }
  await client.query(sql, insertVals);
}

/** Insert a row only if no row matches the lookup columns yet. Returns true if inserted. */
async function insertIfAbsent(client, table, lookupCols, lookupVals, insertCols, insertVals) {
  const where = lookupCols.map((c, i) => `${c} = $${i + 1}`).join(' AND ');
  const exists = await client.query(`SELECT 1 FROM ${table} WHERE ${where} LIMIT 1`, lookupVals);
  if (exists.rowCount > 0) return false;
  const placeholders = insertVals.map((_, i) => `$${i + 1}`);
  await client.query(
    `INSERT INTO ${table} (${insertCols.join(', ')}) VALUES (${placeholders.join(', ')})`,
    insertVals
  );
  return true;
}

/* --------------------------------------------------------------------------
 * 1. USERS — 15 accounts (2 admin, 3 inventory_manager, 10 customer)
 * All names/companies are synthetic Indian businesses. Password for every
 * account: see MOCK_PASSWORD above (test-only).
 * ------------------------------------------------------------------------ */
const USERS = [
  { key: 'vikram', name: 'Vikram Malhotra', role: 'admin', email: `vikram.admin${EMAIL_DOMAIN}` },
  { key: 'ananya', name: 'Ananya Krishnan', role: 'admin', email: `ananya.admin${EMAIL_DOMAIN}` },
  { key: 'farhan', name: 'Farhan Qureshi', role: 'inventory_manager', email: `farhan.manager${EMAIL_DOMAIN}` },
  { key: 'meera', name: 'Meera Iyer', role: 'inventory_manager', email: `meera.manager${EMAIL_DOMAIN}` },
  { key: 'rohit', name: 'Rohit Bansal', role: 'inventory_manager', email: `rohit.manager${EMAIL_DOMAIN}` },
  { key: 'rajesh', name: 'Rajesh Sharma — Sharma Industrial Supplies', role: 'customer', email: `rajesh${EMAIL_DOMAIN}` },
  { key: 'kiran', name: 'Kiran Patel — Patel Precision Tools LLP', role: 'customer', email: `kiran${EMAIL_DOMAIN}` },
  { key: 'arjun', name: 'Arjun Mehta — Mehta Hydraulics Pvt Ltd', role: 'customer', email: `arjun${EMAIL_DOMAIN}` },
  { key: 'venkat', name: 'Venkat Rao — Rao Automation Works', role: 'customer', email: `venkat${EMAIL_DOMAIN}` },
  { key: 'suresh', name: 'Suresh Iyer — Iyer Fluid Controls', role: 'customer', email: `suresh${EMAIL_DOMAIN}` },
  { key: 'neha', name: 'Neha Gupta — Gupta Engineering Co', role: 'customer', email: `neha${EMAIL_DOMAIN}` },
  { key: 'prakash', name: 'Prakash Desai — Desai Manufacturing', role: 'customer', email: `prakash${EMAIL_DOMAIN}` },
  { key: 'ramesh', name: 'Ramesh Nair — Nair Industrial Equipments', role: 'customer', email: `ramesh${EMAIL_DOMAIN}` },
  { key: 'manish', name: 'Manish Joshi — Joshi Machine Tools', role: 'customer', email: `manish${EMAIL_DOMAIN}` },
  { key: 'kavya', name: 'Kavya Reddy — Reddy Power Systems', role: 'customer', email: `kavya${EMAIL_DOMAIN}` },
];

/* --------------------------------------------------------------------------
 * 2. PRODUCTS (20) — SKUs prefixed OW-. Scenario codes documented inline:
 *    A=full, B=partial, C=partial-forbidden, D=min-not-met, E=no-stock,
 *    F/K=competition+insufficient, G=date-tie, T=created-tie, X=cancelled,
 *    L=sufficient-stock; rest are generic portal products.
 * ------------------------------------------------------------------------ */
const PRODUCTS = [
  { sku: 'OW-HBOLT-A100', name: 'Hydraulic Bolt Kit HB-25', description: 'High-tensile hydraulic bolting kit for press frames (Scenario A: full allocation)', unit: 'kits', onHand: 20, safety: 5, reorder: 8 },
  { sku: 'OW-PSEAL-B200', name: 'Pneumatic Seal Kit PS-40', description: 'Nitrile seal kit for pneumatic cylinders (Scenario B: partial allocation)', unit: 'kits', onHand: 12, safety: 3, reorder: 6 },
  { sku: 'OW-PVALVE-C300', name: 'Precision Valve Assembly PV-60', description: 'Machined valve assembly, no partial dispatch permitted (Scenario C)', unit: 'units', onHand: 12, safety: 3, reorder: 6 },
  { sku: 'OW-RACT-D400', name: 'Rotary Actuator RA-80', description: 'Compact rack-and-pinion rotary actuator (Scenario D: minimum not met)', unit: 'units', onHand: 5, safety: 2, reorder: 4 },
  { sku: 'OW-SDRV-E500', name: 'Servo Drive Module SD-12', description: 'Servo drive module, 400V class (Scenario E: zero stock)', unit: 'units', onHand: 0, safety: 4, reorder: 8 },
  { sku: 'OW-FMET-F600', name: 'Digital Flow Meter FM-100', description: 'Electromagnetic flow meter with Modbus output (Scenarios F/K: competing scarce demand + restock replay)', unit: 'units', onHand: 40, safety: 10, reorder: 20 },
  { sku: 'OW-BLOW-G700', name: 'Twin Lobe Blower TL-35', description: 'Twin-lobe aeration blower (Scenario G: same priority, earlier promised date wins)', unit: 'units', onHand: 12, safety: 4, reorder: 8 },
  { sku: 'OW-GPUMP-H800', name: 'Gear Pump Assembly GP-22', description: 'Helical gear pump assembly (Scenario T: same priority and date, earlier order wins)', unit: 'units', onHand: 8, safety: 2, reorder: 4 },
  { sku: 'OW-CCPUMP-I900', name: 'Coolant Circulation Pump CC-90', description: 'Centrifugal coolant pump (Scenario X: cancelled order excluded from allocation)', unit: 'units', onHand: 25, safety: 5, reorder: 10 },
  { sku: 'OW-SSFIT-L1000', name: 'Stainless Steel Pipe Fitting Set SS-200', description: 'SS-316 pipe fitting assortment (Scenario L: sufficient stock for all demand)', unit: 'sets', onHand: 500, safety: 50, reorder: 100 },
];

/* Scenario products continued — generic portal/inventory products (10). */
PRODUCTS.push(
  { sku: 'OW-PTRAN-K1100', name: 'Industrial Pressure Transmitter PT-450', description: '4-20mA pressure transmitter, 0-16 bar', unit: 'units', onHand: 60, safety: 10, reorder: 25 },
  { sku: 'OW-TCTRL-M1200', name: 'Digital Temperature Controller TC-12', description: 'PID temperature controller with SSR output', unit: 'units', onHand: 45, safety: 8, reorder: 20 },
  { sku: 'OW-PCYL-N1300', name: 'Pneumatic Cylinder Bore 63', description: 'ISO 15552 double-acting pneumatic cylinder', unit: 'units', onHand: 120, safety: 20, reorder: 40 },
  { sku: 'OW-VFDP-P1400', name: 'VFD Panel 5HP', description: 'Variable frequency drive panel, 5 HP IP54', unit: 'units', onHand: 30, safety: 5, reorder: 12 },
  { sku: 'OW-BVALV-Q1500', name: 'Ball Valve 2-inch Flanged', description: 'Flanged ball valve, SS body, PN16', unit: 'units', onHand: 85, safety: 15, reorder: 30 },
  { sku: 'OW-LSEN-R1600', name: 'Ultrasonic Level Sensor US-9', description: 'Non-contact ultrasonic level transmitter (below reorder point)', unit: 'units', onHand: 18, safety: 10, reorder: 20 },
  { sku: 'OW-DPUMP-S1700', name: 'Diaphragm Pump DP-05', description: 'Air-operated double diaphragm pump (stockout; replenishment inbound)', unit: 'units', onHand: 0, safety: 5, reorder: 10 },
  { sku: 'OW-SVALV-T1800', name: 'Solenoid Valve 24VDC', description: 'Direct-acting solenoid valve, 24VDC coil', unit: 'units', onHand: 75, safety: 10, reorder: 25 },
  { sku: 'OW-PSEN-U1900', name: 'Proximity Sensor Kit PX-8', description: 'Inductive proximity sensor kit M18', unit: 'kits', onHand: 140, safety: 20, reorder: 50 },
  { sku: 'OW-HOSE-V2000', name: 'Hydraulic Hose Assembly 1/2 inch', description: 'Wire-braid hydraulic hose assembly, 1/2 inch', unit: 'units', onHand: 95, safety: 15, reorder: 35 }
);

/* --------------------------------------------------------------------------
 * 3. SUPPLIERS (4) — synthetic Indian suppliers (Scenario J support).
 * ------------------------------------------------------------------------ */
const SUPPLIERS = [
  { code: 'SUP-BHARAT', name: 'Bharat Hydraulics Pvt Ltd', email: 'sales@bharathyd.example', lead: 7 },
  { code: 'SUP-DECCAN', name: 'Deccan Precision Components', email: 'orders@deccanprecision.example', lead: 10 },
  { code: 'SUP-GUJSEAL', name: 'Gujarat Seal Industries', email: 'supply@gujseal.example', lead: 5 },
  { code: 'SUP-CHENFLW', name: 'Chennai Flow Controls', email: 'sales@chennaiflow.example', lead: 12 },
];

/* --------------------------------------------------------------------------
 * 4. PURCHASE ORDERS (5) — replenishment pipeline (Scenario J).
 * PO-002 "arrives early" (received 2026-10-10) and feeds the FMET restock
 * replay (allocation improvement + traceable inventory movements).
 * ------------------------------------------------------------------------ */
const PURCHASE_ORDERS = [
  { poNumber: 'PO-2026-OW-001', supplier: 'SUP-BHARAT', status: 'received', expected: '2026-09-19', actual: '2026-09-18', created: '2026-09-12T04:30:00Z', items: [{ sku: 'OW-BVALV-Q1500', qty: 50, received: 50 }] },
  { poNumber: 'PO-2026-OW-002', supplier: 'SUP-GUJSEAL', status: 'received', expected: '2026-10-14', actual: '2026-10-10', created: '2026-10-04T05:15:00Z', items: [{ sku: FMET_SKU, qty: 20, received: 20 }] },
  { poNumber: 'PO-2026-OW-003', supplier: 'SUP-DECCAN', status: 'in_transit', expected: '2026-10-18', actual: null, created: '2026-10-05T06:40:00Z', items: [{ sku: 'OW-DPUMP-S1700', qty: 30, received: 0 }] },
  { poNumber: 'PO-2026-OW-004', supplier: 'SUP-CHENFLW', status: 'ordered', expected: '2026-10-22', actual: null, created: '2026-10-06T07:05:00Z', items: [{ sku: 'OW-LSEN-R1600', qty: 25, received: 0 }] },
  { poNumber: 'PO-2026-OW-005', supplier: 'SUP-GUJSEAL', status: 'received', expected: '2026-09-17', actual: '2026-09-16', created: '2026-09-10T03:50:00Z', items: [{ sku: 'OW-HBOLT-A100', qty: 40, received: 40 }] },
];

/* --------------------------------------------------------------------------
 * 5. ORDERS (30) — idempotency keys mockdata:order:OW-001 .. OW-030.
 * Timestamps fixed UTC. Promised dates mid/late Oct 2026.
 * Scenario letters map to Phase 3 requirements (A..N).
 * ------------------------------------------------------------------------ */
const ORDERS = [
  // --- Scenario A: full allocation (HBOLT stock 20, request 10 -> fulfilled 10)
  { key: 'OW-001', customer: 'rajesh', status: 'pending', promised: '2026-10-16', created: '2026-10-01T03:30:00Z',
    notes: 'Annual shutdown maintenance at Chakan plant — hydraulic bolting and drive panel replenishment.',
    items: [{ sku: 'OW-HBOLT-A100', qty: 10, min: 10, partial: true }, { sku: 'OW-VFDP-P1400', qty: 5, min: 3, partial: true }],
    priority: { label: 'HIGH', rank: 3, notes: 'Fixed plant shutdown window approved by ops', approvedAt: '2026-10-01T05:00:00Z', approvedBy: 'ananya' } },
  // --- Scenario B: partial allocation (PSEAL stock 12, request 20, min 10 -> partially_fulfilled 12)
  { key: 'OW-002', customer: 'kiran', status: 'pending', promised: '2026-10-16', created: '2026-10-01T04:10:00Z',
    notes: 'Seal kits required for compressor overhaul at Vatva workshop; partial dispatch acceptable.',
    items: [{ sku: 'OW-PSEAL-B200', qty: 20, min: 10, partial: true }, { sku: 'OW-PTRAN-K1100', qty: 10, min: 5, partial: true }],
    priority: { label: 'HIGH', rank: 3, notes: 'Compressor downtime risk verified', approvedAt: '2026-10-01T05:20:00Z', approvedBy: 'ananya' } },
  // --- Scenario C: partial delivery forbidden (PVALVE stock 12, request 20, no-partial -> deferred)
  { key: 'OW-003', customer: 'arjun', status: 'pending', promised: '2026-10-17', created: '2026-10-01T05:05:00Z',
    notes: 'Valve assemblies for pharma skid commissioning; full set only, no partial dispatch permitted.',
    items: [{ sku: 'OW-PVALVE-C300', qty: 20, min: 20, partial: false }, { sku: 'OW-SVALV-T1800', qty: 15, min: 5, partial: true }],
    priority: { label: 'MEDIUM', rank: 2, notes: 'Commissioning schedule per contract annexure', approvedAt: '2026-10-01T05:45:00Z', approvedBy: 'ananya' } },
  // --- Scenario D: minimum not met (RACT stock 5, request 20, min 10 -> deferred)
  { key: 'OW-004', customer: 'venkat', status: 'pending', promised: '2026-10-17', created: '2026-10-01T05:40:00Z',
    notes: 'Actuator replacement batch for Bogadi Road water treatment upgrade.',
    items: [{ sku: 'OW-RACT-D400', qty: 20, min: 10, partial: true }],
    priority: { label: 'MEDIUM', rank: 2, notes: 'Municipal upgrade phase commitment', approvedAt: '2026-10-01T06:00:00Z', approvedBy: 'vikram' } },
  // --- Scenario E: no stock (SDRV stock 0 -> deferred)
  { key: 'OW-005', customer: 'suresh', status: 'pending', promised: '2026-10-20', created: '2026-10-02T03:55:00Z',
    notes: 'Servo module spares for Coimbatore textile line; shipment write-off depleted stock.',
    items: [{ sku: 'OW-SDRV-E500', qty: 8, min: 4, partial: true }, { sku: 'OW-BVALV-Q1500', qty: 20, min: 8, partial: true }],
    priority: { label: 'LOW', rank: 1, notes: 'Buffer spares, flexible window', approvedAt: '2026-10-02T05:30:00Z', approvedBy: 'vikram' } },
];

/* Orders 006-012: FMET competition (F/K), tie-break scenarios (G, T). */
ORDERS.push(
  // --- Scenarios F + K: competing scarce demand (FMET stock 40, demand 60)
  { key: 'OW-006', customer: 'arjun', status: 'pending', promised: '2026-10-15', created: '2026-09-28T04:00:00Z',
    notes: 'CRITICAL: effluent treatment plant flow telemetry failed; regulator inspection on 15 Oct.',
    items: [{ sku: FMET_SKU, qty: 15, min: 15, partial: false }],
    priority: { label: 'CRITICAL', rank: 4, notes: 'Regulatory inspection commitment', approvedAt: '2026-09-28T06:00:00Z', approvedBy: 'ananya' } },
  { key: 'OW-007', customer: 'rajesh', status: 'pending', promised: '2026-10-19', created: '2026-09-29T04:30:00Z',
    notes: 'Boiler feed line retrofit for Nashik plant; flexible on partial dispatch.',
    items: [{ sku: FMET_SKU, qty: 30, min: 10, partial: true }],
    priority: { label: 'HIGH', rank: 3, notes: 'Retrofit milestone contract', approvedAt: '2026-09-29T06:15:00Z', approvedBy: 'ananya' } },
  { key: 'OW-008', customer: 'kiran', status: 'pending', promised: '2026-10-23', created: '2026-09-30T05:00:00Z',
    notes: 'Cooling skid flow measurement batch; full kits only due to calibration pairing.',
    items: [{ sku: FMET_SKU, qty: 15, min: 15, partial: false }],
    priority: { label: 'MEDIUM', rank: 2, notes: 'Standard quarterly requirement', approvedAt: '2026-09-30T06:30:00Z', approvedBy: 'vikram' } },
  // --- Scenario G: same priority (HIGH), earlier promised date wins (BLOW stock 12)
  { key: 'OW-009', customer: 'venkat', status: 'pending', promised: '2026-10-18', created: '2026-10-02T06:10:00Z',
    notes: 'Aeration blowers for Mysuru STP commissioning; committed handover on 18 Oct.',
    items: [{ sku: 'OW-BLOW-G700', qty: 10, min: 10, partial: true }, { sku: 'OW-TCTRL-M1200', qty: 10, min: 4, partial: true }],
    priority: { label: 'HIGH', rank: 3, notes: 'Municipal handover penalty clause', approvedAt: '2026-10-02T06:45:00Z', approvedBy: 'ananya' } },
  { key: 'OW-010', customer: 'neha', status: 'pending', promised: '2026-10-25', created: '2026-10-02T07:20:00Z',
    notes: 'Blower replacement for Kanpur dye-house; vendor escalation email received.',
    items: [{ sku: 'OW-BLOW-G700', qty: 10, min: 10, partial: true }],
    priority: { label: 'HIGH', rank: 3, notes: 'Vendor escalation on record', approvedAt: '2026-10-02T07:50:00Z', approvedBy: 'ananya' } },
  // --- Scenario T: same priority + same promised date; earlier created_at wins (GPUMP stock 8)
  { key: 'OW-011', customer: 'ramesh', status: 'pending', promised: '2026-10-22', created: '2026-10-01T04:00:00Z',
    notes: 'Gear pump spares for Kochi marine hydraulics service bay.',
    items: [{ sku: 'OW-GPUMP-H800', qty: 6, min: 6, partial: true }],
    priority: { label: 'MEDIUM', rank: 2, notes: 'Service bay SLA', approvedAt: '2026-10-01T05:10:00Z', approvedBy: 'vikram' } },
  { key: 'OW-012', customer: 'manish', status: 'pending', promised: '2026-10-22', created: '2026-10-01T05:00:00Z',
    notes: 'Gear pump stock build for Rajkot tractor OEM line; routine spares cadence.',
    items: [{ sku: 'OW-GPUMP-H800', qty: 6, min: 6, partial: true }, { sku: 'OW-PSEN-U1900', qty: 30, min: 10, partial: true }],
    priority: { label: 'MEDIUM', rank: 2, notes: 'OEM line buffer stock', approvedAt: '2026-10-01T05:40:00Z', approvedBy: 'vikram' } },
);

/* Orders 013-017: cancelled-order exclusion (X) + sufficient stock (L). */
ORDERS.push(
  // --- Scenario X: cancelled CRITICAL order must be excluded from allocation
  { key: 'OW-013', customer: 'neha', status: 'cancelled', promised: '2026-10-18', created: '2026-09-25T04:20:00Z', updated: '2026-10-05T05:30:00Z',
    notes: 'Coolant pump package for Indore unit — cancelled after line closure decision.',
    items: [{ sku: 'OW-CCPUMP-I900', qty: 20, min: 20, partial: false }],
    priority: { label: 'CRITICAL', rank: 4, notes: 'Original escalation, order later cancelled', approvedAt: '2026-09-25T06:00:00Z', approvedBy: 'ananya' } },
  { key: 'OW-014', customer: 'suresh', status: 'pending', promised: '2026-10-20', created: '2026-10-03T04:15:00Z',
    notes: 'Coolant pumps for Hubballi machining cell expansion.',
    items: [{ sku: 'OW-CCPUMP-I900', qty: 10, min: 5, partial: true }, { sku: 'OW-VFDP-P1400', qty: 4, min: 2, partial: true }],
    priority: { label: 'MEDIUM', rank: 2, notes: 'Capacity expansion plan', approvedAt: '2026-10-03T05:35:00Z', approvedBy: 'vikram' } },
  // --- Scenario L: sufficient stock (SSFIT stock 500, demand 80 -> all fulfilled)
  { key: 'OW-015', customer: 'prakash', status: 'pending', promised: '2026-10-21', created: '2026-10-03T06:00:00Z',
    notes: 'Pipe fitting sets for Ankleshwar chemical terminal piping package.',
    items: [{ sku: 'OW-SSFIT-L1000', qty: 30, min: 30, partial: true }],
    priority: { label: 'HIGH', rank: 3, notes: 'Terminal piping milestone', approvedAt: '2026-10-03T06:30:00Z', approvedBy: 'ananya' } },
  { key: 'OW-016', customer: 'venkat', status: 'pending', promised: '2026-10-21', created: '2026-10-03T06:30:00Z',
    notes: 'Fitting sets for Tirupur dairy process line upgrade.',
    items: [{ sku: 'OW-SSFIT-L1000', qty: 20, min: 20, partial: true }],
    priority: { label: 'HIGH', rank: 3, notes: 'Process line upgrade', approvedAt: '2026-10-03T07:00:00Z', approvedBy: 'ananya' } },
  { key: 'OW-017', customer: 'kavya', status: 'pending', promised: '2026-10-24', created: '2026-10-04T04:45:00Z',
    notes: 'Fitting sets and solenoid valves for Kurnool solar thermal balance-of-plant.',
    items: [{ sku: 'OW-SSFIT-L1000', qty: 10, min: 10, partial: true }, { sku: 'OW-SVALV-T1800', qty: 10, min: 4, partial: true }],
    priority: { label: 'HIGH', rank: 3, notes: 'Solar thermal BoP commitment', approvedAt: '2026-10-04T05:15:00Z', approvedBy: 'ananya' } },
);

/* Orders 018-024: eligible customer-portal demand on generic products. */
ORDERS.push(
  { key: 'OW-018', customer: 'kavya', status: 'pending', promised: '2026-10-19', created: '2026-10-04T06:20:00Z',
    notes: 'Instrumentation bundle for Hyderabad pharma block B expansion.',
    items: [
      { sku: 'OW-PTRAN-K1100', qty: 25, min: 10, partial: true }, { sku: 'OW-TCTRL-M1200', qty: 10, min: 5, partial: true },
      { sku: 'OW-PCYL-N1300', qty: 30, min: 10, partial: true }, { sku: 'OW-SVALV-T1800', qty: 20, min: 10, partial: true },
      { sku: 'OW-PSEN-U1900', qty: 20, min: 8, partial: true }],
    priority: { label: 'MEDIUM', rank: 2, notes: 'Pharma expansion phase 1', approvedAt: '2026-10-04T06:50:00Z', approvedBy: 'vikram' } },
  { key: 'OW-019', customer: 'prakash', status: 'pending', promised: '2026-10-20', created: '2026-10-05T04:10:00Z',
    notes: 'Consumables package for Halol packaging line winter maintenance.',
    items: [
      { sku: 'OW-HOSE-V2000', qty: 40, min: 15, partial: true }, { sku: 'OW-PCYL-N1300', qty: 60, min: 20, partial: true },
      { sku: 'OW-PSEN-U1900', qty: 50, min: 20, partial: true }, { sku: 'OW-BVALV-Q1500', qty: 20, min: 8, partial: true },
      { sku: 'OW-VFDP-P1400', qty: 3, min: 2, partial: true }],
    priority: { label: 'MEDIUM', rank: 2, notes: 'Winter maintenance program', approvedAt: '2026-10-05T04:40:00Z', approvedBy: 'vikram' } },
  { key: 'OW-020', customer: 'ramesh', status: 'pending', promised: '2026-10-21', created: '2026-10-05T05:25:00Z',
    notes: 'Transmitters, valves and cylinder batch for Tuticorin desal pilot.',
    items: [
      { sku: 'OW-PTRAN-K1100', qty: 20, min: 8, partial: true }, { sku: 'OW-BVALV-Q1500', qty: 30, min: 12, partial: true },
      { sku: 'OW-VFDP-P1400', qty: 10, min: 4, partial: true }, { sku: 'OW-PCYL-N1300', qty: 10, min: 4, partial: true },
      { sku: 'OW-SSFIT-L1000', qty: 20, min: 10, partial: true }],
    priority: { label: 'MEDIUM', rank: 2, notes: 'Desal pilot rig', approvedAt: '2026-10-05T06:00:00Z', approvedBy: 'vikram' } },
  { key: 'OW-021', customer: 'rajesh', status: 'pending', promised: '2026-10-21', created: '2026-10-05T06:50:00Z',
    notes: 'Controllers, sensors and valve top-up for Chakan press shop.',
    items: [
      { sku: 'OW-TCTRL-M1200', qty: 12, min: 5, partial: true }, { sku: 'OW-PSEN-U1900', qty: 25, min: 10, partial: true },
      { sku: 'OW-BVALV-Q1500', qty: 15, min: 6, partial: true }, { sku: 'OW-SVALV-T1800', qty: 5, min: 2, partial: true }],
    priority: { label: 'MEDIUM', rank: 2, notes: 'Press shop top-up', approvedAt: '2026-10-05T07:20:00Z', approvedBy: 'vikram' } },
);

/* Orders 022-030: remaining portal demand (pending/confirmed + historical
 * shipped/completed/cancelled orders for a mixed customer portal view). */
ORDERS.push(
  { key: 'OW-022', customer: 'manish', status: 'pending', promised: '2026-10-22', created: '2026-10-06T04:05:00Z',
    notes: 'Hose assemblies and valve set for Rajkot implement line retooling.',
    items: [
      { sku: 'OW-HOSE-V2000', qty: 35, min: 12, partial: true }, { sku: 'OW-SVALV-T1800', qty: 25, min: 10, partial: true },
      { sku: 'OW-PTRAN-K1100', qty: 15, min: 6, partial: true }, { sku: 'OW-TCTRL-M1200', qty: 5, min: 2, partial: true },
      { sku: 'OW-PSEN-U1900', qty: 15, min: 6, partial: true }],
    priority: { label: 'MEDIUM', rank: 2, notes: 'Retooling program', approvedAt: '2026-10-06T04:35:00Z', approvedBy: 'vikram' } },
  { key: 'OW-023', customer: 'arjun', status: 'confirmed', promised: '2026-10-20', created: '2026-10-06T05:30:00Z',
    notes: 'Confirmed kit for Pune assembly cell ramp-up; approved by ops review.',
    items: [
      { sku: 'OW-PCYL-N1300', qty: 20, min: 8, partial: true }, { sku: 'OW-VFDP-P1400', qty: 8, min: 3, partial: true },
      { sku: 'OW-HOSE-V2000', qty: 20, min: 8, partial: true }, { sku: 'OW-TCTRL-M1200', qty: 8, min: 3, partial: true }],
    priority: { label: 'HIGH', rank: 3, notes: 'Confirmed ramp-up support', approvedAt: '2026-10-06T06:10:00Z', approvedBy: 'ananya' } },
  { key: 'OW-024', customer: 'neha', status: 'pending', promised: '2026-10-23', created: '2026-10-06T07:00:00Z',
    notes: 'Level sensors for Kanpur effluent monitoring retrofit — stock arrives with PO-2026-OW-004.',
    items: [{ sku: 'OW-LSEN-R1600', qty: 40, min: 20, partial: true }],
    priority: { label: 'MEDIUM', rank: 2, notes: 'Effluent monitoring retrofit', approvedAt: '2026-10-06T07:30:00Z', approvedBy: 'vikram' } },
);

/* Historical lifecycle orders (shipped/completed/cancelled) — excluded from
 * allocation eligibility; they give every customer a realistic mixed history. */
ORDERS.push(
  { key: 'OW-025', customer: 'venkat', status: 'shipped', promised: '2026-10-05', created: '2026-09-20T04:30:00Z', updated: '2026-10-02T05:00:00Z',
    notes: 'Valves and sensors shipped to Mysuru STP — dispatch LC-2026-118.',
    items: [{ sku: 'OW-BVALV-Q1500', qty: 20, min: 10, partial: true }, { sku: 'OW-PSEN-U1900', qty: 30, min: 10, partial: true }],
    priority: { label: 'HIGH', rank: 3, notes: 'Shipped consignment', approvedAt: '2026-09-20T06:00:00Z', approvedBy: 'ananya' } },
  { key: 'OW-026', customer: 'kiran', status: 'shipped', promised: '2026-10-03', created: '2026-09-18T05:15:00Z', updated: '2026-10-01T05:45:00Z',
    notes: 'Controllers and cylinders shipped to Vatva workshop — dispatch LC-2026-105.',
    items: [{ sku: 'OW-TCTRL-M1200', qty: 15, min: 6, partial: true }, { sku: 'OW-PCYL-N1300', qty: 15, min: 5, partial: true }],
    priority: { label: 'MEDIUM', rank: 2, notes: 'Standard dispatch', approvedAt: '2026-09-18T06:00:00Z', approvedBy: 'vikram' } },
  { key: 'OW-027', customer: 'suresh', status: 'completed', promised: '2026-09-30', created: '2026-09-10T04:00:00Z', updated: '2026-10-04T06:00:00Z',
    notes: 'Transmitters and cylinders delivered and signed off at Coimbatore site.',
    items: [{ sku: 'OW-PTRAN-K1100', qty: 30, min: 10, partial: true }, { sku: 'OW-PCYL-N1300', qty: 40, min: 15, partial: true }],
    priority: { label: 'MEDIUM', rank: 2, notes: 'Completed delivery', approvedAt: '2026-09-10T05:30:00Z', approvedBy: 'vikram' } },
);

ORDERS.push(
  { key: 'OW-028', customer: 'neha', status: 'completed', promised: '2026-09-28', created: '2026-09-08T04:20:00Z', updated: '2026-10-03T05:10:00Z',
    notes: 'Valves delivered for Kanpur dye-house — invoice INV-2026-0441 settled.',
    items: [{ sku: 'OW-SVALV-T1800', qty: 30, min: 10, partial: true }, { sku: 'OW-BVALV-Q1500', qty: 25, min: 10, partial: true }],
    priority: { label: 'MEDIUM', rank: 2, notes: 'Completed delivery', approvedAt: '2026-09-08T05:50:00Z', approvedBy: 'vikram' } },
  { key: 'OW-029', customer: 'prakash', status: 'cancelled', promised: '2026-10-12', created: '2026-09-26T05:10:00Z', updated: '2026-10-04T04:40:00Z',
    notes: 'Proximity sensor and pump order cancelled — Halol line re-planning.',
    items: [{ sku: 'OW-PSEN-U1900', qty: 60, min: 20, partial: true }, { sku: 'OW-DPUMP-S1700', qty: 10, min: 4, partial: true }],
    priority: { label: 'MEDIUM', rank: 2, notes: 'Cancelled after re-planning', approvedAt: '2026-09-26T06:00:00Z', approvedBy: 'vikram' } },
  { key: 'OW-030', customer: 'rajesh', status: 'cancelled', promised: '2026-10-14', created: '2026-09-27T04:50:00Z', updated: '2026-10-06T05:20:00Z',
    notes: 'Duplicate of OW-001 scope raised by procurement; cancelled to avoid double booking.',
    items: [{ sku: 'OW-PTRAN-K1100', qty: 50, min: 15, partial: true }, { sku: 'OW-SVALV-T1800', qty: 40, min: 15, partial: true }],
    priority: { label: 'HIGH', rank: 3, notes: 'Cancelled duplicate scope', approvedAt: '2026-09-27T06:00:00Z', approvedBy: 'ananya' } },
);

/* --------------------------------------------------------------------------
 * 6. AI RECOMMENDATIONS (20) — Scenario H.
 * pending (5): MUST NOT affect live allocation (order_priorities differ).
 * approved (8): final priority equals suggestion. overridden (4): differs.
 * rejected (3): order keeps its approved priority. provider 'fallback'
 * rows are rule-based (NOT AI) per AGENTS.md labelling rules.
 * No API keys or credentials are stored anywhere in this data.
 * ------------------------------------------------------------------------ */
const AI_RECS = [
  { id: 'R01', order: 'OW-010', suggested: 'CRITICAL', rank: 4, confidence: 'high', status: 'pending', provider: 'groq', created: '2026-10-08T04:00:00Z',
    explanation: 'Notes reference a vendor escalation and production stoppage risk, indicating CRITICAL priority.',
    evidence: 'Blower replacement for Kanpur dye-house; vendor escalation email received.' },
  { id: 'R02', order: 'OW-024', suggested: 'HIGH', rank: 3, confidence: 'medium', status: 'pending', provider: 'groq', created: '2026-10-08T04:20:00Z',
    explanation: 'Notes mention a retrofit with a stock-arrival dependency, suggesting elevated priority.',
    evidence: 'Level sensors for Kanpur effluent monitoring retrofit.', warning: 'Notes do not state a hard deadline; human review advised.' },
  { id: 'R03', order: 'OW-005', suggested: 'HIGH', rank: 3, confidence: 'low', status: 'pending', provider: 'fallback', created: '2026-10-08T04:40:00Z',
    explanation: 'Rule-based keyword analysis (AI service unavailable).',
    evidence: 'Keyword match from business notes.',
    warning: 'This is a rule-based fallback, NOT AI inference. Review carefully.' },
  { id: 'R04', order: 'OW-004', suggested: 'HIGH', rank: 3, confidence: 'medium', status: 'pending', provider: 'groq', created: '2026-10-08T05:00:00Z',
    explanation: 'Municipal upgrade phase wording implies a committed public deadline.',
    evidence: 'Actuator replacement batch for Bogadi Road water treatment upgrade.' },
  { id: 'R05', order: 'OW-008', suggested: 'CRITICAL', rank: 4, confidence: 'low', status: 'pending', provider: 'groq', created: '2026-10-08T05:20:00Z',
    explanation: 'Calibration pairing constraint mentioned, but no downtime evidence found.',
    evidence: 'Full kits only due to calibration pairing.',
    warning: 'Notes are vague about business impact; recommend MEDIUM if unverifiable.' },
];

/* Approved recommendations (8) — final priority equals the suggestion. */
AI_RECS.push(
  { id: 'R06', order: 'OW-006', suggested: 'CRITICAL', rank: 4, confidence: 'high', status: 'approved', provider: 'groq', created: '2026-10-08T06:00:00Z',
    explanation: 'Regulatory inspection with a fixed date justifies CRITICAL priority.',
    evidence: 'Regulator inspection on 15 Oct.' },
  { id: 'R07', order: 'OW-007', suggested: 'HIGH', rank: 3, confidence: 'high', status: 'approved', provider: 'groq', created: '2026-10-08T06:15:00Z',
    explanation: 'Contract milestone with partial flexibility maps to HIGH priority.',
    evidence: 'Boiler feed line retrofit milestone contract.' },
  { id: 'R08', order: 'OW-002', suggested: 'HIGH', rank: 3, confidence: 'medium', status: 'approved', provider: 'groq', created: '2026-10-08T06:30:00Z',
    explanation: 'Compressor downtime risk is material; HIGH is appropriate.',
    evidence: 'Compressor overhaul at Vatva workshop.' },
  { id: 'R09', order: 'OW-001', suggested: 'HIGH', rank: 3, confidence: 'high', status: 'approved', provider: 'groq', created: '2026-10-08T06:45:00Z',
    explanation: 'Fixed shutdown window makes timing binding; HIGH priority confirmed.',
    evidence: 'Annual shutdown maintenance at Chakan plant.' },
  { id: 'R10', order: 'OW-015', suggested: 'HIGH', rank: 3, confidence: 'medium', status: 'approved', provider: 'groq', created: '2026-10-08T07:00:00Z',
    explanation: 'Terminal piping package is schedule-bound; HIGH priority confirmed.',
    evidence: 'Ankleshwar chemical terminal piping package.' },
  { id: 'R11', order: 'OW-016', suggested: 'HIGH', rank: 3, confidence: 'medium', status: 'approved', provider: 'groq', created: '2026-10-08T07:15:00Z',
    explanation: 'Dairy process upgrade carries hygiene-window constraints; HIGH confirmed.',
    evidence: 'Tirupur dairy process line upgrade.' },
  { id: 'R12', order: 'OW-009', suggested: 'HIGH', rank: 3, confidence: 'high', status: 'approved', provider: 'groq', created: '2026-10-08T07:30:00Z',
    explanation: 'Penalty clause on municipal handover confirms HIGH priority.',
    evidence: 'Committed handover on 18 Oct; penalty clause.' },
  { id: 'R13', order: 'OW-014', suggested: 'MEDIUM', rank: 2, confidence: 'medium', status: 'approved', provider: 'groq', created: '2026-10-08T07:45:00Z',
    explanation: 'Planned expansion without hard deadline; MEDIUM is appropriate.',
    evidence: 'Hubballi machining cell expansion.' },
);

/* Overridden (4): admin decision differs from the AI suggestion; and
 * rejected (3): suggestion discarded, order keeps its approved priority. */
AI_RECS.push(
  { id: 'R14', order: 'OW-003', suggested: 'LOW', rank: 1, confidence: 'low', status: 'overridden', provider: 'groq', created: '2026-10-09T04:00:00Z',
    explanation: 'Notes lack urgency signals; LOW suggested pending verification.',
    evidence: 'Pharma skid commissioning; full set only.',
    warning: 'Contractual constraints may not be visible in notes.' },
  { id: 'R15', order: 'OW-011', suggested: 'LOW', rank: 1, confidence: 'low', status: 'overridden', provider: 'groq', created: '2026-10-09T04:15:00Z',
    explanation: 'Service bay wording suggests routine work; LOW suggested.',
    evidence: 'Kochi marine hydraulics service bay.' },
  { id: 'R16', order: 'OW-020', suggested: 'CRITICAL', rank: 4, confidence: 'low', status: 'overridden', provider: 'groq', created: '2026-10-09T04:30:00Z',
    explanation: 'Desal pilot phrasing triggered an urgency heuristic.',
    evidence: 'Tuticorin desal pilot.',
    warning: 'No verifiable downtime evidence; suggestion likely over-escalated.' },
  { id: 'R17', order: 'OW-017', suggested: 'MEDIUM', rank: 2, confidence: 'medium', status: 'overridden', provider: 'groq', created: '2026-10-09T04:45:00Z',
    explanation: 'Balance-of-plant wording reads as routine; MEDIUM suggested.',
    evidence: 'Kurnool solar thermal balance-of-plant.' },
  { id: 'R18', order: 'OW-012', suggested: 'HIGH', rank: 3, confidence: 'low', status: 'rejected', provider: 'groq', created: '2026-10-09T05:00:00Z',
    explanation: 'OEM cadence wording read as urgency; admin rejected.',
    evidence: 'Rajkot tractor OEM line.',
    warning: 'Routine replenishment pattern; HIGH not justified.' },
  { id: 'R19', order: 'OW-022', suggested: 'LOW', rank: 1, confidence: 'low', status: 'rejected', provider: 'groq', created: '2026-10-09T05:15:00Z',
    explanation: 'Retooling program read as deferrable; admin rejected downgrade.',
    evidence: 'Rajkot implement line retooling.' },
  { id: 'R20', order: 'OW-010', suggested: 'MEDIUM', rank: 2, confidence: 'medium', status: 'rejected', provider: 'groq', created: '2026-10-09T05:30:00Z',
    explanation: 'Second opinion request; contradicts the pending CRITICAL case.',
    evidence: 'Blower replacement for Kanpur dye-house.',
    warning: 'Duplicate recommendation; existing pending case under review.' },
);

/* Priority approvals (15) — one human decision per non-pending rec. */
const APPROVALS = [
  { rec: 'R06', decision: 'approved', final: 'CRITICAL', rank: 4, reason: null, created: '2026-10-09T06:00:00Z' },
  { rec: 'R07', decision: 'approved', final: 'HIGH', rank: 3, reason: null, created: '2026-10-09T06:10:00Z' },
  { rec: 'R08', decision: 'approved', final: 'HIGH', rank: 3, reason: null, created: '2026-10-09T06:20:00Z' },
  { rec: 'R09', decision: 'approved', final: 'HIGH', rank: 3, reason: null, created: '2026-10-09T06:30:00Z' },
  { rec: 'R10', decision: 'approved', final: 'HIGH', rank: 3, reason: null, created: '2026-10-09T06:40:00Z' },
  { rec: 'R11', decision: 'approved', final: 'HIGH', rank: 3, reason: null, created: '2026-10-09T06:50:00Z' },
  { rec: 'R12', decision: 'approved', final: 'HIGH', rank: 3, reason: null, created: '2026-10-09T07:00:00Z' },
  { rec: 'R13', decision: 'approved', final: 'MEDIUM', rank: 2, reason: null, created: '2026-10-09T07:10:00Z' },
  { rec: 'R14', decision: 'overridden', final: 'MEDIUM', rank: 2, reason: 'Contractual penalty clause verified with ops; upgrade justified.', created: '2026-10-09T07:30:00Z' },
  { rec: 'R15', decision: 'overridden', final: 'MEDIUM', rank: 2, reason: 'Service bay SLA confirmed; LOW would breach SLA reporting.', created: '2026-10-09T07:40:00Z' },
  { rec: 'R16', decision: 'overridden', final: 'MEDIUM', rank: 2, reason: 'No verifiable downtime risk in notes; downgrade to standard SLA.', created: '2026-10-09T07:50:00Z' },
  { rec: 'R17', decision: 'overridden', final: 'HIGH', rank: 3, reason: 'Solar BoP delivery window contractual; upgrade approved.', created: '2026-10-09T08:00:00Z' },
  { rec: 'R18', decision: 'rejected', final: 'MEDIUM', rank: 2, reason: 'Routine spares cadence; no supporting evidence for HIGH.', created: '2026-10-09T08:20:00Z' },
  { rec: 'R19', decision: 'rejected', final: 'MEDIUM', rank: 2, reason: 'Retooling program is committed; LOW not acceptable.', created: '2026-10-09T08:30:00Z' },
  { rec: 'R20', decision: 'rejected', final: 'HIGH', rank: 3, reason: 'Duplicate recommendation; original pending case remains under review.', created: '2026-10-09T08:40:00Z' },
];

/* --------------------------------------------------------------------------
 * 7. SEEDED INVENTORY MOVEMENTS (ledger opening history, Scenario J/N).
 * The FMET restock receipt (ref PO-2026-OW-002) is applied as a dedicated
 * event during seeding so the second engine run can pick it up.
 * ------------------------------------------------------------------------ */
const MOVEMENTS_SEED = [
  { sku: 'OW-HBOLT-A100', type: 'receipt', qty: 20, prev: 0, next: 20, po: 'PO-2026-OW-005', by: 'meera', at: '2026-09-18T05:00:00Z' },
  { sku: 'OW-PSEAL-B200', type: 'receipt', qty: 12, prev: 0, next: 12, po: null, by: 'rohit', at: '2026-09-20T05:00:00Z' },
  { sku: 'OW-PVALVE-C300', type: 'receipt', qty: 12, prev: 0, next: 12, po: null, by: 'rohit', at: '2026-09-20T05:30:00Z' },
  { sku: 'OW-RACT-D400', type: 'receipt', qty: 5, prev: 0, next: 5, po: null, by: 'rohit', at: '2026-09-22T05:00:00Z' },
  { sku: 'OW-SDRV-E500', type: 'receipt', qty: 12, prev: 0, next: 12, po: null, by: 'meera', at: '2026-09-15T05:00:00Z' },
  { sku: 'OW-SDRV-E500', type: 'shipment', qty: -12, prev: 12, next: 0, po: null, by: 'meera', at: '2026-10-02T05:30:00Z' },
  { sku: FMET_SKU, type: 'receipt', qty: 40, prev: 0, next: 40, po: null, by: 'meera', at: '2026-09-12T05:00:00Z' },
  { sku: 'OW-BLOW-G700', type: 'receipt', qty: 12, prev: 0, next: 12, po: null, by: 'rohit', at: '2026-09-14T05:00:00Z' },
  { sku: 'OW-GPUMP-H800', type: 'receipt', qty: 8, prev: 0, next: 8, po: null, by: 'rohit', at: '2026-09-14T05:30:00Z' },
  { sku: 'OW-CCPUMP-I900', type: 'receipt', qty: 25, prev: 0, next: 25, po: null, by: 'rohit', at: '2026-09-16T05:00:00Z' },
  { sku: 'OW-SSFIT-L1000', type: 'receipt', qty: 500, prev: 0, next: 500, po: null, by: 'meera', at: '2026-09-10T05:00:00Z' },
  { sku: 'OW-BVALV-Q1500', type: 'receipt', qty: 35, prev: 0, next: 35, po: null, by: 'rohit', at: '2026-09-19T05:00:00Z' },
  { sku: 'OW-BVALV-Q1500', type: 'receipt', qty: 50, prev: 35, next: 85, po: 'PO-2026-OW-001', by: 'meera', at: '2026-09-28T05:00:00Z' },
  { sku: 'OW-PCYL-N1300', type: 'receipt', qty: 120, prev: 0, next: 120, po: null, by: 'rohit', at: '2026-09-11T05:00:00Z' },
  { sku: 'OW-LSEN-R1600', type: 'receipt', qty: 15, prev: 0, next: 15, po: null, by: 'rohit', at: '2026-09-09T05:00:00Z' },
  { sku: 'OW-LSEN-R1600', type: 'adjustment', qty: 3, prev: 15, next: 18, po: null, by: 'meera', at: '2026-10-04T05:00:00Z' },
  { sku: 'OW-DPUMP-S1700', type: 'receipt', qty: 6, prev: 0, next: 6, po: null, by: 'rohit', at: '2026-09-08T05:00:00Z' },
  { sku: 'OW-DPUMP-S1700', type: 'shipment', qty: -6, prev: 6, next: 0, po: null, by: 'meera', at: '2026-10-03T05:30:00Z' },
];

/* --------------------------------------------------------------------------
 * 8. ALERTS (6) — matching the LIVE alerts schema (migration 008 shape).
 * ------------------------------------------------------------------------ */
const ALERTS_SEED = [
  { type: 'product_shortage', severity: 'critical', product: 'OW-DPUMP-S1700', order: null, resolved: false,
    title: 'Stockout: Diaphragm Pump DP-05', description: 'On-hand quantity is 0 after the site shipment; total open demand exists and no allocation is possible.',
    action: 'Expedite in-transit purchase order PO-2026-OW-003 (30 units) and inform affected stakeholders.',
    meta: { onHand: 0, reserved: 0, incoming: 30 }, at: '2026-10-10T06:30:00Z' },
  { type: 'replenishment_required', severity: 'warning', product: 'OW-DPUMP-S1700', order: null, resolved: false,
    title: 'Replenishment required: Diaphragm Pump DP-05',
    description: 'Inventory position (0 units) is below the configured reorder point (10 units).',
    action: 'Confirm supplier dispatch for PO-2026-OW-003 and update expected delivery.',
    meta: { onHand: 0, reorderPoint: 10, incoming: 30 }, at: '2026-10-10T06:40:00Z' },
  { type: 'below_reorder_point', severity: 'warning', product: 'OW-LSEN-R1600', order: null, resolved: false,
    title: 'Below reorder point: Ultrasonic Level Sensor US-9',
    description: 'On-hand stock (18 units) is below the reorder point (20 units) with an open order of 40 units.',
    action: 'Raise replenishment request; PO-2026-OW-004 (25 units) is already ordered — expedite confirmation.',
    meta: { onHand: 18, reserved: 0, reorderPoint: 20, incoming: 25 }, at: '2026-10-10T06:50:00Z' },
  { type: 'order_at_risk', severity: 'warning', product: 'OW-LSEN-R1600', order: 'OW-024', resolved: false,
    title: 'Order at risk: OW-024 (Kanpur effluent retrofit)',
    description: 'Requested 40 units vs available 18; below minimum acceptable 20 — deferred until stock arrives.',
    action: 'Link order fulfilment to PO-2026-OW-004 arrival and re-run allocation.',
    meta: { requested: 40, available: 18, minimumAcceptable: 20 }, at: '2026-10-10T07:00:00Z' },
  { type: 'order_at_risk', severity: 'critical', product: 'OW-BLOW-G700', order: 'OW-010', resolved: false,
    title: 'Order at risk: OW-010 (Kanpur dye-house blower replacement)',
    description: 'HIGH priority order deferred: earlier promised-dated order consumed stock (2 units left, minimum 10).',
    action: 'Expedite replenishment or negotiate partial dispatch terms with the customer.',
    meta: { requested: 10, available: 2, minimumAcceptable: 10 }, at: '2026-10-10T07:10:00Z' },
  { type: 'priority_change_impact', severity: 'info', product: FMET_SKU, order: 'OW-008', resolved: true,
    title: 'Restock resolved deferred demand: OW-008 (FM-100)',
    description: 'Purchase order PO-2026-OW-002 arrived early (+20 units); replayed allocation now fulfils the full request.',
    action: null,
    meta: { restocked: 20, previousStatus: 'deferred', currentStatus: 'fulfilled' }, at: '2026-10-10T07:20:00Z', resolvedAt: '2026-10-10T08:00:00Z', resolvedBy: 'meera' },
];

/* ==========================================================================
 * SEED ORCHESTRATION
 * ======================================================================== */
async function seedMockData() {
  assertSafeTarget();

  const client = await pool.connect();
  const ids = { user: {}, product: {}, supplier: {}, po: {}, order: {}, rec: {} };
  const stats = { users: 0, products: 0, suppliers: 0, purchaseOrders: 0, poItems: 0, orders: 0, orderItems: 0, priorities: 0, aiRecommendations: 0, approvals: 0, audit: 0, movements: 0, alerts: 0 };

  try {
    /* ---- TX1: users, suppliers, products, POs, inventory ---------------- */
    await client.query('BEGIN');

    for (const u of USERS) {
      await upsert(client, 'users', ['email'],
        ['name', 'email', 'password_hash', 'role', 'active'],
        [u.name, u.email, PASSWORD_HASH, u.role, true],
        ['name', 'role', 'password_hash']);
      const r = await client.query('SELECT id FROM users WHERE email = $1', [u.email]);
      ids.user[u.key] = r.rows[0].id;
      stats.users += 1;
    }

    for (const s of SUPPLIERS) {
      await upsert(client, 'suppliers', ['code'],
        ['name', 'code', 'contact_email', 'lead_time_days', 'active'],
        [s.name, s.code, s.email, s.lead, true],
        ['name', 'contact_email', 'lead_time_days']);
      const r = await client.query('SELECT id FROM suppliers WHERE code = $1', [s.code]);
      ids.supplier[s.code] = r.rows[0].id;
      stats.suppliers += 1;
    }

    for (const p of PRODUCTS) {
      await upsert(client, 'products', ['sku'],
        ['sku', 'name', 'description', 'unit', 'active'],
        [p.sku, p.name, p.description, p.unit, true],
        ['name', 'description', 'unit', 'active']);
      const r = await client.query('SELECT id FROM products WHERE sku = $1', [p.sku]);
      ids.product[p.sku] = r.rows[0].id;
      stats.products += 1;
    }

    for (const po of PURCHASE_ORDERS) {
      await upsert(client, 'purchase_orders', ['po_number'],
        ['po_number', 'supplier_id', 'status', 'expected_delivery_date', 'actual_delivery_date', 'created_at', 'updated_at'],
        [po.poNumber, ids.supplier[po.supplier], po.status, po.expected, po.actual, po.created, po.created],
        ['status', 'expected_delivery_date', 'actual_delivery_date']);
      const r = await client.query('SELECT id FROM purchase_orders WHERE po_number = $1', [po.poNumber]);
      ids.po[po.poNumber] = r.rows[0].id;
      stats.purchaseOrders += 1;
      for (const item of po.items) {
        const inserted = await insertIfAbsent(client, 'purchase_order_items',
          ['purchase_order_id', 'product_id'], [ids.po[po.poNumber], ids.product[item.sku]],
          ['purchase_order_id', 'product_id', 'quantity_ordered', 'quantity_received', 'created_at'],
          [ids.po[po.poNumber], ids.product[item.sku], item.qty, item.received, po.created]);
        if (inserted) stats.poItems += 1;
      }
    }

    await client.query('COMMIT');

    /* Inventory: preserve engine-computed reserved_quantity. FMET on-hand is
     * base + 20 once the restock receipt event has been applied. */
    await client.query('BEGIN');
    const fmetId = ids.product[FMET_SKU];
    const restockApplied = (
      await client.query(
        "SELECT 1 FROM inventory_movements WHERE product_id = $1 AND movement_type = 'receipt' AND created_at = $2 LIMIT 1",
        [fmetId, FMET_RESTOCK_TS]
      )
    ).rowCount > 0;

    for (const p of PRODUCTS) {
      const onHand = p.sku === FMET_SKU && restockApplied ? p.onHand + 20 : p.onHand;
      await upsert(client, 'inventory', ['product_id'],
        ['product_id', 'on_hand_quantity', 'safety_stock', 'reorder_point', 'version', 'updated_by'],
        [ids.product[p.sku], onHand, p.safety, p.reorder, 1, ids.user.meera],
        ['on_hand_quantity', 'safety_stock', 'reorder_point', 'updated_by']);
      stats.inventory = (stats.inventory || 0) + 1;
    }
    await client.query('COMMIT');

    /* ---- TX2: orders, items, priorities ---------------------------------- */
    await client.query('BEGIN');
    for (const o of ORDERS) {
      const idempotencyKey = ORDER_KEY_PREFIX + o.key;
      const inserted = await client.query(
        `INSERT INTO orders
           (customer_id, status, promised_delivery_date, business_notes, idempotency_key, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (idempotency_key) DO NOTHING
         RETURNING id`,
        [ids.user[o.customer], o.status, o.promised, o.notes, idempotencyKey, o.created, o.updated || o.created]
      );
      let orderId;
      if (inserted.rowCount > 0) {
        orderId = inserted.rows[0].id;
        stats.orders += 1;
      } else {
        orderId = (await client.query('SELECT id FROM orders WHERE idempotency_key = $1', [idempotencyKey])).rows[0].id;
      }
      ids.order[o.key] = orderId;

      for (const it of o.items) {
        await client.query(
          `INSERT INTO order_items
             (order_id, product_id, requested_quantity, minimum_acceptable_quantity, partial_delivery_allowed, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (order_id, product_id) DO UPDATE SET
             requested_quantity = EXCLUDED.requested_quantity,
             minimum_acceptable_quantity = EXCLUDED.minimum_acceptable_quantity,
             partial_delivery_allowed = EXCLUDED.partial_delivery_allowed,
             created_at = EXCLUDED.created_at`,
          [orderId, ids.product[it.sku], it.qty, it.min, it.partial, o.created]
        );
        stats.orderItems += 1;
      }

      await upsert(client, 'order_priorities', ['order_id'],
        ['order_id', 'approved_priority', 'priority_rank', 'notes', 'approved_by', 'approved_at', 'created_at', 'updated_at'],
        [orderId, o.priority.label, o.priority.rank, o.priority.notes,
          ids.user[o.priority.approvedBy], o.priority.approvedAt, o.created, o.updated || o.created],
        ['approved_priority', 'priority_rank', 'notes', 'approved_by', 'approved_at']);
      stats.priorities += 1;
    }
    await client.query('COMMIT');

    /* ---- Allocation runs (REAL engine, outside TX — it manages its own
     * transaction and advisory lock). Runs only when seeded order items
     * lack allocation coverage (self-healing after other seeds wipe
     * mock orders). ----------------------------------------------------- */
    const eligibleRes = await client.query(
      `SELECT count(*)::int AS c
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.idempotency_key LIKE 'mockdata:order:%'
         AND o.status IN ('pending', 'confirmed', 'allocated', 'partially_allocated')`
    );
    const coveredRes = await client.query(
      `SELECT count(DISTINCT ar.order_item_id)::int AS c
       FROM allocation_results ar
       JOIN order_items oi ON oi.id = ar.order_item_id
       JOIN orders o ON o.id = oi.order_id
       WHERE o.idempotency_key LIKE 'mockdata:order:%'`
    );
    const eligibleCount = eligibleRes.rows[0].c;
    const coveredCount = coveredRes.rows[0].c;
    const needsRun = eligibleCount > coveredCount;

    const mockProductIds = PRODUCTS.map((p) => ids.product[p.sku]);

    if (needsRun) {
      // Fresh reservation pool: the engine recalculates reserved_quantity
      // from scratch for every targeted product (never double-counts).
      await client.query(
        'UPDATE inventory SET reserved_quantity = 0, version = version + 1 WHERE product_id = ANY($1)',
        [mockProductIds]
      );

      await allocationEngine.runAllocationEngine({
        productIds: mockProductIds,
        initiatedBy: ids.user.ananya,
        notes: RUN1_NOTE,
      });

      // Restock event: PO-2026-OW-002 arrives early (+20 units of FMET).
      if (!restockApplied) {
        await client.query('BEGIN');
        const poId = ids.po['PO-2026-OW-002'];
        await insertIfAbsent(client, 'inventory_movements',
          ['product_id', 'movement_type', 'quantity', 'created_at'],
          [fmetId, 'receipt', 20, FMET_RESTOCK_TS],
          ['product_id', 'movement_type', 'quantity', 'previous_on_hand', 'new_on_hand',
            'reference_type', 'reference_id', 'created_by', 'created_at'],
          [fmetId, 'receipt', 20, 40, 60, 'purchase_orders', poId, ids.user.meera, FMET_RESTOCK_TS]);
        await client.query(
          'UPDATE inventory SET on_hand_quantity = on_hand_quantity + 20 WHERE product_id = $1',
          [fmetId]
        );
        await client.query(
          "UPDATE purchase_orders SET status = 'received', actual_delivery_date = '2026-10-10' WHERE id = $1",
          [poId]
        );
        await client.query('COMMIT');
      }

      // Replay run proves improvement: previously deferred FMET demand is
      // now fulfilled (Impact Analyzer demo, Scenario N traceability).
      await allocationEngine.runAllocationEngine({
        productIds: [fmetId],
        initiatedBy: ids.user.ananya,
        notes: RUN2_NOTE,
      });
    }

    /* ---- TX3: AI recommendations, approvals, audit, movements, alerts ---- */
    await client.query('BEGIN');

    for (const r of AI_RECS) {
      const orderId = ids.order[r.order];
      const inserted = await insertIfAbsent(client, 'ai_recommendations',
        ['order_id', 'created_at'], [orderId, r.created],
        ['order_id', 'suggested_priority', 'suggested_rank', 'confidence', 'explanation',
          'evidence', 'warning', 'provider', 'model', 'status', 'created_at'],
        [orderId, r.suggested, r.rank, r.confidence, r.explanation,
          r.evidence || null, r.warning || null, r.provider, 'llama3-70b-8192', r.status, r.created]);
      if (inserted) stats.aiRecommendations += 1;
      ids.rec[r.id] = (
        await client.query('SELECT id FROM ai_recommendations WHERE order_id = $1 AND created_at = $2', [orderId, r.created])
      ).rows[0].id;
    }

    for (const a of APPROVALS) {
      const rec = AI_RECS.find((x) => x.id === a.rec);
      const orderId = ids.order[rec.order];
      const inserted = await insertIfAbsent(client, 'priority_approvals',
        ['order_id', 'created_at'], [orderId, a.created],
        ['order_id', 'recommendation_id', 'decision', 'final_priority', 'final_rank',
          'override_reason', 'reviewed_by', 'created_at'],
        [orderId, ids.rec[a.rec], a.decision, a.final, a.rank,
          a.reason, ids.user.ananya, a.created]);
      if (inserted) stats.approvals += 1;
    }

    /* Audit trail: product creations, inventory adjustments, cancellations,
     * and priority decisions. Keyed lookups keep re-seeds idempotent. */
    for (const [idx, p] of PRODUCTS.entries()) {
      if (idx > 11) break; // 12 CREATE_PRODUCT entries
      const inserted = await insertIfAbsent(client, 'audit_logs',
        ['action', 'entity_type', 'entity_id', 'created_at'],
        ['CREATE_PRODUCT', 'products', ids.product[p.sku], '2026-09-05T05:00:00Z'],
        ['actor_id', 'action', 'entity_type', 'entity_id', 'before_state', 'after_state', 'created_at'],
        [ids.user.rohit, 'CREATE_PRODUCT', 'products', ids.product[p.sku], null,
          JSON.stringify({ sku: p.sku, name: p.name }),
          new Date(Date.parse('2026-09-05T05:00:00Z') + idx * 60000).toISOString()]);
      if (inserted) stats.audit += 1;
    }

    for (const adj of [
      { sku: 'OW-SDRV-E500', type: 'shipment', before: 12, after: 0, at: '2026-10-02T05:30:00Z' },
      { sku: 'OW-DPUMP-S1700', type: 'shipment', before: 6, after: 0, at: '2026-10-03T05:30:00Z' },
      { sku: 'OW-LSEN-R1600', type: 'adjustment', before: 15, after: 18, at: '2026-10-04T05:00:00Z' },
      { sku: 'OW-BVALV-Q1500', type: 'receipt', before: 35, after: 85, at: '2026-09-28T05:00:00Z' },
    ]) {
      const inserted = await insertIfAbsent(client, 'audit_logs',
        ['action', 'entity_type', 'entity_id', 'created_at'],
        ['ADJUST_INVENTORY', 'inventory', ids.product[adj.sku], adj.at],
        ['actor_id', 'action', 'entity_type', 'entity_id', 'before_state', 'after_state', 'created_at'],
        [ids.user.meera, 'ADJUST_INVENTORY', 'inventory', ids.product[adj.sku],
          JSON.stringify({ on_hand_quantity: adj.before, type: adj.type }),
          JSON.stringify({ on_hand_quantity: adj.after, type: adj.type }), adj.at]);
      if (inserted) stats.audit += 1;
    }

    for (const cancel of ['OW-013', 'OW-029', 'OW-030']) {
      const orderId = ids.order[cancel];
      const inserted = await insertIfAbsent(client, 'audit_logs',
        ['action', 'entity_type', 'entity_id', 'created_at'],
        ['CANCEL_ORDER', 'orders', orderId, '2026-10-05T05:30:00Z'],
        ['actor_id', 'action', 'entity_type', 'entity_id', 'before_state', 'after_state', 'created_at'],
        [ids.user.ananya, 'CANCEL_ORDER', 'orders', orderId,
          JSON.stringify({ status: 'pending' }), JSON.stringify({ status: 'cancelled' }),
          '2026-10-05T05:30:00Z']);
      if (inserted) stats.audit += 1;
    }

    for (const a of APPROVALS) {
      const rec = AI_RECS.find((x) => x.id === a.rec);
      const orderId = ids.order[rec.order];
      const actionByDecision = {
        approved: 'PRIORITY_APPROVED',
        overridden: 'PRIORITY_OVERRIDDEN',
        rejected: 'PRIORITY_REJECTED',
      };
      const inserted = await insertIfAbsent(client, 'audit_logs',
        ['action', 'entity_type', 'entity_id', 'created_at'],
        [actionByDecision[a.decision], 'orders', orderId, a.created],
        ['actor_id', 'action', 'entity_type', 'entity_id', 'before_state', 'after_state', 'created_at'],
        [ids.user.ananya, actionByDecision[a.decision], 'orders', orderId,
          JSON.stringify({ suggested_priority: rec.suggested }),
          JSON.stringify({ decision: a.decision, final_priority: a.final }), a.created]);
      if (inserted) stats.audit += 1;
    }

    for (const m of MOVEMENTS_SEED) {
      const inserted = await insertIfAbsent(client, 'inventory_movements',
        ['product_id', 'movement_type', 'quantity', 'created_at'],
        [ids.product[m.sku], m.type, m.qty, m.at],
        ['product_id', 'movement_type', 'quantity', 'previous_on_hand', 'new_on_hand',
          'reference_type', 'reference_id', 'created_by', 'created_at'],
        [ids.product[m.sku], m.type, m.qty, m.prev, m.next,
          m.po ? 'purchase_orders' : null, m.po ? ids.po[m.po] : null, ids.user[m.by], m.at]);
      if (inserted) stats.movements += 1;
    }

    for (const al of ALERTS_SEED) {
      const inserted = await insertIfAbsent(client, 'alerts',
        ['alert_type', 'created_at'], [al.type, al.at],
        ['alert_type', 'severity', 'title', 'description', 'suggested_action',
          'product_id', 'order_id', 'resolved', 'resolved_at', 'resolved_by', 'metadata', 'created_at'],
        [al.type, al.severity, al.title, al.description, al.action,
          ids.product[al.product], al.order ? ids.order[al.order] : null,
          al.resolved, al.resolvedAt || null, al.resolvedBy ? ids.user[al.resolvedBy] : null,
          JSON.stringify(al.meta || {}), al.at]);
      if (inserted) stats.alerts += 1;
    }

    await client.query('COMMIT');

    console.log('[MOCK-SEED] Seed complete. Ensured rows:', JSON.stringify(stats));
    console.log(`[MOCK-SEED] Allocation engine: ${needsRun ? '2 runs executed' : 'coverage already complete (skipped)'}`);
    console.log('[MOCK-SEED] Mock accounts use password "Mock@2026" (test-only); all data is synthetic.');
    return stats;
  } finally {
    client.release();
  }
}

module.exports = { seedMockData };

/* CLI entry: `npm run seed:mock` (or `node src/db/seeds/mockData.js`). */
if (require.main === module) {
  seedMockData()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[MOCK-SEED] Seed failed:', err.message);
      pool.end().finally(() => process.exit(1));
    });
}






















