ALTER TABLE users ADD COLUMN bio VARCHAR(500);
ALTER TABLE users ADD COLUMN linkedin_url VARCHAR(255);
ALTER TABLE users ADD COLUMN github_url VARCHAR(255);

CREATE TABLE listings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    seller_id BIGINT NOT NULL,
    college_id BIGINT NOT NULL,
    title VARCHAR(180) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    item_condition VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    primary_image_url VARCHAR(500),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_listings_seller FOREIGN KEY (seller_id) REFERENCES users(id),
    CONSTRAINT fk_listings_college FOREIGN KEY (college_id) REFERENCES colleges(id)
);

CREATE TABLE wishlist_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    listing_id BIGINT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_wishlist_user_listing UNIQUE (user_id, listing_id),
    CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_wishlist_listing FOREIGN KEY (listing_id) REFERENCES listings(id)
);

CREATE TABLE marketplace_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    listing_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_orders_listing FOREIGN KEY (listing_id) REFERENCES listings(id),
    CONSTRAINT fk_orders_buyer FOREIGN KEY (buyer_id) REFERENCES users(id),
    CONSTRAINT fk_orders_seller FOREIGN KEY (seller_id) REFERENCES users(id)
);

CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(30) NOT NULL,
    title VARCHAR(160) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE user_activities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(40) NOT NULL,
    message VARCHAR(500) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_user_activities_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_listings_college_status_created
    ON listings(college_id, status, created_at);
CREATE INDEX idx_listings_seller_status
    ON listings(seller_id, status);
CREATE INDEX idx_wishlist_user
    ON wishlist_items(user_id);
CREATE INDEX idx_orders_buyer
    ON marketplace_orders(buyer_id);
CREATE INDEX idx_orders_seller_status
    ON marketplace_orders(seller_id, status);
CREATE INDEX idx_notifications_user_read_created
    ON notifications(user_id, is_read, created_at);
CREATE INDEX idx_activities_user_created
    ON user_activities(user_id, created_at);
