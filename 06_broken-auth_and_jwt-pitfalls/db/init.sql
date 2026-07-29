-- Users for the JWT demos. `secret_note` is private per-user data;
-- `role` gates an admin-only view. Passwords are bcrypt-hashed.
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(64)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(32)  NOT NULL DEFAULT 'user',
  email         VARCHAR(128) NOT NULL,
  secret_note   VARCHAR(255) NOT NULL
);

INSERT INTO users (id, username, password_hash, role, email, secret_note) VALUES
  (1, 'alice', '$2a$10$yBT1Q9mCyospbT/nIp7z1uMKoaMgWDo5GrLLeNz7wj7uGIOWiscxW', 'user',  'alice@corp.test', 'Alice private: comp band L5, equity 1,200 RSUs'),
  (2, 'bob',   '$2a$10$sUPt4s7kV61L0ddw4w2Q6OIIJW6D4eNaP4X1RKdWdprEkMo9gBLX.', 'user',  'bob@corp.test',   'Bob private: PIP notes, home address on file'),
  (3, 'admin', '$2a$10$vTzrH4BcZerPXmY8hyGUT.fGwCaaqy6ftyHw5Fe/07Qet6wMgdsZi', 'admin', 'admin@corp.test', 'Admin private: root credentials rotation schedule');
