const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Helper to extract JSON from text (Gemini may wrap in markdown)
const extractJSON = (text) => {
  try {
    const jsonMatch = text.match(/\{.*\}/s) || text.match(/\[.*\]/s);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return null;
  } catch {
    return null;
  }
};

exports.generateSummary = async (req, res) => {
  const { jobTitle, skills, experience } = req.body;
  const skillList = skills?.map((s) => s.skillName).join(", ") || "";
  const expYears = experience?.length || 0;

  const prompt = `
      You are a career coach. Based on the following details:
      Job Title: ${jobTitle || "Software Developer"}
      Skills: ${skillList}
      Years of Experience: ${expYears}

      Write a concise professional summary (3‑4 sentences) and a career objective (2‑3 sentences).
      Return the result in the following JSON format:
      {
        'professionalSummary': '...',
        'careerObjective': '...'
      }
    `;

  const result = await model.generateContent(prompt);
  const text = await result.response.text();
  const parsed = extractJSON(text);

  //parse the json from the response (Gemini may wrap in markdown)
  if (parsed && parsed.professionalSummary) {
    res.json(parsed);
  } else {
    // fallback: return raw text as summary
    res.json({ professionalSummary: text.trim(), careerObjective: "" });
  }
};

exports.suggestSkills = async (req, res) => {
  const { jobTitle } = req.body;
  const prompt = `
      List top 10 technical skills for a ${jobTitle || "Software Developer"}.
      Return as a JSON array of strings, e.g. ['React', 'Node.js', 'Python'].
      Only return the JSON array, no extra text.
    `;
  const result = await model.generateContent(prompt);
  const text = await result.response.text();
  const parsed = extractJSON(text);
  if (Array.isArray(parsed)) {
    res.json(parsed);
  } else {
    // fallback: split by commas
    const skills = text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    res.json(skills);
  }
};

exports.enhanceDescription = async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Description text is required" });
  }

  const prompt = `
      Improve the following description for a resume bullet point.
      Make it more impactful, professional, and quantifiable if possible.
      Return only the improved text, no extra commentary.
      Input: '${text}'
    `;

  const result = await model.generateContent(prompt);
  const enhanced = await result.response.text();
  res.json({ enhanced: enhanced.trim() });
};

exports.suggestSocial = async (req, res) => {
  const { jobTitle } = req.body;
  const prompt = `
      For a ${jobTitle || "Software Developer"}, suggest typical professional social/profile URLs.
      Return as JSON with keys: linkedInUrl, gitHubUrl, portfolioUrl, websiteUrl, twitterUrl, stackOverflowUrl, leetCodeUrl.
      If a platform is not relevant, leave it empty string.
      Example: { 'linkedInUrl': 'https://linkedin.com/in/username', ... }
    `;

  const result = await model.generateContent(prompt);
  const text = await result.response.text();
  const parsed = extractJSON(text);

  if (parsed && typeof parsed === "object") {
    res.json(parsed);
  } else {
    // fallback with empty values
    res.json({
      linkedInUrl: "",
      gitHubUrl: "",
      portfolioUrl: "",
      websiteUrl: "",
      twitterUrl: "",
      stackOverflowUrl: "",
      leetCodeUrl: "",
    });
  }
};

exports.suggestCertificate = async (req, res) => {
  const { jobTitle, skills } = req.body;
  const skillList = skills?.map((s) => s.skillName).join(", ") || "";

  const prompt = `
      For a ${jobTitle || "Software Developer"} with skills in ${skillList},
      suggest 5 relevant professional certifications (e.g., AWS Certified, Scrum Master, etc.).
      Return as a JSON array of objects with fields: certificateName, issuedBy.
      Example: [{'certificateName': 'AWS Certified Developer', 'issuedBy': 'Amazon'}]
    `;

  const result = await model.generateContent(prompt);
  const text = await result.response.text();
  const parsed = extractJSON(text);

  if (Array.isArray(parsed)) {
    res.json(parsed);
  } else {
    res.json([]);
  }
};
