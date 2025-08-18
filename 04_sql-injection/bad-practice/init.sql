CREATE DATABASE IF NOT EXISTS sql_injection;
USE sql_injection;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50),
  password VARCHAR(50),
  email VARCHAR(100)
);

INSERT INTO users (username, password, email) VALUES
('admin', 'admin123', 'admin@test.com'),
('alice', 'alice123', 'alice@test.com'),
('bob', 'bob123', 'bob@test.com');

CREATE USER 'app_user'@'%' IDENTIFIED BY 'app_user';
GRANT SELECT, UPDATE, INSERT ON users TO 'app_user'@'%';
