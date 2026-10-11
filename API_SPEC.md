# OrderWise — API Specification

Base URL: `http://localhost:4000/api`  
Auth: `Authorization: Bearer <jwt_token>` on all protected routes  
Content-Type: `application/json`

Error shape: `{ "error": true, "message": "...", "code": "ERROR_CODE" }`

---

## Auth Routes

### POST /auth/register
Create a customer account. Role is always `customer` — admins are seeded.

**Request**
```json
{
  "name": "Alice Johnson",
  "email": "alice@demo.com",
  "password": "Alice123!"
}
```

**Response 201**
```json
{
  "token": "eyJhbGci...",
  "user": { "id": 2, "name": "Alice Johnson", "email": "alice@demo.com", "role": "customer" }
}
```

---

### POST /auth/login

**Request**
```json
{ "email": "admin@orderwise.com", "password": "Admin123!" }
```

**Response 200**
```json
{
  "token": "eyJhbGci...",
  "user": { "id": 1, "name": "Admin", "email": "admin@orderwise.com", "role": "admin" }
}
```

---

### GET /auth/me
Returns the authenticated user. Requires auth.

**Response 200**
```json
{ "id": 1, "name": "Admin", "email": "admin@orderwise.com", "role": "admin" }
```

---

## Product Routes

### GET /products
Public. Returns all active products with current inventory.

**Response 200**
```json
{
  "products": [
    {
      "id": 3,
      "sku": "GAUGE-P300",
      "name": "Pressure Gauge Pro",
      "description": "Industrial pressure measurement device",
      "unit": "units",
      "on_hand_quantity": 40,
      "reserved_quantity": 30,
      "available_stock": 10
    }
  ]
}
```

---

### POST /products
Admin only.

**Request**
```json
{
  "sku": "PUMP-X100",
  "name": "Industrial Pump Model X",
  "description": "High-pressure industrial pump",
  "unit": "units",
  "initial_stock": 150,
  "safety_stock": 20,
  "reorder_point": 50
}
```

**Response 201**
```json
{ "product": { "id": 1, "sku": "PUMP-X100", "name": "Industrial Pump Model X" } }
```

---

### PUT /products/:id
Admin only. Update product details.

---

### PUT /inventory/:productId
Admin or inventory_manager. Adjust stock level.

**Request**
```json
{
  "on_hand_quantity": 200,
  "reason": "New shipment received from Supplier A"
}
```

**Response 200**
```json
{
  "inventory": {
    "product_id": 1,
    "on_hand_quantity": 200,
    "reserved_quantity": 100,
    "available_stock": 100
  },
  "movement_id": 42
}
```

---

## Order Routes

### POST /orders
Customer only. Creates an order with one or more items.

**Request**
```json
{
  "promised_delivery_date": "2025-02-15",
  "business_notes": "Urgent replacement for failed equipment at Site 3",
  "items": [
    {
      "product_id": 3,
      "requested_quantity": 25,
      "minimum_acceptable_quantity": 15,
      "partial_delivery_allowed": true
    },
    {
      "product_id": 2,
      "requested_quantity": 10,
      "minimum_acceptable_quantity": 5,
      "partial_delivery_allowed": true
    }
  ]
}
```

**Response 201**
```json
{
  "order": {
    "id": 7,
    "customer_id": 2,
    "status": "pending",
    "promised_delivery_date": "2025-02-15",
    "items": [
      {
        "id": 11,
        "product_id": 3,
        "product_name": "Pressure Gauge Pro",
        "requested_quantity": 25,
        "minimum_acceptable_quantity": 15,
        "partial_delivery_allowed": true
      }
    ]
  }
}
```

---

### GET /orders/my
Customer only. Returns only their own orders with latest allocation results.

**Response 200**
```json
{
  "orders": [
    {
      "id": 7,
      "status": "pending",
      "promised_delivery_date": "2025-02-15",
      "created_at": "2025-01-20T10:00:00Z",
      "items": [
        {
          "id": 11,
          "product_name": "Pressure Gauge Pro",
          "requested_quantity": 25,
          "latest_allocation": {
            "allocated_quantity": 0,
            "status": "deferred",
            "explanation": "Available stock (10 units) was below the minimum acceptable quantity (15 units). No allocation was made.",
            "run_at": "2025-01-20T11:00:00Z"
          }
        }
      ]
    }
  ]
}
```

---

### GET /orders
Admin only. All orders with filters.

**Query params:** `status`, `customer_id`, `product_id`, `from`, `to`, `page`, `limit`

---

### GET /orders/:id
Auth. Customer can only access their own orders. Admin can access any.

---

### PATCH /orders/:id/status
Admin only.

