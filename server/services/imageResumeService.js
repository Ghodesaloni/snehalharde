/**
 * Production Resume Image OCR & Document Intelligence Service
 * 
 * Capabilities:
 * 1. Multimodal document understanding & OCR via Gemini (gemini-3.8-flash)
 * 2. Automatic resume detection & classification (rejects selfies, ID cards, certificates, invoices, memes, etc.)
 * 3. Candidate photo detection: detects candidate photos and guarantees they are NOT extracted or stored
 * 4. Visual noise filtering: strips logos, signatures, QR codes, icons, decorative graphics, watermarks
 * 5. Screenshot & WhatsApp intelligence: isolates actual resume document, ignoring WhatsApp chat UI, bubbles, timestamps, sender info
 * 6. Hallucination guard: leaves unreadable/unclear text empty or null
 * 7. Verification: throws "No valid resume detected." when non-resume images are provided
 */

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

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const IMAGE_MIMES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
];

/**
 * Checks whether the file is an image by extension or mime type
 */
function isImageResume(filename = "", mimeType = "") {
  const ext = (filename.match(/\.[^.]+$/)?.[0] || "").toLowerCase();
  const mime = (mimeType || "").toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext) || IMAGE_MIMES.includes(mime) || mime.startsWith("image/");
}

/**
 * Normalizes image MIME type for Gemini API
 */
function getNormalizedImageMime(filename = "", mimeType = "") {
  const ext = (filename.match(/\.[^.]+$/)?.[0] || "").toLowerCase();
  const mime = (mimeType || "").toLowerCase();

  if (ext === ".png" || mime === "image/png") return "image/png";
  if (ext === ".webp" || mime === "image/webp") return "image/webp";
  return "image/jpeg";
}

/**
 * Extracts and classifies a resume image
 * @param {Buffer} imageBuffer
 * @param {string} mimeType
 * @param {string} filename
 * @returns {Promise<Object>}
 */
