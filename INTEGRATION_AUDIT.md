# OrderWise — Comprehensive Integration & System Audit Report

**Date:** October 11, 2026  
**Auditor:** Senior Full-Stack Developer & Debugging Engineer  
**System:** OrderWise (AI-Assisted Priority-Based Order Allocation Platform)  
**Environment:** Node.js 20, Express 4, PostgreSQL (Neon), React 18, Vite 5, Tailwind CSS 3, Groq Llama-3  

---

## Executive Summary

OrderWise is an intelligent supply chain management platform designed to allocate scarce inventory across competing customer orders using deterministic business logic, Groq Llama-3 AI priority recommendations, and strict human authorization.

While the frontend Vite development server and backend Express server boot up, several critical disconnections and gaps were discovered across routing, database schema migrations, component implementations, navigation links, and API data contracts. This audit document details all findings across 10 structured dimensions and outlines a non-destructive remediation plan.

---

## 1. Existing Frontend Pages

| # | Page Component | File Path | Route | Status | Notes |
|---|---|---|---|---|---|
| 1 | `Home` | `src/pages/Home.jsx` | `/home` | Working | Public landing page explaining core architectural pillars. |
| 2 | `Login` | `src/pages/Login.jsx` | `/login` | Working | Authenticates session with JWT; includes 1-click demo fast-login buttons for Admin, Manager, and Customer. |
| 3 | `Register` | `src/pages/Register.jsx` | `/register` | Working | Customer registration with real-time password policy validation indicator. |
| 4 | `CustomerDashboard` | `src/pages/customer/CustomerDashboard.jsx` | `/dashboard` | Working | Customer hub; displays live KPI metrics (placed, pending, fulfilled, partial, cancelled) and recent orders. |
| 5 | `ProductCatalog` | `src/pages/customer/ProductCatalog.jsx` | `/products` | Working | Customer catalog with search and availability rating pills (In Stock, Limited, Scarce). |
| 6 | `CreateOrder` | `src/pages/customer/CreateOrder.jsx` | `/orders/new` | Working | Multi-line order creation with requested vs minimum acceptable quantity rules and idempotency key protection. |
| 7 | `MyOrders` | `src/pages/customer/MyOrders.jsx` | `/orders` | Working | Filterable customer orders table with real-time SSE refresh. |
| 8 | `OrderDetail` | `src/pages/customer/OrderDetail.jsx` | `/orders/:id` | Working | Detailed order tracking timeline, item allocation results, and customer cancellation modal. |
| 9 | `AdminDashboard` | `src/pages/admin/AdminDashboard.jsx` | `/admin` | Disconnected | Command center with stock vs demand charts; contains disconnected cards for Impact Analyzer and Reports. |
| 10 | `ProductManagement` | `src/pages/admin/ProductManagement.jsx` | `/admin/products` | **Stub Placeholder** | Only a 13-line static box with no table, form, or API connection. |
| 11 | `InventoryManagement` | `src/pages/admin/InventoryManagement.jsx` | `/admin/inventory` | Working | Real-time stock list, version-checked adjustment modal with ledger reasons, movement history. |
| 12 | `OrderManagement` | `src/pages/admin/OrderManagement.jsx` | `/admin/orders` | Working | Admin order table, filter by status, inspect line items modal, confirm/cancel transitions. |
| 13 | `AllocationCenter` | `src/pages/admin/AllocationCenter.jsx` | `/admin/allocation` | Working | Runs deterministic allocation engine, dry run preview, allocation result table with audit hash. |
| 14 | `AIRecommendations` | `src/pages/admin/AIRecommendations.jsx` | `/admin/ai` | Data Bug | Groq NLP priority recommendations with human review (approve/override/reject); affected by an API response property extraction bug. |
| 15 | `ImpactAnalyzer` | `src/pages/admin/ImpactAnalyzer.jsx` | `/admin/impact` | Working | Side-by-side run diffs, degradation analysis, and cause attribution badges. |
| 16 | `SimulationLab` | `src/pages/admin/SimulationLab.jsx` | `/admin/simulations` | **Stub Placeholder** | Only a 13-line static box; backend simulation engine has zero UI frontend integration. |
| 17 | `Alerts` | `src/pages/admin/Alerts.jsx` | `/admin/alerts` | Working | Proactive supply shortage scanner, severity filters, acknowledge/resolve workflows. |
| 18 | `Replenishment` | `src/pages/admin/Replenishment.jsx` | `/admin/replenishment` | Working | Velocity-based reorder point advisor, draft purchase order creation modal. |
| 19 | `Reports` | `src/pages/admin/Reports.jsx` | `/admin/reports` | Working | Fill-rate analytics, deferred order breakdowns, CSV export triggers. |
| 20 | `AuditViewer` | `src/pages/admin/AuditViewer.jsx` | `/admin/audit` | Working | Immutable security audit log viewer with actor and action filtering. |
| 21 | `NotFound` (404) | Missing | `*` | **Missing** | Catch-all route currently bounces directly to `/login`, causing blank or confused redirects. |

