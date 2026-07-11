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

// Mock Web Audio API
(global as any).AudioContext = vi.fn().mockImplementation(function() {
  return {
    decodeAudioData: vi.fn().mockImplementation(() => Promise.resolve({
      length: 100,
      duration: 1,
      sampleRate: 44100,
      getChannelData: vi.fn().mockReturnValue(new Float32Array(100).fill(0.5)),
    })),
    close: vi.fn().mockImplementation(() => Promise.resolve()),
  };
});
(global as any).webkitAudioContext = (global as any).AudioContext;

(global as any).OfflineAudioContext = vi.fn().mockImplementation(function() {
  return {
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
