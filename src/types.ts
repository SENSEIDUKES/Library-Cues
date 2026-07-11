export interface SoundAsset {
  id: string;
  name: string;
  prompt: string;
  audioBase64: string;
  mimeType: string;
  createdAt: number;
  durationSeconds?: number;
  loop?: boolean;
  sampleRate?: number;
  fileSize?: number;
}

// Categories and types removed as we map directly to API

export interface GenerationParams {
  prompt: string;
  durationSeconds: number;
  promptInfluence: number;
  loop: boolean;
}
