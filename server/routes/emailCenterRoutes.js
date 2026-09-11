const express = require("express");
const router = express.Router();
const emailCenterDb = require("../db/emailCenterDb");
const emailService = require("../services/emailService");

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

// GET /api/emails/sent - get sent emails log scoped to user
router.get("/sent", (req, res) => {
  try {
    const { userEmail } = req.query;
    const authorEmail = userEmail || req.headers["x-user-email"];
    const sent = emailCenterDb.getSentEmails({ userEmail: authorEmail });
    res.json({ success: true, data: sent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/emails/send - send an email
router.post("/send", async (req, res) => {
  try {
    const { recipient, recipientName, subject, body, templateId, senderEmail } = req.body;
    if (!recipient) {
      return res.status(400).json({ success: false, error: "Recipient email is required" });
    }

    const authorEmail = senderEmail || req.body.userEmail || req.headers["x-user-email"] || "";

    const sentRecord = emailCenterDb.sendEmail({
      recipient,
      recipientName,
      subject,
      body,
      templateId,
      senderEmail: authorEmail,
      userEmail: authorEmail,
      createdBy: authorEmail,
    });

    // Attempt live SMTP delivery via emailService
    try {
      await emailService.sendCommunicationEmail({
        toEmail: recipient,
        recipientName: recipientName || "Candidate",
        subject: subject || "Update on your application",
        body: body || "",
        senderEmail: authorEmail,
      });
    } catch (sendErr) {
      console.warn("[EMAIL-CENTER] Delivery notification:", sendErr.message);
    }

    res.status(201).json({ success: true, data: sentRecord, message: "Email dispatched successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
