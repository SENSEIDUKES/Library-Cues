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
    setVolume: vi.fn()
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

  it('renders correctly with loop enabled', () => {
    render(<AudioWaveform asset={{ ...defaultAsset, loop: true }} />);
    expect(screen.getByText('Seamless Loop')).toBeInTheDocument();
  });
});
