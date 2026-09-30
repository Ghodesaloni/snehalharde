/**
 * AI-Powered OCR and Resume Document Validation Engine
 * Uses Gemini Vision (@google/genai) to:
 * 1. Process image resumes (JPG, JPEG, PNG) and image-scanned PDFs via OCR.
 * 2. Discriminate real professional resumes from non-resume images (selfies, photos, logos, WhatsApp screenshots, invoices).
 * 3. Extract purely textual resume content while explicitly ignoring candidate photos, selfies, logos, WhatsApp UI elements, and signatures.
 * 4. Filter out invalid/non-resume files so they are never saved into the database.
 */

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
          "User-Agent": "aistudio-build-ocr"
        }
      }
    });
  }
  return aiClient;
}

// Ordered fallback models for high demand tolerance
const OCR_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest"
];

/**
 * Validates whether text extracted from any document (PDF/DOCX/TXT) represents a real resume
 * @param {string} cleanText
 * @param {string} filename
 * @returns {{ isValid: boolean, reason: string|null }}
 */
function validateTextAsResume(cleanText = "", filename = "") {
  if (!cleanText || typeof cleanText !== "string") {
    return {
      isValid: false,
      reason: `File "${filename || "document"}" contains no readable text content.`
    };
  }

  const trimmed = cleanText.trim();
  const charCount = trimmed.length;
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

  if (charCount < 40 || wordCount < 10) {
    return {
      isValid: false,
      reason: `Document contains insufficient text (${wordCount} words). A valid resume requires structured career or education history.`
    };
  }

  const lower = trimmed.toLowerCase();

  // Explicit non-resume rejection patterns
  const invoicePatterns = /\b(invoice|bill to|tax invoice|subtotal|amount due|payment receipt|gstin|pan no|invoice date|order total)\b/i;
  const receiptPatterns = /\b(receipt #|pos terminal|cashier|cash receipt|merchant copy|cardholder copy)\b/i;
  const chatScreenshotPatterns = /\b(type a message|online|typing\.\.\.|last seen|delivered to|read at|whatsapp audio|whatsapp video)\b/i;

  if (invoicePatterns.test(lower) && !lower.includes("experience") && !lower.includes("education")) {
    return {
      isValid: false,
      reason: "Document detected as an invoice or payment receipt, not a professional resume."
    };
  }

  if (chatScreenshotPatterns.test(lower) && wordCount < 40) {
    return {
      isValid: false,
      reason: "Document contains chat application interface text rather than a resume."
    };
  }

  // Resume signal markers
  const resumeSignals = [
    /\b(experience|employment|work history|professional background|career history)\b/i,
    /\b(education|university|college|bachelor|master|degree|b\.tech|b\.e|diploma|phd|gpa|cgpa)\b/i,
    /\b(skills|technical skills|key skills|technologies|proficiencies|tools)\b/i,
    /\b(projects|academic projects|key achievements|responsibilities)\b/i,
    /\b(certifications|certificate|certified|courses)\b/i,
    /\b(summary|profile|about me|objective|professional summary)\b/i,
    /\b(curriculum vitae|resume|\bcv\b|biodata)\b/i,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i, // Email
    /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}\b/ // Phone
  ];

  let matchedSignals = 0;
  for (const signal of resumeSignals) {
    if (signal.test(lower)) {
      matchedSignals++;
    }
  }

  // A genuine resume usually triggers at least 2 key signals (e.g. skills + education or experience + email)
  if (matchedSignals < 2 && wordCount < 60) {
    return {
      isValid: false,
      reason: "Document does not contain standard resume sections (e.g. experience, education, skills, or contact info)."
    };
  }

  return { isValid: true, reason: null };
}

/**
 * Extracts text and validates an image file (JPG, JPEG, PNG) or flattened PDF using Gemini Vision OCR
 * @param {Buffer} fileBuffer
 * @param {string} mimeType
 * @param {string} filename
 * @returns {Promise<{
 *   isValidResume: boolean,
 *   rejectionReason: string|null,
 *   extractedText: string,
 *   candidateInfo: Object|null,
 *   requiresOcr: boolean
 * }>}
 */
