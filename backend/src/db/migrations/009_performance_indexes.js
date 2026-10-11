/**
 * Migration 009 — Performance Indexes
 *
 * Derived from EXPLAIN ANALYZE output on the allocation engine hot paths
 * and the admin order-list queries at scale (5 000+ orders, 200 products).
 *
 * All indexes created with IF NOT EXISTS so the migration is idempotent.
 * CONCURRENTLY is intentionally omitted here because we run inside a
 * transaction (node-pg-migrate default).  For production live traffic use
 * CREATE INDEX CONCURRENTLY in a separate session outside a transaction.
 */

exports.up = (pgm) => {
  // ── order_items ─────────────────────────────────────────────────────────
  // Allocation engine: WHERE oi.product_id = $1 AND o.status IN (...)
  pgm.createIndex('order_items', ['product_id', 'order_id'], {
    name: 'idx_order_items_product_order',
    ifNotExists: true,
  });

  // Admin order-item lookups by order
  pgm.createIndex('order_items', ['order_id'], {
    name: 'idx_order_items_order_id',
    ifNotExists: true,
  });

  // ── orders ───────────────────────────────────────────────────────────────
  // Customer portal: WHERE customer_id = $1 ORDER BY created_at DESC
  pgm.createIndex('orders', ['customer_id', 'created_at'], {
    name: 'idx_orders_customer_created',
    ifNotExists: true,
  });

  // Admin list: WHERE status = $1 ORDER BY created_at DESC
  pgm.createIndex('orders', ['status', 'created_at'], {
    name: 'idx_orders_status_created',
    ifNotExists: true,
  });

  // ── allocation_results ───────────────────────────────────────────────────
  // LATERAL join in customer portal: WHERE order_item_id = $1 ORDER BY created_at DESC
  pgm.createIndex('allocation_results', ['order_item_id', 'created_at'], {
    name: 'idx_alloc_results_item_created',
    ifNotExists: true,
  });

  // Impact analyser / run detail: WHERE allocation_run_id = $1
  pgm.createIndex('allocation_results', ['allocation_run_id'], {
    name: 'idx_alloc_results_run_id',
    ifNotExists: true,
  });

  // ── allocation_runs ──────────────────────────────────────────────────────
  // History list: ORDER BY id DESC (already PK but explicit for planner)
  pgm.createIndex('allocation_runs', ['created_at'], {
    name: 'idx_allocation_runs_created',
    ifNotExists: true,
  });

  // ── order_priorities ─────────────────────────────────────────────────────
  // Allocation join: JOIN order_priorities op ON op.order_id = o.id
  pgm.createIndex('order_priorities', ['order_id'], {
    name: 'idx_order_priorities_order_id',
    ifNotExists: true,
  });

  // Sort key for allocation engine: priority_rank DESC
  pgm.createIndex('order_priorities', ['priority_rank'], {
    name: 'idx_order_priorities_rank',
    ifNotExists: true,
  });

  // ── inventory ────────────────────────────────────────────────────────────
  // Allocation engine: WHERE product_id = $1 FOR UPDATE
  pgm.createIndex('inventory', ['product_id'], {
    name: 'idx_inventory_product_id',
    ifNotExists: true,
  });

  // ── inventory_movements ──────────────────────────────────────────────────
  pgm.createIndex('inventory_movements', ['product_id', 'created_at'], {
    name: 'idx_inv_movements_product_created',
    ifNotExists: true,
  });

  // ── products — full-text search helper ───────────────────────────────────
  pgm.createIndex('products', ['active', 'name'], {
    name: 'idx_products_active_name',
    ifNotExists: true,
  });
};

exports.down = (pgm) => {
  pgm.dropIndex('order_items', ['product_id', 'order_id'], { name: 'idx_order_items_product_order', ifExists: true });
  pgm.dropIndex('order_items', ['order_id'], { name: 'idx_order_items_order_id', ifExists: true });
  pgm.dropIndex('orders', ['customer_id', 'created_at'], { name: 'idx_orders_customer_created', ifExists: true });
  pgm.dropIndex('orders', ['status', 'created_at'], { name: 'idx_orders_status_created', ifExists: true });
  pgm.dropIndex('allocation_results', ['order_item_id', 'created_at'], { name: 'idx_alloc_results_item_created', ifExists: true });
  pgm.dropIndex('allocation_results', ['allocation_run_id'], { name: 'idx_alloc_results_run_id', ifExists: true });
  pgm.dropIndex('allocation_runs', ['created_at'], { name: 'idx_allocation_runs_created', ifExists: true });
  pgm.dropIndex('order_priorities', ['order_id'], { name: 'idx_order_priorities_order_id', ifExists: true });
  pgm.dropIndex('order_priorities', ['priority_rank'], { name: 'idx_order_priorities_rank', ifExists: true });
  pgm.dropIndex('inventory', ['product_id'], { name: 'idx_inventory_product_id', ifExists: true });
  pgm.dropIndex('inventory_movements', ['product_id', 'created_at'], { name: 'idx_inv_movements_product_created', ifExists: true });
  pgm.dropIndex('products', ['active', 'name'], { name: 'idx_products_active_name', ifExists: true });
};
