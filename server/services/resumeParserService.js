/**
 * Production-Quality Resume Parser Engine
 * Pipeline:
 * File Input -> Type Detection -> Text Extraction -> Cleaning -> Section Detection
 * -> Information Extraction -> Normalization -> Domain Classification -> Quality Assessment
 * 
 * Extracts contact information, categorized skills, education, experience, projects,
 * certifications, and calculates non-overlapping employment durations without hallucination.
 */

const { extractResumeText, cleanExtractedText } = require("./textExtractor");
const { detectResumeSections } = require("./sectionDetector");
const { normalizeSkill, extractNormalizedSkills, SKILL_DEFINITIONS } = require("./skillTaxonomy");
const { classifyCandidateDomain } = require("./domainClassifier");

// Common email regex (RFC 5322 compliant subset)
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/;

// Phone regex (International, US, Indian, dashes, dots, spaces)
const PHONE_REGEX = /(?:(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5})\b/;

// Social & Portfolio Link Regexes
const LINKEDIN_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i;
const GITHUB_REGEX = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i;
const PORTFOLIO_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:[a-zA-Z0-9_-]+\.)+(?:com|io|me|dev|app|org|net)(?:\/[^\s]*)?/i;

// Month mappings
const MONTH_MAP = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

/**
 * Extracts candidate full name from header/contact block
 */
function extractCandidateName(contactHeader, cleanText) {
  const lines = (contactHeader || cleanText).split("\n").map(l => l.trim()).filter(Boolean);
  
  // Exclude common noise headers
  const noiseRegex = /^(?:curriculum vitae|resume|cv|biodata|personal profile|contact|page \d|confidential)/i;
  
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    if (noiseRegex.test(line)) continue;
    if (EMAIL_REGEX.test(line)) continue;
    if (PHONE_REGEX.test(line)) continue;
    if (LINKEDIN_REGEX.test(line)) continue;
    
    // Check if line looks like a valid person's name (2-4 words, alphabet only)
    const words = line.split(/\s+/).filter(Boolean);
    if (words.length >= 2 && words.length <= 4) {
      if (/^[a-zA-Z\s.'-]+$/.test(line) && line.length <= 40) {
        return line.replace(/[^\w\s.'-]/g, "").trim();
      }
    }
  }

  return "Candidate";
}

/**
 * Extracts location (city, state, country) from text
 */
function extractLocation(text) {
  const locRegex = /(?:Location|Address|City|Based in)?[:\s]*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*,\s*(?:[A-Z]{2}|[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*))/;
  const match = text.match(locRegex);
  if (match && match[1]) {
    return match[1].trim();
  }

  // Common city detections
  const commonCities = [
    "New York", "San Francisco", "Seattle", "Austin", "Boston", "Chicago", "Los Angeles",
    "London", "Berlin", "Paris", "Toronto", "Vancouver", "Singapore", "Sydney",
    "Bengaluru", "Bangalore", "Mumbai", "Pune", "Hyderabad", "Delhi", "Gurugram", "Noida", "Chennai"
  ];
  for (const city of commonCities) {
    if (new RegExp(`\\b${city}\\b`, "i").test(text)) {
      return city;
    }
  }
  return "Remote / Not Specified";
}

/**
 * Parses date strings into timestamps (month/year)
 */
function parseDateString(str) {
  if (!str) return null;
  const lower = str.trim().toLowerCase();
  if (/^(?:present|current|now|ongoing)$/i.test(lower)) {
    return new Date();
  }

  const mYearMatch = lower.match(/(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[,\s]+(\d{4})/i);
  if (mYearMatch) {
    const month = MONTH_MAP[mYearMatch[1].toLowerCase()] || 0;
    const year = parseInt(mYearMatch[2], 10);
    return new Date(year, month, 1);
  }

  const yearOnlyMatch = lower.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearOnlyMatch) {
    return new Date(parseInt(yearOnlyMatch[1], 10), 0, 1);
  }

  return null;
}

/**
 * Merges overlapping date ranges and computes total active experience in years
 */
function calculateTotalExperienceYears(experienceEntries = []) {
  const intervals = [];

  for (const exp of experienceEntries) {
    if (exp.startDate) {
      const start = parseDateString(exp.startDate);
      const end = parseDateString(exp.endDate || "Present");
      if (start && end && end >= start) {
        intervals.push([start.getTime(), end.getTime()]);
      }
    }
  }

  if (intervals.length === 0) return 0;

  // Sort intervals by start time
  intervals.sort((a, b) => a[0] - b[0]);

  // Merge overlapping
  const merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = intervals[i];
    if (curr[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], curr[1]);
    } else {
      merged.push(curr);
    }
  }

  // Calculate total milliseconds
  let totalMs = 0;
  for (const [start, end] of merged) {
    totalMs += (end - start);
  }

  const years = totalMs / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, Math.round(years * 10) / 10);
}

/**
 * Extracts structured work experience items
 */
