CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    listing_id BIGINT NOT NULL,
    college_id BIGINT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    razorpay_order_id VARCHAR(100) NOT NULL,
    razorpay_payment_id VARCHAR(100),
    razorpay_signature VARCHAR(255),
    status VARCHAR(30) NOT NULL,
    payment_method VARCHAR(40),
    failure_reason VARCHAR(500),
    refund_status VARCHAR(30) NOT NULL DEFAULT 'NOT_REQUIRED',
    paid_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_payments_order UNIQUE (order_id),
    CONSTRAINT uk_payments_razorpay_order UNIQUE (razorpay_order_id),
    CONSTRAINT uk_payments_razorpay_payment UNIQUE (razorpay_payment_id),
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id)
        REFERENCES marketplace_orders(id),
    CONSTRAINT fk_payments_buyer FOREIGN KEY (buyer_id) REFERENCES users(id),
    CONSTRAINT fk_payments_seller FOREIGN KEY (seller_id) REFERENCES users(id),
    CONSTRAINT fk_payments_listing FOREIGN KEY (listing_id) REFERENCES listings(id),
    CONSTRAINT fk_payments_college FOREIGN KEY (college_id) REFERENCES colleges(id)
);

CREATE TABLE payment_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    razorpay_order_id VARCHAR(100) NOT NULL,
    razorpay_payment_id VARCHAR(100),
    status VARCHAR(30) NOT NULL,
    failure_reason VARCHAR(500),
    attempted_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_payment_attempt_razorpay_order UNIQUE (razorpay_order_id),
    CONSTRAINT fk_payment_attempt_order FOREIGN KEY (order_id)
        REFERENCES marketplace_orders(id)
);

CREATE INDEX idx_payments_buyer_status_created
    ON payments(buyer_id, status, created_at);

CREATE INDEX idx_payments_seller_status_created
    ON payments(seller_id, status, created_at);

CREATE INDEX idx_payment_attempts_order_attempted
    ON payment_attempts(order_id, attempted_at);
