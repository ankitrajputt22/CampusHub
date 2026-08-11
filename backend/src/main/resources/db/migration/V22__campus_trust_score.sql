ALTER TABLE trust_scores ADD COLUMN level VARCHAR(40) NOT NULL DEFAULT 'NEW_LOW_TRUST';
ALTER TABLE trust_scores ADD COLUMN verification_score INT NOT NULL DEFAULT 0;
ALTER TABLE trust_scores ADD COLUMN profile_completion_score INT NOT NULL DEFAULT 0;
ALTER TABLE trust_scores ADD COLUMN marketplace_activity_score INT NOT NULL DEFAULT 0;
ALTER TABLE trust_scores ADD COLUMN order_completion_score INT NOT NULL DEFAULT 0;
ALTER TABLE trust_scores ADD COLUMN reviews_rating_score INT NOT NULL DEFAULT 0;
ALTER TABLE trust_scores ADD COLUMN account_security_score INT NOT NULL DEFAULT 0;
ALTER TABLE trust_scores ADD COLUMN penalty_score INT NOT NULL DEFAULT 0;
ALTER TABLE trust_scores ADD COLUMN last_calculated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE trust_scores ADD COLUMN updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE trust_score_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    score_before INT NOT NULL,
    score_after INT NOT NULL,
    change_value INT NOT NULL,
    reason VARCHAR(80) NOT NULL,
    description VARCHAR(500),
    source_type VARCHAR(40),
    source_id BIGINT,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_trust_score_history_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_trust_score_history_user_created
    ON trust_score_history(user_id, created_at);
