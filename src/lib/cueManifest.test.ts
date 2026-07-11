import { describe, expect, it } from 'vitest';
import type { LibraryCueAsset } from '../types/cues';
import { createCueManifest } from './cueManifest';

const cue = (): LibraryCueAsset => ({
  id: 'object.ui.click.01',
  version: 1,
  displayName: 'UI Click',
  audio: {
    fileName: 'object-ui-click-01.ogg',
    mimeType: 'audio/ogg',
    durationMs: 250,
    fileSizeBytes: 4,
  },
  category: 'object',
  family: 'ui',
  action: 'click',
  playback: { type: 'one-shot', loopable: false, defaultVolume: 0.5 },
  narrative: { tags: ['ui'] },
  source: { provider: 'synthetic' },
  curation: { status: 'approved' },
  createdAt: '2026-07-11T12:00:00.000Z',
  updatedAt: '2026-07-11T12:00:00.000Z',
});

describe('cue manifest', () => {
  it('creates the Light-Novels-compatible 1.0 manifest without local audio payloads', () => {
    const manifest = createCueManifest([cue()], '2026-07-11T13:00:00.000Z');

    expect(manifest).toMatchObject({
      schemaVersion: '1.0',
      generatedAt: '2026-07-11T13:00:00.000Z',
      app: 'Library Cues',
      compatibleWith: { app: 'Light-Novels' },
      cues: [{ id: 'object.ui.click.01', audio: { fileName: 'object-ui-click-01.ogg' } }],
    });
    expect(JSON.stringify(manifest)).not.toContain('audioBase64');
    expect(JSON.stringify(manifest)).not.toContain('AQIDBA==');
  });

  it('rejects duplicate public IDs and duplicate exported filenames', () => {
    const first = cue();
    const duplicateId = { ...cue(), audio: { ...cue().audio, fileName: 'another.ogg' } };
    expect(() => createCueManifest([first, duplicateId])).toThrow(/Duplicate cue id/);

    const duplicateFile = { ...cue(), id: 'object.ui.confirm.01' };
    expect(() => createCueManifest([first, duplicateFile])).toThrow(/Duplicate audio filename/);
  });
});
