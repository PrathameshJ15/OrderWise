# OrderWise — Allocation Engine Specification

File: `backend/src/services/allocationEngine.js`

This document is the single source of truth for the allocation engine.
**The engine must be deterministic: identical valid inputs → identical outputs.**

---

## 1. Priority Levels

| Label | Rank | Meaning |
|---|---|---|
| `critical` | 4 | Highest — immediate operational risk |
| `high` | 3 | Important — imminent deadline or key customer |
| `medium` | 2 | Standard — default for most orders |
| `low` | 1 | Lowest — flexible timeline |

Ranks are integers stored in `order_priorities.priority_rank`.
The engine sorts on `priority_rank DESC`.

---

## 2. Order Sorting Key

For all eligible order items competing for the same product stock, sort in this exact order:

```
1. priority_rank           DESC   (Critical=4 first)
2. promised_delivery_date  ASC    NULLS LAST  (earlier date first; no date = last)
3. order.created_at        ASC    (older order first)
4. order.id                ASC    (tie-breaker — deterministic)
```

**Critical:** Only orders with an approved priority (row in `order_priorities`) are eligible.
Orders without an approved priority are **skipped** by the engine.

---

## 3. Eligible Order Filter

An order item is eligible for allocation if ALL of the following are true:

- `order.status` IN (`'pending'`, `'confirmed'`)
- A row exists in `order_priorities` for this order
- `order_items.requested_quantity > 0`
- The order is not `cancelled`, `shipped`, or `completed`

```sql
-- Core eligibility query for one product
SELECT
  oi.*,
  op.approved_priority,
  op.priority_rank,
  o.promised_delivery_date,
  o.created_at AS order_created_at,
  o.customer_id
FROM order_items oi
JOIN orders o          ON o.id = oi.order_id
JOIN order_priorities op ON op.order_id = o.id
WHERE oi.product_id = $1
  AND o.status IN ('pending', 'confirmed')
ORDER BY
  op.priority_rank DESC,
  o.promised_delivery_date ASC NULLS LAST,
  o.created_at ASC,
  o.id ASC;
```

---

## 4. Allocation Algorithm

### 4.1 Pseudocode (implement this exactly)

```
FUNCTION runAllocationEngine(productIds, pgClient):

  allResults = []
  allocationRunId = CREATE allocation_runs record (status='running')

  FOR EACH productId IN productIds:

    -- Step 1: Lock inventory (prevent concurrent over-allocation)
    inventory = SELECT ... FROM inventory
                WHERE product_id = productId
                FOR UPDATE  -- row-level lock within transaction

    -- Step 2: Calculate available stock
    --         (Reset reserved to 0 — we recalculate from scratch)
    availableStock = inventory.on_hand_quantity
    --               DO NOT subtract reserved_quantity here —
    --               we will set reserved_quantity at the end

    -- Step 3: Get sorted eligible order items
    orderItems = <eligibility query above with productId>

    remainingStock = availableStock

    -- Step 4: Process each item in priority order
    FOR EACH item IN orderItems:

      IF remainingStock >= item.requested_quantity:
        -- CASE A: Full Fulfillment
        allocatedQty = item.requested_quantity
        status       = 'fulfilled'
        reason       = buildReason('A', item, remainingStock)

      ELSE IF item.partial_delivery_allowed = TRUE
           AND remainingStock >= item.minimum_acceptable_quantity:
        -- CASE B: Partial Fulfillment
        allocatedQty = remainingStock
        status       = 'partially_fulfilled'
        reason       = buildReason('B', item, remainingStock)

      ELSE:
        -- CASE C or D: Deferred
        allocatedQty = 0
        status       = 'deferred'
        reason       = buildReason('CD', item, remainingStock)

      END IF

      -- Deduct only when we actually allocated
      IF allocatedQty > 0:
        remainingStock -= allocatedQty

      -- Build and record result
      result = {
        allocation_run_id:            allocationRunId,
        order_item_id:                item.id,
        order_id:                     item.order_id,
        product_id:                   productId,
        requested_quantity:           item.requested_quantity,
        allocated_quantity:           allocatedQty,
        status:                       status,
        approved_priority:            item.approved_priority,
        promised_delivery_date:       item.promised_delivery_date,
        stock_at_allocation:          availableStock,
        partial_delivery_allowed:     item.partial_delivery_allowed,
        minimum_acceptable_quantity:  item.minimum_acceptable_quantity,
        explanation:                  reason
      }

      INSERT result INTO allocation_results
      allResults.push(result)

    END FOR

    -- Step 5: Update reserved_quantity for this product
    totalAllocated = SUM(allocatedQty for all items processed for productId)
    UPDATE inventory
    SET reserved_quantity = totalAllocated
    WHERE product_id = productId

  END FOR

  -- Step 6: Finalize the run
  UPDATE allocation_runs SET status='completed', completed_at=NOW()
  WHERE id = allocationRunId

  RETURN { runId: allocationRunId, results: allResults }
```

