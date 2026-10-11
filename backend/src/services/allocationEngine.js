const crypto = require('crypto');
const { getPool, query } = require('../config/db');
const { AppError } = require('../utils/response');
const { logAuditEvent } = require('../utils/audit');
const { ORDER_STATUS } = require('./orderStateMachine');

/**
 * ============================================================================
 * RESERVATION STRATEGY SPECIFICATION
 * ============================================================================
 * 1. Initial State & Invariance:
 *    - Physical stock is tracked in inventory.on_hand_quantity.
 *    - Committed units are tracked in inventory.reserved_quantity.
 *    - Available stock for new or reallocated demand is:
 *      available = on_hand_quantity - reserved_quantity (during normal state).
 * 2. On Allocation / Reallocation Rerun:
 *    - At the start of a run for a product, reserved_quantity is recalculated from scratch.
 *    - The allocation engine takes physical on_hand_quantity as its initial available pool.
 *    - All eligible orders are evaluated in strict deterministic priority order.
 *    - Upon conclusion, inventory.reserved_quantity is atomically set to the exact sum of
 *      allocated_quantity for that product.
 *    - This guarantees ZERO double-counting across repeated runs.
 * 3. On Cancellation:
 *    - An order transitioning to 'cancelled' is excluded from future allocation runs.
 *    - Triggering an allocation run immediately releases previously reserved stock to
 *      other pending or deferred orders.
 * 4. On Order Shipment & Completion:
 *    - Orders in 'shipped' or 'completed' status have irrevocable physical commitments
 *      and are never modified or reallocated by future runs.
 * ============================================================================
 */

const PRIORITY_RANKS = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const RANK_LABELS = {
  4: 'critical',
  3: 'high',
  2: 'medium',
  1: 'low',
};

function priorityToRank(priority) {
  if (!priority) return PRIORITY_RANKS.medium;
  const p = String(priority).toLowerCase();
  return PRIORITY_RANKS[p] || PRIORITY_RANKS.medium;
}

function rankToPriority(rank) {
  return RANK_LABELS[Number(rank)] || 'medium';
}

function safeIsoDate(d, dateOnly = false) {
  if (!d) return null;
  const t = new Date(d).getTime();
  if (isNaN(t)) return null;
  const iso = new Date(t).toISOString();
  return dateOnly ? iso.split('T')[0] : iso;
}

function safeTimestamp(d) {
  if (!d) return null;
  const t = new Date(d).getTime();
  return isNaN(t) ? null : t;
}

/**
 * Computes a deterministic SHA-256 checksum of the inputs.
 * Guarantees that identical inputs produce provably identical run checksums.
 */
