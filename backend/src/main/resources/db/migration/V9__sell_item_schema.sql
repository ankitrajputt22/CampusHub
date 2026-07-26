ALTER TABLE listings
    ADD COLUMN available_quantity INT NOT NULL DEFAULT 1;

ALTER TABLE listings
    ADD COLUMN additional_notes VARCHAR(500);

CREATE TABLE listing_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    listing_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    storage_file_name VARCHAR(255) NOT NULL,
    display_order INT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_listing_images_listing_order
        UNIQUE (listing_id, display_order),
    CONSTRAINT fk_listing_images_listing
        FOREIGN KEY (listing_id) REFERENCES listings(id)
);

CREATE INDEX idx_listing_images_listing_order
    ON listing_images(listing_id, display_order);
