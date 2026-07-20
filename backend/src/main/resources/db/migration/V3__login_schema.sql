ALTER TABLE users ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN account_locked_until TIMESTAMP(6);
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP(6);

CREATE TABLE refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    expires_at TIMESTAMP(6) NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE login_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(160) NOT NULL,
    ip_address VARCHAR(80),
    user_agent VARCHAR(500),
    successful BOOLEAN NOT NULL,
    failure_reason VARCHAR(120),
    created_at TIMESTAMP(6) NOT NULL
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_login_attempts_email_created ON login_attempts(email, created_at);
CREATE INDEX idx_login_attempts_ip_created ON login_attempts(ip_address, created_at);
