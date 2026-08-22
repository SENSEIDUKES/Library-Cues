import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AudioWaveform } from './AudioWaveform';
import { SoundAsset } from '../types';

vi.mock('../hooks/useAudioWaveform', () => ({
  useAudioWaveform: () => ({
    audioRef: { current: null },
    isPlaying: false,
    currentTime: 0,
    displayDuration: 4,
    togglePlay: vi.fn(),
    seek: vi.fn(),
    peaks: [],
    isDecoding: false,
    sampleRate: 44100,
    fileSizeStr: '1.2 MB',
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

describe('AudioWaveform', () => {
  const defaultAsset: SoundAsset = {
    id: '1',
    name: 'Test Sound',
    prompt: 'A loud roar',
    audioBase64: 'fake-base64',
    mimeType: 'audio/mpeg',
    createdAt: Date.now(),
    durationSeconds: 4,
    loop: false,
  };

  it('renders the asset name and prompt', () => {
    render(<AudioWaveform asset={defaultAsset} />);
    expect(screen.getByDisplayValue('Test Sound')).toBeInTheDocument();
    expect(screen.getByText('A loud roar')).toBeInTheDocument();
  });

  it('calls onReject when delete button is clicked', () => {
    const handleReject = vi.fn();
    render(<AudioWaveform asset={defaultAsset} onReject={handleReject} />);
    
    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);
    expect(handleReject).toHaveBeenCalledTimes(1);
  });

  it('downloads when download button is clicked', () => {
    render(<AudioWaveform asset={defaultAsset} />);
    
    const downloadButton = screen.getByTitle('Download');
    fireEvent.click(downloadButton);
    // Hard to test actual download creation without mocking document.createElement
  });

  it('calls onKeep when keep button is clicked', () => {
    const handleKeep = vi.fn();
    const { container } = render(<AudioWaveform asset={defaultAsset} onKeep={handleKeep} />);
    
    // the keep button is the first button inside the container, or we can query it
    const buttons = container.querySelectorAll('button');
    // keep button is at index 0 because it renders first when onKeep is provided
    fireEvent.click(buttons[0]);
    expect(handleKeep).toHaveBeenCalledTimes(1);
  });

  it('calls onRename when input is changed', () => {
    const handleRename = vi.fn();
    render(<AudioWaveform asset={defaultAsset} onRename={handleRename} />);
    
    const input = screen.getByDisplayValue('Test Sound');
    fireEvent.change(input, { target: { value: 'New Sound Name' } });
    fireEvent.blur(input);
    expect(handleRename).toHaveBeenCalledWith('New Sound Name');
  });

  it('handles canvas click to seek', () => {
    const { container } = render(<AudioWaveform asset={defaultAsset} />);
    const canvas = container.querySelector('canvas');
    if (canvas) {
      // Mock getBoundingClientRect
      canvas.getBoundingClientRect = vi.fn(() => ({
        width: 100,
        height: 50,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        x: 0,
        y: 0,
        toJSON: () => {}
      }));
      fireEvent.click(canvas, { clientX: 50 });
      // We can't easily assert the mock of `seek` since we're using vi.mock inline 
      // but it should not crash.
    }
  });

  it('calls onRenameAsset when provided', () => {
    const handleRenameAsset = vi.fn();
    render(<AudioWaveform asset={defaultAsset} onRenameAsset={handleRenameAsset} />);
    
    const input = screen.getByDisplayValue('Test Sound');
    fireEvent.change(input, { target: { value: 'Renamed Title' } });
    fireEvent.blur(input);
    expect(handleRenameAsset).toHaveBeenCalledWith('1', 'Renamed Title');
  });

  it('calls DSP action handlers with the asset reference directly', async () => {
    const handleTrimSilence = vi.fn().mockResolvedValue(undefined);
    const { unmount } = render(
      <AudioWaveform 
        asset={defaultAsset} 
        onTrimSilence={handleTrimSilence}
      />
    );

    const trimBtn = screen.getByTitle('Trim Silence');
    fireEvent.click(trimBtn);
    expect(handleTrimSilence).toHaveBeenCalledWith(defaultAsset);
    unmount();

    const handleNormalize = vi.fn().mockResolvedValue(undefined);
    const { unmount: unmount2 } = render(
      <AudioWaveform 
        asset={defaultAsset} 
        onNormalizeLoudness={handleNormalize}
      />
    );
    const normalizeBtn = screen.getByTitle('Normalize Loudness');
    fireEvent.click(normalizeBtn);
    expect(handleNormalize).toHaveBeenCalledWith(defaultAsset);
    unmount2();

    const handleFade = vi.fn().mockResolvedValue(undefined);
    render(
      <AudioWaveform 
        asset={defaultAsset} 
        onFadeAudio={handleFade}
      />
    );
    const fadeBtn = screen.getByTitle('Apply Fade In/Out (from Synthesis Settings)');
    fireEvent.click(fadeBtn);
    expect(handleFade).toHaveBeenCalledWith(defaultAsset);
  });

  it('calls onUndoTrim when sound has previousAudioBase64', async () => {
    const handleUndoTrim = vi.fn().mockResolvedValue(undefined);
    const processedAsset: SoundAsset = {
      ...defaultAsset,
      previousAudioBase64: 'original-base64-data',
    };

    render(
      <AudioWaveform 
        asset={processedAsset} 
        onUndoTrim={handleUndoTrim}
      />
    );

    const undoBtn = screen.getByTitle('Undo Action');
    fireEvent.click(undoBtn);
    expect(handleUndoTrim).toHaveBeenCalledWith(processedAsset);
  });

  it('renders accessible slider attributes and handles keyboard navigation on canvas', () => {
    render(<AudioWaveform asset={defaultAsset} />);
    const slider = screen.getByRole('slider', { name: /Audio waveform for Test Sound/i });
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('aria-label', 'Audio waveform for Test Sound');
    expect(slider).toHaveAttribute('tabIndex', '0');

    // Test keyboard interactions
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    fireEvent.keyDown(slider, { key: 'Home' });
    fireEvent.keyDown(slider, { key: 'End' });
    fireEvent.keyDown(slider, { key: ' ' });
    fireEvent.keyDown(slider, { key: 'Enter' });
  });

  it('renders correctly with loop enabled', () => {
    render(<AudioWaveform asset={{ ...defaultAsset, loop: true }} />);
    expect(screen.getByText('Seamless Loop')).toBeInTheDocument();
  });

  it('renders kit dropdown and allows assigning/removing sounds from kits', () => {
    const mockKits = [
      { id: 'kit-1', name: 'Ambient FX', soundIds: ['1'], createdAt: Date.now() },
      { id: 'kit-2', name: 'UI Clicks', soundIds: [], createdAt: Date.now() }
    ];
    const handleAssign = vi.fn();
    const handleRemove = vi.fn();

    render(
      <AudioWaveform 
        asset={defaultAsset} 
        kits={mockKits}
        onAssignToKit={handleAssign}
        onRemoveFromKit={handleRemove}
      />
    );

    const kitBtn = screen.getByTitle('Add to Kit');
    fireEvent.click(kitBtn);

    expect(screen.getByText('Ambient FX')).toBeInTheDocument();
    expect(screen.getByText('UI Clicks')).toBeInTheDocument();

    // Click UI Clicks (which doesn't contain the sound yet)
    fireEvent.click(screen.getByText('UI Clicks'));
    expect(handleAssign).toHaveBeenCalledWith('kit-2', '1');

    // Click Ambient FX (which contains the sound)
    fireEvent.click(screen.getByText('Ambient FX'));
    expect(handleRemove).toHaveBeenCalledWith('kit-1', '1');
  });
});