---

## 2. Existing Backend Endpoints

| Category | Method | Path | Auth / Role | Implementation Status |
|---|---|---|---|---|
| Health | GET | `/api/health` | Public | Healthy: returns uptime and database connectivity. |
| Auth | POST | `/api/auth/register` | Public | Enforces customer role and password criteria. |
| Auth | POST | `/api/auth/login` | Public | Issues JWT with role claims; rate-limited. |
| Auth | GET | `/api/auth/me` | JWT Required | Returns user profile. |
| Auth | POST | `/api/auth/refresh` | JWT Required | Token renewal. |
| Products | GET | `/api/products` | Public / Auth | List products with optional `active=true` filter. |
| Products | POST | `/api/products` | Admin | Create hardware item. |
| Products | GET | `/api/products/:id` | Public / Auth | Product details. |
| Products | PUT | `/api/products/:id` | Admin | Update item metadata. |
| Products | DELETE | `/api/products/:id` | Admin | Soft-delete item. |
| Inventory | GET | `/api/inventory` | Manager / Admin | Stock balances (on-hand, reserved, safety stock). |
| Inventory | GET | `/api/inventory/:productId` | Manager / Admin | Single SKU balance. |
| Inventory | PUT | `/api/inventory/:productId` | Manager / Admin | Optimistic concurrency stock adjustment with ledger log. |
| Inventory | GET | `/api/inventory/:productId/movements` | Manager / Admin | Historical ledger transactions. |
| Orders | POST | `/api/orders` | Customer | Multi-line order creation with Idempotency-Key support. |
| Orders | GET | `/api/orders` | Auth | Customer sees own; Admin/Manager sees all. |
| Orders | GET | `/api/orders/my` | Customer | Customer own orders. |
| Orders | GET | `/api/orders/stats/my` | Customer | Real status KPI counts for customer dashboard. |
| Orders | GET | `/api/orders/:id` | Auth | IDOR guarded: customer can only view own; admin can view all. |
| Orders | PATCH | `/api/orders/:id/confirm` | Manager / Admin | Confirms order for allocation queue. |
| Orders | PATCH | `/api/orders/:id/cancel` | Customer / Admin | Cancels order with reason. |
| Priorities | GET | `/api/priorities/:orderId` | Admin | View priority history. |
| Priorities | POST | `/api/priorities/approve` | Admin | Human review: approve, override, or reject recommendation. |
| AI | POST | `/api/ai/recommend/:orderId` | Admin | Groq Llama-3 NLP inference with rule-based fallback. |
| AI | GET | `/api/ai/recommendations` | Admin | List all AI priority suggestions. |
| Allocation | POST | `/api/allocation/run` | Admin | Core deterministic allocation engine with dry-run support. |
| Allocation | GET | `/api/allocation/runs` | Admin | History of completed allocation runs. |
| Allocation | GET | `/api/allocation/runs/:id` | Admin | Itemized outcomes and explanation strings for a run. |
| Impact | GET | `/api/impact/runs` | Admin | List completed runs for comparison. |
| Impact | GET | `/api/impact/compare` | Admin | Side-by-side run delta analysis. |
| Simulations | POST | `/api/simulations` | Admin | Zero-side-effect in-memory what-if simulation engine. |
| Simulations | GET | `/api/simulations` | Admin | List past simulations. |
| Simulations | GET | `/api/simulations/:id` | Admin | Detailed simulation results. |
| Simulations | POST | `/api/simulations/compare` | Admin | Side-by-side comparison of multiple scenarios. |
| Alerts | GET | `/api/alerts` | Manager / Admin | Query supply alerts by severity and status. |
| Alerts | POST | `/api/alerts/scan` | Manager / Admin | Proactive shortage detection engine. |
| Alerts | PATCH | `/api/alerts/:id/acknowledge` | Manager / Admin | Acknowledge alert. |
| Alerts | PATCH | `/api/alerts/:id/resolve` | Manager / Admin | Resolve alert. |
| Replenishment | GET | `/api/replenishment` | Manager / Admin | Algorithmic reorder recommendations. |
| Replenishment | GET | `/api/replenishment/suppliers` | Manager / Admin | List suppliers with lead times. |
| Replenishment | GET | `/api/replenishment/pos` | Manager / Admin | List purchase orders. |
| Replenishment | POST | `/api/replenishment/pos` | Manager / Admin | Generate draft purchase orders. |
| Events | GET | `/api/events` | Auth | Server-Sent Events (SSE) live push stream. |
| Events | GET | `/api/events/notifications` | Auth | In-app notification inbox. |
| Events | PATCH | `/api/events/notifications/read` | Auth | Mark notifications as read. |
| Reports | GET | `/api/reports/summary` | Manager / Admin | Executive KPI analytics and deferred order breakdown. |
| Reports | GET | `/api/reports/export/:type` | Manager / Admin | CSV exports (orders, inventory, runs). |
| Audit | GET | `/api/audit` | Admin | Security audit trail logs. |

