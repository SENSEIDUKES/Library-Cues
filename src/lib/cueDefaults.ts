import type { SoundAsset } from '../types';
import type { LibraryCueAsset } from '../types/cues';
import type { AudioInspection } from './audio';
import { audioFileNameForCue, base64ByteLength, normalizeSupportedAudioMimeType } from './mime';

const toIso = (value: number | string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

export function createCueAssetDefaults(
  sound: SoundAsset,
  inspection?: Partial<AudioInspection>,
  now = new Date().toISOString(),
): LibraryCueAsset {
  const mimeType = normalizeSupportedAudioMimeType(sound.mimeType);
  if (!mimeType) {
    throw new TypeError(`Unsupported generated audio MIME type: ${sound.mimeType || 'missing'}.`);
  }
  const generation = sound.generationParams;
  const loopable = generation?.loop ?? sound.loop ?? false;
  const createdAt = toIso(sound.createdAt);
  const draftId = `draft.${sound.id}`;
  const durationMs = inspection?.durationMs ?? Math.round((sound.durationSeconds ?? 0) * 1000);
  const fileSizeBytes = inspection?.fileSizeBytes ?? sound.fileSize ?? base64ByteLength(sound.audioBase64);

  return {
    id: draftId,
    version: 1,
    displayName: sound.name.trim() || 'Untitled cue',
    description: sound.prompt.trim() || undefined,
    audio: {
      fileName: audioFileNameForCue(draftId, mimeType),
      mimeType,
      durationMs,
      fileSizeBytes,
    },
    category: 'object',
    family: 'uncategorized',
    action: 'unknown',
    playback: {
      type: loopable ? 'loop' : 'one-shot',
      loopable,
      defaultVolume: 1,
      ...(loopable
        ? {
            fadeInMs: generation?.fadeIn ? Math.round(generation.fadeIn * 1000) : 1500,
            fadeOutMs: generation?.fadeOut ? Math.round(generation.fadeOut * 1000) : 1500,
          }
        : {}),
    },
    narrative: {
      intensityRange: { min: 0, max: 1 },
      tags: [],
    },
    source: {
      provider: 'elevenlabs',
      prompt: sound.prompt,
      promptInfluence: generation?.promptInfluence,
      requestedDurationSeconds: generation?.durationSeconds ?? sound.durationSeconds,
      requestedLoop: loopable,
      generatedAt: createdAt,
    },
    curation: {
      status: 'candidate',
    },
    createdAt,
    updatedAt: now,
  };
}
