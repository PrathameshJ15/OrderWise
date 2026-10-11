# OrderWise

**AI-Assisted Priority-Based Order Allocation and Supply Intelligence Platform**  
VORTEXA 3.0 Hackathon — Problem Statement S-03

---

## What It Does

OrderWise allocates limited inventory across competing customer orders using:
- **Deterministic business rules** — same inputs always produce identical, reproducible results
- **AI-assisted priority recommendations** — Groq API (`llama3-70b-8192`) with strict human approval gates
- **Explainable decisions** — every allocation result includes a plain-English reason and audit trail
- **What-if simulations** — test scenarios (demand surges, inventory swings, delays) without touching live data
- **Allocation Impact Analyzer** — see before/after differences and root causes across allocation runs
- **Real-Time Event Hub** — Server-Sent Events (SSE) notifying customers and admins instantly
- **Supply Intelligence & Replenishment** — reorder points, proactive shortage alerts, and executive reports

**Core principle:** AI recommends. Business rules validate. Authorized humans approve. OrderWise allocates and explains.

---

## ⚡ 1-Command Quick Start with Docker (Recommended)

Start the entire system (PostgreSQL 15 + Node.js Backend API + React Frontend + Nginx) with a single command:

```bash
docker compose up --build
```

That's it!
- **Frontend & Customer Portal:** http://localhost:5173 or http://localhost:80
- **Backend API:** http://localhost:4000/api
- **Health Check:** http://localhost:4000/api/health
- **PostgreSQL Database:** `localhost:5432` (`orderwise_db` / `orderwise_user` / `password`)

Migrations and demo seed data run automatically on startup.

---

## 🛠️ Local Development Setup (Manual)

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Groq API key (optional; system includes transparent rule-based fallback)

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/your-team/orderwise.git
cd orderwise

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment Variables

```bash
# Backend (.env)
cd backend
cp .env.example .env

# Edit backend/.env:
# DATABASE_URL=postgresql://orderwise_user:password@localhost:5432/orderwise_db
# JWT_SECRET=your_super_secret_key_minimum_64_characters
# GROQ_API_KEY=your_groq_api_key_here
```

### 3. Run Migrations & Seed Data

```bash
cd backend
npm run migrate up
npm run seed
```

### 4. Run Tests

```bash
# Run all backend unit & integration tests
npm --prefix backend test

# Run all frontend component & flow tests
npm --prefix frontend test -- --run
```

### 5. Start Development Servers

```bash
# Terminal 1 — Backend (http://localhost:4000)
npm --prefix backend run dev

# Terminal 2 — Frontend (http://localhost:5173)
npm --prefix frontend run dev
```

---

## 👥 Demo Accounts (1-Click Login Ready)

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@orderwise.com` | `Admin123!` | Full control: inventory, orders, allocation, AI approvals, simulations, audit |
| **Manager** | `manager@orderwise.com` | `Manager123!` | Inventory operations, alerts, replenishment, stock adjustments |
| **Customer (Alice)** | `alice@demo.com` | `Alice123!` | Own orders, multi-line ordering, order status timeline |
| **Customer (Bob)** | `bob@demo.com` | `Bob123!` | Competing customer orders with strict partial delivery constraints |
| **Customer (Charlie)** | `charlie@demo.com` | `Charlie123!` | High-priority customer orders competing on scarce SKUs |

---

## 🚀 Cloud Deployment Guide

OrderWise is cloud-ready and designed to be deployed across modern serverless/PaaS platforms:

### 1. Database — Managed PostgreSQL (Neon, Supabase, or Render)
- Provision a PostgreSQL 15 instance on [Neon](https://neon.tech), [Supabase](https://supabase.com), or Render PostgreSQL.
- Copy the provided `DATABASE_URL` (SSL mode enabled: `?sslmode=require`).

### 2. Backend API — Render or Railway
- **Option A: Render Blueprint**
  - Connect your GitHub repository to Render.
  - Render automatically detects `render.yaml` and provisions the backend web service and PostgreSQL database.
- **Option B: Manual Service**
  - Runtime: `Node.js 20`
  - Build command: `npm ci`
  - Start command: `npm run migrate up && npm run seed && node src/index.js`
  - Set Environment Variables:
    - `DATABASE_URL`: Your managed Postgres connection string
    - `JWT_SECRET`: Random 64+ char secret string
    - `GROQ_API_KEY`: Groq API key for LLaMA-3 priority inferences
    - `NODE_ENV`: `production`

### 3. Frontend — Vercel or Netlify
- Import the repository into [Vercel](https://vercel.com).
- Root Directory: `frontend` (or project root with `vercel.json`).
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  - `VITE_API_BASE_URL`: `https://your-backend.onrender.com/api`

