# OrderWise — Phase 15: Performance & Observability Report

> **Acceptance Gate Verification**: Empirical performance benchmarks, query plan analysis, observable instrumentation, and bundle chunk budgets under load.

---

## 1. Executive Summary

| Category | Target / Baseline | Measured Result | Status |
|---|---|---|---|
| **Dataset Scale** | 5,000 orders, 200 products | **5,005 orders, 204 products, 10,096 items** | PASSED |
| **Allocation Latency (p95)** | < 2,500 ms | **871 ms** (avg: 810 ms, min: 745 ms) | PASSED |
| **Allocation Throughput** | > 2,000 items/sec | **~12,464 items/sec** | PASSED |
| **Query Latency (Hottest Path)** | < 15 ms | **2.97 ms** (Execution Time via Index Scan) | PASSED |
| **Frontend Initial Chunk Size** | < 100 kB (gzipped) | **17.26 kB** (4.55 kB gzipped) | PASSED |
| **Deep Health Check** | DB + Groq AI + Metrics | **200 OK / 503 degraded** with latency metadata | PASSED |
| **In-Memory Observability** | p50 / p95 / p99 ring buffer | `/api/metrics` active with p95 tracking | PASSED |

---

## 2. Allocation Engine Benchmark Results

Benchmark script: `backend/scripts/benchmark.js`  
Dataset generated via: `backend/src/db/seeds/largeSeed.js`

### 2.1 Dataset Statistics
- **Active Products:** 204
- **Eligible Competing Orders:** 5,005
- **Eligible Order Items Processed:** 10,096
- **Priorities Mix:** 16% LOW, 34% MEDIUM, 33% HIGH, 17% CRITICAL
- **Delivery Date Variance:** -5 days (overdue) to +60 days into future

### 2.2 Execution Timings (3 Consecutive Full Reallocation Runs)

| Run | Duration | Items Processed | Fulfilled | Partially Fulfilled | Deferred |
|---|---|---|---|---|---|
| Run 1 | 871 ms | 10,096 | 2,131 | 167 | 7,798 |
| Run 2 | 814 ms | 10,096 | 2,131 | 167 | 7,798 |
| Run 3 | 745 ms | 10,096 | 2,131 | 167 | 7,798 |

### 2.3 Statistical Percentiles
- **Minimum:** 745 ms
- **p50 (Median):** 814 ms
- **p95:** 871 ms
- **p99:** 871 ms
- **Maximum:** 871 ms
- **Average:** 810 ms

---

## 3. Database Indexing & EXPLAIN ANALYZE

Migration `009_performance_indexes.js` was introduced to eliminate sequential table scans and N+1 query patterns across core paths:

```sql
CREATE INDEX idx_order_items_product_order ON order_items (product_id, order_id);
CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_orders_customer_created ON orders (customer_id, created_at);
CREATE INDEX idx_orders_status_created ON orders (status, created_at);
CREATE INDEX idx_alloc_results_item_created ON allocation_results (order_item_id, created_at);
CREATE INDEX idx_alloc_results_run_id ON allocation_results (allocation_run_id);
CREATE INDEX idx_allocation_runs_created ON allocation_runs (created_at);
CREATE INDEX idx_order_priorities_order_id ON order_priorities (order_id);
CREATE INDEX idx_order_priorities_rank ON order_priorities (priority_rank);
CREATE INDEX idx_inventory_product_id ON inventory (product_id);
CREATE INDEX idx_inv_movements_product_created ON inventory_movements (product_id, created_at);
CREATE INDEX idx_products_active_name ON products (active, name);
```

### 3.1 Hot Path Query Plans (`backend/scripts/explainAnalyze.js`)

#### 1. Allocation Engine Candidate Fetch (`WHERE product_id = $1 AND o.status IN (...)`)
```
Bitmap Heap Scan on order_items oi
  Recheck Cond: (product_id = 1)
  ->  Bitmap Index Scan on idx_order_items_product_order  (cost=0.00..4.62 rows=44 width=0)
Index Scan using idx_order_priorities_order_id on order_priorities op
Planning Time: 5.184 ms
Execution Time: 2.972 ms
```

