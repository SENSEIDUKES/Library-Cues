import { describe, expect, it } from 'vitest';
import type { LibraryCueAsset } from '../types/cues';
import { createCueId, cueIdBase, withCanonicalCueIdentity } from './cueId';

const beastCue = (): LibraryCueAsset => ({
  id: 'draft.generated-1',
  version: 1,
  displayName: 'Fire Dragon Roar',
  audio: {
    fileName: 'draft-generated-1.wav',
    mimeType: 'audio/mpeg',
    durationMs: 2_000,
    fileSizeBytes: 4,
  },
  category: 'beast',
  family: 'dragon',
  action: 'roar',
  playback: { type: 'one-shot', loopable: false, defaultVolume: 0.8 },
  narrative: { intensityRange: { min: 0.6, max: 1 }, tags: ['dragon', 'fire'] },
  beast: {
    sizes: ['giant'],
    bodyTypes: ['dragon'],
    elements: ['fire'],
    signatureSounds: ['roar'],
    distance: 'close',
  },
  source: { provider: 'elevenlabs', prompt: 'A giant fire dragon roaring nearby' },
  curation: { status: 'candidate' },
  createdAt: '2026-07-11T12:00:00.000Z',
  updatedAt: '2026-07-11T12:00:00.000Z',
});

describe('semantic cue identity', () => {
  it('builds the readable beast identity from canonical matching metadata', () => {
    const cue = beastCue();

    expect(cueIdBase(cue)).toBe('beast.giant.dragon.fire.roar.close');
    expect(createCueId(cue)).toBe('beast.giant.dragon.fire.roar.close.01');
  });

  it('allocates the next available numeric suffix on collisions', () => {
    const cue = beastCue();
    const existing = [
      'beast.giant.dragon.fire.roar.close.01',
      'beast.giant.dragon.fire.roar.close.02',
      'movement.footsteps.walk.stone.01',
    ];

    expect(createCueId(cue, existing)).toBe('beast.giant.dragon.fire.roar.close.03');
    expect(createCueId(cue, existing)).toBe('beast.giant.dragon.fire.roar.close.03');
  });

  it('canonicalizes the public ID and filename together without mutating the draft', () => {
    const draft = beastCue();
    const canonical = withCanonicalCueIdentity(draft);

    expect(canonical.id).toBe('beast.giant.dragon.fire.roar.close.01');
    expect(canonical.audio.fileName).toBe('beast-giant-dragon-fire-roar-close-01.mp3');
    expect(draft.id).toBe('draft.generated-1');
    expect(draft.audio.fileName).toBe('draft-generated-1.wav');
  });
});
