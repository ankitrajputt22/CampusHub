CREATE TABLE reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reporter_id BIGINT NOT NULL,
    report_type VARCHAR(30) NOT NULL,
    reported_entity_id BIGINT NOT NULL,
    listing_id BIGINT,
    reported_user_id BIGINT,
    review_id BIGINT,
    reason VARCHAR(60) NOT NULL,
    description VARCHAR(500),
    status VARCHAR(30) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    admin_response VARCHAR(500),
    reviewed_by_id BIGINT,
    reviewed_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_reports_reporter_type_entity
        UNIQUE (reporter_id, report_type, reported_entity_id),
    CONSTRAINT fk_reports_reporter
        FOREIGN KEY (reporter_id) REFERENCES users(id),
    CONSTRAINT fk_reports_listing
        FOREIGN KEY (listing_id) REFERENCES listings(id),
    CONSTRAINT fk_reports_reported_user
        FOREIGN KEY (reported_user_id) REFERENCES users(id),
    CONSTRAINT fk_reports_review
        FOREIGN KEY (review_id) REFERENCES seller_reviews(id),
    CONSTRAINT fk_reports_reviewed_by
        FOREIGN KEY (reviewed_by_id) REFERENCES users(id)
);

CREATE INDEX idx_reports_queue
    ON reports(status, priority, created_at);

CREATE INDEX idx_reports_target
    ON reports(report_type, reported_entity_id);

CREATE INDEX idx_reports_reporter_created
    ON reports(reporter_id, created_at);

INSERT INTO reports (
    id,
    reporter_id,
    report_type,
    reported_entity_id,
    listing_id,
    reason,
    description,
    status,
    priority,
    created_at,
    updated_at
)
SELECT
    id,
    reporter_id,
    'LISTING',
    listing_id,
    listing_id,
    reason,
    SUBSTRING(description, 1, 500),
    CASE status
        WHEN 'RESOLVED' THEN 'ACTION_TAKEN'
        WHEN 'DISMISSED' THEN 'REJECTED'
        WHEN 'REVIEWED' THEN 'UNDER_REVIEW'
        ELSE 'PENDING'
    END,
    CASE reason
        WHEN 'PROHIBITED_ITEM' THEN 'CRITICAL'
        WHEN 'PRICE_SCAM' THEN 'HIGH'
        WHEN 'SUSPICIOUS_SELLER' THEN 'HIGH'
        WHEN 'FAKE_LISTING' THEN 'HIGH'
        WHEN 'ABUSIVE_CONTENT' THEN 'HIGH'
        WHEN 'WRONG_PRODUCT_DETAILS' THEN 'MEDIUM'
        WHEN 'DUPLICATE_LISTING' THEN 'LOW'
        ELSE 'MEDIUM'
    END,
    created_at,
    updated_at
FROM listing_reports;

ALTER TABLE seller_reviews
    ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'VISIBLE';

ALTER TABLE seller_reviews
    ADD COLUMN updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);

CREATE TABLE moderation_actions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT NOT NULL,
    moderator_id BIGINT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(30) NOT NULL,
    target_id BIGINT NOT NULL,
    previous_state VARCHAR(80),
    new_state VARCHAR(80),
    note VARCHAR(500),
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_moderation_actions_report
        FOREIGN KEY (report_id) REFERENCES reports(id),
    CONSTRAINT fk_moderation_actions_moderator
        FOREIGN KEY (moderator_id) REFERENCES users(id)
);

CREATE INDEX idx_moderation_actions_report_created
    ON moderation_actions(report_id, created_at);

CREATE INDEX idx_moderation_actions_target
    ON moderation_actions(target_type, target_id);
