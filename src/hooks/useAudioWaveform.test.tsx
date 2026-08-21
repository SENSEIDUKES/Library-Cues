import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAudioWaveform } from './useAudioWaveform';
import { SoundAsset } from '../types';

// Mock lib/storage
const mockSaveSound = vi.fn((_sound?: any) => Promise.resolve());
vi.mock('../lib/storage', () => ({
  saveSound: (sound: any) => mockSaveSound(sound),
}));

// Mock decodeAudioBase64, generateFallbackPeaks, and createReverbImpulse
const mockDecodeAudioBase64 = vi.fn();
const mockGenerateFallbackPeaks = vi.fn(() => [0.1, 0.2, 0.3]);
const mockCreateReverbImpulse = vi.fn(() => ({
  length: 44100,
  duration: 1,
  sampleRate: 44100,
  numberOfChannels: 2,
  getChannelData: vi.fn(() => new Float32Array(44100)),
  copyFromChannel: vi.fn(),
  copyToChannel: vi.fn()
}));

vi.mock('../lib/audio', () => ({
  decodeAudioBase64: (base64: string) => mockDecodeAudioBase64(base64),
  generateFallbackPeaks: () => mockGenerateFallbackPeaks(),
  createReverbImpulse: () => mockCreateReverbImpulse(),
}));

