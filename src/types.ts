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
  previousAudioBase64?: string;
  peaks?: number[];
  category?: 'ambient' | 'ui' | 'action' | string;
  tags?: string[];
  sourceDescription?: string;
  playbackRate?: number;
  filterFreq?: number;
  delayFeedback?: number;
  reverbAmount?: number;
  appliedEffects?: {
    trimSilence?: boolean;
    normalizeLoudness?: boolean;
    fadeIn?: number;
    fadeOut?: number;
    printedRealtime?: boolean;
  };
  diagnostics?: {
    engine?: string;
    originalSize?: number;
    processedSize?: number;
    success?: boolean;
    logs?: string[];
  };
}

export interface SoundKit {
  id: string;
  name: string;
  createdAt: number;
  description?: string;
  soundIds: string[];
}

// Categories and types removed as we map directly to API

export interface GenerationParams {
  prompt: string;
  durationSeconds: number;
  promptInfluence: number;
  loop: boolean;
  trimSilence: boolean;
  normalizeLoudness: boolean;
  fadeIn: number;
  fadeOut: number;
}
