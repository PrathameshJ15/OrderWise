# OrderWise — AI Agent Instructions

> **Drop this file in your project root. This is the single source of truth for every coding decision.**
> Core principle: **AI recommends. Business rules validate. Authorized humans approve. OrderWise allocates and explains.**

---

## 1. Project Identity



**Name:** OrderWise  
**Event:** VORTEXA 3.0 Hackathon — Problem Statement S-03  
**Category:** AI, Inventory Management and Supply Chain Intelligence  
**Time Budget:** 12 hours

OrderWise allocates limited inventory across competing customer orders using deterministic business rules, AI-assisted priority recommendations, and explainable allocation decisions.

---

## 2. Tech Stack (Exact Versions)

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3, Lucide React, Recharts |
| Backend | Node.js 20, Express.js 4 |
| Database | PostgreSQL 15 |
| AI | Groq API — model: `llama3-70b-8192` |
| Auth | `jsonwebtoken` + `bcryptjs` |
| DB Client | `pg` (node-postgres) |
| Migrations | `node-pg-migrate` |

---

## 3. Monorepo Folder Structure

Create this exact structure. Do not deviate.

```
orderwise/
├── AGENTS.md                        ← this file
├── README.md
├── .env.example
├── docs/
│   ├── DATABASE_SCHEMA.md
│   ├── API_SPEC.md
│   ├── ALLOCATION_ENGINE.md
│   └── FRONTEND_SPEC.md
├── backend/
│   ├── package.json
│   ├── .env                         ← git-ignored
│   ├── src/
│   │   ├── index.js                 ← Express app entry point
│   │   ├── config/
│   │   │   └── db.js                ← pg Pool setup
│   │   ├── middleware/
│   │   │   ├── auth.js              ← JWT verify → req.user
│   │   │   └── rbac.js              ← role guard factory
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── products.js
│   │   │   ├── inventory.js
│   │   │   ├── orders.js
│   │   │   ├── priorities.js
│   │   │   ├── allocation.js
│   │   │   ├── ai.js
│   │   │   ├── simulations.js
│   │   │   ├── alerts.js
│   │   │   ├── replenishment.js
│   │   │   └── reports.js
│   │   ├── services/
│   │   │   ├── allocationEngine.js  ← CORE — see Section 7
│   │   │   ├── impactAnalyzer.js
│   │   │   ├── aiService.js
│   │   │   ├── simulationService.js
│   │   │   ├── replenishmentService.js
│   │   │   └── alertService.js
│   │   └── db/
│   │       ├── migrations/          ← numbered SQL files
│   │       └── seeds/
│   │           └── demo.js          ← hackathon demo data
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── contexts/
        │   └── AuthContext.jsx
        ├── hooks/
        │   └── useAuth.js
        ├── api/
        │   └── client.js            ← axios instance, base URL, JWT header
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── customer/
        │   │   ├── CustomerDashboard.jsx
        │   │   ├── ProductCatalog.jsx
        │   │   ├── CreateOrder.jsx
        │   │   ├── MyOrders.jsx
        │   │   └── OrderDetail.jsx
        │   └── admin/
        │       ├── AdminDashboard.jsx
        │       ├── ProductManagement.jsx
        │       ├── InventoryManagement.jsx
        │       ├── OrderManagement.jsx
        │       ├── AllocationCenter.jsx
        │       ├── AIRecommendations.jsx
        │       ├── ImpactAnalyzer.jsx
        │       ├── SimulationLab.jsx
        │       ├── Alerts.jsx
        │       ├── Replenishment.jsx
        │       └── Reports.jsx
        └── components/
            ├── layout/
            │   ├── CustomerLayout.jsx
            │   ├── AdminLayout.jsx
            │   └── Sidebar.jsx
            ├── allocation/
            │   ├── AllocationResultCard.jsx
            │   ├── AllocationExplanation.jsx
            │   └── ImpactBadge.jsx
            ├── charts/
            │   ├── StockLevelChart.jsx
            │   └── AllocationSummaryChart.jsx
            └── ui/
                ├── Badge.jsx
                ├── Alert.jsx
                ├── Modal.jsx
                └── StatusPill.jsx
```

