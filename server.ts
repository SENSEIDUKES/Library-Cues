import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Simple in-memory cache for API results to save credits
interface CachedAudio {
  audioBase64: string;
  mimeType: string;
  timestamp: number;
}
const audioCache = new Map<string, CachedAudio>();

// Configuration helper for secrets
const config = {
  get elevenLabsApiKey() {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) {
      throw new Error("ELEVENLABS_API_KEY environment variable is required to generate sound effects. Please add it to your secrets.");
    }
    return key;
  }
};

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, durationSeconds, promptInfluence, loop } = req.body;

    // Generate a unique cache key based on the exact parameters
    const cacheKey = crypto
      .createHash("sha256")
      .update(JSON.stringify({ prompt, durationSeconds, promptInfluence, loop }))
      .digest("hex");

    if (audioCache.has(cacheKey)) {
      console.log(`Cache hit for prompt: "${prompt}" (Parameters matched exactly)`);
      const cached = audioCache.get(cacheKey)!;
      res.json({ audioBase64: cached.audioBase64, mimeType: cached.mimeType });
      return;
    }

    const apiKey = config.elevenLabsApiKey;

    console.log(`Generating sound with ElevenLabs: "${prompt}" (${durationSeconds}s, loop: ${loop})`);

    const response = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: prompt,
        duration_seconds: durationSeconds,
        prompt_influence: promptInfluence,
        loop: loop
      }),
    });

    if (!response.ok) {
      const errResponseText = await response.text();
      throw new Error(`ElevenLabs API returned ${response.status}: ${errResponseText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = response.headers.get("content-type") || "audio/mpeg";

    // Save to cache (limit size to 50 items to prevent memory leaks)
    audioCache.set(cacheKey, { audioBase64, mimeType, timestamp: Date.now() });
    if (audioCache.size > 50) {
      const oldestKey = Array.from(audioCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      audioCache.delete(oldestKey);
    }

    res.json({ audioBase64, mimeType });
  } catch (error: any) {
    console.error("Error generating sound:", error);
    res.status(500).json({ error: error.message || "Failed to generate sound" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
