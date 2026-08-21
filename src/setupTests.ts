import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Canvas
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Array(4).fill(0)
  })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => []),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
  arcTo: vi.fn(),
})) as any;

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Web Audio API AudioParam
const createMockAudioParam = (defaultValue = 0) => ({
  value: defaultValue,
  setValueAtTime: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(),
  setTargetAtTime: vi.fn(),
  setValueCurveAtTime: vi.fn(),
  cancelScheduledValues: vi.fn(),
});

// Mock Web Audio API AudioNode
const createMockAudioNode = () => {
  const node: any = {
    connect: vi.fn((dest) => dest),
    disconnect: vi.fn(),
  };
  return node;
};

// Mock Web Audio API
(global as any).AudioContext = vi.fn().mockImplementation(function() {
  return {
    currentTime: 0,
    state: 'running',
    resume: vi.fn().mockResolvedValue(undefined),
    suspend: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    destination: createMockAudioNode(),
    createMediaElementSource: vi.fn().mockImplementation(() => createMockAudioNode()),
    createBiquadFilter: vi.fn().mockImplementation(() => ({
      ...createMockAudioNode(),
      type: 'lowpass',
      frequency: createMockAudioParam(20000),
      Q: createMockAudioParam(1),
      gain: createMockAudioParam(0),
    })),
    createDelay: vi.fn().mockImplementation(() => ({
      ...createMockAudioNode(),
      delayTime: createMockAudioParam(0.25),
    })),
    createGain: vi.fn().mockImplementation(() => ({
      ...createMockAudioNode(),
      gain: createMockAudioParam(1),
    })),
    createConvolver: vi.fn().mockImplementation(() => ({
      ...createMockAudioNode(),
      buffer: null,
    })),
    createOscillator: vi.fn().mockImplementation(() => ({
      ...createMockAudioNode(),
      type: 'sawtooth',
      frequency: createMockAudioParam(440),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    createBuffer: vi.fn().mockImplementation((channels, length, sampleRate) => ({
      numberOfChannels: channels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData: vi.fn().mockReturnValue(new Float32Array(length)),
    })),
    decodeAudioData: vi.fn().mockImplementation(() => Promise.resolve({
      length: 100,
      duration: 1,
      sampleRate: 44100,
      getChannelData: vi.fn().mockReturnValue(new Float32Array(100).fill(0.5)),
    })),
  };
});
(global as any).webkitAudioContext = (global as any).AudioContext;

(global as any).OfflineAudioContext = vi.fn().mockImplementation(function(_channels, _length, _sampleRate) {
  return {
    destination: createMockAudioNode(),
    createBiquadFilter: vi.fn().mockImplementation(() => ({
      ...createMockAudioNode(),
      type: 'lowpass',
      frequency: createMockAudioParam(20000),
    })),
    createGain: vi.fn().mockImplementation(() => ({
      ...createMockAudioNode(),
      gain: createMockAudioParam(1),
    })),
    createDelay: vi.fn().mockImplementation(() => ({
      ...createMockAudioNode(),
      delayTime: createMockAudioParam(0.25),
    })),
    createConvolver: vi.fn().mockImplementation(() => ({
      ...createMockAudioNode(),
      buffer: null,
    })),
    createBufferSource: vi.fn().mockImplementation(() => ({
      ...createMockAudioNode(),
      buffer: null,
      playbackRate: createMockAudioParam(1),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    createBuffer: vi.fn().mockImplementation((channels, length, sampleRate) => ({
      numberOfChannels: channels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData: vi.fn().mockReturnValue(new Float32Array(length)),
    })),
    startRendering: vi.fn().mockResolvedValue({
      numberOfChannels: 2,
      length: 100,
      sampleRate: 44100,
      duration: 1,
      getChannelData: vi.fn().mockReturnValue(new Float32Array(100)),
    }),
    decodeAudioData: vi.fn().mockImplementation(() => Promise.resolve({
      length: 100,
      duration: 1,
      sampleRate: 44100,
      getChannelData: vi.fn().mockReturnValue(new Float32Array(100).fill(0.5)),
    })),
  };
});
(global as any).webkitOfflineAudioContext = (global as any).OfflineAudioContext;

// Mock atob so it doesn't crash on 'fake-base64'
global.atob = vi.fn().mockReturnValue(String.fromCharCode(...new Array(100).fill(1)));
