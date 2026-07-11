import { describe, expect, it } from 'vitest';
import {
  isStoredCueRecord,
  migrateCueRecord,
  migrateCueRecords,
  type LegacySoundAsset,
} from './cueMigration';

const NOW = '2026-07-11T12:00:00.000Z';

const legacySound = (overrides: Partial<LegacySoundAsset> = {}): LegacySoundAsset => ({
  id: 'legacy-1',
  name: 'Old Dragon Roar',
  prompt: 'A giant dragon roaring in a cavern',
  audioBase64: 'AQIDBA==',
  mimeType: 'audio/mp3',
  createdAt: 1_700_000_000_000,
  durationSeconds: 4.25,
  loop: false,
  sampleRate: 44_100,
  fileSize: 4,
  peaks: [0.1, 0.5, 1],
  previousAudioBase64: 'AQID',
  ...overrides,
});

describe('cueMigration', () => {
  it('preserves legacy audio, identity text, provenance, timestamps, and waveform data', () => {
    const { record, migrated } = migrateCueRecord(legacySound(), { now: NOW });

    expect(migrated).toBe(true);
    expect(record.id).toBe('legacy-1');
    expect(record.audioBase64).toBe('AQIDBA==');
    expect(record.previousAudioBase64).toBe('AQID');
    expect(record.peaks).toEqual([0.1, 0.5, 1]);
    expect(record.sampleRate).toBe(44_100);
    expect(record.cue).toMatchObject({
      id: 'object.uncategorized.unknown.01',
      version: 1,
      displayName: 'Old Dragon Roar',
      audio: {
        fileName: 'old-dragon-roar.mp3',
        mimeType: 'audio/mpeg',
        durationMs: 4250,
        fileSizeBytes: 4,
      },
      category: 'object',
      family: 'uncategorized',
      action: 'unknown',
      playback: {
        type: 'one-shot',
        loopable: false,
        defaultVolume: 1,
      },
      narrative: { tags: ['migrated'] },
      source: {
        provider: 'elevenlabs',
        prompt: 'A giant dragon roaring in a cavern',
        requestedDurationSeconds: 4.25,
        requestedLoop: false,
        generatedAt: '2023-11-14T22:13:20.000Z',
      },
      curation: { status: 'candidate' },
      createdAt: '2023-11-14T22:13:20.000Z',
      updatedAt: '2023-11-14T22:13:20.000Z',
    });
  });

  it('uses conservative classification and practical loop defaults', () => {
    const { record } = migrateCueRecord(legacySound({ loop: true }), { now: NOW });

    expect(record.cue.category).toBe('object');
    expect(record.cue.family).toBe('uncategorized');
    expect(record.cue.action).toBe('unknown');
    expect(record.cue.curation.status).toBe('candidate');
    expect(record.cue.playback).toMatchObject({
      type: 'loop',
      loopable: true,
      fadeInMs: 1500,
      fadeOutMs: 1500,
    });
  });

  it('returns an existing canonical wrapper unchanged', () => {
    const canonical = migrateCueRecord(legacySound(), { now: NOW }).record;
    const second = migrateCueRecord(canonical, { now: '2030-01-01T00:00:00.000Z' });

    expect(second.migrated).toBe(false);
    expect(second.record).toBe(canonical);
    expect(isStoredCueRecord(second.record)).toBe(true);
  });

  it('allocates stable collision-free public IDs independent of retrieval order', () => {
    const firstOrder = migrateCueRecords(
      [legacySound({ id: 'z-record' }), legacySound({ id: 'a-record' })],
      { now: NOW, existingCueIds: ['object.uncategorized.unknown.01'] },
    );
    const reverseOrder = migrateCueRecords(
      [legacySound({ id: 'a-record' }), legacySound({ id: 'z-record' })],
      { now: NOW, existingCueIds: ['object.uncategorized.unknown.01'] },
    );

    const idsByStorageKey = (records: typeof firstOrder.records) =>
      Object.fromEntries(records.map((record) => [record.id, record.cue.id]));

    expect(idsByStorageKey(firstOrder.records)).toEqual({
      'z-record': 'object.uncategorized.unknown.03',
      'a-record': 'object.uncategorized.unknown.02',
    });
    expect(idsByStorageKey(reverseOrder.records)).toEqual(idsByStorageKey(firstOrder.records));
  });

  it('preserves unsupported MIME metadata rather than relabelling the bytes', () => {
    const { record } = migrateCueRecord(legacySound({ mimeType: 'audio/aac' }), { now: NOW });

    expect(record.cue.audio.mimeType).toBe('audio/aac');
    expect(record.cue.audio.fileName).toBe('old-dragon-roar.bin');
  });

  it('does not create a canonical record when the legacy audio payload is absent', () => {
    const invalid = { ...legacySound() } as Record<string, unknown>;
    delete invalid.audioBase64;

    expect(() => migrateCueRecord(invalid, { now: NOW })).toThrow(/audioBase64/);
  });
});
