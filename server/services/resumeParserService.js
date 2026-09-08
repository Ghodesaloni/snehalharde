const pdfParse = require("pdf-parse");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

let aiClient = null;

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
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

// Dictionary of known technical, design, and management skills for deterministic fallback parsing
const KNOWN_SKILLS = [
  "Python", "Django", "Flask", "FastAPI", "Pandas", "NumPy", "PyTorch", "TensorFlow", "Scikit-Learn",
  "JavaScript", "TypeScript", "React", "React Native", "Next.js", "Vue", "Angular", "Node.js", "Express",
  "HTML", "CSS", "Tailwind", "Bootstrap", "Redux", "GraphQL", "REST API", "RESTful",
  "Java", "Spring Boot", "Spring", "Hibernate", "Kotlin", "Swift", "C#", ".NET", "C++", "C", "Golang", "Go", "Rust", "PHP", "Laravel",
  "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "DynamoDB", "Elasticsearch", "Cassandra",
  "AWS", "Amazon Web Services", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "CI/CD", "Terraform", "Linux", "Git", "GitHub",
  "Microservices", "System Design", "Distributed Systems", "OOP", "Data Structures", "Algorithms",
  "Figma", "Adobe XD", "UI/UX", "User Research", "Wireframing", "Prototyping", "Design Systems",
  "Tableau", "PowerBI", "Data Analysis", "Data Science", "Machine Learning", "NLP", "BigQuery", "Snowflake", "ETL",
  "HR", "Recruitment", "Talent Acquisition", "Sourcing", "Screening", "Onboarding", "Payroll", "Employee Relations"
];

/**
 * Extract raw text from file buffer (PDF or plain text)
 */
async function extractRawText(fileBuffer, mimeType = "", originalFilename = "") {
  if (!fileBuffer || fileBuffer.length === 0) {
    return "";
  }

  const isPdf =
    mimeType === "application/pdf" ||
    (originalFilename && originalFilename.toLowerCase().endsWith(".pdf"));

  if (isPdf) {
    try {
      const data = await pdfParse(fileBuffer);
      return (data.text || "").trim();
    } catch (err) {
      console.warn("pdf-parse failed to parse PDF buffer, attempting plain text fallback:", err.message);
      return fileBuffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ").trim();
    }
  }

  // Text, markdown, csv, or unknown utf8
  return fileBuffer.toString("utf-8").trim();
}

/**
 * Deterministic regex/heuristic parser when Gemini is unavailable or text is short
 */
function heuristicExtract(text, filename = "") {
  const cleanFilename = filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();

  // Extract Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0].toLowerCase() : `${cleanFilename.toLowerCase().replace(/\s+/g, ".")}@example.com`;

  // Extract Phone
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[\s-]?\d{10}|\b\d{10}\b/);
  const phone = phoneMatch ? phoneMatch[0] : "+91 " + Math.floor(9000000000 + Math.random() * 999999999);

  // Extract Name: check first few lines of text
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 2 && l.length < 50);
  let name = cleanFilename || "Applicant";
  for (const line of lines.slice(0, 5)) {
    // If line doesn't contain email, phone, http, or digits, could be a name
    if (!line.includes("@") && !/\d/.test(line) && !line.includes("http") && !/resume|curriculum|vitae/i.test(line)) {
      if (line.split(" ").length >= 2 && line.split(" ").length <= 4) {
        name = line;
        break;
      }
    }
  }

  // Extract Experience
  let expYears = 1;
  let experience = "1-2 Years";
  const expMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:\+|-|\s*to\s*\d+)?\s*(?:years?|yrs?)(?:\s+of\s+experience)?/i);
  if (expMatch) {
    const parsed = parseFloat(expMatch[1]);
    if (!isNaN(parsed) && parsed > 0 && parsed < 40) {
      expYears = Math.round(parsed * 10) / 10;
      experience = `${expYears} Years`;
    }
  }

  // Extract Education
  let education = "Bachelor's Degree";
  if (/B\.?Tech|B\.?E\.?|Computer Science/i.test(text)) {
    education = "B.Tech in Computer Science";
  } else if (/M\.?Tech|Master/i.test(text)) {
    education = "M.Tech in Software Engineering";
  } else if (/MCA|BCA/i.test(text)) {
    education = "Master of Computer Applications (MCA)";
  } else if (/B\.?Sc|Bachelor of Science/i.test(text)) {
    education = "B.Sc in Computer Science";
  } else if (/MBA/i.test(text)) {
    education = "Master of Business Administration (MBA)";
  }

  // Extract Skills: scan ONLY skills actually present in the text!
  const textLower = text.toLowerCase();
  const detectedSkills = [];
  for (const skill of KNOWN_SKILLS) {
    const sLower = skill.toLowerCase();
    // Match skill word boundary
    const regex = new RegExp(`(^|[^a-zA-Z0-9#+])${sLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[^a-zA-Z0-9#+]|$)`, "i");
    if (regex.test(textLower)) {
      detectedSkills.push(skill);
    }
  }

  // Deduplicate and prioritize
  const uniqueSkills = Array.from(new Set(detectedSkills));

  // Determine candidate's current role based on their actual detected skills
  let role = "Candidate";
  if (uniqueSkills.some(s => ["HR", "Recruitment", "Talent Acquisition", "Sourcing"].includes(s))) {
    role = "HR Talent Acquisition";
  } else if (uniqueSkills.some(s => ["Figma", "UI/UX", "Adobe XD", "Design Systems"].includes(s))) {
    role = "UI/UX Designer";
  } else if (uniqueSkills.some(s => ["Kubernetes", "Docker", "Terraform", "CI/CD"].includes(s))) {
    role = "DevOps Engineer";
  } else if (uniqueSkills.some(s => ["Pandas", "NumPy", "Data Analysis", "Tableau"].includes(s))) {
    role = "Data Analyst";
  } else if (uniqueSkills.some(s => ["Python", "Flask", "Django", "FastAPI"].includes(s))) {
    role = "Python Developer";
  } else if (uniqueSkills.some(s => ["React", "Vue", "Angular", "Next.js"].includes(s))) {
    role = "Frontend Developer";
  } else if (uniqueSkills.some(s => ["Java", "Spring Boot"].includes(s))) {
    role = "Java Backend Developer";
  } else if (uniqueSkills.length > 0) {
    role = "Software Developer";
  }

  return {
    name,
    email,
    phone,
    location: "India",
    role,
    experience,
    expYears,
    skills: uniqueSkills.slice(0, 4),
    allSkills: uniqueSkills,
    education,
    summary: text.slice(0, 300) || `${name} - ${role} with ${experience} experience.`,
    rawText: text
  };
}

