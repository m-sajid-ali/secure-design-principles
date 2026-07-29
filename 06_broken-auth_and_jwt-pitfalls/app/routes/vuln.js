const express = require("express");
const jwt = require("jsonwebtoken");
const { checkCredentials, buildAccount, bearer } = require("../helpers");
const { naiveVerify } = require("../lib");
const router = express.Router();

const WEAK_SECRET = "secret"; // hardcoded + weak, on purpose

// Shared login for L1-L3: HS256 signed with the weak secret, NO expiry.
router.post("/vuln/login", async (req, res) => {
  const u = await checkCredentials(req.body.username, req.body.password);
  if (!u) return res.status(401).json({ ok: false, message: "Invalid credentials" });
  const token = jwt.sign({ sub: u.id, username: u.username, role: u.role }, WEAK_SECRET, { algorithm: "HS256" });
  res.json({ ok: true, token });
});

// L1 — decode(): no verification at all.
router.get("/l1/account", async (req, res) => {
  const t = bearer(req); if (!t) return res.status(401).json({ ok: false, message: "No token" });
  const payload = jwt.decode(t);
  if (!payload) return res.status(401).json({ ok: false, message: "Unreadable token" });
  res.json({ ok: true, verified: false, ...(await buildAccount(payload.sub, payload.role)) });
});

// L2 — verify() but with the WEAK, hardcoded secret and no expiry.
router.get("/l2/account", async (req, res) => {
  const t = bearer(req); if (!t) return res.status(401).json({ ok: false, message: "No token" });
  try {
    const payload = jwt.verify(t, WEAK_SECRET, { algorithms: ["HS256"] });
    res.json({ ok: true, verified: true, ...(await buildAccount(payload.sub, payload.role)) });
  } catch (e) { res.status(401).json({ ok: false, message: e.message, reason: e.name }); }
});

// L3 — naive/legacy verifier that honors the alg header (accepts alg:none).
router.get("/l3/account", async (req, res) => {
  const t = bearer(req); if (!t) return res.status(401).json({ ok: false, message: "No token" });
  try {
    const payload = naiveVerify(t, WEAK_SECRET);
    res.json({ ok: true, verified: true, ...(await buildAccount(payload.sub, payload.role)) });
  } catch (e) { res.status(401).json({ ok: false, message: e.message, reason: "NaiveVerifyError" }); }
});

module.exports = router;