### 4.2 Reason Builder

```
FUNCTION buildReason(caseCode, item, stockAtRunTime):

  CASE 'A':
    RETURN "Available stock was sufficient to fulfill the complete request of
            {item.requested_quantity} units."

  CASE 'B':
    RETURN "Available stock ({stockAtRunTime} units) was insufficient for the
            full request ({item.requested_quantity} units). Partial delivery was
            permitted and the available quantity met the minimum acceptable
            quantity ({item.minimum_acceptable_quantity} units)."

  CASE 'CD':
    IF item.partial_delivery_allowed = FALSE:
      RETURN "Partial delivery is not permitted for this order item.
              Available stock ({stockAtRunTime} units) was insufficient to
              fulfill the complete request ({item.requested_quantity} units).
              No allocation was made."
    ELSE:
      RETURN "Available stock ({stockAtRunTime} units) was below the minimum
              acceptable quantity ({item.minimum_acceptable_quantity} units).
              No allocation was made."
```

---

## 5. Hard Constraints (Never Violate)

```
CONSTRAINT 1: reserved_quantity <= on_hand_quantity
  → After allocation, verify: totalAllocated <= inventory.on_hand_quantity

CONSTRAINT 2: allocated_quantity = 0 OR allocated_quantity >= minimum_acceptable_quantity
  → Never allocate a partial amount below the minimum

CONSTRAINT 3: If partial_delivery_allowed = false AND stock < requested_quantity
  → allocated_quantity must be 0

CONSTRAINT 4: Cancelled orders receive 0 allocation
  → Enforced by eligibility filter (status check)

CONSTRAINT 5: One result per order_item per run
  → UNIQUE(allocation_run_id, order_item_id) in DB

CONSTRAINT 6: AI recommendations cannot trigger allocation directly
  → Only admin calling POST /allocation/run triggers the engine

CONSTRAINT 7: No double-counting of reserved_quantity across runs
  → Reset reserved_quantity to 0 before recalculating for each product
  → Note: ONLY reset for products being reallocated in this run

CONSTRAINT 8: Concurrent allocation prevention
  → FOR UPDATE on inventory rows within a transaction
  → Only one allocation transaction per product at a time
```

---

## 6. Transaction Pattern