---

## 3. Broken Navigation Links

1. **`AdminDashboard.jsx` Impact Analyzer Card:** Rendered as a disabled `<div>` with `"Coming Soon"` text instead of a functional `<Link to="/admin/impact">`.
2. **`AdminDashboard.jsx` Executive Reports Card:** Rendered as a disabled `<div>` with `"Coming Soon"` text instead of a functional `<Link to="/admin/reports">`.
3. **`AdminLayout.jsx` Header Navigation:** Only the first 5 nav items were mapped on desktop (`navItems.slice(0, 5)`), while Allocation Center, Orders, Inventory, Simulations, and Reports were displaced to the subnav.
4. **`AdminLayout.jsx` Audit Viewer:** Missing from `navItems` array, making `/admin/audit` inaccessible via layout navigation.
5. **`AdminLayout.jsx` and `CustomerLayout.jsx` Notification Bell:** `NotificationBell` component with SSE live event stream was never placed in the headers.

---

## 4. Missing Routes

1. **404 Not Found Page:** No 404 route component existed. In `App.jsx`, `<Route path="*" element={<Navigate to="/login" replace />} />` redirected all nonexistent routes to `/login`, causing authenticated users navigating to typos or nested routes to be booted out.
2. **Root `/` Navigation:** Root path unconditionally redirected to `/login` regardless of active session.
3. **Product Management Route:** `/admin/products` renders a 13-line placeholder.
4. **Simulation Lab Route:** `/admin/simulations` renders a 13-line placeholder.

---

## 5. Buttons Without Working Actions

1. **`AdminDashboard.jsx` Modules:** Impact Analyzer and Executive Reports cards were static non-clickable containers.
2. **`ProductManagement.jsx`:** No create button, no edit modal, no search or filtering.
3. **`SimulationLab.jsx`:** No scenario selection buttons, no simulation submission, no comparison triggers.

---

## 6. API Endpoints That Fail or Have Contract Mismatches

1. **`AIRecommendations.jsx` Response Parsing:**
   - In `AIRecommendations.jsx` line 62: `setOrders(res.data?.orders || [])`.
   - The API response format returned by `GET /api/orders` is `{ success: true, orders: rows, data: rows }`.
   - The axios response interceptor returns `response.data`. Thus, `res` is already the payload object, and `res.data` is an Array (`rows`).
   - `res.data?.orders` evaluated to `undefined`, leaving `orders` empty in the UI.
2. **Missing `ai_recommendations` rows for approval:**
   - `POST /api/priorities/approve` with `{ recommendation_id: 1 }` returned 404 when `ai_recommendations` had no record with ID 1.
3. **Simulation route parameter handling:**
   - `GET /api/simulations/:id` threw 500 when called with invalid non-numeric ID strings.

---

## 7. Authentication & Authorization Issues

1. **Unauthorized event handling:** When an unauthenticated or expired token triggers a 401, `apiClient` dispatches `orderwise:unauthorized`, but the global auth context needs clean state invalidation.
2. **Role protection integrity:** Verified: `ProtectedRoute` and `rbac` middleware strictly check roles; customer users cannot access admin endpoints.

---

## 8. Database Connection & Query Issues