function extractExperience(expText) {
  if (!expText) return [];
  const entries = [];
  const lines = expText.split("\n").map(l => l.trim()).filter(Boolean);

  // Date range pattern: e.g. "Jan 2021 - Present" or "2019 - 2022" or "05/2018 - 08/2021"
  const dateRangePattern = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\d{4})\s*(?:-|–|—|to)\s*(Present|Current|Now|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\d{4})/i;

  let currentExp = null;

  for (const line of lines) {
    const dateMatch = line.match(dateRangePattern);
    if (dateMatch) {
      if (currentExp) {
        entries.push(currentExp);
      }
      // Extract title and company if on the same line or previous line
      const beforeDate = line.substring(0, dateMatch.index).replace(/[|•,-]/g, " ").trim();
      currentExp = {
        title: beforeDate || "Software Engineer",
        company: "Company",
        startDate: dateMatch[1],
        endDate: dateMatch[2],
        description: []
      };
    } else if (currentExp) {
      // Check if this line looks like a company name
      if (line.length < 50 && !line.startsWith("*") && currentExp.description.length === 0 && currentExp.company === "Company") {
        currentExp.company = line;
      } else {
        currentExp.description.push(line.replace(/^\*\s*/, ""));
      }
    }
  }

  if (currentExp) {
    entries.push(currentExp);
  }

  // Clean up formatting
  return entries.map(e => ({
    title: e.title || "Professional",
    company: e.company === "Company" ? "Organization" : e.company,
    startDate: e.startDate || "",
    endDate: e.endDate || "Present",
    duration: `${e.startDate} - ${e.endDate}`,
    responsibilities: e.description.slice(0, 5)
  }));
}

/**
 * Extracts structured education entries
 */