```js
// backend/src/services/allocationEngine.js

const { Pool } = require('pg');
const pool = require('../config/db');

async function runAllocationEngine(productIds, initiatedBy) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create run record
    const runResult = await client.query(
      `INSERT INTO allocation_runs (initiated_by, status, rule_version)
       VALUES ($1, 'running', '1.0') RETURNING id`,
      [initiatedBy]
    );
    const runId = runResult.rows[0].id;
    
    const allResults = [];
    
    for (const productId of productIds) {
      // Lock inventory row
      const invResult = await client.query(
        `SELECT on_hand_quantity FROM inventory
         WHERE product_id = $1 FOR UPDATE`,
        [productId]
      );
      
      if (!invResult.rows[0]) continue;
      
      const availableStock = invResult.rows[0].on_hand_quantity;
      let remainingStock = availableStock;
      
      // Get sorted eligible items
      const itemsResult = await client.query(
        `SELECT oi.id, oi.order_id, oi.requested_quantity,
                oi.minimum_acceptable_quantity, oi.partial_delivery_allowed,
                op.approved_priority, op.priority_rank,
                o.promised_delivery_date, o.created_at AS order_created_at
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         JOIN order_priorities op ON op.order_id = o.id
         WHERE oi.product_id = $1
           AND o.status IN ('pending', 'confirmed')
         ORDER BY op.priority_rank DESC,
                  o.promised_delivery_date ASC NULLS LAST,
                  o.created_at ASC,
                  o.id ASC`,
        [productId]
      );
      
      let totalAllocated = 0;
      
      for (const item of itemsResult.rows) {
        let allocatedQty, status, reason;
        
        if (remainingStock >= item.requested_quantity) {
          allocatedQty = item.requested_quantity;
          status = 'fulfilled';
          reason = `Available stock was sufficient to fulfill the complete request of ${item.requested_quantity} units.`;
        } else if (item.partial_delivery_allowed && remainingStock >= item.minimum_acceptable_quantity) {
          allocatedQty = remainingStock;
          status = 'partially_fulfilled';
          reason = `Available stock (${remainingStock} units) was insufficient for the full request (${item.requested_quantity} units). Partial delivery was permitted and the available quantity met the minimum acceptable quantity (${item.minimum_acceptable_quantity} units).`;
        } else {
          allocatedQty = 0;
          status = 'deferred';
          if (!item.partial_delivery_allowed) {
            reason = `Partial delivery is not permitted for this order item. Available stock (${remainingStock} units) was insufficient to fulfill the complete request (${item.requested_quantity} units). No allocation was made.`;
          } else {
            reason = `Available stock (${remainingStock} units) was below the minimum acceptable quantity (${item.minimum_acceptable_quantity} units). No allocation was made.`;
          }
        }
        
        if (allocatedQty > 0) remainingStock -= allocatedQty;
        totalAllocated += allocatedQty;
        
        const resultRow = await client.query(
          `INSERT INTO allocation_results
           (allocation_run_id, order_item_id, order_id, product_id,
            requested_quantity, allocated_quantity, status,
            approved_priority, promised_delivery_date, stock_at_allocation,
            partial_delivery_allowed, minimum_acceptable_quantity, explanation)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
           RETURNING *`,
          [runId, item.id, item.order_id, productId,
           item.requested_quantity, allocatedQty, status,
           item.approved_priority, item.promised_delivery_date, availableStock,
           item.partial_delivery_allowed, item.minimum_acceptable_quantity, reason]
        );
        
        allResults.push(resultRow.rows[0]);
      }
      
      // Update reserved quantity
      await client.query(
        `UPDATE inventory SET reserved_quantity = $1, updated_at = NOW()
         WHERE product_id = $2`,
        [totalAllocated, productId]
      );
    }
    
    // Finalize run
    await client.query(
      `UPDATE allocation_runs
       SET status = 'completed', completed_at = NOW()
       WHERE id = $1`,
      [runId]
    );
    
    await client.query('COMMIT');
    return { runId, results: allResults };
    
  } catch (err) {
    await client.query('ROLLBACK');
    
    // Mark run as failed if runId was created
    // (do this outside transaction)
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { runAllocationEngine };
```

---

## 7. Test Cases

### Test 1 — Full Fulfillment (Case A)
```
Input:
  on_hand_quantity = 100
  Order A: requested=50, min=20, partial_allowed=true, priority=medium

Expected:
  Order A: allocated=50, status='fulfilled'
  reserved_quantity = 50
```

### Test 2 — Partial Fulfillment (Case B)
```
Input:
  on_hand_quantity = 60
  Order A: requested=100, min=40, partial_allowed=true, priority=medium

Expected:
  Order A: allocated=60, status='partially_fulfilled'
  reserved_quantity = 60
```

### Test 3 — Below Minimum (Case D)
```
Input:
  on_hand_quantity = 20
  Order A: requested=100, min=40, partial_allowed=true, priority=medium

Expected:
  Order A: allocated=0, status='deferred'
  reserved_quantity = 0
  reason mentions "below the minimum acceptable quantity"
```

### Test 4 — Partial Not Allowed (Case C)
```
Input:
  on_hand_quantity = 60
  Order A: requested=100, min=40, partial_allowed=false, priority=medium

Expected:
  Order A: allocated=0, status='deferred'
  reserved_quantity = 0
  reason mentions "partial delivery is not permitted"
```

### Test 5 — Competing Priorities
```
Input:
  on_hand_quantity = 50
  Order A: requested=50, priority=medium (rank 2), created earlier
  Order B: requested=50, priority=high (rank 3), created later

Expected:
  Order B processed first (higher rank):
    Order B: allocated=50, status='fulfilled'
  Order A processed second (lower rank, no stock left):
    Order A: allocated=0, status='deferred'
  reserved_quantity = 50
```

