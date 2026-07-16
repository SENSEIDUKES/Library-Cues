import express from "express";
import crypto from "crypto";
import dotenv from "dotenv";
import { spawn } from "child_process";

// Vite loads client-side env files itself, but this Express server does not.
// Load local overrides first while leaving deployed environment variables intact.
dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ path: ".env", quiet: true });

const SOUND_GENERATION_MIN_DURATION_SECONDS = 0.5;
const SOUND_GENERATION_MAX_DURATION_SECONDS = 30;
const SOUND_GENERATION_TIMEOUT_MS = 90_000;

class RequestError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
  }
}

function validateGenerationRequest(body: unknown) {
  const request = body as Record<string, unknown>;
  const prompt = typeof request.prompt === "string" ? request.prompt.trim() : "";
  const durationSeconds = Number(request.durationSeconds);
  const promptInfluence = Number(request.promptInfluence);
  const elevenLabsApiKey = typeof request.elevenLabsApiKey === "string"
    ? request.elevenLabsApiKey.trim()
    : undefined;

  if (!prompt) throw new RequestError("Enter a sound description before generating.", 400);
  if (!Number.isFinite(durationSeconds) || durationSeconds < SOUND_GENERATION_MIN_DURATION_SECONDS || durationSeconds > SOUND_GENERATION_MAX_DURATION_SECONDS) {
    throw new RequestError(`Duration must be between ${SOUND_GENERATION_MIN_DURATION_SECONDS} and ${SOUND_GENERATION_MAX_DURATION_SECONDS} seconds.`, 400);
  }
  if (!Number.isFinite(promptInfluence) || promptInfluence < 0 || promptInfluence > 1) {
    throw new RequestError("Prompt influence must be between 0 and 1.", 400);
  }

  return {
    prompt,
    durationSeconds,
    promptInfluence,
    loop: Boolean(request.loop),
    useCache: Boolean(request.useCache),
    trimSilence: Boolean(request.trimSilence),
    normalizeLoudness: Boolean(request.normalizeLoudness),
    fadeIn: Number(request.fadeIn) || 0,
    fadeOut: Number(request.fadeOut) || 0,
    elevenLabsApiKey: elevenLabsApiKey || undefined,
  };
}

async function trimSilenceWithFFmpeg(audioBuffer: Buffer, mimeType: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let format = "mp3";
    if (mimeType.includes("wav")) format = "wav";
    else if (mimeType.includes("ogg")) format = "ogg";
    else if (mimeType.includes("aac")) format = "adts";

    const ffmpeg = spawn("ffmpeg", [
      "-i", "pipe:0",
      "-af", "silenceremove=start_periods=1:start_duration=0.01:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_duration=0.01:start_threshold=-50dB,areverse",
      "-f", format,
      "pipe:1"
    ]);

    const chunks: Buffer[] = [];
    ffmpeg.stdout.on("data", (chunk) => chunks.push(chunk));
    
    let errOutput = "";
    ffmpeg.stderr.on("data", (data) => {
      errOutput += data.toString();
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`ffmpeg exited with code ${code}\n${errOutput}`));
      }
    });

    ffmpeg.stdin.write(audioBuffer);
    ffmpeg.stdin.end();
  });
}

async function normalizeLoudnessWithFFmpeg(audioBuffer: Buffer, mimeType: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let format = "mp3";
    if (mimeType.includes("wav")) format = "wav";
    else if (mimeType.includes("ogg")) format = "ogg";
    else if (mimeType.includes("aac")) format = "adts";

    const ffmpeg = spawn("ffmpeg", [
      "-i", "pipe:0",
      "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
      "-f", format,
      "pipe:1"
    ]);

    const chunks: Buffer[] = [];
    ffmpeg.stdout.on("data", (chunk) => chunks.push(chunk));
    
    let errOutput = "";
    ffmpeg.stderr.on("data", (data) => {
      errOutput += data.toString();
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`ffmpeg exited with code ${code}\n${errOutput}`));
      }
    });

    ffmpeg.stdin.write(audioBuffer);
    ffmpeg.stdin.end();
  });
}

async function fadeAudioWithFFmpeg(audioBuffer: Buffer, mimeType: string, fadeIn: number, fadeOut: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let format = "mp3";
    if (mimeType.includes("wav")) format = "wav";
    else if (mimeType.includes("ogg")) format = "ogg";
    else if (mimeType.includes("aac")) format = "adts";

    const filters: string[] = [];
    if (fadeIn > 0) {
      filters.push(`afade=t=in:d=${fadeIn}`);
    }
    if (fadeOut > 0) {
      filters.push(`areverse`, `afade=t=in:d=${fadeOut}`, `areverse`);
    }

    const args = ["-i", "pipe:0"];
    if (filters.length > 0) {
      args.push("-af", filters.join(","));
    }
    args.push("-f", format, "pipe:1");

    const ffmpeg = spawn("ffmpeg", args);

    const chunks: Buffer[] = [];
    ffmpeg.stdout.on("data", (chunk) => chunks.push(chunk));
    
    let errOutput = "";
    ffmpeg.stderr.on("data", (data) => {
      errOutput += data.toString();
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`ffmpeg exited with code ${code}\n${errOutput}`));
      }
    });

    ffmpeg.stdin.write(audioBuffer);
    ffmpeg.stdin.end();
  });
}

