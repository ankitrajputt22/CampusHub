ALTER TABLE users ADD COLUMN profile_photo_url VARCHAR(500);

ALTER TABLE trust_scores ADD COLUMN profile_photo_points INT NOT NULL DEFAULT 0;
ALTER TABLE trust_scores ADD COLUMN bio_points INT NOT NULL DEFAULT 0;
ALTER TABLE trust_scores ADD COLUMN social_profile_points INT NOT NULL DEFAULT 0;

CREATE TABLE profile_privacy_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    show_bio BOOLEAN NOT NULL DEFAULT TRUE,
    show_linkedin BOOLEAN NOT NULL DEFAULT FALSE,
    show_github BOOLEAN NOT NULL DEFAULT FALSE,
    show_hostel_area BOOLEAN NOT NULL DEFAULT FALSE,
    show_department BOOLEAN NOT NULL DEFAULT TRUE,
    show_year_of_study BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_profile_privacy_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE seller_reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE,
    reviewer_id BIGINT NOT NULL,
    reviewee_id BIGINT NOT NULL,
    rating INT NOT NULL,
    message VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_seller_reviews_order FOREIGN KEY (order_id) REFERENCES marketplace_orders(id),
    CONSTRAINT fk_seller_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id),
    CONSTRAINT fk_seller_reviews_reviewee FOREIGN KEY (reviewee_id) REFERENCES users(id),
    CONSTRAINT chk_seller_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_seller_reviews_participants CHECK (reviewer_id <> reviewee_id)
);

CREATE INDEX idx_seller_reviews_reviewee_created
    ON seller_reviews(reviewee_id, created_at);
