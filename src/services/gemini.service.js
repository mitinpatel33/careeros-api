const { GoogleGenAI } = require("@google/genai");
const NodeCache = require("node-cache");

// --- Configuration ---
const API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6Lp8jN1lw0obnekUMFyGZpoaJNYKg9e3q4SSVvWdBO4Dw';
if (!API_KEY) throw new Error("GEMINI_API_KEY is missing from environment variables");

// Clean model string (trims accidental inline comments or spaces)
const MODEL_NAME = (process.env.GEMINI_MODEL || "gemini-3.5-flash").split(" ")[0].trim();
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS, 10) || 3600;
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES, 10) || 2;
const RETRY_DELAY = parseInt(process.env.RETRY_DELAY_MS, 10) || 1000;

// --- Initialize Client ---
const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Cache instance ---
const cache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: 120,
});

function _cacheKey(prompt, params = {}) {
  return `${prompt.trim()}:${JSON.stringify(params)}`;
}

function _extractJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    try {
      const cleanedText = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(cleanedText);
    } catch {
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

async function generateContent(prompt, params = {}, parseJson = true) {
  const cacheKey = _cacheKey(prompt, params);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const config = {
        temperature: 0.2,
        maxOutputTokens: 2048,
      };

      if (parseJson) {
        config.responseMimeType = "application/json";
      }

      // Modern API Call using @google/genai
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: config,
      });

      const text = response.text;

      let parsed = text;
      if (parseJson) {
        parsed = _extractJSON(text);
        if (!parsed) {
          parsed = { raw: text ? text.trim() : "" };
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

  const customError = new Error(
    `AI service failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message || "Unknown error"}`
  );
  customError.statusCode = 500;
  throw customError;
}

module.exports = { generateContent };