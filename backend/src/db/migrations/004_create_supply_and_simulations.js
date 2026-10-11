exports.up = (pgm) => {
  pgm.sql(`
    -- SUPPLIERS
    CREATE TABLE suppliers (
      id             BIGSERIAL    PRIMARY KEY,
      name           VARCHAR(255) NOT NULL,
      code           VARCHAR(50)  NOT NULL UNIQUE,
      contact_email  VARCHAR(255),
      lead_time_days INTEGER      NOT NULL DEFAULT 7 CHECK (lead_time_days >= 0),
      active         BOOLEAN      NOT NULL DEFAULT true,
      created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_suppliers_code ON suppliers(code);

    -- PURCHASE ORDERS
    CREATE TABLE purchase_orders (
      id                     BIGSERIAL    PRIMARY KEY,
      po_number              VARCHAR(100) NOT NULL UNIQUE,
      supplier_id            BIGINT       NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
      status                 VARCHAR(50)  NOT NULL DEFAULT 'draft'
                                          CHECK (status IN ('draft', 'ordered', 'in_transit', 'received', 'cancelled')),
      expected_delivery_date DATE,
      actual_delivery_date   DATE,
      created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
    CREATE INDEX idx_purchase_orders_status   ON purchase_orders(status);

    -- PURCHASE ORDER ITEMS
    CREATE TABLE purchase_order_items (
      id                BIGSERIAL PRIMARY KEY,
      purchase_order_id BIGINT    NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
      product_id        BIGINT    NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      quantity_ordered  INTEGER   NOT NULL CHECK (quantity_ordered > 0),
      quantity_received INTEGER   NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_po_items_po_id      ON purchase_order_items(purchase_order_id);
    CREATE INDEX idx_po_items_product_id ON purchase_order_items(product_id);

    -- SIMULATIONS
    CREATE TABLE simulations (
      id              BIGSERIAL   PRIMARY KEY,
      user_id         BIGINT      NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      scenario_type   VARCHAR(50) NOT NULL
                                  CHECK (scenario_type IN (
                                    'inventory_increase', 'inventory_decrease',
                                    'demand_surge', 'supplier_delay', 'priority_change'
                                  )),
      scenario_inputs JSONB       NOT NULL,
      results         JSONB       NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_simulations_user_id    ON simulations(user_id);
    CREATE INDEX idx_simulations_type       ON simulations(scenario_type);
    CREATE INDEX idx_simulations_created_at ON simulations(created_at);

    -- INVENTORY MOVEMENTS (Ledger)
    CREATE TABLE inventory_movements (
      id               BIGSERIAL   PRIMARY KEY,
      product_id       BIGINT      NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      movement_type    VARCHAR(50) NOT NULL
                                   CHECK (movement_type IN ('receipt', 'allocation', 'deallocation', 'adjustment', 'shipment')),
      quantity         INTEGER     NOT NULL,
      previous_on_hand INTEGER     NOT NULL,
      new_on_hand      INTEGER     NOT NULL,
      reference_type   VARCHAR(50),
      reference_id     BIGINT,
      created_by       BIGINT      REFERENCES users(id) ON DELETE SET NULL,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_inv_movements_product_id ON inventory_movements(product_id);
    CREATE INDEX idx_inv_movements_created_at ON inventory_movements(created_at);

    -- AUDIT LOGS
    CREATE TABLE audit_logs (
      id          BIGSERIAL    PRIMARY KEY,
      actor_id    BIGINT       REFERENCES users(id) ON DELETE SET NULL,
      action      VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50)  NOT NULL,
      entity_id   BIGINT,
      before_state JSONB,
      after_state  JSONB,
      ip_address   VARCHAR(45),
      user_agent   TEXT,
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_audit_logs_actor      ON audit_logs(actor_id);
    CREATE INDEX idx_audit_logs_action     ON audit_logs(action);
    CREATE INDEX idx_audit_logs_entity     ON audit_logs(entity_type, entity_id);
    CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS audit_logs CASCADE;
    DROP TABLE IF EXISTS inventory_movements CASCADE;
    DROP TABLE IF EXISTS simulations CASCADE;
    DROP TABLE IF EXISTS purchase_order_items CASCADE;
    DROP TABLE IF EXISTS purchase_orders CASCADE;
    DROP TABLE IF EXISTS suppliers CASCADE;
  `);
};
