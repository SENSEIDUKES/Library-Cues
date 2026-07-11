import { describe, expect, it } from 'vitest';
import type { LibraryCueAsset } from '../types/cues';
import { validateCueAsset } from './cueValidation';

const validBeastCue = (): LibraryCueAsset => ({
  id: 'beast.giant.dragon.fire.roar.close.01',
  version: 1,
  displayName: 'Fire Dragon Roar',
  audio: {
    fileName: 'beast-giant-dragon-fire-roar-close-01.mp3',
    mimeType: 'audio/mpeg',
    durationMs: 2_000,
    fileSizeBytes: 4,
  },
  category: 'beast',
  family: 'dragon',
  action: 'roar',
  playback: { type: 'one-shot', loopable: false, defaultVolume: 0.8, maxVolume: 1 },
  narrative: {
    intensityRange: { min: 0.6, max: 1 },
    tensionRange: { min: 0.2, max: 0.9 },
    musicMoods: ['boss-fight'],
    musicRegions: ['chinese'],
    tags: ['dragon', 'fire'],
  },
  beast: {
    sizes: ['giant'],
    bodyTypes: ['dragon'],
    elements: ['fire'],
    movements: ['flying'],
    intelligences: ['ancient'],
    threatTiers: ['mythic'],
    signatureSounds: ['roar'],
    eventTypes: ['reveal'],
    distance: 'close',
    scaleWeight: 1,
  },
  source: { provider: 'elevenlabs', prompt: 'A giant fire dragon roaring nearby' },
  curation: { status: 'approved', approvedAt: '2026-07-11T12:00:00.000Z' },
  createdAt: '2026-07-11T12:00:00.000Z',
  updatedAt: '2026-07-11T12:00:00.000Z',
});

const issuePaths = (asset: LibraryCueAsset): string[] =>
  validateCueAsset(asset).issues.map((entry) => entry.path);

describe('cue validation', () => {
  it('accepts exact canonical Light-Novels beast and music values', () => {
    expect(validateCueAsset(validBeastCue())).toEqual({ valid: true, issues: [] });
  });

  it('reports required identity and category-specific profile fields', () => {
    const cue = validBeastCue();
    cue.displayName = ' ';
    cue.family = '';
    cue.category = 'movement';
    delete cue.movement;

    const result = validateCueAsset(cue);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'displayName', code: 'required' }),
        expect.objectContaining({ path: 'family', code: 'required' }),
        expect.objectContaining({ path: 'movement.movement', code: 'required_profile_field' }),
      ]),
    );
  });

  it('rejects non-canonical beast values at runtime', () => {
    const cue = validBeastCue();
    cue.beast!.sizes = ['small'] as never;
    cue.beast!.signatureSounds = ['growl'] as never;

    const result = validateCueAsset(cue);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'beast.sizes', code: 'non_canonical_value' }),
        expect.objectContaining({ path: 'beast.signatureSounds', code: 'non_canonical_value' }),
      ]),
    );
  });

  it('rejects values outside 0..1 and inverted narrative ranges', () => {
    const cue = validBeastCue();
    cue.playback.defaultVolume = 1.1;
    cue.narrative.intensityRange = { min: 0.9, max: 0.2 };
    cue.narrative.dangerRange = { min: -0.1, max: 1.2 };

    const paths = issuePaths(cue);

    expect(paths).toContain('playback.defaultVolume');
    expect(paths).toContain('narrative.intensityRange');
    expect(paths).toContain('narrative.dangerRange.min');
    expect(paths).toContain('narrative.dangerRange.max');
  });

  it('rejects an audio extension that does not match its MIME type', () => {
    const cue = validBeastCue();
    cue.audio.fileName = 'dragon-roar.wav';

    expect(validateCueAsset(cue).issues).toContainEqual(
      expect.objectContaining({ path: 'audio.fileName', code: 'extension_mismatch' }),
    );
  });

  it('accepts canonical underscore-delimited Light-Novels system events', () => {
    const cue: LibraryCueAsset = {
      ...validBeastCue(),
      id: 'system.skill-acquired.positive.01',
      displayName: 'Skill Acquired',
      category: 'system',
      family: 'progression',
      action: 'skill-acquired',
      system: { event: 'skill_acquired', tone: 'positive' },
    };

    expect(validateCueAsset(cue).valid).toBe(true);
  });
});
