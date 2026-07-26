ALTER TABLE listings
    ADD COLUMN view_count BIGINT NOT NULL DEFAULT 0;

CREATE INDEX idx_listings_seller_status_updated
    ON listings(seller_id, status, updated_at);
