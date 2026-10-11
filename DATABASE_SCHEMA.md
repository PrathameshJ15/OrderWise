# OrderWise — PostgreSQL Database Schema

All tables use `BIGSERIAL` primary keys. Timestamps are `TIMESTAMPTZ` stored in UTC.
Run as numbered migration files in `backend/src/db/migrations/`.

---

## Migration 001 — Core Tables

```sql
-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(50)  NOT NULL DEFAULT 'customer'
                             CHECK (role IN ('customer', 'admin', 'inventory_manager')),
  active        BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id          BIGSERIAL    PRIMARY KEY,
  sku         VARCHAR(100) NOT NULL UNIQUE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  unit        VARCHAR(50)  NOT NULL DEFAULT 'units',
  active      BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_sku    ON products(sku);
CREATE INDEX idx_products_active ON products(active);

-- ============================================================
-- INVENTORY
-- ============================================================
-- One row per product. Use FOR UPDATE when reading during allocation.
CREATE TABLE inventory (
  product_id         BIGINT      NOT NULL PRIMARY KEY REFERENCES products(id),
  on_hand_quantity   INTEGER     NOT NULL DEFAULT 0 CHECK (on_hand_quantity >= 0),
  reserved_quantity  INTEGER     NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  safety_stock       INTEGER     NOT NULL DEFAULT 0 CHECK (safety_stock >= 0),
  reorder_point      INTEGER     NOT NULL DEFAULT 0,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by         BIGINT      REFERENCES users(id),

  -- Soft constraint: reserved cannot exceed on_hand
  CONSTRAINT chk_reserved_lte_on_hand
    CHECK (reserved_quantity <= on_hand_quantity)
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id                    BIGSERIAL    PRIMARY KEY,
  customer_id           BIGINT       NOT NULL REFERENCES users(id),
  status                VARCHAR(50)  NOT NULL DEFAULT 'pending'
                                     CHECK (status IN (
                                       'pending', 'confirmed', 'allocated',
                                       'partially_allocated', 'shipped',
                                       'completed', 'cancelled'
                                     )),
  promised_delivery_date DATE,
  business_notes        TEXT,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status      ON orders(status);
CREATE INDEX idx_orders_created_at  ON orders(created_at);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id                          BIGSERIAL PRIMARY KEY,
  order_id                    BIGINT    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id                  BIGINT    NOT NULL REFERENCES products(id),
  requested_quantity          INTEGER   NOT NULL CHECK (requested_quantity > 0),
  minimum_acceptable_quantity INTEGER   NOT NULL DEFAULT 0
                                        CHECK (minimum_acceptable_quantity >= 0),
  partial_delivery_allowed    BOOLEAN   NOT NULL DEFAULT true,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (order_id, product_id),

  -- Minimum must not exceed requested
  CONSTRAINT chk_min_lte_requested
    CHECK (minimum_acceptable_quantity <= requested_quantity)
);

CREATE INDEX idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

---

## Migration 002 — Priority and Allocation Tables

```sql
-- ============================================================
-- ORDER PRIORITIES
-- ============================================================
-- Only ONE approved priority per order at a time.
-- Allocation engine reads ONLY from this table.
CREATE TABLE order_priorities (
  id                BIGSERIAL   PRIMARY KEY,
  order_id          BIGINT      NOT NULL UNIQUE REFERENCES orders(id),
  approved_priority VARCHAR(20) NOT NULL
                                CHECK (approved_priority IN (
                                  'critical', 'high', 'medium', 'low'
                                )),
  priority_rank     SMALLINT    NOT NULL
                                CHECK (priority_rank IN (1, 2, 3, 4)),
                                -- low=1, medium=2, high=3, critical=4
  approved_by       BIGINT      NOT NULL REFERENCES users(id),
  approved_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason            TEXT
);

CREATE INDEX idx_order_priorities_order_id ON order_priorities(order_id);

