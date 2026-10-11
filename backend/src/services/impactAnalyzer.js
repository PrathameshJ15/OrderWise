const { query, pool } = require('../config/db');

/**
 * Classification constants for Impact Analyzer
 */
const CLASSIFICATIONS = {
  IMPROVED: 'IMPROVED',
  DEGRADED: 'DEGRADED',
  UNCHANGED: 'UNCHANGED',
  NEWLY_FULFILLED: 'NEWLY_FULFILLED',
  NEWLY_DEFERRED: 'NEWLY_DEFERRED',
  NEW_ITEM: 'NEW_ITEM',
  REMOVED_ITEM: 'REMOVED_ITEM',
};

/**
 * Classifies the difference between base (previous) and target (current) allocation.
 *
 * Rules:
 * 1. Target present, base absent -> NEW_ITEM
 * 2. Base present, target absent -> REMOVED_ITEM
 * 3. Both present:
 *    - Same quantity & status -> UNCHANGED
 *    - Was not fulfilled, now fulfilled -> NEWLY_FULFILLED
 *    - Was not deferred, now deferred -> NEWLY_DEFERRED
 *    - Quantity increased -> IMPROVED
 *    - Quantity decreased -> DEGRADED
 *    - Edge case status change -> IMPROVED or DEGRADED
 */
function classifyChange(prev, curr) {
  if (!prev && curr) {
    return {
      classification: CLASSIFICATIONS.NEW_ITEM,
      change_direction: 'new',
      changed: true,
    };
  }

  if (prev && !curr) {
    return {
      classification: CLASSIFICATIONS.REMOVED_ITEM,
      change_direction: 'removed',
      changed: true,
    };
  }

  if (!prev && !curr) {
    return {
      classification: CLASSIFICATIONS.UNCHANGED,
      change_direction: 'unchanged',
      changed: false,
    };
  }

  const prevAlloc = prev.allocated_quantity;
  const currAlloc = curr.allocated_quantity;
  const prevStatus = prev.status;
  const currStatus = curr.status;

  if (prevAlloc === currAlloc && prevStatus === currStatus) {
    return {
      classification: CLASSIFICATIONS.UNCHANGED,
      change_direction: 'unchanged',
      changed: false,
    };
  }

  if (prevStatus !== 'fulfilled' && currStatus === 'fulfilled') {
    return {
      classification: CLASSIFICATIONS.NEWLY_FULFILLED,
      change_direction: 'improved',
      changed: true,
    };
  }

  if (prevStatus !== 'deferred' && currStatus === 'deferred') {
    return {
      classification: CLASSIFICATIONS.NEWLY_DEFERRED,
      change_direction: 'degraded',
      changed: true,
    };
  }

  if (currAlloc > prevAlloc) {
    return {
      classification: CLASSIFICATIONS.IMPROVED,
      change_direction: 'improved',
      changed: true,
    };
  }

  if (currAlloc < prevAlloc) {
    return {
      classification: CLASSIFICATIONS.DEGRADED,
      change_direction: 'degraded',
      changed: true,
    };
  }

  // Edge case: quantity identical but status changed (e.g. metadata or policy change)
  const isBetter = currStatus === 'fulfilled' || (currStatus === 'partially_fulfilled' && prevStatus === 'deferred');
  return {
    classification: isBetter ? CLASSIFICATIONS.IMPROVED : CLASSIFICATIONS.DEGRADED,
    change_direction: isBetter ? 'improved' : 'degraded',
    changed: true,
  };
}

/**
 * Attributes the root cause of an allocation change by analyzing intervening audit logs,
 * priority approvals, inventory movements, or competing order shifts.
 */
