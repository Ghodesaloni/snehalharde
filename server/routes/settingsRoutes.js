const express = require("express");
const router = express.Router();
const settingsDb = require("../db/settingsDb");
const awsService = require("../services/awsService");

// GET /api/settings/aws - get AWS cloud server configuration & status
router.get("/aws", (req, res) => {
  try {
    const config = awsService.getConfig();
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/settings/aws - update AWS server settings
router.put("/aws", (req, res) => {
  try {
    const updated = awsService.updateConfig(req.body);
    res.json({ success: true, data: updated, message: "AWS Cloud Server settings updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/settings/aws/test - test AWS connection (RDS, S3, SES, Compute)
router.post("/aws/test", async (req, res) => {
  try {
    const result = await awsService.testConnection();
    res.json({ success: true, data: result, message: "AWS Server diagnostics completed" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/settings - get organization & AI settings
router.get("/", (req, res) => {
  try {
    const settings = settingsDb.getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/settings - update settings
router.put("/", (req, res) => {
  try {
    const updated = settingsDb.updateSettings(req.body);
    res.json({ success: true, data: updated, message: "Settings updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/settings/interview - get interview & proctoring settings
router.get("/interview", (req, res) => {
  try {
    const settings = settingsDb.getInterviewSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/settings/interview - update interview & proctoring settings
router.put("/interview", (req, res) => {
  try {
    const updated = settingsDb.updateInterviewSettings(req.body);
    res.json({ success: true, data: updated, message: "Interview settings updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/settings/profile - get recruiter profile
router.get("/profile", (req, res) => {
  try {
    const profile = settingsDb.getProfile();
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/settings/profile - update recruiter profile
router.put("/profile", (req, res) => {
  try {
    const updated = settingsDb.updateProfile(req.body);
    res.json({ success: true, data: updated, message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
