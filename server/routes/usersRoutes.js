const express = require("express");
const router = express.Router();
const { query } = require("../db/postgres");

// GET /api/users - list users from PostgreSQL
router.get("/", async (req, res) => {
  try {
    const result = await query("SELECT id, uid, email, name, avatar, role, created_at FROM users ORDER BY id ASC");
    if (result && result.rows) {
      return res.json({ success: true, count: result.rows.length, data: result.rows });
    }
    return res.json({ success: true, count: 0, data: [] });
  } catch (err) {
    console.error("Error fetching users from PostgreSQL:", err);
    res.status(500).json({ success: false, error: "Database query failed. Please try again later." });
  }
});

// POST /api/users - sync / create user
router.post("/", async (req, res) => {
  try {
    const { uid, email, name, avatar } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ success: false, error: "UID and email are required" });
    }
    const sql = `
      INSERT INTO users (uid, email, name, avatar)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (uid) DO UPDATE
      SET email = EXCLUDED.email,
          name = COALESCE(EXCLUDED.name, users.name),
          avatar = COALESCE(EXCLUDED.avatar, users.avatar)
      RETURNING *;
    `;
    const result = await query(sql, [uid, email, name || null, avatar || null]);
    res.status(201).json({ success: true, data: result?.rows?.[0] || { uid, email, name, avatar } });
  } catch (err) {
    console.error("Error creating user in PostgreSQL:", err);
    res.status(500).json({ success: false, error: "Failed to persist user profile" });
  }
});

module.exports = router;
