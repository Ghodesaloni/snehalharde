/**
 * Structured Job Description Parser Service
 * Extracts and categorizes JD requirements into:
 * - Title, Department, Seniority Level
 * - Required / Must-Have Skills vs Preferred / Nice-To-Have Skills
 * - Required Experience (Min Years) vs Preferred Experience
 * - Required Education, Certifications & Responsibilities
 * - Target Domain Mapping
 */

const { normalizeSkill, extractNormalizedSkills } = require("./skillTaxonomy");
const { classifyCandidateDomain } = require("./domainClassifier");

/**
 * Parses and extracts min required experience years from text or level string
 * e.g. "3-5 years" -> 3, "2+ years" -> 2, "Senior Level" -> 5
 */
function parseRequiredExperienceYears(text = "", expLevel = "", jobLevel = "") {
  const combined = `${expLevel} ${jobLevel} ${text}`.toLowerCase();

  // Look for explicit pattern like "3+ years", "3-5 years", "minimum 4 years"
  const minMatch = combined.match(/(?:min(?:imum)?|at least)?\s*(\d+)(?:\+|\s*-\s*\d+)?\s*(?:years?|yrs?)/i);
  if (minMatch) {
    return parseInt(minMatch[1], 10);
  }

  // Fallbacks based on level name
  if (/lead|principal|architect|director/i.test(combined)) return 7;
  if (/senior|sr\b/i.test(combined)) return 5;
  if (/mid|intermediate/i.test(combined)) return 2;
  if (/junior|entry|fresher|intern/i.test(combined)) return 0;

  return 2;
}

/**
 * Separates required (must-have) vs preferred (nice-to-have) skills from JD text
 */
function extractJdSkills(jdText = "", keySkillsList = []) {
  const normalizedKeySkills = (Array.isArray(keySkillsList) ? keySkillsList : [])
    .map(s => normalizeSkill(s))
    .filter(Boolean);

  const textLower = jdText.toLowerCase();

  // Check for explicit "Preferred", "Bonus", "Nice to have" sections
  const preferredSectionMatch = jdText.match(/(?:nice to have|preferred qualifications|good to have|bonus points|preferred skills|optional)[:\n]([\s\S]*?)(?=(?:responsibilities|requirements|education|what we offer|$))/i);
  
  const preferredText = preferredSectionMatch ? preferredSectionMatch[1] : "";
  const preferredSkillsNormalized = extractNormalizedSkills(preferredText);

  // Extract all skills from the entire JD text
  const allJdSkills = extractNormalizedSkills(jdText);

  // Add any explicitly provided keySkills from the job object
  for (const ks of normalizedKeySkills) {
    if (!allJdSkills.some(s => s.normalized === ks.normalized)) {
      allJdSkills.push(ks);
    }
  }

  const preferredMap = new Set(preferredSkillsNormalized.map(s => s.normalized));
  const requiredSkills = [];
  const preferredSkills = [];

  for (const sk of allJdSkills) {
    if (preferredMap.has(sk.normalized)) {
      preferredSkills.push(sk);
    } else {
      requiredSkills.push(sk);
    }
  }

  // If all ended up in preferred or required is empty, distribute sensibly
  if (requiredSkills.length === 0 && allJdSkills.length > 0) {
    requiredSkills.push(...allJdSkills);
  }

  return {
    requiredSkills,
    preferredSkills,
    allSkills: allJdSkills
  };
}

/**
 * Detects degree requirement from JD text
 */
function extractRequiredDegree(text = "") {
  if (/ph\.?d|doctorate/i.test(text)) return "Doctorate / PhD";
  if (/master(?:'s)?|m\.?tech|m\.?s|mba|mca/i.test(text)) return "Master's Degree";
  if (/bachelor(?:'s)?|b\.?tech|b\.?s|bca|undergraduate/i.test(text)) return "Bachelor's Degree";
  return "Bachelor's Degree"; // Standard industry baseline
}

/**
 * Parses full structured Job Description
 */
function parseJobDescription(job) {
  if (!job) return null;

  const text = `${job.title || ""} ${job.description || ""} ${(job.keySkills || []).join(" ")}`;
  const { requiredSkills, preferredSkills, allSkills } = extractJdSkills(job.description || "", job.keySkills || []);
  const minExperienceYears = parseRequiredExperienceYears(job.description || "", job.expLevel || "", job.jobLevel || "");
  const requiredDegree = extractRequiredDegree(text);

  // Domain classification for the JD
  const domainAnalysis = classifyCandidateDomain(
    {
      role: job.title || "",
      education: requiredDegree,
      summary: job.description || ""
    },
    text,
    allSkills
  );

  return {
    id: job.id,
    title: job.title || "Job Position",
    dept: job.dept || "Engineering",
    domain: domainAnalysis.primary_domain,
    secondaryDomains: domainAnalysis.secondary_domains,
    jobLevel: job.jobLevel || "Mid Level",
    expLevel: job.expLevel || `${minExperienceYears}+ Years`,
    minExperienceYears,
    requiredSkills,
    preferredSkills,
    allSkills,
    requiredDegree,
    description: job.description || "",
    workMode: job.workMode || (job.isRemotePosition ? "Remote" : "On-site"),
    loc: job.loc || "Remote"
  };
}

module.exports = {
  parseRequiredExperienceYears,
  extractJdSkills,
  extractRequiredDegree,
  parseJobDescription
};
