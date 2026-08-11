ALTER TABLE colleges
    ADD COLUMN created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);

ALTER TABLE colleges
    ADD COLUMN updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);

CREATE INDEX idx_colleges_status
    ON colleges(status);

CREATE INDEX idx_colleges_location
    ON colleges(state, city);

CREATE INDEX idx_users_role_final
    ON users(role);

CREATE INDEX idx_users_status_final
    ON users(status);

CREATE INDEX idx_users_college_final
    ON users(college_id);

ALTER TABLE otp_verifications
    ADD COLUMN otp_type VARCHAR(30) NOT NULL DEFAULT 'SIGNUP';

ALTER TABLE otp_verifications
    ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE otp_verifications
    ADD COLUMN resend_count INT NOT NULL DEFAULT 0;

ALTER TABLE otp_verifications
    ADD COLUMN last_sent_at TIMESTAMP(6);

UPDATE otp_verifications
SET last_sent_at = created_at
WHERE last_sent_at IS NULL;

CREATE INDEX idx_otp_destination_type_status
    ON otp_verifications(destination, otp_type, status);

CREATE INDEX idx_otp_expires_status
    ON otp_verifications(expires_at, status);

ALTER TABLE refresh_tokens
    ADD COLUMN device_info VARCHAR(160);

ALTER TABLE refresh_tokens
    ADD COLUMN ip_address VARCHAR(80);

ALTER TABLE refresh_tokens
    ADD COLUMN user_agent VARCHAR(500);

ALTER TABLE refresh_tokens
    ADD COLUMN revoked_at TIMESTAMP(6);

CREATE INDEX idx_refresh_tokens_expiry_revoked
    ON refresh_tokens(expires_at, revoked);

CREATE TABLE user_notification_preferences (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    marketplace_updates_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    order_updates_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    payment_updates_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    review_updates_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    report_updates_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    support_updates_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    chat_updates_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    security_updates_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_user_notification_preferences_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE user_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    theme VARCHAR(30) NOT NULL DEFAULT 'SYSTEM',
    language VARCHAR(20) NOT NULL DEFAULT 'en',
    default_marketplace_sort VARCHAR(40) NOT NULL DEFAULT 'NEWEST_FIRST',
    compact_cards_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    safe_meetup_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    two_factor_prompt_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
    account_visibility VARCHAR(30) NOT NULL DEFAULT 'COLLEGE_ONLY',
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_user_settings_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    icon_url VARCHAR(500),
    status VARCHAR(30) NOT NULL,
    sort_order INT NOT NULL,
    created_by_user_id BIGINT,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_categories_slug UNIQUE (slug),
    CONSTRAINT fk_categories_created_by
        FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

INSERT INTO categories
    (name, slug, description, icon_url, status, sort_order, created_by_user_id, created_at, updated_at)
SELECT
    name, slug, description, icon_url, status, sort_order, created_by_user_id, created_at, updated_at
FROM platform_categories;

CREATE INDEX idx_categories_status_sort
    ON categories(status, sort_order);

ALTER TABLE listings
    ADD COLUMN category_id BIGINT;

UPDATE listings
SET category_id = (
    SELECT id
    FROM categories
    WHERE LOWER(categories.name) = LOWER(listings.category)
    LIMIT 1
);

ALTER TABLE listings
    ADD COLUMN deleted_at TIMESTAMP(6);

ALTER TABLE listings
    ADD COLUMN sold_at TIMESTAMP(6);

ALTER TABLE listings
    ADD COLUMN expires_at TIMESTAMP(6);

ALTER TABLE listings
    ADD CONSTRAINT fk_listings_category_final
        FOREIGN KEY (category_id) REFERENCES categories(id);

CREATE INDEX idx_listings_category_final
    ON listings(category_id);

CREATE INDEX idx_listings_status_deleted_final
    ON listings(status, deleted_at);

CREATE VIEW user_privacy_settings AS
SELECT
    id,
    user_id,
    show_bio,
    show_linkedin,
    show_github,
    show_hostel_area AS show_hostel,
    show_department,
    show_year_of_study,
    created_at,
    updated_at
FROM profile_privacy_settings;

CREATE VIEW wishlist AS
SELECT
    id,
    user_id,
    listing_id,
    created_at
FROM wishlist_items;

CREATE VIEW orders AS
SELECT
    id,
    order_number,
    listing_id,
    buyer_id,
    seller_id,
    status,
    amount,
    payment_status,
    pickup_location,
    paid_at,
    completed_at,
    cancelled_at,
    created_at,
    updated_at
FROM marketplace_orders;

CREATE VIEW reviews AS
SELECT
    id,
    order_id,
    reviewer_id,
    reviewee_id,
    rating,
    message,
    status,
    created_at,
    updated_at
FROM seller_reviews;

CREATE TABLE user_rating_summary (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    average_rating DECIMAL(3, 2) NOT NULL DEFAULT 0,
    total_reviews INT NOT NULL DEFAULT 0,
    one_star_count INT NOT NULL DEFAULT 0,
    two_star_count INT NOT NULL DEFAULT 0,
    three_star_count INT NOT NULL DEFAULT 0,
    four_star_count INT NOT NULL DEFAULT 0,
    five_star_count INT NOT NULL DEFAULT 0,
    last_review_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_user_rating_summary_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO user_rating_summary
    (user_id, average_rating, total_reviews, one_star_count, two_star_count, three_star_count, four_star_count, five_star_count, last_review_at, created_at, updated_at)
SELECT
    reviewee_id,
    CAST(AVG(rating) AS DECIMAL(3, 2)),
    COUNT(*),
    SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END),
    SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END),
    SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END),
    SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END),
    SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END),
    MAX(created_at),
    CURRENT_TIMESTAMP(6),
    CURRENT_TIMESTAMP(6)