function computeInputHash(items, stock) {
  const canonical = {
    stock: Number(stock),
    items: items
      .map((i) => ({
        id: Number(i.id ?? i.order_item_id ?? 0),
        order_id: Number(i.order_id ?? 0),
        product_id: Number(i.product_id ?? 0),
        requested: Number(i.requested_quantity ?? 0),
        min: Number(i.minimum_acceptable_quantity ?? 0),
        partial: i.partial_delivery_allowed !== false,
        rank: Number(i.priority_rank ?? priorityToRank(i.approved_priority)),
        date: safeIsoDate(i.promised_delivery_date, true),
        created: safeIsoDate(i.created_at, false),
      }))
      .sort((a, b) => (a.id !== b.id ? a.id - b.id : a.order_id - b.order_id)),
  };

  return crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

/**
 * Layer 1: PURE ALLOCATION FUNCTION
 * Deterministic allocation with NO database access. Reused in Simulation Lab.
 *
 * @param {Array<Object>} items - Array of order item candidates.
 * @param {number} stock - Physical stock available for allocation.
 * @returns {Object} { results, totalAllocated, remainingStock, stockAtStart, summary }
 */
function allocate(items, stock) {
  const availableStock = Math.max(0, Number(stock) || 0);
  let remainingStock = availableStock;

  // 1. Strict deterministic sort
  // Sort order:
  // 1. priority_rank DESC (Critical 4, High 3, Medium 2, Low 1)
  // 2. promised_delivery_date ASC NULLS LAST
  // 3. order.created_at ASC
  // 4. order.id ASC
  // 5. item.id ASC (tie-break between items in same order)
  const sortedItems = [...items].sort((a, b) => {
    const rankA = Number(a.priority_rank ?? priorityToRank(a.approved_priority));
    const rankB = Number(b.priority_rank ?? priorityToRank(b.approved_priority));
    if (rankB !== rankA) return rankB - rankA;

    const dateA = safeTimestamp(a.promised_delivery_date);
    const dateB = safeTimestamp(b.promised_delivery_date);
    if (dateA !== null && dateB !== null) {
      if (dateA !== dateB) return dateA - dateB;
    } else if (dateA !== null && dateB === null) {
      return -1; // dateA comes before null
    } else if (dateA === null && dateB !== null) {
      return 1; // null comes after dateB
    }

    const createdA = safeTimestamp(a.created_at) || 0;
    const createdB = safeTimestamp(b.created_at) || 0;
    if (createdA !== createdB) return createdA - createdB;

    const orderIdA = Number(a.order_id ?? 0);
    const orderIdB = Number(b.order_id ?? 0);
    if (orderIdA !== orderIdB) return orderIdA - orderIdB;

    const itemIdA = Number(a.id ?? a.order_item_id ?? 0);
    const itemIdB = Number(b.id ?? b.order_item_id ?? 0);
    return itemIdA - itemIdB;
  });

  const results = [];

  for (const item of sortedItems) {
    const requested = Number(item.requested_quantity) || 0;
    const minAcceptable = Number(item.minimum_acceptable_quantity ?? 0);
    const partialAllowed = item.partial_delivery_allowed !== false;
    const rank = Number(item.priority_rank ?? priorityToRank(item.approved_priority));
    const priorityLabel = item.approved_priority || rankToPriority(rank);
    const stockConsumedPrior = availableStock - remainingStock;

    let allocated = 0;
    let status = 'deferred';
    let reason = '';

    if (remainingStock >= requested) {
      // Case A: Full fulfillment
      allocated = requested;
      status = 'fulfilled';
      if (stockConsumedPrior === 0) {
        reason = `Allocated ${allocated} of ${requested}. Available stock (${availableStock} units) was sufficient to fulfill the complete request.`;
      } else {
        reason = `Allocated ${allocated} of ${requested}. Higher-priority orders consumed ${stockConsumedPrior} of ${availableStock} units. Remaining ${remainingStock} units were sufficient to fulfill the complete request.`;
      }
    } else if (partialAllowed && remainingStock >= minAcceptable && remainingStock > 0) {
      // Case B: Partial fulfillment
      allocated = remainingStock;
      status = 'partially_fulfilled';
      reason = `Allocated ${allocated} of ${requested}. Higher-priority orders consumed ${stockConsumedPrior} of ${availableStock} units. Remaining ${allocated} met your minimum acceptable quantity of ${minAcceptable}.`;
    } else {
      // Case C or D: Deferred
      allocated = 0;
      status = 'deferred';
      if (!partialAllowed) {
        reason = `Allocated 0 of ${requested}. Partial delivery is not permitted for this order item. Higher-priority orders consumed ${stockConsumedPrior} of ${availableStock} units, leaving ${remainingStock} units which is insufficient for the full request.`;
      } else {
        reason = `Allocated 0 of ${requested}. Higher-priority orders consumed ${stockConsumedPrior} of ${availableStock} units. Remaining ${remainingStock} units was below your minimum acceptable quantity of ${minAcceptable}.`;
      }
    }

    if (allocated > 0) {
      remainingStock -= allocated;
    }

    const explanation = {
      requested_quantity: requested,
      allocated_quantity: allocated,
      approved_priority: priorityLabel,
      priority_rank: rank,
      promised_delivery_date: item.promised_delivery_date || null,
      stock_at_allocation: availableStock,
      stock_consumed_prior: stockConsumedPrior,
      stock_remaining_after: remainingStock,
      partial_delivery_allowed: partialAllowed,
      minimum_acceptable_quantity: minAcceptable,
      status,
      reason,
    };

    results.push({
      order_item_id: Number(item.id ?? item.order_item_id),
      order_id: Number(item.order_id),
      product_id: Number(item.product_id),
      customer_id: item.customer_id ? Number(item.customer_id) : undefined,
      customer_name: item.customer_name || undefined,
      product_name: item.product_name || undefined,
      sku: item.sku || undefined,
      requested_quantity: requested,
      allocated_quantity: allocated,
      status,
      explanation,
    });
  }

  const fulfilledCount = results.filter((r) => r.status === 'fulfilled').length;
  const partiallyFulfilledCount = results.filter((r) => r.status === 'partially_fulfilled').length;
  const deferredCount = results.filter((r) => r.status === 'deferred').length;

  return {
    results,
    totalAllocated: availableStock - remainingStock,
    remainingStock,
    stockAtStart: availableStock,
    totalItems: sortedItems.length,
    summary: {
      total_items_processed: sortedItems.length,
      fulfilled: fulfilledCount,
      partially_fulfilled: partiallyFulfilledCount,
      deferred: deferredCount,
    },
  };
}

/**
 * Derives overall order-level status from the statuses of its individual items.
 * Rules per ALLOCATION_ENGINE.md Section 8:
 * - All fulfilled -> 'allocated'
 * - All deferred -> 'pending' (stays pending)
 * - Mixed -> 'partially_allocated'
 */
function deriveOrderStatus(itemStatuses) {
  if (!itemStatuses || itemStatuses.length === 0) return ORDER_STATUS.PENDING;
  if (itemStatuses.every((s) => s === 'fulfilled')) return ORDER_STATUS.ALLOCATED;
  if (itemStatuses.every((s) => s === 'deferred')) return ORDER_STATUS.PENDING;
  return ORDER_STATUS.PARTIALLY_ALLOCATED;
}

/**
 * Layer 2: DATABASE WRAPPER TRANSACTION
 * Acquires global lock, loads live state, runs the pure allocation function,
 * and persists results atomically.
 */
const GLOBAL_ALLOCATION_LOCK_ID = 987654321;

async function runAllocationEngine({
  productIds = 'all',
  initiatedBy = null,
  notes = '',
  dryRun = false,
  reqMeta = {},
} = {}) {
  const pool = getPool();
  const client = await pool.connect();
  let lockAcquired = false;

  try {
    // 1. Global concurrency lock via PostgreSQL advisory lock
    const lockRes = await client.query(
      `SELECT pg_try_advisory_lock($1) AS acquired;`,
      [GLOBAL_ALLOCATION_LOCK_ID]
    );

    lockAcquired = Boolean(lockRes.rows[0]?.acquired);
    if (!lockAcquired) {
      throw new AppError(
        'An allocation run is currently in progress. Please wait for it to complete.',
        'CONCURRENT_ALLOCATION_LOCKED',
        409
      );
    }

    const startTime = Date.now();
    await client.query('BEGIN');

    // 2. Determine target product IDs
    let targetProductIds = [];
    if (productIds === 'all' || !productIds) {
      const prodRes = await client.query(
        `SELECT DISTINCT p.id FROM products p
         JOIN inventory i ON i.product_id = p.id
         WHERE p.active = true
         ORDER BY p.id ASC;`
      );
      targetProductIds = prodRes.rows.map((r) => Number(r.id));
    } else {
      const pIds = Array.isArray(productIds) ? productIds : [productIds];
      targetProductIds = pIds.map(Number).filter((id) => Number.isInteger(id) && id > 0);
    }

    if (targetProductIds.length === 0) {
      await client.query('ROLLBACK');
      return {
        dryRun,
        summary: { total_items_processed: 0, fulfilled: 0, partially_fulfilled: 0, deferred: 0 },
        results: [],
        message: 'No eligible products found for allocation.',
      };
    }

    const allAllocations = [];
    const allInputItems = [];
    let grandStock = 0;
    const inventoryUpdates = [];
    const touchedOrderIds = new Set();

    // 3. For each target product: lock inventory row, query eligible items, run pure allocate()
    for (const productId of targetProductIds) {
      // Row-level lock on inventory row within transaction
      const invRes = await client.query(
        `SELECT product_id, on_hand_quantity, reserved_quantity, version
         FROM inventory
         WHERE product_id = $1
         FOR UPDATE;`,
        [productId]
      );

      if (invRes.rowCount === 0) continue;

      const currentInv = invRes.rows[0];
      const onHandStock = Number(currentInv.on_hand_quantity);
      grandStock += onHandStock;

      // Query eligible items for this product
      // Eligibility criteria per ALLOCATION_ENGINE.md:
      // - order.status IN ('pending', 'confirmed', 'allocated', 'partially_allocated')
      // - order NOT IN ('cancelled', 'shipped', 'completed')
      // - approved priority exists in order_priorities
      // - requested_quantity > 0
      const itemsRes = await client.query(
        `SELECT
           oi.id,
           oi.order_id,
           oi.product_id,
           oi.requested_quantity,
           oi.minimum_acceptable_quantity,
           oi.partial_delivery_allowed,
           op.approved_priority,
           op.priority_rank,
           o.promised_delivery_date,
           o.created_at,
           o.customer_id,
           u.name AS customer_name,
           p.name AS product_name,
           p.sku
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         JOIN users u ON u.id = o.customer_id
         JOIN products p ON p.id = oi.product_id
         JOIN order_priorities op ON op.order_id = o.id
         WHERE oi.product_id = $1
           AND o.status IN ('pending', 'confirmed', 'allocated', 'partially_allocated')
         ORDER BY
           op.priority_rank DESC,
           o.promised_delivery_date ASC NULLS LAST,
           o.created_at ASC,
           o.id ASC,
           oi.id ASC;`,
        [productId]
      );

      const items = itemsRes.rows;
      items.forEach((item) => {
        allInputItems.push(item);
        touchedOrderIds.add(Number(item.order_id));
      });

      // Run pure allocation algorithm
      const allocOutcome = allocate(items, onHandStock);

      allAllocations.push(...allocOutcome.results);

      inventoryUpdates.push({
        productId,
        newReservedQuantity: allocOutcome.totalAllocated,
        onHandQuantity: onHandStock,
      });
    }

    // Compute input checksum
    const inputHash = computeInputHash(allInputItems, grandStock);

    const summary = {
      total_items_processed: allAllocations.length,
      fulfilled: allAllocations.filter((a) => a.status === 'fulfilled').length,
      partially_fulfilled: allAllocations.filter((a) => a.status === 'partially_fulfilled').length,
      deferred: allAllocations.filter((a) => a.status === 'deferred').length,
      total_orders_considered: touchedOrderIds.size,
    };

    // If dry run, rollback immediately and return calculated results
    if (dryRun) {
      await client.query('ROLLBACK');
      return {
        dryRun: true,
        inputHash,
        summary,
        results: allAllocations,
      };
    }

    // 4. Persist run record
    const runRes = await client.query(
      `INSERT INTO allocation_runs (
         run_type,
         status,
         total_orders_considered,
         total_items_considered,
         total_items_fulfilled,
         total_items_partially_fulfilled,
         total_items_deferred,
         initiated_by,
         notes,
         input_hash,
         created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING id, run_type, status, created_at, notes, input_hash;`,
      [
        'manual',
        'in_progress',
        summary.total_orders_considered,
        summary.total_items_processed,
        summary.fulfilled,
        summary.partially_fulfilled,
        summary.deferred,
        initiatedBy,
        notes || null,
        inputHash,
      ]
    );

    const runId = runRes.rows[0].id;

    // 5. Persist allocation results (append-only)
    for (const alloc of allAllocations) {
      await client.query(
        `INSERT INTO allocation_results (
           allocation_run_id,
           order_item_id,
           requested_quantity,
           allocated_quantity,
           status,
           explanation,
           created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, NOW());`,
        [
          runId,
          alloc.order_item_id,
          alloc.requested_quantity,
          alloc.allocated_quantity,
          alloc.status,
          JSON.stringify(alloc.explanation),
        ]
      );
    }

    // 6. Update inventory reservations & log movements
    for (const inv of inventoryUpdates) {
      await client.query(
        `UPDATE inventory
         SET reserved_quantity = $1,
             version = version + 1,
             updated_at = NOW()
         WHERE product_id = $2;`,
        [inv.newReservedQuantity, inv.productId]
      );

      // Ledger movement tracking
      await client.query(
        `INSERT INTO inventory_movements (
           product_id,
           movement_type,
           quantity,
           previous_on_hand,
           new_on_hand,
           reference_type,
           reference_id,
           created_by
         ) VALUES ($1, 'allocation', $2, $3, $3, 'allocation_runs', $4, $5);`,
        [inv.productId, inv.newReservedQuantity, inv.onHandQuantity, runId, initiatedBy]
      );
    }

    // 7. Update touched order statuses based on newly derived allocation results
    for (const orderId of touchedOrderIds) {
      // Query all items for this order and their latest allocation result in this run
      const orderItemsRes = await client.query(
        `SELECT ar.status
         FROM order_items oi
         JOIN allocation_results ar ON ar.order_item_id = oi.id
         WHERE oi.order_id = $1 AND ar.allocation_run_id = $2;`,
        [orderId, runId]
      );

      const itemStatuses = orderItemsRes.rows.map((r) => r.status);
      const newOrderStatus = deriveOrderStatus(itemStatuses);

      await client.query(
        `UPDATE orders
         SET status = $1, updated_at = NOW()
         WHERE id = $2;`,
        [newOrderStatus, orderId]
      );
    }

    // 8. Finalize allocation run
    const durationMs = Date.now() - startTime;
    const finalRunRes = await client.query(
      `UPDATE allocation_runs
       SET status = 'completed',
           duration_ms = $1,
           completed_at = NOW()
       WHERE id = $2
       RETURNING *;`,
      [durationMs, runId]
    );

    await logAuditEvent({
      actorId: initiatedBy,
      action: 'RUN_ALLOCATION',
      entityType: 'allocation_runs',
      entityId: runId,
      afterState: { summary, durationMs, inputHash },
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent,
    });

    await client.query('COMMIT');

    return {
      run: finalRunRes.rows[0],
      summary,
      results: allAllocations,
      inputHash,
      dryRun: false,
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    if (lockAcquired) {
      await client.query(`SELECT pg_advisory_unlock($1);`, [GLOBAL_ALLOCATION_LOCK_ID]).catch(() => {});
    }
    client.release();
  }
}

/**
 * Returns past allocation runs (append-only history).
 */
async function getAllocationRuns({ page = 1, limit = 20, status = null } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (p - 1) * l;

  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`ar.status = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(
    `SELECT count(*)::int as total FROM allocation_runs ar ${whereClause};`,
    params
  );
  const total = countRes.rows[0]?.total || 0;

  const runsRes = await query(
    `SELECT
       ar.id,
       ar.run_type,
       ar.status,
       ar.total_orders_considered,
       ar.total_items_considered,
       ar.total_items_fulfilled,
       ar.total_items_partially_fulfilled,
       ar.total_items_deferred,
       ar.duration_ms,
       ar.initiated_by,
       u.name AS initiated_by_name,
       u.email AS initiated_by_email,
       ar.notes,
       ar.input_hash,
       ar.created_at,
       ar.completed_at
     FROM allocation_runs ar
     LEFT JOIN users u ON u.id = ar.initiated_by
     ${whereClause}
     ORDER BY ar.id DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2};`,
    [...params, l, offset]
  );

  return {
    runs: runsRes.rows,
    pagination: {
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l),
    },
  };
}

/**
 * Returns full details and item results for a specific allocation run.
 */
async function getAllocationRunById(runId) {
  const runRes = await query(
    `SELECT
       ar.id,
       ar.run_type,
       ar.status,
       ar.total_orders_considered,
       ar.total_items_considered,
       ar.total_items_fulfilled,
       ar.total_items_partially_fulfilled,
       ar.total_items_deferred,
       ar.duration_ms,
       ar.initiated_by,
       u.name AS initiated_by_name,
       u.email AS initiated_by_email,
       ar.notes,
       ar.input_hash,
       ar.created_at,
       ar.completed_at
     FROM allocation_runs ar
     LEFT JOIN users u ON u.id = ar.initiated_by
     WHERE ar.id = $1;`,
    [runId]
  );

  if (runRes.rowCount === 0) {
    throw new AppError(`Allocation run with ID ${runId} not found`, 'NOT_FOUND', 404);
  }

  const run = runRes.rows[0];

  const resultsRes = await query(
    `SELECT
       res.id,
       res.allocation_run_id,
       res.order_item_id,
       oi.order_id,
       oi.product_id,
       p.name AS product_name,
       p.sku,
       u.id AS customer_id,
       u.name AS customer_name,
       res.requested_quantity,
       res.allocated_quantity,
       res.status,
       res.explanation,
       res.created_at
     FROM allocation_results res
     JOIN order_items oi ON oi.id = res.order_item_id
     JOIN products p ON p.id = oi.product_id
     JOIN orders o ON o.id = oi.order_id
     JOIN users u ON u.id = o.customer_id
     WHERE res.allocation_run_id = $1
     ORDER BY res.id ASC;`,
    [runId]
  );

  return {
    run,
    results: resultsRes.rows,
  };
}

module.exports = {
  allocate,
  computeInputHash,
  priorityToRank,
  rankToPriority,
  deriveOrderStatus,
  runAllocationEngine,
  getAllocationRuns,
  getAllocationRunById,
};
