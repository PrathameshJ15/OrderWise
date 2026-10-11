exports.up = (pgm) => {
  pgm.sql(`
    -- USERS
    CREATE TABLE users (
      id            BIGSERIAL PRIMARY KEY,
      name          VARCHAR(255) NOT NULL,
      email         VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role          VARCHAR(50)  NOT NULL DEFAULT 'customer'
                                 CHECK (role IN ('customer', 'admin', 'inventory_manager')),
      active        BOOLEAN      NOT NULL DEFAULT true,
      created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_role  ON users(role);

    -- PRODUCTS
    CREATE TABLE products (
      id          BIGSERIAL    PRIMARY KEY,
      sku         VARCHAR(100) NOT NULL UNIQUE,
      name        VARCHAR(255) NOT NULL,
      description TEXT,
      unit        VARCHAR(50)  NOT NULL DEFAULT 'units',
      active      BOOLEAN      NOT NULL DEFAULT true,
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_products_sku    ON products(sku);
    CREATE INDEX idx_products_active ON products(active);

    -- INVENTORY (with optimistic locking version column)
    CREATE TABLE inventory (
      product_id         BIGINT      NOT NULL PRIMARY KEY REFERENCES products(id) ON DELETE RESTRICT,
      on_hand_quantity   INTEGER     NOT NULL DEFAULT 0 CHECK (on_hand_quantity >= 0),
      reserved_quantity  INTEGER     NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
      safety_stock       INTEGER     NOT NULL DEFAULT 0 CHECK (safety_stock >= 0),
      reorder_point      INTEGER     NOT NULL DEFAULT 0 CHECK (reorder_point >= 0),
      version            INTEGER     NOT NULL DEFAULT 1 CHECK (version >= 1),
      updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_by         BIGINT      REFERENCES users(id) ON DELETE SET NULL,

      CONSTRAINT chk_reserved_lte_on_hand
        CHECK (reserved_quantity <= on_hand_quantity)
    );

    -- ORDERS
    CREATE TABLE orders (
      id                     BIGSERIAL    PRIMARY KEY,
      customer_id            BIGINT       NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      status                 VARCHAR(50)  NOT NULL DEFAULT 'pending'
                                          CHECK (status IN (
                                            'pending', 'confirmed', 'allocated',
                                            'partially_allocated', 'shipped',
                                            'completed', 'cancelled'
                                          )),
      promised_delivery_date DATE,
      business_notes         TEXT,
      created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_orders_customer_id ON orders(customer_id);
    CREATE INDEX idx_orders_status      ON orders(status);
    CREATE INDEX idx_orders_created_at  ON orders(created_at);
    CREATE INDEX idx_orders_allocation_sort 
      ON orders (status, promised_delivery_date ASC NULLS LAST, created_at ASC, id ASC);

    -- ORDER ITEMS
    CREATE TABLE order_items (
      id                          BIGSERIAL PRIMARY KEY,
      order_id                    BIGINT    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id                  BIGINT    NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      requested_quantity          INTEGER   NOT NULL CHECK (requested_quantity > 0),
      minimum_acceptable_quantity INTEGER   NOT NULL
                                            CHECK (minimum_acceptable_quantity > 0 AND minimum_acceptable_quantity <= requested_quantity),
      partial_delivery_allowed    BOOLEAN   NOT NULL DEFAULT true,
      created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      UNIQUE (order_id, product_id)
    );

    CREATE INDEX idx_order_items_order_id   ON order_items(order_id);
    CREATE INDEX idx_order_items_product_id ON order_items(product_id);

    -- ORDER PRIORITIES
    CREATE TABLE order_priorities (
      id                BIGSERIAL   PRIMARY KEY,
      order_id          BIGINT      NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
      approved_priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM'
                                    CHECK (approved_priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
      priority_rank     INTEGER     NOT NULL DEFAULT 2
                                    CHECK (priority_rank BETWEEN 1 AND 4),
      notes             TEXT,
      approved_by       BIGINT      REFERENCES users(id) ON DELETE SET NULL,
      approved_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_order_priorities_order_id ON order_priorities(order_id);
    CREATE INDEX idx_order_priorities_rank     ON order_priorities(priority_rank DESC);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS order_priorities CASCADE;
    DROP TABLE IF EXISTS order_items CASCADE;
    DROP TABLE IF EXISTS orders CASCADE;
    DROP TABLE IF EXISTS inventory CASCADE;
    DROP TABLE IF EXISTS products CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);
};
