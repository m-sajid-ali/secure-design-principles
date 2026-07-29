// ❌ BAD PRACTICE — endpoints act on an object ID from the URL WITHOUT checking
// that the authenticated user owns it. Classic BOLA / IDOR.
const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../auth");
const router = express.Router();

// Baseline: the user's own orders (legit — scoped to owner).
router.get("/bad/orders", requireAuth, async (req, res) => {
  const [rows] = await pool.execute(
    "SELECT id, item, amount, status FROM orders WHERE owner_id = ? ORDER BY id", [req.user.id]);
  res.json({ ok: true, orders: rows });
});

// The bug: fetch by ID only. Any authenticated user can read ANY order.
router.get("/bad/orders/:id", requireAuth, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT o.*, u.username AS owner_username
       FROM orders o JOIN users u ON u.id = o.owner_id
      WHERE o.id = ?`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ ok: false, message: "Not found" });
  res.json({ ok: true, order: rows[0] });
});

// Write-side BOLA: cancel by ID only — anyone can cancel anyone's order.
router.post("/bad/orders/:id/cancel", requireAuth, async (req, res) => {
  const [r] = await pool.execute("UPDATE orders SET status = 'cancelled' WHERE id = ?", [req.params.id]);
  res.json({ ok: true, cancelled: r.affectedRows > 0, id: Number(req.params.id) });
});

module.exports = router;