**Request**
```json
{ "status": "cancelled", "reason": "Customer requested cancellation" }
```

---

## Priority Routes

### GET /priorities/:orderId
Admin only. Returns current approved priority for an order.

**Response 200**
```json
{
  "order_id": 7,
  "approved_priority": "high",
  "priority_rank": 3,
  "approved_by": { "id": 1, "name": "Admin" },
  "approved_at": "2025-01-20T09:30:00Z",
  "reason": "Customer confirmed urgent operational need"
}
```

---

## AI Recommendation Routes

### POST /ai/recommend/:orderId
Admin only. Triggers AI analysis and saves recommendation.

**Request** (optional — pre-populate notes)
```json
{ "additional_context": "Customer called to confirm site shutdown risk" }
```

**Response 200**
```json
{
  "recommendation": {
    "id": 5,
    "order_id": 7,
    "suggested_priority": "critical",
    "confidence": "high",
    "explanation": "The business notes describe an active equipment failure with site shutdown risk, which warrants immediate critical priority classification.",
    "evidence": "Urgent replacement for failed equipment at Site 3",
    "warning": null,
    "provider": "groq",
    "model": "llama3-70b-8192",
    "recommendation_status": "pending"
  }
}
```

If Groq is unavailable, `provider` will be `"fallback"` and `warning` will say so explicitly.

---

### POST /priorities/approve
Admin only. Approves, rejects, or modifies an AI recommendation.

**Request**
```json
{
  "recommendation_id": 5,
  "decision": "approved",
  "final_priority": "critical",
  "reason": "Confirmed with customer — site operations at risk"
}
```

**Response 200**
```json
{
  "approval": { "id": 3, "decision": "approved", "final_priority": "critical" },
  "order_priority": { "order_id": 7, "approved_priority": "critical", "priority_rank": 4 }
}
```

This is the ONLY route that may update `order_priorities`.

---

## Allocation Routes

### POST /allocation/run
Admin only. Runs the allocation engine.

**Request**
```json
{
  "product_ids": [1, 2, 3],
  "notes": "Post-shipment reallocation"
}
```

To run for ALL products: `{ "product_ids": "all" }`

**Response 200**
```json
{
  "run": {
    "id": 12,
    "status": "completed",
    "initiated_by": 1,
    "created_at": "2025-01-20T11:00:00Z",
    "completed_at": "2025-01-20T11:00:01Z"
  },
  "summary": {
    "total_items_processed": 8,
    "fulfilled": 4,
    "partially_fulfilled": 1,
    "deferred": 3
  },
  "results": [
    {
      "order_item_id": 11,
      "order_id": 7,
      "customer_name": "Alice Johnson",
      "product_name": "Pressure Gauge Pro",
      "requested_quantity": 25,
      "allocated_quantity": 0,
      "status": "deferred",
      "approved_priority": "high",
      "promised_delivery_date": "2025-02-15",
      "stock_at_allocation": 10,
      "partial_delivery_allowed": true,
      "minimum_acceptable_quantity": 15,
      "explanation": "Available stock (10 units) was below the minimum acceptable quantity (15 units). No allocation was made."
    }
  ]
}
```

---

### GET /allocation/runs
Admin only. Returns allocation run history.

**Query params:** `page`, `limit`, `from`, `to`

**Response 200**
```json
{
  "runs": [
    {
      "id": 12,
      "status": "completed",
      "initiated_by": { "id": 1, "name": "Admin" },
      "summary": { "total": 8, "fulfilled": 4, "partially_fulfilled": 1, "deferred": 3 },
      "created_at": "2025-01-20T11:00:00Z",
      "completed_at": "2025-01-20T11:00:01Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 3 }
}
```

---

### GET /allocation/runs/:id
Admin only. Full results for one run.

---

### GET /allocation/impact/:runId
Admin only. Diff between this run and the previous run.

**Response 200**
```json
{
  "impact": {
    "current_run_id": 12,
    "previous_run_id": 11,
    "total_items_compared": 8,
    "total_changed": 2,
    "improvements": 1,
    "degradations": 1,
    "changes": [
      {
        "order_item_id": 9,
        "order_id": 6,
        "product_name": "Pressure Gauge Pro",
        "customer_name": "Charlie Davis",
        "previous_allocated": 20,
        "current_allocated": 30,
        "previous_status": "partially_fulfilled",
        "current_status": "fulfilled",
        "delta": 10,
        "change_type": "improved"
      },
      {
        "order_item_id": 11,
        "order_id": 7,
        "product_name": "Pressure Gauge Pro",
        "customer_name": "Alice Johnson",
        "previous_allocated": 10,
        "current_allocated": 0,
        "previous_status": "partially_fulfilled",
        "current_status": "deferred",
        "delta": -10,
        "change_type": "degraded"
      }
    ]
  }
}
```