---

## 4. Implementation Priority Order

Work in this exact order. Do not start Priority 1 until Priority 0 is running end-to-end.

### Priority 0 — Non-Negotiable MVP
1. PostgreSQL schema + migrations (all tables)
2. Backend: auth routes (register, login, JWT)
3. Backend: RBAC middleware (`customer`, `admin`, `inventory_manager`)
4. Backend: product CRUD + inventory read/update
5. Backend: order creation (customer-facing)
6. **Backend: Allocation Engine** (see Section 7 — this is the core deliverable)
7. Frontend: login/register
8. Frontend: customer — browse products, create order, view my orders with allocation results
9. Frontend: admin — inventory management, order list, run allocation button, view results with explanations
10. Seed database with demo data (see Section 10)

### Priority 1 — Strong Differentiators
1. AI priority recommendation (Groq) + human approval workflow
2. Allocation Impact Analyzer
3. Basic inventory shortage alerts
4. Allocation run history
5. One working simulation (inventory increase scenario)

### Priority 2 — Additional Intelligence
1. What-if simulations (all 5 scenarios)
2. Replenishment recommendations
3. Recharts dashboard charts
4. Audit log viewer

### Priority 3 — Polish Only if Time Allows
- Advanced reports
- Supplier management UI
- Notification enhancements

---

## 5. Environment Variables

### backend/.env
```
DATABASE_URL=postgresql://orderwise_user:password@localhost:5432/orderwise_db
JWT_SECRET=replace_with_long_random_string_min_64_chars
JWT_EXPIRES_IN=24h
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama3-70b-8192
PORT=4000
NODE_ENV=development
```

### frontend/.env (Vite)
```
VITE_API_BASE_URL=http://localhost:4000/api
```

---

## 6. Authentication and Authorization Rules

### JWT Payload Shape
```json
{ "userId": 1, "role": "admin", "email": "admin@demo.com" }
```

### Roles
| Role | Key Permissions |
|---|---|
| `customer` | Own orders only, browse products, view own allocation results |
| `admin` | Everything — inventory, all orders, run allocation, approve AI recommendations, simulations |
| `inventory_manager` | Manage stock, view replenishment, cannot approve priorities |

### Middleware Usage
```js
// Protect any route:
router.post('/allocation/run', auth, rbac('admin'), allocationController.run);

// Customer sees only their own orders — enforce in SQL:
WHERE o.customer_id = req.user.userId
```

**NEVER trust the frontend for role enforcement. Backend must re-validate on every request.**

---

## 7. Allocation Engine — Core Algorithm

File: `backend/src/services/allocationEngine.js`

This is the most critical file. It must be deterministic: same inputs → same outputs.

### 7.1 Order Sorting Key (per product)
Sort eligible order items in this exact priority:
1. `approved_priority` DESC (Critical=4 > High=3 > Medium=2 > Low=1)
2. `promised_delivery_date` ASC NULLS LAST
3. `order.created_at` ASC
4. `order.id` ASC

### 7.2 Eligible Orders Filter
An order item is eligible for allocation if:
- `order.status` IN (`'pending'`, `'confirmed'`)
- The order is NOT cancelled
- The order item has a valid `requested_quantity > 0`
- There is an approved priority on record (join `order_priorities`)

### 7.3 Allocation Logic (pseudocode — implement exactly)

