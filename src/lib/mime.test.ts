import { describe, expect, it } from 'vitest';
import {
  audioFileNameForCue,
  base64ByteLength,
  extensionForMimeType,
  hasMatchingAudioExtension,
  normalizeSupportedAudioMimeType,
} from './mime';

describe('cue MIME helpers', () => {
  it('maps every supported MIME type to its real audio extension', () => {
    expect(extensionForMimeType('audio/mpeg')).toBe('mp3');
    expect(extensionForMimeType('audio/wav')).toBe('wav');
    expect(extensionForMimeType('audio/ogg')).toBe('ogg');
  });

  it('normalizes provider aliases without expanding the saved MIME vocabulary', () => {
    expect(normalizeSupportedAudioMimeType('audio/mp3; charset=binary')).toBe('audio/mpeg');
    expect(normalizeSupportedAudioMimeType('audio/x-wav')).toBe('audio/wav');
    expect(normalizeSupportedAudioMimeType('application/ogg')).toBe('audio/ogg');
    expect(normalizeSupportedAudioMimeType('audio/aac')).toBeNull();
  });

  it('creates canonical filenames and rejects MIME/extension mismatches', () => {
    expect(audioFileNameForCue('Beast.Giant Dragon.Roar.01', 'audio/mpeg')).toBe(
      'beast-giant-dragon-roar-01.mp3',
    );
    expect(hasMatchingAudioExtension('dragon-roar.MP3', 'audio/mpeg')).toBe(true);
    expect(hasMatchingAudioExtension('dragon-roar.wav', 'audio/mpeg')).toBe(false);
    expect(hasMatchingAudioExtension('rain.mp3', 'audio/wav')).toBe(false);
  });

  it('computes decoded byte length for padded and whitespace-formatted base64', () => {
    expect(base64ByteLength('AQIDBA==')).toBe(4);
    expect(base64ByteLength('TWE=')).toBe(2);
    expect(base64ByteLength('  AQID\nBA==  ')).toBe(4);
    expect(base64ByteLength('')).toBe(0);
  });
});
