import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoredCueRecord } from './types/cues';
import App from './App';

const libraryState = vi.hoisted(() => ({ records: [] as StoredCueRecord[] }));
const saveRecord = vi.hoisted(() => vi.fn());
const removeRecord = vi.hoisted(() => vi.fn());
const removeRecords = vi.hoisted(() => vi.fn());
const renameRecord = vi.hoisted(() => vi.fn());
const exportKit = vi.hoisted(() => vi.fn());

vi.mock('./hooks/useSoundLibrary', () => ({
  useSoundLibrary: () => ({
    library: libraryState.records,
    isLoading: false,
    storageError: null,
    approvedCount: libraryState.records.filter((record) => record.cue.curation.status === 'approved').length,
    handleSaveCueRecord: saveRecord,
    handleRemoveFromLibrary: removeRecord,
    handleBulkRemoveFromLibrary: removeRecords,
    handleRenameLibraryAsset: renameRecord,
    exportKit,
  }),
}));

vi.mock('./lib/audio', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./lib/audio')>();
  return {
    ...actual,
    inspectAudioBase64: vi.fn(async () => ({
      peaks: [0.2, 0.8],
      sampleRate: 44100,
      duration: 1.25,
      durationMs: 1250,
      fileSizeBytes: 3,
    })),
  };
});

vi.mock('./components/AudioWaveform', () => ({
  AudioWaveform: ({ asset, onKeep, onReject, onRename, onToggleSelect, onEdit }: any) => (
    <div data-testid={`waveform-${asset.id}`}>
      {onToggleSelect && <button aria-label={`Select ${asset.name}`} onClick={onToggleSelect}>Select</button>}
      {onKeep && <button aria-label={`Keep ${asset.name}`} onClick={onKeep}>Keep</button>}
      {onEdit && <button aria-label={`Edit ${asset.name}`} onClick={onEdit}>Edit</button>}
      <input aria-label={`Name ${asset.id}`} value={asset.name} onChange={(event) => onRename?.(event.target.value)} />
      {onReject && <button title="Delete" onClick={onReject}>Delete</button>}
    </div>
  ),
}));

const cueRecord = (status: 'candidate' | 'approved' = 'candidate'): StoredCueRecord => ({
  id: `stored-${status}`,
  audioBase64: 'AQID',
  cue: {
    id: `object.ui.click.${status}.01`,
    version: 1,
    displayName: `${status} cue`,
    audio: { fileName: `object-ui-click-${status}-01.mp3`, mimeType: 'audio/mpeg', durationMs: 1000, fileSizeBytes: 3 },
    category: 'object',
    family: 'ui',
    action: 'click',
    playback: { type: 'one-shot', loopable: false, defaultVolume: 1 },
    narrative: { intensityRange: { min: 0, max: 1 }, tags: ['ui'] },
    source: { provider: 'elevenlabs', prompt: 'click' },
    curation: { status },
    createdAt: '2026-07-11T12:00:00.000Z',
    updatedAt: '2026-07-11T12:00:00.000Z',
  },
});

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    libraryState.records = [];
    saveRecord.mockImplementation(async (record: StoredCueRecord) => {
      libraryState.records = [record, ...libraryState.records.filter((item) => item.id !== record.id)];
    });
    removeRecord.mockResolvedValue(undefined);
    removeRecords.mockResolvedValue(undefined);
    renameRecord.mockResolvedValue(undefined);
    exportKit.mockImplementation(async (records?: StoredCueRecord[]) => {
      const cues = (records ?? libraryState.records.filter((record) => record.cue.curation.status === 'approved')).map((record) => record.cue);
      return { manifest: { cues } };
    });
    global.fetch = vi.fn() as any;
    let generatedId = 0;
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      configurable: true,
      value: vi.fn(() => `generated-record-id-${++generatedId}`),
    });
  });

  it('renders the synthesis workspace', () => {
    render(<App />);
    expect(screen.getByText('Library Cues')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate New/i })).toBeInTheDocument();
  });

  it('keeps multiple generated variations available', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ audioBase64: 'AQID', mimeType: 'audio/mpeg' }),
    });
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/A guttural/i), { target: { value: 'A fire dragon roar' } });
    fireEvent.click(screen.getByRole('button', { name: /Variants \(3\)/i }));
    await waitFor(() => expect(screen.getAllByLabelText(/Name generated-record-id/i)).toHaveLength(3));
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('surfaces generation errors', async () => {
    (global.fetch as any).mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: 'API key rejected' }) });
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/A guttural/i), { target: { value: 'A bell' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate New/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('API key rejected');
  });

  it('opens curation before saving and preserves generation provenance', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ audioBase64: 'AQID', mimeType: 'audio/mpeg' }),
    });
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/A guttural/i), { target: { value: 'A distant bell' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate New/i }));
    await screen.findByLabelText('Keep SFX');
    fireEvent.click(screen.getByLabelText('Keep SFX'));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(saveRecord).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'Distant Bell' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save cue' }));

    await waitFor(() => expect(saveRecord).toHaveBeenCalledTimes(1));
    const saved = saveRecord.mock.calls[0][0] as StoredCueRecord;
    expect(saved.cue.id).toBe('object.uncategorized.unknown.01');
    expect(saved.cue.curation.status).toBe('candidate');
    expect(saved.cue.source).toMatchObject({
      provider: 'elevenlabs',
      prompt: 'A distant bell',
      promptInfluence: 0.7,
      requestedDurationSeconds: 4,
      requestedLoop: false,
    });
    expect(saved.cue.audio).toMatchObject({ mimeType: 'audio/mpeg', durationMs: 1250, fileSizeBytes: 3 });
  });

  it('does not persist invalid category-specific metadata', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({ audioBase64: 'AQID', mimeType: 'audio/mpeg' }) });
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/A guttural/i), { target: { value: 'A creature' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate New/i }));
    fireEvent.click(await screen.findByLabelText('Keep SFX'));
    fireEvent.change(await screen.findByLabelText('Category'), { target: { value: 'beast' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save cue' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose at least one beast matching value');
    expect(saveRecord).not.toHaveBeenCalled();
  });

  it('exports explicitly selected candidates', async () => {
    libraryState.records = [cueRecord('candidate')];
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Saved Kit/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Select All/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    await waitFor(() => expect(exportKit).toHaveBeenCalledWith([libraryState.records[0]]));
  });

  it('defaults full export to approved cues', async () => {
    libraryState.records = [cueRecord('candidate'), cueRecord('approved')];
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Saved Kit/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Export Approved \(1\)/i }));
    await waitFor(() => expect(exportKit).toHaveBeenCalledWith());
  });
});
