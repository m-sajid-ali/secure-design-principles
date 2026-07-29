const bcrypt = require("bcryptjs");
const pool = require("./db");

// Verify username/password against the DB (parameterized + bcrypt).
// This part is the SAME for both sides — the module is about the TOKEN, not the login query.
async function checkCredentials(username, password) {
  const [rows] = await pool.execute(
    "SELECT id, username, role FROM users WHERE username = ?",
    [username]
  );
  const user = rows[0];
  const hash = user
    ? (await pool.execute("SELECT password_hash FROM users WHERE id = ?", [user.id]))[0][0].password_hash
    : "$2a$10$invalidinvalidinvalidinvalidinva";
  const ok = await bcrypt.compare(password || "", hash);
  return user && ok ? user : null;
}

// Given a trusted identity (sub + role), build the account response.
async function buildAccount(sub, role) {
  const [rows] = await pool.execute(
    "SELECT username, role, email, secret_note FROM users WHERE id = ?",
    [sub]
  );
  const me = rows[0] || null;
  const out = { identity: { sub, role }, account: me };
  if (role === "admin") {
    const [all] = await pool.execute("SELECT id, username, role, email FROM users ORDER BY id");
    out.adminPanel = all; // sensitive: every user's details
  }
  return out;
}

function bearer(req) {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

module.exports = { checkCredentials, buildAccount, bearer };
