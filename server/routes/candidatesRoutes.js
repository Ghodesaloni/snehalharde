const express = require("express");
const router = express.Router();
const candidatesDb = require("../db/candidatesDb");

// GET /api/candidates - list candidate evaluations
router.get("/", (req, res) => {
  try {
    const { status, role, search } = req.query;
    const list = candidatesDb.getAll({ status, role, search });
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/candidates/:id - get single candidate evaluation
router.get("/:id", (req, res) => {
  try {
    const cand = candidatesDb.getById(req.params.id);
    if (!cand) {
      return res.status(404).json({ success: false, error: "Candidate evaluation not found" });
    }
    res.json({ success: true, data: cand });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/candidates - create candidate evaluation
router.post("/", (req, res) => {
  try {
    const newCand = candidatesDb.create(req.body);
    res.status(201).json({ success: true, data: newCand, message: "Candidate evaluation created" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/candidates/:id - update candidate evaluation / status / notes
router.put("/:id", (req, res) => {
  try {
    const updated = candidatesDb.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }
    res.json({ success: true, data: updated, message: "Candidate evaluation updated" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/candidates/:id - delete candidate evaluation
router.delete("/:id", (req, res) => {
  try {
    const deleted = candidatesDb.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }
    res.json({ success: true, message: "Candidate evaluation deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
