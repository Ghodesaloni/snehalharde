/**
 * Production-Quality Resume Analysis Service
 * Combines:
 * - Structured Job Description Parsing (jdParserService)
 * - Deterministic, Reproducible 8-factor ATS Scoring Engine (atsScoringEngine)
 * - Canonical Skill Normalization & Domain Classification
 * - Optional AI Insights with strict guardrails against hallucinated scores
 */

const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const { parseJobDescription } = require("./jdParserService");
const { calculateAtsScore, DEFAULT_WEIGHTS } = require("./atsScoringEngine");
const { extractNormalizedSkills } = require("./skillTaxonomy");
const { classifyCandidateDomain } = require("./domainClassifier");

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

let quotaExhaustedUntil = 0;

/**
 * Deterministic, explainable ATS analysis against a Job Description
 * @param {Object} candidate - Candidate or parsed resume object
 * @param {Object} job - Target job description object
 * @param {Object} customWeights - Optional scoring weights
 */
function algorithmicAtsAnalysis(candidate, job, customWeights = {}) {
  // Ensure structured JD
  const structuredJd = parseJobDescription(job);

  // Normalize candidate structure
  const rawText = candidate.rawText || candidate.summary || "";
  const allSkillsRaw = candidate.allSkills || candidate.skills || [];
  let normalizedSkills = candidate.all_normalized_skills;

  if (!normalizedSkills || normalizedSkills.length === 0) {
    const skillsFromText = extractNormalizedSkills(`${allSkillsRaw.join(" ")} ${rawText}`);
    normalizedSkills = skillsFromText;
  }

  // Parse experience years
  let expYears = typeof candidate.experience_years === "number"
    ? candidate.experience_years
    : (Number(candidate.expYears) || 0);

  if (expYears === 0 && candidate.experience) {
    const match = candidate.experience.match(/(\d+(?:\.\d+)?)/);
    if (match) expYears = parseFloat(match[1]);
  }

  // Domain resolution
  let candidateDomain = candidate.domain || candidate.domains?.primary;
  let secondaryDomains = candidate.secondary_domains || candidate.domains?.secondary || [];
  if (!candidateDomain) {
    const domainClass = classifyCandidateDomain(candidate, rawText, normalizedSkills);
    candidateDomain = domainClass.primary_domain;
    secondaryDomains = domainClass.secondary_domains;
  }

  const parsedResume = {
    candidate: {
      name: candidate.name || "Candidate",
      email: candidate.email,
      phone: candidate.phone,
      location: candidate.location
    },
    raw_text: rawText,
    all_normalized_skills: normalizedSkills,
    domains: {
      primary: candidateDomain,
      secondary: secondaryDomains
    },
    experience_years: expYears,
    education: Array.isArray(candidate.education)
      ? candidate.education
      : (candidate.education ? [{ degree: candidate.education }] : []),
    certifications: Array.isArray(candidate.certifications) ? candidate.certifications : [],
    resume_quality: candidate.resume_quality || { score: 4.5 }
  };

  const result = calculateAtsScore(parsedResume, structuredJd, customWeights);

  return {
    atsScore: result.atsScore,
    matchScore: result.matchScore,
    skillsMatchPct: result.skillsMatchPct,
    status: result.status,
    breakdown: result.breakdown,
    matchedSkills: result.matchedSkills.map(s => s.name),
    missingSkills: [...result.missingRequiredSkills, ...result.missingPreferredSkills],
    missingRequiredSkills: result.missingRequiredSkills,
    missingPreferredSkills: result.missingPreferredSkills,
    keyPoints: result.keyPoints,
    aiSummary: `${candidate.name} scored ${result.atsScore}/100 ATS match for ${structuredJd.title} (${result.status}). Required skill match: ${result.breakdown.requiredSkills.percentage}%, experience: ${expYears} yrs vs ${structuredJd.minExperienceYears}+ yrs required.`,
    candidateDomain,
    secondaryDomains,
    jdDomain: structuredJd.domain
  };
}

/**
 * Analyzes candidate resume against target Job Description
 * Uses deterministic ATS scoring engine as ground truth, optionally enhanced with Gemini insights
 */
async function analyzeResumeAgainstJd(candidate, job) {
  // Always compute ground-truth deterministic score first
  const deterministicResult = algorithmicAtsAnalysis(candidate, job);

  const ai = getAiClient();
  if (!ai || Date.now() < quotaExhaustedUntil) {
    return deterministicResult;
  }

  try {
    const prompt = `You are an expert HR Executive and ATS Evaluator.
Review the following candidate evaluation against the job description.
JOB TITLE: ${job.title}
DEPARTMENT: ${job.dept || "General"}
REQUIRED SKILLS: ${(job.keySkills || []).join(", ")}
CANDIDATE: ${candidate.name}
DOMAIN: ${deterministicResult.candidateDomain}
EXPERIENCE: ${candidate.experience || `${deterministicResult.breakdown.experience.candidateYears} years`}
CALCULATED ATS SCORE: ${deterministicResult.atsScore}/100
CALCULATED STATUS: ${deterministicResult.status}
REQUIRED SKILLS MATCHED: ${deterministicResult.breakdown.requiredSkills.percentage}%
MISSING REQUIRED SKILLS: ${deterministicResult.missingRequiredSkills.join(", ") || "None"}

Provide enhanced, concise recruitment feedback for this evaluation.
Return a JSON object with:
{
  "keyPoints": {
    "strengths": ["Clear specific strength 1 from resume", "Specific strength 2"],
    "missingSkills": ["Specific missing skills from JD", "Any experience gap"],
    "experienceMatch": "Concise comparison sentence.",
    "verdict": "Clear decisive ATS shortlisting verdict."
  },
  "aiSummary": "2-3 sentence executive recruitment overview."
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
      if (parsed.keyPoints && parsed.aiSummary) {
        return {
          ...deterministicResult,
          keyPoints: {
            strengths: Array.isArray(parsed.keyPoints.strengths) && parsed.keyPoints.strengths.length > 0
              ? parsed.keyPoints.strengths
              : deterministicResult.keyPoints.strengths,
            missingSkills: Array.isArray(parsed.keyPoints.missingSkills) && parsed.keyPoints.missingSkills.length > 0
              ? parsed.keyPoints.missingSkills
              : deterministicResult.keyPoints.missingSkills,
            experienceMatch: parsed.keyPoints.experienceMatch || deterministicResult.keyPoints.experienceMatch,
            verdict: parsed.keyPoints.verdict || deterministicResult.keyPoints.verdict
          },
          aiSummary: parsed.aiSummary || deterministicResult.aiSummary
        };
      }
    }
    return deterministicResult;
  } catch (error) {
    if (error.message && (error.message.includes("429") || error.message.includes("RESOURCE_EXHAUSTED") || error.message.includes("quota"))) {
      quotaExhaustedUntil = Date.now() + 60000;
      console.warn("[ATS] Gemini rate limit/quota reached; utilizing deterministic ATS scoring.");
    } else {
      console.warn("[ATS] Gemini analysis notice:", error.message);
    }
    return deterministicResult;
  }
}

module.exports = {
  analyzeResumeAgainstJd,
  algorithmicAtsAnalysis,
  DEFAULT_WEIGHTS
};
