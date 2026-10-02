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

/**
 * Gather all resumes from resumesDb and candidatesDb so candidate portal is connected to all resumes
 * Excludes rejected candidates and prioritizes/selects candidates in a selective way
 */
async function getAllCandidateResumes(filters = {}) {
  const resumes = resumesDb.getAll() || [];
  let candidates = [];
  try {
    candidates = (await candidatesDb.getAll()) || [];
  } catch (err) {
    candidates = [];
  }
  
  const map = new Map();
  // 1. Primary resume collection from resumesDb
  for (const r of resumes) {
    const key = normalizeEmail(r.email);
    const statusLower = String(r.status || "").trim().toLowerCase();
    
    // Completely exclude rejected candidates
    if (statusLower === "rejected") continue;

    if (key) {
      map.set(key, {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone || "",
        role: r.targetJobTitle || r.role || "Software Engineer",
        field: r.field || r.domain || "Software Development",
        resumeFileName: r.resumeFileName || (r.s3Key ? r.s3Key.split("/").pop() : null),
        skills: r.skills || r.allSkills || [],
        experience: r.experience || (r.expYears ? `${r.expYears} Years` : "1-2 Years"),
        status: r.status || "Shortlisted",
        source: "resumes",
        createdBy: r.createdBy || "",
        userEmail: r.userEmail || ""
      });
    }
  }

  // 2. Also supplement with candidates from candidatesDb if not already present
  for (const c of candidates) {
    const key = normalizeEmail(c.email);
    const statusLower = String(c.status || "").trim().toLowerCase();
    if (statusLower === "rejected") continue;

    if (key && !map.has(key)) {
      map.set(key, {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone || "",
        role: c.role || "Software Engineer",
        field: c.field || "Technology",
        resumeFileName: c.resumeFileName || null,
        skills: c.skills || [],
        experience: c.experience || "1-2 Years",
        status: c.status || "Applied",
        source: "candidates",
        createdBy: c.createdBy || "",
        userEmail: c.userEmail || ""
      });
    } else if (key && map.has(key)) {
      const existing = map.get(key);
      if (!existing.phone && c.phone) {
        existing.phone = c.phone;
      }
    }
  }

  let result = Array.from(map.values());

  // Filter by userEmail if provided for user isolation
  if (filters.userEmail) {
    const target = filters.userEmail.toLowerCase().trim();
    const userFiltered = result.filter(c => 
      (c.createdBy && c.createdBy.toLowerCase().trim() === target) ||
      (c.userEmail && c.userEmail.toLowerCase().trim() === target)
    );
    if (userFiltered.length > 0) {
      result = userFiltered;
    }
  }

  // Selective ordering:
  // "in that way like selected candidates list will be shown in interview page , list must be shown in selective way"
  // Candidates marked as "Selected" or "Shortlisted" are given selective prominence
  const selectedOnly = result.filter(c => {
    const s = String(c.status || "").toLowerCase().trim();
    return s === "selected" || s === "shortlisted";
  });

  if (selectedOnly.length > 0) {
    return selectedOnly.sort((a, b) => {
      const aSel = String(a.status || "").toLowerCase() === "selected" ? 0 : 1;
      const bSel = String(b.status || "").toLowerCase() === "selected" ? 0 : 1;
      return aSel - bSel;
    });
  }

  return result;
}

/**
 * Parse human date & time strings into a Date object
 */
function parseInterviewDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  try {
    let d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const parts = String(dateStr).trim().split(/\s+/);
      if (parts.length === 3) {
        d = new Date(`${parts[1]} ${parts[0]}, ${parts[2]}`);
      }
    }
    if (isNaN(d.getTime())) {
      d = new Date();
    }

    let hours = 11;
    let minutes = 0;
    if (timeStr) {
      const match = String(timeStr).match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        const meridian = match[3] ? match[3].toUpperCase() : null;
        if (meridian === "PM" && hours < 12) hours += 12;
        if (meridian === "AM" && hours === 12) hours = 0;
      }
    }
    d.setHours(hours, minutes, 0, 0);
    return d;
  } catch (err) {
    return null;
  }
}

/**
 * Compute candidate interview schedule window and know at which time the candidate should login and enter
 */
