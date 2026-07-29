// ❌ BAD PRACTICE — vulnerable login.
const express = require("express");
const pool = require("../db");
const router = express.Router();

router.post("/login", async (req, res) => {
  const { username = "", password = "" } = req.body;

  // The bug: user input is concatenated straight into the SQL text, so the
  // input can change the QUERY ITSELF instead of being treated as a value.
  const sql =
    "SELECT id, username, role FROM users " +
    `WHERE username = '${username}' AND password = '${password}'`;

  try {
    const [rows] = await pool.query(sql);
    if (rows.length > 0) {
      // executedSql is returned only so the teaching UI can show what ran.
      return res.json({ ok: true, message: `Welcome ${rows[0].username}`, user: rows[0], executedSql: sql });
    }
    return res.status(401).json({ ok: false, message: "Invalid credentials", executedSql: sql });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message, executedSql: sql });
  }
});

module.exports = router;