1. **Migration Sequence Deadlock in `backend/src/db/migrations`:**
   - Database table `pgmigrations` recorded migrations up to `008_create_alerts`.
   - Two migrations were created with duplicate/out-of-order prefixes:
     - `005_add_prompt_version_to_ai_recommendations.js` (prefix 005)
     - `006_create_alerts_and_supply_enhancements.js` (prefix 006)
   - When running `npx node-pg-migrate up`, `node-pg-migrate` failed with:
     `Error: Not run migration 005_add_prompt_version_to_ai_recommendations is preceding already run migration 006_add_allocation_hash`.
   - This blocked execution of all pending migrations, including `009_create_notifications.js`.
2. **Missing Columns on Live PostgreSQL Tables:**
   - `products` table was missing `default_supplier_id` and `default_lead_time_days` (causing `npm run seed` and `tests/database.test.js` to fail with `column "default_supplier_id" does not exist`).
   - `alerts` table was missing `condition_key`, `status`, `recommended_action`, `acknowledged_at`, `acknowledged_by`, `purchase_order_id`, `updated_at`.
   - `ai_recommendations` table was missing `prompt_version`.
   - `purchase_orders` table was missing `notes`.
   - `notifications` table did not exist.

---

## 9. Pages That Use Mock Data Instead of Real API Data

1. **`ProductManagement.jsx`:** Static placeholder. Needs real CRUD connection to `/api/products`.
2. **`SimulationLab.jsx`:** Static placeholder. Needs real connection to `/api/simulations`.
3. **Backend `demoStore` Fallbacks:** Present in order and product routes as fallback if SQL fails. While safe as a circuit-breaker, underlying SQL queries must be primary.

---

## 10. Prioritized List of Fixes

### Priority 1: Database Migration Numbering & Schema Synchronization
- Renumber migrations to sequential order:
  - `009_create_notifications.js`
  - `010_add_prompt_version_to_ai_recommendations.js`
  - `011_create_alerts_and_supply_enhancements.js`
- Ensure migration 011 applies safe, idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for all missing columns on `products`, `alerts`, and `purchase_orders`.
- Run migrations to synchronize Neon PostgreSQL.
- Execute `npm run seed` to ensure demo dataset and supply alerts load cleanly.

### Priority 2: Frontend Routing & 404 Experience
- Create dedicated `NotFound.jsx` (404 Page) matching the OrderWise design system.
- Update `App.jsx` to render `NotFound` for `*` rather than unconditionally redirecting to `/login`.
- Update root `/` path to smartly navigate authenticated users to their dashboard.

### Priority 3: Connect Navigation & Layouts
- Fix `AdminDashboard.jsx`: turn Impact Analyzer and Reports cards into active links and update "Coming Soon" badges to "Active Hub".
- Add "Audit Trail" and "Product Catalog" to `AdminLayout.jsx` navigation.
- Embed `NotificationBell` in both `AdminLayout.jsx` and `CustomerLayout.jsx`.

### Priority 4: Implement Full Product Management Page
- Replace `ProductManagement.jsx` placeholder with a full-featured admin management interface:
  - Product catalog table with SKU, unit, stock, status, supplier.
  - "Create Product" modal with SKU, name, unit, supplier, lead time.
  - "Edit Product" modal.
  - Soft-delete toggle.
  - Connected directly to `/api/products`.

### Priority 5: Implement Full Simulation Lab Page
- Replace `SimulationLab.jsx` placeholder with a full what-if scenario testing interface:
  - Scenario selection: Inventory Increase, Inventory Decrease, Demand Surge, Supplier Delay, Priority Change.
  - Scenario parameter inputs (SKU, quantity, percentage, delay days, target order, hypothetical priority).
  - "Run Simulation" execution with zero live data modification guarantee.
  - Before vs After comparison diff table with newly fulfilled and still deferred badges.
  - Past simulation history and side-by-side comparison modal.
  - Connected directly to `/api/simulations`.

### Priority 6: Reconcile AI Recommendations Data Contract
- Fix `AIRecommendations.jsx` to parse `res.orders || res.data || []` properly.
- Verify human approval flow (Approve, Override, Reject) updates `order_priorities` and broadcasts real-time SSE event.

### Priority 7: End-to-End Verification & Automated Testing
- Run all backend Vitest suites.
- Run all frontend Vitest suites.
- Run production build (`npm run build`).
- Verify complete user workflows.
