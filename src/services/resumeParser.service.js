const { GoogleGenAI, Type } = require("@google/genai");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse-fixed");

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Compact JSON Schema for response execution
const fastResumeSchema = {
  type: Type.OBJECT,
  properties: {
    personal: {
      type: Type.OBJECT,
      properties: {
        firstName: { type: Type.STRING },
        lastName: { type: Type.STRING },
        jobTitle: { type: Type.STRING },
        dateOfBirth: { type: Type.STRING },
        gender: { type: Type.STRING },
        nationality: { type: Type.STRING },
      },
    },
    summary: {
      type: Type.OBJECT,
      properties: {
        professionalSummary: { type: Type.STRING },
      },
    },
    contact: {
      type: Type.OBJECT,
      properties: {
        email: { type: Type.STRING },
        mobile: { type: Type.STRING },
        address: { type: Type.STRING },
        city: { type: Type.STRING },
        state: { type: Type.STRING },
        country: { type: Type.STRING },
      },
    },
    social: {
      type: Type.OBJECT,
      properties: {
        linkedInUrl: { type: Type.STRING },
        gitHubUrl: { type: Type.STRING },
        portfolioUrl: { type: Type.STRING },
      },
    },
    skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          skillName: { type: Type.STRING },
          proficiency: { type: Type.STRING },
        },
      },
    },
    educations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          instituteName: { type: Type.STRING },
          degree: { type: Type.STRING },
          fieldOfStudy: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
        },
      },
    },
    experiences: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          companyName: { type: Type.STRING },
          designation: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
          isCurrentCompany: { type: Type.BOOLEAN },
          description: { type: Type.STRING },
        },
      },
    },
    projects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          projectName: { type: Type.STRING },
          role: { type: Type.STRING },
          description: { type: Type.STRING },
        },
      },
    },
    certificates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          certificateName: { type: Type.STRING },
          issuedBy: { type: Type.STRING },
        },
      },
    },
    languages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          languageName: { type: Type.STRING },
        },
      },
    },
  },
};

/**
 * Utility helper to sleep/delay execution
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Strips markdown code blocks and safely parses JSON
 */
function cleanAndParseJson(rawText) {
  if (!rawText) return {};

  // Remove markdown code blocks if Gemini returns string wrapped in ```json ... ```
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
 * Returns raw text string if text-based, or original Buffer if scanned PDF.
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
 * Executes generateContent API call with automated retry & fallback logic
 */
async function generateContentWithRetry(parts, primaryModel, maxTokens = 2048) {
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
          responseSchema: fastResumeSchema,
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
 * Parses resume data into JSON structure via Gemini
 */
async function parseResumeData(inputData) {
  const primaryModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  let parts = [];
  let maxTokens = 2048; // Default output token size

  const systemInstruction =
    "Extract structured profile information from this resume into JSON strictly following the schema. Convert ALL dates to YYYY-MM-DD format (e.g., '12th Sep 1996' becomes '1996-09-12'). Keep description fields concise (max 1 sentence per entry). Omit empty attributes.";

  if (inputData.isBuffer) {
    // Increase token cap to 4096 for vision mode to prevent response truncation
    maxTokens = 4096;
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
    const cleanedText = inputData.text.slice(0, 8000);
    parts = [
      {
        text: `${systemInstruction}\n\nResume Text:\n${cleanedText}`,
      },
    ];
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
