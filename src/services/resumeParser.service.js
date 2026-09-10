const { GoogleGenAI, Type } = require("@google/genai");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse-fixed");

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Utility helper to sleep/delay execution
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Strips markdown code blocks and safely parses JSON
 */
function cleanAndParseJson(rawText) {
  if (!rawText) return {};

  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  try {
    return JSON.parse(cleaned);
  } catch (parseError) {
    console.error(
      "❌ Invalid JSON snippet outputted by AI:",
      cleaned.slice(0, 300),
    );
    throw new Error(
      "AI output was interrupted or incorrectly formatted. Please retry.",
    );
  }
}

/**
 * Extracts raw text from document buffer.
 */
async function extractTextFromBuffer(buffer, mimeType) {
  try {
    if (mimeType === "application/pdf") {
      const parsed = await pdfParse(buffer);
      const extractedText = (parsed.text || "").trim();

      console.log(
        `📄 Extracted text length: ${extractedText.length} characters`,
      );

      if (extractedText.length < 50) {
        console.warn(
          "⚠️ PDF appears to be scanned/image-based. Switching to Gemini Vision mode.",
        );
        return { isBuffer: true, buffer, mimeType };
      }

      return { isBuffer: false, text: extractedText };
    }

    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return { isBuffer: false, text: (result.value || "").trim() };
    }

    throw new Error("Unsupported file format.");
  } catch (error) {
    throw new Error(`Failed to process document: ${error.message}`);
  }
}

/**
 * Executes generateContent API call with automated retry & fallback logic.
 * Note: responseSchema is omitted to prevent structural truncation on large sub-arrays.
 */
async function generateContentWithRetry(parts, primaryModel, maxTokens = 8192) {
  const maxRetries = parseInt(process.env.MAX_RETRIES || "2", 10);
  const baseDelay = parseInt(process.env.RETRY_DELAY_MS || "1000", 10);
  const fallbackModel = "gemini-1.5-flash";

  let currentModel = primaryModel;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: [{ role: "user", parts }],
        config: {
          responseMimeType: "application/json",
          temperature: 0.0,
          maxOutputTokens: maxTokens,
        },
      });

      return response;
    } catch (error) {
      const is503 =
        error?.status === 503 ||
        error?.toString().includes("503") ||
        error?.toString().includes("UNAVAILABLE");

      console.warn(
        `⚠️ Gemini API call failed on ${currentModel} (Attempt ${attempt}/${maxRetries + 1}): ${error.message}`,
      );

      if (attempt <= maxRetries && is503) {
        const waitTime = baseDelay * Math.pow(2, attempt - 1);
        console.log(`🔄 Retrying in ${waitTime}ms...`);
        await delay(waitTime);
      } else if (attempt > maxRetries && currentModel !== fallbackModel) {
        console.warn(`⚠️ Switching fallback model to ${fallbackModel}...`);
        currentModel = fallbackModel;
        attempt = 0;
        await delay(500);
      } else {
        throw error;
      }
    }
  }
}

/**
 * Parses resume data into full JSON structure via Gemini with schema instruction guidance
 */
async function parseResumeData(inputData) {
  const primaryModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  let parts = [];
  const maxTokens = 8192;

  const systemInstruction = `
You are an expert ATS resume parser. Extract ALL profile information from the resume text into a valid JSON object matching this exact structure:
{
  "personal": { "firstName": "", "lastName": "", "jobTitle": "", "dateOfBirth": "", "gender": "", "nationality": "" },
  "summary": { "professionalSummary": "" },
  "contact": { "email": "", "mobile": "", "address": "", "city": "", "state": "", "country": "" },
  "social": { "linkedInUrl": "", "gitHubUrl": "", "portfolioUrl": "" },
  "skills": [ { "skillName": "", "proficiency": "" } ],
  "educations": [ { "instituteName": "", "degree": "", "fieldOfStudy": "", "startDate": "", "endDate": "" } ],
  "experiences": [ { "companyName": "", "designation": "", "startDate": "", "endDate": "", "isCurrentCompany": false, "description": "" } ],
  "projects": [ { "projectName": "", "companyName": "", "role": "", "description": "" } ],
  "certificates": [ { "certificateName": "", "issuedBy": "" } ],
  "languages": [ { "languageName": "" } ]
}
- Handle non-standard section headers intelligently (e.g., "Work History" -> experiences, "Academics" -> educations).
- Do NOT truncate arrays or skip entries. Extract every single job, project, skill, and educational qualification found in the text.
- Convert ALL dates to YYYY-MM-DD format. If only a year is provided, map to YYYY-01-01.
- Omit empty properties or arrays if data is completely missing. Return valid JSON only.
`;

  if (inputData.isBuffer) {
    parts = [
      {
        inlineData: {
          data: inputData.buffer.toString("base64"),
          mimeType: inputData.mimeType,
        },
      },
      { text: systemInstruction },
    ];
  } else {
    const cleanedText = inputData.text.slice(0, 15000);
    parts = [{ text: `${systemInstruction}\n\nResume Text:\n${cleanedText}` }];
  }

  const response = await generateContentWithRetry(
    parts,
    primaryModel,
    maxTokens,
  );
  return cleanAndParseJson(response.text);
}

module.exports = {
  extractTextFromBuffer,
  parseResumeData,
};
