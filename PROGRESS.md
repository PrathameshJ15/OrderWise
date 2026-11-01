# OrderWise — Project Progress & Implementation Status

> **System:** OrderWise (AI-Assisted Priority-Based Order Allocation Platform)  
> **Event:** VORTEXA 3.0 Hackathon — Problem Statement S-03  
> **Current Status:** Phase 15 Complete | Production-Ready MVP + Advanced Intelligence  
> **Last Updated:** November 2026

---

## 📊 Executive Progress Dashboard

| Metric | Target | Current Status | State |
|---|---|---|---|
| **Priority 0 (Core MVP)** | 100% | 100% Complete | 🟢 Operational |
| **Priority 1 (Differentiators)** | 100% | 100% Complete | 🟢 Operational |
| **Priority 2 (Intelligence)** | 100% | 100% Complete | 🟢 Operational |
| **Priority 3 (Enterprise Polish)** | 100% | 95% Complete | 🟢 Operational |
| **Frontend Test Suite** | 100% Pass | 31/31 Passed (9/9 Test Files) | 🟢 Passing |
| **Pure Backend Unit Tests** | 100% Pass | 61/61 Passed | 🟢 Passing |
| **OWASP Security Hardening** | 100% | 100% Enforced | 🟢 Secured |

---

## 🧭 Implementation Priority Breakdown (AGENTS.md)

### ✅ Priority 0 — Non-Negotiable MVP (100% Done)
- [x] **PostgreSQL Schema & Migrations:** 11 migrations covering users, products, inventory, orders, priorities, allocation runs, results, audit logs, alerts, replenishment, and simulations.
- [x] **Backend Auth & RBAC:** Register, login, JWT verification with strict role enforcement (`customer`, `admin`, `inventory_manager`).
- [x] **Product CRUD & Inventory Management:** Full hardware product catalog management with version-checked optimistic concurrency on stock balance.
- [x] **Customer Order Creation:** Multi-line order creation with `requested_quantity`, `minimum_acceptable_quantity`, and `partial_delivery_allowed`.
- [x] **Deterministic Allocation Engine:** Core algorithm in `backend/src/services/allocationEngine.js` sorting on `approved_priority DESC`, `promised_delivery_date ASC NULLS LAST`, `created_at ASC`, `order.id ASC`.
- [x] **Frontend Customer Experience:**
  - Browse Catalog with live stock indicators
  - Order creation with validation and idempotency
  - "My Orders" order tracking timeline and cancellation flow
- [x] **Frontend Admin Operations:**
  - Inventory management with stock adjustment modal & ledger tracking
  - Order management with line-item inspection
  - Allocation Center with run execution and audit hash display
- [x] **Demo Data Seeding:** 4 default test accounts and conflicting order items configured for live allocation demonstrations.

---

### ✅ Priority 1 — Strong Differentiators (100% Done)
- [x] **Groq AI Priority Assistant:** Model `llama3-70b-8192` with structured JSON output, low temperature (0.2), and transparent rule-based keyword fallback.
- [x] **Human Approval Flow:** Authorized admin review (Approve / Override / Reject) before any AI recommendation affects live allocations.
- [x] **Allocation Impact Analyzer:** Compares consecutive runs, calculates net fulfillment deltas, and tags changes (`improved`, `degraded`, `unchanged`, `newly_fulfilled`, `newly_deferred`).
- [x] **Proactive Shortage Alerts:** Automated scanner identifying high-risk low-stock SKUs and unfulfilled critical orders.
- [x] **Allocation Run History:** Full audit trail with run timestamps, total items processed, and cryptographic audit hash.

---

### ✅ Priority 2 — Advanced Intelligence & Observability (100% Done)
- [x] **Simulation Lab (What-If Scenarios):**
  - In-memory execution (zero mutation to live database)
  - 5 Scenarios: `inventory_increase`, `inventory_decrease`, `demand_surge`, `supplier_delay`, `priority_change`
- [x] **Replenishment Advisory Engine:** Velocity-based reorder point (ROP) calculation, economic order quantities (EOQ), and purchase order draft generator.
- [x] **Interactive Recharts Dashboards:** Real-time stock vs. demand charts, fill-rate breakdown, and allocation summary distribution.
- [x] **Immutable Security Audit Log Viewer:** Actor attribution, IP logging, action filters, and timestamped events.

