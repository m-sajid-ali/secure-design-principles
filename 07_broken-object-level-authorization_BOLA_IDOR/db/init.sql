-- Users own orders. Orders carry sensitive fields (address, card last4) so a
-- cross-user read is visibly a data breach. IDs are sequential to show enumeration.
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(64)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(32)  NOT NULL DEFAULT 'user'
);
INSERT INTO users (id, username, password_hash, role) VALUES
  (1, 'alice', '$2a$10$yBT1Q9mCyospbT/nIp7z1uMKoaMgWDo5GrLLeNz7wj7uGIOWiscxW', 'user'),
  (2, 'bob',   '$2a$10$sUPt4s7kV61L0ddw4w2Q6OIIJW6D4eNaP4X1RKdWdprEkMo9gBLX.', 'user'),
  (3, 'admin', '$2a$10$vTzrH4BcZerPXmY8hyGUT.fGwCaaqy6ftyHw5Fe/07Qet6wMgdsZi', 'admin');

CREATE TABLE IF NOT EXISTS orders (
  id           INT PRIMARY KEY,
  owner_id     INT NOT NULL,
  item         VARCHAR(128) NOT NULL,
  amount       DECIMAL(10,2) NOT NULL,
  status       VARCHAR(32) NOT NULL DEFAULT 'active',
  ship_address VARCHAR(255) NOT NULL,
  card_last4   CHAR(4) NOT NULL
);
INSERT INTO orders (id, owner_id, item, amount, status, ship_address, card_last4) VALUES
  (1001, 1, 'Laptop stand',               89.00, 'active', '12 Alice Ave, Springfield', '4021'),
  (1002, 2, 'Noise-cancelling headphones',299.00,'active', '742 Evergreen Terrace',     '8890'),
  (1003, 1, 'USB-C cable',                 19.00, 'active', '12 Alice Ave, Springfield', '4021'),
  (1004, 2, 'Standing desk',              612.00, 'active', '742 Evergreen Terrace',     '8890'),
  (1005, 3, 'Server rack',              1499.00, 'active', '1 Admin Plaza',             '0001');