---

## 🔄 Backup and Rollback Procedures

### 1. Automated & Manual Database Backups
To take a full snapshot of the production database before major operations:

```bash
# Full logical dump with schema and data
pg_dump -h $DB_HOST -U $DB_USER -d orderwise_db -F c -b -v -f orderwise_backup_$(date +%Y%m%d_%H%M%S).dump

# Plain SQL backup
pg_dump -h $DB_HOST -U $DB_USER -d orderwise_db > orderwise_backup_$(date +%Y%m%d).sql
```

### 2. Database Recovery & Restore
To restore from a backup:

```bash
# Restore custom format dump
pg_restore -h $DB_HOST -U $DB_USER -d orderwise_db -v -c orderwise_backup_YYYYMMDD_HHMMSS.dump

# Restore plain SQL backup
psql -h $DB_HOST -U $DB_USER -d orderwise_db < orderwise_backup_YYYYMMDD.sql
```

### 3. Migration Rollbacks
Every database migration in `backend/src/db/migrations` implements an atomic `down` script:

```bash
# Roll back the single most recent migration
npm --prefix backend run migrate down

# Roll back all migrations to clean slate
npm --prefix backend run migrate down -- -c 9
```

### 4. Application Rollback Strategy
- **Frontend (Vercel/Netlify):** Instant zero-downtime rollback via platform dashboard by reverting to the previous deployment SHA.
- **Backend (Render/Railway):** Re-deploy previous release tag or git commit.
- **Idempotent Allocations:** Allocation runs are stored with cryptographic input hashes in `allocation_runs`. If a run needs reversal, historical runs remain immutable in `allocation_results`.

---

## 🤖 CI/CD Pipeline (GitHub Actions)

Continuous Integration is configured via `.github/workflows/ci.yml`:
- **Backend Job:**
  - Spins up a real `postgres:15-alpine` container service.
  - Runs all 9 sequential migrations (`npm run migrate up`).
  - Executes seed scripts (`npm run seed`).
  - Executes unit, integration, and security test suites.
- **Frontend Job:**
  - Installs dependencies with npm caching.
  - Runs Vitest component and flow tests.
  - Executes production Vite bundle build (`npm run build`).

---

## 📐 Project Structure

```
orderwise/
├── AGENTS.md               ← Single source of truth for coding decisions
├── README.md               ← Documentation & operations guide
├── docker-compose.yml      ← Single-command full-stack container orchestration
├── vercel.json             ← Production SPA routing configuration
├── render.yaml             ← Render Infrastructure-as-Code deployment blueprint
├── .github/
│   └── workflows/
│       └── ci.yml          ← GitHub Actions CI pipeline
├── docs/                   ← Architectural and API specifications
│   ├── ALLOCATION_ENGINE.md
│   ├── API_SPEC.md
│   ├── DATABASE_SCHEMA.md
│   ├── FRONTEND_SPEC.md
│   └── SECURITY_AUDIT.md
├── backend/
│   ├── Dockerfile          ← Production Node.js container
│   ├── src/
│   │   ├── services/
│   │   │   ├── allocationEngine.js  ← Core deterministic engine
│   │   │   ├── aiService.js         ← Groq LLaMA-3 + Fallback
│   │   │   ├── impactAnalyzer.js    ← Run-to-run diff engine
│   │   │   ├── simulationService.js ← In-memory what-if engine
│   │   │   └── eventHub.js          ← Real-time SSE event hub
│   │   └── db/migrations/           ← 9 numbered SQL migration files
└── frontend/
    ├── Dockerfile          ← Multi-stage build + Nginx container
    ├── nginx.conf          ← SPA routing & SSE reverse proxy
    └── src/
        ├── pages/
        │   ├── Home.jsx             ← Interactive Landing page
        │   ├── customer/            ← Customer portal
        │   └── admin/               ← Operations & Supply command center
        └── components/              ← Reusable UI & Recharts visualizations
```

---

## 🏆 Key Architectural Highlights

1. **Deterministic Order Allocation Key:**
   - 1. `approved_priority` DESC (Critical=4 > High=3 > Medium=2 > Low=1)
   - 2. `promised_delivery_date` ASC NULLS LAST
   - 3. `order.created_at` ASC
   - 4. `order.id` ASC
2. **Transactional Inventory Locking:** `FOR UPDATE` row locks guarantee zero race conditions and prevent over-allocation.
3. **Strict IDOR & RBAC Protection:** Customer orders and events are strictly isolated by authenticated JWT identity.
4. **Resilient AI Fallback:** System functions with 100% availability even if third-party AI APIs experience downtime.