async function processImageOcrAndValidation(fileBuffer, mimeType = "image/png", filename = "resume_image") {
  if (!fileBuffer || fileBuffer.length === 0) {
    return {
      isValidResume: false,
      rejectionReason: "Empty file provided.",
      extractedText: "",
      candidateInfo: null,
      requiresOcr: true
    };
  }

  const ai = getAiClient();
  if (!ai) {
    // If Gemini client not available, perform fallback text check on binary
    const binStr = fileBuffer.toString("utf-8").replace(/[^\x20-\x7E\n\t]/g, " ");
    const textValidation = validateTextAsResume(binStr, filename);
    return {
      isValidResume: textValidation.isValid,
      rejectionReason: textValidation.isValid ? null : "Could not initialize OCR service. " + textValidation.reason,
      extractedText: binStr,
      candidateInfo: null,
      requiresOcr: true
    };
  }

  const base64Data = fileBuffer.toString("base64");
  const normalizedMime = mimeType.toLowerCase().startsWith("image/") 
    ? (mimeType.toLowerCase() === "image/jpg" ? "image/jpeg" : mimeType.toLowerCase())
    : (filename.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");

  const ocrSystemPrompt = `You are an expert AI Resume Screener, Document Validator, and OCR Extraction Engine.
Analyze the provided document or image carefully and determine if it is a genuine professional Resume, Curriculum Vitae (CV), or Career Profile.

STRICT RESUME VALIDATION RULES:
1. REJECT if the image is:
   - A candidate selfie, portrait, headshot, passport photo, or personal picture.
   - A company logo, brand banner, icon, meme, wallpaper, or generic artwork.
   - A WhatsApp or messaging screenshot (chat bubble, status screen, contact card).
   - An invoice, payment receipt, utility bill, restaurant check, or bank slip.
   - An identification card (driver license, Aadhaar, PAN card, passport ID page).
   - A blank, corrupted, or unreadable image.
   If any of the above, set "isValidResume" to false and provide a clear "rejectionReason".

2. ACCEPT only if the image contains a legitimate resume or CV with career history, work experience, education, skills, or qualifications.

3. CONTENT EXTRACTION RULES (When isValidResume is true):
   - Extract ALL readable textual resume content faithfully into "extractedText".
   - IGNORE and DO NOT describe any candidate photographs, selfies, avatars, or physical appearance.
   - IGNORE company logos, graphical watermarks, background patterns, and document borders.
   - IGNORE WhatsApp UI artifacts (e.g. "Type a message", battery percent, status bar icons, time headers).
   - IGNORE digital or handwritten signatures.
   - Extract candidate name, email, phone number, location, target role, education, experience, and skills into the structured fields.

You MUST respond ONLY with a JSON object adhering to this schema:
{
  "isValidResume": true or false,
  "rejectionReason": "string describing why it was rejected, or null if valid",
  "candidateName": "Full Name or null",
  "email": "email@example.com or null",
  "phone": "Phone number or null",
  "location": "City, Country or null",
  "role": "Current or target title or null",
  "skills": ["Skill1", "Skill2"],
  "summary": "Professional summary or null",
  "experience": [
    { "title": "Role", "company": "Company", "duration": "Duration", "description": "Details" }
  ],
  "education": [
    { "degree": "Degree", "institution": "University/School", "year": "Year" }
  ],
  "extractedText": "Complete normalized text of the resume, retaining section headings"
}`;

  let lastError = null;

  for (const model of OCR_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            inlineData: {
              mimeType: normalizedMime,
              data: base64Data
            }
          },
          ocrSystemPrompt
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text?.trim() || "";
      if (responseText) {
        let parsedJson = null;
        try {
          parsedJson = JSON.parse(responseText);
        } catch {
          // Attempt markdown json extraction if wrapped
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedJson = JSON.parse(jsonMatch[0]);
          }
        }

        if (parsedJson && typeof parsedJson.isValidResume === "boolean") {
          return {
            isValidResume: parsedJson.isValidResume,
            rejectionReason: parsedJson.isValidResume ? null : (parsedJson.rejectionReason || "Uploaded file is not a valid professional resume."),
            extractedText: parsedJson.extractedText || "",
            candidateInfo: parsedJson,
            requiresOcr: true
          };
        }
      }
    } catch (err) {
      console.warn(`[OCR] Model ${model} failed for ${filename}:`, err.message);
      lastError = err;
    }
  }

  // If AI OCR service is completely unavailable, make a conservative heuristic decision
  console.error(`[OCR] All models failed for ${filename}:`, lastError?.message);
  return {
    isValidResume: false,
    rejectionReason: `Could not verify document content via OCR (${lastError?.message || "Service unavailable"}). Please try uploading a PDF or DOCX file.`,
    extractedText: "",
    candidateInfo: null,
    requiresOcr: true
  };
}

module.exports = {
  validateTextAsResume,
  processImageOcrAndValidation,
  getAiClient
};
