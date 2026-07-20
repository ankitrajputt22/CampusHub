CREATE TABLE colleges (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    email_domain VARCHAR(120) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(30) NOT NULL UNIQUE,
    college_id BIGINT NOT NULL,
    department VARCHAR(120) NOT NULL,
    custom_department VARCHAR(120),
    course VARCHAR(80) NOT NULL,
    custom_course VARCHAR(80),
    year_of_study VARCHAR(80) NOT NULL,
    custom_year_of_study VARCHAR(80),
    roll_number VARCHAR(80),
    hostel_or_campus_area VARCHAR(120) NOT NULL,
    profile_photo_file_name VARCHAR(255),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(40) NOT NULL,
    role VARCHAR(40) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_users_college FOREIGN KEY (college_id) REFERENCES colleges(id)
);

CREATE TABLE otp_verifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    channel VARCHAR(20) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    used_at TIMESTAMP(6),
    attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_otp_verifications_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE trust_scores (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    score INT NOT NULL,
    reason VARCHAR(120) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_trust_scores_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_colleges_name ON colleges(name);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_otp_user_channel_created ON otp_verifications(user_id, channel, created_at);

INSERT INTO colleges (name, code, email_domain, active) VALUES
('IIT Delhi', 'IITD', 'iitd.ac.in', TRUE),
('IIT Bombay', 'IITB', 'iitb.ac.in', TRUE),
('IIT Kanpur', 'IITK', 'iitk.ac.in', TRUE),
('IIT Madras', 'IITM', 'iitm.ac.in', TRUE),
('IIT Kharagpur', 'IITKGP', 'iitkgp.ac.in', TRUE),
('Delhi University', 'DU', 'du.ac.in', TRUE),
('BITS Pilani', 'BITSP', 'pilani.bits-pilani.ac.in', TRUE),
('Vellore Institute of Technology', 'VIT', 'vit.ac.in', TRUE);
