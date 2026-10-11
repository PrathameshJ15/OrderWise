exports.up = (pgm) => {
  pgm.sql(`
    -- ALLOCATION RUNS
    CREATE TABLE allocation_runs (
      id                              BIGSERIAL    PRIMARY KEY,
      run_type                        VARCHAR(50)  NOT NULL DEFAULT 'manual'
                                                   CHECK (run_type IN ('manual', 'scheduled', 'simulation')),
      status                          VARCHAR(50)  NOT NULL DEFAULT 'in_progress'
                                                   CHECK (status IN ('in_progress', 'completed', 'failed')),
      total_orders_considered         INTEGER      NOT NULL DEFAULT 0,
      total_items_considered          INTEGER      NOT NULL DEFAULT 0,
      total_items_fulfilled           INTEGER      NOT NULL DEFAULT 0,
      total_items_partially_fulfilled INTEGER      NOT NULL DEFAULT 0,
      total_items_deferred            INTEGER      NOT NULL DEFAULT 0,
      duration_ms                     INTEGER,
      initiated_by                    BIGINT       REFERENCES users(id) ON DELETE SET NULL,
      notes                           TEXT,
      created_at                      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      completed_at                    TIMESTAMPTZ
    );

    CREATE INDEX idx_allocation_runs_created_at ON allocation_runs(created_at);
    CREATE INDEX idx_allocation_runs_status     ON allocation_runs(status);

    -- ALLOCATION RESULTS (with Unique constraint to prevent duplicates & check constraints)
    CREATE TABLE allocation_results (
      id                 BIGSERIAL   PRIMARY KEY,
      allocation_run_id  BIGINT      NOT NULL REFERENCES allocation_runs(id) ON DELETE CASCADE,
      order_item_id      BIGINT      NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
      requested_quantity INTEGER     NOT NULL CHECK (requested_quantity > 0),
      allocated_quantity INTEGER     NOT NULL CHECK (allocated_quantity >= 0),
      status             VARCHAR(50) NOT NULL
                                     CHECK (status IN ('fulfilled', 'partially_fulfilled', 'deferred')),
      explanation        JSONB       NOT NULL,
      created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      CONSTRAINT chk_allocated_lte_requested
        CHECK (allocated_quantity <= requested_quantity),

      -- Unique constraint per Phase 2 requirement:
      CONSTRAINT uq_allocation_run_order_item
        UNIQUE (allocation_run_id, order_item_id)
    );

    CREATE INDEX idx_allocation_results_run_id  ON allocation_results(allocation_run_id);
    CREATE INDEX idx_allocation_results_item_id ON allocation_results(order_item_id);
    CREATE INDEX idx_allocation_results_status  ON allocation_results(status);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS allocation_results CASCADE;
    DROP TABLE IF EXISTS allocation_runs CASCADE;
  `);
};
