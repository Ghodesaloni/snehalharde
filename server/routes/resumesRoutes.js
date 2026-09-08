const express = require("express");
const router = express.Router();
const resumesDb = require("../db/resumesDb");

// GET /api/resumes - list all candidates/resumes
router.get("/", (req, res) => {
  try {
    const { status, role, search } = req.query;
    const list = resumesDb.getAll({ status, role, search });
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/resumes/:id - get single resume/candidate
router.get("/:id", (req, res) => {
  try {
    const resume = resumesDb.getById(req.params.id);
    if (!resume) {
      return res.status(404).json({ success: false, error: "Candidate resume not found" });
    }
    res.json({ success: true, data: resume });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/resumes - create/upload resume
router.post("/", (req, res) => {
  try {
    const candidate = resumesDb.create(req.body);
    res.status(201).json({ success: true, data: candidate, message: "Resume added successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/resumes/:id - update resume
router.put("/:id", (req, res) => {
  try {
    const updated = resumesDb.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Candidate resume not found" });
    }
    res.json({ success: true, data: updated, message: "Candidate updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/resumes/:id/status - update status (e.g. Shortlisted, Rejected, Hired)
router.patch("/:id/status", (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: "Status is required" });
    }
    const updated = resumesDb.updateStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Candidate resume not found" });
    }
    res.json({ success: true, data: updated, message: `Status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/resumes/:id - delete resume
router.delete("/:id", (req, res) => {
  try {
    const deleted = resumesDb.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Candidate resume not found" });
    }
    res.json({ success: true, message: "Resume deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
