const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const resumesDb = require("../db/resumesDb");
const jobsDb = require("../db/jobsDb");
const awsService = require("../services/awsService");
const { analyzeResumeAgainstJd } = require("../services/resumeAnalysisService");
const { parseResume } = require("../services/resumeParserService");
const { ALL_DOMAINS } = require("../services/domainClassifier");

const ALLOWED_RESUME_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt", ".rtf", ".jpg", ".jpeg", ".png"];
const ALLOWED_RESUME_MIMES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "application/rtf",
  "text/rtf",
  "image/jpeg",
  "image/jpg",
  "image/png"
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const mime = (file.mimetype || "").toLowerCase();

    const hasValidExt = ALLOWED_RESUME_EXTENSIONS.includes(ext);
    const hasValidMime = ALLOWED_RESUME_MIMES.includes(mime) || 
      (mime.startsWith("text/") && ext !== ".csv" && ext !== ".tsv" && ext !== ".json") ||
      mime.startsWith("image/");

    if (!hasValidExt && !hasValidMime) {
      return cb(
        new Error(`Unsupported document type "${ext || file.originalname}". Accepted formats: .pdf, .docx, .doc, .txt, .jpg, .jpeg, .png.`)
      );
    }
    cb(null, true);
  }
});

// Middleware to catch multer filter errors and return clean JSON response
const handleUpload = (req, res, next) => {
  upload.single("resume")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message || "Accepted formats: .pdf, .docx, .doc, .txt, .jpg, .jpeg, .png."
      });
    }
    next();
  });
};

const handleMultipleUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message || "Accepted formats: .pdf, .docx, .doc, .txt, .jpg, .jpeg, .png."
      });
    }
    if (!req.files && req.file) {
      req.files = [req.file];
    }
    next();
  });
};

// Helper to resolve target job from request
function resolveJob(jobId, customJdBody) {
  let job = null;
  if (jobId && jobId !== "custom" && jobId !== "all") {
    job = jobsDb.getById(jobId);
  }
  if (!job && customJdBody) {
    try {
      const cJd = typeof customJdBody === "string" ? JSON.parse(customJdBody) : customJdBody;
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
      title: "Senior Full Stack Engineer",
      dept: "Engineering",
      expLevel: "3+ Years",
      keySkills: ["Python", "React", "SQL", "Docker"],
      description: "Software engineering role requiring web development, databases, and containerization."
    };
  }
  return job;
}

