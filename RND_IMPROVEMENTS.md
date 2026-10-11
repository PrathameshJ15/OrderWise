# OrderWise R&D — Improvements and Clarifications

This document records the specific gaps and improvements made to the original R&D document.
Use this when presenting to judges to show depth of thinking beyond the template.

---

## 1. What the Original R&D Missed (and How We Fixed It)

### 1.1 No Concrete Tie-Breaking for Null Delivery Dates
**Original:** "An order with a known promised date should rank ahead of an otherwise equivalent order without one."  
**Problem:** `NULL < date` comparison behavior differs between SQL dialects and ORM libraries.  
**Fix:** Explicitly use `ORDER BY promised_delivery_date ASC NULLS LAST` in PostgreSQL, stored both in code comments and the ALLOCATION_ENGINE.md. This is now unambiguous.

---

### 1.2 "Inventory Position" Was Dangerously Vague
**Original:** `Inventory Position = Available Stock + Confirmed Incoming Stock − Relevant Outstanding Commitments`  
**Problem:** "Relevant Outstanding Commitments" was undefined. Double-counting reserved stock was possible.  
**Fix:** Defined explicitly:
- `on_hand_quantity` = physical stock on shelves  
- `reserved_quantity` = total currently allocated (recalculated fresh on each run)  
- `available_stock` = `on_hand_quantity - reserved_quantity`  
- `inventory_position` (for replenishment) = `on_hand_quantity + confirmed_incoming_stock - reserved_quantity`  
- `reserved_quantity` is reset to 0 at the start of each full reallocation run for that product, then recalculated — preventing double-counting.

---

### 1.3 No Priority_Rank Integer — Just String Labels
**Original:** Priority was `Critical`, `High`, `Medium`, `Low` with no sortable numeric representation.  
**Problem:** Sorting strings is fragile; `"high" > "critical"` alphabetically is wrong.  
**Fix:** Added `priority_rank` integer (1–4) to `order_priorities`. Engine sorts on `priority_rank DESC`. Both label and rank are stored. UI shows labels; SQL sorts on integers.

---

### 1.4 AI System Prompt Was Not Specified
**Original:** "AI interprets business notes and recommends priorities" — no prompt engineering guidance.  
**Problem:** Vague prompts produce vague, unpredictable outputs. JSON format needs enforcement.  
**Fix:** Defined concrete system prompt with:
- Explicit output JSON schema
- `response_format: { type: 'json_object' }` (Groq supports this)
- Temperature = 0.2 for consistency
- Explicit instructions: "never invent facts", "if notes are empty, suggest MEDIUM"

---

### 1.5 No Fallback Specification
**Original:** "A clearly labelled local rule-based fallback should be available."  
**Problem:** No specification of what the fallback actually does.  
**Fix:** Implemented as a keyword-match function (`ruleBasedFallback`) with:
- Keyword lists for each priority level
- `provider: 'fallback'` in the response
- UI shows an orange "Rule-Based Fallback — Not AI" banner instead of the normal AI card

---

### 1.6 Transaction and Concurrency Pattern Was Abstract
**Original:** "Use transactions and concurrency controls."  
**Problem:** Which PostgreSQL pattern? Advisory locks? Optimistic locking? SERIALIZABLE isolation?  
**Fix:** Specified `SELECT ... FOR UPDATE` on the inventory row within `BEGIN/COMMIT`. This row-level lock prevents two simultaneous allocation transactions from over-allocating the same product's stock. This is the simplest correct pattern for a hackathon MVP.

---

### 1.7 Order-Level Status Derivation Was Missing
**Original:** Lists order statuses (`pending`, `confirmed`, `allocated`, etc.) but never says how to derive them from item statuses.  
**Problem:** If 3 items exist and 2 are fulfilled + 1 deferred, what is the order status?  
**Fix:** Defined policy:
- All items `fulfilled` → order status = `allocated`  
- All items `deferred` → order status = `pending` (stays pending)  
- Mixed → order status = `partially_allocated`  
- Implemented as `deriveOrderStatus()` in the engine

---