/**
 * Parse candidate details from resume text using Gemini AI or heuristic fallback
 */
async function parseResumeText(rawText, filename = "") {
  if (!rawText || rawText.length < 20) {
    // If text extraction yielded nothing, return a default candidate with minimal skills so it doesn't falsely shortlist
    return heuristicExtract(rawText || "", filename);
  }

  const ai = getAiClient();
  if (!ai) {
    return heuristicExtract(rawText, filename);
  }

  try {
    const prompt = `You are a professional resume parser.
Read the following resume text and extract the candidate's actual information into a strict JSON object.

CRITICAL INSTRUCTIONS:
1. ONLY extract skills that are EXPLICITLY mentioned in the resume text. DO NOT assume, guess, or invent skills. If a skill is not written in the text, DO NOT include it.
2. If the resume is in another field (e.g. HR, Sales, Design), extract those exact skills, not software engineering skills.
3. If experience years cannot be found, estimate conservatively based on dates.
4. Extract the candidate's real name from the top of the resume.

Resume Text:
"""
${rawText.slice(0, 6000)}
"""

Return JSON ONLY with this exact schema:
{
  "name": "Candidate Full Name",
  "email": "candidate email or ''",
  "phone": "candidate phone or ''",
  "location": "Candidate location / city or ''",
  "role": "Current professional title / headline based on their resume",
  "experience": "e.g. '3 Years'",
  "expYears": number,
  "skills": ["Top 3-4 actual skills mentioned"],
  "allSkills": ["All actual skills mentioned in the resume"],
  "education": "Degree and major, e.g. 'B.Tech in Computer Science'",
  "summary": "1-2 sentence factual summary of the candidate's background"
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
      if (parsed && parsed.name) {
        return {
          name: parsed.name || "Candidate",
          email: parsed.email || `${(parsed.name || "candidate").toLowerCase().replace(/\s+/g, ".")}@example.com`,
          phone: parsed.phone || "+91 98" + Math.floor(10000000 + Math.random() * 90000000),
          location: parsed.location || "India",
          role: parsed.role || "Candidate",
          experience: parsed.experience || `${parsed.expYears || 1} Years`,
          expYears: typeof parsed.expYears === "number" ? parsed.expYears : 1,
          skills: Array.isArray(parsed.skills) && parsed.skills.length > 0 ? parsed.skills : (parsed.allSkills || []).slice(0, 3),
          allSkills: Array.isArray(parsed.allSkills) ? parsed.allSkills : (parsed.skills || []),
          education: parsed.education || "Bachelor's Degree",
          summary: parsed.summary || "",
          rawText
        };
      }
    }

    return heuristicExtract(rawText, filename);
  } catch (err) {
    console.warn("Gemini resume parsing failed, using heuristic fallback:", err.message);
    return heuristicExtract(rawText, filename);
  }
}

module.exports = {
  extractRawText,
  parseResumeText,
  heuristicExtract
};