// GET /api/resumes - list all candidates/resumes
router.get("/", (req, res) => {
  try {
    const { status, role, search, field, domain, jobId, sortBy, userEmail } = req.query;
    const authorEmail = userEmail || req.headers["x-user-email"];
    let list = resumesDb.getAll({ status, role, search, field, domain, jobId, sortBy, userEmail: authorEmail });
    if (list.length === 0 && authorEmail) {
      // Fallback: if filtering by specific user email returned 0 records, return the available candidate talent pool
      list = resumesDb.getAll({ status, role, search, field, domain, jobId, sortBy });
    }
    res.json({
      success: true,
      count: list.length,
      data: list,
      domains: ALL_DOMAINS
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/resumes/domains - list available domains
router.get("/domains", (req, res) => {
  res.json({ success: true, domains: ALL_DOMAINS });
});

// POST /api/resumes/upload-and-screen - upload single resume file and screen against target JD
router.post("/upload-and-screen", handleUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No resume file uploaded" });
    }

    const originalName = req.file.originalname || "resume.pdf";
    const mimeType = req.file.mimetype || "application/pdf";

    // 1. Production parsing pipeline
    const parsed = await parseResume(req.file.buffer, mimeType, originalName);

    // If file is not a valid resume (selfie, logo, screenshot, invoice, etc.), reject immediately and do NOT save!
    if (parsed.isValidResume === false) {
      return res.status(422).json({
        success: false,
        isValidResume: false,
        filename: originalName,
        error: parsed.rejectionReason || "Uploaded file does not appear to be a valid professional resume. Please upload a real resume document."
      });
    }

    // 2. Resolve target job
    const job = resolveJob(req.body.jobId, req.body.customJd);

    // 3. Transparent, reproducible ATS scoring
    const candidateDataForAnalysis = {
      name: parsed.candidate.name,
      role: parsed.experience[0]?.title || "Professional",
      experience: parsed.experience_display,
      experience_years: parsed.experience_years,
      education: parsed.education,
      certifications: parsed.certifications,
      all_normalized_skills: parsed.all_normalized_skills,
      allSkills: parsed.all_normalized_skills.map(s => s.normalized),
      skills: parsed.skills.technical,
      rawText: parsed.raw_text,
      summary: parsed.professional_summary,
      domain: parsed.domains.primary,
      secondary_domains: parsed.domains.secondary,
      resume_quality: parsed.resume_quality
    };

    const analysis = await analyzeResumeAgainstJd(candidateDataForAnalysis, job);

    // 4. Optional S3 backup
    let s3Metadata = null;
    try {
      const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
      const s3Key = `resumes/${Date.now()}_${sanitizedName}`;
      s3Metadata = await awsService.uploadToS3(req.file.buffer, s3Key, mimeType);
    } catch (s3Err) {
      console.warn("[AWS-S3] Upload notice:", s3Err.message);
    }

    // 5. Persist candidate in database with no duplicate creation
    const authorEmail = req.body.createdBy || req.body.userEmail || req.headers["x-user-email"] || "";
    const candidateRecord = resumesDb.create({
      name: parsed.candidate.name,
      email: parsed.candidate.email,
      phone: parsed.candidate.phone,
      location: parsed.candidate.location,
      role: parsed.experience[0]?.title || "Professional",
      field: parsed.domains.primary,
      domain: parsed.domains.primary,
      secondaryDomains: parsed.domains.secondary,
      createdBy: authorEmail,
      userEmail: authorEmail,
      experience: parsed.experience_display,
      expYears: parsed.experience_years,
      skills: (parsed.all_normalized_skills || []).slice(0, 3).map(s => s.normalized),
      allSkills: (parsed.all_normalized_skills || []).map(s => s.normalized),
      all_normalized_skills: parsed.all_normalized_skills,
      categorizedSkills: parsed.skills,
      education: parsed.education[0]?.degree || "Bachelor's Degree",
      educationEntries: parsed.education,
      experienceEntries: parsed.experience,
      projects: parsed.projects,
      certifications: parsed.certifications,
      atsScore: analysis.atsScore,
      matchScore: analysis.matchScore,
      skillsMatchPct: analysis.skillsMatchPct,
      status: analysis.status,
      breakdown: analysis.breakdown,
      matchedSkills: analysis.matchedSkills,
      missingSkills: analysis.missingSkills,
      missingRequiredSkills: analysis.missingRequiredSkills,
      missingPreferredSkills: analysis.missingPreferredSkills,
      keyPoints: analysis.keyPoints,
      summary: analysis.aiSummary || parsed.professional_summary,
      resumeQuality: parsed.resume_quality,
      targetJobId: job.id,
      targetJobTitle: job.title,
      jobId: job.id && job.id !== "custom-jd" ? job.id : null,
      resumeFileName: originalName,
      requiresOcr: parsed.requires_ocr,
      ocrWarning: parsed.ocr_warning,
      rawText: parsed.raw_text?.slice(0, 3000),
      storageProvider: s3Metadata?.url ? "AWS S3" : "Local",
      s3Url: s3Metadata?.url || null,
      s3Key: s3Metadata?.key || null,
      s3Bucket: s3Metadata?.bucket || null
    });

    res.status(201).json({
      success: true,
      data: candidateRecord,
      targetJob: job,
      analysis,
      parsed,
      message: `Resume parsed and classified into "${parsed.domains.primary}": ATS ${analysis.atsScore}/100 (${analysis.status})`
    });
  } catch (err) {
    console.error("Upload and screen error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/resumes/upload-batch - upload and process multiple resumes simultaneously
router.post("/upload-batch", handleMultipleUpload, async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: "No resume files uploaded" });
    }

    const job = resolveJob(req.body.jobId, req.body.customJd);
    const results = [];
    const rejected = [];
    const errors = [];
    const authorEmail = req.body.createdBy || req.body.userEmail || req.headers["x-user-email"] || "";

    for (const file of files) {
      const originalName = file.originalname || "resume.pdf";
      const mimeType = file.mimetype || "application/pdf";

      try {
        const parsed = await parseResume(file.buffer, mimeType, originalName);

        // Validation filter: Ignore candidate photos, selfies, logos, WhatsApp UI, signatures, etc.
        // Do NOT save invalid/non-resume images or files as candidates!
        if (parsed.isValidResume === false) {
          rejected.push({
            filename: originalName,
            reason: parsed.rejectionReason || "File rejected: does not contain valid professional resume content (detected non-resume image, selfie, logo, screenshot, or receipt).",
            isValidResume: false
          });
          continue;
        }

        const candidateDataForAnalysis = {
          name: parsed.candidate.name,
          role: parsed.experience[0]?.title || "Professional",
          experience: parsed.experience_display,
          experience_years: parsed.experience_years,
          education: parsed.education,
          certifications: parsed.certifications,
          all_normalized_skills: parsed.all_normalized_skills,
          allSkills: parsed.all_normalized_skills.map(s => s.normalized),
          skills: parsed.skills.technical,
          rawText: parsed.raw_text,
          summary: parsed.professional_summary,
          domain: parsed.domains.primary,
          secondary_domains: parsed.domains.secondary,
          resume_quality: parsed.resume_quality
        };

        const analysis = await analyzeResumeAgainstJd(candidateDataForAnalysis, job);

        // Optional S3 backup
        let s3Metadata = null;
        try {
          const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
          const s3Key = `resumes/${Date.now()}_${sanitizedName}`;
          s3Metadata = await awsService.uploadToS3(file.buffer, s3Key, mimeType);
        } catch (s3Err) {
          // Non-blocking S3 notice
        }

        const candidateRecord = resumesDb.create({
          name: parsed.candidate.name,
          email: parsed.candidate.email,
          phone: parsed.candidate.phone,
          location: parsed.candidate.location,
          role: parsed.experience[0]?.title || "Professional",
          field: parsed.domains.primary,
          domain: parsed.domains.primary,
          secondaryDomains: parsed.domains.secondary,
          createdBy: authorEmail,
          userEmail: authorEmail,
          experience: parsed.experience_display,
          expYears: parsed.experience_years,
          skills: (parsed.all_normalized_skills || []).slice(0, 3).map(s => s.normalized),
          allSkills: (parsed.all_normalized_skills || []).map(s => s.normalized),
          all_normalized_skills: parsed.all_normalized_skills,
          categorizedSkills: parsed.skills,
          education: parsed.education[0]?.degree || "Bachelor's Degree",
          educationEntries: parsed.education,
          experienceEntries: parsed.experience,
          projects: parsed.projects,
          certifications: parsed.certifications,
          atsScore: analysis.atsScore,
          matchScore: analysis.matchScore,
          skillsMatchPct: analysis.skillsMatchPct,
          status: analysis.status,
          breakdown: analysis.breakdown,
          matchedSkills: analysis.matchedSkills,
          missingSkills: analysis.missingSkills,
          missingRequiredSkills: analysis.missingRequiredSkills,
          missingPreferredSkills: analysis.missingPreferredSkills,
          keyPoints: analysis.keyPoints,
          summary: analysis.aiSummary || parsed.professional_summary,
          resumeQuality: parsed.resume_quality,
          targetJobId: job.id,
          targetJobTitle: job.title,
          jobId: job.id && job.id !== "custom-jd" ? job.id : null,
          resumeFileName: originalName,
          requiresOcr: parsed.requires_ocr,
          ocrWarning: parsed.ocr_warning,
          rawText: parsed.raw_text?.slice(0, 3000),
          storageProvider: s3Metadata?.url ? "AWS S3" : "Local",
          s3Url: s3Metadata?.url || null,
          s3Key: s3Metadata?.key || null,
          s3Bucket: s3Metadata?.bucket || null
        });

        results.push(candidateRecord);
      } catch (fileErr) {
        console.error(`Error parsing file ${originalName}:`, fileErr);
        errors.push({ filename: originalName, error: fileErr.message });
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      rejected,
      errors,
      summary: {
        total: files.length,
        processedCount: results.length,
        rejectedCount: rejected.length,
        errorCount: errors.length,
        duplicatesUpdatedCount: results.filter(r => r.isDuplicateUpdated).length
      },
      targetJob: job,
      message: `Batch processed: ${results.length} valid resumes saved, ${rejected.length} non-resume files rejected, ${errors.length} failed.`
    });
  } catch (err) {
    console.error("Batch upload error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/resumes/analyze-batch-jd - batch re-analyze multiple resumes against a target JD
router.post("/analyze-batch-jd", async (req, res) => {
  try {
    const { jobId, customJd, candidateIds } = req.body;
    const job = resolveJob(jobId, customJd);

    const allCandidates = resumesDb.getAll();
    const targets = candidateIds && candidateIds.length > 0
      ? allCandidates.filter(c => candidateIds.includes(c.id))
      : allCandidates;

    const results = await Promise.all(
      targets.map(async (candidate) => {
        try {
          const analysis = await analyzeResumeAgainstJd(candidate, job);
          const updated = resumesDb.update(candidate.id, {
            atsScore: analysis.atsScore,
            matchScore: analysis.matchScore,
            skillsMatchPct: analysis.skillsMatchPct,
            status: analysis.status,
            breakdown: analysis.breakdown,
            matchedSkills: analysis.matchedSkills,
            missingSkills: analysis.missingSkills,
            missingRequiredSkills: analysis.missingRequiredSkills,
            missingPreferredSkills: analysis.missingPreferredSkills,
            keyPoints: analysis.keyPoints,
            summary: analysis.aiSummary,
            targetJobId: job.id,
            targetJobTitle: job.title
          });
          return updated || candidate;
        } catch (innerErr) {
          console.error(`Failed to analyze candidate ${candidate.id}:`, innerErr);
          return candidate;
        }
      })
    );

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
    const job = resolveJob(jobId, customJd);

    const analysis = await analyzeResumeAgainstJd(candidate, job);
    const updated = resumesDb.update(candidate.id, {
      atsScore: analysis.atsScore,
      matchScore: analysis.matchScore,
      skillsMatchPct: analysis.skillsMatchPct,
      status: analysis.status,
      breakdown: analysis.breakdown,
      matchedSkills: analysis.matchedSkills,
      missingSkills: analysis.missingSkills,
      missingRequiredSkills: analysis.missingRequiredSkills,
      missingPreferredSkills: analysis.missingPreferredSkills,
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

// POST /api/resumes - create/upload resume directly
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
