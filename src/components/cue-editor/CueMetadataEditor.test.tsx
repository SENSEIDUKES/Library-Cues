import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { LibraryCueAsset, ValidationIssue } from '../../types/cues';
import { CueMetadataEditor } from './CueMetadataEditor';

const makeAsset = (overrides: Partial<LibraryCueAsset> = {}): LibraryCueAsset => ({
  id: 'object.uncategorized.unknown.01',
  version: 1,
  displayName: 'Untitled cue',
  audio: {
    fileName: 'object.uncategorized.unknown.01.mp3',
    mimeType: 'audio/mpeg',
    durationMs: 4000,
    fileSizeBytes: 128,
  },
  category: 'object',
  family: 'uncategorized',
  action: 'unknown',
  playback: {
    type: 'one-shot',
    loopable: false,
    defaultVolume: 1,
  },
  narrative: {
    intensityRange: { min: 0, max: 1 },
    tags: [],
  },
  source: {
    provider: 'elevenlabs',
  },
  curation: {
    status: 'candidate',
  },
  createdAt: '2026-07-11T12:00:00.000Z',
  updatedAt: '2026-07-11T12:00:00.000Z',
  ...overrides,
});

describe('CueMetadataEditor', () => {
  it('resets its local draft when the asset changes', () => {
    const onSave = vi.fn();
    const { rerender } = render(
      <CueMetadataEditor asset={makeAsset()} open onCancel={vi.fn()} onSave={onSave} />,
    );

    fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'Edited locally' } });
    expect(screen.getByLabelText('Display name')).toHaveValue('Edited locally');

    rerender(
      <CueMetadataEditor
        asset={makeAsset({ id: 'object.uncategorized.unknown.02', displayName: 'Replacement cue' })}
        open
        onCancel={vi.fn()}
        onSave={onSave}
      />,
    );

    expect(screen.getByLabelText('Display name')).toHaveValue('Replacement cue');
  });

  it('stores canonical beast values even when the UI uses friendly size labels', async () => {
    const onSave = vi.fn();
    render(<CueMetadataEditor asset={makeAsset()} open onCancel={vi.fn()} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'beast' } });
    fireEvent.click(screen.getByLabelText('Large (giant)'));
    fireEvent.click(screen.getByRole('button', { name: 'Save cue' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const saved = onSave.mock.calls[0][0] as LibraryCueAsset;
    expect(saved.beast?.sizes).toEqual(['giant']);
  });

  it('surfaces validation issues returned by onSave', async () => {
    const issue = { path: 'family', message: 'Family is required.' } as ValidationIssue;
    render(
      <CueMetadataEditor asset={makeAsset()} open onCancel={vi.fn()} onSave={() => [issue]} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save cue' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('family: Family is required.');
  });
});
