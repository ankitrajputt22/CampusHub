CREATE TABLE password_reset_challenges (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_id VARCHAR(36) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMP(6) NOT NULL,
    verified_at TIMESTAMP(6),
    reset_token_hash VARCHAR(100),
    reset_token_expires_at TIMESTAMP(6),
    used_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_password_reset_public_id
    ON password_reset_challenges(public_id);

CREATE INDEX idx_password_reset_user_created
    ON password_reset_challenges(user_id, created_at);

CREATE INDEX idx_seller_reviews_reviewer_created
    ON seller_reviews(reviewer_id, created_at);