#### 2. Customer Portal Order List (`WHERE customer_id = $1 ORDER BY created_at DESC`)
```
Index Scan Backward using idx_orders_customer_created on orders o
Execution Time: 0.091 ms
```

#### 3. LATERAL Allocation Result Lookup for Order Items
```
Index Scan using idx_order_items_order_id on order_items oi
Index Scan Backward using idx_alloc_results_item_created on allocation_results ar_sub
Execution Time: 0.196 ms
```

#### 4. Admin Orders List with Memoized User Cache
```
Index Scan Backward using idx_orders_created_at on orders o
Memoize (Hits: 47, Misses: 3) -> Index Scan using users_pkey on users u
Execution Time: 0.174 ms
```

---

## 4. Frontend Bundle & Route Code Splitting

Configuration: `frontend/vite.config.js` with manual chunk splitting + `frontend/src/App.jsx` React.lazy route loading.

### 4.1 Production Bundle Chunks

| Asset | Raw Size | Gzip Size | Cache / Loading Strategy |
|---|---|---|---|
| `dist/index.html` | 1.13 kB | 0.56 kB | Immediate |
| `dist/assets/index-oUn5O8_l.js` | **17.26 kB** | **4.55 kB** | Initial Entry (lightweight bootstrap) |
| `dist/assets/auth-D-zj2Nhj.js` | 14.57 kB | 3.36 kB | Auth Routes |
| `dist/assets/icons-CebUC7gm.js` | 28.14 kB | 5.48 kB | Shared UI Icons |
| `dist/assets/customer-1FVRvRvF.js` | 50.34 kB | 9.73 kB | Customer Portal (Lazy) |
| `dist/assets/admin-BU9RXhmg.js` | 156.04 kB | 25.92 kB | Admin Operations (Lazy) |
| `dist/assets/vendor--rQ08kQO.js` | 217.29 kB | 72.93 kB | React / React-DOM / Router (Cached) |
| `dist/assets/charts-Cmrtvfbl.js` | 400.16 kB | 108.55 kB | Recharts & D3 (Only loaded on chart views) |

---

## 5. Observability & Health Infrastructure

### 5.1 Structured Logging (`backend/src/utils/logger.js`)
Emits NDJSON format with `ts`, `level`, `svc`, `reqId`, `msg`, and contextual metadata:
```json
{"ts":"2026-10-11T14:53:29.845Z","level":"info","svc":"orderwise-backend","reqId":"c97fae12-3481-4b72-8a1d-2895f320ad32","msg":"Allocation run completed","runId":5,"durationMs":814,"itemsProcessed":10096,"fulfilled":2131,"partiallyFulfilled":167,"deferred":7798}
```

### 5.2 Deep Health Check (`GET /api/health/deep`)
Probes all operational dependencies with strict timeouts:
- **Database:** PostgreSQL connection and query latency.
- **AI Service:** Groq API reachability (HEAD probe without consuming token budget).
- **In-process Metrics:** Live uptime, allocation duration p95, HTTP p95 latency, error count.

### 5.3 Live Metrics API (`GET /api/metrics` — Admin Only)
Exposes rolling 1,000-run and 5,000-request latency distributions:
- `allocation.p50_ms`, `allocation.p95_ms`, `allocation.p99_ms`
- `http.requests_total`, `http.p95_ms`, `http.errors_total`

---

## 6. Acceptance Gate Sign-Off

- [x] **5,000 orders & 200 products dataset seeded and benchmarked**
- [x] **Allocation execution under 1,000 ms at scale (measured: 810 ms avg, 871 ms p95)**
- [x] **All database indexes verified via EXPLAIN ANALYZE (< 3 ms hot path queries)**
- [x] **N+1 queries resolved on all customer and admin list endpoints**
- [x] **Frontend bundle code-split with lazy routes (17 kB initial JS chunk)**
- [x] **Structured request-ID logs, `/api/health/deep`, and `/api/metrics` active**
- [x] **Zero unexplained slow queries**
