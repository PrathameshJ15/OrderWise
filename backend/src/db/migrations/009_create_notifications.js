exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS notifications (
      id         BIGSERIAL    PRIMARY KEY,
      user_id    BIGINT       REFERENCES users(id) ON DELETE CASCADE,
      role       VARCHAR(50),
      event_type VARCHAR(100) NOT NULL,
      title      VARCHAR(255) NOT NULL,
      message    TEXT         NOT NULL,
      data       JSONB        NOT NULL DEFAULT '{}'::jsonb,
      read       BOOLEAN      NOT NULL DEFAULT false,
      read_at    TIMESTAMPTZ,
      created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS notifications CASCADE;
  `);
};
