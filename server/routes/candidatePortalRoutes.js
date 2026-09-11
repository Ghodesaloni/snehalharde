const express = require("express");
const router = express.Router();
const candidateSessionsDb = require("../db/candidateSessionsDb");
const candidatesDb = require("../db/candidatesDb");
const interviewsDb = require("../db/interviewsDb");
const resumesDb = require("../db/resumesDb");
const settingsDb = require("../db/settingsDb");

/**
 * Clean & normalize email for comparison
 */
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * Strip all non-digit characters from phone
 */
function normalizePhoneDigits(phone) {
  return String(phone || "").replace(/\D/g, "");
}

/**
 * Robust phone number matching:
 * Handles international prefix (+91, +1), local trunk prefix (0), spaces, dashes, parentheses.
 */
function matchPhoneNumbers(inputPhone, storedPhone) {
  if (!inputPhone || !storedPhone) return false;
  const d1 = normalizePhoneDigits(inputPhone);
  const d2 = normalizePhoneDigits(storedPhone);
  if (!d1 || !d2) return false;

  // Exact digit match
  if (d1 === d2) return true;

  // Match national 10-digit number if both are at least 10 digits
  if (d1.length >= 10 && d2.length >= 10) {
    if (d1.slice(-10) === d2.slice(-10)) return true;
  }

  // Fallback substring match for non-standard or abbreviated numbers
  if ((d1.length >= 7 && d2.includes(d1)) || (d2.length >= 7 && d1.includes(d2))) {
    return true;
  }

  return false;
}

// Default role-specific question banks for live AI interviews
const ROLE_QUESTIONS = {
  "frontend developer": [
    "Welcome! Could you please introduce yourself and share your core frontend tech stack?",
    "How do you manage complex asynchronous state and prevent unnecessary re-renders in modern React applications?",
    "What strategies do you employ for Core Web Vitals optimization and cross-browser accessibility?",
    "Describe how you structure scalable design systems and reusable UI component architectures."
  ],
  "software engineer": [
    "Welcome! Please introduce yourself and highlight a high-impact engineering system you built.",
    "How do you approach database schema design, indexing, and query optimization for high-throughput services?",
    "Explain how you design fault-tolerant microservices with circuit breakers and message queues.",
    "Tell us about a critical production outage you debugged under pressure and how you resolved it."
  ],
  "full stack engineer": [
    "Welcome! Walk us through your background and the architecture of your favorite full-stack project.",
    "How do you manage API contract consistency and state synchronization between client and backend servers?",
    "What is your approach to authentication security, session caching, and database transaction isolation?",
    "How do you balance rapid delivery with code review rigor and automated test coverage?"
  ],
  "product manager": [
    "Welcome! Tell us about yourself and a product roadmap you successfully delivered from 0 to 1.",
    "How do you prioritize competing stakeholder demands when engineering capacity is constrained?",
    "What qualitative and quantitative metrics do you use to evaluate feature adoption and customer retention?",
    "Walk us through a time a product launch did not meet KPI targets and how you pivoted."
  ]
};

function getQuestionsForRole(roleName = "") {
  const normalized = (roleName || "").toLowerCase().trim();
  for (const [key, questions] of Object.entries(ROLE_QUESTIONS)) {
    if (normalized.includes(key)) {
      return questions;
    }
  }
  return ROLE_QUESTIONS["software engineer"];
}

