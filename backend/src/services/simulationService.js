const { getPool, query } = require('../config/db');
const { allocate, priorityToRank } = require('./allocationEngine');
const { AppError } = require('../utils/response');

/**
 * ============================================================================
 * WHAT-IF SIMULATION SERVICE
 * ============================================================================
 * Core principle: Safe experiments that NEVER modify live database tables.
 * State is read using a READ ONLY transaction, mutated strictly in-memory,
 * and evaluated using the pure allocate() engine.
 * Only simulation metadata is saved to the `simulations` table.
 * ============================================================================
 */

/**
 * Fetches current live inventory and eligible orders using a READ ONLY transaction.
 */
async function fetchLiveSnapshot() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN TRANSACTION READ ONLY;');

    // 1. Fetch products & inventory
    const invRes = await client.query(`
      SELECT p.id as product_id, p.name as product_name, p.sku,
             i.on_hand_quantity, i.reserved_quantity, i.safety_stock
      FROM products p
      JOIN inventory i ON i.product_id = p.id
      WHERE p.active = true
      ORDER BY p.id ASC;
    `);

    // 2. Fetch eligible order items
    const ordersRes = await client.query(`
      SELECT oi.id as order_item_id, oi.order_id, oi.product_id,
             oi.requested_quantity, oi.minimum_acceptable_quantity, oi.partial_delivery_allowed,
             op.approved_priority, op.priority_rank,
             o.promised_delivery_date, o.created_at as order_created_at,
             o.customer_id, u.name as customer_name,
             p.name as product_name, p.sku
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN users u ON u.id = o.customer_id
      JOIN products p ON p.id = oi.product_id
      JOIN order_priorities op ON op.order_id = o.id
      WHERE o.status IN ('pending', 'confirmed', 'allocated', 'partially_allocated')
      ORDER BY op.priority_rank DESC,
               o.promised_delivery_date ASC NULLS LAST,
               o.created_at ASC,
               o.id ASC,
               oi.id ASC;
    `);

    await client.query('COMMIT;');

    const normalizedItems = ordersRes.rows.map((item) => ({
      ...item,
      id: Number(item.order_item_id),
      order_item_id: Number(item.order_item_id),
      order_id: Number(item.order_id),
      product_id: Number(item.product_id),
      requested_quantity: Number(item.requested_quantity),
      minimum_acceptable_quantity: Number(item.minimum_acceptable_quantity ?? 0),
      partial_delivery_allowed: item.partial_delivery_allowed !== false,
      priority_rank: Number(item.priority_rank),
      approved_priority: item.approved_priority,
      promised_delivery_date: item.promised_delivery_date,
      created_at: item.order_created_at,
    }));

    return {
      inventory: invRes.rows,
      items: normalizedItems,
    };
  } catch (err) {
    await client.query('ROLLBACK;').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Applies scenario mutations to deep-copied in-memory inventory and items.
 */
function applyScenarioMutations(baseInventory, baseItems, scenarioType, scenarioInputs) {
  // Deep copy in-memory state
  const simStockMap = new Map();
  baseInventory.forEach((inv) => {
    simStockMap.set(Number(inv.product_id), {
      product_id: Number(inv.product_id),
      product_name: inv.product_name,
      sku: inv.sku,
      on_hand_quantity: Number(inv.on_hand_quantity),
    });
  });

  const simItems = baseItems.map((item) => ({
    ...item,
    id: Number(item.id ?? item.order_item_id),
    order_item_id: Number(item.id ?? item.order_item_id),
    order_id: Number(item.order_id),
    product_id: Number(item.product_id),
    requested_quantity: Number(item.requested_quantity),
    minimum_acceptable_quantity: Number(item.minimum_acceptable_quantity ?? 0),
    partial_delivery_allowed: item.partial_delivery_allowed !== false,
    priority_rank: Number(item.priority_rank),
    approved_priority: item.approved_priority,
    promised_delivery_date: item.promised_delivery_date,
    created_at: item.order_created_at || item.created_at,
  }));

  const steps =
    scenarioType === 'chained' && Array.isArray(scenarioInputs.steps)
      ? scenarioInputs.steps
      : [{ type: scenarioType, inputs: scenarioInputs }];

  const appliedDescriptions = [];

  for (const step of steps) {
    const sType = step.type || step.scenario_type;
    const sIn = step.inputs || step.scenario_inputs || step;

    switch (sType) {
      case 'inventory_increase': {
        const pId = Number(sIn.product_id ?? sIn.productId);
        const qty = Number(sIn.quantity) || 0;
        const entry = simStockMap.get(pId);
        if (entry) {
          entry.on_hand_quantity += qty;
          appliedDescriptions.push(`Increased stock of ${entry.product_name || entry.sku} by ${qty} units.`);
        }
        break;
      }

      case 'inventory_decrease': {
        const pId = Number(sIn.product_id ?? sIn.productId);
        const qty = Number(sIn.quantity) || 0;
        const entry = simStockMap.get(pId);
        if (entry) {
          entry.on_hand_quantity = Math.max(0, entry.on_hand_quantity - qty);
          appliedDescriptions.push(`Decreased stock of ${entry.product_name || entry.sku} by ${qty} units.`);
        }
        break;
      }

      case 'demand_surge': {
        const percent = Number(sIn.surge_percent ?? sIn.surgePercent) || 0;
        const targetPid = sIn.product_id || sIn.productId ? Number(sIn.product_id || sIn.productId) : null;
        simItems.forEach((item) => {
          if (!targetPid || Number(item.product_id) === targetPid) {
            item.requested_quantity = Math.ceil(item.requested_quantity * (1 + percent / 100));
          }
        });
        appliedDescriptions.push(`Simulated ${percent}% demand surge${targetPid ? ` on product #${targetPid}` : ' across all products'}.`);
        break;
      }

      case 'supplier_delay': {
        const targetPid = sIn.product_id || sIn.productId ? Number(sIn.product_id || sIn.productId) : null;
        const delayDays = Number(sIn.delay_days || sIn.delayDays || 14);
        simItems.forEach((item) => {
          if (!targetPid || Number(item.product_id) === targetPid) {
            if (item.promised_delivery_date) {
              const d = new Date(item.promised_delivery_date);
              d.setDate(d.getDate() + delayDays);
              item.promised_delivery_date = d.toISOString().split('T')[0];
            }
          }
        });
        appliedDescriptions.push(`Simulated supplier delay of ${delayDays} days.`);
        break;
      }

      case 'priority_change': {
        const orderId = Number(sIn.order_id ?? sIn.orderId);
        const newPriority = (sIn.hypothetical_priority || sIn.hypotheticalPriority || sIn.new_priority || 'critical').toLowerCase();
        const newRank = priorityToRank(newPriority);
        simItems.forEach((item) => {
          if (Number(item.order_id) === orderId) {
            item.approved_priority = newPriority;
            item.priority_rank = newRank;
          }
        });
        appliedDescriptions.push(`Changed Order #${orderId} priority to ${newPriority.toUpperCase()}.`);
        break;
      }

      default:
        throw new AppError(`Unknown scenario type: ${sType}`, 'VALIDATION_ERROR', 400);
    }
  }

  return {
    simStockMap,
    simItems,
    description: appliedDescriptions.join(' '),
  };
}

/**
 * Runs pure allocation for a set of items and stock map.
 */
function runPureAllocationMap(items, stockMap) {
  const resultsByProduct = new Map();
  const allResults = [];
  let totalAllocated = 0;

  for (const [pId, stockEntry] of stockMap.entries()) {
    const pItems = items.filter((i) => Number(i.product_id) === Number(pId));
    const alloc = allocate(pItems, stockEntry.on_hand_quantity);

    resultsByProduct.set(pId, alloc);
    allResults.push(...alloc.results);
    totalAllocated += alloc.totalAllocated;
  }

  return {
    results: allResults,
    totalAllocated,
    resultsByProduct,
  };
}

/**
 * Compares baseline allocation against simulated allocation and builds detailed diffs.
 */
function buildComparisonDiff(baselineAllocations, simulatedAllocations, simDescription, simStockMap) {
  const simulatedMap = new Map();
  simulatedAllocations.forEach((sim) => {
    simulatedMap.set(Number(sim.order_item_id), sim);
  });

  const changes = [];
  const newlyFulfilled = [];
  const stillDeferred = [];
  const affectedOrdersSet = new Set();

  baselineAllocations.forEach((base) => {
    const sim = simulatedMap.get(Number(base.order_item_id));
    if (!sim) return;

    const baseQty = Number(base.allocated_quantity);
    const simQty = Number(sim.allocated_quantity);
    const delta = simQty - baseQty;
    const statusChanged = base.status !== sim.status;
    const changed = delta !== 0 || statusChanged;

    let changeType = 'unchanged';
    if (sim.status === 'fulfilled' && base.status !== 'fulfilled') {
      changeType = 'newly_fulfilled';
      newlyFulfilled.push(`${sim.customer_name || 'Customer'} — Order #${sim.order_id}`);
    } else if (delta > 0) {
      changeType = 'improved';
    } else if (delta < 0) {
      changeType = 'degraded';
    } else if (sim.status === 'deferred' && base.status !== 'deferred') {
      changeType = 'newly_deferred';
    }

    if (sim.status === 'deferred') {
      stillDeferred.push(
        `${sim.customer_name || 'Customer'} — Order #${sim.order_id} (${sim.explanation?.reason || 'deferred'})`
      );
    }

    if (changed) {
      affectedOrdersSet.add(Number(sim.order_id));
    }

    changes.push({
      order_item_id: sim.order_item_id,
      order_id: sim.order_id,
      product_id: sim.product_id,
      product_name: sim.product_name,
      sku: sim.sku,
      customer_name: sim.customer_name,
      requested_quantity: sim.requested_quantity,
      baseline_allocated: baseQty,
      simulated_allocated: simQty,
      baseline_status: base.status,
      simulated_status: sim.status,
      delta,
      change_type: changeType,
      changed,
      explanation: sim.explanation?.reason || '',
    });
  });

  // Calculate remaining stock across all products
  let totalRemainingStock = 0;
  for (const stockEntry of simStockMap.values()) {
    const pAllocated = simulatedAllocations
      .filter((a) => a.product_id === stockEntry.product_id)
      .reduce((sum, a) => sum + a.allocated_quantity, 0);
    totalRemainingStock += Math.max(0, stockEntry.on_hand_quantity - pAllocated);
  }

  return {
    scenario_description: simDescription,
    affected_orders: affectedOrdersSet.size,
    total_items_compared: changes.length,
    total_changed: changes.filter((c) => c.changed).length,
    improvements: changes.filter((c) => c.delta > 0).length,
    degradations: changes.filter((c) => c.delta < 0).length,
    newly_fulfilled: newlyFulfilled,
    still_deferred: stillDeferred,
    remaining_simulated_stock: totalRemainingStock,
    current_allocation: baselineAllocations.map((b) => ({
      order_id: b.order_id,
      order_item_id: b.order_item_id,
      customer: b.customer_name,
      allocated: b.allocated_quantity,
      status: b.status,
    })),
    simulated_allocation: simulatedAllocations.map((s) => ({
      order_id: s.order_id,
      order_item_id: s.order_item_id,
      customer: s.customer_name,
      allocated: s.allocated_quantity,
      status: s.status,
      explanation: s.explanation?.reason,
    })),
    changes,
    note: 'This is a simulation. No live data was modified.',
  };
}

/**
 * Runs a complete what-if simulation experiment and saves the record.
 */
async function runSimulation({
  scenarioType,
  scenarioInputs,
  userId,
  name = null,
  description = null,
  saveRecord = true,
}) {
  // 1. Fetch live snapshot via READ ONLY transaction
  const live = await fetchLiveSnapshot();

  // 2. Compute baseline allocation
  const baseStockMap = new Map();
  live.inventory.forEach((inv) => {
    baseStockMap.set(Number(inv.product_id), {
      product_id: Number(inv.product_id),
      product_name: inv.product_name,
      sku: inv.sku,
      on_hand_quantity: Number(inv.on_hand_quantity),
    });
  });

  const baseAlloc = runPureAllocationMap(live.items, baseStockMap);

  // 3. Apply scenario mutations in-memory
  const mutated = applyScenarioMutations(
    live.inventory,
    live.items,
    scenarioType,
    scenarioInputs
  );

  // 4. Run simulated allocation on in-memory mutated copies
  const simAlloc = runPureAllocationMap(mutated.simItems, mutated.simStockMap);

  // 5. Compare baseline vs simulated
  const diff = buildComparisonDiff(
    baseAlloc.results,
    simAlloc.results,
    mutated.description,
    mutated.simStockMap
  );

  let savedRecord = null;

  if (saveRecord) {
    const insertRes = await query(
      `INSERT INTO simulations (user_id, scenario_type, scenario_inputs, results, name, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, user_id, scenario_type, scenario_inputs, name, description, created_at;`,
      [
        userId,
        scenarioType,
        JSON.stringify(scenarioInputs),
        JSON.stringify(diff),
        name || `${scenarioType.replace('_', ' ').toUpperCase()} Simulation`,
        description || mutated.description,
      ]
    );
    savedRecord = insertRes.rows[0];
  }

  return {
    simulation: savedRecord || {
      scenario_type: scenarioType,
      scenario_inputs: scenarioInputs,
      name,
      description: mutated.description,
    },
    results: diff,
  };
}

/**
 * Returns past simulation records.
 */
async function getSimulations({ page = 1, limit = 20 } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (p - 1) * l;

  const countRes = await query(`SELECT count(*)::int as total FROM simulations;`);
  const total = countRes.rows[0]?.total || 0;

  const rowsRes = await query(
    `SELECT s.id, s.scenario_type, s.scenario_inputs, s.name, s.description,
            s.created_at, u.name as user_name, u.email as user_email,
            (s.results->>'affected_orders')::int as affected_orders,
            (s.results->>'total_changed')::int as total_changed
     FROM simulations s
     LEFT JOIN users u ON u.id = s.user_id
     ORDER BY s.id DESC
     LIMIT $1 OFFSET $2;`,
    [l, offset]
  );

  return {
    simulations: rowsRes.rows,
    pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) || 1 },
  };
}

