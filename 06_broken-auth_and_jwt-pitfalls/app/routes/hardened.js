const express = require("express");
const jwt = require("jsonwebtoken");
const { checkCredentials, buildAccount, bearer } = require("../helpers");
const { verifyProof, ecThumbprint, b64uToObj } = require("../lib");
const router = express.Router();

const STRONG = process.env.JWT_SECRET;
const seenJti = new Set(); // tiny anti-replay cache for L5 proofs

// L4 login: strong secret from env + short expiry.
router.post("/hardened/login", async (req, res) => {
  const u = await checkCredentials(req.body.username, req.body.password);
  if (!u) return res.status(401).json({ ok: false, message: "Invalid credentials" });
  const opts = { algorithm: "HS256", expiresIn: req.body.expired ? -60 : "1m" };
  const token = jwt.sign({ sub: u.id, username: u.username, role: u.role }, STRONG, opts);
  res.json({ ok: true, token });
});

// L4 — verify + pinned algorithm + expiry.
router.get("/l4/account", async (req, res) => {
  const t = bearer(req); if (!t) return res.status(401).json({ ok: false, message: "No token" });
  try {
    const payload = jwt.verify(t, STRONG, { algorithms: ["HS256"] });
    res.json({ ok: true, verified: true, ...(await buildAccount(payload.sub, payload.role)) });
  } catch (e) { res.status(401).json({ ok: false, message: e.message, reason: e.name }); }
});

// L5 login: bind the token to the client's public key (cnf.jkt).
router.post("/l5/login", async (req, res) => {
  const u = await checkCredentials(req.body.username, req.body.password);
  if (!u) return res.status(401).json({ ok: false, message: "Invalid credentials" });
  if (!req.body.jwk) return res.status(400).json({ ok: false, message: "missing client jwk" });
  const jkt = ecThumbprint(req.body.jwk);
  const token = jwt.sign({ sub: u.id, username: u.username, role: u.role, cnf: { jkt } }, STRONG,
    { algorithm: "HS256", expiresIn: "15m" });
  res.json({ ok: true, token });
});

// L5 — verify + REQUIRE a sender proof whose key matches cnf.jkt.
router.get("/l5/account", async (req, res) => {
  const t = bearer(req); if (!t) return res.status(401).json({ ok: false, message: "No token" });
  let payload;
  try { payload = jwt.verify(t, STRONG, { algorithms: ["HS256"] }); }
  catch (e) { return res.status(401).json({ ok: false, message: e.message, reason: e.name }); }

  const proof = req.headers["dpop"];
  if (!proof) return res.status(401).json({ ok: false, reason: "NoProof",
    message: "A copied token alone is not enough — this endpoint requires a sender proof." });
  try {
    const { jkt, jti } = verifyProof(proof, "GET", "/l5/account");
    if (!payload.cnf || payload.cnf.jkt !== jkt)
      return res.status(401).json({ ok: false, reason: "KeyMismatch", message: "Proof key does not match the token's bound key" });
    if (jti && seenJti.has(jti)) return res.status(401).json({ ok: false, reason: "Replay", message: "Proof already used" });
    if (jti) seenJti.add(jti);
    res.json({ ok: true, verified: true, senderConstrained: true, ...(await buildAccount(payload.sub, payload.role)) });
  } catch (e) { return res.status(401).json({ ok: false, message: e.message, reason: "BadProof" }); }
});

module.exports = router;