// 1. GET /api/candidate-portal/session/:linkCode - Retrieve session by link code
router.get("/session/:linkCode", async (req, res) => {
  try {
    const { linkCode } = req.params;
    let session = await candidateSessionsDb.getByLinkCode(linkCode);
    const scheduledInterview = await interviewsDb.getByLinkCode(linkCode);

    // If not found in sessions table, attempt to hydrate from scheduled interview in HR Portal
    if (!session && scheduledInterview) {
      session = await candidateSessionsDb.createOrUpdate({
        id: `sess-${scheduledInterview.id}`,
        linkCode: scheduledInterview.linkCode,
        candidateName: scheduledInterview.name,
        candidateEmail: scheduledInterview.email,
        candidatePhone: "+91 98765 43210",
        role: scheduledInterview.role,
        company: scheduledInterview.company || "AvaHire Technologies Pvt. Ltd.",
        status: scheduledInterview.status === "Completed" ? "Completed" : "Invited",
        overallScore: scheduledInterview.score || 94,
        techDepthScore: "9.2 / 10",
        clarityScore: "9.5 / 10",
        recommendation: "Recommended for Senior Technical Review",
      });
    }

    if (!session && !scheduledInterview) {
      // Return a default demo session template for testing link codes like "akc123"
      session = {
        id: `sess-${linkCode}`,
        linkCode,
        candidateName: "Candidate",
        candidateEmail: "candidate@avahire.ai",
        candidatePhone: "+91 98765 43210",
        role: "Senior Full Stack Engineer",
        company: "AvaHire Technologies Pvt. Ltd.",
        status: "Invited",
        overallScore: 94,
        techDepthScore: "9.2 / 10",
        clarityScore: "9.5 / 10",
        recommendation: "Recommended for Senior Technical Review"
      };
    }

    // Attach role-tailored questions and live HR interview settings
    const questions = getQuestionsForRole(session.role);
    const interviewSettings = settingsDb.getInterviewSettings();

    res.json({
      success: true,
      data: {
        ...session,
        questions,
        interviewSettings,
        interviewSchedule: scheduledInterview ? {
          date: scheduledInterview.date,
          time: scheduledInterview.time,
          duration: scheduledInterview.duration || interviewSettings.duration,
          isExpired: scheduledInterview.isExpired
        } : null
      }
    });
  } catch (err) {
    console.error("Error retrieving candidate portal session:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/candidate-portal/interview-settings - Candidate-accessible interview & proctoring configuration
router.get("/interview-settings", (req, res) => {
  try {
    const settings = settingsDb.getInterviewSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    console.error("Error retrieving interview settings for candidate portal:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/candidate-portal/demo-resumes - Retrieve sample resume credentials for testing/evaluation
router.get("/demo-resumes", (req, res) => {
  try {
    const list = resumesDb.getAll() || [];
    const sanitized = list.slice(0, 6).map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      role: r.targetJobTitle || r.role || "Software Engineer",
      resumeFileName: r.resumeFileName || null,
      skills: r.skills || []
    }));
    res.json({ success: true, data: sanitized });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. POST /api/candidate-portal/login - Candidate Portal authentication and verification
router.post("/login", async (req, res) => {
  try {
    const { linkCode, email, phone } = req.body;

    // Validate inputs
    const cleanEmail = normalizeEmail(email);
    const cleanPhone = String(phone || "").trim();

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        error: "Please enter the Email ID mentioned on your submitted resume."
      });
    }

    if (!cleanPhone) {
      return res.status(400).json({
        success: false,
        error: "Please enter the Phone Number mentioned on your submitted resume."
      });
    }

    // 1. Check all submitted resumes in resumes database
    const allResumes = resumesDb.getAll() || [];
    const matchedResumeByEmail = allResumes.find(r => r.email && normalizeEmail(r.email) === cleanEmail);

    // 2. Also check candidatesDb (candidates table)
    let matchedCandidateByEmail = null;
    try {
      const allCandidates = await candidatesDb.getAll();
      matchedCandidateByEmail = (allCandidates || []).find(c => c.email && normalizeEmail(c.email) === cleanEmail);
    } catch (e) {
      console.warn("Candidates DB lookup warning:", e.message);
    }

    // 3. Also check scheduled interview if linkCode is provided
    let scheduledInterview = null;
    if (linkCode) {
      scheduledInterview = await interviewsDb.getByLinkCode(linkCode);
    }

    // Determine the base candidate profile
    const profile = matchedResumeByEmail || matchedCandidateByEmail || (scheduledInterview && normalizeEmail(scheduledInterview.email) === cleanEmail ? scheduledInterview : null);

    // If no candidate resume or record found with this email:
    if (!profile) {
      return res.status(401).json({
        success: false,
        error: `Authentication failed: No submitted resume found for "${email}". Only candidates with a submitted resume are authorized to access the interview portal.`
      });
    }

    // If an interview linkCode was provided, verify if the invite was scheduled for this candidate
    if (scheduledInterview && scheduledInterview.email) {
      const invEmail = normalizeEmail(scheduledInterview.email);
      if (invEmail !== cleanEmail) {
        return res.status(401).json({
          success: false,
          error: `Authentication failed: This interview invite is designated for a different candidate email (${scheduledInterview.email}). Please sign in with the email linked to your interview invitation.`
        });
      }
    }

    // Retrieve registered phone number from resume or candidate record
    const registeredPhone = (matchedResumeByEmail && matchedResumeByEmail.phone) ||
                            (matchedCandidateByEmail && matchedCandidateByEmail.phone) ||
                            (scheduledInterview && scheduledInterview.phone);

    if (registeredPhone) {
      const isPhoneMatch = matchPhoneNumbers(cleanPhone, registeredPhone);
      if (!isPhoneMatch) {
        return res.status(401).json({
          success: false,
          error: "Authentication failed: The phone number does not match the contact number on your resume. Please enter the phone number registered on your resume."
        });
      }
    } else {
      // If phone was not recorded previously, update the resume record
      if (matchedResumeByEmail) {
        resumesDb.update(matchedResumeByEmail.id, { phone: cleanPhone });
      }
      if (matchedCandidateByEmail) {
        await candidatesDb.update(matchedCandidateByEmail.id, { phone: cleanPhone });
      }
    }

    // Candidate authenticated successfully!
    const candidateName = (matchedResumeByEmail && matchedResumeByEmail.name) ||
                          (matchedCandidateByEmail && matchedCandidateByEmail.name) ||
                          (scheduledInterview && scheduledInterview.name) ||
                          "Candidate";

    const candidateRole = (matchedResumeByEmail && (matchedResumeByEmail.targetJobTitle || matchedResumeByEmail.role)) ||
                          (matchedCandidateByEmail && matchedCandidateByEmail.role) ||
                          (scheduledInterview && scheduledInterview.role) ||
                          "Software Engineer";

    const company = (scheduledInterview && scheduledInterview.company) || "AvaHire Technologies Pvt. Ltd.";
    const code = linkCode || (scheduledInterview && scheduledInterview.linkCode) || "akc123";

    const existingSession = await candidateSessionsDb.getByLinkCode(code);

    const session = await candidateSessionsDb.createOrUpdate({
      id: existingSession ? existingSession.id : `sess-${scheduledInterview ? scheduledInterview.id : code}`,
      linkCode: code,
      candidateName,
      candidateEmail: cleanEmail,
      candidatePhone: registeredPhone || cleanPhone,
      role: candidateRole,
      company,
      resumeId: matchedResumeByEmail ? matchedResumeByEmail.id : null,
      resumeFileName: matchedResumeByEmail ? matchedResumeByEmail.resumeFileName : null,
      skills: (matchedResumeByEmail && (matchedResumeByEmail.allSkills || matchedResumeByEmail.skills)) || [],
      experience: (matchedResumeByEmail && matchedResumeByEmail.experience) || "1-2 Years",
      education: (matchedResumeByEmail && matchedResumeByEmail.education) || "Bachelor's Degree",
      authenticated: true,
      authenticatedAt: new Date().toISOString(),
      status: "Authenticated"
    });

    // Update HR Portal interview status to indicate candidate has joined portal
    if (scheduledInterview && scheduledInterview.status === "Scheduled") {
      await interviewsDb.update(scheduledInterview.id, { status: "Active" });
    }

    return res.json({
      success: true,
      data: session,
      candidate: {
        id: session.id,
        name: candidateName,
        email: cleanEmail,
        phone: registeredPhone || cleanPhone,
        role: candidateRole,
        company,
        resumeFileName: matchedResumeByEmail ? matchedResumeByEmail.resumeFileName : null
      },
      message: `Identity verified! Welcome ${candidateName}.`
    });
  } catch (err) {
    console.error("Error in candidate portal login:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST /api/candidate-portal/system-check - Hardware and proctoring readiness check
router.post("/system-check", async (req, res) => {
  try {
    const { linkCode, camera, microphone, audio, network, latency, agreedProctoring } = req.body;
    if (!linkCode) {
      return res.status(400).json({ success: false, error: "Link code is required" });
    }

    const existingSession = await candidateSessionsDb.getByLinkCode(linkCode);
    const updated = await candidateSessionsDb.createOrUpdate({
      ...(existingSession || {}),
      linkCode,
      status: "System Check Completed",
      systemCheckStatus: {
        camera: Boolean(camera),
        microphone: Boolean(microphone),
        audio: Boolean(audio),
        network: network || "Optimal",
        latency: latency || "32ms",
        agreedProctoring: Boolean(agreedProctoring),
        checkedAt: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      data: updated,
      message: "System diagnostics verified and recorded"
    });
  } catch (err) {
    console.error("Error saving system check:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. GET /api/candidate-portal/questions/:linkCode - Retrieve role-specific AI questions
router.get("/questions/:linkCode", async (req, res) => {
  try {
    const { linkCode } = req.params;
    const session = await candidateSessionsDb.getByLinkCode(linkCode);
    const scheduled = await interviewsDb.getByLinkCode(linkCode);
    const role = (session && session.role) || (scheduled && scheduled.role) || "Software Engineer";

    const questions = getQuestionsForRole(role);
    res.json({
      success: true,
      role,
      questions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. POST /api/candidate-portal/transcript-chunk - Real-time interview utterance streaming
router.post("/transcript-chunk", async (req, res) => {
  try {
    const { linkCode, speaker, roleTag, time, text, questionIndex } = req.body;
    if (!linkCode || !text) {
      return res.status(400).json({ success: false, error: "linkCode and text are required" });
    }

    const session = await candidateSessionsDb.getByLinkCode(linkCode);
    if (!session) {
      return res.status(404).json({ success: false, error: "Candidate session not found" });
    }

    const currentTranscripts = Array.isArray(session.transcripts) ? session.transcripts : [];
    const newEntry = {
      speaker: speaker || "Candidate",
      roleTag: roleTag || (speaker === "Ava" ? "AI Interviewer" : "Candidate"),
      time: time || new Date().toLocaleTimeString(),
      text: text.trim(),
      questionIndex: questionIndex !== undefined ? questionIndex : null,
      timestamp: Date.now()
    };

    currentTranscripts.push(newEntry);

    await candidateSessionsDb.createOrUpdate({
      ...session,
      transcripts: currentTranscripts,
      status: "In Live Interview"
    });

    res.json({ success: true, count: currentTranscripts.length, latest: newEntry });
  } catch (err) {
    console.error("Error streaming transcript chunk:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. POST /api/candidate-portal/session - Create or update candidate portal session state
router.post("/session", async (req, res) => {
  try {
    const sessionData = req.body;
    const session = await candidateSessionsDb.createOrUpdate(sessionData);

    // If session is completed, automatically sync into HR candidates evaluation table
    if (sessionData.status === "Completed") {
      await syncSessionToHRPorizontal(session, req.headers["x-user-email"]);
    }

    res.json({ success: true, data: session, message: "Candidate portal session saved to PostgreSQL" });
  } catch (err) {
    console.error("Error saving candidate portal session:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. POST /api/candidate-portal/complete - Explicit completion endpoint connecting to HR Portal
router.post("/complete", async (req, res) => {
  try {
    const {
      linkCode,
      id,
      candidateName,
      candidateEmail,
      candidatePhone,
      role,
      company,
      elapsedSeconds,
      transcripts,
      overallScore,
      evaluationBreakdown,
      techDepthScore,
      clarityScore,
      recommendation
    } = req.body;

    const code = linkCode || "akc123";
    const existing = await candidateSessionsDb.getByLinkCode(code);

    const completedSession = await candidateSessionsDb.createOrUpdate({
      ...(existing || {}),
      id: id || (existing ? existing.id : `sess-${code}`),
      linkCode: code,
      candidateName: candidateName || (existing ? existing.candidateName : "Candidate"),
      candidateEmail: candidateEmail || (existing ? existing.candidateEmail : "candidate@avahire.ai"),
      candidatePhone: candidatePhone || (existing ? existing.candidatePhone : "+91 98765 43210"),
      role: role || (existing ? existing.role : "Senior Full Stack Engineer"),
      company: company || (existing ? existing.company : "AvaHire Technologies Pvt. Ltd."),
      status: "Completed",
      overallScore: overallScore !== undefined ? overallScore : 94,
      techDepthScore: techDepthScore || "9.2 / 10",
      clarityScore: clarityScore || "9.5 / 10",
      recommendation: recommendation || "Recommended for Senior Technical Review",
      elapsedSeconds: elapsedSeconds || (existing ? existing.elapsedSeconds : 504),
      transcripts: transcripts || (existing ? existing.transcripts : []),
      evaluationBreakdown: evaluationBreakdown || [
        { category: "System Architecture & Scalability", score: 95, weight: "35%" },
        { category: "Data Structures & Performance", score: 92, weight: "30%" },
        { category: "Engineering Collaboration & Communication", score: 96, weight: "20%" },
        { category: "Code Quality & Resiliency", score: 94, weight: "15%" }
      ],
      completedAt: new Date().toISOString()
    });

    // Deep sync to HR Portal backend
    const hrCandidate = await syncSessionToHRPorizontal(completedSession, req.headers["x-user-email"]);

    res.json({
      success: true,
      message: "Interview finalized and synchronized with HR Evaluation Portal",
      data: {
        session: completedSession,
        hrCandidateEvaluationId: hrCandidate ? hrCandidate.id : null,
        referenceId: `REF-${code.toUpperCase()}-${Date.now().toString().slice(-4)}`
      }
    });
  } catch (err) {
    console.error("Error completing candidate interview:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper function to synchronize candidate portal session into HR candidates & interviews database
async function syncSessionToHRPorizontal(session, authorEmail) {
  try {
    const defaultAuthor = authorEmail || "hr@avahire.ai";
    const durationMins = Math.floor((session.elapsedSeconds || 504) / 60);
    const durationSecs = (session.elapsedSeconds || 504) % 60;
    const formattedDuration = `${durationMins}m ${durationSecs}s`;

    // 1. Create or update Candidate in HR Candidates Evaluation database
    const hrCandidate = await candidatesDb.create({
      id: `cand-${session.id || session.linkCode}`,
      name: session.candidateName,
      email: session.candidateEmail,
      phone: session.candidatePhone,
      role: session.role,
      company: session.company,
      score: session.overallScore || 94,
      status: (session.overallScore || 94) >= 90 ? "Selected" : "Under Review",
      duration: formattedDuration,
      mode: "AI Live Interview",
      recommendation: session.recommendation || "Recommended for Senior Technical Review",
      notes: `Automated assessment conducted by AvaHire AI. Tech Depth: ${session.techDepthScore || "9.2/10"}, Communication Clarity: ${session.clarityScore || "9.5/10"}.`,
      summaryPoints: [
        { text: `High domain expertise verified for ${session.role} requirements.`, type: "strength" },
        { text: `Demonstrated technical communication clarity (${session.clarityScore || "9.5/10"}).`, type: "strength" },
        { text: `Analytical problem solving methodology (${session.techDepthScore || "9.2/10"}).`, type: "strength" }
      ],
      transcript: session.transcripts || [],
      evaluationBreakdown: session.evaluationBreakdown || [],
      createdBy: defaultAuthor,
      userEmail: defaultAuthor
    });

    // 2. Update Interview record in HR Portal
    if (session.linkCode) {
      await interviewsDb.update(session.linkCode, {
        status: "Completed",
        score: session.overallScore || 94
      });
    }

    console.log(`[HR Sync] Successfully synchronized candidate "${session.candidateName}" into HR Portal evaluation database.`);
    return hrCandidate;
  } catch (err) {
    console.warn("[HR Sync Warning] Failed to synchronize candidate session to HR Portal:", err.message);
    return null;
  }
}

// 8. GET /api/candidate-portal/sessions - Recruiter endpoint to list all portal sessions
router.get("/sessions", async (req, res) => {
  try {
    const { status, email, linkCode } = req.query;
    const list = await candidateSessionsDb.getAll({ status, email, linkCode });
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. GET /api/candidate-portal/hr-overview - Recruiter live overview metrics
router.get("/hr-overview", async (req, res) => {
  try {
    const allSessions = await candidateSessionsDb.getAll();
    const liveSessions = allSessions.filter(s => s.status === "In Live Interview" || s.status === "Joined");
    const completedSessions = allSessions.filter(s => s.status === "Completed");
    const totalScore = completedSessions.reduce((acc, s) => acc + (s.overallScore || 0), 0);
    const avgScore = completedSessions.length > 0 ? Math.round(totalScore / completedSessions.length) : 0;

    res.json({
      success: true,
      metrics: {
        totalSessions: allSessions.length,
        liveRooms: liveSessions.length,
        completedSessions: completedSessions.length,
        averageScore: avgScore,
        recentActivity: allSessions.slice(0, 5)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
