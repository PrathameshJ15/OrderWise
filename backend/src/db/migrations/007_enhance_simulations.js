exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE simulations DROP CONSTRAINT IF EXISTS simulations_scenario_type_check;
    ALTER TABLE simulations ADD CONSTRAINT simulations_scenario_type_check
      CHECK (scenario_type IN (
        'inventory_increase', 'inventory_decrease',
        'demand_surge', 'supplier_delay', 'priority_change', 'chained'
      ));

    ALTER TABLE simulations ADD COLUMN IF NOT EXISTS name VARCHAR(255);
    ALTER TABLE simulations ADD COLUMN IF NOT EXISTS description TEXT;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE simulations DROP COLUMN IF EXISTS description;
    ALTER TABLE simulations DROP COLUMN IF EXISTS name;
    ALTER TABLE simulations DROP CONSTRAINT IF EXISTS simulations_scenario_type_check;
    ALTER TABLE simulations ADD CONSTRAINT simulations_scenario_type_check
      CHECK (scenario_type IN (
        'inventory_increase', 'inventory_decrease',
        'demand_surge', 'supplier_delay', 'priority_change'
      ));
  `);
};