---

## Simulation Routes

### POST /simulations
Admin only. Creates and immediately runs a simulation.

**Request (inventory_increase scenario)**
```json
{
  "scenario_type": "inventory_increase",
  "scenario_inputs": {
    "product_id": 3,
    "quantity": 20,
    "description": "Emergency stock delivery expected"
  }
}
```

**Request (demand_surge scenario)**
```json
{
  "scenario_type": "demand_surge",
  "scenario_inputs": {
    "surge_percent": 30,
    "description": "Simulating Q4 seasonal demand increase"
  }
}
```

**Request (priority_change scenario)**
```json
{
  "scenario_type": "priority_change",
  "scenario_inputs": {
    "order_id": 7,
    "hypothetical_priority": "critical"
  }
}
```

**Response 200**
```json
{
  "simulation": {
    "id": 4,
    "scenario_type": "inventory_increase",
    "scenario_inputs": { "product_id": 3, "quantity": 20 },
    "created_at": "2025-01-20T11:30:00Z"
  },
  "results": {
    "scenario_description": "Adding 20 units to Pressure Gauge Pro (current: 40)",
    "simulated_stock": 60,
    "current_allocation": [
      { "order_id": 5, "customer": "Charlie", "allocated": 30, "status": "fulfilled" },
      { "order_id": 7, "customer": "Alice",   "allocated": 0,  "status": "deferred"  },
      { "order_id": 8, "customer": "Bob",     "allocated": 0,  "status": "deferred"  }
    ],
    "simulated_allocation": [
      { "order_id": 5, "customer": "Charlie", "allocated": 30, "status": "fulfilled"          },
      { "order_id": 7, "customer": "Alice",   "allocated": 25, "status": "fulfilled"          },
      { "order_id": 8, "customer": "Bob",     "allocated": 0,  "status": "deferred"           }
    ],
    "affected_orders": 1,
    "newly_fulfilled": ["Alice — Order #7"],
    "still_deferred": ["Bob — Order #8 (no partial allowed, stock still insufficient)"],
    "remaining_simulated_stock": 5,
    "note": "This is a simulation. No live data was modified."
  }
}
```

---

### GET /simulations
Admin only. Returns past simulations.

---

### GET /simulations/:id
Admin only.

---

## Alert Routes

### GET /alerts
Admin or inventory_manager.

**Query params:** `resolved` (true/false), `severity`, `product_id`, `page`, `limit`

**Response 200**
```json
{
  "alerts": [
    {
      "id": 8,
      "alert_type": "below_reorder_point",
      "severity": "warning",
      "title": "Pressure Gauge Pro Below Reorder Point",
      "description": "Current inventory position (10 units) is below the configured reorder point (70 units).",
      "product_id": 3,
      "product_name": "Pressure Gauge Pro",
      "resolved": false,
      "suggested_action": "Review replenishment recommendations for this product.",
      "created_at": "2025-01-20T11:00:00Z"
    }
  ]
}
```

---

### PATCH /alerts/:id/resolve
Admin only.

---

## Replenishment Routes

### GET /replenishment
Admin or inventory_manager. Returns replenishment recommendations.

**Response 200**
```json
{
  "recommendations": [
    {
      "product_id": 3,
      "product_name": "Pressure Gauge Pro",
      "current_stock": 40,
      "reserved_quantity": 30,
      "available_stock": 10,
      "reorder_point": 70,
      "average_daily_demand": 8,
      "supplier_lead_time_days": 5,
      "safety_stock": 20,
      "incoming_stock": 0,
      "inventory_position": 10,
      "estimated_shortage_risk": "high",
      "suggested_reorder_quantity": 90,
      "formula_used": "(8 × 5) + 20 = 60 reorder point; position 10 < 70",
      "note": "This is an estimate based on recent demand data. Review before placing an order."
    }
  ]
}
```

---

## Report Routes

### GET /reports/summary
Admin only. Returns aggregate metrics.

**Response 200**
```json
{
  "summary": {
    "total_active_orders": 5,
    "total_products": 4,
    "orders_by_status": {
      "pending": 2,
      "confirmed": 2,
      "cancelled": 1
    },
    "allocation_coverage": {
      "fulfilled": 4,
      "partially_fulfilled": 1,
      "deferred": 3,
      "last_run_at": "2025-01-20T11:00:00Z"
    },
    "low_stock_products": [
      { "product_id": 3, "name": "Pressure Gauge Pro", "available_stock": 10 }
    ],
    "pending_ai_recommendations": 1,
    "unresolved_alerts": 3
  }
}
```
