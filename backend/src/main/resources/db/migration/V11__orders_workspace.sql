ALTER TABLE marketplace_orders
    ADD COLUMN order_number VARCHAR(40);

ALTER TABLE marketplace_orders
    ADD COLUMN amount DECIMAL(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE marketplace_orders
    ADD COLUMN payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING';

ALTER TABLE marketplace_orders
    ADD COLUMN pickup_location VARCHAR(160) NOT NULL DEFAULT 'Campus pickup point';

ALTER TABLE marketplace_orders
    ADD COLUMN paid_at TIMESTAMP(6);

ALTER TABLE marketplace_orders
    ADD COLUMN completed_at TIMESTAMP(6);

ALTER TABLE marketplace_orders
    ADD COLUMN cancelled_at TIMESTAMP(6);

UPDATE marketplace_orders
SET order_number = CONCAT('CH-ORD-LEGACY-', id);

UPDATE marketplace_orders
SET amount = (
    SELECT price
    FROM listings
    WHERE listings.id = marketplace_orders.listing_id
);

UPDATE marketplace_orders
SET pickup_location = (
    SELECT pickup_location
    FROM listings
    WHERE listings.id = marketplace_orders.listing_id
);

CREATE UNIQUE INDEX uk_orders_order_number
    ON marketplace_orders(order_number);

CREATE INDEX idx_orders_buyer_status_created
    ON marketplace_orders(buyer_id, status, created_at);

CREATE INDEX idx_orders_seller_status_created
    ON marketplace_orders(seller_id, status, created_at);

CREATE TABLE order_status_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by BIGINT NOT NULL,
    note VARCHAR(300),
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_order_history_order FOREIGN KEY (order_id)
        REFERENCES marketplace_orders(id),
    CONSTRAINT fk_order_history_user FOREIGN KEY (changed_by)
        REFERENCES users(id)
);

CREATE INDEX idx_order_history_order_created
    ON order_status_history(order_id, created_at);