```
function runAllocationEngine(productIds[], client):
  // client = pg transaction client
  
  results = []
  
  FOR each productId in productIds:
    
    // 1. Lock the inventory row for this product
    inventory = SELECT ... FROM inventory WHERE product_id = productId FOR UPDATE
    availableStock = inventory.on_hand_quantity - inventory.reserved_quantity
    
    // 2. Get all eligible order items for this product, sorted
    orderItems = SELECT oi.*, op.approved_priority, o.promised_delivery_date,
                        o.created_at, o.customer_id
                 FROM order_items oi
                 JOIN orders o ON o.id = oi.order_id
                 JOIN order_priorities op ON op.order_id = o.id
                 WHERE oi.product_id = productId
                   AND o.status IN ('pending', 'confirmed')
                 ORDER BY op.approved_priority DESC,
                          o.promised_delivery_date ASC NULLS LAST,
                          o.created_at ASC,
                          o.id ASC
    
    remainingStock = availableStock
    
    // 3. Allocate to each item in priority order
    FOR each item in orderItems:
      
      IF remainingStock >= item.requested_quantity:
        // Case A: Full fulfillment
        allocated = item.requested_quantity
        status = 'fulfilled'
        reason = 'Available stock was sufficient to fulfill the complete request.'
      
      ELSE IF item.partial_delivery_allowed = true
           AND remainingStock >= item.minimum_acceptable_quantity:
        // Case B: Partial fulfillment
        allocated = remainingStock
        status = 'partially_fulfilled'
        reason = 'Available stock was insufficient for the full request. Partial delivery
                  was permitted and the available quantity met the minimum acceptable quantity.'
      
      ELSE:
        // Case C or D: Deferred
        allocated = 0
        status = 'deferred'
        
        IF item.partial_delivery_allowed = false:
          reason = 'Partial delivery is not permitted for this order item.'
        ELSE:
          reason = `Available stock (${remainingStock}) is below the minimum acceptable
                    quantity (${item.minimum_acceptable_quantity}). No allocation made.`
      
      remainingStock -= allocated  // Only subtract when allocated > 0
      
      results.push({
        order_item_id: item.id,
        requested_quantity: item.requested_quantity,
        allocated_quantity: allocated,
        status: status,
        explanation: buildExplanation(item, allocated, status, reason, availableStock)
      })
    
    // 4. Update inventory reserved quantity
    totalAllocated = SUM of allocated for this product
    UPDATE inventory SET reserved_quantity = totalAllocated WHERE product_id = productId
  
  RETURN results

function buildExplanation(item, allocated, status, reason, stockAtRunTime):
  RETURN {
    requested_quantity: item.requested_quantity,
    allocated_quantity: allocated,
    approved_priority: item.approved_priority,
    promised_delivery_date: item.promised_delivery_date,
    stock_at_allocation: stockAtRunTime,
    partial_delivery_allowed: item.partial_delivery_allowed,
    minimum_acceptable_quantity: item.minimum_acceptable_quantity,
    status: status,
    reason: reason
  }
```

### 7.4 Transaction Wrapper (required)
```js
// In your route handler:
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const results = await runAllocationEngine(productIds, client);
  // Insert into allocation_results
  // Insert into allocation_runs (status = 'completed')
  await client.query('COMMIT');
  return results;
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}
```

### 7.5 Hard Constraints — Never Violate
- `reserved_quantity` must never exceed `on_hand_quantity`
- Allocated amount must be 0 OR >= `minimum_acceptable_quantity`
- Cancelled orders must never receive allocation
- Previous `reserved_quantity` is reset to zero at the start of each full reallocation run before redistributing
- Every processed order item must produce exactly one allocation result row

---

## 8. AI Service

File: `backend/src/services/aiService.js`

### 8.1 Groq Integration

```js
const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: process.env.GROQ_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(orderContext) }
    ],
    temperature: 0.2,
    max_tokens: 512,
    response_format: { type: 'json_object' }
  })
});
```

### 8.2 System Prompt
```
You are an order priority assistant for an inventory allocation system.
Your ONLY job is to recommend one of these priority levels based on business notes:
CRITICAL, HIGH, MEDIUM, or LOW.

Respond ONLY in this exact JSON format:
{
  "suggested_priority": "HIGH",
  "confidence": "high",
  "explanation": "Two sentences max explaining why.",
  "evidence": "Direct quote or paraphrase from the notes that supports this.",
  "warning": "Optional — flag if notes are vague or contradictory."
}

Rules:
- Never invent facts not present in the notes.
- If notes are empty or insufficient, suggest MEDIUM and set warning.
- Never modify inventory or approve your own recommendation.
```

