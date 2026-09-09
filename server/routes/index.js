const express = require("express");
const router = express.Router();

const jobsRoutes = require("./jobsRoutes");
const resumesRoutes = require("./resumesRoutes");
const interviewsRoutes = require("./interviewsRoutes");
const candidatesRoutes = require("./candidatesRoutes");
const emailCenterRoutes = require("./emailCenterRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const settingsRoutes = require("./settingsRoutes");
const usersRoutes = require("./usersRoutes");
const { query } = require("../db/postgres");

router.use("/jobs", jobsRoutes);
router.use("/resumes", resumesRoutes);
router.use("/interviews", interviewsRoutes);
router.use("/candidates", candidatesRoutes);
router.use("/emails", emailCenterRoutes);
router.use("/email-center", emailCenterRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/settings", settingsRoutes);
router.use("/users", usersRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "AvaHire HR Portal Backend",
    timestamp: new Date().toISOString()
  });
});

// Database status endpoint
router.get("/db-status", async (req, res) => {
  try {
    const result = await query("SELECT current_database(), current_user, version();");
    if (result && result.rows && result.rows.length > 0) {
      return res.json({
        connected: true,
        database: result.rows[0].current_database,
        user: result.rows[0].current_user,
        engine: "PostgreSQL (Google Cloud SQL)"
      });
    }
    return res.json({ connected: false, message: "No active SQL pool client" });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

module.exports = router;
