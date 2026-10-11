exports.up = (pgm) => {
  pgm.sql(`
    -- Add idempotency_key to orders
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255) UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders(idempotency_key);

    -- General idempotency store
    CREATE TABLE IF NOT EXISTS idempotency_keys (
      key           VARCHAR(255) PRIMARY KEY,
      user_id       BIGINT       REFERENCES users(id) ON DELETE CASCADE,
      endpoint      VARCHAR(255) NOT NULL,
      status_code   INTEGER      NOT NULL,
      response_body JSONB        NOT NULL,
      created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON idempotency_keys(created_at);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS idempotency_keys CASCADE;
    ALTER TABLE orders DROP COLUMN IF EXISTS idempotency_key;
  `);
};
