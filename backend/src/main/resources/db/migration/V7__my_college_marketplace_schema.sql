ALTER TABLE listings
    ADD COLUMN description VARCHAR(2000) NOT NULL
        DEFAULT 'Contact the seller for more information about this item.';

ALTER TABLE listings
    ADD COLUMN pickup_location VARCHAR(160) NOT NULL DEFAULT 'Campus pickup';

ALTER TABLE listings
    ADD COLUMN negotiable BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_listings_college_status_category
    ON listings(college_id, status, category);

CREATE INDEX idx_listings_college_status_price
    ON listings(college_id, status, price);
