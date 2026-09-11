const express = require("express");
const router = express.Router();
const interviewsDb = require("../db/interviewsDb");

// GET /api/interviews - list interviews
router.get("/", async (req, res) => {
  try {
    const { status, search, userEmail } = req.query;
    const authorEmail = userEmail || req.headers["x-user-email"];
    const list = await interviewsDb.getAll({ status, search, userEmail: authorEmail });
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/interviews/code/:linkCode - get by linkCode (used by candidate portal)
router.get("/code/:linkCode", async (req, res) => {
  try {
    const interview = await interviewsDb.getByLinkCode(req.params.linkCode);
    if (!interview) {
      return res.status(404).json({ success: false, error: "Interview link is invalid or expired" });
    }
    res.json({ success: true, data: interview });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/interviews/:id - get single interview
router.get("/:id", async (req, res) => {
  try {
    const interview = (await interviewsDb.getById(req.params.id)) || (await interviewsDb.getByLinkCode(req.params.id));
    if (!interview) {
      return res.status(404).json({ success: false, error: "Interview not found" });
    }
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
