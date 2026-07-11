import type { SupportedAudioMimeType } from '../types/cues';

export const SUPPORTED_AUDIO_MIME_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg'] as const;

const EXTENSIONS: Record<SupportedAudioMimeType, 'mp3' | 'wav' | 'ogg'> = {
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
};

export function isSupportedAudioMimeType(value: unknown): value is SupportedAudioMimeType {
  return typeof value === 'string' && SUPPORTED_AUDIO_MIME_TYPES.includes(value as SupportedAudioMimeType);
}

/** Normalize provider response aliases at ingestion; saved/exported values stay strict. */
export function normalizeSupportedAudioMimeType(value: unknown): SupportedAudioMimeType | null {
  if (typeof value !== 'string') return null;
  const normalized = value.split(';', 1)[0].trim().toLowerCase();
  if (isSupportedAudioMimeType(normalized)) return normalized;
  if (['audio/mp3', 'audio/mpg', 'audio/mpeg3'].includes(normalized)) return 'audio/mpeg';
  if (['audio/x-wav', 'audio/wave'].includes(normalized)) return 'audio/wav';
  if (['audio/x-ogg', 'application/ogg'].includes(normalized)) return 'audio/ogg';
  return null;
}

export function extensionForMimeType(mimeType: SupportedAudioMimeType): 'mp3' | 'wav' | 'ogg' {
  return EXTENSIONS[mimeType];
}

export function downloadFormatForMimeType(value: unknown): { mimeType: string; extension: string } | null {
  const canonical = normalizeSupportedAudioMimeType(value);
  if (canonical) return { mimeType: canonical, extension: extensionForMimeType(canonical) };
  if (typeof value === 'string' && value.split(';', 1)[0].trim().toLowerCase() === 'audio/aac') {
    return { mimeType: 'audio/aac', extension: 'aac' };
  }
  return null;
}

export function sanitizeFileStem(value: string): string {
  const stem = value
    .replace(/\.(?:mp3|wav|ogg)$/i, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return stem || 'cue';
}

export function audioFileNameForCue(cueId: string, mimeType: SupportedAudioMimeType): string {
  return `${sanitizeFileStem(cueId)}.${extensionForMimeType(mimeType)}`;
}

export function hasMatchingAudioExtension(fileName: string, mimeType: SupportedAudioMimeType): boolean {
  const expected = `.${extensionForMimeType(mimeType)}`;
  return fileName.trim().toLowerCase().endsWith(expected);
}

export function base64ByteLength(base64: string): number {
  const compact = base64.replace(/\s/g, '');
  if (!compact) return 0;
  const padding = compact.endsWith('==') ? 2 : compact.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((compact.length * 3) / 4) - padding);
}
