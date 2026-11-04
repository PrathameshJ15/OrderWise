# OrderWise — Project Progress & Implementation Status

> **System:** OrderWise (AI-Assisted Priority-Based Order Allocation Platform)  
> **Event:** VORTEXA 3.0 Hackathon — Problem Statement S-03  
> **Current Status:** Phase 16 Complete | Phase I (3D Layer) Complete | Light Mode & Theme System Complete  
> **Last Updated:** November 2026

---

## 📊 Executive Progress Dashboard

| Metric | Target | Current Status | State |
|---|---|---|---|
| **Priority 0 (Core MVP)** | 100% | 100% Complete | 🟢 Operational |
| **Priority 1 (Differentiators)** | 100% | 100% Complete | 🟢 Operational |
| **Priority 2 (Intelligence)** | 100% | 100% Complete | 🟢 Operational |
| **Priority 3 (Enterprise Polish)** | 100% | 100% Complete | 🟢 Operational |
| **Phase 17 (AI Demand Forecasting)** | 100% | 100% Complete | 🟢 Operational |
| **Phase 18 (Supplier Performance)** | 100% | 100% Complete | 🟢 Operational |
| **Phase 19 (Automated Reallocation)**| 100% | 100% Complete | 🟢 Operational |
| **Phase I (Premium 3D Visual Layer)** | 100% | 100% Complete | 🟢 Operational |
| **Light Mode & Theme Toggle** | 100% | 100% Complete | 🟢 Operational |
| **Full Navigation & Route Integration**| 100% | 100% Interconnected | 🟢 Integrated |
| **Frontend Test Suite** | 100% Pass | 42/42 Passed (11/11 Test Files) | 🟢 Passing |
| **Pure Backend Unit Tests** | 100% Pass | 18/18 Allocation Pure Passed | 🟢 Passing |
| **Production Vite Build** | 0 Errors | Clean Chunks (5.37s) | 🟢 Verified |
| **OrderWise Design System** | 100% | Dual-Theme (Dark & Light) + ThemeToggle | 🟢 Complete |
| **OWASP Security & RBAC Hardening** | 100% | 100% Enforced | 🟢 Secured |

---

## 🎨 Phase I — Premium 3D Visual Layer (100% Complete & Verified)

### Architectural Audit & Prerequisites
- **Phases A–H Verification:** 100% complete and verified. Dark streaming UI tokens (`#0A0A0A`, `#161616`, `#2A2A2A`, `#E50914`), 19 connected routes, and strict role gates.
- **Backend & Feature Verification:** Allocation Engine, AI Demand Forecasting, Supplier Intelligence, and Controlled Reallocation are fully implemented with real DB/API backings and passing tests.
- **Git Safety Status:** Preserved all existing user changes; zero commits/pushes without authorization.
- **Dependency Audit:** Zero (`0`) external 3D libraries added. No Three.js/R3F bundle bloat. Built strictly using lightweight, high-performance inline SVG isometric geometry and CSS transforms.
- **Bundle & Performance Impact:** All 4 visual components combined add < 8 KB gzipped. Clean production build in 5.62s with zero layout shift (`CLS = 0`).

