import { describe, it, expect, vi } from 'vitest';
import { decodeAudioBase64, generateFallbackPeaks } from './audio';

describe('audio utilities', () => {
  describe('generateFallbackPeaks', () => {
    it('generates an array of fallback peaks of the default length 100', () => {
      const peaks = generateFallbackPeaks();
      expect(peaks).toBeInstanceOf(Array);
      expect(peaks).toHaveLength(100);
      peaks.forEach(peak => {
        expect(peak).toBeGreaterThanOrEqual(0.1);
        expect(peak).toBeLessThanOrEqual(1.0);
      });
    });

    it('generates peaks of a custom length', () => {
      const peaks = generateFallbackPeaks(45);
      expect(peaks).toHaveLength(45);
    });
  });

  describe('decodeAudioBase64', () => {
    it('decodes mock base64 audio and returns normalized peaks, sample rate, and duration', async () => {
      const result = await decodeAudioBase64('fake-base64-string', 50);
      expect(result).toHaveProperty('peaks');
      expect(result).toHaveProperty('sampleRate', 44100);
      expect(result).toHaveProperty('duration', 1);
      expect(result.peaks).toHaveLength(50);
      result.peaks.forEach(peak => {
        expect(peak).toBeGreaterThanOrEqual(0);
        expect(peak).toBeLessThanOrEqual(1.0);
      });
    });

    it('handles multiple concurrent decode decodes correctly via queuing', async () => {
      const promises = [
        decodeAudioBase64('fake-1', 20),
        decodeAudioBase64('fake-2', 20),
        decodeAudioBase64('fake-3', 20),
        decodeAudioBase64('fake-4', 20),
        decodeAudioBase64('fake-5', 20),
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.peaks).toHaveLength(20);
        expect(result.sampleRate).toBe(44100);
      });
    });
  });
});
