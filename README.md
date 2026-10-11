# OrderWise

**AI-Assisted Priority-Based Order Allocation and Supply Intelligence Platform**  
VORTEXA 3.0 Hackathon — Problem Statement S-03

---

## What It Does

OrderWise allocates limited inventory across competing customer orders using:
- **Deterministic business rules** — same inputs always produce same results
- **AI-assisted priority recommendations** — Groq API with human approval required
- **Explainable decisions** — every allocation result includes a plain-English reason
- **What-if simulations** — test scenarios without touching live data
- **Allocation Impact Analyzer** — see exactly what changed between allocation runs

**Core principle:** AI recommends. Business rules validate. Authorized humans approve. OrderWise allocates and explains.

---

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone and Install

```bash
git clone https://github.com/your-team/orderwise.git
cd orderwise

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Set Up PostgreSQL

```bash
createdb orderwise_db
createuser orderwise_user --pwprompt
psql -c "GRANT ALL PRIVILEGES ON DATABASE orderwise_db TO orderwise_user;"
```

### 3. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials and Groq API key

# Frontend
cp frontend/.env.example frontend/.env
# Edit if needed (default: http://localhost:4000/api)
```

### 4. Run Migrations and Seed

```bash
cd backend
npm run migrate
npm run seed          # loads demo data for hackathon presentation
```

### 5. Run Tests and Linting

```bash
# Run tests
npm run test:backend     # or cd backend && npm test
npm run test:frontend    # or cd frontend && npm test

# Run linters
npm run lint:backend     # or cd backend && npm run lint
npm run lint:frontend    # or cd frontend && npm run lint
```

### 6. Start the Application

```bash
# Terminal 1 — Backend (http://localhost:4000)
npm run dev:backend      # or cd backend && npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
npm run dev:frontend     # or cd frontend && npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:4000/api  
Health Check: http://localhost:4000/api/health

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@orderwise.com | Admin123! |
| Customer (Alice) | alice@demo.com | Alice123! |
| Customer (Bob) | bob@demo.com | Bob123! |
| Customer (Charlie) | charlie@demo.com | Charlie123! |

---

## Project Structure

```
orderwise/
├── AGENTS.md           ← AI agent instructions (read this first)
├── README.md           ← this file
├── docs/               ← specifications
├── backend/            ← Node.js + Express + PostgreSQL
└── frontend/           ← React + Vite + Tailwind CSS
```

---

## Key Features

| Feature | Description |
|---|---|
| Priority-Based Allocation | Critical > High > Medium > Low, with date and timestamp tie-breaking |
| Partial Delivery Control | Per-order minimum quantity and partial delivery permission |
| Explainable Results | Every order item gets a plain-English allocation reason |
| AI Priority Assistant | Groq-powered recommendations with mandatory human approval |
| Impact Analyzer | Before/after comparison across allocation runs |
| What-If Simulations | Test inventory changes, demand surges, supplier delays — no live data affected |
| Replenishment Alerts | Reorder point calculations with demand and lead time |
| Audit Trail | Every important action is logged with actor, timestamp, and before/after state |

---

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, Recharts
- **Backend:** Node.js 20, Express.js 4
- **Database:** PostgreSQL 15
- **AI:** Groq API (`llama3-70b-8192`)
- **Auth:** JWT + bcryptjs

---

## API Documentation

See `docs/API_SPEC.md` for all endpoints with request/response examples.

---

## Allocation Engine

See `docs/ALLOCATION_ENGINE.md` for the full algorithm specification with pseudocode and test cases.

---

## Database Schema

See `docs/DATABASE_SCHEMA.md` for the complete PostgreSQL schema with CREATE TABLE statements.

---

## Testing the Core Cases

```bash
cd backend
npm test          # runs allocation engine unit tests
```

Key test cases covered:
- Full fulfillment (sufficient stock)
- Partial fulfillment (partial allowed, above minimum)
- Deferred — below minimum
- Deferred — partial not allowed
- Competing priorities (higher priority wins)
- Equal priority tie-break by delivery date
- AI provider failure (fallback continues working)
- Simulation isolation (no live data modified)

---

## Limitations

- AI recommendations depend on the quality of supplied business notes
- Replenishment figures are estimates, not guaranteed forecasts
- Hackathon MVP — not production-hardened
- Priority-first allocation is transparent but does not mathematically maximize total units delivered