FROM seller_reviews
WHERE status = 'VISIBLE'
GROUP BY reviewee_id;

CREATE INDEX idx_user_rating_summary_average
    ON user_rating_summary(average_rating, total_reviews);

CREATE INDEX idx_notifications_type_final
    ON notifications(type);

CREATE INDEX idx_notifications_related_final
    ON notifications(related_entity_type, related_entity_id);

CREATE INDEX idx_reports_status_final
    ON reports(status);

CREATE INDEX idx_reports_priority_final
    ON reports(priority);

CREATE INDEX idx_reports_reviewed_by_final
    ON reports(reviewed_by_id);

CREATE TABLE report_evidence (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT NOT NULL,
    uploaded_by_user_id BIGINT,
    evidence_type VARCHAR(30) NOT NULL,
    file_url VARCHAR(500),
    storage_file_name VARCHAR(255),
    note VARCHAR(500),
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_report_evidence_report
        FOREIGN KEY (report_id) REFERENCES reports(id),
    CONSTRAINT fk_report_evidence_uploaded_by
        FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_report_evidence_report_created
    ON report_evidence(report_id, created_at);

CREATE VIEW audit_logs AS
SELECT
    admin_audit_logs.id,
    admin_audit_logs.admin_id AS actor_user_id,
    users.role AS actor_role,
    admin_audit_logs.action_type,
    admin_audit_logs.target_type,
    admin_audit_logs.target_id,
    admin_audit_logs.previous_value AS old_value_json,
    admin_audit_logs.new_value AS new_value_json,
    admin_audit_logs.note,
    admin_audit_logs.ip_address,
    admin_audit_logs.user_agent,
    admin_audit_logs.created_at
FROM admin_audit_logs
LEFT JOIN users ON users.id = admin_audit_logs.admin_id;

CREATE TABLE trust_score_penalties (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    source_type VARCHAR(40) NOT NULL,
    source_id BIGINT,
    penalty_points INT NOT NULL,
    reason VARCHAR(120) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP(6),
    created_by_user_id BIGINT,
    resolved_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_trust_score_penalties_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_trust_score_penalties_created_by
        FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_trust_score_penalties_user_active
    ON trust_score_penalties(user_id, active);

CREATE INDEX idx_trust_score_penalties_source
    ON trust_score_penalties(source_type, source_id);

CREATE VIEW conversations AS
SELECT
    id,
    conversation_number,
    listing_id,
    order_id,
    buyer_id,
    seller_id,
    college_id,
    status,
    last_message_id,
    last_message_at,
    created_at,
    updated_at
FROM chat_conversations;

CREATE VIEW conversation_participants AS
SELECT
    id,
    conversation_id,
    user_id,
    participant_role,
    last_read_message_id,
    last_read_at,
    unread_count,
    is_archived,
    is_muted,
    created_at,
    updated_at
FROM chat_conversation_participants;

CREATE TABLE account_deactivation_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    reason VARCHAR(500),
    status VARCHAR(30) NOT NULL,
    reviewed_by_user_id BIGINT,
    reviewed_at TIMESTAMP(6),
    scheduled_deletion_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_deactivation_requests_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_deactivation_requests_reviewed_by
        FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_deactivation_requests_user_status
    ON account_deactivation_requests(user_id, status);

CREATE INDEX idx_deactivation_requests_status_created
    ON account_deactivation_requests(status, created_at);

CREATE TABLE user_legal_acceptances (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    document_type VARCHAR(40) NOT NULL,
    document_version VARCHAR(40) NOT NULL,
    accepted_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ip_address VARCHAR(80),
    user_agent VARCHAR(500),
    CONSTRAINT uk_legal_acceptance_user_doc_version
        UNIQUE (user_id, document_type, document_version),
    CONSTRAINT fk_legal_acceptances_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_legal_acceptances_user_doc
    ON user_legal_acceptances(user_id, document_type);

CREATE TABLE schema_table_registry (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    module_name VARCHAR(80) NOT NULL,
    canonical_table_name VARCHAR(80) NOT NULL,
    physical_table_name VARCHAR(80) NOT NULL,
    purpose VARCHAR(500) NOT NULL,
    ownership_rule VARCHAR(500) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT uk_schema_registry_canonical
        UNIQUE (canonical_table_name)
);

INSERT INTO schema_table_registry
    (module_name, canonical_table_name, physical_table_name, purpose, ownership_rule)
VALUES
    ('Users and Authentication', 'users', 'users', 'Stores students, admins, and super admins with hashed passwords and account status.', 'Backend derives authenticated user identity from JWT.'),
    ('Colleges and Campus', 'colleges', 'colleges', 'Stores active and inactive college records for signup, browsing, and admin management.', 'Students select a college at signup; protected actions use the stored user college.'),
    ('OTP Verification', 'otp_verifications', 'otp_verifications', 'Stores hashed OTP records, resend counts, expiry, and usage status.', 'OTP values are never stored in plain text.'),
    ('Sessions', 'refresh_tokens', 'refresh_tokens', 'Stores hashed refresh tokens and revocation state.', 'Raw refresh tokens are never persisted.'),
    ('Privacy', 'user_privacy_settings', 'profile_privacy_settings', 'Controls what profile data is publicly visible.', 'Visibility is enforced by backend profile responses.'),
    ('Settings', 'user_notification_preferences', 'user_notification_preferences', 'Stores per-user notification channel preferences.', 'Only the authenticated user or an admin policy can update preferences.'),
    ('Settings', 'user_settings', 'user_settings', 'Stores per-user app settings and safety reminder preferences.', 'Only the authenticated user can update their settings.'),
    ('Marketplace', 'categories', 'categories', 'Stores global marketplace categories controlled by super admins.', 'Students can reference active categories; super admins manage category lifecycle.'),
    ('Marketplace', 'listings', 'listings', 'Stores item listings, seller ownership, college scope, status, and soft-delete timestamps.', 'Seller and college are derived from the authenticated user.'),
    ('Wishlist', 'wishlist', 'wishlist_items', 'Stores one wishlist row per user and listing.', 'Wishlist user_id is derived from JWT.'),
    ('Orders', 'orders', 'marketplace_orders', 'Stores buyer, seller, listing, order number, payment status, and lifecycle timestamps.', 'Buyer, seller, listing, and payment state are derived and validated by backend.'),
    ('Payments', 'payments', 'payments', 'Stores Razorpay order/payment identifiers and payment status without card data or secrets.', 'Payment status is set only after server-side verification.'),
    ('Reviews', 'reviews', 'seller_reviews', 'Stores completed-order reviews and moderation visibility status.', 'Reviews are accepted only for verified completed order participants.'),
    ('Reviews', 'user_rating_summary', 'user_rating_summary', 'Stores denormalized seller rating totals for fast profile and marketplace reads.', 'Summary values are derived from visible reviews.'),
    ('Notifications', 'notifications', 'notifications', 'Stores user-facing notifications separate from source business events.', 'Notification recipient is selected by backend event logic.'),
    ('Reports', 'reports', 'reports', 'Stores report queue records independent of moderation action decisions.', 'Reporter is derived from JWT; targets are validated by backend.'),
    ('Reports', 'report_evidence', 'report_evidence', 'Stores optional evidence metadata for reports.', 'Files are stored externally; database stores URLs and storage keys only.'),
    ('Moderation', 'moderation_actions', 'moderation_actions', 'Stores moderation decisions linked to reports and moderators.', 'Moderator identity is derived from admin JWT.'),
    ('Audit', 'audit_logs', 'admin_audit_logs', 'Canonical audit view over append-only admin audit records.', 'Audit rows are append-only and capture actor, target, and before/after values.'),
    ('Support', 'support_tickets', 'support_tickets', 'Stores public and signed-in support requests with assignment and status.', 'Authenticated ticket user is derived from JWT; guest tickets never get protected user ownership.'),
    ('Support', 'support_ticket_replies', 'support_ticket_replies', 'Stores support conversation replies and internal notes.', 'Reply sender is derived from authenticated user or public guest context.'),
    ('Chat', 'conversations', 'chat_conversations', 'Stores marketplace buyer-seller conversations.', 'Participants are derived from listing/order relationships.'),
    ('Chat', 'chat_messages', 'chat_messages', 'Stores conversation messages with soft-delete status.', 'Sender and receiver are validated against conversation participants.'),
    ('Trust Score', 'trust_scores', 'trust_scores', 'Stores current trust score and component scores.', 'Scores are calculated by backend only.'),
    ('Trust Score', 'trust_score_history', 'trust_score_history', 'Stores trust score recalculation history.', 'History is generated by trust-score service events.'),
    ('Trust Score', 'trust_score_penalties', 'trust_score_penalties', 'Stores active and expired trust score penalties.', 'Penalties are created by moderation/admin flows only.'),
    ('Admin and Super Admin', 'platform_settings', 'platform_settings', 'Stores safe platform-level feature flags and limits.', 'Only super admins can update platform settings.'),
    ('Account Lifecycle', 'account_deactivation_requests', 'account_deactivation_requests', 'Stores account deactivation requests and review status.', 'User identity is derived from JWT; admin review is audited.'),
    ('Legal', 'user_legal_acceptances', 'user_legal_acceptances', 'Optionally stores accepted legal document versions.', 'Acceptance is recorded server-side with document version metadata.');