const app = express();

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
    const { prompt, durationSeconds, promptInfluence, loop, useCache, trimSilence, normalizeLoudness, fadeIn, fadeOut, elevenLabsApiKey } = validateGenerationRequest(req.body);

    // Generate a unique cache key based on the exact parameters
    const cacheKey = crypto
      .createHash("sha256")
      .update(JSON.stringify({ prompt, durationSeconds, promptInfluence, loop, trimSilence, normalizeLoudness, fadeIn, fadeOut }))
      .digest("hex");

    if (useCache && audioCache.has(cacheKey)) {
      console.log(`Cache hit for prompt: "${prompt}" (Parameters matched exactly)`);
      const cached = audioCache.get(cacheKey)!;
      res.json({ audioBase64: cached.audioBase64, mimeType: cached.mimeType });
      return;
    }


    // A key pasted into the UI is intentionally request-scoped. It is never
    // persisted or logged, and falls back to the server environment key.
    const apiKey = elevenLabsApiKey ?? config.elevenLabsApiKey;

    console.log(`Generating sound with ElevenLabs: "${prompt}" (${durationSeconds}s, loop: ${loop}, trimSilence: ${trimSilence}, norm: ${normalizeLoudness}, fadeIn: ${fadeIn}, fadeOut: ${fadeOut})`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SOUND_GENERATION_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: prompt,
          duration_seconds: durationSeconds,
          prompt_influence: promptInfluence,
          loop,
          model_id: "eleven_text_to_sound_v2",
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new RequestError("Sound generation timed out. Please try again.", 504);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errResponseText = await response.text();
      throw new Error(`ElevenLabs API returned ${response.status}: ${errResponseText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    let audioBuffer = Buffer.from(arrayBuffer);
    const mimeType = response.headers.get("content-type") || "audio/mpeg";

    if (trimSilence) {
      console.log("Trimming silence with ffmpeg...");
      try {
        audioBuffer = await trimSilenceWithFFmpeg(audioBuffer, mimeType);
      } catch (e) {
        console.error("Failed to trim silence, returning original audio. Error:", e);
      }
    }

    if (normalizeLoudness) {
      console.log("Normalizing loudness with ffmpeg...");
      try {
        audioBuffer = await normalizeLoudnessWithFFmpeg(audioBuffer, mimeType);
      } catch (e) {
        console.error("Failed to normalize loudness, returning original audio. Error:", e);
      }
    }

    if (fadeIn > 0 || fadeOut > 0) {
      console.log(`Fading audio with ffmpeg (in: ${fadeIn}s, out: ${fadeOut}s)...`);
      try {
        audioBuffer = await fadeAudioWithFFmpeg(audioBuffer, mimeType, Number(fadeIn), Number(fadeOut));
      } catch (e) {
        console.error("Failed to fade audio, returning original audio. Error:", e);
      }
    }

    const audioBase64 = audioBuffer.toString("base64");

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
    res.status(error instanceof RequestError ? error.statusCode : 500)
      .json({ error: error.message || "Failed to generate sound" });
  }
});

app.post("/api/trim-silence", async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64 || !mimeType) {
      throw new Error("Missing audioBase64 or mimeType");
    }

    const audioBuffer = Buffer.from(audioBase64, "base64");
    console.log("Trimming silence with ffmpeg for existing audio...");
    
    const trimmedBuffer = await trimSilenceWithFFmpeg(audioBuffer, mimeType);
    const trimmedBase64 = trimmedBuffer.toString("base64");

    res.json({ audioBase64: trimmedBase64 });
  } catch (error: any) {
    console.error("Error trimming silence:", error);
    res.status(500).json({ error: error.message || "Failed to trim silence" });
  }
});

app.post("/api/normalize", async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64 || !mimeType) {
      throw new Error("Missing audioBase64 or mimeType");
    }

    const audioBuffer = Buffer.from(audioBase64, "base64");
    console.log("Normalizing loudness with ffmpeg...");
    
    const processedBuffer = await normalizeLoudnessWithFFmpeg(audioBuffer, mimeType);
    const processedBase64 = processedBuffer.toString("base64");

    res.json({ audioBase64: processedBase64 });
  } catch (error: any) {
    console.error("Error normalizing loudness:", error);
    res.status(500).json({ error: error.message || "Failed to normalize loudness" });
  }
});

app.post("/api/fade", async (req, res) => {
  try {
    const { audioBase64, mimeType, fadeIn = 0, fadeOut = 0 } = req.body;
    if (!audioBase64 || !mimeType) {
      throw new Error("Missing audioBase64 or mimeType");
    }

    const audioBuffer = Buffer.from(audioBase64, "base64");
    console.log(`Fading audio with ffmpeg (in: ${fadeIn}s, out: ${fadeOut}s)...`);
    
    const processedBuffer = await fadeAudioWithFFmpeg(audioBuffer, mimeType, Number(fadeIn), Number(fadeOut));
    const processedBase64 = processedBuffer.toString("base64");

    res.json({ audioBase64: processedBase64 });
  } catch (error: any) {
    console.error("Error fading audio:", error);
    res.status(500).json({ error: error.message || "Failed to fade audio" });
  }
});

export default app;