function getCandidateScheduleTiming(scheduledInterview) {
  if (!scheduledInterview) return null;

  const parsedDate = parseInterviewDateTime(scheduledInterview.date, scheduledInterview.time);
  const now = new Date();

  let durationMins = 45;
  if (scheduledInterview.duration) {
    const dMatch = String(scheduledInterview.duration).match(/(\d+)/);
    if (dMatch) durationMins = parseInt(dMatch[1], 10);
  }

  let windowStart = null;
  let windowEnd = null;
  let isWindowActive = true;
  let isUpcoming = false;
  let isPast = false;
  let diffMinutes = 0;
  let timingMessage = "";
  let timingBadge = "Scheduled Slot";

  if (parsedDate && !isNaN(parsedDate.getTime())) {
    windowStart = new Date(parsedDate.getTime() - 30 * 60 * 1000); // 30 minutes before
    windowEnd = new Date(parsedDate.getTime() + (durationMins + 30) * 60 * 1000); // duration + 30 mins

    diffMinutes = Math.round((parsedDate.getTime() - now.getTime()) / (60 * 1000));

    if (now < windowStart) {
      isUpcoming = true;
      isWindowActive = false;
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      const timeRemainingStr = hours > 0 ? `${hours} hr ${mins} min` : `${mins} min`;
      timingBadge = `Upcoming (${timeRemainingStr})`;
      timingMessage = `Your interview is scheduled for ${scheduledInterview.date} at ${scheduledInterview.time}. Entry portal opens 30 minutes prior to your slot. Candidate entry window begins in ${timeRemainingStr}.`;
    } else if (now > windowEnd) {
      isPast = true;
      isWindowActive = false;
      timingBadge = "Expired Slot";
      timingMessage = `Your scheduled interview slot for ${scheduledInterview.date} at ${scheduledInterview.time} has concluded. Please contact HR for a reschedule.`;
    } else {
      isWindowActive = true;
      timingBadge = "Entry Open Now";
      timingMessage = `Your scheduled interview slot is ACTIVE right now (${scheduledInterview.date} at ${scheduledInterview.time}). You may proceed into the room.`;
    }
  } else {
    timingMessage = `Interview scheduled for ${scheduledInterview.date || "Assigned Date"} at ${scheduledInterview.time || "Assigned Slot"}.`;
  }

  return {
    scheduledDate: scheduledInterview.date,
    scheduledTime: scheduledInterview.time,
    duration: scheduledInterview.duration || `${durationMins} Minutes`,
    durationMins,
    windowStartTime: windowStart ? windowStart.toISOString() : null,
    windowEndTime: windowEnd ? windowEnd.toISOString() : null,
    canEnterNow: true,
    isWindowActive,
    isUpcoming,
    isPast,
    diffMinutes,
    timingBadge,
    timingMessage,
    scheduledDisplay: `${scheduledInterview.date} at ${scheduledInterview.time}`
  };
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

    // If not found in sessions table, attempt to hydrate from scheduled interview and resume in HR Portal
    const allResumes = resumesDb.getAll() || [];
    const matchedResume = scheduledInterview 
      ? allResumes.find(r => (r.email && normalizeEmail(r.email) === normalizeEmail(scheduledInterview.email)) || r.id === scheduledInterview.candidateId)
      : null;

    if (!session && scheduledInterview) {
      session = await candidateSessionsDb.createOrUpdate({
        id: `sess-${scheduledInterview.id}`,
        linkCode: scheduledInterview.linkCode,
        candidateName: scheduledInterview.name || (matchedResume && matchedResume.name) || "Candidate",
        candidateEmail: scheduledInterview.email,
        candidatePhone: (matchedResume && matchedResume.phone) || scheduledInterview.phone || "+91 98765 43210",
        role: scheduledInterview.role || (matchedResume && matchedResume.role) || "Software Engineer",
        company: scheduledInterview.company || "AvaHire Technologies Pvt. Ltd.",
        resumeId: matchedResume ? matchedResume.id : null,
        resumeFileName: matchedResume ? matchedResume.resumeFileName : null,
        skills: matchedResume ? (matchedResume.allSkills || matchedResume.skills) : [],
        status: scheduledInterview.status === "Completed" ? "Completed" : "Invited",
        overallScore: scheduledInterview.score || 94,
        techDepthScore: "9.2 / 10",
        clarityScore: "9.5 / 10",
        recommendation: "Recommended for Senior Technical Review",
      });
    }

    if (!session && !scheduledInterview) {
      const defaultResume = allResumes[0];
      session = {
        id: `sess-${linkCode}`,
        linkCode,
        candidateName: defaultResume ? defaultResume.name : "Candidate",
        candidateEmail: defaultResume ? defaultResume.email : "candidate@avahire.ai",
        candidatePhone: defaultResume ? defaultResume.phone : "+91 98765 43210",
        role: defaultResume ? (defaultResume.targetJobTitle || defaultResume.role) : "Senior Full Stack Engineer",
        company: "AvaHire Technologies Pvt. Ltd.",
        resumeId: defaultResume ? defaultResume.id : null,
        resumeFileName: defaultResume ? defaultResume.resumeFileName : null,
        skills: defaultResume ? (defaultResume.allSkills || defaultResume.skills) : [],
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
          id: scheduledInterview.id,
          linkCode: scheduledInterview.linkCode,
          date: scheduledInterview.date,
          time: scheduledInterview.time,
          duration: scheduledInterview.duration || interviewSettings.duration,
          status: scheduledInterview.status,
          isExpired: scheduledInterview.isExpired,
          timing: getCandidateScheduleTiming(scheduledInterview)
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

// GET /api/candidate-portal/resumes - Retrieve all submitted resumes for candidate portal connection
router.get("/resumes", async (req, res) => {
  try {
    const authorEmail = req.query.userEmail || req.headers["x-user-email"];
    const list = await getAllCandidateResumes({ userEmail: authorEmail });
    const allInterviews = await interviewsDb.getAll({ userEmail: authorEmail });
    const sanitized = list.map(r => {
      const cleanEmail = normalizeEmail(r.email);
      const scheduled = allInterviews.find(iv => 
        (iv.email && normalizeEmail(iv.email) === cleanEmail) ||
        (iv.candidateId && iv.candidateId === r.id) ||
        (iv.resumeId && iv.resumeId === r.id)
      );
      const timing = scheduled ? getCandidateScheduleTiming(scheduled) : null;
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        role: r.role || "Software Engineer",
        field: r.field || "Software Development",
        resumeFileName: r.resumeFileName || null,
        skills: r.skills || [],
        experience: r.experience || "1-2 Years",
        status: r.status,
        hasScheduledInterview: Boolean(scheduled),
        interviewSchedule: scheduled ? {
          id: scheduled.id,
          linkCode: scheduled.linkCode,
          date: scheduled.date,
          time: scheduled.time,
          duration: scheduled.duration || "45 Minutes",
          status: scheduled.status,
          timing
        } : null
      };
    });
    res.json({ success: true, count: sanitized.length, data: sanitized });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/candidate-portal/demo-resumes - Retrieve sample resume credentials for testing/evaluation
router.get("/demo-resumes", async (req, res) => {
  try {
    const list = await getAllCandidateResumes();
    const allInterviews = await interviewsDb.getAll();
    const sanitized = list.map(r => {
      const cleanEmail = normalizeEmail(r.email);
      const scheduled = allInterviews.find(iv => 
        (iv.email && normalizeEmail(iv.email) === cleanEmail) ||
        (iv.candidateId && iv.candidateId === r.id) ||
        (iv.resumeId && iv.resumeId === r.id)
      );
      const timing = scheduled ? getCandidateScheduleTiming(scheduled) : null;
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        role: r.role || "Software Engineer",
        resumeFileName: r.resumeFileName || null,
        skills: r.skills || [],
        interviewSchedule: scheduled ? {
          linkCode: scheduled.linkCode,
          date: scheduled.date,
          time: scheduled.time,
          status: scheduled.status,
          timing
        } : null
      };
    });
    res.json({ success: true, count: sanitized.length, data: sanitized });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/candidate-portal/schedule/:linkCode - Retrieve schedule & timing window for candidate portal
router.get("/schedule/:linkCode", async (req, res) => {
  try {
    const { linkCode } = req.params;
    const scheduled = await interviewsDb.getByLinkCode(linkCode);
    if (!scheduled) {
      return res.status(404).json({ success: false, error: "Interview schedule not found" });
    }
    const timing = getCandidateScheduleTiming(scheduled);
    res.json({
      success: true,
      data: {
        id: scheduled.id,
        linkCode: scheduled.linkCode,
        name: scheduled.name,
        email: scheduled.email,
        phone: scheduled.phone || "",
        role: scheduled.role,
        company: scheduled.company,
        date: scheduled.date,
        time: scheduled.time,
        duration: scheduled.duration,
        status: scheduled.status,
        timing
      }
    });
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

    // 1. Check all submitted resumes in resumes and candidates database
    const allCandidateResumes = await getAllCandidateResumes();
    const matchedResume = allCandidateResumes.find(r => r.email && normalizeEmail(r.email) === cleanEmail);

    // If no candidate resume found with this email, strictly reject
    if (!matchedResume) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: The email "${email}" was not found in any submitted resume. You are not allowed to log in with an email address not mentioned in your resume. Candidate Portal strictly requires an approved resume on file.`
      });
    }

    // 2. Strict Phone Number Verification against Candidate Resume
    const registeredPhone = String(matchedResume.phone || "").trim();
    if (registeredPhone) {
      const isPhoneMatch = matchPhoneNumbers(cleanPhone, registeredPhone);
      if (!isPhoneMatch) {
        return res.status(403).json({
          success: false,
          error: `Access Denied: The phone number "${cleanPhone}" does not match the contact number registered on the resume for ${matchedResume.name}. You are not allowed to log in with a different phone number than mentioned in your resume.`
        });
      }
    } else {
      // If resume had no phone recorded, save the validated phone format (min 7 digits)
      const cleanDigits = normalizePhoneDigits(cleanPhone);
      if (cleanDigits.length < 7) {
        return res.status(400).json({
          success: false,
          error: "Please enter a valid phone number (minimum 7 digits)."
        });
      }
      resumesDb.update(matchedResume.id, { phone: cleanPhone });
    }

    // 3. Interview Schedule Verification: Check when candidate is scheduled to interview
    let scheduledInterview = null;
    if (linkCode) {
      scheduledInterview = await interviewsDb.getByLinkCode(linkCode);
    }
    if (!scheduledInterview) {
      const allInterviews = await interviewsDb.getAll();
      scheduledInterview = allInterviews.find(iv => 
        (iv.email && normalizeEmail(iv.email) === cleanEmail) ||
        (iv.candidateId && iv.candidateId === matchedResume.id) ||
        (iv.resumeId && iv.resumeId === matchedResume.id)
      );
    }

    // If no interview is scheduled for this candidate: do not allow entry
    if (!scheduledInterview) {
      return res.status(403).json({
        success: false,
        notScheduled: true,
        candidate: {
          name: matchedResume.name,
          email: cleanEmail,
          phone: registeredPhone || cleanPhone,
          role: matchedResume.role || "Software Engineer"
        },
        error: `Access Restricted: Resume verified for ${matchedResume.name}, but an interview has not been scheduled yet on the Schedule page. Candidates can only log in and enter once an interview slot has been assigned by the hiring team.`
      });
    }

    // If linkCode was provided, verify it belongs to this candidate
    if (scheduledInterview.email && normalizeEmail(scheduledInterview.email) !== cleanEmail) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: This interview link is designated for a different candidate (${scheduledInterview.email}). Please sign in with the email linked to your interview invitation.`
      });
    }

    // Compute candidate schedule timing
    const scheduleTiming = getCandidateScheduleTiming(scheduledInterview);

    // Check completion status
    if (scheduledInterview.status === "Completed") {
      return res.status(403).json({
        success: false,
        isCompleted: true,
        timing: scheduleTiming,
        error: `Interview Already Completed: Your interview on ${scheduledInterview.date} has already been completed. Thank you for participating!`
      });
    }

    // Check expiry
    if (scheduledInterview.isExpired || scheduledInterview.status === "Expired") {
      return res.status(403).json({
        success: false,
        isExpired: true,
        timing: scheduleTiming,
        error: `Interview Expired: The scheduled slot for ${scheduledInterview.date} at ${scheduledInterview.time} has expired. Please contact your recruiter for a reschedule.`
      });
    }

    // Candidate authenticated successfully!
    const candidateName = matchedResume.name || scheduledInterview.name || "Candidate";
    const candidateRole = matchedResume.role || scheduledInterview.role || "Software Engineer";
    const company = scheduledInterview.company || "AvaHire Technologies Pvt. Ltd.";
    const code = linkCode || scheduledInterview.linkCode || `ava-${matchedResume.id}`;

    const existingSession = await candidateSessionsDb.getByLinkCode(code);

    const session = await candidateSessionsDb.createOrUpdate({
      id: existingSession ? existingSession.id : `sess-${scheduledInterview ? scheduledInterview.id : code}`,
      linkCode: code,
      candidateName,
      candidateEmail: cleanEmail,
      candidatePhone: registeredPhone || cleanPhone,
      role: candidateRole,
      company,
      resumeId: matchedResume.id,
      resumeFileName: matchedResume.resumeFileName || null,
      skills: matchedResume.skills || [],
      experience: matchedResume.experience || "1-2 Years",
      education: matchedResume.education || "Bachelor's Degree",
      interviewSchedule: {
        id: scheduledInterview.id,
        linkCode: code,
        date: scheduledInterview.date,
        time: scheduledInterview.time,
        duration: scheduledInterview.duration || "45 Minutes",
        status: scheduledInterview.status,
        timing: scheduleTiming
      },
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
        resumeFileName: matchedResume ? matchedResume.resumeFileName : null
      },
      timing: scheduleTiming,
      message: `Identity verified! Welcome ${candidateName}. Your interview is scheduled on ${scheduledInterview.date} at ${scheduledInterview.time}.`
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