function attributeCause(itemChange, baseRun, targetRun, events = {}) {
  const { auditLogs = [], priorityApprovals = [], inventoryMovements = [] } = events;
  const { classification, delta, order_id, product_id, product_name, prevExplanation, currExplanation } = itemChange;

  if (classification === CLASSIFICATIONS.UNCHANGED) {
    return {
      cause_type: 'STABLE',
      trigger_event: null,
      description: 'Allocation remained unchanged across runs.',
      explanation: 'Order priority and inventory levels remained consistent between runs.',
    };
  }

  if (classification === CLASSIFICATIONS.NEW_ITEM) {
    return {
      cause_type: 'NEW_ORDER_ENTERED',
      trigger_event: null,
      description: `Order item was placed after base run #${baseRun.id}.`,
      explanation: `New order item entered the allocation pool in run #${targetRun.id}.`,
    };
  }

  if (classification === CLASSIFICATIONS.REMOVED_ITEM) {
    return {
      cause_type: 'ORDER_REMOVED',
      trigger_event: null,
      description: `Order item was removed or cancelled prior to run #${targetRun.id}.`,
      explanation: `Item was not present in eligible order pool for run #${targetRun.id}.`,
    };
  }

  // 1. Check if order priority was changed for this specific order
  const matchingApproval = priorityApprovals.find((pa) => parseInt(pa.order_id, 10) === parseInt(order_id, 10));
  const matchingAuditPriority = auditLogs.find(
    (log) =>
      log.entity_type === 'orders' &&
      parseInt(log.entity_id, 10) === parseInt(order_id, 10) &&
      (log.action === 'PRIORITY_APPROVED' || log.action === 'PRIORITY_OVERRIDDEN')
  );

  const prevPriRank = prevExplanation?.approved_priority ? getPriorityRank(prevExplanation.approved_priority) : null;
  const currPriRank = currExplanation?.approved_priority ? getPriorityRank(currExplanation.approved_priority) : null;

  if (matchingApproval || matchingAuditPriority || (prevPriRank && currPriRank && prevPriRank !== currPriRank)) {
    const isPriorityIncrease = currPriRank > prevPriRank || (matchingApproval && matchingApproval.decision === 'overridden');
    const priName = matchingApproval?.final_priority || currExplanation?.approved_priority || 'updated';

    return {
      cause_type: 'PRIORITY_CHANGED',
      trigger_event: matchingAuditPriority
        ? { source: 'audit_logs', id: matchingAuditPriority.id, action: matchingAuditPriority.action }
        : matchingApproval
        ? { source: 'priority_approvals', id: matchingApproval.id, decision: matchingApproval.decision }
        : null,
      description: `Priority was updated to ${priName}${matchingApproval?.override_reason ? ' (' + matchingApproval.override_reason + ')' : ''}.`,
      explanation: isPriorityIncrease
        ? `Elevated priority ranked this order ahead of others in the deterministic allocation sequence.`
        : `Lowered priority deferred stock allocation to other higher-priority queue entries.`,
    };
  }

  // 2. Check if product inventory stock changed between runs
  const prevStock = prevExplanation?.stock_at_allocation;
  const currStock = currExplanation?.stock_at_allocation;

  const matchingInvMovement = inventoryMovements.find((m) => parseInt(m.product_id, 10) === parseInt(product_id, 10));
  const matchingInvAudit = auditLogs.find(
    (log) =>
      (log.entity_type === 'inventory' || log.entity_type === 'products') &&
      parseInt(log.entity_id, 10) === parseInt(product_id, 10)
  );

  if (
    matchingInvMovement ||
    matchingInvAudit ||
    (typeof prevStock === 'number' && typeof currStock === 'number' && prevStock !== currStock)
  ) {
    const stockIncreased =
      (typeof prevStock === 'number' && typeof currStock === 'number' && currStock > prevStock) ||
      (matchingInvMovement && matchingInvMovement.new_on_hand > matchingInvMovement.previous_on_hand) ||
      delta > 0;

    return {
      cause_type: stockIncreased ? 'STOCK_INCREASED' : 'STOCK_DECREASED',
      trigger_event: matchingInvAudit
        ? { source: 'audit_logs', id: matchingInvAudit.id, action: matchingInvAudit.action }
        : matchingInvMovement
        ? { source: 'inventory_movements', id: matchingInvMovement.id, type: matchingInvMovement.movement_type }
        : null,
      description: stockIncreased
        ? `Stock for ${product_name} increased (available pool rose from ${prevStock ?? 'prior'} to ${currStock ?? 'new'}).`
        : `Stock for ${product_name} decreased (available pool dropped from ${prevStock ?? 'prior'} to ${currStock ?? 'new'}).`,
      explanation: stockIncreased
        ? `Increased inventory allowed fulfillment of previously deferred or partially fulfilled items.`
        : `Reduced inventory depleted available stock before this order could be fully fulfilled.`,
    };
  }

  // 3. Check if an order cancellation occurred in audit log releasing stock
  const cancellationAudit = auditLogs.find(
    (log) => log.action === 'ORDER_CANCELLED' || log.action === 'ORDER_STATUS_UPDATED'
  );
  if (cancellationAudit && delta > 0) {
    return {
      cause_type: 'ORDER_CANCELLED',
      trigger_event: { source: 'audit_logs', id: cancellationAudit.id, action: cancellationAudit.action },
      description: `A competing order was cancelled, releasing reserved units of ${product_name}.`,
      explanation: `Cancelled order inventory was automatically reallocated to subsequent eligible orders.`,
    };
  }

  // 4. Competing orders arrived or took precedence
  if (delta < 0) {
    return {
      cause_type: 'COMPETING_ORDER_PRIORITY',
      trigger_event: null,
      description: `Higher-priority or earlier-dated order consumed limited stock for ${product_name}.`,
      explanation: `Deterministic queue ordering allocated available stock to higher-ranking competitors.`,
    };
  }

  if (delta > 0) {
    return {
      cause_type: 'QUEUE_REALLOCATION',
      trigger_event: null,
      description: `Queue reallocation provided available stock for ${product_name}.`,
      explanation: `Deterministic engine recalculation redistributed available units to this order item.`,
    };
  }

  return {
    cause_type: 'STATE_CHANGED',
    trigger_event: null,
    description: `Allocation updated from ${itemChange.previous_status} to ${itemChange.current_status}.`,
    explanation: 'System reallocated order items per deterministic business rules.',
  };
}

