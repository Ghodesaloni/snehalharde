const express = require("express");
const router = express.Router();
const jobsDb = require("../db/jobsDb");

// GET /api/jobs - list all jobs with optional query filters
router.get("/", (req, res) => {
  try {
    const { status, dept, workMode, search, userEmail } = req.query;
    const authorEmail = userEmail || req.headers["x-user-email"];
    const jobs = jobsDb.getAll({ status, dept, workMode, search, userEmail: authorEmail });
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/jobs/:id - get single job
router.get("/:id", (req, res) => {
  try {
    const job = jobsDb.getById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/jobs - create new job
router.post("/", (req, res) => {
  try {
    const { title, dept, jobLevel, reportsTo, loc, isRemotePosition, workMode, type, expLevel, description, keySkills, status, createdBy, userEmail } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: "Job title is required" });
    }
    const authorEmail = createdBy || userEmail || req.headers["x-user-email"] || "";
    const newJob = jobsDb.create({
      title,
      dept,
      jobLevel,
      reportsTo,
      loc,
      isRemotePosition,
      workMode,
      type,
      expLevel,
      description,
      keySkills,
      status,
      createdBy: authorEmail,
      userEmail: authorEmail
    });
    res.status(201).json({ success: true, data: newJob, message: "Job created successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/jobs/:id - update existing job
router.put("/:id", (req, res) => {
  try {
    const updated = jobsDb.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }
    res.json({ success: true, data: updated, message: "Job updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/jobs/:id - delete job
router.delete("/:id", (req, res) => {
  try {
    const deleted = jobsDb.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }
    res.json({ success: true, message: "Job deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
