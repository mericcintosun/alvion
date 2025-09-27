import express from "express";
import cors from "cors";
import { config } from "./utils/config.js";
import { generateText, streamText } from "./services/geminiService.js";

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

const DEFAULT_SYSTEM = `You are an Algorand/DeFi savvy assistant. You help users understand Algorand blockchain, smart contracts, NFTs, tokens, and DeFi concepts. Be factual, concise, and helpful. When users ask about Algorand-specific features, provide accurate technical details.`;

// health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// non-stream
app.post("/api/chat", async (req, res) => {
  try {
    const { message, system = DEFAULT_SYSTEM } = req.body;
    const text = await generateText({ prompt: message, system });
    res.json({ text });
  } catch (e) {
    console.error("Chat error:", e);
    res.status(500).json({ error: String(e.message || e) });
  }
});

// SSE stream
app.post("/api/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const { message, system = DEFAULT_SYSTEM } = req.body || {};
  try {
    for await (const delta of streamText({ prompt: message, system })) {
      res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }
  } catch (e) {
    console.error("Stream error:", e);
    res.write(`data: ${JSON.stringify({ error: String(e.message || e) })}\n\n`);
  } finally {
    res.end();
  }
});

app.listen(config.port, () => console.log(`🚀 Gemini API listening on http://localhost:${config.port}`));