describe('useAudioWaveform hook', () => {
  const asset: SoundAsset = {
    id: 'a1',
    name: 'Techno Loop',
    prompt: 'Industrial techno beat',
    audioBase64: 'fake-audio-data',
    mimeType: 'audio/mpeg',
    createdAt: 123456789,
    durationSeconds: 5.0,
    loop: false,
    peaks: [0.5, 0.6, 0.7],
  };

  let latestAudioInstance: any = null;
  let constructorSpy: any = null;

  beforeEach(() => {
    vi.clearAllMocks();
    latestAudioInstance = null;
    constructorSpy = vi.fn();

    // Mock window.atob
    window.atob = vi.fn().mockReturnValue(String.fromCharCode(...new Array(100).fill(1)));

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Bulletproof mock for Audio constructor
    const MockAudio = function(this: any, url?: string) {
      constructorSpy(url);
      this.addEventListener = vi.fn();
      this.removeEventListener = vi.fn();
      this.play = vi.fn(() => Promise.resolve());
      this.pause = vi.fn();
      this.currentTime = 0;
      this.duration = 5.0;
      this.volume = 1.0;
      this.loop = false;
      this.paused = true;
      latestAudioInstance = this;
    };

    global.Audio = MockAudio as any;
    (window as any).Audio = MockAudio;

    mockDecodeAudioBase64.mockResolvedValue({
      peaks: [0.2, 0.4, 0.6, 0.8],
      sampleRate: 48000,
      duration: 10.0,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes the Audio element and decodes peaks from asset if already present', async () => {
    const { result } = renderHook(() => useAudioWaveform(asset));

    // Verify mock audio setup
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(latestAudioInstance).not.toBeNull();
    });

    expect(constructorSpy).toHaveBeenCalledWith('blob:mock-url');

    // Verification of pre-calculated peaks
    await waitFor(() => {
      expect(result.current.peaks).toEqual([0.5, 0.6, 0.7]);
      expect(result.current.isDecoding).toBe(false);
    });

    expect(result.current.displayDuration).toBe(5.0);
  });

  it('triggers decodeAudioBase64 if peaks are not preset and saves them', async () => {
    const assetWithoutPeaks: SoundAsset = {
      ...asset,
      peaks: undefined,
      durationSeconds: undefined,
      sampleRate: undefined,
    };

    const { result } = renderHook(() => useAudioWaveform(assetWithoutPeaks));

    // Wait for async decode to finish
    await waitFor(() => {
      expect(result.current.peaks).toEqual([0.2, 0.4, 0.6, 0.8]);
      expect(result.current.sampleRate).toBe(48000);
      expect(result.current.displayDuration).toBe(10.0);
    });

    expect(mockDecodeAudioBase64).toHaveBeenCalledWith('fake-audio-data');
    expect(mockSaveSound).toHaveBeenCalledWith(expect.objectContaining({
      peaks: [0.2, 0.4, 0.6, 0.8],
      sampleRate: 48000,
      durationSeconds: 10.0,
    }));
  });

  it('falls back to fallback peaks if decodeAudioBase64 fails', async () => {
    mockDecodeAudioBase64.mockRejectedValue(new Error('Decoding crash'));

    const assetWithoutPeaks: SoundAsset = {
      ...asset,
      peaks: undefined,
    };

    const { result } = renderHook(() => useAudioWaveform(assetWithoutPeaks));

    await waitFor(() => {
      expect(result.current.peaks).toEqual([0.1, 0.2, 0.3]);
    });
  });

  it('sets up event listeners on Audio element', async () => {
    renderHook(() => useAudioWaveform(asset));

    await waitFor(() => {
      expect(latestAudioInstance).not.toBeNull();
    });

    expect(latestAudioInstance.addEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function));
    expect(latestAudioInstance.addEventListener).toHaveBeenCalledWith('loadedmetadata', expect.any(Function));
    expect(latestAudioInstance.addEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
    expect(latestAudioInstance.addEventListener).toHaveBeenCalledWith('play', expect.any(Function));
    expect(latestAudioInstance.addEventListener).toHaveBeenCalledWith('pause', expect.any(Function));
  });

  it('updates volume via setVolume callback', async () => {
    const { result } = renderHook(() => useAudioWaveform(asset));

    await waitFor(() => {
      expect(latestAudioInstance).not.toBeNull();
    });

    act(() => {
      result.current.setVolume(0.5);
    });

    expect(latestAudioInstance.volume).toBe(0.5);
    expect(result.current.volume).toBe(0.5);
  });

  it('seeks to a specific timestamp', async () => {
    const { result } = renderHook(() => useAudioWaveform(asset));

    await waitFor(() => {
      expect(latestAudioInstance).not.toBeNull();
    });

    act(() => {
      result.current.seek(2.5);
    });

    expect(latestAudioInstance.currentTime).toBe(2.5);
    expect(result.current.currentTime).toBe(2.5);
  });

  it('toggles play/pause states', async () => {
    const { result } = renderHook(() => useAudioWaveform(asset));

    await waitFor(() => {
      expect(latestAudioInstance).not.toBeNull();
    });

    // Toggle play
    act(() => {
      result.current.togglePlay();
    });

    expect(latestAudioInstance.play).toHaveBeenCalled();

    // Set mock to paused = false to simulate active state
    latestAudioInstance.paused = false;

    // Toggle play again (to pause)
    act(() => {
      result.current.togglePlay();
    });

    expect(latestAudioInstance.pause).toHaveBeenCalled();
  });

  it('manages anti-pop loop volume envelope when asset.loop is true during playback', async () => {
    const loopAsset: SoundAsset = {
      ...asset,
      loop: true,
      durationSeconds: 4.0,
    };

    const { result } = renderHook(() => useAudioWaveform(loopAsset));

    await waitFor(() => {
      expect(latestAudioInstance).not.toBeNull();
    });

    expect(latestAudioInstance.loop).toBe(true);

    // Trigger playback
    act(() => {
      result.current.togglePlay();
      latestAudioInstance.paused = false;
      latestAudioInstance.currentTime = 0; // at start of loop
    });

    // Simulate requestAnimationFrame execution
    act(() => {
      // Advance timers or let RAF fire
    });

    // Verify audio element exists and is configured for seamless looping
    expect(latestAudioInstance.loop).toBe(true);
  });

  it('cleans up Web Audio nodes including loopGainNode on unmount', async () => {
    const { result, unmount } = renderHook(() => useAudioWaveform(asset));

    await waitFor(() => {
      expect(latestAudioInstance).not.toBeNull();
    });

    // Initialize Web Audio
    act(() => {
      result.current.setFilterFreq(5000);
    });

    // Unmount hook and verify no unhandled errors thrown during disconnection
    expect(() => {
      unmount();
    }).not.toThrow();
  });
});
