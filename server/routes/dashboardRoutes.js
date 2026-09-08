const express = require("express");
const router = express.Router();
const dashboardDb = require("../db/dashboardDb");

// GET /api/dashboard/stats - get aggregated live stats for the dashboard
router.get("/stats", (req, res) => {
  try {
    const stats = dashboardDb.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
