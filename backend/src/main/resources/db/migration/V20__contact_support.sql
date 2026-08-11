CREATE TABLE support_tickets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(32) NOT NULL UNIQUE,
    user_id BIGINT,
    guest_name VARCHAR(120),
    guest_email VARCHAR(254),
    category VARCHAR(40) NOT NULL,
    subject VARCHAR(120) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    status VARCHAR(30) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    related_entity_type VARCHAR(30) NOT NULL DEFAULT 'NONE',
    related_entity_id BIGINT,
    assigned_admin_id BIGINT,
    last_reply_by VARCHAR(20) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    resolved_at TIMESTAMP(6),
    closed_at TIMESTAMP(6),
    CONSTRAINT fk_support_ticket_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_support_ticket_admin FOREIGN KEY (assigned_admin_id) REFERENCES users(id)
);

CREATE INDEX idx_support_ticket_user_updated
    ON support_tickets(user_id, updated_at);
CREATE INDEX idx_support_ticket_status_priority_updated
    ON support_tickets(status, priority, updated_at);
CREATE INDEX idx_support_ticket_category_updated
    ON support_tickets(category, updated_at);
CREATE INDEX idx_support_ticket_guest_email
    ON support_tickets(guest_email);
CREATE INDEX idx_support_ticket_related
    ON support_tickets(related_entity_type, related_entity_id);

CREATE TABLE support_ticket_replies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    sender_id BIGINT,
    sender_type VARCHAR(20) NOT NULL,
    message VARCHAR(2000) NOT NULL,
    is_internal_note BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_support_reply_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id),
    CONSTRAINT fk_support_reply_sender FOREIGN KEY (sender_id) REFERENCES users(id)
);

CREATE INDEX idx_support_reply_ticket_created
    ON support_ticket_replies(ticket_id, created_at);

CREATE TABLE support_ticket_attachments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    reply_id BIGINT,
    storage_key VARCHAR(255) NOT NULL UNIQUE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by_user_id BIGINT,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_support_attachment_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id),
    CONSTRAINT fk_support_attachment_reply FOREIGN KEY (reply_id) REFERENCES support_ticket_replies(id),
    CONSTRAINT fk_support_attachment_user FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_support_attachment_ticket
    ON support_ticket_attachments(ticket_id, created_at);

CREATE TABLE support_ticket_status_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by_user_id BIGINT,
    changed_by_role VARCHAR(20) NOT NULL,
    note VARCHAR(500),
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_support_history_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id),
    CONSTRAINT fk_support_history_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_support_history_ticket_created
    ON support_ticket_status_history(ticket_id, created_at);
