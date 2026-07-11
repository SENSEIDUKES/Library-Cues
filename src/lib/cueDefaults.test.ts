import { describe, expect, it } from 'vitest';
import type { SoundAsset } from '../types';
import { createCueAssetDefaults } from './cueDefaults';

const generatedSound = (overrides: Partial<SoundAsset> = {}): SoundAsset => ({
  id: 'internal-1',
  name: 'Dragon wind bed',
  prompt: 'A windy dragon cavern',
  audioBase64: 'AQIDBA==',
  mimeType: 'audio/ogg',
  createdAt: Date.parse('2026-07-11T12:00:00.000Z'),
  durationSeconds: 4,
  loop: true,
  generationParams: {
    prompt: 'A windy dragon cavern',
    durationSeconds: 4,
    promptInfluence: 0.65,
    loop: true,
    trimSilence: false,
    normalizeLoudness: false,
    fadeIn: 0,
    fadeOut: 0,
  },
  ...overrides,
});

describe('cue defaults', () => {
  it('uses decoded audio facts and practical loop/provenance defaults', () => {
    const cue = createCueAssetDefaults(
      generatedSound(),
      { durationMs: 3850, fileSizeBytes: 4 },
      '2026-07-11T13:00:00.000Z',
    );

    expect(cue.playback).toMatchObject({ type: 'loop', loopable: true, fadeInMs: 1500, fadeOutMs: 1500 });
    expect(cue.audio).toMatchObject({ mimeType: 'audio/ogg', durationMs: 3850, fileSizeBytes: 4 });
    expect(cue.source).toMatchObject({ provider: 'elevenlabs', promptInfluence: 0.65, requestedDurationSeconds: 4, requestedLoop: true });
    expect(cue.curation.status).toBe('candidate');
    expect(cue.version).toBe(1);
  });

  it('does not relabel an unsupported provider format as MP3', () => {
    expect(() => createCueAssetDefaults(generatedSound({ mimeType: 'audio/aac' }))).toThrow(/Unsupported generated audio MIME type/);
  });
});