### 1.8 Reallocation Did Not Define "Reset" Behavior
**Original:** "Previous allocations must not be counted twice during recalculation."  
**Problem:** How does the engine avoid double-counting? Was `reserved_quantity` cleared first?  
**Fix:** Explicit rule: At the start of each allocation run for a product, `reserved_quantity` is recalculated from scratch (set to 0, then rebuilt). The engine uses only `on_hand_quantity` as the starting stock pool. `reserved_quantity` is the OUTPUT of the engine, not the input.

---

### 1.9 Simulation Isolation Was Not Mechanically Defined
**Original:** "Simulations must not modify live inventory."  
**Problem:** How? Separate database? In-memory copy? Separate schema?  
**Fix:** Specified: read current state into JavaScript objects, apply scenario mutations to those objects, run the allocation algorithm against the in-memory copy, return diff, save only simulation metadata to the `simulations` table. Zero writes to `inventory`, `allocation_results`, or `order_priorities`.

---

### 1.10 No Demo Data Strategy
**Original:** No mention of seed data or how to demonstrate allocation conflicts.  
**Problem:** Without conflicting orders, the allocation engine looks trivial.  
**Fix:** Designed a specific seed dataset where:
- Pressure Gauge Pro has 40 units
- Three competing orders total 75 units
- Two orders have the same priority → tie-broken by delivery date
- One order hits the "below minimum" deferred case
- One order hits the "partial not allowed" case
This makes the demo compelling in under 2 minutes.

---

### 1.11 No Concrete API Error Format
**Original:** "Appropriate error handling without exposing secrets."  
**Problem:** Frontend has no reliable way to handle errors consistently without a defined shape.  
**Fix:** Standardized error response:
```json
{ "error": true, "message": "...", "code": "ERROR_CODE", "details": {} }
```
With a defined set of error codes for all key failure modes.

---

### 1.12 Explanation Generation Was Too Vague
**Original:** "Explanations must be generated from actual allocation inputs and results."  
**Problem:** No templates = inconsistent explanations = judges can't verify they're formula-derived.  
**Fix:** Three concrete explanation templates (Cases A, B, C/D) with exact variable substitution. Every explanation is guaranteed to include: requested quantity, available stock, minimum acceptable quantity, and the decision reason.

---

## 2. Architecture Decisions Made Explicit

### Why PostgreSQL `reserved_quantity` Instead of a `reservations` Table?
A separate reservations table would be more normalized but adds complexity for a 12-hour build.
The `reserved_quantity` column is updated atomically within the allocation transaction.
The tradeoff: slightly less granular audit trail, but simpler code with fewer join paths.

### Why Groq Instead of OpenAI?
Groq's inference is significantly faster (~100-300ms vs ~2-5s for GPT-4).
For a live demo, this matters. `llama3-70b-8192` on Groq is free-tier accessible.
`response_format: { type: 'json_object' }` is supported, making JSON parsing reliable.

### Why Stateless JWT Instead of Sessions?
Simplest auth that works across two separate ports (4000 backend, 5173 frontend).
No Redis or session store needed. Acceptable for a hackathon MVP.

### Why `NULLS LAST` for Delivery Dates?
Orders without a promised delivery date should not be penalized or advantaged by default.
Placing them last when dates are equal in other criteria is the most defensible business decision:
a firm deadline is a stronger claim than no deadline.

---

## 3. Features Explicitly Descoped for Hackathon

These are in the original R&D but will not be implemented in the MVP:

| Feature | Reason |
|---|---|
| Advanced ML demand forecasting | Requires historical data and training pipeline |
| Automated purchase order creation | Needs supplier API integration |
| Multi-warehouse allocation | Out of scope for S-03 |
| Anomaly detection | No training data in 12 hours |
| Real-time WebSocket notifications | Nice-to-have; polling is sufficient |
| Full email/notification delivery | No SMTP setup in hackathon |
| Advanced analytics and custom reports | Basic Recharts charts are sufficient |

---

## 4. Presentation Differentiators

When presenting to judges, emphasize:

1. **The engine is truly deterministic** — run it twice, get the same result. This is not trivial.
2. **AI cannot bypass business rules** — show the approval flow and the rejected AI recommendation case
3. **Simulations are genuinely isolated** — offer to show that the live inventory does not change
4. **Explanations are formula-derived** — each reason contains actual numbers from the run, not generic text
5. **The seed data is designed to fail interestingly** — three competing orders, only one fully satisfied

---

*Generated alongside the OrderWise codebase for VORTEXA 3.0*
