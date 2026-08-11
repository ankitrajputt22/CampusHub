ALTER TABLE users
    ADD COLUMN created_by_user_id BIGINT;

ALTER TABLE users
    ADD CONSTRAINT fk_users_created_by_user
        FOREIGN KEY (created_by_user_id) REFERENCES users(id);

CREATE INDEX idx_users_role_status_created
    ON users(role, status, created_at);

ALTER TABLE colleges
    MODIFY COLUMN email_domain VARCHAR(120) NULL;

ALTER TABLE colleges
    ADD COLUMN country VARCHAR(100) NOT NULL DEFAULT 'India';

ALTER TABLE colleges
    ADD COLUMN description VARCHAR(500);

CREATE TABLE platform_categories (
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
    CONSTRAINT uk_platform_categories_slug UNIQUE (slug),
    CONSTRAINT fk_platform_categories_created_by
        FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_platform_categories_status_sort
    ON platform_categories(status, sort_order);

INSERT INTO platform_categories
    (name, slug, description, status, sort_order, created_at, updated_at)
VALUES
    ('Books', 'books', 'Textbooks, reference books, and exam preparation material.', 'ACTIVE', 10, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('Notes', 'notes', 'Class notes, handwritten notes, and study material.', 'ACTIVE', 20, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('Electronics', 'electronics', 'Calculators, accessories, gadgets, and approved electronics.', 'ACTIVE', 30, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('Bicycles', 'bicycles', 'Bicycles and campus commute essentials.', 'ACTIVE', 40, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('Hostel Essentials', 'hostel-essentials', 'Hostel room items and student daily-use essentials.', 'ACTIVE', 50, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('Furniture', 'furniture', 'Study tables, chairs, shelves, and small furniture.', 'ACTIVE', 60, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('Lab Equipment', 'lab-equipment', 'Approved lab kits, tools, and academic equipment.', 'ACTIVE', 70, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('Stationery', 'stationery', 'Stationery, drawing sheets, files, and academic supplies.', 'ACTIVE', 80, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('Clothing', 'clothing', 'Uniforms, jackets, and wearable campus essentials.', 'ACTIVE', 90, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('Others', 'others', 'Listings that do not fit another active category.', 'ACTIVE', 100, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

CREATE TABLE platform_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(120) NOT NULL,
    setting_value VARCHAR(1000) NOT NULL,
    setting_type VARCHAR(30) NOT NULL,
    description VARCHAR(500),
    updated_by_user_id BIGINT,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_platform_settings_key UNIQUE (setting_key),
    CONSTRAINT fk_platform_settings_updated_by
        FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
);

INSERT INTO platform_settings
    (setting_key, setting_value, setting_type, description, created_at, updated_at)
VALUES
    ('signupEnabled', 'true', 'BOOLEAN', 'Allow new student signup.', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('marketplaceEnabled', 'true', 'BOOLEAN', 'Allow students to browse marketplace pages.', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('newListingCreationEnabled', 'true', 'BOOLEAN', 'Allow students to create new listings.', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('paymentsEnabled', 'true', 'BOOLEAN', 'Allow payment flows.', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('reviewsEnabled', 'true', 'BOOLEAN', 'Allow completed-order reviews.', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('supportTicketCreationEnabled', 'true', 'BOOLEAN', 'Allow signed-in students to create support tickets.', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('publicContactSupportEnabled', 'true', 'BOOLEAN', 'Allow public contact support submissions.', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('maintenanceMode', 'false', 'BOOLEAN', 'Enable platform maintenance mode messaging.', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('maintenanceModeMessage', 'Campus Hub is under scheduled maintenance. Please check back soon.', 'STRING', 'Message shown when maintenance mode is enabled.', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('otpExpiryMinutes', '10', 'NUMBER', 'OTP expiry window in minutes.', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('otpResendCooldownSeconds', '60', 'NUMBER', 'OTP resend cooldown in seconds.', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('maximumOtpAttempts', '5', 'NUMBER', 'Maximum OTP verification attempts.', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('maximumListingImages', '5', 'NUMBER', 'Maximum images allowed per listing.', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('maximumSupportAttachmentSizeMb', '5', 'NUMBER', 'Maximum support attachment size in MB.', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('defaultPaginationSize', '20', 'NUMBER', 'Default records shown per page.', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));
