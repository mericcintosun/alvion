import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3001),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  geminiApiKey: process.env.GEMINI_API_KEY,
  gemini: {
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    temperature: Number(process.env.TEMPERATURE ?? 0.7),
    maxOutputTokens: Number(process.env.MAX_TOKENS ?? 2048),
  },
};

if (!config.geminiApiKey) {
  console.warn("⚠️ GEMINI_API_KEY missing");
}
