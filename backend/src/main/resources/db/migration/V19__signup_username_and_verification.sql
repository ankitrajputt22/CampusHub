ALTER TABLE users ADD COLUMN username VARCHAR(30);

UPDATE users
SET username = CONCAT('user_', id)
WHERE username IS NULL OR TRIM(username) = '';

ALTER TABLE users MODIFY COLUMN username VARCHAR(30) NOT NULL;

CREATE UNIQUE INDEX idx_users_username ON users(username);
