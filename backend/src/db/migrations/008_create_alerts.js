exports.up = (pgm) => {
  pgm.sql(`
    -- Ensure resolved column exists if table was created by alternate schema
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
