const fs = require("fs");
const path = require("path");

const RECORDINGS_DIR = path.resolve(__dirname, "../data/recordings");

function ensureRecordingsDir() {
  if (!fs.existsSync(RECORDINGS_DIR)) {
    try {
      fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
    } catch (err) {
      console.error("[RecordingStorage] Error creating recordings directory:", err.message);
    }
  }
}

// Helper to sanitize candidate ID or link code for safe filesystem path
function sanitizeFilename(id) {
  return String(id || "unassigned").replace(/[^a-zA-Z0-9_-]/g, "_");
}

/**
 * Determine file extension from mime type or data URI header
 */
function getExtensionFromMime(mimeType = "") {
  const lower = mimeType.toLowerCase();
  if (lower.includes("webm")) return "webm";
  if (lower.includes("mp4") || lower.includes("m4a")) return "mp4";
  if (lower.includes("mpeg") || lower.includes("mp3")) return "mp3";
  if (lower.includes("ogg") || lower.includes("opus")) return "ogg";
  if (lower.includes("wav")) return "wav";
  return "webm";
}

/**
 * Save an audio recording buffer or base64 to server storage and return metadata
 */
async function saveRecording({ candidateId, linkCode, audioBuffer, audioBase64, mimeType = "audio/webm" }) {
  ensureRecordingsDir();

  const primaryId = candidateId || linkCode || `cand-${Date.now()}`;
  const safeId = sanitizeFilename(primaryId);
  const ext = getExtensionFromMime(mimeType);
  const filename = `recording_${safeId}.${ext}`;
  const filePath = path.join(RECORDINGS_DIR, filename);

  try {
    let bufferToWrite = audioBuffer;

    if (!bufferToWrite && audioBase64) {
      let rawBase64 = audioBase64;
      if (rawBase64.includes(",")) {
        const parts = rawBase64.split(",");
        const header = parts[0];
        rawBase64 = parts[1];
        if (header.includes("audio/")) {
          const match = header.match(/audio\/([a-zA-Z0-9-_]+)/);
          if (match && match[1]) {
            mimeType = `audio/${match[1]}`;
          }
        }
      }
      bufferToWrite = Buffer.from(rawBase64, "base64");
    }

    if (!bufferToWrite || bufferToWrite.length === 0) {
      throw new Error("No audio payload provided for recording storage.");
    }

    await fs.promises.writeFile(filePath, bufferToWrite);
    const stats = await fs.promises.stat(filePath);

    const relativeUrl = `/api/candidates/${encodeURIComponent(primaryId)}/audio`;

    console.log(`[RecordingStorage] Saved ${stats.size} bytes for candidate [${primaryId}] -> ${filename}`);

    return {
      success: true,
      candidateId: primaryId,
      linkCode: linkCode || "",
      filename,
      filePath,
      fileSize: stats.size,
      mimeType,
      audioUrl: relativeUrl
    };
  } catch (err) {
    console.error(`[RecordingStorage] Error saving audio for candidate [${primaryId}]:`, err.message);
    throw err;
  }
}

/**
 * Look up recording file for a candidate by ID or link code
 */
function findRecordingFile(candidateIdOrLinkCode) {
  ensureRecordingsDir();
  if (!candidateIdOrLinkCode) return null;

  const safeId = sanitizeFilename(candidateIdOrLinkCode);
  const extensions = ["webm", "mp4", "ogg", "mp3", "wav", "m4a"];

  for (const ext of extensions) {
    const directPath = path.join(RECORDINGS_DIR, `recording_${safeId}.${ext}`);
    if (fs.existsSync(directPath)) {
      try {
        const stats = fs.statSync(directPath);
        if (stats.size > 0) {
          return {
            filePath: directPath,
            filename: `recording_${safeId}.${ext}`,
            size: stats.size,
            mimeType: ext === "webm" ? "audio/webm" : (ext === "mp4" ? "audio/mp4" : `audio/${ext}`),
            updatedAt: stats.mtime
          };
        }
      } catch (e) {}
    }
  }

  // Also check if any file in RECORDINGS_DIR starts with recording_<safeId>
  try {
    const files = fs.readdirSync(RECORDINGS_DIR);
    const match = files.find(f => f.startsWith(`recording_${safeId}`));
    if (match) {
      const fullPath = path.join(RECORDINGS_DIR, match);
      const stats = fs.statSync(fullPath);
      const ext = path.extname(match).replace(".", "").toLowerCase() || "webm";
      return {
        filePath: fullPath,
        filename: match,
        size: stats.size,
        mimeType: ext === "webm" ? "audio/webm" : (ext === "mp4" ? "audio/mp4" : `audio/${ext}`),
        updatedAt: stats.mtime
      };
    }
  } catch (e) {}

  return null;
}

/**
 * Stream an audio file with HTTP Range support for seekable, smooth playback in browser
 */
function streamAudioFile(req, res, fileInfo) {
  const { filePath, size, mimeType } = fileInfo;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : size - 1;

    if (start >= size || end >= size || start > end) {
      res.status(416).set({
        "Content-Range": `bytes */${size}`
      }).end();
      return;
    }

    const chunksize = end - start + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": mimeType || "audio/webm",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*"
    });

    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": size,
      "Content-Type": mimeType || "audio/webm",
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*"
    });

    fs.createReadStream(filePath).pipe(res);
  }
}

/**
 * Migrate legacy embedded base64 audio in candidates.json to physical disk recordings
 */
function migrateLegacyBase64Audio() {
  ensureRecordingsDir();
  const candFile = path.resolve(__dirname, "../data/candidates.json");
  if (!fs.existsSync(candFile)) return;

  try {
    const raw = fs.readFileSync(candFile, "utf8");
    if (!raw.includes("data:audio/")) return;

    const list = JSON.parse(raw);
    let changed = false;

    for (const c of list) {
      if (c.audioUrl && typeof c.audioUrl === "string" && c.audioUrl.startsWith("data:audio/")) {
        try {
          const safeId = sanitizeFilename(c.id);
          const ext = c.audioUrl.includes("codecs=opus") || c.audioUrl.includes("audio/webm") ? "webm" : "webm";
          const filename = `recording_${safeId}.${ext}`;
          const filePath = path.join(RECORDINGS_DIR, filename);

          const base64Data = c.audioUrl.split(",")[1];
          if (base64Data) {
            fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
            c.audioUrl = `/api/candidates/${encodeURIComponent(c.id)}/audio`;
            c.audioPath = filePath;
            changed = true;
          }
        } catch (e) {
          console.warn("[RecordingStorage] Legacy audio migration note:", e.message);
        }
      }
    }

    if (changed) {
      fs.writeFileSync(candFile, JSON.stringify(list, null, 2), "utf8");
      console.log("[RecordingStorage] Migrated legacy inline audio from candidates.json to recordings disk storage.");
    }
  } catch (err) {
    console.warn("[RecordingStorage] Base64 migration check notice:", err.message);
  }
}

// Run migration check on startup
ensureRecordingsDir();
try {
  migrateLegacyBase64Audio();
} catch (e) {}

module.exports = {
  RECORDINGS_DIR,
  ensureRecordingsDir,
  saveRecording,
  findRecordingFile,
  streamAudioFile,
  getExtensionFromMime
};