### 8.3 Required Fallback (for when Groq is unavailable)
```js
function ruleBasedFallback(orderContext) {
  // Simple keyword-based rules — clearly labelled as NOT AI
  const notes = (orderContext.business_notes || '').toLowerCase();
  let priority = 'MEDIUM';
  
  if (notes.includes('critical') || notes.includes('emergency') || notes.includes('urgent')) {
    priority = 'CRITICAL';
  } else if (notes.includes('high') || notes.includes('important') || notes.includes('deadline')) {
    priority = 'HIGH';
  } else if (notes.includes('low') || notes.includes('flexible') || notes.includes('no rush')) {
    priority = 'LOW';
  }
  
  return {
    suggested_priority: priority,
    confidence: 'low',
    explanation: 'Rule-based keyword analysis (AI service unavailable).',
    evidence: 'Keyword match from business notes.',
    warning: 'This is a rule-based fallback, NOT AI inference. Review carefully.',
    provider: 'fallback'
  };
}
```

### 8.4 Human Approval Flow
1. Admin calls `POST /api/ai/recommend/:orderId`
2. Backend calls Groq (or fallback), saves to `ai_recommendations`
3. Admin reviews in UI — sees suggested priority + explanation
4. Admin calls `POST /api/priorities/approve` with `{ recommendation_id, decision, final_priority, reason }`
5. Backend validates, saves to `priority_approvals`, updates `order_priorities`
6. **AI never updates `order_priorities` directly**

---

## 9. Key API Routes Summary

All routes prefixed with `/api`. See `docs/API_SPEC.md` for full request/response shapes.

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

### Products & Inventory
```
GET    /api/products                   (public or auth)
POST   /api/products                   (admin)
PUT    /api/products/:id               (admin)
GET    /api/inventory                  (admin)
PUT    /api/inventory/:productId       (admin) — adjust on_hand_quantity
```

### Orders
```
POST   /api/orders                     (customer) — create order with items
GET    /api/orders                     (admin) — all orders
GET    /api/orders/my                  (customer) — own orders only
GET    /api/orders/:id                 (auth) — customer sees own only
PATCH  /api/orders/:id/status          (admin) — cancel, confirm
```

### Priorities & AI
```
GET    /api/priorities/:orderId        (admin)
POST   /api/ai/recommend/:orderId      (admin)
POST   /api/priorities/approve         (admin)
```

### Allocation
```
POST   /api/allocation/run             (admin) — triggers allocation engine
GET    /api/allocation/runs            (admin) — history
GET    /api/allocation/runs/:id        (admin) — results for one run
GET    /api/allocation/impact/:runId   (admin) — before/after diff
```

### Simulations
```
POST   /api/simulations                (admin) — create + run simulation
GET    /api/simulations                (admin)
GET    /api/simulations/:id            (admin)
```

### Supporting
```
GET    /api/alerts                     (admin)
GET    /api/replenishment              (admin)
GET    /api/reports/summary            (admin)
```

---

## 10. Demo Seed Data

File: `backend/src/db/seeds/demo.js`

Seed this data so the demo shows interesting allocation conflicts:

### Users
| Role | Email | Password |
|---|---|---|
| admin | admin@orderwise.com | Admin123! |
| customer | alice@demo.com | Alice123! |
| customer | bob@demo.com | Bob123! |
| customer | charlie@demo.com | Charlie123! |

### Products (create 4)
1. Industrial Pump Model X — SKU: PUMP-X100 — Stock: 150 units
2. Safety Valve Type B — SKU: VALVE-B200 — Stock: 80 units
3. Pressure Gauge Pro — SKU: GAUGE-P300 — Stock: 40 units ← this one is scarce
4. Control Panel Unit — SKU: CTRL-U400 — Stock: 200 units

