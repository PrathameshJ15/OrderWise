exports.up = (pgm) => {
  pgm.sql(`
    -- ALERTS TABLE
    CREATE TABLE IF NOT EXISTS alerts (
      id                  BIGSERIAL    PRIMARY KEY,
      alert_type          VARCHAR(60)  NOT NULL
                                       CHECK (alert_type IN (
                                         'low_stock',
                                         'potential_stockout',
                                         'below_reorder_point',
                                         'order_at_risk',
                                         'supplier_delay',
                                         'allocation_change_competing'
                                       )),
      severity            VARCHAR(20)  NOT NULL
                                       CHECK (severity IN ('info', 'warning', 'critical')),
      title               VARCHAR(255) NOT NULL,
      description         TEXT         NOT NULL,
      product_id          BIGINT       REFERENCES products(id) ON DELETE SET NULL,
      order_id            BIGINT       REFERENCES orders(id) ON DELETE SET NULL,
      purchase_order_id   BIGINT       REFERENCES purchase_orders(id) ON DELETE SET NULL,
      recommended_action  TEXT         NOT NULL,
      condition_key       VARCHAR(255) NOT NULL,
      status              VARCHAR(20)  NOT NULL DEFAULT 'active'
                                       CHECK (status IN ('active', 'acknowledged', 'resolved')),
      acknowledged_at     TIMESTAMPTZ,
      acknowledged_by     BIGINT       REFERENCES users(id) ON DELETE SET NULL,
      resolved_at         TIMESTAMPTZ,
      resolved_by         BIGINT       REFERENCES users(id) ON DELETE SET NULL,
      metadata            JSONB,
      created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_alerts_status      ON alerts(status);
    CREATE INDEX IF NOT EXISTS idx_alerts_severity    ON alerts(severity);
    CREATE INDEX IF NOT EXISTS idx_alerts_alert_type  ON alerts(alert_type);
    CREATE INDEX IF NOT EXISTS idx_alerts_product_id  ON alerts(product_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_order_id    ON alerts(order_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_created_at  ON alerts(created_at);

    -- DEDUPLICATION CONSTRAINT: Active/unresolved condition key must be unique
    CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_unique_active_condition
      ON alerts (condition_key)
      WHERE status != 'resolved';

    -- LINK PRODUCTS TO DEFAULT SUPPLIER AND LEAD TIME
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS default_supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS default_lead_time_days INTEGER DEFAULT 7 CHECK (default_lead_time_days >= 0);

    ALTER TABLE purchase_orders
      ADD COLUMN IF NOT EXISTS notes TEXT;

    CREATE INDEX IF NOT EXISTS idx_products_default_supplier ON products(default_supplier_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS alerts CASCADE;
    ALTER TABLE products
      DROP COLUMN IF EXISTS default_supplier_id,
      DROP COLUMN IF EXISTS default_lead_time_days;
  `);
};