### Test 6 — Equal Priority, Different Delivery Dates
```
Input:
  on_hand_quantity = 50
  Order A: requested=50, priority=high, delivery=2025-02-10
  Order B: requested=50, priority=high, delivery=2025-01-25

Expected:
  Order B processed first (earlier delivery date):
    Order B: allocated=50, status='fulfilled'
  Order A processed second:
    Order A: allocated=0, status='deferred'
```

### Test 7 — Mixed Multi-Order Scenario (Demo Data)
```
Input:
  Pressure Gauge Pro: on_hand_quantity=40
  Order C (Charlie): requested=30, min=10, partial=true, priority=high (rank 3), delivery=2025-01-30
  Order A (Alice):   requested=25, min=15, partial=true, priority=high (rank 3), delivery=2025-02-15
  Order B (Bob):     requested=20, min=20, partial=false, priority=medium (rank 2)

Processing order:
  1. Charlie (high, earlier date) → 40 >= 30 → allocated=30, fulfilled. Remaining: 10
  2. Alice (high, later date) → 10 < 25, partial=true, BUT 10 < min(15) → allocated=0, deferred
  3. Bob (medium, no partial) → 10 < 20, partial=false → allocated=0, deferred

Expected:
  Charlie: allocated=30, status='fulfilled'
  Alice:   allocated=0,  status='deferred' (below minimum)
  Bob:     allocated=0,  status='deferred' (partial not allowed)
  reserved_quantity = 30
```

### Test 8 — Reallocation After Inventory Increase
```
Setup: Run Test 7 first. reserved_quantity=30, on_hand_quantity=40.
Action: Admin adjusts on_hand_quantity to 60. Runs allocation again.

New available = 60 (reset reserved to 0 before recalc)

Processing order:
  1. Charlie: 60 >= 30 → allocated=30, fulfilled. Remaining: 30
  2. Alice: 30 >= 25 → allocated=25, fulfilled. Remaining: 5
  3. Bob: 5 < 20, partial=false → allocated=0, deferred

Expected:
  Charlie: allocated=30, status='fulfilled'  (unchanged)
  Alice:   allocated=25, status='fulfilled'  (IMPROVED — was deferred)
  Bob:     allocated=0,  status='deferred'   (unchanged)
  reserved_quantity = 55
  Impact analyzer shows: Alice changed from 'deferred' to 'fulfilled' (+25 units)
```

---

## 8. Order-Level Status Derivation

After processing all items in an order, calculate the order-level status:

```js
function deriveOrderStatus(items) {
  const statuses = items.map(i => i.status);
  
  if (statuses.every(s => s === 'fulfilled')) return 'allocated';
  if (statuses.every(s => s === 'deferred'))  return 'pending'; // stays pending
  return 'partially_allocated'; // mixed
}
```

Update `orders.status` in the same transaction.

---

## 9. Reallocation Policy

### When to Trigger Reallocation
- Inventory `on_hand_quantity` changes
- An order priority changes (approved or modified)
- An order is cancelled (releases stock for others)
- A new eligible order is added and the admin requests reallocation

### What Gets Recalculated
- All eligible order items for the affected product(s)
- `reserved_quantity` is reset to 0 for affected products, then recalculated
- New `allocation_results` rows are inserted (prior rows are NOT deleted — history is preserved)
- Only the LATEST run per product is used for current status display

### What Does NOT Get Recalculated
- Orders with `status = 'shipped'` or `'completed'` — their commitments are irrevocable
- The `on_hand_quantity` itself is not changed by reallocation (only `reserved_quantity`)

---

## 10. Concurrency Protection

The `FOR UPDATE` row lock on the inventory row ensures that if two admins
simultaneously click "Run Allocation", only one transaction proceeds per product at a time.
The second transaction waits for the first to commit or rollback.

```sql
-- This ensures serial access to stock for each product
SELECT on_hand_quantity
FROM inventory
WHERE product_id = $1
FOR UPDATE;  -- ← blocks concurrent allocation for this product
```

This is sufficient for a hackathon MVP.
For production, consider advisory locks or optimistic concurrency with version columns.
