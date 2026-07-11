import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import type { LibraryCueAsset, StoredCueRecord } from '../types/cues';
import { buildCueKit, selectCueRecordsForExport } from './cueExport';

const cue = (
  id: string,
  status: LibraryCueAsset['curation']['status'],
  mimeType: LibraryCueAsset['audio']['mimeType'] = 'audio/mpeg',
): LibraryCueAsset => ({
  id,
  version: 1,
  displayName: id,
  audio: {
    fileName: `${id.replace(/\./g, '-')}.${mimeType === 'audio/mpeg' ? 'mp3' : mimeType.split('/')[1]}`,
    mimeType,
    durationMs: 500,
    fileSizeBytes: 4,
  },
  category: 'object',
  family: 'ui',
  action: 'click',
  playback: { type: 'one-shot', loopable: false, defaultVolume: 0.5 },
  narrative: { tags: ['ui'] },
  source: { provider: 'synthetic' },
  curation: { status },
  createdAt: '2026-07-11T12:00:00.000Z',
  updatedAt: '2026-07-11T12:00:00.000Z',
});

const record = (
  storageId: string,
  publicId: string,
  status: LibraryCueAsset['curation']['status'],
  audioBase64 = 'AQIDBA==',
): StoredCueRecord => ({
  id: storageId,
  cue: cue(publicId, status),
  audioBase64,
});

const blobBytes = (blob: Blob): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(blob);
  });

describe('cue kit export', () => {
  it('selects approved cues by default but permits an explicitly selected candidate', () => {
    const approved = record('approved-storage', 'object.ui.approved.01', 'approved');
    const candidate = record('candidate-storage', 'object.ui.candidate.01', 'candidate');

    expect(selectCueRecordsForExport([approved, candidate])).toEqual([approved]);
    expect(selectCueRecordsForExport([candidate], 'explicit')).toEqual([candidate]);
  });

  it('writes approved audio bytes and a base64-free manifest at canonical ZIP paths', async () => {
    const approved = record('approved-storage', 'object.ui.approved.01', 'approved');
    const candidate = record('candidate-storage', 'object.ui.candidate.01', 'candidate', 'BQYHCA==');

    const kit = await buildCueKit([approved, candidate], {
      generatedAt: '2026-07-11T13:00:00.000Z',
    });
    const zip = await JSZip.loadAsync(await blobBytes(kit.blob));
    const audioPath = 'library-cues-kit/audio/object-ui-approved-01.mp3';
    const manifestPath = 'library-cues-kit/cue-manifest.json';

    expect(zip.file(audioPath)).not.toBeNull();
    expect(zip.file('library-cues-kit/audio/object-ui-candidate-01.mp3')).toBeNull();
    expect(Array.from(await zip.file(audioPath)!.async('uint8array'))).toEqual([1, 2, 3, 4]);

    const manifestText = await zip.file(manifestPath)!.async('string');
    const manifest = JSON.parse(manifestText);
    expect(manifest.cues.map((entry: LibraryCueAsset) => entry.id)).toEqual([
      'object.ui.approved.01',
    ]);
    expect(manifestText).not.toContain('audioBase64');
    expect(manifestText).not.toContain('AQIDBA==');
  });

  it('exports a candidate when that record is explicitly supplied', async () => {
    const candidate = record('candidate-storage', 'object.ui.candidate.01', 'candidate', 'BQYHCA==');

    const kit = await buildCueKit([candidate], {
      mode: 'explicit',
      generatedAt: '2026-07-11T13:00:00.000Z',
    });
    const zip = await JSZip.loadAsync(await blobBytes(kit.blob));
    const audioPath = 'library-cues-kit/audio/object-ui-candidate-01.mp3';

    expect(kit.manifest.cues).toHaveLength(1);
    expect(kit.manifest.cues[0].curation.status).toBe('candidate');
    expect(Array.from(await zip.file(audioPath)!.async('uint8array'))).toEqual([5, 6, 7, 8]);
  });
});
