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

// ===APPEND===




