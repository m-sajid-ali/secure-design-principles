// ✅ GOOD PRACTICE — secure login.
const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const router = express.Router();

router.post("/login", async (req, res) => {
  const { username = "", password = "" } = req.body;

  // Fix #1: parameterized query. The `?` is bound by the driver, so input is
  // ALWAYS data and can never become part of the SQL structure.
  const [rows] = await pool.execute(
    "SELECT id, username, password_hash, role FROM users WHERE username = ?",
    [username]
  );

  const user = rows[0];
  // Fix #2: verify against a bcrypt hash. Run compare even when the user is
  // missing, against a dummy hash, so response timing doesn't reveal which
  // usernames exist.
  const hash = user ? user.password_hash : "$2a$10$invalidinvalidinvalidinvalidinva";
  const passwordOk = await bcrypt.compare(password, hash);

  if (user && passwordOk) {
    return res.json({
      ok: true,
      message: `Welcome ${user.username}`,
      user: { id: user.id, username: user.username, role: user.role },
    });
  }
  return res.status(401).json({ ok: false, message: "Invalid credentials" });
});

module.exports = router;
