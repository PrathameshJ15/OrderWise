exports.up = (pgm) => {
  pgm.sql(`
    -- AI RECOMMENDATIONS
    CREATE TABLE ai_recommendations (
      id                 BIGSERIAL    PRIMARY KEY,
      order_id           BIGINT       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      suggested_priority VARCHAR(20)  NOT NULL
                                      CHECK (suggested_priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
      suggested_rank     INTEGER      NOT NULL
                                      CHECK (suggested_rank BETWEEN 1 AND 4),
      confidence         VARCHAR(20)  NOT NULL
                                      CHECK (confidence IN ('high', 'medium', 'low')),
      explanation        TEXT         NOT NULL,
      evidence           TEXT,
      warning            TEXT,
      provider           VARCHAR(50)  NOT NULL DEFAULT 'groq',
      model              VARCHAR(100) NOT NULL DEFAULT 'llama3-70b-8192',
      status             VARCHAR(50)  NOT NULL DEFAULT 'pending'
                                      CHECK (status IN (
                                        'pending', 'approved', 'overridden',
                                        'rejected', 'superseded'
                                      )),
      created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_ai_rec_order_id ON ai_recommendations(order_id);
    CREATE INDEX idx_ai_rec_status   ON ai_recommendations(status);

    -- PRIORITY APPROVALS (Human Governance)
    CREATE TABLE priority_approvals (
      id                BIGSERIAL   PRIMARY KEY,
      order_id          BIGINT      NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      recommendation_id BIGINT      REFERENCES ai_recommendations(id) ON DELETE SET NULL,
      decision          VARCHAR(20) NOT NULL
                                    CHECK (decision IN ('approved', 'overridden', 'rejected')),
      final_priority    VARCHAR(20) NOT NULL
                                    CHECK (final_priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
      final_rank        INTEGER     NOT NULL
                                    CHECK (final_rank BETWEEN 1 AND 4),
      override_reason   TEXT,
      reviewed_by       BIGINT      NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_approvals_order_id    ON priority_approvals(order_id);
    CREATE INDEX idx_approvals_reviewed_by ON priority_approvals(reviewed_by);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS priority_approvals CASCADE;
    DROP TABLE IF EXISTS ai_recommendations CASCADE;
  `);
};
