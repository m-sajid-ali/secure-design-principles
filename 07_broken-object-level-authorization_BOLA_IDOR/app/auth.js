// Authentication is done CORRECTLY here (verified JWT). This module is about
// AUTHORIZATION — whether an authenticated user may touch a specific object.
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const SECRET = process.env.JWT_SECRET;

async function login(req, res) {
  const { username, password } = req.body;
  const [rows] = await pool.execute(
    "SELECT id, username, password_hash, role FROM users WHERE username = ?", [username]);
  const u = rows[0];
  const hash = u ? u.password_hash : "$2a$10$invalidinvalidinvalidinvalidinva";
  const ok = await bcrypt.compare(password || "", hash);
  if (!u || !ok) return res.status(401).json({ ok: false, message: "Invalid credentials" });
  const token = jwt.sign({ sub: u.id, username: u.username, role: u.role }, SECRET,
    { algorithm: "HS256", expiresIn: "1h" });
  res.json({ ok: true, token, user: { id: u.id, username: u.username, role: u.role } });
}

function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, message: "Not authenticated" });
  try {
    const p = jwt.verify(token, SECRET, { algorithms: ["HS256"] });
    req.user = { id: p.sub, username: p.username, role: p.role };
    next();
  } catch (e) { return res.status(401).json({ ok: false, message: "Bad token", reason: e.name }); }
}

module.exports = { login, requireAuth };
