exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS alerts (
      id                  BIGSERIAL    PRIMARY KEY,
      alert_type          VARCHAR(60)  NOT NULL,
      severity            VARCHAR(20)  NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
      title               VARCHAR(255) NOT NULL,
      description         TEXT         NOT NULL,
      product_id          BIGINT       REFERENCES products(id) ON DELETE SET NULL,
      order_id            BIGINT       REFERENCES orders(id) ON DELETE SET NULL,
      purchase_order_id   BIGINT       REFERENCES purchase_orders(id) ON DELETE SET NULL,
      recommended_action  TEXT         NOT NULL DEFAULT '',
      condition_key       VARCHAR(255) NOT NULL DEFAULT '',
      status              VARCHAR(20)  NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
      resolved            BOOLEAN      NOT NULL DEFAULT false,
      acknowledged_at     TIMESTAMPTZ,
      acknowledged_by     BIGINT       REFERENCES users(id) ON DELETE SET NULL,
      resolved_at         TIMESTAMPTZ,
      resolved_by         BIGINT       REFERENCES users(id) ON DELETE SET NULL,
      metadata            JSONB        DEFAULT '{}'::jsonb,
      created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    ALTER TABLE alerts ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT false;
    CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_alerts_resolved;
    ALTER TABLE alerts DROP COLUMN IF EXISTS resolved;
  `);
};