---

### 🚀 Priority 3 — Enterprise Polish (95% Done)
- [x] **CSV Exporting & Executive Reports:** Export allocations, inventory positions, and deferred items to CSV.
- [x] **Real-Time Notification System:** Server-Sent Events (SSE) notification bell with unread badge counter.
- [x] **Seamless In-Memory Fallbacks:** Robust client-side mock modes ensuring uninterrupted UI demonstrations even when external databases are offline.
- [ ] **External Supplier Portal UI:** (Optional roadmap feature).

---

## 🖥️ Frontend Screen Matrix

| Route | Page Component | Role | Status |
|---|---|---|---|
| `/` or `/login` | `Login.jsx` | Public | ✅ Working (Includes 1-click Demo fast logins) |
| `/register` | `Register.jsx` | Public | ✅ Working (Password strength rules enforced) |
| `/home` | `Home.jsx` | Public | ✅ Working (Architectural pillars & overview) |
| `/dashboard` | `CustomerDashboard.jsx` | Customer | ✅ Working (KPI cards, recent orders, SSE updates) |
| `/products` | `ProductCatalog.jsx` | Customer | ✅ Working (Availability pills: In Stock, Limited, Scarce) |
| `/orders/new` | `CreateOrder.jsx` | Customer | ✅ Working (Requested vs Min acceptable quantities) |
| `/orders` | `MyOrders.jsx` | Customer | ✅ Working (Status filter, real-time updates) |
| `/orders/:id` | `OrderDetail.jsx` | Customer | ✅ Working (Tracking timeline & cancellation) |
| `/admin` | `AdminDashboard.jsx` | Admin / Mgr | ✅ Working (Executive KPIs, demand vs stock chart) |
| `/admin/products`| `ProductManagement.jsx` | Admin | ✅ Working (Catalog editor & SKU creator) |
| `/admin/inventory`| `InventoryManagement.jsx`| Admin / Mgr | ✅ Working (Stock adjustment & movement ledger) |
| `/admin/orders` | `OrderManagement.jsx` | Admin | ✅ Working (Inspect order items, confirm/cancel) |
| `/admin/allocation`| `AllocationCenter.jsx`| Admin | ✅ Working (Run engine, dry run preview, audit hash) |
| `/admin/ai` | `AIRecommendations.jsx`| Admin | ✅ Working (AI suggestions & human approval card) |
| `/admin/impact` | `ImpactAnalyzer.jsx` | Admin | ✅ Working (Before/after diffs & degradation alerts) |
| `/admin/simulations`| `SimulationLab.jsx` | Admin | ✅ Working (Run 5 what-if scenarios in-memory) |
| `/admin/alerts` | `Alerts.jsx` | Admin / Mgr | ✅ Working (Severity filters & acknowledge flow) |
| `/admin/replenishment`| `Replenishment.jsx`| Admin / Mgr | ✅ Working (Velocity advisor & draft PO modal) |
| `/admin/reports` | `Reports.jsx` | Admin | ✅ Working (Fill-rate analytics & CSV export) |
| `/admin/audit` | `AuditViewer.jsx` | Admin | ✅ Working (Immutable security audit log viewer) |

---

## ⚙️ Service Runtime Information

| Service | Port | Local URL | Current State |
|---|---|---|---|
| **Frontend (Vite + React)** | 5173 | [http://localhost:5173/](http://localhost:5173/) | 🟢 **RUNNING** |
| **Backend API (Node/Express)**| 4000 | [http://localhost:4000/api](http://localhost:4000/api) | 🟢 **RUNNING** |
| **API Health Endpoint** | 4000 | [http://localhost:4000/api/health](http://localhost:4000/api/health) | 🟢 **HEALTHY** |
| **PostgreSQL Database** | 5432 | `localhost:5432/orderwise_db` | ⚪ External / Local |

---

## 🔑 Default Credentials for Verification

| User Role | Email | Password |
|---|---|---|
| **System Administrator** | `admin@orderwise.com` | `Admin123!` |
| **Inventory Manager** | `manager@orderwise.com` | `Manager123!` |
| **Customer (Alice)** | `alice@demo.com` | `Alice123!` |
| **Customer (Bob)** | `bob@demo.com` | `Bob123!` |
| **Customer (Charlie)** | `charlie@demo.com` | `Charlie123!` |
