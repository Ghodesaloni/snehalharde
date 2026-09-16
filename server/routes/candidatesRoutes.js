const express = require("express");
const router = express.Router();
const candidatesDb = require("../db/candidatesDb");
const emailService = require("../services/emailService");

// GET /api/candidates - list candidate evaluations
router.get("/", async (req, res) => {
  try {
    const { status, role, search, userEmail } = req.query;
    const authorEmail = userEmail || req.headers["x-user-email"];
    const list = await candidatesDb.getAll({ status, role, search, userEmail: authorEmail });
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/candidates/:id - get single candidate evaluation
router.get("/:id", async (req, res) => {
  try {
    const cand = await candidatesDb.getById(req.params.id);
    if (!cand) {
      return res.status(404).json({ success: false, error: "Candidate evaluation not found" });
    }
    res.json({ success: true, data: cand });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/candidates - create candidate evaluation
router.post("/", async (req, res) => {
  try {
    const authorEmail = req.body.createdBy || req.body.userEmail || req.headers["x-user-email"] || "";
    const newCand = await candidatesDb.create({
      ...req.body,
      createdBy: authorEmail,
      userEmail: authorEmail
    });
    res.status(201).json({ success: true, data: newCand, message: "Candidate evaluation created" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/candidates/:id - update candidate evaluation / status / notes
router.put("/:id", async (req, res) => {
  try {
    const existing = await candidatesDb.getById(req.params.id);
    const updated = await candidatesDb.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }

    // Automatically send status update email to candidate if status changed
    const candEmail = (updated.email || existing?.email || "").trim();
    const candName = updated.name || existing?.name || "Candidate";
    const candRole = updated.role || existing?.role || "Software Engineer";
    const authorEmail = updated.userEmail || updated.createdBy || req.headers["x-user-email"] || "";

    if (candEmail && candEmail.includes("@") && req.body.status) {
      const newStatus = req.body.status.trim().toLowerCase();
      const prevStatus = (existing?.status || "").trim().toLowerCase();

      if ((newStatus === "selected" || newStatus === "shortlisted" || newStatus === "hired") && prevStatus !== newStatus) {
        try {
          await emailService.sendCandidateSelectedEmail({
            toEmail: candEmail,
            candidateName: candName,
            role: candRole,
            company: "AvaHire Technologies",
            userEmail: authorEmail,
          });
          console.log(`[CANDIDATES-EMAIL] Sent selection/shortlist email to ${candEmail}`);
        } catch (emErr) {
          console.warn("[CANDIDATES-EMAIL] Selection email warning:", emErr.message);
        }
      } else if (newStatus === "rejected" && prevStatus !== "rejected") {
        try {
          await emailService.sendCandidateRejectedEmail({
            toEmail: candEmail,
            candidateName: candName,
            role: candRole,
            company: "AvaHire Technologies",
            userEmail: authorEmail,
          });
          console.log(`[CANDIDATES-EMAIL] Sent rejection email to ${candEmail}`);
        } catch (emErr) {
          console.warn("[CANDIDATES-EMAIL] Rejection email warning:", emErr.message);
        }
      }
    }

    res.json({ success: true, data: updated, message: "Candidate evaluation updated" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/candidates/:id - delete candidate evaluation
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await candidatesDb.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }
    res.json({ success: true, message: "Candidate evaluation deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
