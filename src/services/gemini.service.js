const { GoogleGenerativeAI } = require("@google/generative-ai");
const NodeCache = require("node-cache");

// --- Configuration ---
const API_KEY = 'AQ.Ab8RN6LbW75NQrhARsW5zywmousVGOs9S3VxH0L95vS_SMP3wQ';
if (!API_KEY) throw new Error("GEMINI_API_KEY is missing");

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS, 10) || 3600;
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES, 10) || 2;
const RETRY_DELAY = parseInt(process.env.RETRY_DELAY_MS, 10) || 1000;

// --- Initialize clients ---
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

// --- Cache instance ---
const cache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: 120,
});

// --- Helper: cache key ---
function _cacheKey(prompt, params = {}) {
  return `${prompt.trim()}:${JSON.stringify(params)}`;
}

// --- Helper: extract JSON from text (handles markdown) ---
function _extractJSON(text) {
  try {
    const jsonMatch = text.match(/\{.*\}/s) || text.match(/\[.*\]/s);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return null;
  } catch {
    return null;
  }
}

// --- Core function with caching & retries ---
async function generateContent(prompt, params = {}, parseJson = true) {
  const cacheKey = _cacheKey(prompt, params);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const generationConfig = {
        temperature: 0.2,
        maxOutputTokens: 2048, // Increased to prevent truncation on long outputs
      };

      // Force Gemini to respond strictly in JSON format if requested
      if (parseJson) {
        generationConfig.responseMimeType = "application/json";
      }

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });

      const text = await result.response.text();

      let parsed = text;
      if (parseJson) {
        parsed = _extractJSON(text);
        if (!parsed) {
          parsed = { raw: text.trim() }; // fallback
        }
      }

      cache.set(cacheKey, parsed);
      return parsed;
    } catch (error) {
      lastError = error;
      console.warn(`AI call attempt ${attempt} failed: ${error.message}`);
      if (attempt <= MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error(
    `AI service failed after ${MAX_RETRIES + 1} attempts: ${lastError.message}`,
  );
}

// --- Robust JSON Cleaner ---
function _extractJSON(text) {
  try {
    // 1. Direct parse attempt
    return JSON.parse(text);
  } catch {
    try {
      // 2. Strip markdown triple backticks (e.g. ```json ... ```)
      const cleanedText = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(cleanedText);
    } catch {
      // 3. Regex fallback to isolate JSON arrays or objects non-greedily
      const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }
}

// --- Expose only the main function ---
module.exports = { generateContent };
