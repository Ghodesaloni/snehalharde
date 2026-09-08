const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

let aiClient = null;

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}

/**
 * Intelligent, strict deterministic algorithmic ATS screening
 * Enforces rigorous shortlisting thresholds so that unqualified candidates are NEVER shortlisted.
 */
function algorithmicAtsAnalysis(candidate, job) {
  const jdSkills = Array.isArray(job.keySkills)
    ? job.keySkills
    : (typeof job.keySkills === "string" ? job.keySkills.split(",").map(s => s.trim()).filter(Boolean) : []);

  const candidateSkills = Array.isArray(candidate.allSkills) && candidate.allSkills.length > 0
    ? candidate.allSkills
    : (Array.isArray(candidate.skills) ? candidate.skills : []);

  const candidateSkillsLower = candidateSkills.map(s => s.toLowerCase());

  const matchedSkills = [];
  const missingSkills = [];

  jdSkills.forEach(reqSkill => {
    const rLower = reqSkill.toLowerCase();
    const isMatched = candidateSkillsLower.some(cSkill => {
      if (cSkill === rLower) return true;
      if (cSkill.includes(rLower) || rLower.includes(cSkill)) {
        // Guard against false positive short substrings (e.g. 'c' matching 'css')
        if (rLower.length <= 2 || cSkill.length <= 2) {
          return cSkill === rLower;
        }
        return true;
      }
      return false;
    });

    if (isMatched) {
      matchedSkills.push(reqSkill);
    } else {
      missingSkills.push(reqSkill);
    }
  });

  // Calculate Skills Match Percentage
  const skillsCount = jdSkills.length > 0 ? jdSkills.length : 1;
  const skillsMatchPct = Math.min(
    100,
    Math.round((matchedSkills.length / skillsCount) * 100)
  );

  // Experience level evaluation
  const expYears = Number(candidate.expYears) || 1;
  let minExpYears = 2;
  if (job.expLevel) {
    const match = job.expLevel.match(/(\d+)/);
    if (match) minExpYears = parseInt(match[1], 10);
  }

  let expScore = 50;
  let experienceNote = "";
  if (expYears >= minExpYears + 1) {
    expScore = 95;
    experienceNote = `Candidate has ${expYears} years of experience, comfortably exceeding the required ${minExpYears}+ years.`;
  } else if (expYears >= minExpYears) {
    expScore = 85;
    experienceNote = `Candidate possesses ${expYears} years of experience, meeting the required ${minExpYears} years threshold.`;
  } else if (expYears >= Math.max(1, minExpYears - 1)) {
    expScore = 65;
    experienceNote = `Candidate has ${expYears} years vs required ${minExpYears}+ years; slightly below preferred seniority.`;
  } else {
    expScore = Math.max(20, Math.round((expYears / minExpYears) * 50));
    experienceNote = `Candidate has only ${expYears} years vs required ${minExpYears}+ years; significant experience shortfall.`;
  }

  // Role / Domain similarity
  const roleName = (candidate.role || "").toLowerCase();
  const jobTitle = (job.title || "").toLowerCase();

  // Check for severe domain mismatch (e.g. HR / Sales / Design applying for Software Engineer)
  const isTechJob = /software|developer|engineer|full stack|frontend|backend|devops|data/i.test(jobTitle);
  const isHrCandidate = /hr|human resources|recruiter|talent|talent acquisition|sales|marketing/i.test(roleName);
  const isSevereDomainMismatch = isTechJob && isHrCandidate && matchedSkills.length <= 1;

  let roleBonus = 0;
  const titleTokens = jobTitle.split(/[\s-]+/).filter(t => t.length > 2);
  const matchedTokens = titleTokens.filter(t => roleName.includes(t));
  if (matchedTokens.length > 0) {
    roleBonus = Math.min(10, matchedTokens.length * 5);
  }

  // Calculate ATS Score: heavy weight on skills (65%), experience (25%), role (10%)
  let calculatedAts = 0;

  if (matchedSkills.length === 0 || skillsMatchPct === 0) {
    // Zero skill match -> cannot exceed 35 ATS score
    calculatedAts = Math.min(35, Math.round(expScore * 0.3 + 10));
  } else if (isSevereDomainMismatch) {
    // Severe domain mismatch -> cannot exceed 30 ATS score
    calculatedAts = Math.min(30, Math.round(skillsMatchPct * 0.2 + 10));
  } else {
    calculatedAts = Math.round(skillsMatchPct * 0.65 + expScore * 0.25 + roleBonus);
    calculatedAts = Math.min(98, Math.max(20, calculatedAts));
  }

  // Match score
  const matchScore = Math.min(99, Math.max(15, Math.round((calculatedAts * 0.6) + (skillsMatchPct * 0.4))));

  // STRICT SHORTLISTING LOGIC:
  // - Shortlisted: Must have at least 75% skill match AND ATS score >= 78 AND not severe domain mismatch
  // - Review: 50% to 74% skill match OR ATS score 52-77
  // - Rejected: < 50% skill match OR matchedSkills == 0 OR ATS score < 52
  let status = "Rejected";
  if (skillsMatchPct >= 75 && calculatedAts >= 78 && !isSevereDomainMismatch && expYears >= minExpYears - 0.5) {
    status = "Shortlisted";
  } else if (skillsMatchPct >= 50 && calculatedAts >= 52 && !isSevereDomainMismatch) {
    status = "Review";
  } else {
    status = "Rejected";
  }

  // Key points generation
  const strengths = [];
  if (matchedSkills.length > 0) {
    strengths.push(
      `Direct alignment in required competencies: ${matchedSkills.slice(0, 5).join(", ")}.`
    );
  }
  if (expYears >= minExpYears) {
    strengths.push(
      `Meets required experience threshold with ${candidate.experience || `${expYears} years`}.`
    );
  }
  if (candidate.education) {
    strengths.push(`Education: ${candidate.education}.`);
  }
  if (strengths.length === 0) {
    strengths.push("Candidate profile does not match core requirements for this position.");
  }

  const gapPoints = [];
  if (missingSkills.length > 0) {
    gapPoints.push(
      `Missing required skills for this JD: ${missingSkills.slice(0, 6).join(", ")}.`
    );
  }
  if (expYears < minExpYears) {
    gapPoints.push(`Experience (${expYears} yrs) is below the minimum ${minExpYears} yrs required.`);
  }
  if (isSevereDomainMismatch) {
    gapPoints.push(`Severe domain mismatch: candidate background (${candidate.role}) differs from target role (${job.title}).`);
  }

  let verdict = "";
  if (status === "Shortlisted") {
    verdict = `Recommended for interview: Candidate matches ${skillsMatchPct}% of required skills with an ATS score of ${calculatedAts}/100.`;
  } else if (status === "Review") {
    verdict = `Placed Under Review: Candidate demonstrates foundational overlap (${skillsMatchPct}% skills match) but has gaps in: ${missingSkills.slice(0, 3).join(", ") || "seniority"}.`;
  } else {
    verdict = `Rejected: Candidate does not meet the minimum criteria for ${job.title}. Missing ${missingSkills.length} essential skills with an ATS score of ${calculatedAts}/100.`;
  }

  const summary = `${candidate.name} scored ${calculatedAts}/100 ATS match for the ${job.title} position (${status}). Matches ${matchedSkills.length} out of ${jdSkills.length} required skills (${skillsMatchPct}% skill overlap).`;

  return {
    atsScore: calculatedAts,
    matchScore,
    skillsMatchPct,
    status,
    matchedSkills,
    missingSkills,
    keyPoints: {
      strengths,
      missingSkills: gapPoints.length > 0 ? gapPoints : ["No critical missing skills detected."],
      experienceMatch: experienceNote,
      verdict
    },
    aiSummary: summary
  };
}

