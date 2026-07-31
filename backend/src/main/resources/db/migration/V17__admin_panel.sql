CREATE TABLE admin_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_id BIGINT NOT NULL,
    action_type VARCHAR(80) NOT NULL,
    target_type VARCHAR(40) NOT NULL,
    target_id BIGINT,
    previous_value VARCHAR(120),
    new_value VARCHAR(120),
    note VARCHAR(500),
    ip_address VARCHAR(64),
    user_agent VARCHAR(500),
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_admin_audit_logs_admin
        FOREIGN KEY (admin_id) REFERENCES users(id)
);

CREATE INDEX idx_admin_audit_logs_created
    ON admin_audit_logs(created_at);

CREATE INDEX idx_admin_audit_logs_admin_created
    ON admin_audit_logs(admin_id, created_at);

CREATE INDEX idx_admin_audit_logs_target
    ON admin_audit_logs(target_type, target_id);
