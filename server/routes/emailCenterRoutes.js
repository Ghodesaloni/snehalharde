const express = require("express");
const router = express.Router();
const emailCenterDb = require("../db/emailCenterDb");

// GET /api/emails/templates - get templates
router.get("/templates", (req, res) => {
  try {
    const templates = emailCenterDb.getTemplates();
    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/emails/templates - create template
router.post("/templates", (req, res) => {
  try {
    const newTemplate = emailCenterDb.createTemplate(req.body);
    res.status(201).json({ success: true, data: newTemplate, message: "Template created" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/emails/sent - get sent emails log
router.get("/sent", (req, res) => {
  try {
    const sent = emailCenterDb.getSentEmails();
    res.json({ success: true, data: sent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/emails/send - send an email
router.post("/send", (req, res) => {
  try {
    const { recipient, recipientName, subject, body, templateId } = req.body;
    if (!recipient) {
      return res.status(400).json({ success: false, error: "Recipient email is required" });
    }
    const sentRecord = emailCenterDb.sendEmail({
      recipient,
      recipientName,
      subject,
      body,
      templateId
    });
    res.status(201).json({ success: true, data: sentRecord, message: "Email dispatched successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
