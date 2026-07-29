// ✅ GOOD PRACTICE — every object access is scoped to the authenticated owner.
// The ownership check is part of the query, so it can't be forgotten downstream.
const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../auth");
const router = express.Router();

router.get("/good/orders", requireAuth, async (req, res) => {
  const [rows] = await pool.execute(
    "SELECT id, item, amount, status FROM orders WHERE owner_id = ? ORDER BY id", [req.user.id]);
  res.json({ ok: true, orders: rows });
});

// Fix: WHERE id = ? AND owner_id = ?  → other users' orders simply don't exist.
router.get("/good/orders/:id", requireAuth, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT o.*, u.username AS owner_username
       FROM orders o JOIN users u ON u.id = o.owner_id
      WHERE o.id = ? AND o.owner_id = ?`, [req.params.id, req.user.id]);
  // 404 (not 403) so we don't even confirm the object exists for someone else.
  if (!rows[0]) return res.status(404).json({ ok: false, message: "Not found" });
  res.json({ ok: true, order: rows[0] });
});

router.post("/good/orders/:id/cancel", requireAuth, async (req, res) => {
  const [r] = await pool.execute(
    "UPDATE orders SET status = 'cancelled' WHERE id = ? AND owner_id = ?", [req.params.id, req.user.id]);
  if (r.affectedRows === 0) return res.status(404).json({ ok: false, message: "Not found" });
  res.json({ ok: true, cancelled: true, id: Number(req.params.id) });
});

module.exports = router;
