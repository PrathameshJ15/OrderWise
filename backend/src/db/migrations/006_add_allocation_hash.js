exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE allocation_runs ADD COLUMN IF NOT EXISTS input_hash VARCHAR(64);
    CREATE INDEX IF NOT EXISTS idx_allocation_runs_input_hash ON allocation_runs(input_hash);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_allocation_runs_input_hash;
    ALTER TABLE allocation_runs DROP COLUMN IF EXISTS input_hash;
  `);
};
