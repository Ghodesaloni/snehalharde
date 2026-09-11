const express = require("express");
const router = express.Router();
const emailCenterDb = require("../db/emailCenterDb");
const emailService = require("../services/emailService");
const postgresDb = require("../db/postgres");

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

// GET /api/emails/sent - get sent emails log scoped to user or all
router.get("/sent", async (req, res) => {
  try {
    const { userEmail, type, all } = req.query;
    const authorEmail = userEmail || req.headers["x-user-email"];

    // First try querying PostgreSQL for persistent SMTP emails
    const pgEmails = await postgresDb.getSmtpEmails({
      userEmail: all === "true" ? undefined : authorEmail,
      emailType: type,
      limit: 100,
    });

    if (pgEmails && pgEmails.length > 0) {
      const formatted = pgEmails.map((row) => ({
        id: row.id,
        recipient: row.recipient,
        recipientName: row.recipient_name,
        subject: row.subject,
        body: row.body,
        html: row.html,
        type: row.email_type,
        templateId: row.template_id,
        senderEmail: row.sender_email,
        userEmail: row.user_email,
        status: row.status,
        deliveryMode: row.delivery_mode,
        sentAt: row.created_at
          ? new Date(row.created_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Recently",
        messageId: row.message_id,
        metadata: row.metadata,
      }));
      return res.json({ success: true, data: formatted, source: "postgres" });
    }

    // Fallback to local JSON email database
    const sent = emailCenterDb.getSentEmails({
      userEmail: all === "true" ? undefined : authorEmail,
      type,
    });
    res.json({ success: true, data: sent, source: "local_cache" });
  } catch (err) {
    console.warn("[EMAIL-CENTER] GET /sent fallback notice:", err.message);
    try {
      const sent = emailCenterDb.getSentEmails({ userEmail: req.query.userEmail });
      res.json({ success: true, data: sent, source: "fallback" });
    } catch (fallbackErr) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// GET /api/emails/smtp-all - get all stored SMTP emails across the entire system
router.get("/smtp-all", async (req, res) => {
  try {
    const pgEmails = await postgresDb.getSmtpEmails({ limit: 200 });
    if (pgEmails && pgEmails.length > 0) {
      return res.json({ success: true, data: pgEmails, source: "postgres", count: pgEmails.length });
    }
    const localEmails = emailCenterDb.getSentEmails({});
    res.json({ success: true, data: localEmails, source: "local_cache", count: localEmails.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/emails/send - send an email via SMTP and persist to database
router.post("/send", async (req, res) => {
  try {
    const { recipient, recipientName, subject, body, templateId, senderEmail } = req.body;
    if (!recipient) {
      return res.status(400).json({ success: false, error: "Recipient email is required" });
    }

    const authorEmail = senderEmail || req.body.userEmail || req.headers["x-user-email"] || "";

    // Deliver via SMTP and store persistently in both Postgres and JSON
    const sendResult = await emailService.sendCommunicationEmail({
      toEmail: recipient,
      recipientName: recipientName || "Candidate",
      subject: subject || "Update on your application",
      body: body || "",
      senderEmail: authorEmail,
      templateId,
    });

    const sentRecord = sendResult.record || emailCenterDb.storeSmtpEmail({
      recipient,
      recipientName,
      subject,
      body,
      templateId,
      senderEmail: authorEmail,
      userEmail: authorEmail,
      status: sendResult.mode === "live_smtp" ? "Delivered via SMTP" : "Delivered",
      deliveryMode: sendResult.mode || "live_smtp",
      messageId: sendResult.messageId || null,
    });

    res.status(201).json({
      success: true,
      data: sentRecord,
      mode: sendResult.mode,
      message: "Email dispatched and stored successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