function getPriorityRank(label) {
  const map = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  return map[(label || '').toUpperCase()] || 2;
}

/**
 * Compare two allocation runs and return comprehensive diff, classification, and cause attribution.
 *
 * Guaranteed: READ-ONLY query. Past runs are NEVER modified.
 */
async function compareRuns(baseRunId = null, targetRunId = null, client = null) {
  const db = client || { query };

  // 1. Resolve base and target runs
  let baseRun;
  let targetRun;

  if (baseRunId && targetRunId) {
    const runsRes = await db.query(
      `SELECT r.*, u.name as initiated_by_name
       FROM allocation_runs r
       LEFT JOIN users u ON u.id = r.initiated_by
       WHERE r.id IN ($1, $2)`,
      [baseRunId, targetRunId]
    );

    baseRun = runsRes.rows.find((r) => parseInt(r.id, 10) === parseInt(baseRunId, 10));
    targetRun = runsRes.rows.find((r) => parseInt(r.id, 10) === parseInt(targetRunId, 10));

    if (!baseRun || !targetRun) {
      throw new Error(`One or both specified allocation runs (Base: ${baseRunId}, Target: ${targetRunId}) were not found.`);
    }
  } else {
    // Default to the two latest completed allocation runs
    const latestRes = await db.query(
      `SELECT r.*, u.name as initiated_by_name
       FROM allocation_runs r
       LEFT JOIN users u ON u.id = r.initiated_by
       WHERE r.status = 'completed'
       ORDER BY r.id DESC
       LIMIT 2`
    );

    if (latestRes.rowCount < 2) {
      throw new Error(
        `At least two completed allocation runs are required to compare impact. Found ${latestRes.rowCount}.`
      );
    }

    // targetRun is the most recent (index 0), baseRun is the preceding run (index 1)
    targetRun = latestRes.rows[0];
    baseRun = latestRes.rows[1];
  }

  // 2. Fetch all allocation results for both runs with complete item, product, customer & order context
  const resultsQuery = `
    SELECT ar.allocation_run_id, ar.order_item_id, ar.requested_quantity, ar.allocated_quantity,
           ar.status, ar.explanation, ar.created_at as result_created_at,
           oi.order_id, oi.minimum_acceptable_quantity, oi.partial_delivery_allowed,
           o.customer_id, o.promised_delivery_date, o.status as order_status, o.created_at as order_created_at,
           p.id as product_id, p.name as product_name, p.sku,
           u.name as customer_name, u.email as customer_email,
           op.approved_priority, op.priority_rank
    FROM allocation_results ar
    JOIN order_items oi ON oi.id = ar.order_item_id
    JOIN orders o ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    JOIN users u ON u.id = o.customer_id
    LEFT JOIN order_priorities op ON op.order_id = o.id
    WHERE ar.allocation_run_id IN ($1, $2)
    ORDER BY ar.order_item_id ASC
  `;

  const resultsRes = await db.query(resultsQuery, [baseRun.id, targetRun.id]);

  const baseResultsMap = new Map();
  const targetResultsMap = new Map();

  for (const row of resultsRes.rows) {
    const runId = parseInt(row.allocation_run_id, 10);
    const itemId = parseInt(row.order_item_id, 10);
    if (runId === parseInt(baseRun.id, 10)) {
      baseResultsMap.set(itemId, row);
    } else if (runId === parseInt(targetRun.id, 10)) {
      targetResultsMap.set(itemId, row);
    }
  }

  // 3. Fetch intervening events for Cause Attribution (audit logs, priority approvals, inventory movements)
  const startTime = baseRun.created_at < targetRun.created_at ? baseRun.created_at : targetRun.created_at;
  const endTime = baseRun.created_at < targetRun.created_at ? targetRun.created_at : baseRun.created_at;

  const [auditRes, approvalsRes, movementsRes] = await Promise.all([
    db.query(
      `SELECT * FROM audit_logs
       WHERE created_at >= $1 AND created_at <= $2
       ORDER BY created_at DESC`,
      [startTime, endTime]
    ),
    db.query(
      `SELECT * FROM priority_approvals
       WHERE created_at >= $1 AND created_at <= $2
       ORDER BY created_at DESC`,
      [startTime, endTime]
    ),
    db.query(
      `SELECT * FROM inventory_movements
       WHERE created_at >= $1 AND created_at <= $2
       ORDER BY created_at DESC`,
      [startTime, endTime]
    ),
  ]);

  const events = {
    auditLogs: auditRes.rows,
    priorityApprovals: approvalsRes.rows,
    inventoryMovements: movementsRes.rows,
  };

  // 4. Compare every unique order_item_id present in either run
  const allItemIds = new Set([...baseResultsMap.keys(), ...targetResultsMap.keys()]);
  const changes = [];

  const summary = {
    total_items_compared: allItemIds.size,
    total_changed: 0,
    total_unchanged: 0,
    improvements: 0,
    degradations: 0,
    by_classification: {
      [CLASSIFICATIONS.IMPROVED]: 0,
      [CLASSIFICATIONS.DEGRADED]: 0,
      [CLASSIFICATIONS.UNCHANGED]: 0,
      [CLASSIFICATIONS.NEWLY_FULFILLED]: 0,
      [CLASSIFICATIONS.NEWLY_DEFERRED]: 0,
      [CLASSIFICATIONS.NEW_ITEM]: 0,
      [CLASSIFICATIONS.REMOVED_ITEM]: 0,
    },
  };

  for (const itemId of allItemIds) {
    const prev = baseResultsMap.get(itemId);
    const curr = targetResultsMap.get(itemId);
    const itemRef = curr || prev;

    const { classification, change_direction, changed } = classifyChange(prev, curr);

    const prevAlloc = prev ? parseInt(prev.allocated_quantity, 10) : 0;
    const currAlloc = curr ? parseInt(curr.allocated_quantity, 10) : 0;
    const delta = currAlloc - prevAlloc;

    const prevExplanation = prev ? (typeof prev.explanation === 'string' ? JSON.parse(prev.explanation) : prev.explanation) : null;
    const currExplanation = curr ? (typeof curr.explanation === 'string' ? JSON.parse(curr.explanation) : curr.explanation) : null;

    const itemChange = {
      order_item_id: itemId,
      order_id: itemRef.order_id,
      customer_id: itemRef.customer_id,
      customer_name: itemRef.customer_name,
      customer_email: itemRef.customer_email,
      product_id: itemRef.product_id,
      product_name: itemRef.product_name,
      sku: itemRef.sku,
      requested_quantity: itemRef.requested_quantity,
      minimum_acceptable_quantity: itemRef.minimum_acceptable_quantity,
      partial_delivery_allowed: itemRef.partial_delivery_allowed,
      promised_delivery_date: itemRef.promised_delivery_date,
      previous_allocated: prevAlloc,
      current_allocated: currAlloc,
      previous_status: prev ? prev.status : null,
      current_status: curr ? curr.status : null,
      delta,
      changed,
      classification,
      change_direction,
      prevExplanation,
      currExplanation,
    };

    const causeAttribution = attributeCause(itemChange, baseRun, targetRun, events);

    itemChange.cause_attribution = causeAttribution;
    itemChange.explanation = causeAttribution.explanation;
    itemChange.cause_description = causeAttribution.description;

    // Track summary statistics
    summary.by_classification[classification] = (summary.by_classification[classification] || 0) + 1;
    if (changed) {
      summary.total_changed++;
      if (change_direction === 'improved') summary.improvements++;
      if (change_direction === 'degraded') summary.degradations++;
    } else {
      summary.total_unchanged++;
    }

    changes.push(itemChange);
  }

  // Sort changes: changed items first, then by absolute delta DESC, then order_item_id ASC
  changes.sort((a, b) => {
    if (a.changed !== b.changed) return a.changed ? -1 : 1;
    if (Math.abs(b.delta) !== Math.abs(a.delta)) return Math.abs(b.delta) - Math.abs(a.delta);
    return a.order_item_id - b.order_item_id;
  });

  return {
    base_run: {
      id: parseInt(baseRun.id, 10),
      run_type: baseRun.run_type,
      status: baseRun.status,
      created_at: baseRun.created_at,
      completed_at: baseRun.completed_at,
      total_items_considered: baseRun.total_items_considered,
      initiated_by_name: baseRun.initiated_by_name,
      notes: baseRun.notes,
    },
    target_run: {
      id: parseInt(targetRun.id, 10),
      run_type: targetRun.run_type,
      status: targetRun.status,
      created_at: targetRun.created_at,
      completed_at: targetRun.completed_at,
      total_items_considered: targetRun.total_items_considered,
      initiated_by_name: targetRun.initiated_by_name,
      notes: targetRun.notes,
    },
    summary,
    changes,
  };
}

module.exports = {
  CLASSIFICATIONS,
  classifyChange,
  attributeCause,
  compareRuns,
};
