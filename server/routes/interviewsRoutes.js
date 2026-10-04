const express = require("express");
const router = express.Router();
const interviewsDb = require("../db/interviewsDb");
const automatedEmailService = require("../services/automatedEmailService");

function parseDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  try {
    const rawDate = String(dateStr).trim().toLowerCase();
    let d = new Date();
    if (rawDate === "today") {
      d = new Date();
    } else if (rawDate === "tomorrow") {
      d = new Date();
      d.setDate(d.getDate() + 1);
    } else if (rawDate === "yesterday") {
      d = new Date();
      d.setDate(d.getDate() - 1);
    } else {
      let parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) {
        const parts = String(dateStr).trim().split(/\s+/);
        if (parts.length === 3) parsed = new Date(`${parts[1]} ${parts[0]}, ${parts[2]}`);
      }
      if (!isNaN(parsed.getTime())) d = parsed;
    }

    let hours = 11;
    let minutes = 0;
    if (timeStr && typeof timeStr === "string") {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        const meridian = match[3] ? match[3].toUpperCase() : null;
        if (meridian === "PM" && hours < 12) hours += 12;
        if (meridian === "AM" && hours === 12) hours = 0;
      }
    }
    d.setHours(hours, minutes, 0, 0);
    return d;
  } catch (e) {
    return null;
  }
}

async function checkAndEnforceExpiry(interview) {
  if (!interview) return interview;
  const status = String(interview.status || "").toLowerCase().trim();
  if (status === "completed" || status === "active" || status === "in live interview" || status === "joined") {
    return interview;
  }
  const parsed = parseDateTime(interview.date, interview.time);
  if (parsed && !isNaN(parsed.getTime())) {
    const joinDeadline = new Date(parsed.getTime() + 5 * 60 * 1000);
    if (new Date() > joinDeadline) {
      interview.isExpired = true;
      interview.status = "Expired";
      await interviewsDb.update(interview.id, { isExpired: true, status: "Expired" }).catch(() => {});
    }
  }
  return interview;
}

// GET /api/interviews - list interviews
router.get("/", async (req, res) => {
  try {
    const { status, search, userEmail } = req.query;
    const authorEmail = userEmail || req.headers["x-user-email"];
    const list = await interviewsDb.getAll({ status, search, userEmail: authorEmail });
    const processedList = await Promise.all(list.map(checkAndEnforceExpiry));
    res.json({ success: true, count: processedList.length, data: processedList });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/interviews/code/:linkCode - get by linkCode (used by candidate portal)
router.get("/code/:linkCode", async (req, res) => {
  try {
    let interview = await interviewsDb.getByLinkCode(req.params.linkCode);
    if (!interview) {
      return res.status(404).json({ success: false, error: "Interview link is invalid or expired" });
    }
    interview = await checkAndEnforceExpiry(interview);
    res.json({ success: true, data: interview });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/interviews/:id - get single interview
router.get("/:id", async (req, res) => {
  try {
    let interview = (await interviewsDb.getById(req.params.id)) || (await interviewsDb.getByLinkCode(req.params.id));
    if (!interview) {
      return res.status(404).json({ success: false, error: "Interview not found" });
    }
    interview = await checkAndEnforceExpiry(interview);
    res.json({ success: true, data: interview });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/interviews - schedule new interview
router.post("/", async (req, res) => {
  try {
    const authorEmail = req.body.createdBy || req.body.userEmail || req.headers["x-user-email"] || "";
    const newInterview = await interviewsDb.create({
      ...req.body,
      createdBy: authorEmail,
      userEmail: authorEmail
    });

    // Automated Email Trigger: Interview Scheduled (Link generated)
    automatedEmailService.sendInterviewScheduledEmail({ interview: newInterview, req }).catch(err => {
      console.warn("[AUTOMATED-EMAIL] Interview scheduled email notice:", err.message);
    });

    res.status(201).json({ success: true, data: newInterview, message: "Interview scheduled successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/interviews/:id - update interview
router.put("/:id", async (req, res) => {
  try {
    const updated = await interviewsDb.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Interview not found" });
    }
    res.json({ success: true, data: updated, message: "Interview updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/interviews/:id - delete/cancel interview
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await interviewsDb.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Interview not found" });
    }
    res.json({ success: true, message: "Interview cancelled successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