### Orders (designed to create allocation conflicts on Pressure Gauge Pro)
| Customer | Product | Qty Requested | Min Acceptable | Partial OK | Priority |
|---|---|---|---|---|---|
| Alice | Pressure Gauge Pro | 25 | 15 | Yes | HIGH |
| Bob | Pressure Gauge Pro | 20 | 20 | No | MEDIUM |
| Charlie | Pressure Gauge Pro | 30 | 10 | Yes | HIGH |
| Alice | Safety Valve Type B | 50 | 30 | Yes | MEDIUM |
| Bob | Industrial Pump Model X | 100 | 50 | Yes | CRITICAL |

With 40 units of Pressure Gauge Pro:
- Charlie (HIGH, same priority as Alice but earlier date) → gets 30 → remaining: 10
- Alice (HIGH) → partial allowed, min 15, but only 10 left → **DEFERRED** (below min)
- Bob (MEDIUM, no partial) → 0 stock → **DEFERRED**

This creates a compelling demo of the allocation engine in action.

---

## 11. Allocation Impact Analyzer

File: `backend/src/services/impactAnalyzer.js`

Compare the two most recent allocation runs for the same set of order items.

```js
function analyzeImpact(previousRunId, currentRunId) {
  // Fetch results from both runs
  // For each order_item_id that appears in both:
  
  const changes = [];
  
  for (const item of currentResults) {
    const prev = previousResults.find(p => p.order_item_id === item.order_item_id);
    if (!prev) continue;
    
    const change = {
      order_item_id: item.order_item_id,
      order_id: item.order_id,
      product_name: item.product_name,
      customer_name: item.customer_name,
      previous_allocated: prev.allocated_quantity,
      current_allocated: item.allocated_quantity,
      previous_status: prev.status,
      current_status: item.status,
      delta: item.allocated_quantity - prev.allocated_quantity,
      changed: prev.status !== item.status || prev.allocated_quantity !== item.allocated_quantity
    };
    
    change.change_type = classifyChange(prev, item);
    // change_type values: 'improved', 'degraded', 'unchanged', 'newly_fulfilled', 'newly_deferred'
    
    changes.push(change);
  }
  
  return {
    run_compared: { previous: previousRunId, current: currentRunId },
    total_changes: changes.filter(c => c.changed).length,
    improvements: changes.filter(c => c.change_type === 'improved').length,
    degradations: changes.filter(c => c.change_type === 'degraded').length,
    changes
  };
}
```

---

## 12. Simulation Engine Rules

File: `backend/src/services/simulationService.js`

**CRITICAL: Simulations MUST NOT modify any live data.**

Strategy: Copy current inventory and order state into memory, run the allocation engine against the copied state, return results without writing to the main tables.

```js
async function runSimulation(scenarioType, scenarioInputs, userId) {
  // 1. Read current state (read-only queries)
  const liveInventory = await getLiveInventory();
  const liveOrders = await getEligibleOrderItems();
  
  // 2. Apply scenario to in-memory copies
  const simInventory = applyScenario(liveInventory, scenarioType, scenarioInputs);
  
  // 3. Run allocation engine against simulated state (in-memory, no DB writes)
  const simResults = runAllocationInMemory(simInventory, liveOrders);
  
  // 4. Compare against current allocation results
  const diff = compareResults(currentAllocationResults, simResults);
  
  // 5. Save simulation metadata to `simulations` table only (not allocation_results)
  await saveSimulationRecord(userId, scenarioType, scenarioInputs, diff);
  
  return diff;
}
```

### Scenario Types
| Type | What changes in simInventory |
|---|---|
| `inventory_increase` | `on_hand_quantity += inputs.quantity` for `inputs.product_id` |
| `inventory_decrease` | `on_hand_quantity -= inputs.quantity` (floor at 0) |
| `demand_surge` | `requested_quantity *= (1 + inputs.surge_percent / 100)` for all items |
| `supplier_delay` | Flag affected purchase orders, recalculate incoming stock |
| `priority_change` | Change `approved_priority` for `inputs.order_id` in memory only |

---

## 13. Frontend Routing (React Router v6)

```jsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  
  {/* Customer routes */}
  <Route element={<CustomerLayout />}>
    <Route path="/dashboard" element={<CustomerDashboard />} />
    <Route path="/products" element={<ProductCatalog />} />
    <Route path="/orders/new" element={<CreateOrder />} />
    <Route path="/orders" element={<MyOrders />} />
    <Route path="/orders/:id" element={<OrderDetail />} />
  </Route>
  
  {/* Admin routes */}
  <Route element={<AdminLayout />}>
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/admin/products" element={<ProductManagement />} />
    <Route path="/admin/inventory" element={<InventoryManagement />} />
    <Route path="/admin/orders" element={<OrderManagement />} />
    <Route path="/admin/allocation" element={<AllocationCenter />} />
    <Route path="/admin/ai" element={<AIRecommendations />} />
    <Route path="/admin/impact" element={<ImpactAnalyzer />} />
    <Route path="/admin/simulations" element={<SimulationLab />} />
    <Route path="/admin/alerts" element={<Alerts />} />
    <Route path="/admin/replenishment" element={<Replenishment />} />
    <Route path="/admin/reports" element={<Reports />} />
  </Route>
  
  <Route path="/" element={<Navigate to="/login" />} />
</Routes>
```

---

## 14. Allocation Status Values

Use these exact strings throughout backend and frontend:

| Status | Meaning |
|---|---|
| `fulfilled` | Full requested quantity allocated |
| `partially_fulfilled` | Some but not all units allocated (partial allowed + met minimum) |
| `deferred` | Zero units allocated (partial not allowed OR below minimum) |
| `pending` | Order item not yet processed by allocation engine |

### Order-Level Status (derived from item statuses)
| Condition | Order Status |
|---|---|
| All items `fulfilled` | `fulfilled` |
| All items `deferred` | `deferred` |
| Mix of `fulfilled` + `partially_fulfilled` / `deferred` | `partially_fulfilled` |
| Not yet run | `pending` / `confirmed` |

---

## 15. Error Response Format

Always use this shape for errors:
```json
{
  "error": true,
  "message": "Human-readable message",
  "code": "INSUFFICIENT_STOCK",
  "details": {}
}
```

Common error codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`,
`INSUFFICIENT_STOCK`, `AI_UNAVAILABLE`, `ALLOCATION_CONFLICT`

---

## 16. What NOT to Do

- ❌ Do NOT let AI modify `inventory`, `order_priorities`, or `allocation_results` directly
- ❌ Do NOT run allocation without a database transaction
- ❌ Do NOT show customers other customers' orders
- ❌ Do NOT claim AI accuracy in UI without data to back it
- ❌ Do NOT let simulations touch live tables
- ❌ Do NOT use `on_hand_quantity` as available stock — always subtract `reserved_quantity`
- ❌ Do NOT count a previously reserved quantity twice during reallocation (reset reserved to 0 first)
- ❌ Do NOT store JWT secrets or API keys in code — environment variables only
- ❌ Do NOT label rule-based fallback recommendations as AI-generated

---


## 17. Replenishment Formula

File: `backend/src/services/replenishmentService.js`

```
reorder_point = (average_daily_demand × supplier_lead_time_days) + safety_stock
inventory_position = on_hand_quantity + confirmed_incoming_stock - reserved_quantity

if inventory_position <= reorder_point:
  suggested_reorder_qty = (average_daily_demand × supplier_lead_time_days × 2) - inventory_position
  flag = 'REORDER_RECOMMENDED'
```

Label all values as **estimates**. Do not auto-create purchase orders.

---

## 18. Hackathon Demo Script (12-min presentation)

1. Show the scarce product (Pressure Gauge Pro — 40 units, 3 competing orders)
2. Admin runs allocation → show results with explanations
3. Show Impact Analyzer (before/after comparison)
4. AI recommends priority for one order → admin approves → rerun allocation → show change
5. Run a what-if simulation: add 20 more units → show which orders would now be fulfilled
6. Show customer portal: Alice sees her deferred order with explanation
7. Show replenishment alert for Pressure Gauge Pro

---

*This file was generated to guide AI-assisted development of OrderWise for VORTEXA 3.0.*
