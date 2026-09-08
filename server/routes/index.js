const express = require("express");
const router = express.Router();

const jobsRoutes = require("./jobsRoutes");
const resumesRoutes = require("./resumesRoutes");
const interviewsRoutes = require("./interviewsRoutes");
const candidatesRoutes = require("./candidatesRoutes");
const emailCenterRoutes = require("./emailCenterRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const settingsRoutes = require("./settingsRoutes");

router.use("/jobs", jobsRoutes);
router.use("/resumes", resumesRoutes);
router.use("/interviews", interviewsRoutes);
router.use("/candidates", candidatesRoutes);
router.use("/emails", emailCenterRoutes);
router.use("/email-center", emailCenterRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/settings", settingsRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "AvaHire HR Portal Backend",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