/**
 * Analyze candidate resume against target Job Description using Gemini 3.8 Flash
 * Strict prompt ensures that unqualified candidates are NOT shortlisted.
 */
async function analyzeResumeAgainstJd(candidate, job) {
  const ai = getAiClient();

  if (!ai) {
    return algorithmicAtsAnalysis(candidate, job);
  }

  try {
    const jdSkills = Array.isArray(job.keySkills)
      ? job.keySkills
      : (typeof job.keySkills === "string" ? job.keySkills.split(",").map(s => s.trim()).filter(Boolean) : []);

    const candidateSkills = Array.isArray(candidate.allSkills) && candidate.allSkills.length > 0
      ? candidate.allSkills
      : (Array.isArray(candidate.skills) ? candidate.skills : []);

    const prompt = `You are a strict, objective HR ATS (Applicant Tracking System) Screening Engine.
Your job is to screen candidates accurately and PREVENT unqualified applicants from being shortlisted.

=== TARGET JOB DESCRIPTION ===
Title: ${job.title}
Department: ${job.dept || "Engineering"}
Required Experience Level: ${job.expLevel || "2-4 Years"}
Work Mode: ${job.workMode || "Full-time"}
Job Description: ${job.description || "N/A"}
REQUIRED KEY SKILLS: ${jdSkills.join(", ") || "N/A"}

=== CANDIDATE RESUME PROFILE ===
Name: ${candidate.name}
Role / Headline: ${candidate.role}
Experience: ${candidate.experience} (${candidate.expYears || "1"} years)
Current Role / Background: ${candidate.currentRole || "N/A"}
Education: ${candidate.education || "N/A"}
Skills Listed: ${candidateSkills.join(", ") || "None listed"}
Summary / Resume Text: ${candidate.summary || candidate.rawText || "N/A"}

=== STRICT SHORTLISTING CRITERIA (MANDATORY) ===
1. SHORTLISTED (atsScore >= 78):
   - Candidate MUST have at least 75% of the REQUIRED KEY SKILLS for this job.
   - Candidate's experience must meet or closely approach the required years.
   - Candidate's professional background must align with the role domain.
   - If they lack core required skills, they CANNOT BE SHORTLISTED!

2. REVIEW (atsScore between 52 and 77):
   - Candidate matches between 50% and 74% of the required skills.
   - Shows potential or partial overlap, but lacks 1 or 2 essential skills or seniority.

3. REJECTED (atsScore < 52):
   - Candidate matches LESS THAN 50% of the required skills.
   - OR candidate has 0 matching skills.
   - OR severe domain mismatch (e.g. HR / Sales applicant applying for Software Engineer).
   - In this case, status MUST BE "Rejected".

Return a valid JSON object ONLY with the following exact keys:
{
  "atsScore": number (integer 0 to 100),
  "matchScore": number (integer 0 to 100),
  "skillsMatchPct": number (integer 0 to 100 representing exact % of required JD skills the candidate has),
  "status": "Shortlisted" | "Review" | "Rejected",
  "matchedSkills": ["Exact required skills the candidate genuinely has"],
  "missingSkills": ["Required skills the candidate does NOT have"],
  "keyPoints": {
    "strengths": ["Clear strength bullet point 1 based on actual resume text", "Strength 2"],
    "missingSkills": ["Specific missing skills or gaps from JD", "Gap 2"],
    "experienceMatch": "Comparison of candidate's experience vs required experience.",
    "verdict": "Clear, decisive explanation of why the candidate is Shortlisted, in Review, or Rejected."
  },
  "aiSummary": "2-3 sentence executive recruitment summary."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      if (typeof parsed.atsScore === "number") {
        // Enforce strict safety boundary on status to prevent hallucinated false-positive shortlists
        let finalStatus = parsed.status;
        const score = Math.min(100, Math.max(0, Math.round(parsed.atsScore)));
        const skillPct = Math.min(100, Math.max(0, Math.round(parsed.skillsMatchPct || 0)));

        // Guardrail: Never allow Shortlisted if skill match is below 70% or score < 75
        if (finalStatus === "Shortlisted" && (skillPct < 70 || score < 75)) {
          finalStatus = skillPct >= 50 ? "Review" : "Rejected";
        } else if (finalStatus === "Review" && (skillPct < 45 && score < 50)) {
          finalStatus = "Rejected";
        }

        return {
          atsScore: score,
          matchScore: Math.min(100, Math.max(0, Math.round(parsed.matchScore || score))),
          skillsMatchPct: skillPct,
          status: finalStatus,
          matchedSkills: Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : [],
          missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
          keyPoints: {
            strengths: Array.isArray(parsed.keyPoints?.strengths) && parsed.keyPoints.strengths.length > 0
              ? parsed.keyPoints.strengths
              : ["Competency in listed skills."],
            missingSkills: Array.isArray(parsed.keyPoints?.missingSkills) && parsed.keyPoints.missingSkills.length > 0
              ? parsed.keyPoints.missingSkills
              : ["Missing core requirements for this position."],
            experienceMatch: parsed.keyPoints?.experienceMatch || `${candidate.experience || "1 Year"} experience.`,
            verdict: parsed.keyPoints?.verdict || `Candidate categorized as ${finalStatus} with ATS score of ${score}/100.`
          },
          aiSummary: parsed.aiSummary || parsed.summary || `${candidate.name} evaluated for ${job.title}.`
        };
      }
    }
    // Fallback if structure invalid
    return algorithmicAtsAnalysis(candidate, job);
  } catch (error) {
    console.error("Gemini API call error in resumeAnalysisService, falling back to algorithmic analyzer:", error.message);
    return algorithmicAtsAnalysis(candidate, job);
  }
}

module.exports = {
  analyzeResumeAgainstJd,
  algorithmicAtsAnalysis
};
