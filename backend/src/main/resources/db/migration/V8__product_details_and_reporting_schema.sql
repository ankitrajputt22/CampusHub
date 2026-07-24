CREATE TABLE listing_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    listing_id BIGINT NOT NULL,
    reporter_id BIGINT NOT NULL,
    reason VARCHAR(50) NOT NULL,
    description VARCHAR(1000),
    status VARCHAR(40) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_listing_reports_reporter_listing
        UNIQUE (reporter_id, listing_id),
    CONSTRAINT fk_listing_reports_listing
        FOREIGN KEY (listing_id) REFERENCES listings(id),
    CONSTRAINT fk_listing_reports_reporter
        FOREIGN KEY (reporter_id) REFERENCES users(id)
);

CREATE INDEX idx_listing_reports_status_created
    ON listing_reports(status, created_at);

CREATE INDEX idx_listing_reports_listing
    ON listing_reports(listing_id);