-- ============================================================
-- ALLOCATION RUNS
-- ============================================================
CREATE TABLE allocation_runs (
  id            BIGSERIAL   PRIMARY KEY,
  initiated_by  BIGINT      NOT NULL REFERENCES users(id),
  status        VARCHAR(20) NOT NULL DEFAULT 'running'
                            CHECK (status IN ('running', 'completed', 'failed')),
  rule_version  VARCHAR(20) NOT NULL DEFAULT '1.0',
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

-- ============================================================
-- ALLOCATION RESULTS
-- ============================================================
-- One row per order_item per allocation_run.
CREATE TABLE allocation_results (
  id               BIGSERIAL   PRIMARY KEY,
  allocation_run_id BIGINT     NOT NULL REFERENCES allocation_runs(id),
  order_item_id    BIGINT      NOT NULL REFERENCES order_items(id),
  order_id         BIGINT      NOT NULL REFERENCES orders(id),
  product_id       BIGINT      NOT NULL REFERENCES products(id),
  requested_quantity  INTEGER  NOT NULL,
  allocated_quantity  INTEGER  NOT NULL CHECK (allocated_quantity >= 0),
  status           VARCHAR(30) NOT NULL
                               CHECK (status IN (
                                 'fulfilled', 'partially_fulfilled', 'deferred', 'pending'
                               )),
  approved_priority      VARCHAR(20),
  promised_delivery_date DATE,
  stock_at_allocation    INTEGER,
  partial_delivery_allowed BOOLEAN,
  minimum_acceptable_quantity INTEGER,
  explanation      TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (allocation_run_id, order_item_id)
);

CREATE INDEX idx_alloc_results_run_id      ON allocation_results(allocation_run_id);
CREATE INDEX idx_alloc_results_order_id    ON allocation_results(order_id);
CREATE INDEX idx_alloc_results_product_id  ON allocation_results(product_id);
```

---

## Migration 003 — AI and Approval Tables

```sql
-- ============================================================
-- AI RECOMMENDATIONS
-- ============================================================
CREATE TABLE ai_recommendations (
  id                   BIGSERIAL   PRIMARY KEY,
  order_id             BIGINT      NOT NULL REFERENCES orders(id),
  suggested_priority   VARCHAR(20) NOT NULL
                                   CHECK (suggested_priority IN (
                                     'critical', 'high', 'medium', 'low'
                                   )),
  confidence           VARCHAR(20),
  explanation          TEXT,
  evidence             TEXT,
  warning              TEXT,
  provider             VARCHAR(50) NOT NULL DEFAULT 'groq',
  model                VARCHAR(100),
  recommendation_status VARCHAR(20) NOT NULL DEFAULT 'pending'
                                    CHECK (recommendation_status IN (
                                      'pending', 'approved', 'rejected', 'modified'
                                    )),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_recs_order_id ON ai_recommendations(order_id);

-- ============================================================
-- PRIORITY APPROVALS
-- ============================================================
CREATE TABLE priority_approvals (
  id                BIGSERIAL   PRIMARY KEY,
  recommendation_id BIGINT      NOT NULL REFERENCES ai_recommendations(id),
  reviewer_id       BIGINT      NOT NULL REFERENCES users(id),
  decision          VARCHAR(20) NOT NULL
                                CHECK (decision IN ('approved', 'rejected', 'modified')),
  final_priority    VARCHAR(20) NOT NULL
                                CHECK (final_priority IN (
                                  'critical', 'high', 'medium', 'low'
                                )),
  decision_reason   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Migration 004 — Suppliers and Purchase Orders

```sql
-- ============================================================
-- SUPPLIERS
-- ============================================================
CREATE TABLE suppliers (
  id                    BIGSERIAL    PRIMARY KEY,
  name                  VARCHAR(255) NOT NULL,
  contact_email         VARCHAR(255),
  contact_phone         VARCHAR(50),
  default_lead_time_days INTEGER     NOT NULL DEFAULT 7 CHECK (default_lead_time_days > 0),
  active                BOOLEAN      NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PURCHASE ORDERS
-- ============================================================
CREATE TABLE purchase_orders (
  id                    BIGSERIAL   PRIMARY KEY,
  supplier_id           BIGINT      NOT NULL REFERENCES suppliers(id),
  status                VARCHAR(20) NOT NULL DEFAULT 'pending'
                                    CHECK (status IN (
                                      'pending', 'confirmed', 'shipped',
                                      'received', 'delayed', 'cancelled'
                                    )),
  expected_delivery_date DATE,
  notes                  TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PURCHASE ORDER ITEMS
-- ============================================================
CREATE TABLE purchase_order_items (
  id                  BIGSERIAL PRIMARY KEY,
  purchase_order_id   BIGINT    NOT NULL REFERENCES purchase_orders(id),
  product_id          BIGINT    NOT NULL REFERENCES products(id),
  quantity            INTEGER   NOT NULL CHECK (quantity > 0),
  received_quantity   INTEGER   NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
  unit_cost           NUMERIC(12, 2),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Migration 005 — Simulations, Movements, Alerts, Audit

```sql
-- ============================================================
-- SIMULATIONS
-- ============================================================
CREATE TABLE simulations (
  id              BIGSERIAL   PRIMARY KEY,
  created_by      BIGINT      NOT NULL REFERENCES users(id),
  scenario_type   VARCHAR(50) NOT NULL
                              CHECK (scenario_type IN (
                                'inventory_increase', 'inventory_decrease',
                                'demand_surge', 'supplier_delay', 'priority_change'
                              )),
  scenario_inputs JSONB       NOT NULL,
  results_summary JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVENTORY MOVEMENTS
-- ============================================================
CREATE TABLE inventory_movements (
  id             BIGSERIAL   PRIMARY KEY,
  product_id     BIGINT      NOT NULL REFERENCES products(id),
  movement_type  VARCHAR(50) NOT NULL
                             CHECK (movement_type IN (
                               'purchase_receipt', 'manual_adjustment',
                               'allocation_reserve', 'allocation_release',
                               'shipment', 'damage_write_off'
                             )),
  quantity_delta INTEGER     NOT NULL,  -- positive = in, negative = out
  quantity_before INTEGER   NOT NULL,
  quantity_after  INTEGER   NOT NULL,
  reference_type  VARCHAR(50),         -- 'purchase_order', 'allocation_run', etc.
  reference_id    BIGINT,
  notes           TEXT,
  created_by      BIGINT     REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inv_movements_product_id ON inventory_movements(product_id);
CREATE INDEX idx_inv_movements_created_at ON inventory_movements(created_at);

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TABLE alerts (
  id             BIGSERIAL   PRIMARY KEY,
  alert_type     VARCHAR(50) NOT NULL
                             CHECK (alert_type IN (
                               'low_inventory', 'product_shortage',
                               'order_at_risk', 'supplier_delay',
                               'below_reorder_point', 'allocation_status_change',
                               'priority_change_impact', 'replenishment_required'
                             )),
  severity       VARCHAR(20) NOT NULL
                             CHECK (severity IN ('info', 'warning', 'critical')),
  title          VARCHAR(255) NOT NULL,
  description    TEXT        NOT NULL,
  product_id     BIGINT      REFERENCES products(id),
  order_id       BIGINT      REFERENCES orders(id),
  resolved       BOOLEAN     NOT NULL DEFAULT false,
  resolved_at    TIMESTAMPTZ,
  resolved_by    BIGINT      REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_resolved    ON alerts(resolved);
CREATE INDEX idx_alerts_severity    ON alerts(severity);
CREATE INDEX idx_alerts_product_id  ON alerts(product_id);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id           BIGSERIAL   PRIMARY KEY,
  actor_id     BIGINT      REFERENCES users(id),
  actor_role   VARCHAR(50),
  action       VARCHAR(100) NOT NULL,
  entity_type  VARCHAR(50)  NOT NULL,
  entity_id    BIGINT,
  before_state JSONB,
  after_state  JSONB,
  ip_address   INET,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor_id    ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity      ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action      ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at  ON audit_logs(created_at);
```

---

## Key Queries

### Available Stock for a Product
```sql
SELECT
  p.id,
  p.name,
  i.on_hand_quantity,
  i.reserved_quantity,
  (i.on_hand_quantity - i.reserved_quantity) AS available_stock,
  i.reorder_point,
  i.safety_stock
FROM inventory i
JOIN products p ON p.id = i.product_id
WHERE p.active = true;
```

### Eligible Order Items for Allocation (for one product)
```sql
SELECT
  oi.id            AS order_item_id,
  oi.order_id,
  oi.product_id,
  oi.requested_quantity,
  oi.minimum_acceptable_quantity,
  oi.partial_delivery_allowed,
  op.approved_priority,
  op.priority_rank,
  o.promised_delivery_date,
  o.created_at     AS order_created_at,
  o.customer_id,
  u.name           AS customer_name
FROM order_items oi
JOIN orders o         ON o.id = oi.order_id
JOIN order_priorities op ON op.order_id = o.id
JOIN users u          ON u.id = o.customer_id
WHERE oi.product_id = $1
  AND o.status IN ('pending', 'confirmed')
ORDER BY
  op.priority_rank DESC,
  o.promised_delivery_date ASC NULLS LAST,
  o.created_at ASC,
  o.id ASC;
```

### Impact Analysis — Diff Between Two Runs
```sql
SELECT
  curr.order_item_id,
  curr.order_id,
  p.name           AS product_name,
  u.name           AS customer_name,
  prev.allocated_quantity AS previous_allocated,
  curr.allocated_quantity AS current_allocated,
  prev.status      AS previous_status,
  curr.status      AS current_status,
  (curr.allocated_quantity - prev.allocated_quantity) AS delta
FROM allocation_results curr
JOIN allocation_results prev
  ON prev.order_item_id = curr.order_item_id
  AND prev.allocation_run_id = $1  -- previous run ID
JOIN products p ON p.id = curr.product_id
JOIN orders o   ON o.id = curr.order_id
JOIN users u    ON u.id = o.customer_id
WHERE curr.allocation_run_id = $2  -- current run ID
ORDER BY ABS(curr.allocated_quantity - prev.allocated_quantity) DESC;
```

---

## Priority Rank Reference

| Label | Rank (stored in order_priorities) |
|---|---|
| `low` | 1 |
| `medium` | 2 |
| `high` | 3 |
| `critical` | 4 |

Store both `approved_priority` (string label) and `priority_rank` (integer) for easy sorting.
