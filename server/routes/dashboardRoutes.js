const express = require("express");
const router = express.Router();
const dashboardDb = require("../db/dashboardDb");

// GET /api/dashboard/stats - get aggregated live stats for the dashboard
router.get("/stats", async (req, res) => {
  try {
    const userEmail = req.query.userEmail || req.headers["x-user-email"] || req.query.email;
    const stats = await dashboardDb.getStats(userEmail);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
