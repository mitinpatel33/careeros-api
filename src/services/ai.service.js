const { GoogleGenAI, Type } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Main model first; the fallback is used when the main one is overloaded (503)
const MODELS = [
  process.env.GEMINI_MODEL || "gemini-3.6-flash",
  process.env.GEMINI_FALLBACK_MODEL || "gemini-3.6-flash-extended",
];
const TIMEOUT_MS = 25_000;
const ATTEMPTS_PER_MODEL = 2;

const safe = (v) =>
  String(v ?? "")
    .replace(/["`\\\n\r]/g, " ")
    .trim()
    .slice(0, 80);
const isText = (v) => typeof v === "string" && v.trim().length > 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ctx = { title, categoryName, kind: "professional" | "student" }
const audience = ({ title, categoryName, kind }) =>
  kind === "student"
    ? `a student preparing for "${safe(title)}" (${safe(categoryName)}). Questions should look like exam, viva, entrance-test or class-test questions for that level, not job interview questions.`
    : `a candidate interviewing for the role "${safe(title)}" (${safe(categoryName || "general")}). Questions should look like real job interview questions.`;

const unit = (kind) => (kind === "student" ? "subject or topic" : "skill");

const normalize = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
/* ---------------- Gemini call with retry + model fallback ---------------- */

// Temporary problems worth retrying: overload, rate limit, server error, timeout, network
const isRetryable = (e) =>
  [429, 500, 502, 503, 504].includes(e?.status) ||
  /timed out|fetch failed|ECONNRESET|ETIMEDOUT|UNAVAILABLE/i.test(
    e?.message || "",
  );

async function callModel(model, prompt, responseSchema) {
  let timer;
  try {
    const response = await Promise.race([
      ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.7,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("AI request timed out")),
          TIMEOUT_MS,
        );
      }),
    ]);
    return JSON.parse(response.text);
  } finally {
    clearTimeout(timer);
  }
}

async function generateJSON(prompt, responseSchema) {
  let lastError;
  for (const model of [...new Set(MODELS)]) {
    for (let attempt = 0; attempt < ATTEMPTS_PER_MODEL; attempt++) {
      try {
        return await callModel(model, prompt, responseSchema);
      } catch (error) {
        lastError = error;
        // Bad API key / bad request etc. will not fix themselves, so fail fast
        if (!isRetryable(error) && !(error instanceof SyntaxError)) throw error;

        console.warn(
          `AI ${model} attempt ${attempt + 1}/${ATTEMPTS_PER_MODEL} failed:`,
          error.status || "",
          String(error.message).slice(0, 80),
        );
        if (attempt < ATTEMPTS_PER_MODEL - 1) {
          await sleep(800 * 2 ** attempt + Math.random() * 400);
        }
      }
    }
  }
  throw lastError;
}

/* Skills / subjects for any role or course */
const skillsSchema = { type: Type.ARRAY, items: { type: Type.STRING } };

exports.generateSkillsAI = async (ctx) => {
  const prompt = `List 10 to 12 of the most important ${unit(ctx.kind)}s to practice for ${audience(ctx)} Return only short names (1-3 words each, no numbering).`;
  const raw = await generateJSON(prompt, skillsSchema);
  const names = [
    ...new Set(
      (Array.isArray(raw) ? raw : [])
        .map((s) => String(s).trim())
        .filter(Boolean),
    ),
  ];
  if (!names.length) throw new Error("AI returned no skills");
  return names.slice(0, 12);
};

/* Q&A */
const questionsSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING },
      answer: { type: Type.STRING },
      explanationWithExample: { type: Type.STRING },
    },
    required: ["question", "answer", "explanationWithExample"],
  },
};

exports.generateInterviewQuestionsAI = async (
  ctx,
  skillName,
  difficulty,
  avoid = [],
) => {
  const avoidBlock = avoid.length
    ? `\nDo NOT repeat or rephrase any of these existing questions:\n${avoid
        .slice(0, 40)
        .map((q) => `- ${String(q).replace(/\s+/g, " ").slice(0, 150)}`)
        .join(
          "\n",
        )}\nCover different sub-topics and angles than the ones above.`
    : "";

  const prompt = `Generate 5 high-quality practice questions for ${audience(ctx)} Focus on the ${unit(ctx.kind)} "${safe(skillName)}" at a "${safe(difficulty)}" level. Each item needs the question, a model answer, and an explanation with a short example.${avoidBlock}`;

  const raw = await generateJSON(prompt, questionsSchema);

  // drop unusable items and duplicates inside the same batch
  const seen = new Set(avoid.map(normalize));
  const items = [];
  for (const q of Array.isArray(raw) ? raw : []) {
    if (!isText(q?.question) || !isText(q?.answer)) continue;
    const key = normalize(q.question);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(q);
  }
  if (!items.length) throw new Error("AI returned no new questions");
  return items;
};

/* Mock test */
const mockTestSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionText: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswer: { type: Type.STRING },
          explanation: { type: Type.STRING },
        },
        required: ["questionText", "options", "correctAnswer", "explanation"],
      },
    },
  },
  required: ["title", "questions"],
};

exports.generateMockTestAI = async (ctx, skillName, difficulty) => {
  const topic = skillName
    ? `the ${unit(ctx.kind)} "${safe(skillName)}"`
    : "the most important areas";
  const prompt = `Create a 5-question multiple choice mock test for ${audience(ctx)} Cover ${topic} at "${safe(difficulty)}" difficulty. Each question has exactly 4 options and correctAnswer must be identical to one option.`;
  const raw = await generateJSON(prompt, mockTestSchema);
  const questions = (Array.isArray(raw?.questions) ? raw.questions : []).filter(
    (q) =>
      isText(q?.questionText) &&
      Array.isArray(q.options) &&
      q.options.length >= 2 &&
      q.options.includes(q.correctAnswer),
  );
  if (!questions.length) throw new Error("AI returned no usable mock test");
  return { title: isText(raw.title) ? raw.title.trim() : "", questions };
};
