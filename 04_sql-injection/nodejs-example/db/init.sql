-- Seeds the `users` table used by BOTH demos.
-- `password`      = plaintext, read by the VULNERABLE endpoint (bad practice on purpose)
-- `password_hash` = bcrypt hash, read by the SECURE endpoint (good practice)
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(64)  NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(32)  NOT NULL DEFAULT 'user'
);

INSERT INTO users (username, password, password_hash, role) VALUES
  ('alice', 'S3cret-Alice!',          '$2a$10$L7aZWRUQrOB3l/1OIcCzierAq2Xff58BSzugwIWFkonteIYR5x4vi', 'user'),
  ('admin', 'SuperSecretAdminPw#2024', '$2a$10$VJvzcbe7CyZ9R4PG/x5KJu7Gn1xMLEgKNLYUdBMO13X2OaDAzgv6.', 'admin');