/**
 * Returns a specific simulation record by ID.
 */
async function getSimulationById(id) {
  const res = await query(
    `SELECT s.*, u.name as user_name, u.email as user_email
     FROM simulations s
     LEFT JOIN users u ON u.id = s.user_id
     WHERE s.id = $1;`,
    [id]
  );

  if (res.rowCount === 0) {
    throw new AppError(`Simulation with ID ${id} not found`, 'NOT_FOUND', 404);
  }

  return res.rows[0];
}

/**
 * Compares two or more saved simulations side-by-side.
 */
async function compareSimulations(simulationIds) {
  if (!Array.isArray(simulationIds) || simulationIds.length < 2) {
    throw new AppError('At least two simulation IDs are required for comparison', 'VALIDATION_ERROR', 400);
  }

  const ids = simulationIds.map(Number);
  const simRes = await query(
    `SELECT s.id, s.scenario_type, s.scenario_inputs, s.results, s.name, s.description, s.created_at
     FROM simulations s
     WHERE s.id = ANY($1::bigint[])
     ORDER BY s.id ASC;`,
    [ids]
  );

  if (simRes.rows.length < 2) {
    throw new AppError('Could not find all specified simulations to compare', 'NOT_FOUND', 404);
  }

  const comparison = simRes.rows.map((row) => ({
    id: row.id,
    name: row.name,
    scenario_type: row.scenario_type,
    description: row.description,
    inputs: row.scenario_inputs,
    affected_orders: row.results?.affected_orders || 0,
    total_changed: row.results?.total_changed || 0,
    improvements: row.results?.improvements || 0,
    degradations: row.results?.degradations || 0,
    remaining_stock: row.results?.remaining_simulated_stock || 0,
    newly_fulfilled: row.results?.newly_fulfilled || [],
  }));

  return {
    compared_count: comparison.length,
    scenarios: comparison,
  };
}

module.exports = {
  fetchLiveSnapshot,
  applyScenarioMutations,
  runSimulation,
  getSimulations,
  getSimulationById,
  compareSimulations,
};
