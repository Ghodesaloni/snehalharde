const fs = require("fs");
const path = require("path");
const { getPool } = require("./postgres");
const candidateSessionsDb = require("./candidateSessionsDb");
const interviewsDb = require("./interviewsDb");
const candidatesDb = require("./candidatesDb");

const DATA_DIR = path.resolve(__dirname, "../data");
const VIOLATIONS_FILE = path.join(DATA_DIR, "proctoring_violations.json");

function readJson() {
  try {
    if (fs.existsSync(VIOLATIONS_FILE)) {
      return JSON.parse(fs.readFileSync(VIOLATIONS_FILE, "utf8"));
    }
  } catch (err) {
    console.warn("Could not read proctoring violations mirror:", err.message);
  }
  return [];
}

function writeJson(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(VIOLATIONS_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.warn("Could not write proctoring violations mirror:", err.message);
  }
}

class ProctoringDatabase {
  async recordViolation({
    linkCode,
    sessionId = null,
    candidateEmail = "",
    candidateName = "",
    violationType,
    severity = "warning",
    warningNumber = 0,
    details = "",
    metadata = {}
  }) {
    const cleanLink = (linkCode || "").replace(/^interview_/, "").trim();
    const cleanType = String(violationType || "unknown_violation").toLowerCase().trim();
    const timestamp = new Date().toISOString();

    const violationRecord = {
      id: `viol-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sessionId,
      linkCode: cleanLink,
      candidateEmail: (candidateEmail || "").toLowerCase().trim(),
      candidateName: candidateName || "Candidate",
      violationType: cleanType,
      severity,
      warningNumber: Number(warningNumber || 0),
      details: details || `Anti-cheating event: ${cleanType}`,
      metadata: metadata || {},
      timestamp,
      createdAt: timestamp
    };

    // 1. Update local JSON mirror
    const list = readJson();
    list.unshift(violationRecord);
    writeJson(list);

    // 2. Persist into PostgreSQL public.proctoring_violations
    try {
      const p = getPool();
      const query = `
        INSERT INTO public.proctoring_violations (
          session_id, link_code, candidate_email, candidate_name,
          violation_type, severity, warning_number, details, metadata, timestamp, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *;
      `;
      await p.query(query, [
        sessionId,
        cleanLink,
        violationRecord.candidateEmail,
        violationRecord.candidateName,
        cleanType,
        severity,
        violationRecord.warningNumber,
        violationRecord.details,
        JSON.stringify(metadata)
      ]);
    } catch (err) {
      console.warn("PostgreSQL proctoring_violations insert notice:", err.message);
    }

    // 3. Update candidate portal session with updated violations & warning count
    if (cleanLink) {
      try {
        const session = await candidateSessionsDb.getByLinkCode(cleanLink);
        if (session) {
          const currentViolations = Array.isArray(session.violations) ? session.violations : [];
          currentViolations.push(violationRecord);

          const updatedWarningCount = Math.max(session.warning_count || 0, warningNumber || 0);

          await candidateSessionsDb.createOrUpdate({
            ...session,
            warning_count: updatedWarningCount,
            violations: currentViolations,
            proctoring_status: severity === "critical_termination" ? "Terminated" : `Warning ${updatedWarningCount}/3`
          });
        }
      } catch (err) {
        console.warn("Error updating session proctoring status:", err.message);
      }
    }

    return violationRecord;
  }

  async getByLinkCode(linkCode) {
    const cleanLink = (linkCode || "").replace(/^interview_/, "").trim();
    if (!cleanLink) return [];

    try {
      const p = getPool();
      const res = await p.query(
        "SELECT * FROM public.proctoring_violations WHERE LOWER(link_code) = LOWER($1) ORDER BY created_at DESC",
        [cleanLink]
      );
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(this._mapRow);
      }
    } catch (err) {
      console.warn("PostgreSQL proctoring getByLinkCode fallback:", err.message);
    }

    const list = readJson();
    return list.filter(v => v.linkCode?.toLowerCase() === cleanLink.toLowerCase());
  }

  async getWarningCount(linkCode) {
    const violations = await this.getByLinkCode(linkCode);
    const nonWarningTypes = new Set([
      "face_not_visible",
      "face_missing",
      "poor_lighting",
      "low_lighting",
      "background_noise",
      "excessive_noise",
      "high_noise",
      "interview_terminated"
    ]);
    const warningViolations = violations.filter(v => {
      const type = String(v.violationType || "").toLowerCase();
      if (nonWarningTypes.has(type)) return false;
      return v.severity === "warning" || (v.warningNumber && v.warningNumber > 0);
    });
    return warningViolations.length;
  }

  async terminateSession({
    linkCode,
    sessionId = null,
    reason = "Integrity policy violation",
    candidateName = "",
    candidateEmail = "",
    candidateRole = "",
    transcripts = [],
    elapsedSeconds = 0
  }) {
    const cleanLink = (linkCode || "").replace(/^interview_/, "").trim();
    console.warn(`[ProctoringSystem] Terminating session for linkCode='${cleanLink}'. Reason: ${reason}`);

    // 1. Record critical termination violation
    await this.recordViolation({
      linkCode: cleanLink,
      sessionId,
      candidateEmail,
      candidateName,
      violationType: "interview_terminated",
      severity: "critical_termination",
      warningNumber: 3,
      details: reason,
      metadata: { terminationReason: reason, terminatedAt: new Date().toISOString() }
    });

    // 2. Update Candidate Portal Session to "Meeting Terminated"
    let session = await candidateSessionsDb.getByLinkCode(cleanLink);
    const candName = candidateName || session?.candidateName || "Candidate";
    const candEmail = candidateEmail || session?.candidateEmail || "";
    const role = candidateRole || session?.role || "Software Engineer";

    if (session || cleanLink) {
      session = await candidateSessionsDb.createOrUpdate({
        ...(session || {}),
        id: sessionId || session?.id || `sess-${cleanLink}`,
        linkCode: cleanLink,
        candidateName: candName,
        candidateEmail: candEmail,
        role,
        status: "Meeting Terminated",
        termination_reason: reason,
        terminationReason: reason,
        proctoring_status: "Terminated",
        elapsedSeconds: elapsedSeconds || session?.elapsedSeconds || 0,
        transcripts: transcripts && transcripts.length > 0 ? transcripts : (session?.transcripts || []),
        completedAt: new Date().toISOString(),
        recommendation: `Meeting Terminated due to integrity violation: ${reason}`
      });
    }

    // 3. Update Scheduled Interview in HR Portal to "Meeting Terminated"
    let scheduled = await interviewsDb.getByLinkCode(cleanLink);
    if (!scheduled && session?.id) {
      scheduled = await interviewsDb.getById(session.id).catch(() => null);
    }
    if (scheduled) {
      await interviewsDb.update(scheduled.id, {
        status: "Meeting Terminated",
        termination_reason: reason,
        terminationReason: reason
      }).catch(err => console.warn("Notice updating interview termination status:", err.message));
    }

    // 4. Update or Record Candidate in HR Evaluation Portal with "Meeting Terminated"
    try {
      const candId = `cand-${session?.id || cleanLink}`;
      const mins = Math.floor(elapsedSeconds / 60);
      const secs = elapsedSeconds % 60;
      const durationStr = `${mins}m ${secs}s`;

      await candidatesDb.create({
        id: candId,
        name: candName,
        email: candEmail,
        phone: session?.candidatePhone || "",
        role,
        company: session?.company || "AvaHire Tech",
        score: 0,
        status: "Meeting Terminated",
        termination_reason: reason,
        duration: durationStr,
        mode: "AI Live Interview (Terminated)",
        notes: `Meeting Terminated: Integrity violation flagged during assessment (${reason}). Candidate session was automatically discontinued.`,
        summaryPoints: [
          { text: `Meeting Terminated: ${reason}`, type: "bad" },
          { text: "Automated proctoring security violation recorded", type: "bad" }
        ],
        recommendation: `Flagged: Assessment terminated due to anti-cheating rule breach (${reason}). Requires secondary review.`,
        transcript: transcripts && transcripts.length > 0 ? transcripts : (session?.transcripts || []),
        createdBy: "system@avahire.ai",
        userEmail: "system@avahire.ai"
      });
    } catch (candErr) {
      console.warn("Notice saving candidate termination record:", candErr.message);
    }

    return {
      success: true,
      status: "Meeting Terminated",
      reason,
      linkCode: cleanLink
    };
  }

  _mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      sessionId: row.session_id,
      linkCode: row.link_code,
      candidateEmail: row.candidate_email,
      candidateName: row.candidate_name,
      violationType: row.violation_type,
      severity: row.severity,
      warningNumber: row.warning_number,
      details: row.details,
      metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : (row.metadata || {}),
      timestamp: row.timestamp,
      createdAt: row.created_at
    };
  }
}

module.exports = new ProctoringDatabase();
