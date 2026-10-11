# OrderWise — Advanced Intelligence & Explainability (Phase 18 Stretch)

> **Classification:** `STRETCH_EXPERIMENTAL`  
> **Status:** Fully Tested & Integrated  
> **Core Principle:** Algorithmic projections and advisory intelligence assist operators; business rules remain deterministic; all priority adjustments strictly require authorized human approval.

---

## 1. Overview & Capabilities

Phase 18 delivers forward-looking intelligence capabilities designed to prevent supply chain bottlenecks, diagnose allocation outcomes, ensure multi-tier fairness, and model multi-facility fulfillment topology.

| Capability | Methodology | Output Classification | Human Approval Required? |
|---|---|---|---|
| **Demand Forecasting** | Single Exponential Smoothing (SES) & Simple Moving Average (SMA) | `EXPERIMENTAL_ESTIMATE` | No (Advisory only) |
| **Prediction Intervals** | 95% Confidence Bounds with expanding horizon error margin | `STATISTICAL_PROJECTION` | No |
| **Fairness & Service Metrics** | Priority fill rates, on-time delivery rate, anti-starvation monitor | `FAIRNESS_AUDIT` | No |
| **Anti-Starvation Aging Rule** | Progressive order aging recommendation | `PROPOSED_ADVISORY_ONLY` | **YES (Strict Invariant)** |
| **Explainable Run Summaries** | Natural-language executive synthesis & bottleneck diagnosis | `EXPLAINABLE_AI_SYNTHESIS` | No |
| **Multi-Warehouse Topology** | Multi-node regional warehouse network (`ORD`, `RNO`, `ABE`) | `MULTI_WAREHOUSE_EXPERIMENTAL` | No |

---

## 2. Mathematical Demand Forecasting

