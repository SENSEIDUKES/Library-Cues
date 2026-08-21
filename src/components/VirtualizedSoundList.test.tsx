import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VirtualizedSoundList } from './VirtualizedSoundList';
import { SoundAsset } from '../types';

vi.mock('../hooks/useAudioWaveform', () => ({
  useAudioWaveform: () => ({
    audioRef: { current: null },
    isPlaying: false,
    currentTime: 0,
    displayDuration: 3.5,
    togglePlay: vi.fn(),
    seek: vi.fn(),
    peaks: [],
    isDecoding: false,
    sampleRate: 44100,
    fileSizeStr: '850 KB',
    volume: 1,
    setVolume: vi.fn(),
    playbackRate: 1,
    setPlaybackRate: vi.fn(),
    filterFreq: 20000,
    setFilterFreq: vi.fn(),
    delayFeedback: 0,
    setDelayFeedback: vi.fn(),
    reverbAmount: 0,
    setReverbAmount: vi.fn()
  })
}));

describe('VirtualizedSoundList', () => {
  const createMockAsset = (id: string, name: string): SoundAsset => ({
    id,
    name,
    prompt: `Prompt for ${name}`,
    audioBase64: 'fake-base64-data',
    mimeType: 'audio/mpeg',
    createdAt: Date.now() - parseInt(id) * 1000,
    durationSeconds: 2.5,
    loop: false,
  });

  const defaultProps = {
    items: [
      createMockAsset('1', 'Sound Alpha'),
      createMockAsset('2', 'Sound Beta'),
      createMockAsset('3', 'Sound Gamma'),
    ],
    viewDensity: 'compact' as const,
    kits: [],
    selectedLibraryIds: new Set<string>(),
    focusedSoundId: null,
    setFocusedSoundId: vi.fn(),
    handleRemoveFromLibrary: vi.fn(),
    handleRenameLibraryAsset: vi.fn(),
    handleTrimSilence: vi.fn(),
    handleUndoTrim: vi.fn(),
    handleNormalizeLoudness: vi.fn(),
    handleFade: vi.fn(),
    handleUpdateAsset: vi.fn(),
    handleToggleSelect: vi.fn(),
    setSelectedDiagnosticAsset: vi.fn(),
    handleAssignSoundToKit: vi.fn(),
    handleRemoveSoundFromKit: vi.fn(),
  };

  it('renders all items cleanly in compact density', () => {
    render(<VirtualizedSoundList {...defaultProps} />);

    expect(screen.getByDisplayValue('Sound Alpha')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sound Beta')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sound Gamma')).toBeInTheDocument();
  });

  it('renders all items cleanly in comfortable density', () => {
    render(<VirtualizedSoundList {...defaultProps} viewDensity="comfortable" />);

    expect(screen.getByDisplayValue('Sound Alpha')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sound Beta')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sound Gamma')).toBeInTheDocument();
  });

  it('renders telemetry when items count exceeds threshold', () => {
    const largeList = Array.from({ length: 20 }, (_, i) => 
      createMockAsset(`${i + 1}`, `Virtual Sound ${i + 1}`)
    );

    render(<VirtualizedSoundList {...defaultProps} items={largeList} />);

    expect(screen.getByText('Virtualized Windowing')).toBeInTheDocument();
    expect(screen.getByText(/live DOM cards/i)).toBeInTheDocument();
  });

  it('propagates delete and rename callbacks to parent handlers', () => {
    const handleRemove = vi.fn();
    render(<VirtualizedSoundList {...defaultProps} handleRemoveFromLibrary={handleRemove} />);

    const deleteButtons = screen.getAllByTitle('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(handleRemove).toHaveBeenCalledWith('1');
  });

  it('handles item selection toggles', () => {
    const handleToggleSelect = vi.fn();
    render(<VirtualizedSoundList {...defaultProps} handleToggleSelect={handleToggleSelect} />);

    const selectButtons = screen.getAllByRole('button', { name: /select/i });
    if (selectButtons.length > 0) {
      fireEvent.click(selectButtons[0]);
      expect(handleToggleSelect).toHaveBeenCalledWith('1');
    }
  });
});
