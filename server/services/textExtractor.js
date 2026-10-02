/**
 * Production Resume Text Extractor
 * Handles PDF (pdf-parse v1/v2), DOCX (mammoth), TXT, and RTF files.
 * Performs deep text cleaning, layout/whitespace normalization, and detects scanned/image PDFs requiring OCR.
 */

const mammoth = require("mammoth");
let pdfParseModule = null;
try {
  pdfParseModule = require("pdf-parse");
} catch (e) {
  console.warn("[TextExtractor] pdf-parse import warning:", e.message);
}

/**
 * Cleans and normalizes extracted resume text
 * - Normalizes unicode bullets (•, ▪, ●, ✦, ★, ✓) to standard list markers
 * - Normalizes dashes and hyphens (–, —)
 * - Removes excessive blank lines, null bytes, and non-printable control characters
 * - Preserves structural line breaks for section detection
 */
function cleanExtractedText(raw = "") {
  if (!raw || typeof raw !== "string") return "";

  let cleaned = raw
    // Remove null bytes and non-printable control characters (except tabs and newlines)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    // Normalize bullet points to a standard marker
    .replace(/[•▪●✦★✓►❖■]/g, "\n* ")
    // Normalize em-dash, en-dash, minus
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    // Normalize curly quotes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Normalize tabs and multiple horizontal spaces
    .replace(/[ \t]+/g, " ")
    // Normalize Windows line endings
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Clean excessive empty lines (more than 2 consecutive)
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();

  return cleaned;
}

/**
 * Extracts raw text from file buffer based on MIME type or filename
 * @param {Buffer} fileBuffer
 * @param {string} mimeType
 * @param {string} filename
 * @returns {Promise<{ text: string, cleanText: string, requiresOcr: boolean, ocrWarning: string|null, fileType: string }>}
 */
async function extractResumeText(fileBuffer, mimeType = "", filename = "") {
  if (!fileBuffer || fileBuffer.length === 0) {
    return {
      text: "",
      cleanText: "",
      requiresOcr: false,
      ocrWarning: "Empty file uploaded.",
      fileType: "unknown"
    };
  }

  const ext = (filename.match(/\.[^.]+$/)?.[0] || "").toLowerCase();
  const mime = (mimeType || "").toLowerCase();

  let extractedRaw = "";
  let fileType = "txt";

  const isPdf = ext === ".pdf" || mime === "application/pdf";
  const isDocx = ext === ".docx" || mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const isDoc = ext === ".doc" || mime === "application/msword";

  if (isPdf) {
    fileType = "pdf";
    try {
      if (pdfParseModule) {
        if (typeof pdfParseModule === "function") {
          // v1 pdf-parse
          const data = await pdfParseModule(fileBuffer);
          extractedRaw = data.text || "";
        } else if (pdfParseModule.PDFParse) {
          // v2 pdf-parse
          const parser = new pdfParseModule.PDFParse({ data: fileBuffer });
          await parser.load();
          const res = await parser.getText();
          await parser.destroy().catch(() => {});
          extractedRaw = typeof res === "string" ? res : (res?.text || "");
        }
      }
    } catch (pdfErr) {
      console.warn(`[TextExtractor] pdf-parse failed for ${filename}:`, pdfErr.message);
      // Fallback: search for UTF-8 and ASCII text streams in the raw buffer
      extractedRaw = fileBuffer.toString("utf-8").replace(/[^\x20-\x7E\n\t]/g, " ");
    }
  } else if (isDocx) {
    fileType = "docx";
    try {
      const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
      extractedRaw = docxResult.value || "";
    } catch (docxErr) {
      console.warn(`[TextExtractor] mammoth docx extraction failed for ${filename}:`, docxErr.message);
      extractedRaw = fileBuffer.toString("utf-8").replace(/[^\x20-\x7E\n\t]/g, " ");
    }
  } else if (isDoc) {
    fileType = "doc";
    // Word 97-2003 binary format: extract printable strings
    extractedRaw = fileBuffer
      .toString("binary")
      .replace(/[^\x20-\x7E\n\t]/g, " ")
      .replace(/\s{3,}/g, "\n");
  } else {
    // Plain text or RTF
    fileType = "txt";
    const textStr = fileBuffer.toString("utf-8");
    if (textStr.startsWith("{\\rtf")) {
      fileType = "rtf";
      // Strip simple RTF control tags
      extractedRaw = textStr
        .replace(/\\par[d]?/g, "\n")
        .replace(/\\[a-zA-Z0-9]+(?:\s|-?[0-9]+)?/g, "")
        .replace(/[{}]/g, "");
    } else {
      extractedRaw = textStr;
    }
  }

  const cleanText = cleanExtractedText(extractedRaw);

  // Check for scanned / image PDF with insufficient text
  // If a document has less than 40 alphanumeric characters, it is virtually certain to be scanned/image-based
  const alphaNumericCharCount = (cleanText.match(/[a-zA-Z0-9]/g) || []).length;
  let requiresOcr = false;
  let ocrWarning = null;

  if (isPdf && alphaNumericCharCount < 50) {
    requiresOcr = true;
    ocrWarning = "Scanned image or flattened PDF detected. The document contains insufficient text streams and requires OCR for complete data extraction.";
  } else if (alphaNumericCharCount < 30) {
    requiresOcr = true;
    ocrWarning = "Insufficient text detected in uploaded resume file.";
  }

  return {
    text: extractedRaw,
    cleanText,
    requiresOcr,
    ocrWarning,
    fileType,
    charCount: cleanText.length,
    wordCount: cleanText.split(/\s+/).filter(Boolean).length
  };
}

module.exports = {
  cleanExtractedText,
  extractResumeText
};
