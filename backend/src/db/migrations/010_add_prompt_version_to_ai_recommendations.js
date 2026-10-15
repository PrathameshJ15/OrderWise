exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE ai_recommendations
    ADD COLUMN IF NOT EXISTS prompt_version VARCHAR(50) NOT NULL DEFAULT 'v1.0.0';

    CREATE INDEX IF NOT EXISTS idx_ai_rec_prompt_version ON ai_recommendations(prompt_version);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_ai_rec_prompt_version;
    ALTER TABLE ai_recommendations
    DROP COLUMN IF EXISTS prompt_version;
  `);
};
