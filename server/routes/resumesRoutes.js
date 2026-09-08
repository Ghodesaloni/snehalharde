const express = require("express");
const router = express.Router();
const multer = require("multer");
const resumesDb = require("../db/resumesDb");
const jobsDb = require("../db/jobsDb");
const { analyzeResumeAgainstJd } = require("../services/resumeAnalysisService");
const { extractRawText, parseResumeText } = require("../services/resumeParserService");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

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

// POST /api/resumes/upload-and-screen - upload resume file and screen against target JD
router.post("/upload-and-screen", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No resume file uploaded" });
    }

    const originalName = req.file.originalname || "resume.pdf";
    const mimeType = req.file.mimetype || "application/pdf";

    // Extract real text from file
    const rawText = await extractRawText(req.file.buffer, mimeType, originalName);

    // Parse candidate details accurately from text
    const parsedCandidate = await parseResumeText(rawText, originalName);

    // Resolve target job
    let job = null;
    if (req.body.jobId && req.body.jobId !== "custom") {
      job = jobsDb.getById(req.body.jobId);
    }
    if (!job && req.body.customJd) {
      try {
        const cJd = typeof req.body.customJd === "string" ? JSON.parse(req.body.customJd) : req.body.customJd;
        job = {
          id: "custom-jd",
          title: cJd.title || "Target Role",
          dept: cJd.dept || "Engineering",
          expLevel: cJd.expLevel || "2-5 Years",
          keySkills: Array.isArray(cJd.keySkills)
            ? cJd.keySkills
            : (cJd.keySkills ? cJd.keySkills.split(",").map(s => s.trim()).filter(Boolean) : []),
          description: cJd.description || "",
          workMode: cJd.workMode || "Full-time"
        };
      } catch (e) {
        console.warn("Could not parse customJd JSON:", e.message);
      }
    }
    if (!job) {
      const allJobs = jobsDb.getAll({ status: "Active" });
      job = allJobs[0] || {
        id: "default-job",
        title: "Software Engineer",
        dept: "Engineering",
        expLevel: "2-4 Years",
        keySkills: ["Python", "Flask", "SQL"],
        description: "Software developer role"
      };
    }

    // Strictly analyze against JD
    const analysis = await analyzeResumeAgainstJd(parsedCandidate, job);

    // Persist new candidate in database with accurate screening outcome
    const newCandidate = resumesDb.create({
      name: parsedCandidate.name,
      email: parsedCandidate.email,
      phone: parsedCandidate.phone,
      location: parsedCandidate.location || "India",
      role: parsedCandidate.role,
      experience: parsedCandidate.experience,
      expYears: parsedCandidate.expYears,
      skills: parsedCandidate.skills,
      allSkills: parsedCandidate.allSkills,
      education: parsedCandidate.education,
      atsScore: analysis.atsScore,
      matchScore: analysis.matchScore,
      skillsMatchPct: analysis.skillsMatchPct,
      status: analysis.status,
      matchedSkills: analysis.matchedSkills,
      missingSkills: analysis.missingSkills,
      keyPoints: analysis.keyPoints,
      summary: analysis.aiSummary,
      targetJobId: job.id,
      targetJobTitle: job.title,
      resumeFileName: originalName,
      uploadedDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      rawText: rawText.slice(0, 2000)
    });

    res.status(201).json({
      success: true,
      data: newCandidate,
      targetJob: job,
      analysis,
      message: `Resume analyzed: ATS ${analysis.atsScore}/100 (${analysis.status})`
    });
  } catch (err) {
    console.error("Upload and screen error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/resumes/analyze-batch-jd - batch analyze multiple resumes against a target JD
router.post("/analyze-batch-jd", async (req, res) => {
  try {
    const { jobId, customJd, candidateIds } = req.body;
    let job = null;
    if (jobId) {
      job = jobsDb.getById(jobId);
    }
    if (!job && customJd) {
      job = {
        id: "custom-jd",
        title: customJd.title || "Target Role",
        dept: customJd.dept || "Engineering",
        expLevel: customJd.expLevel || "2-5 Years",
        keySkills: Array.isArray(customJd.keySkills)
          ? customJd.keySkills
          : (customJd.keySkills ? customJd.keySkills.split(",").map(s => s.trim()).filter(Boolean) : []),
        description: customJd.description || "",
        workMode: customJd.workMode || "Full-time"
      };
    }
    if (!job) {
      // Default to first active job
      const allJobs = jobsDb.getAll({ status: "Active" });
      job = allJobs[0] || {
        id: "default-job",
        title: "Software Engineer",
        dept: "Engineering",
        expLevel: "2-4 Years",
        keySkills: ["Python", "Flask", "SQL", "React", "Docker"],
        description: "General software engineer position"
      };
    }

    const allCandidates = resumesDb.getAll();
    const targets = candidateIds && candidateIds.length > 0
      ? allCandidates.filter(c => candidateIds.includes(c.id))
      : allCandidates;

    const results = [];
    for (const candidate of targets) {
      try {
        const analysis = await analyzeResumeAgainstJd(candidate, job);
        const updated = resumesDb.update(candidate.id, {
          atsScore: analysis.atsScore,
          matchScore: analysis.matchScore,
          skillsMatchPct: analysis.skillsMatchPct,
          status: analysis.status,
          matchedSkills: analysis.matchedSkills,
          missingSkills: analysis.missingSkills,
          keyPoints: analysis.keyPoints,
          summary: analysis.aiSummary,
          targetJobId: job.id,
          targetJobTitle: job.title
        });
        results.push(updated);
      } catch (innerErr) {
        console.error(`Failed to analyze candidate ${candidate.id}:`, innerErr);
        results.push(candidate);
      }
    }

    const shortlistedCount = results.filter(r => r.status === "Shortlisted").length;
    const reviewCount = results.filter(r => r.status === "Review").length;
    const rejectedCount = results.filter(r => r.status === "Rejected").length;

    res.json({
      success: true,
      message: `Analyzed ${results.length} resumes against ${job.title}`,
      data: results,
      targetJob: job,
      stats: {
        totalAnalyzed: results.length,
        shortlistedCount,
        reviewCount,
        rejectedCount
      }
    });
  } catch (err) {
    console.error("Batch analyze error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/resumes/:id/analyze-jd - analyze single candidate against a target JD
router.post("/:id/analyze-jd", async (req, res) => {
  try {
    const candidate = resumesDb.getById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, error: "Candidate resume not found" });
    }

    const { jobId, customJd } = req.body;
    let job = null;
    if (jobId) {
      job = jobsDb.getById(jobId);
    }
    if (!job && customJd) {
      job = {
        id: "custom-jd",
        title: customJd.title || candidate.role || "Target Role",
        dept: customJd.dept || "Engineering",
        expLevel: customJd.expLevel || "2-5 Years",
        keySkills: Array.isArray(customJd.keySkills)
          ? customJd.keySkills
          : (customJd.keySkills ? customJd.keySkills.split(",").map(s => s.trim()).filter(Boolean) : candidate.allSkills || []),
        description: customJd.description || "",
        workMode: customJd.workMode || "Full-time"
      };
    }
    if (!job) {
      // Find matching job by role or first job
      const allJobs = jobsDb.getAll();
      job = allJobs.find(j => j.title.toLowerCase().includes(candidate.role.toLowerCase())) || allJobs[0];
    }

    const analysis = await analyzeResumeAgainstJd(candidate, job);
    const updated = resumesDb.update(candidate.id, {
      atsScore: analysis.atsScore,
      matchScore: analysis.matchScore,
      skillsMatchPct: analysis.skillsMatchPct,
      status: analysis.status,
      matchedSkills: analysis.matchedSkills,
      missingSkills: analysis.missingSkills,
      keyPoints: analysis.keyPoints,
      summary: analysis.aiSummary,
      targetJobId: job.id,
      targetJobTitle: job.title
    });

    res.json({
      success: true,
      message: `Candidate analyzed against ${job.title}`,
      data: updated,
      analysis,
      targetJob: job
    });
  } catch (err) {
    console.error("Analyze single resume error:", err);
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
