// Shared MariaDB connection pool. Credentials come from the environment
// (set by docker-compose from the .env file) — never hard-coded.
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "appuser",
  password: process.env.DB_PASSWORD || "apppass",
  database: process.env.DB_NAME || "training",
  waitForConnections: true,
  connectionLimit: 5,
});

module.exports = pool;
