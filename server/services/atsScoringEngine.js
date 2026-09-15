/**
 * Transparent, Reproducible ATS Scoring & JD Matching Engine
 * Implements the configurable 8-factor weighted scoring model (0-100 total):
 * 1. Required Skills (30 pts)
 * 2. Preferred Skills (10 pts)
 * 3. Experience (20 pts)
 * 4. Education (10 pts)
 * 5. Keywords & Methodologies (10 pts)
 * 6. Domain Relevance (10 pts)
 * 7. Resume Quality (5 pts)
 * 8. Certifications (5 pts)
 */

const DEFAULT_WEIGHTS = {
  requiredSkills: 30,
  preferredSkills: 10,
  experience: 20,
  education: 10,
  keywords: 10,
  domainRelevance: 10,
  resumeQuality: 5,
  certifications: 5
};

/**
 * Calculates ATS score and full breakdown against a structured Job Description
 * @param {Object} parsedResume - Structured resume object from parseResume
 * @param {Object} structuredJd - Structured job description from parseJobDescription
 * @param {Object} customWeights - Optional overrides for scoring weights
 */
function calculateAtsScore(parsedResume, structuredJd, customWeights = {}) {
  const weights = { ...DEFAULT_WEIGHTS, ...customWeights };

  const candidateSkills = parsedResume.all_normalized_skills || [];
  const candidateSkillNamesLower = new Set(candidateSkills.map(s => s.normalized.toLowerCase()));

  // 1. Required Skills Matching (Weight: 30 pts)
  const requiredJdSkills = structuredJd.requiredSkills || [];
  const matchedRequired = [];
  const missingRequired = [];

  for (const rSkill of requiredJdSkills) {
    const rLower = rSkill.normalized.toLowerCase();
    if (candidateSkillNamesLower.has(rLower)) {
      matchedRequired.push({
        name: rSkill.normalized,
        type: "Required",
        category: rSkill.category
      });
    } else {
      missingRequired.push(rSkill.normalized);
    }
  }

  const requiredSkillRatio = requiredJdSkills.length > 0
    ? matchedRequired.length / requiredJdSkills.length
    : 1.0;
  const requiredSkillsScore = Math.round(requiredSkillRatio * weights.requiredSkills * 10) / 10;

  // 2. Preferred Skills Matching (Weight: 10 pts)
  const preferredJdSkills = structuredJd.preferredSkills || [];
  const matchedPreferred = [];
  const missingPreferred = [];

  for (const pSkill of preferredJdSkills) {
    const pLower = pSkill.normalized.toLowerCase();
    if (candidateSkillNamesLower.has(pLower)) {
      matchedPreferred.push({
        name: pSkill.normalized,
        type: "Preferred",
        category: pSkill.category
      });
    } else {
      missingPreferred.push(pSkill.normalized);
    }
  }

  const preferredSkillRatio = preferredJdSkills.length > 0
    ? matchedPreferred.length / preferredJdSkills.length
    : 0.8; // default neutral if no preferred skills in JD
  const preferredSkillsScore = Math.round(preferredSkillRatio * weights.preferredSkills * 10) / 10;

  // 3. Experience Score (Weight: 20 pts)
  const candidateExpYears = typeof parsedResume.experience_years === "number" ? parsedResume.experience_years : 0;
  const requiredExpYears = structuredJd.minExperienceYears || 2;

  let expRatio = 1.0;
  let expStatus = "MATCH";

  if (requiredExpYears === 0) {
    expRatio = 1.0;
    expStatus = "MATCH";
  } else if (candidateExpYears >= requiredExpYears) {
    expRatio = 1.0;
    expStatus = candidateExpYears >= requiredExpYears + 2 ? "EXCEEDS" : "MATCH";
  } else {
    // Partial score for experience (e.g. 1.5 yrs vs 2 yrs)
    expRatio = Math.max(0.3, candidateExpYears / requiredExpYears);
    expStatus = candidateExpYears >= requiredExpYears * 0.7 ? "PARTIAL" : "SHORTFALL";
  }
  const experienceScore = Math.round(expRatio * weights.experience * 10) / 10;

  // 4. Education Score (Weight: 10 pts)
  let educationScore = 7.0;
  const eduEntries = parsedResume.education || [];
  const eduText = eduEntries.map(e => `${e.degree || ""} ${e.institution || ""}`).join(" ").toLowerCase();

  if (/ph\.?d|doctorate/i.test(eduText)) {
    educationScore = 10.0;
  } else if (/master(?:'s)?|m\.?tech|m\.?s|mba|mca/i.test(eduText)) {
    educationScore = 9.5;
  } else if (/bachelor(?:'s)?|b\.?tech|b\.?s|bca/i.test(eduText)) {
    educationScore = 9.0;
  } else if (eduEntries.length > 0) {
    educationScore = 7.5;
  } else {
    educationScore = 5.0;
  }
  educationScore = Math.min(weights.education, educationScore * (weights.education / 10));

  // 5. Keyword & Methodology Alignment (Weight: 10 pts)
  const resumeRawLower = (parsedResume.raw_text || "").toLowerCase();
  const jdRawLower = (structuredJd.description || "").toLowerCase();
  
  const commonKeywords = [
    "agile", "scrum", "microservices", "unit testing", "ci/cd", "rest", "api", "git",
    "cloud", "scalable", "architecture", "optimization", "collaboration", "cross-functional"
  ];
  let matchedKw = 0;
  for (const kw of commonKeywords) {
    if (jdRawLower.includes(kw) && resumeRawLower.includes(kw)) {
      matchedKw++;
    }
  }
  const keywordRatio = Math.min(1.0, Math.max(0.4, matchedKw / 4));
  const keywordsScore = Math.round(keywordRatio * weights.keywords * 10) / 10;

  // 6. Domain Relevance (Weight: 10 pts)
  // Candidate domain vs JD domain
  const candidatePrimary = parsedResume.domains?.primary || "General";
  const candidateSecondary = parsedResume.domains?.secondary || [];
  const jdDomain = structuredJd.domain || "Software Development";

  let domainScore = 6.0;
  if (candidatePrimary.toLowerCase() === jdDomain.toLowerCase()) {
    domainScore = 10.0;
  } else if (candidateSecondary.some(s => s.toLowerCase() === jdDomain.toLowerCase())) {
    domainScore = 8.5;
  } else {
    // Cross-domain candidate: evaluate based on actual required skill overlap!
    // E.g. Finance candidate with Python + SQL for Data Science gets fair score
    domainScore = Math.max(5.0, 5.0 + requiredSkillRatio * 4.0);
  }
  const domainRelevanceScore = Math.round(domainScore * (weights.domainRelevance / 10) * 10) / 10;

  // 7. Resume Quality (Weight: 5 pts)
  const qualityRawScore = parsedResume.resume_quality?.score || 4.0;
  const resumeQualityScore = Math.round((qualityRawScore / 5.0) * weights.resumeQuality * 10) / 10;

  // 8. Certifications (Weight: 5 pts)
  const certsCount = (parsedResume.certifications || []).length;
  let certScore = 2.0;
  if (certsCount >= 2) certScore = 5.0;
  else if (certsCount === 1) certScore = 4.0;
  const certificationsScore = Math.min(weights.certifications, certScore * (weights.certifications / 5));

  // Compute Total Score
  const rawTotal = requiredSkillsScore +
    preferredSkillsScore +
    experienceScore +
    educationScore +
    keywordsScore +
    domainRelevanceScore +
    resumeQualityScore +
    certificationsScore;

  const totalAtsScore = Math.max(15, Math.min(100, Math.round(rawTotal)));

  // Determine Shortlisting Status
  let status = "Review";
  if (totalAtsScore >= 75 && requiredSkillRatio >= 0.60) {
    status = "Shortlisted";
  } else if (totalAtsScore < 50 || requiredSkillRatio < 0.35) {
    status = "Rejected";
  } else {
    status = "Review";
  }

  // Key Points Synthesis
  const strengths = [];
  if (matchedRequired.length > 0) {
    strengths.push(`Matches ${matchedRequired.length} essential core skills for ${structuredJd.title}: ${matchedRequired.slice(0, 4).map(s => s.name).join(", ")}.`);
  }
  if (expStatus === "EXCEEDS") {
    strengths.push(`Has ${candidateExpYears} years experience, exceeding the required ${requiredExpYears} years.`);
  } else if (expStatus === "MATCH") {
    strengths.push(`Satisfies target experience threshold (${candidateExpYears} years vs ${requiredExpYears} years required).`);
  }
  if (educationScore >= 9.0) {
    strengths.push(`Strong academic background (${eduEntries[0]?.degree || structuredJd.requiredDegree}).`);
  }

  const missingSkills = [];
  if (missingRequired.length > 0) {
    missingSkills.push(`Missing core required skills: ${missingRequired.join(", ")}`);
  }
  if (missingPreferred.length > 0) {
    missingSkills.push(`Missing preferred nice-to-have skills: ${missingPreferred.slice(0, 3).join(", ")}`);
  }
  if (expStatus === "SHORTFALL") {
    missingSkills.push(`Experience shortfall: candidate has ${candidateExpYears} years vs ${requiredExpYears} required.`);
  }

  const allMatched = [...matchedRequired, ...matchedPreferred];
  const skillsMatchPct = Math.round(((matchedRequired.length + matchedPreferred.length) / Math.max(1, requiredJdSkills.length + preferredJdSkills.length)) * 100);

  return {
    atsScore: totalAtsScore,
    matchScore: totalAtsScore,
    skillsMatchPct: Math.min(100, Math.max(20, skillsMatchPct)),
    status,
    breakdown: {
      requiredSkills: {
        score: requiredSkillsScore,
        max: weights.requiredSkills,
        percentage: Math.round(requiredSkillRatio * 100)
      },
      preferredSkills: {
        score: preferredSkillsScore,
        max: weights.preferredSkills,
        percentage: Math.round(preferredSkillRatio * 100)
      },
      experience: {
        score: experienceScore,
        max: weights.experience,
        candidateYears: candidateExpYears,
        requiredYears: requiredExpYears,
        status: expStatus
      },
      education: {
        score: educationScore,
        max: weights.education
      },
      keywords: {
        score: keywordsScore,
        max: weights.keywords
      },
      domainRelevance: {
        score: domainRelevanceScore,
        max: weights.domainRelevance,
        candidateDomain: candidatePrimary,
        jdDomain
      },
      resumeQuality: {
        score: resumeQualityScore,
        max: weights.resumeQuality
      },
      certifications: {
        score: certificationsScore,
        max: weights.certifications
      }
    },
    matchedSkills: allMatched,
    missingRequiredSkills: missingRequired,
    missingPreferredSkills: missingPreferred,
    keyPoints: {
      strengths: strengths.length > 0 ? strengths : [`Basic alignment with ${structuredJd.title} requirements.`],
      missingSkills: missingSkills.length > 0 ? missingSkills : ["No critical technical gaps identified."],
      experienceMatch: `Candidate has ${candidateExpYears} years of experience compared to target of ${requiredExpYears}+ years (${expStatus}).`,
      verdict: `Candidate evaluated at ${totalAtsScore}/100 ATS Score. Status assigned: ${status} based on ${Math.round(requiredSkillRatio * 100)}% required skill alignment.`
    }
  };
}

module.exports = {
  DEFAULT_WEIGHTS,
  calculateAtsScore
};