File: [`backend/src/services/intelligenceService.js`](file:///c:/Users/jadha/OneDrive/Desktop/OrderWise/backend/src/services/intelligenceService.js)

### 2.1 Single Exponential Smoothing (SES)
For stationary and gently trending demand time series, SES weights recent observations exponentially higher:

$$\hat{y}_{t+1} = \alpha \cdot y_t + (1 - \alpha) \cdot \hat{y}_t$$

Where:
- $\alpha \in (0, 1]$ represents the smoothing factor (default $\alpha = 0.30$).
- $y_t$ is actual monthly order demand.
- $\hat{y}_t$ is the smoothed level at period $t$.

### 2.2 95% Confidence Prediction Intervals
Because future demand is stochastic, OrderWise projects prediction intervals that widen as the forecast horizon $h$ increases:

$$\text{Margin}_h = z_{0.95} \cdot \sigma_e \cdot \sqrt{1 + (h - 1)\alpha^2}$$

$$\text{LowerBound}_h = \max(0, \hat{y}_{t+h} - \text{Margin}_h)$$
$$\text{UpperBound}_h = \hat{y}_{t+h} + \text{Margin}_h$$

Where $z_{0.95} = 1.96$ and $\sigma_e$ is the sample standard error of in-sample residuals.

### 2.3 Simple Moving Average (SMA)
For comparison, a rolling $k$-period moving average ($k=3$) provides an unweighted baseline:

$$\text{SMA}_k = \frac{1}{k} \sum_{i=0}^{k-1} y_{t-i}$$

> [!NOTE]
> All forecast outputs are explicitly tagged with `status_label: "EXPERIMENTAL_ESTIMATE"` and an unalterable disclaimer:
> *"This projection is an algorithmic estimate based on historical demand models and does not represent guaranteed future sales."*

---

## 3. Customer Fairness & Anti-Starvation Governance

In strict deterministic allocation, low-priority orders can experience starvation when high-priority demand continuously consumes scarce inventory.

### 3.1 Fairness Metrics Monitored
1. **Fill Rate by Priority Tier:**
   $$\text{FillRate}_{\text{priority}} = \frac{\text{Fulfilled Orders}}{\text{Total Requested Orders}} \times 100\%$$
   Evaluated independently for `CRITICAL`, `HIGH`, `MEDIUM`, and `LOW`.
2. **On-Time Delivery Rate:**
   $$\text{OnTimeRate} = \frac{\text{Orders Fulfilled on or before Promised Date}}{\text{Total Orders with Promised Date}} \times 100\%$$
3. **Starvation Flag Threshold:**
   Any active order deferred across $\ge 2$ consecutive allocation runs is flagged with `starvation_risk: "MEDIUM"` ($\ge 3$ runs flagged as `"HIGH"`).

### 3.2 Anti-Starvation Aging Policy (Proposed Advisory)
When an order experiences starvation, OrderWise generates a **Suggested Aging Action**:
- **Action:** `ELEVATE_PRIORITY_FOR_AGING`
- **Recommended Priority:** `LOW` $\rightarrow$ `MEDIUM` or `MEDIUM` $\rightarrow$ `HIGH`
- **Status:** `PROPOSED_ADVISORY_ONLY`
- **`requires_human_approval: true`**

> [!IMPORTANT]
> **Strict Governance Invariant:**  
> Changing business allocation priorities fundamentally alters inventory entitlement. Under `AGENTS.md`, AI recommends and authorized humans approve. **The system NEVER auto-elevates an order's priority.** A human administrator must explicitly approve the recommendation through the Priority Approval workflow.

---

## 4. Natural-Language Allocation Run Explainability

File: [`backend/src/services/intelligenceService.js`](file:///c:/Users/jadha/OneDrive/Desktop/OrderWise/backend/src/services/intelligenceService.js)

Operators and executives require intuitive narratives rather than raw JSON or SQL rows. The explainability engine analyzes each run's inputs, decisions, and constraints to generate a human-readable synthesis.

### Example Narrative Output:
```text
Run #1: 1 of 3 orders fulfilled (33% fill rate). Bottleneck: Pressure Gauge Pro.

Allocation Run #1 processed 3 order items and fulfilled 1 completely (33% fill rate), with 0 partially fulfilled and 2 deferred.

The critical inventory bottleneck was Pressure Gauge Pro. Demand exceeded immediate warehouse stock, requiring priority-based rationing.

Charlie Heavy Industries was fully fulfilled with 30 units of GAUGE-P300 due to approved priority and promised delivery date. Alice Manufacturing was deferred for 25 units of GAUGE-P300 because remaining stock was below their minimum threshold or allocated to higher-priority orders. Bob Precision Tools was deferred for 20 units of GAUGE-P300 because remaining stock was below their minimum threshold or allocated to higher-priority orders.
```

---

## 5. Multi-Warehouse Topology & Regional Routing

OrderWise models multi-facility stock distribution across three primary logistics hubs:

| Facility Code | Name | Location | Capacity | Lat / Lng | Primary Region |
|---|---|---|---|---|---|
| `ORD-CENTRAL` | Midwest Primary DC | Chicago, IL | 50,000 units | 41.8781, -87.6298 | Central / Midwest |
| `RNO-WEST` | West Coast Regional Hub | Reno, NV | 35,000 units | 39.5296, -119.8138 | West / Pacific |
| `ABE-EAST` | East Coast Fulfillment Node | Allentown, PA | 25,000 units | 40.6084, -75.4902 | East / Atlantic |

### Routing Strategy: `PROXIMITY_FIRST_WITH_STOCK_FALLBACK`
1. Customer shipping coordinates are evaluated against warehouse geolocations via great-circle distance.
2. Orders attempt fulfillment at the closest regional node.
3. If the regional node lacks sufficient stock and partial fulfillment is prohibited, the engine evaluates fallback fulfillment from `ORD-CENTRAL`.

---

## 6. REST API Endpoints

All endpoints are authenticated and protected by RBAC (`admin` and `inventory_manager` roles):

### 6.1 `GET /api/intelligence/forecast`
- **Query Parameters:** `product_id` (optional int), `alpha` (optional float, 0.1 to 1.0)
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "forecasts": [
        {
          "product_id": 3,
          "product_name": "Pressure Gauge Pro",
          "sku": "GAUGE-P300",
          "status_label": "EXPERIMENTAL_ESTIMATE",
          "disclaimer": "This projection is an algorithmic estimate based on historical demand models and does not represent guaranteed future sales.",
          "trend": "increasing",
          "exponential_smoothing": {
            "forecast": [
              { "period_ahead": 1, "point_forecast": 61, "lower_bound_95": 49, "upper_bound_95": 73 }
            ]
          }
        }
      ]
    }
  }
  ```

### 6.2 `GET /api/intelligence/fairness`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "fill_rate_by_priority": [
        { "priority_level": "CRITICAL", "fill_rate_percent": 100 },
        { "priority_level": "HIGH", "fill_rate_percent": 50 },
        { "priority_level": "MEDIUM", "fill_rate_percent": 0 },
        { "priority_level": "LOW", "fill_rate_percent": 0 }
      ],
      "overall_service_level": {
        "on_time_delivery_rate_percent": 88
      },
      "anti_starvation_monitor": {
        "threshold_deferred_runs": 2,
        "starved_orders_count": 1,
        "starved_orders": [
          {
            "order_id": 2,
            "customer_name": "Bob Precision Tools",
            "consecutive_deferred_runs": 2,
            "suggested_aging_action": {
              "action": "ELEVATE_PRIORITY_FOR_AGING",
              "requires_human_approval": true,
              "policy_status": "PROPOSED_ADVISORY_ONLY"
            }
          }
        ]
      }
    }
  }
  ```

### 6.3 `GET /api/intelligence/explain/:runId`
- **Response:** Natural-language headline, narrative paragraphs, key bottleneck product, and fill rate.

### 6.4 `GET /api/intelligence/warehouses`
- **Response:** Complete node topology, inventory balances per SKU, total network stock, and routing strategy.

---

## 7. Verification & Acceptance Gate

- **Unit & Integration Suite:** [`backend/tests/advancedIntelligence.test.js`](file:///c:/Users/jadha/OneDrive/Desktop/OrderWise/backend/tests/advancedIntelligence.test.js)
  - 14/14 tests passing.
  - Verifies SES widening intervals, SMA rolling averages, narrative syntheses, anti-starvation human approval flags, multi-warehouse nodes, and RBAC 401/403 guards.
- **Labels:** Every projection, metric, and warehouse model is explicitly badged as `EXPERIMENTAL_ESTIMATE` or `STRETCH_EXPERIMENTAL`.

