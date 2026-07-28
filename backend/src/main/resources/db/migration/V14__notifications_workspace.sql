ALTER TABLE notifications
    ADD COLUMN priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM';

ALTER TABLE notifications
    ADD COLUMN related_entity_type VARCHAR(30) NOT NULL DEFAULT 'NONE';

ALTER TABLE notifications
    ADD COLUMN related_entity_id BIGINT;

ALTER TABLE notifications
    ADD COLUMN action_url VARCHAR(300);

ALTER TABLE notifications
    ADD COLUMN read_at TIMESTAMP(6);

ALTER TABLE notifications
    ADD COLUMN updated_at TIMESTAMP(6);

UPDATE notifications
SET updated_at = created_at
WHERE updated_at IS NULL;

ALTER TABLE notifications
    MODIFY COLUMN updated_at TIMESTAMP(6) NOT NULL;

CREATE INDEX idx_notifications_user_type_created
    ON notifications(user_id, type, created_at);
