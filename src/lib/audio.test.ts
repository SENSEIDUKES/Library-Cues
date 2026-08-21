import { describe, it, expect } from 'vitest';
import { decodeAudioBase64, generateFallbackPeaks, computeLoopGain, applyAntiPopLoopFade } from './audio';

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

  describe('computeLoopGain', () => {
    it('returns 1.0 if not looped or invalid duration', () => {
      expect(computeLoopGain(0, 5, false)).toBe(1.0);
      expect(computeLoopGain(0, 0, true)).toBe(1.0);
      expect(computeLoopGain(2.5, 5, false)).toBe(1.0);
    });

    it('smoothly fades in from 0.0 at the beginning of the loop (t = 0)', () => {
      const gainAtStart = computeLoopGain(0, 5.0, true, 0.04);
      expect(gainAtStart).toBeCloseTo(0, 2);

      const gainMidFade = computeLoopGain(0.02, 5.0, true, 0.04);
      expect(gainMidFade).toBeGreaterThan(0.6);
      expect(gainMidFade).toBeLessThan(0.8);

      const gainAfterFade = computeLoopGain(0.04, 5.0, true, 0.04);
      expect(gainAfterFade).toBeCloseTo(1.0, 2);
    });

    it('returns full unity gain (1.0) during the body of the sound', () => {
      expect(computeLoopGain(1.0, 5.0, true, 0.04)).toBe(1.0);
      expect(computeLoopGain(2.5, 5.0, true, 0.04)).toBe(1.0);
      expect(computeLoopGain(4.9, 5.0, true, 0.04)).toBe(1.0);
    });

    it('smoothly fades out to 0.0 at the end of the loop (t -> duration)', () => {
      const gainBeforeEndFade = computeLoopGain(4.96, 5.0, true, 0.04);
      expect(gainBeforeEndFade).toBeCloseTo(1.0, 2);

      const gainMidEndFade = computeLoopGain(4.98, 5.0, true, 0.04);
      expect(gainMidEndFade).toBeGreaterThan(0.6);
      expect(gainMidEndFade).toBeLessThan(0.8);

      const gainAtExactEnd = computeLoopGain(5.0, 5.0, true, 0.04);
      expect(gainAtExactEnd).toBeCloseTo(0, 2);
    });
  });

  describe('applyAntiPopLoopFade', () => {
    it('applies sinusoidal micro-fades to audio buffer channels', () => {
      const sampleRate = 44100;
      const numSamples = 44100; // 1 second
      const leftChannel = new Float32Array(numSamples).fill(1.0);
      const rightChannel = new Float32Array(numSamples).fill(1.0);

      const mockBuffer = {
        numberOfChannels: 2,
        sampleRate,
        length: numSamples,
        duration: 1.0,
        getChannelData: (ch: number) => (ch === 0 ? leftChannel : rightChannel),
      } as unknown as AudioBuffer;

      applyAntiPopLoopFade(mockBuffer, 0.04);

      // Start sample should be 0.0 (faded in)
      expect(leftChannel[0]).toBeCloseTo(0.0, 2);
      expect(rightChannel[0]).toBeCloseTo(0.0, 2);

      // End sample should be 0.0 (faded out)
      expect(leftChannel[numSamples - 1]).toBeCloseTo(0.0, 2);
      expect(rightChannel[numSamples - 1]).toBeCloseTo(0.0, 2);

      // Mid sample should remain 1.0 (unchanged)
      expect(leftChannel[Math.floor(numSamples / 2)]).toBe(1.0);
      expect(rightChannel[Math.floor(numSamples / 2)]).toBe(1.0);
    });
  });
});
