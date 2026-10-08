const express = require("express");
const router = express.Router();
const multer = require("multer");
const candidatesDb = require("../db/candidatesDb");
const automatedEmailService = require("../services/automatedEmailService");
const recordingStorageService = require("../services/recordingStorageService");

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // Allow recordings up to 100MB
});

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

// GET /api/candidates/:id/audio - Stream complete AI interview audio recording with HTTP Range seeking
router.get(["/:id/audio", "/:id/recording/stream"], async (req, res) => {
  try {
    const candidateId = req.params.id;
    const fileInfo = recordingStorageService.findRecordingFile(candidateId);

    if (fileInfo) {
      return recordingStorageService.streamAudioFile(req, res, fileInfo);
    }

    // If file not found by candidateId directly, check candidate database record for stored audioUrl or linkCode
    const candidate = await candidatesDb.getById(candidateId);
    if (candidate) {
      if (candidate.linkCode) {
        const linkFileInfo = recordingStorageService.findRecordingFile(candidate.linkCode);
        if (linkFileInfo) {
          return recordingStorageService.streamAudioFile(req, res, linkFileInfo);
        }
      }

      // If candidate has base64 data URL, convert on the fly to file
      if (candidate.audioUrl && candidate.audioUrl.startsWith("data:audio/")) {
        try {
          const saved = await recordingStorageService.saveRecording({
            candidateId: candidate.id,
            audioBase64: candidate.audioUrl
          });
          const newFileInfo = recordingStorageService.findRecordingFile(candidate.id);
          if (newFileInfo) {
            await candidatesDb.update(candidate.id, { audioUrl: saved.audioUrl, audioPath: saved.filePath });
            return recordingStorageService.streamAudioFile(req, res, newFileInfo);
          }
        } catch (convErr) {
          console.warn("[CandidatesAPI] On-the-fly audio migration notice:", convErr.message);
        }
      }
    }

    return res.status(404).json({
      success: false,
      error: `Audio recording not found for candidate ${candidateId}`
    });
  } catch (err) {
    console.error("[CandidatesAPI] Error streaming candidate audio:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/candidates/:id/recording - Get recording info/status for candidate
router.get("/:id/recording", async (req, res) => {
  try {
    const candidateId = req.params.id;
    const fileInfo = recordingStorageService.findRecordingFile(candidateId);
    const candidate = await candidatesDb.getById(candidateId);

    if (!fileInfo && !candidate?.audioUrl) {
      return res.status(404).json({
        success: false,
        exists: false,
        message: "No audio recording found for this candidate"
      });
    }

    res.json({
      success: true,
      exists: true,
      data: {
        candidateId,
        audioUrl: `/api/candidates/${encodeURIComponent(candidateId)}/audio`,
        size: fileInfo?.size || 0,
        filename: fileInfo?.filename || "recording.webm",
        mimeType: fileInfo?.mimeType || "audio/webm",
        duration: candidate?.duration || "N/A"
      }
    });
  } catch (err) {
    console.error("[CandidatesAPI] Error getting candidate recording metadata:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/candidates/:id/recording or POST /api/candidates/recording - Save and finalize audio recording
router.post(["/:id/recording", "/recording"], audioUpload.single("audio"), async (req, res) => {
  try {
    const candidateId = req.params.id || req.body.candidateId || req.body.id || req.body.linkCode;
    if (!candidateId) {
      return res.status(400).json({ success: false, error: "candidateId or linkCode is required" });
    }

    let audioBuffer = req.file ? req.file.buffer : null;
    let audioBase64 = req.body.audioBase64 || req.body.audioData || req.body.audioUrl;
    let mimeType = (req.file ? req.file.mimetype : req.body.mimeType) || "audio/webm";

    if (!audioBuffer && !audioBase64) {
      return res.status(400).json({ success: false, error: "No audio data provided (file or base64 required)" });
    }

    const saved = await recordingStorageService.saveRecording({
      candidateId,
      linkCode: req.body.linkCode || "",
      audioBuffer,
      audioBase64,
      mimeType
    });

    // Update candidate record in PostgreSQL
    await candidatesDb.update(candidateId, {
      audioUrl: saved.audioUrl,
      audioPath: saved.filePath
    }).catch(err => console.warn("[CandidatesAPI] DB update note after recording save:", err.message));

    res.status(200).json({
      success: true,
      message: "Audio recording saved and linked to candidate successfully",
      data: {
        candidateId,
        audioUrl: saved.audioUrl,
        fileSize: saved.fileSize,
        mimeType: saved.mimeType
      }
    });
  } catch (err) {
    console.error("[CandidatesAPI] Error saving candidate audio recording:", err);
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

    if (newCand && newCand.status === "Shortlisted") {
      automatedEmailService.sendCandidateShortlistedEmail({ candidate: newCand, req }).catch(err => {
        console.warn("[AUTOMATED-EMAIL] Shortlist email notice:", err.message);
      });
    } else if (newCand && (newCand.status === "Selected" || newCand.status === "Hired")) {
      automatedEmailService.sendCongratulationsEmail({ candidate: newCand, req }).catch(err => {
        console.warn("[AUTOMATED-EMAIL] Congratulations email notice:", err.message);
      });
    }

    res.status(201).json({ success: true, data: newCand, message: "Candidate evaluation created" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/candidates/:id - update candidate evaluation / status / notes
router.put("/:id", async (req, res) => {
  try {
    const updated = await candidatesDb.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }

    // Trigger Automated Email System
    if (req.body.status === "Shortlisted" || updated.status === "Shortlisted") {
      automatedEmailService.sendCandidateShortlistedEmail({ candidate: updated, req }).catch(err => {
        console.warn("[AUTOMATED-EMAIL] Shortlist email notice:", err.message);
      });
    } else if (req.body.status === "Selected" || req.body.status === "Hired" || updated.status === "Selected" || updated.status === "Hired") {
      automatedEmailService.sendCongratulationsEmail({ candidate: updated, req }).catch(err => {
        console.warn("[AUTOMATED-EMAIL] Congratulations email notice:", err.message);
      });
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

