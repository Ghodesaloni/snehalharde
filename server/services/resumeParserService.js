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

// Dictionary of known technical, engineering, finance, analyst, and management skills
const KNOWN_SKILLS = [
  // Data Science & AI
  "Python", "Data Science", "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
  "TensorFlow", "PyTorch", "Keras", "Scikit-Learn", "Pandas", "NumPy", "Statistics",
  "Predictive Modeling", "BigQuery", "Snowflake", "Spark", "ETL", "Jupyter", "Generative AI", "LLM",
  // Mechanical Engineering
  "Mechanical Engineering", "SolidWorks", "AutoCAD", "CATIA", "ANSYS", "FEA", "Thermodynamics",
  "Fluid Mechanics", "GD&T", "CNC", "Manufacturing", "HVAC", "Mechatronics", "Thermal Analysis",
  "Machine Design", "Creo", "Materials Science", "MATLAB",
  // Software Engineering
  "JavaScript", "TypeScript", "React", "React Native", "Next.js", "Vue", "Angular", "Node.js", "Express",
  "HTML", "CSS", "Tailwind", "Redux", "GraphQL", "REST API", "Java", "Spring Boot", "Kotlin", "Swift",
  "C#", ".NET", "C++", "C", "Golang", "Go", "Rust", "PHP", "SQL", "PostgreSQL", "MySQL", "MongoDB",
  "Redis", "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Linux", "Git", "GitHub", "Microservices",
  // Finance & Accounting
  "Finance", "Financial Modeling", "Corporate Finance", "Valuation", "Accounting", "Auditing",
  "Taxation", "Tax", "QuickBooks", "Tally", "SAP FICO", "Financial Reporting", "Budgeting",
  "Forecasting", "Balance Sheet", "P&L", "Cash Flow", "Equity Research", "CFA", "CPA", "Risk Management",
  // Analyst
  "Data Analysis", "Business Analysis", "Tableau", "PowerBI", "Power BI", "Data Visualization",
  "Reporting", "Dashboards", "KPI", "Market Research", "Business Intelligence",
  // Design & HR
  "Figma", "UI/UX", "HR", "Recruitment", "Talent Acquisition"
];

function classifyField(text = "", skills = [], role = "", filename = "") {
  const combined = `${filename} ${role} ${skills.join(" ")} ${text}`.toLowerCase();
  
  // 1. Data Science
  if (
    /data scien|machine learning|\bml\b|deep learning|\bnlp\b|computer vision|tensorflow|pytorch|keras|scikit|pandas|numpy|neural network|predictive model|bigquery|generative ai|\bllm\b|\bds\b|eda\b/i.test(combined)
  ) {
    return "Data Science";
  }
  
  // 2. Mechanical
  if (
    /mechanical|autocad|solidworks|catia|thermodynamics|fluid mechanics|\bfea\b|ansys|gd&t|\bcnc\b|manufacturing|hvac|mechatronics|thermal|creo|machine design|aerospace/i.test(combined)
  ) {
    return "Mechanical";
  }

  // 3. Finance
  if (
    /finance|financial|accounting|accountant|auditing|\baudit\b|taxation|\btax\b|wealth management|corporate finance|equity research|valuation|\bcpa\b|\bcfa\b|quickbooks|tally|sap fico|balance sheet|p&l|financial modeling|investment banking/i.test(combined)
  ) {
    return "Finance";
  }

  // 4. Analyst
  if (
    /data analyst|business analyst|bi analyst|operations analyst|product analyst|market research|tableau|power\s?bi|bi tools|business intelligence|reporting analyst|data analytics|dashboards/i.test(combined)
  ) {
    return "Analyst";
  }

  // 5. Software Engineer
  if (
    /software|developer|frontend|backend|full\s?stack|web dev|react|node|javascript|typescript|angular|vue|next|express|java\b|spring|c\+\+|c#|\.net|golang|\bgo\b|rust|python|django|flask|fastapi|devops|kubernetes|docker|cloud/i.test(combined)
  ) {
    return "Software Engineer";
  }

  return "Software Engineer";
}

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

  const field = classifyField(text, uniqueSkills, role, filename);
  if (role === "Candidate" || role === "Software Developer") {
    if (field === "Data Science") role = "Data Scientist";
    else if (field === "Mechanical") role = "Mechanical Engineer";
    else if (field === "Finance") role = "Financial Analyst";
    else if (field === "Analyst") role = "Data Analyst";
    else if (field === "Software Engineer") role = "Software Engineer";
  }

  return {
    name,
    email,
    phone,
    location: "India",
    role,
    field,
    domain: field,
    experience,
    expYears,
    skills: uniqueSkills.slice(0, 4),
    allSkills: uniqueSkills,
    education,
    summary: text.slice(0, 300) || `${name} - ${role} with ${experience} experience.`,
    rawText: text
  };
}

let parserQuotaExhaustedUntil = 0;

/**
 * Parse candidate details from resume text using Gemini AI or heuristic fallback
 */
async function parseResumeText(rawText, filename = "") {
  if (!rawText || rawText.length < 20) {
    // If text extraction yielded nothing, return a default candidate with minimal skills so it doesn't falsely shortlist
    return heuristicExtract(rawText || "", filename);
  }

  const ai = getAiClient();
  if (!ai || Date.now() < parserQuotaExhaustedUntil) {
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
        const skills = Array.isArray(parsed.skills) && parsed.skills.length > 0 ? parsed.skills : (parsed.allSkills || []).slice(0, 3);
        const allSkills = Array.isArray(parsed.allSkills) ? parsed.allSkills : (parsed.skills || []);
        const field = classifyField(rawText, allSkills, parsed.role || "", filename);
        return {
          name: parsed.name || "Candidate",
          email: parsed.email || `${(parsed.name || "candidate").toLowerCase().replace(/\s+/g, ".")}@example.com`,
          phone: parsed.phone || "+91 98" + Math.floor(10000000 + Math.random() * 90000000),
          location: parsed.location || "India",
          role: parsed.role || (field === "Data Science" ? "Data Scientist" : field === "Mechanical" ? "Mechanical Engineer" : field === "Finance" ? "Financial Analyst" : field === "Analyst" ? "Data Analyst" : "Software Engineer"),
          field,
          domain: field,
          experience: parsed.experience || `${parsed.expYears || 1} Years`,
          expYears: typeof parsed.expYears === "number" ? parsed.expYears : 1,
          skills,
          allSkills,
          education: parsed.education || "Bachelor's Degree",
          summary: parsed.summary || "",
          rawText
        };
      }
    }

    return heuristicExtract(rawText, filename);
  } catch (err) {
    if (err.message && (err.message.includes("429") || err.message.includes("RESOURCE_EXHAUSTED") || err.message.includes("quota"))) {
      parserQuotaExhaustedUntil = Date.now() + 60000;
      console.warn("Gemini quota reached for parsing. Switching to heuristic resume extractor for next 60s.");
    } else {
      console.warn("Gemini resume parsing failed, using heuristic fallback:", err.message);
    }
    return heuristicExtract(rawText, filename);
  }
}

module.exports = {
  extractRawText,
  parseResumeText,
  heuristicExtract,
  classifyField
};
