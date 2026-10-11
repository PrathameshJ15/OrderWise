exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE alerts (
      id               BIGSERIAL    PRIMARY KEY,
      alert_type       VARCHAR(50)  NOT NULL
                                    CHECK (alert_type IN (
                                      'low_inventory', 'product_shortage',
                                      'order_at_risk', 'supplier_delay',
                                      'below_reorder_point', 'allocation_status_change',
                                      'priority_change_impact', 'replenishment_required'
                                    )),
      severity         VARCHAR(20)  NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
      title            VARCHAR(255) NOT NULL,
      description      TEXT         NOT NULL,
      suggested_action TEXT,
      product_id       BIGINT       REFERENCES products(id) ON DELETE SET NULL,
      order_id         BIGINT       REFERENCES orders(id) ON DELETE SET NULL,
      resolved         BOOLEAN      NOT NULL DEFAULT false,
      resolved_at      TIMESTAMPTZ,
      resolved_by      BIGINT       REFERENCES users(id) ON DELETE SET NULL,
      metadata         JSONB        NOT NULL DEFAULT '{}'::jsonb,
      created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_alerts_resolved   ON alerts(resolved);
    CREATE INDEX idx_alerts_severity   ON alerts(severity);
    CREATE INDEX idx_alerts_product_id ON alerts(product_id);
    CREATE INDEX idx_alerts_order_id   ON alerts(order_id);
    CREATE INDEX idx_alerts_created_at ON alerts(created_at);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS alerts CASCADE;
  `);
};
