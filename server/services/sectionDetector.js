/**
 * Robust Resume Section Detector
 * Segments cleaned resume text into standard semantic sections using pattern recognition,
 * typography cues, line length, and section header variations.
 */

const SECTION_PATTERNS = {
  summary: [
    /^(?:professional\s+)?summary\b/i,
    /^(?:career\s+)?objective\b/i,
    /^(?:executive\s+)?profile\b/i,
    /^about\s+me\b/i,
    /^personal\s+statement\b/i,
    /^background\b/i
  ],
  skills: [
    /^(?:technical\s+|core\s+|key\s+)?skills\b/i,
    /^technologies(?:\s+and\s+tools)?\b/i,
    /^(?:core\s+)?competencies\b/i,
    /^tech\s+stack\b/i,
    /^areas\s+of\s+expertise\b/i,
    /^proficiencies\b/i,
    /^tools\s+(?:&|and)\s+technologies\b/i
  ],
  experience: [
    /^(?:work|professional|employment|career)\s+(?:experience|history)\b/i,
    /^experience\b/i,
    /^work\s+history\b/i,
    /^employment\b/i,
    /^relevant\s+experience\b/i,
    /^internships?\b/i
  ],
  education: [
    /^education(?:al\s+background)?\b/i,
    /^academic\s+(?:qualifications|background|history)\b/i,
    /^academics\b/i,
    /^degrees(?:\s+and\s+credentials)?\b/i,
    /^qualifications\b/i
  ],
  projects: [
    /^(?:key\s+|technical\s+|academic\s+|personal\s+)?projects\b/i,
    /^project\s+work\b/i,
    /^portfolio\s+projects\b/i
  ],
  certifications: [
    /^(?:licenses\s+and\s+)?certifications?\b/i,
    /^certificates?\b/i,
    /^accreditations?\b/i,
    /^professional\s+credentials?\b/i
  ],
  achievements: [
    /^(?:awards\s+and\s+)?achievements?\b/i,
    /^honors(?:\s+and\s+awards)?\b/i,
    /^publications?(?:\s+and\s+patents)?\b/i,
    /^accomplishments?\b/i
  ],
  languages: [
    /^languages?(?:\s+known|\s+proficiency)?\b/i
  ]
};

/**
 * Checks if a line matches any known section header
 * Header lines are usually short (< 40 chars) and standalone
 */
function identifyHeader(line) {
  const trimmed = line.trim().replace(/^[\W_]+|[\W_]+$/g, ""); // strip leading/trailing bullets/colons
  if (!trimmed || trimmed.length > 45) return null;

  for (const [sectionName, patterns] of Object.entries(SECTION_PATTERNS)) {
    for (const pat of patterns) {
      if (pat.test(trimmed)) {
        return sectionName;
      }
    }
  }
  return null;
}

/**
 * Splits resume text into structured sections
 * @param {string} cleanText
 * @returns {Object} Map of section names to text content, plus header/contact segment
 */
function detectResumeSections(cleanText = "") {
  if (!cleanText) {
    return {
      contactHeader: "",
      summary: "",
      skills: "",
      experience: "",
      education: "",
      projects: "",
      certifications: "",
      achievements: "",
      languages: "",
      other: ""
    };
  }

  const lines = cleanText.split("\n");
  const sections = {
    contactHeader: [],
    summary: [],
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    achievements: [],
    languages: [],
    other: []
  };

  let currentSection = "contactHeader";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const detected = identifyHeader(line);

    if (detected) {
      currentSection = detected;
      continue; // do not include the header title itself in the content
    }

    if (sections[currentSection]) {
      sections[currentSection].push(line);
    } else {
      sections.other.push(line);
    }
  }

  // Convert line arrays to trimmed strings
  const result = {};
  for (const [sec, lineArr] of Object.entries(sections)) {
    result[sec] = lineArr.join("\n").trim();
  }

  return result;
}

module.exports = {
  detectResumeSections,
  identifyHeader
};
