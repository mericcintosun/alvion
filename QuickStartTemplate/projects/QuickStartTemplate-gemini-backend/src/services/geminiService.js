import { GoogleGenAI } from "@google/genai";
import { config } from "../utils/config.js";

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

export async function generateText({ prompt, system }) {
  const res = await ai.models.generateContent({
    model: config.gemini.model,
    contents: prompt, // string accepted
    config: {
      systemInstruction: system,
      temperature: config.gemini.temperature,
      maxOutputTokens: config.gemini.maxOutputTokens,
      responseMimeType: "text/plain",
    },
  });
  return res.text;
}

export async function* streamText({ prompt, system }) {
  const stream = await ai.models.generateContentStream({
    model: config.gemini.model,
    contents: prompt,
    config: {
      systemInstruction: system,
      temperature: config.gemini.temperature,
      maxOutputTokens: config.gemini.maxOutputTokens,
      responseMimeType: "text/plain",
    },
  });
  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text;
  }
}