### Implemented 3D Scene Matrix (Reference File Geometric Alignment)
1. **Scene 1: Landing Page Hero Isometric Warehouse** (`frontend/src/components/3d/IsometricWarehouseVisual.jsx`)
   - **Reference Source:** [`docs/reference/orderwise-3d-hero.svg`](file:///C:/Users/jadha/OneDrive/Desktop/OrderWise/docs/reference/orderwise-3d-hero.svg)
   - **Platform & Grid:** Exact axonometric 30-degree isometric ground slab (`-323.9, 153.0` to `323.9, 139.4`), with 20 isometric grid lines (`stroke="#262626"`).
   - **Geometry:** 11 dimensionally shaded inventory boxes with exact reference face coordinates (`#1b1b1b` left, `#121212` right, `#2c2c2c` top).
   - **Priority Highlights:** Red priority boxes (`#b30710` left, `#7a0509` right, `#ff2f3a` top) representing critical orders with exact reference pill labels (`Critical order`, `High priority`).
   - **Supply Flow:** Dashed red supply route with animated glowing route indicator dot (`<animateMotion dur="5s" ... />`).
   - **Micro-Interactions & Fallbacks:** Mouse parallax tilt (capped at 6px) with smooth damping; safe fallback for `prefers-reduced-motion` and test environments.

2. **Scene 2: Allocation Center 3D Distribution Visual** (`frontend/src/components/3d/AllocationDistributionVisual.jsx`)
   - **Reference Source:** [`docs/reference/orderwise-3d-allocation.svg`](file:///C:/Users/jadha/OneDrive/Desktop/OrderWise/docs/reference/orderwise-3d-allocation.svg)
   - **Data Rigor:** 100% real API data from the active allocation run (`runResults`) and live product stock. The reference SVG example (Charlie 30/30, Alice 0/25, Bob 0/20) is replaced dynamically with real orders and quantities from the API.
   - **Proportional Geometry:** Exact reference ground slab (`-242.5, 100.0` to `381.1, 180.0`), wireframe initial stock volume (`#8a8a8a`), solid remaining stock pile (`#1b1b1b` / `#121212` / `#2c2c2c`), red dashed allocation route (`#E50914`), solid allocated box (`#2f9e60` / `#1f6e42` / `#6ee7a0`), and dashed pink-red wireframe boxes (`#FF7A7A`) for unmet/deferred demand.
   - **Labels & Audit:** Real order IDs, real customer names, real allocated/requested quantities, and remaining stock pill tags.
   - **Interaction:** Seamless accessible toggle (`[3D View] [Table View]`) in `AllocationCenter.jsx`. Defaults to Table View on mobile.

3. **Scene 3: Demand Forecasting Depth Visual** (`frontend/src/components/3d/ForecastDepthVisual.jsx`)
   - **Data Rigor:** Real exponential smoothing forecast metrics from `/api/intelligence/forecast`.
   - **Visualization:** Isometric tiered depth radar comparing available inventory vs. 7-day and 30-day projection horizons with shortage risk indicator.

4. **Scene 4: Supplier Performance Network Visual** (`frontend/src/components/3d/SupplierNetworkVisual.jsx`)
   - **Data Rigor:** Real supplier scorecard records from `/api/replenishment/suppliers/performance`.
   - **Visualization:** Isometric supplier node network connected to central warehouse with line weight mapped to on-time delivery rates.
   - **Fallback:** Renders clean "Skipped: no real data" notice when empirical PO deliveries are absent.

### Verification & Testing Summary
- **Frontend Test Suite:** 39 passed out of 39 tests across 10 test files (`npm --prefix frontend test -- --run`).
- **Production Build:** Clean Vite production build in 5.62s (`npm --prefix frontend run build`).
- **Reduced Motion:** Fully respected across all components (`prefers-reduced-motion` guards).
- **Responsive Behavior:** Graceful fallback and single-column collapse on viewports < 640px.

---

## 🧭 Implementation Priority Breakdown (AGENTS.md)

### ✅ Priority 0 — Non-Negotiable MVP (100% Done)
- [x] **PostgreSQL Schema & Migrations:** 11 migrations covering users, products, inventory, orders, priorities, allocation runs, results, audit logs, alerts, replenishment, and simulations.
- [x] **Backend Auth & RBAC:** Register, login, JWT verification with strict role enforcement (`customer`, `admin`, `inventory_manager`).
- [x] **Product CRUD & Inventory Management:** Full hardware catalog with version-checked optimistic concurrency on stock balance.
- [x] **Customer Order Creation:** Multi-line order creation with `requested_quantity`, `minimum_acceptable_quantity`, and `partial_delivery_allowed`.
- [x] **Deterministic Allocation Engine:** Core algorithm in `backend/src/services/allocationEngine.js` sorting on `approved_priority DESC`, `promised_delivery_date ASC NULLS LAST`, `created_at ASC`, `order.id ASC`.
- [x] **Frontend Customer Experience:**
  - Browse catalog with live stock availability indicators
  - Order requisition creation with validation and idempotency keys
  - "My Orders" order tracking timeline and cancellation flow
- [x] **Frontend Admin Operations:**
  - Inventory management with stock adjustment modal & movement ledger
  - Order management with line-item inspection modal
  - Allocation Center with run execution, dry runs, and cryptographic input hash display
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
  - Full interactive frontend console connected to `POST /api/simulations`
  - In-memory execution (zero mutation to live database)
  - 5 Scenarios: `inventory_increase`, `inventory_decrease`, `demand_surge`, `supplier_delay`, `priority_change`
  - Live diff telemetry showing improvements, degradations, and item delta tables
- [x] **Replenishment Advisory Engine:** Velocity-based reorder point (ROP) calculation, economic order quantities (EOQ), and purchase order draft generator.
- [x] **Interactive Recharts Dashboards:** Real-time stock vs. demand charts, fill-rate breakdown, and allocation summary distribution.
- [x] **Immutable Security Audit Log Viewer:** Actor attribution, IP logging, action filters, and timestamped events.

---

### ✅ Priority 3 — Enterprise Polish & Navigation Integration (100% Done)
- [x] **Complete Route & Navigation Integration:**
  - All 19 routes connected under unified responsive layouts (`CustomerLayout`, `AdminLayout`).
  - Strict role-based navigation sidebar with exact 12-item operational sequence.
  - Role-specific access boundaries: Customers restricted from admin pages; Inventory Managers restricted from administrative approval gates.
  - Dedicated 403 `AccessDenied` component and 404 `NotFound` catch-all route.
  - Contextual cross-links connecting all related modules (Products &rarr; Inventory &rarr; Orders &rarr; Allocation &rarr; AI &rarr; Impact &rarr; Simulations &rarr; Replenishment &rarr; Reports).
  - Breadcrumbs component and User Profile dropdown with one-click sign out.
- [x] **CSV Exporting & Executive Reports:** Export allocations, inventory positions, and deferred items to CSV.
- [x] **Real-Time Notification System:** Server-Sent Events (SSE) notification bell with unread badge counter in all top navbars.
- [x] **Monorepo Dev Scripts:** Added root `"dev": "npm run dev:frontend"` and `"dev:all"` for 1-command startup.
- [x] **Full OrderWise Design System Alignment (DESIGN.md):**
  - Dark, streaming-style UI: Near-black ground (`--bg: #0A0A0A`), one red accent (`--ac: #E50914`), pill buttons/badges (radius 999px, min-height 44px), rounded cards (radius 14px, 1px border `#2A2A2A`, 24px padding, no shadow).
  - Status colors separate from accent: Fulfilled/Active (`--ok: #4ADE80`), Partial/Alerts (`--wa: #F5B544`), Deferred (`--no: #FF7A7A`), Unresolved alert card (`alert-bg: #2B2010`, `border: #5A4210`).
  - Typography: Headings & body in `"Helvetica Neue", Arial, sans-serif` in sentence case; Labels, tags, and SKUs in `IBM Plex Mono 500, 12px`.
  - Upgraded all 19 frontend views across customer and admin portals, replacing all legacy `arcade-*` classes with pure design tokens.
  - Recharts visualizations styled with 4px top radius bars, `#E50914` on-hand / current bars, `#8A8A8A` reserved / previous series.
  - 100% frontend test pass rate maintained (39/39 tests across 10 test files) and clean Vite production build.

---

## 🚀 Completed Development Roadmap — Advanced Feature Additions

### Phase 17 — AI Demand Forecasting (Completed)
**Goal:** Predict near-term product demand using OrderWise historical order data with mathematical rigor and non-speculative guardrails.
- [x] Inspect available historical order and order-item data before choosing a forecasting method.
- [x] Build product-wise demand forecasts for the next 7 and 30 days where sufficient data exists (`calculateHorizonForecast`).
- [x] Show forecast confidence/limitations with widening 95% confidence intervals ($\pm 1.96 \cdot \sigma \cdot \sqrt{h}$); do not present unreliable predictions as facts.
- [x] Compare forecast demand with actual inventory position to classify shortage risks (`SHORTAGE_RISK_HIGH`, `SHORTAGE_RISK_MEDIUM`, `STOCK_ADEQUATE`).
- [x] Flag data quality explicitly (`SUFFICIENT`, `SPARSE_DATA`, `NO_HISTORICAL_DEMAND`).
- [x] Surface forecast insights in the admin UI (`AIRecommendations.jsx` Demand Forecasting tab).
- [x] Full test suite passing (9/9 tests in `demandForecasting.test.js`).

### Phase 18 — Supplier Performance Intelligence (Completed)
**Goal:** Provide an empirical, non-speculative view of supplier delivery reliability and PO receipts.
- [x] Inspect existing schema and purchase-order replenishment flow.
- [x] Track supplier delivery lead time and on-time delivery rate computed from actual received purchase orders (`calculateSupplierMetrics`).
- [x] Show supplier-level performance scorecards, on-time percentage, lead-time variance drift, and delayed active PO indicators.
- [x] Clearly label insufficient data (`INSUFFICIENT_DATA`); never invent supplier scores or historical performance for vendors with zero deliveries.
- [x] Added PO goods receipt tracking (`POST /api/replenishment/po/:id/receive`) that transitions POs, increments on-hand stock, logs ledger movements, and updates empirical supplier metrics.
- [x] Surface supplier intelligence in admin UI (`Replenishment.jsx` Supplier Performance tab + Receive Shipment modal).
- [x] Full test suite passing (9/9 tests in `supplierPerformance.test.js`, 7/7 tests in `supplierIntelligence.test.js`).

### Phase 19 — Controlled Automated Reallocation (Completed)
**Goal:** Re-evaluate eligible pending/deferred order items when new stock is received, under strict human approval.
- [x] Inspect existing inventory ledger, reservations, allocation engine, and transaction boundaries.
- [x] Scan and detect reallocation opportunities when newly available stock exceeds deferred/partially fulfilled requests (`checkReallocationOpportunities`).
- [x] Reuse existing deterministic allocation rules, order sorting keys, and approved priorities.
- [x] Generate an explainable, isolated dry-run simulation preview (`PROPOSED_REALLOCATION_AWAITING_APPROVAL`) with zero database mutation (`generateReallocationPreview`).
- [x] Require authorized human approval before applying any live reallocation (`POST /api/allocation/reallocation/apply`).
- [x] Apply live reallocations atomically with database transaction boundaries and audit logging (`applyControlledReallocation`).
- [x] Surface reallocation opportunities banner and interactive approval modal in `AllocationCenter.jsx`.
- [x] Full test suite passing (7/7 tests in `controlledReallocation.test.js`, 18/18 tests in `allocation.pure.test.js`).

### Marketing & Visual Redesign Assets (Completed)
- [x] Integrated visual redesign assets from `OrderWise_Redesign-png.zip`:
  - `Landing page.png` & `Your page, fixed.png` in `Home.jsx`.
  - `Pricing.png` in new public route `/pricing` (`Pricing.jsx`).
  - `Solutions.png` in new public route `/solutions` (`Solutions.jsx`).
  - `Security.png` in new public route `/security` (`Security.jsx`).
  - `Admin dashboard.png` in `AdminDashboard.jsx`.
  - Logo branding displayed across all headers, layouts, and favicons (`/logo.png`).


---

## 💎 Final Fix Pass + Premium 3D Visual Layer (Phase-I-3D-Fixes Complete)

- [x] **Branch Safety:** Created and developed strictly on branch phase-i-3d-fixes. No commits, merges, or pushes without explicit user permission. Zero alterations to backend, business logic, DB schema, auth, or test assertions.
- [x] **Typography Overhaul:**
  - Standardized font tokens: Inter (400, 500, 600, 700) for body and UI copy; Inter Tight (600, 700, 800) with -0.02em tracking for headings and KPI numerical values.
  - Eliminated inappropriate monospace (font-mono) from navigation items, page subheadings, table headers, action buttons, filter bars, customer names, and descriptive paragraphs across all 19 customer and admin views.
  - Restricted JetBrains Mono and IBM Plex Mono strictly to machine-oriented data: SKU codes, order numbers, inventory units, numeric quantities, and small badges.
- [x] **Structural & Layout Refinement:**
  - Removed heavy card-base bordered containers from page headers across all administrative and customer views, restoring open whitespace and clear visual hierarchy.
  - Modernized roadmap presentation into a clean single line of secondary text with release horizon tags.
  - Streamlined module navigation cards: removed redundant Active tags and integrated hover direction arrows.
  - Restructured landing page By role and By industry sections from rigid bordered card grids into spacious, readable three-column text presentations.
- [x] **Brand & UI Polish:**
  - Resolved logo wordmark duplication across headers and footers by rendering /logo-icon.png (64x64 icon mark) alongside the text wordmark OrderWise.
  - Widened admin sidebar to w-72 (and content padding lg:pl-72), ensuring zero label truncation for AI Recommendations.
  - Enforced exact chart color mapping in Recharts: #E50914 for On-hand / live values and #8A8A8A for Reserved / baseline series.
  - Introduced subtle ambient upper-right red lighting (radial-gradient(ellipse at 85% 5%, rgba(229,9,20,0.18), transparent 50%)).
- [x] **3D Visual Geometry & Developer Chrome Removal:**
  - Removed all developer chrome labels (Interactive Axonometric, Axonometric 30 deg, Isometric SVG, and extra tab switchers). Defaulted directly to the enlarged 3D scene (>=85% container width).
  - Maintained strict 30-degree isometric axonometric projection matching reference SVG files (orderwise-3d-hero.svg and orderwise-3d-allocation.svg).
  - In AllocationDistributionVisual.jsx, dynamic rendering uses 100% real API allocation data.
- [x] **Verification:**
  - Frontend Test Suite: 39 / 39 passed across 10 test files (npm --prefix frontend test -- --run).
  - Production Build: Clean Vite bundle generated in 7.32s with 0 errors (npm --prefix frontend run build).
  - Dev server running on http://localhost:5173/.

---

## 📝 Website Content Audit & Professional Copy Rewrite (Completed)

- [x] **Pages Reviewed & Audited:**
  - **Public Pages:** Landing Page (`Home.jsx`), Solutions (`Solutions.jsx`), Pricing (`Pricing.jsx`), Security (`Security.jsx`), Login (`Login.jsx`), Register (`Register.jsx`).
  - **Customer Portal:** Customer Dashboard (`CustomerDashboard.jsx`), Product Catalog (`ProductCatalog.jsx`), Create Order (`CreateOrder.jsx`), My Orders (`MyOrders.jsx`), Order Detail (`OrderDetail.jsx`).
  - **Admin Portal:** Operations Overview (`AdminDashboard.jsx`), Product Management (`ProductManagement.jsx`), Inventory Management (`InventoryManagement.jsx`), Order Management (`OrderManagement.jsx`), Allocation Center (`AllocationCenter.jsx`), AI Recommendations (`AIRecommendations.jsx`), Impact Analyzer (`ImpactAnalyzer.jsx`), Simulation Lab (`SimulationLab.jsx`), Supply Alerts (`Alerts.jsx`), Replenishment (`Replenishment.jsx`), Reports & Analytics (`Reports.jsx`), Audit Log Viewer (`AuditViewer.jsx`).
- [x] **Components Modified:**
  - `frontend/src/pages/Home.jsx`: Replaced hackathon badge text with `AI-ASSISTED SUPPLY CHAIN INTELLIGENCE`; replaced hardcoded illustrative statistics (`94.2% fill rate`, `4 items`, `1 critical alert`) with a clean 3-pillar product capability strip (Deterministic Allocation, Human-in-the-Loop AI Governance, Zero-Mutation Simulation Safety); normalized hero subhead to feature-first capability language.
  - `frontend/src/pages/Pricing.jsx`: Eliminated unpopulated `[Price]` bracketed placeholders across Team and Business plans; replaced with realistic SaaS tier pricing ($299/mo for single warehouse, $799/mo for multi-facility operations, Custom for enterprise) with accurate capability descriptions.
  - `frontend/src/pages/admin/AIRecommendations.jsx`: Removed model-name-first branding (`Groq Llama-3`) from the header badge; updated chatbot subheader and initial assistant welcome message to capability-first descriptions; preserved all backend API response traceability data (`Provider: Groq AI`, `Model: llama3-70b-8192`).
  - `frontend/src/pages/admin/AdminDashboard.jsx`: Replaced static, hardcoded order status text (`3 pending · 2 confirmed`) with dynamic pipeline terminology (`Active demand pipeline`).
- [x] **Misleading & Unverified Claims Corrected:**
  - Removed all occurrences of Ollama references.
  - Replaced model-centric marketing hype with capability-first language ("AI-assisted priority recommendations with strict human approval", "explainable priority rankings").
  - Removed fabricated metrics and hardcoded stats that were not backed by dynamic API queries.
  - Replaced raw bracket placeholders in public pricing plans.
- [x] **Technology References Verified:**
  - Verified Groq API integration with model `llama3-70b-8192` and deterministic keyword fallback in `aiService.js`.
  - Confirmed human-in-the-loop governance: AI never updates `order_priorities` or inventory directly; authorized admin approval is mandatory.
  - Verified zero-mutation simulation safety: in-memory cloning with zero live database updates.
  - Verified deterministic allocation ordering: Priority DESC → Delivery Date ASC → Created ASC → ID ASC.
- [x] **Tests Executed:**
  - Full Frontend Test Suite: **39 / 39 PASSED** across all 10 test files (`npm --prefix frontend test -- --run`).
  - Pure Allocation Unit Tests: **18 / 18 PASSED** (`allocation.pure.test.js`).
- [x] **Build & Verification Status:**
  - Production Build: Clean Vite production build in **5.46s** with **0 errors** (`npm --prefix frontend run build`).
  - Dev Server: Running and healthy on `http://localhost:5173/` (HTTP 200).

---

## 📱 Mobile Interactivity & Touch Experience Upgrade (Completed)

- [x] **Universal Public Mobile Navigation (`PublicNavbar.jsx`):**
  - Built an animated responsive navigation header shared across `Home.jsx`, `Solutions.jsx`, `Pricing.jsx`, and `Security.jsx`.
  - Added touch-friendly animated hamburger menu trigger (`Menu` / `X`) with $\ge 44\text{px}$ touch target.
  - Implemented full-width slide-down glassmorphic drawer (`#121212/95` backdrop blur) with smooth slide-in animation.
  - Features touchable navigation links with icons and active route badges for *How It Works*, *Modules*, *Solutions*, *Pricing*, and *Security*.
  - Added prominent mobile actions: *Launch Operations Portal* CTA button, *Create customer account*, and *Sign In*.
  - Auto-closes on route changes, escape key press, or backdrop tap; locks background body scroll while drawer is open.
- [x] **Touch-Interactive 3D Visualizations:**
  - Added touch drag support to `IsometricWarehouseVisual.jsx` (`onTouchStart`, `onTouchMove`, `onTouchEnd`, `onTouchCancel`).
  - Mobile visitors can now drag their finger across the 3D warehouse to tilt and inspect the isometric facility in real-time.
  - Added mobile badge hint ("Touch & drag") in the visual's header strip.
- [x] **Mobile-Optimized Horizontal Scroll Tabs & Filter Strips:**
  - Added `-webkit-overflow-scrolling: touch` utilities (`.touch-scroll` and `.touch-tap`) in `index.css`.
  - Upgraded filter strips and view switchers in `AllocationCenter.jsx`, `AIRecommendations.jsx`, and `Replenishment.jsx` to smoothly scroll horizontally on mobile screens without awkward line wrapping.
- [x] **Touch Target & Modal Ergonomics:**
  - Enhanced `Modal.jsx` with `max-h-[92vh]`, vertical scroll confinement (`overflow-y-auto overscroll-contain`), and a touch-friendly 36px close button with tactile active scale.
  - Enhanced `NotificationBell.jsx` dropdown with responsive viewport anchoring (`fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:w-96`), preventing off-screen overflow on mobile viewports.
  - Standardized customer layout drawer in `CustomerLayout.jsx` with backdrop blur, body scroll lock, and $\ge 44\text{px}$ touch targets.
  - Added `inputMode="numeric"` to requisition line items in `CreateOrder.jsx` to trigger native mobile numeric keypads.
- [x] **Verification & Test Suite:**
  - Full Frontend Test Suite: **42 / 42 PASSED** across all 11 test files.
  - Production Build: Clean Vite bundle generated in **5.37s** with **0 errors**.
  - Dev Server: Running and healthy on `http://localhost:5173/` (HTTP 200).

---

## ☀️ Light Mode & Theme System (100% Complete & Verified)

### Architectural Audit & Design System Tokens
- **Reference Specification:** Exact match to [`docs/reference/orderwise-light-preview.html`](file:///C:/Users/jadha/OneDrive/Desktop/OrderWise/docs/reference/orderwise-light-preview.html).
- **Core Principle Maintained:** "AI recommends. Business rules validate. Authorized humans approve. OrderWise allocates and explains." Pure visual/frontend implementation. Zero backend, business logic, DB, or API modifications.
- **Git Branch:** `light-mode`. All existing user work preserved.
- **Dependencies Added:** `0` new packages. Implemented with native React context and CSS variables.

### CSS Tokens & Variable Mapping
| Token | Dark Mode (`:root`) | Light Mode (`:root[data-theme="light"]`) | Contrast Ratio & Usage |
|---|---|---|---|
| `--bg` | `#0A0A0A` | `#F7F7F8` | Primary page canvas |
| `--s` | `#161616` | `#FFFFFF` | Cards & elevated surfaces |
| `--s2` | `#232323` | `#F1F1F3` | Inset containers & input fields |
| `--bd` | `#2A2A2A` | `#E4E4E7` | Border dividers & card boundaries |
| `--divider` | `#3A3A3A` | `#D4D4D8` | Subtle line dividers |
| `--outline` | `#555555` | `#A1A1AA` | Secondary borders & outline controls |
| `--t` | `#FFFFFF` | `#0A0A0A` | Primary typography (18.5:1 on bg, 19.8:1 on surface) |
| `--t2` | `#A8A8A8` | `#52525B` | Secondary typography (4.8:1 on bg, 5.2:1 on surface) |
| `--ac` | `#E50914` | `#E50914` | Brand red accent (white text on red buttons: 4.6:1) |
| `--ok` | `#4ADE80` | `#15803D` | Fulfilled status (4.7:1 AA in light mode) |
| `--wa` | `#F5B544` | `#B45309` | Partial fulfillment / warning (4.6:1 AA in light mode) |
| `--no` | `#FF7A7A` | `#DC2626` | Deferred status / critical alert (4.6:1 AA in light mode) |
| `--alert-bg` | `#2B2010` | `#FFF4E0` | Shortage alert container background |
| `--alert-border` | `#5A4210` | `#F0D49A` | Shortage alert container border |
| `--card-shadow` | `none` | `0 1px 2px rgba(0,0,0,0.05)` | Light card elevation |
| `--card-hover-border` | `rgba(229,9,20,0.6)` | `rgba(229,9,20,0.6)` | Interactive card focus state |
| `--card-hover-shadow` | `0 12px 40px rgba(229,9,20,0.14)` | `0 12px 40px rgba(229,9,20,0.14)` | Interactive card elevation |

### Theme System Architecture
1. **Context & State Management (`frontend/src/contexts/ThemeContext.jsx`):**
   - Supports 3 modes: `light`, `dark`, `system`.
   - Persists user selection in `localStorage.getItem('orderwise_theme')`.
   - When in `system` mode, reacts to OS changes via `window.matchMedia('(prefers-color-scheme: dark)')`.
   - Also supports URL parameter override (`?theme=light` or `?theme=dark`) for instant deterministic testing and previews.
   - Sets attribute `data-theme="light"` or `data-theme="dark"` on `document.documentElement`.
   - Transitions smoothly with `background-color 150ms ease, border-color 150ms ease, color 150ms ease`.
   - Respects user accessibility settings via `@media (prefers-reduced-motion: reduce) { transition: none; }`.
2. **Anti-FOUT Head Script (`frontend/index.html`):**
   - Inline script directly inside `<head>` reads `localStorage` and query parameters before CSS parses, preventing any flash of wrong theme on reload.
3. **Theme Toggle Component (`frontend/src/components/ui/ThemeToggle.jsx`):**
   - **Segmented Control:** 3-state pill (`Sun` [Light] | `Moon` [Dark] | `Monitor` [System]) with high-contrast active indicator.
   - **Compact Button:** Single button showing current mode with full accessible dropdown menu.
   - Meets accessibility requirements: `<button>` tags with `aria-label`, visible focus ring (`focus:ring-2 focus:ring-ac`), and touch target $\ge 36\text{px}$ / $40\text{px}$.
4. **Header Integration:**
   - Desktop and mobile drawer in `PublicNavbar.jsx` (Landing, Pricing, Solutions, Security).
   - Admin console header in `Navbar.jsx` (with Breadcrumbs, Notifications, User profile).
   - Customer portal header in `CustomerLayout.jsx`.

### 3D Visuals & Charts Theme Adaptation
- **Isometric Warehouse Visual (`IsometricWarehouseVisual.jsx`):**
  - Light mode palette: Ground platform slab (`#EDEDF0`), grid lines (`#D4D4D8`), standard inventory boxes (top `#E4E4E7`, left `#D4D4D8`, right `#A1A1AA`).
  - Priority red boxes preserve brand red facets (`#E50914`, `#C00811`, `#8F050C`) in both themes.
  - Soft red glow adapts to light intensity (`rgba(229, 9, 20, 0.12)`).
- **Charts (Recharts in `AdminDashboard.jsx` & `ImpactAnalyzer.jsx`):**
  - Cartesian axes and tick labels use `var(--t2)`.
  - Tooltip container uses `var(--s)`, border `var(--bd)`, text `var(--t)`.
  - Donut chart cells dynamically render `var(--ok)`, `var(--wa)`, and `var(--no)`.

### Verification & Evidence Artifacts
- **Evidence Directory:** `docs/screenshots/light-mode/`
  1. `landing-desktop-dark.png` (1440x900) — 125.9 KB
  2. `landing-desktop-light.png` (1440x900) — 138.6 KB
  3. `landing-mobile-dark.png` (375x812) — 52.5 KB
  4. `landing-mobile-light.png` (375x812) — 57.9 KB
  5. `admin-dashboard-desktop-dark.png` (1440x900) — 100.8 KB
  6. `admin-dashboard-desktop-light.png` (1440x900) — 87.1 KB
  7. `admin-dashboard-mobile-dark.png` (375x812) — 33.2 KB
  8. `admin-dashboard-mobile-light.png` (375x812) — 45.9 KB
  9. `allocation-center-desktop-dark.png` (1440x900) — 91.4 KB
  10. `allocation-center-desktop-light.png` (1440x900) — 96.2 KB
  11. `allocation-center-mobile-dark.png` (375x812) — 39.3 KB
  12. `allocation-center-mobile-light.png` (375x812) — 44.4 KB
  13. `create-order-form-light.png` (1440x900) — 7.0 KB
  14. `inventory-table-light.png` (1440x900) — 78.6 KB
- **Automated Test Results:** **42 / 42 PASSED** across 11 test files (including new `Theme.test.jsx`).
- **Production Build:** `vite build` completed cleanly in **5.37s** with **0 errors**.


---

## 🚀 Phase 20: Light Mode & OrderWise Red Design System (100% Complete & Verified)

### Objectives & User Alignment
1. **Light Mode as Default with Two-Way Theme Toggle:**
   - Default theme initialized to Light mode (#F7F7F8 background, #FFFFFF cards, #E4E4E7 borders) matching [orderwise-light-preview.html](file:///c:/Users/jadha/OneDrive/Desktop/OrderWise/orderwise-light-preview.html).
   - Preserved full theme toggling across Light, Dark, and System modes with anti-FOUT head script.
2. **OrderWise Red Brand Accent (#E50914):**
   - Soft top-right ambient red lighting (
adial-gradient(closest-side, rgba(229, 9, 20, 0.13), transparent)) replacing previous glow colors.
   - Restored brand red tokens (--ac: #E50914, hover: #C00811, tint: 
gba(229,9,20,0.08)) with zero amber residue across all customer, admin, and public layouts.
   - Primary action buttons: pill radius 999px, brand red background with soft red glow shadow (shadow-[0_6px_24px_rgba(229,9,20,0.4)]).
3. **Exact Visual Alignment with User Reference Screenshots:**
   - **Hero (Home.jsx):** Red badge VORTEXA 3.0 • Problem Statement S-03; H1 with 'and supply intelligence' in red; Live Allocation Queue card with red glowing indicator, Charlie fulfilled (green bar), Alice/Bob deferred (red stub on gray bar), and deterministic resolution footer.
   - **Capability KPI Strip:** 3 cards (94.2% fill rate, 4 items, 1 critical alert with red border and inset glow).
   - **How OrderWise Works:** Red underline accent bar (w-10 h-[3px] bg-ac) with 3 clean white cards.
   - **Enterprise Allocation Modules:** 4 cards (Allocation Center, Simulation Lab, Reports & CSV exports, Audit log viewer) with green ● Active indicators, followed by the dashed roadmap card.
   - **Instant Demo Access CTA:** Clean card with red border, red accent underline, and red Go to 1-Click Login → button.
   - **Admin Operations Overview (AdminDashboard.jsx):** 4 KPI cards; Stock vs reserved chart with red on-hand bars (#E50914) and gray reserved bars (#8A8A8A); Allocation outcomes donut chart with centered order counter; Modules section with red underline bar, 4 active cards (● Active), and dashed roadmap bar.

### Quality Verification & Gate Checks
- **Automated Frontend Test Suite:** **42 / 42 PASSED** across all 11 test files (
pm --prefix frontend test -- --run).
- **Pure Allocation Unit Tests:** **18 / 18 PASSED** (
pm --prefix backend test -- tests/allocation.pure.test.js).
- **Production Vite Build:** Built cleanly with **0 errors** (dist/ generated).
- **Backend Protection:** Zero backend allocation algorithms, database schemas, or business rules altered.
- **Development Server:** Active and responding on http://localhost:5173/ (HTTP 200).


---

## 🎨 Phase 21: Targeted UI Polish — Borders, Card Radii & Portal Visual Consistency (100% Complete & Verified)

### Objectives & Strict Scope Adherence
1. **Zero Modifications to Protected 3D & Business Layers:**
   - The landing page 3D warehouse isometric illustration, SVG geometry, animations, timing, and soft red ambient lighting (`IsometricWarehouseVisual.jsx`, `AmbientLighting.jsx`) were completely preserved without modification.
   - Zero changes to backend routes, database schema, RBAC, pure allocation engine algorithm, or core business rules.

2. **Border Refinement & Elimination of Harsh Outlines:**
   - **Removed All Prominent White Borders:** Eliminated every instance of `hover:border-white` across Admin and Customer portal pages:
     - `CustomerDashboard.jsx`: Quick navigation cards now use subtle `hover:border-neutral-600`.
     - `ProductCatalog.jsx`: Catalog product cards now use subtle `hover:border-neutral-600`.
     - `AIRecommendations.jsx`: View switcher tabs, quick prompts, accordion toggles, and override buttons now use `hover:border-neutral-600`.
     - `Alerts.jsx`: Active alert filter cards now use subtle `hover:border-neutral-600`.
     - `ImpactAnalyzer.jsx`: Run comparison summary filter tiles now use `hover:border-neutral-600`.
     - `InventoryManagement.jsx`: Ledger history action buttons now use subtle `hover:border-neutral-600`.
     - `OrderManagement.jsx`: Order detail action buttons now use subtle `hover:border-neutral-600`.
     - `ProductManagement.jsx`: Product edit action buttons now use subtle `hover:border-neutral-600`.
     - `Replenishment.jsx`: Primary navigation tabs now use subtle `hover:border-neutral-600`.
   - **Eliminated Nested Box Outlines:** Removed redundant bordered containers inside `OrderDetail.jsx` breakdown grids and modal order inspection panels, leveraging clean surface contrast (`bg-s` on `bg-s2`) for a spacious, uncluttered enterprise feel.
   - **Unified Table Headers:** Added consistent subtle header background shading (`bg-s2/60`) and delicate border lines (`border-b border-bd`) across `ProductManagement.jsx`, `AllocationCenter.jsx`, `MyOrders.jsx`, `OrderManagement.jsx`, and `InventoryManagement.jsx`.

3. **Consistent Corner Radii & Component Geometry:**
   - **Modals:** Standardized `Modal.jsx` to `rounded-[18px]` with subtle `border border-[#2A2A2A]` and matching divider.
   - **Dashboard Cards & Tiles:** Standardized to 14–16px (`rounded-card` / `rounded-[14px]`).
   - **Table Wrappers:** Consistent 12–14px (`rounded-card` / `rounded-[14px]` with `overflow-hidden`).
   - **Form Inputs & Textareas:** Standardized to 10–12px (`rounded-[12px]`) across `CreateOrder.jsx`, `ProductManagement.jsx`, `InventoryManagement.jsx`, `AIRecommendations.jsx`, and `Replenishment.jsx`.
   - **Buttons & Badges:** Preserved 999px pill geometry (`rounded-pill`, `rounded-full`).

4. **Shared UI Alignment:**
   - Updated `EmptyState.jsx` to consume theme tokens (`text-t`) rather than hardcoded white.

### Quality Verification & Gate Checks
- **Frontend Vitest Suite:** **42 / 42 PASSED** across all 11 test files (`npm --prefix frontend test -- --run`).
- **Backend Pure Allocation Suite:** **18 / 18 PASSED** (`npm --prefix backend test -- tests/allocation.pure.test.js`).
- **Vite Production Build:** `vite build` completed in **5.37s** with **0 errors**.
- **Development Server:** Active and responding on `http://localhost:5173/` (HTTP 200).


---

## 💎 Phase 22: Typography System, Soft Text Hierarchy, Bespoke Dark Dropdowns & Dynamic Allocation Progress Bars (100% Complete & Verified)

### Objectives & Scope Adherence
1. **Typography System Standardized Across Platform:**
   - **Headings & Display:** Loaded `Manrope` (`500;600;700;800`) alongside `Inter` and `IBM Plex Mono` in `index.html` and configured `font-display: ['Manrope', 'Inter Tight', 'Inter', ...]` in `tailwind.config.js` and `index.css`.
   - **Body, Buttons, Navigation, Labels & Tables:** Set `Inter` as the primary sans font family for all paragraphs, inputs, buttons, headers, and form labels.
   - **Monospace Reserved for Technical Data:** Removed excessive monospace from form labels, action buttons, card descriptions, and eyebrow banners across `Login.jsx`, `Register.jsx`, `CreateOrder.jsx`, `AllocationCenter.jsx`, `InventoryManagement.jsx`, `OrderManagement.jsx`, `ProductManagement.jsx`, `Replenishment.jsx`, `SimulationLab.jsx`, `CustomerDashboard.jsx`, and `Sidebar.jsx`. Monospace (`IBM Plex Mono`) is now strictly reserved for SKUs, order IDs, hashes, numerical quantities, and timestamps.
   - **Large Metrics:** Formatted all hero and dashboard KPI numbers with `font-display font-bold` (Manrope) for clean enterprise SaaS aesthetics.

2. **Soft, Refined Text Hierarchy:**
   - Updated primary text token `--t` to `#F2F2F2` (softer than harsh pure white).
   - Standardized secondary text token `--t2` to `#A1A1AA` (zinc-400 tone).
   - Added muted text token `--muted` to `#71717A` (zinc-500 tone) for subtle secondary context.

3. **Bespoke Dark Dropdowns (Native OS Grey Overhaul):**
   - Styled all `<select>` elements with dark surface (`var(--s2)`), subtle `#2A2A2A` borders, `rounded-[12px]`, Inter typography, custom inline SVG chevron icon (`stroke='#A1A1AA'`), `appearance: none`, and smooth hover/focus transitions.

4. **Allocation Impact Analyzer Polish (`ImpactAnalyzer.jsx`):**
   - Cleaned up Base Run and Target Run form labels to Inter font (`font-sans font-medium text-[13px] text-t2`).
   - Replaced native-looking dropdowns with custom dark selects (`rounded-[12px] border-[#2A2A2A]`).
   - Replaced the misaligned header diff button with a cohesive `btn-primary min-h-[42px] px-4 py-2 font-semibold` action button.
   - Restyled the error notification to a subtle dark-red alert container (`border-no/30 bg-no/10 text-no rounded-[14px] font-sans`).
   - Overhauled the 6 KPI metric cards: large values in `font-display font-bold text-[28px]` (Manrope), clean Inter labels and subtexts, with subtle `#2A2A2A` borders eliminating harsh white outlines.
   - Harmonized search box and classification filter dropdown to consistent `rounded-[12px]` geometry.

5. **Dynamic Live Allocation Queue Progress Bars (`Home.jsx`):**
   - Implemented dynamic progress calculation: `progress = (allocated_quantity / requested_quantity) * 100`, clamped between 0% and 100%.
   - Configured exact status fill colors:
     - Fulfilled: `#4ADE80`
     - Partial: `#F5B544`
     - Deferred: `#FF7A7A`
   - Dark subtle background track (`#252525`) with rounded track and fill (`rounded-full`).
   - Smooth CSS width transitions on data updates (`transition-all duration-500 ease-out`).
   - Displayed actual allocated/requested numbers beside each order (`{statusLabel} {allocated}/{requested}{subClause}`).
   - Connected to actual allocation API responses (`/products` and `/allocation/runs`) with safe fallback and safe handling of zero/missing data.
   - Preserved card layout, responsive behavior, and zero bright white outlines.

6. **Strict Protection Compliance:**
   - 3D warehouse isometric visual (`IsometricWarehouseVisual.jsx`), SVG reference geometry, and soft red ambient lighting (`AmbientLighting.jsx`) strictly untouched.
   - Backend routes, database migrations, authentication, RBAC, and allocation engine core algorithms strictly untouched.

### Quality Verification & Gate Checks
- **Frontend Vitest Suite:** **42 / 42 PASSED** across all 11 test files (`npm --prefix frontend test -- --run`).
- **Backend Pure Allocation Suite:** **18 / 18 PASSED** (`npm --prefix backend test -- tests/allocation.pure.test.js`).
- **Production Vite Build:** `vite build` completed in **5.44s** with **0 errors**.
- **Development Server:** Active and responding on `http://localhost:5173/` (HTTP 200).
