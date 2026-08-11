CREATE TABLE chat_conversations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_number VARCHAR(40) NOT NULL UNIQUE,
    listing_id BIGINT NOT NULL,
    order_id BIGINT,
    buyer_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    college_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL,
    last_message_id BIGINT,
    last_message_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uq_chat_conversation_listing_parties
        UNIQUE (buyer_id, seller_id, listing_id),
    CONSTRAINT fk_chat_conversation_listing
        FOREIGN KEY (listing_id) REFERENCES listings(id),
    CONSTRAINT fk_chat_conversation_order
        FOREIGN KEY (order_id) REFERENCES marketplace_orders(id),
    CONSTRAINT fk_chat_conversation_buyer
        FOREIGN KEY (buyer_id) REFERENCES users(id),
    CONSTRAINT fk_chat_conversation_seller
        FOREIGN KEY (seller_id) REFERENCES users(id),
    CONSTRAINT fk_chat_conversation_college
        FOREIGN KEY (college_id) REFERENCES colleges(id)
);

CREATE INDEX idx_chat_conversation_buyer_updated
    ON chat_conversations(buyer_id, last_message_at);
CREATE INDEX idx_chat_conversation_seller_updated
    ON chat_conversations(seller_id, last_message_at);
CREATE INDEX idx_chat_conversation_order
    ON chat_conversations(order_id);

CREATE TABLE chat_conversation_participants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    participant_role VARCHAR(20) NOT NULL,
    last_read_message_id BIGINT,
    last_read_at TIMESTAMP(6),
    unread_count INT NOT NULL DEFAULT 0,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    is_muted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uq_chat_conversation_participant
        UNIQUE (conversation_id, user_id),
    CONSTRAINT fk_chat_participant_conversation
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id),
    CONSTRAINT fk_chat_participant_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_chat_participant_user_archived
    ON chat_conversation_participants(user_id, is_archived, updated_at);

CREATE TABLE chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_id BIGINT,
    receiver_id BIGINT,
    message_type VARCHAR(20) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    status VARCHAR(20) NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_chat_message_conversation
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id),
    CONSTRAINT fk_chat_message_sender
        FOREIGN KEY (sender_id) REFERENCES users(id),
    CONSTRAINT fk_chat_message_receiver
        FOREIGN KEY (receiver_id) REFERENCES users(id)
);

CREATE INDEX idx_chat_message_conversation_created
    ON chat_messages(conversation_id, created_at);
CREATE INDEX idx_chat_message_receiver_status
    ON chat_messages(receiver_id, status, created_at);

ALTER TABLE chat_conversations
    ADD CONSTRAINT fk_chat_conversation_last_message
    FOREIGN KEY (last_message_id) REFERENCES chat_messages(id);

CREATE TABLE chat_message_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id BIGINT NOT NULL,
    conversation_id BIGINT NOT NULL,
    reporter_id BIGINT NOT NULL,
    reported_user_id BIGINT NOT NULL,
    reason VARCHAR(50) NOT NULL,
    description VARCHAR(500),
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uq_chat_message_reporter UNIQUE (message_id, reporter_id),
    CONSTRAINT fk_chat_report_message
        FOREIGN KEY (message_id) REFERENCES chat_messages(id),
    CONSTRAINT fk_chat_report_conversation
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id),
    CONSTRAINT fk_chat_report_reporter
        FOREIGN KEY (reporter_id) REFERENCES users(id),
    CONSTRAINT fk_chat_report_reported_user
        FOREIGN KEY (reported_user_id) REFERENCES users(id)
);

CREATE INDEX idx_chat_report_status_created
    ON chat_message_reports(status, created_at);
CREATE INDEX idx_chat_report_conversation
    ON chat_message_reports(conversation_id, created_at);