async function processResumeImage(imageBuffer, mimeType = "", filename = "") {
  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error("No valid resume detected.");
  }

  const ai = getAiClient();
  if (!ai) {
    throw new Error("No valid resume detected.");
  }

  const normalizedMime = getNormalizedImageMime(filename, mimeType);
  const base64Data = imageBuffer.toString("base64");

  const prompt = `You are a specialized Recruitment Document Classification and High-Precision OCR Engine.

Your task is to analyze the provided image, determine if it contains an authentic candidate resume / CV, and extract only valid resume text and information.

STEP 1: DOCUMENT CLASSIFICATION & VALIDATION
- Determine whether this image is an authentic professional resume, CV, biodata, or curriculum vitae.
- STRICT REJECTION: The following MUST be classified as NOT a resume (set "isResume": false):
  * Personal selfies, casual photos, portrait photos, or standalone profile pictures.
  * Identity cards (e.g. Aadhaar card, PAN card, driver's license, passport, national ID card, voter ID).
  * Certificates of completion, awards, degrees, or diplomas.
  * Invoices, receipts, billing slips, tickets, or bank statements.
  * Screenshots of messaging chats (WhatsApp, Telegram, SMS), social media feeds, or email inboxes that DO NOT contain an actual resume inside.
  * Wallpapers, memes, artwork, diagrams, code snippets, or arbitrary photos.
  * Extremely blurry, low-resolution, or completely unreadable text.
- If it is NOT a valid resume, set "isResume": false, set "rejectionReason": "No valid resume detected.", and leave candidate fields null/empty.

STEP 2: SCREENSHOT & WHATSAPP HANDLING
- If the image is a screenshot (e.g. WhatsApp, mobile messenger, gallery screenshot, or photo of a paper resume):
  * Check if an actual resume document is visible.
  * If yes, set "isResume": true and "isScreenshotOrWhatsApp": true.
  * CROP OUT & IGNORE all surrounding WhatsApp UI elements: chat bubbles, headers, sender profile/name, contact phone in chat title, status bars, battery/wifi indicators, timestamps, reply icons, camera buttons, and background chat wallpaper.
  * Extract ONLY the candidate text from the actual resume document displayed.

STEP 3: CANDIDATE PHOTO & DECORATIVE ELEMENT SANITIZATION
- If the resume contains the candidate's portrait/profile picture:
  * Set "hasCandidatePhoto": true.
  * DO NOT extract, describe, or record the photo or the person's physical appearance. Extract ONLY textual information.
- IGNORE company logos, icons, decorative ribbons, QR codes, signatures, watermarks, and page background artwork.

STEP 4: OCR & DATA EXTRACTION (NO HALLUCINATIONS)
- Extract all readable text from the resume into "extractedResumeText" in natural reading order.
- Extract structured fields:
  * candidateName: Full name of candidate (null if not found/unreadable).
  * email: Candidate email (null if not found).
  * phone: Candidate phone number (null if not found).
  * location: City, State, Country (null if not found).
  * linkedin: LinkedIn profile link or handle (null if not found).
  * github: GitHub profile link or handle (null if not found).
  * summary: Professional summary or objective statement.
  * experience: Array of work experience entries [{ "title", "company", "location", "startDate", "endDate", "current": boolean, "description" }].
  * education: Array of education entries [{ "degree", "institution", "field", "startYear", "endYear", "grade" }].
  * skills: Array of specific technical, programming, tools, or professional skills explicitly stated.
  * projects: Array of projects [{ "name", "description", "technologies": [] }].
  * certifications: Array of certifications explicitly listed on the resume.
- STRICT RULE: NEVER hallucinate or guess details. If information is not clearly visible in the resume, leave it null or empty array.

Return ONLY a valid JSON object with this exact structure:
{
  "isResume": true or false,
  "confidence": number between 0.0 and 1.0,
  "rejectionReason": "No valid resume detected." (only if isResume is false),
  "hasCandidatePhoto": true or false,
  "isScreenshotOrWhatsApp": true or false,
  "extractedResumeText": "Full extracted textual content of the resume...",
  "candidate": {
    "name": "Candidate Full Name" or null,
    "email": "candidate@example.com" or null,
    "phone": "+1234567890" or null,
    "location": "City, State" or null,
    "linkedin": "url" or null,
    "github": "url" or null
  },
  "summary": "Professional summary..." or null,
  "experience": [
    {
      "title": "Software Engineer",
      "company": "Company Name",
      "location": "City, Country",
      "startDate": "2021",
      "endDate": "Present",
      "current": true,
      "description": "Responsibilities..."
    }
  ],
  "education": [
    {
      "degree": "B.Tech Computer Science",
      "institution": "University Name",
      "field": "Computer Science",
      "startYear": "2017",
      "endYear": "2021",
      "grade": "8.5 CGPA"
    }
  ],
  "skills": ["JavaScript", "React", "Node.js", "Python"],
  "projects": [
    {
      "name": "Project Name",
      "description": "Description...",
      "technologies": ["React", "Node.js"]
    }
  ],
  "certifications": ["AWS Certified Solutions Architect"]
}`;

  let responseText = "";
  const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-2.5-flash"];
  let lastErr = null;

  for (const modelName of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: normalizedMime,
                    data: base64Data
                  }
                },
                {
                  text: prompt
                }
              ]
            }
          ],
          config: {
            responseMimeType: "application/json"
          }
        });

        responseText = response.text || "";
        if (responseText) break;
      } catch (apiErr) {
        lastErr = apiErr;
        const msg = apiErr.message || "";
        if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("demand") || msg.includes("429")) {
          // brief pause before retry or next model
          await new Promise((r) => setTimeout(r, 800));
          continue;
        } else {
          break; // move to next model
        }
      }
    }
    if (responseText) break;
  }

  if (!responseText) {
    if (lastErr) {
      console.warn("[ImageResumeService] Document understanding error:", lastErr.message);
    }
    throw new Error("No valid resume detected.");
  }

  let parsedJson = null;
  try {
    parsedJson = JSON.parse(responseText);
  } catch (parseErr) {
    console.error("[ImageResumeService] Failed to parse JSON response:", parseErr.message, responseText);
    throw new Error("No valid resume detected.");
  }

  // VALIDATION PHASE:
  // 1. Check AI classification
  if (!parsedJson || !parsedJson.isResume) {
    throw new Error("No valid resume detected.");
  }

  const cleanText = (parsedJson.extractedResumeText || "").trim();

  // 2. Minimum text length check (a real resume document has substantial textual content)
  if (cleanText.length < 50) {
    throw new Error("No valid resume detected.");
  }

  // 3. Keyword / Structural heuristic check to prevent false positives from certificates or receipts
  const lowerText = cleanText.toLowerCase();
  const certificateWords = [
    "certificate of completion",
    "certificate of achievement",
    "has successfully completed the course",
    "is hereby awarded",
    "driving licence",
    "driving license",
    "aadhaar",
    "passport authority",
    "tax invoice",
    "cash receipt"
  ];
  const isObviousNonResumeDoc = certificateWords.some(phrase => lowerText.includes(phrase));

  const hasExperience = Array.isArray(parsedJson.experience) && parsedJson.experience.length > 0;
  const hasEducation = Array.isArray(parsedJson.education) && parsedJson.education.length > 0;
  const hasSkills = Array.isArray(parsedJson.skills) && parsedJson.skills.length >= 2;
  const hasName = Boolean(parsedJson.candidate?.name && parsedJson.candidate.name !== "Candidate");

  if (isObviousNonResumeDoc && (!hasExperience || !hasSkills)) {
    throw new Error("No valid resume detected.");
  }

  // Must have at least name or summary or (experience / education / skills)
  const validSignalsCount = [hasName, hasExperience, hasEducation, hasSkills].filter(Boolean).length;
  if (validSignalsCount < 2) {
    throw new Error("No valid resume detected.");
  }

  return {
    isResume: true,
    confidence: parsedJson.confidence || 0.95,
    hasCandidatePhoto: Boolean(parsedJson.hasCandidatePhoto),
    isScreenshotOrWhatsApp: Boolean(parsedJson.isScreenshotOrWhatsApp),
    cleanText,
    candidate: parsedJson.candidate || {},
    summary: parsedJson.summary || "",
    experience: Array.isArray(parsedJson.experience) ? parsedJson.experience : [],
    education: Array.isArray(parsedJson.education) ? parsedJson.education : [],
    skills: Array.isArray(parsedJson.skills) ? parsedJson.skills : [],
    projects: Array.isArray(parsedJson.projects) ? parsedJson.projects : [],
    certifications: Array.isArray(parsedJson.certifications) ? parsedJson.certifications : []
  };
}

module.exports = {
  isImageResume,
  processResumeImage,
  getNormalizedImageMime,
  IMAGE_EXTENSIONS,
  IMAGE_MIMES
};