function extractEducation(eduText) {
  if (!eduText) return [];
  const entries = [];
  const degreeRegex = /(bachelor(?:'s)?|master(?:'s)?|b\.?tech|m\.?tech|b\.?s|m\.?s|b\.?sc|m\.?sc|bca|mca|mba|ph\.?d|diploma|associate(?:'s)?)/i;
  const lines = eduText.split("\n").map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    if (degreeRegex.test(line)) {
      const yearMatch = line.match(/\b(19\d{2}|20\d{2})\b/);
      const gpaMatch = line.match(/(?:gpa|cgpa)[:\s]*([0-9.]+)(?:\s*\/\s*[0-9.]+)?/i);

      entries.push({
        degree: line.split(/[,|•-]/)[0].trim(),
        institution: line.split(/[,|•-]/)[1]?.trim() || "University / College",
        graduationYear: yearMatch ? yearMatch[1] : null,
        gpa: gpaMatch ? gpaMatch[1] : null
      });
    }
  }

  return entries;
}

/**
 * Extracts certifications
 */
function extractCertifications(certText) {
  if (!certText) return [];
  return certText
    .split("\n")
    .map(l => l.replace(/^[\W_]+/, "").trim())
    .filter(l => l.length > 3 && l.length < 80);
}

/**
 * Extracts projects
 */
function extractProjects(projText) {
  if (!projText) return [];
  const items = [];
  const lines = projText.split("\n").map(l => l.trim()).filter(Boolean);
  let currentProject = null;

  for (const line of lines) {
    if (line.length < 60 && !line.startsWith("*") && !line.startsWith("-")) {
      if (currentProject) items.push(currentProject);
      currentProject = {
        title: line,
        technologies: [],
        description: []
      };
    } else if (currentProject) {
      currentProject.description.push(line.replace(/^[\*\-]\s*/, ""));
    }
  }
  if (currentProject) items.push(currentProject);
  return items.slice(0, 5);
}

/**
 * Evaluates resume quality and health
 * @returns {{ score: number, issues: string[], warnings: string[], strengths: string[] }}
 */
function evaluateResumeQuality(parsed, requiresOcr, ocrWarning) {
  const issues = [];
  const warnings = [];
  const strengths = [];

  let score = 5;

  if (requiresOcr) {
    warnings.push(ocrWarning || "Scanned document detected requiring OCR.");
    score -= 2;
  }

  if (!parsed.candidate.email) {
    issues.push("Missing contact email address.");
    score -= 1;
  } else {
    strengths.push("Valid email address detected.");
  }

  if (!parsed.candidate.phone) {
    issues.push("No telephone or mobile number detected.");
    score -= 0.5;
  }

  const allSkillsCount = (parsed.skills.technical?.length || 0) + (parsed.skills.tools?.length || 0) + (parsed.skills.databases?.length || 0);
  if (allSkillsCount < 3) {
    issues.push("Low technical skill density detected in resume.");
    score -= 1;
  } else {
    strengths.push(`Rich skill profile with ${allSkillsCount} classified technical competencies.`);
  }

  if (parsed.experience && parsed.experience.length > 0) {
    strengths.push("Clear work experience section with structured employment history.");
  } else {
    issues.push("Work experience section could not be clearly identified or is empty.");
    score -= 1;
  }

  if (parsed.education && parsed.education.length > 0) {
    strengths.push("Academic background and degree credentials clearly stated.");
  }

  const boundedScore = Math.max(1, Math.min(5, Math.round(score * 10) / 10));

  return {
    score: boundedScore,
    issues,
    warnings,
    strengths
  };
}

/**
 * Main Resume Parser Entry Point
 * @param {Buffer} fileBuffer
 * @param {string} mimeType
 * @param {string} filename
 * @returns {Promise<Object>} Structured Resume Object conforming to specification
 */
async function parseResume(fileBuffer, mimeType = "", filename = "") {
  // Step 1 & 2: Text extraction & Cleaning
  const extraction = await extractResumeText(fileBuffer, mimeType, filename);
  const { cleanText, requiresOcr, ocrWarning } = extraction;

  // Step 3: Section Detection
  const sections = detectResumeSections(cleanText);

  // Step 4: Extract Contact Information
  const emailMatch = cleanText.match(EMAIL_REGEX);
  const phoneMatch = cleanText.match(PHONE_REGEX);
  const linkedInMatch = cleanText.match(LINKEDIN_REGEX);
  const githubMatch = cleanText.match(GITHUB_REGEX);
  const portfolioMatch = cleanText.match(PORTFOLIO_REGEX);

  const candidateName = extractCandidateName(sections.contactHeader, cleanText);
  const location = extractLocation(sections.contactHeader || cleanText);

  // Step 5: Skill Extraction & Categorization
  const normalizedSkills = extractNormalizedSkills(cleanText);

  const categorizedSkills = {
    technical: [],
    soft: [],
    tools: [],
    databases: [],
    cloud: []
  };

  for (const sk of normalizedSkills) {
    if (sk.category === "Programming Languages" || sk.category === "Frontend" || sk.category === "Backend" || sk.category === "Data Science & AI") {
      categorizedSkills.technical.push(sk.normalized);
    } else if (sk.category === "Databases") {
      categorizedSkills.databases.push(sk.normalized);
    } else if (sk.category === "Cloud & DevOps") {
      categorizedSkills.cloud.push(sk.normalized);
    } else if (sk.category === "Soft Skills") {
      categorizedSkills.soft.push(sk.normalized);
    } else {
      categorizedSkills.tools.push(sk.normalized);
    }
  }

  // Step 6: Extract Experience & Education
  const experienceEntries = extractExperience(sections.experience);
  const totalExpYears = calculateTotalExperienceYears(experienceEntries);

  // Format experience display (e.g. "3.2 Years" or fallback to explicit search)
  let expString = `${totalExpYears} Years`;
  if (totalExpYears === 0) {
    const explicitExpMatch = cleanText.match(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s*of)?\s*(?:experience|exp)/i);
    if (explicitExpMatch) {
      expString = `${explicitExpMatch[1]} Years`;
    }
  }

  const educationEntries = extractEducation(sections.education);
  const projects = extractProjects(sections.projects);
  const certifications = extractCertifications(sections.certifications);

  // Step 7: Domain Classification
  const primaryRole = experienceEntries[0]?.title || "Professional";
  const domainAnalysis = classifyCandidateDomain(
    {
      role: primaryRole,
      currentRole: primaryRole,
      education: educationEntries[0]?.degree || "",
      summary: sections.summary,
      experience: experienceEntries
    },
    cleanText,
    normalizedSkills
  );

  // Professional summary fallback
  let summary = sections.summary;
  if (!summary) {
    summary = `${candidateName} is an experienced ${primaryRole} specializing in ${normalizedSkills.slice(0, 4).map(s => s.normalized).join(", ")}.`;
  }

  // Step 8: Resume Quality Assessment
  const intermediate = {
    candidate: {
      name: candidateName,
      email: emailMatch ? emailMatch[0] : null,
      phone: phoneMatch ? phoneMatch[0] : null,
      location,
      linkedin: linkedInMatch ? linkedInMatch[0] : null,
      github: githubMatch ? githubMatch[0] : null,
      portfolio: portfolioMatch ? portfolioMatch[0] : null
    },
    professional_summary: summary,
    domains: {
      primary: domainAnalysis.primary_domain,
      secondary: domainAnalysis.secondary_domains,
      confidence: domainAnalysis.confidence
    },
    skills: categorizedSkills,
    all_normalized_skills: normalizedSkills,
    education: educationEntries,
    experience: experienceEntries,
    experience_years: totalExpYears,
    experience_display: expString,
    projects,
    certifications,
    raw_text: cleanText,
    requires_ocr: requiresOcr,
    ocr_warning: ocrWarning
  };

  const resumeQuality = evaluateResumeQuality(intermediate, requiresOcr, ocrWarning);
  intermediate.resume_quality = resumeQuality;

  return intermediate;
}

module.exports = {
  parseResume,
  extractCandidateName,
  extractLocation,
  calculateTotalExperienceYears,
  evaluateResumeQuality
};
