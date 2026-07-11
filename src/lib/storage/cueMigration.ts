import type {
  LibraryCueAsset,
  StoredCueRecord,
  SupportedAudioMimeType,
} from '../../types/cues';

export interface LegacySoundAsset {
  id: string;
  name?: string;
  prompt?: string;
  audioBase64: string;
  mimeType?: string;
  createdAt?: number | string;
  updatedAt?: number | string;
  durationSeconds?: number;
  loop?: boolean;
  sampleRate?: number;
  fileSize?: number;
  previousAudioBase64?: string;
  peaks?: number[];
}

export interface CueMigrationOptions {
  now?: Date | number | string;
  existingCueIds?: Iterable<string>;
}

export interface MigratedCueRecord {
  record: StoredCueRecord;
  migrated: boolean;
}

export interface CueMigrationBatch {
  records: StoredCueRecord[];
  migratedIds: string[];
}

const FALLBACK_CUE_ID_BASE = 'object.uncategorized.unknown';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isStoredCueRecord = (value: unknown): value is StoredCueRecord => {
  if (!isObject(value) || typeof value.id !== 'string' || typeof value.audioBase64 !== 'string') {
    return false;
  }

  const cue = value.cue;
  return isObject(cue) && typeof cue.id === 'string' && typeof cue.version === 'number';
};

const requireLegacyRecord = (value: unknown): LegacySoundAsset => {
  if (!isObject(value)) {
    throw new TypeError('Legacy cue record must be an object.');
  }

  if (typeof value.id !== 'string' || value.id.trim().length === 0) {
    throw new TypeError('Legacy cue record must have a non-empty id.');
  }

  if (typeof value.audioBase64 !== 'string') {
    throw new TypeError(`Legacy cue record "${value.id}" is missing audioBase64.`);
  }

  return value as unknown as LegacySoundAsset;
};

const toIsoTimestamp = (
  value: number | string | undefined,
  fallback: string,
): string => {
  if (value === undefined || value === '') return fallback;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
};

const resolveNow = (now: CueMigrationOptions['now']): string => {
  const date = now === undefined
    ? new Date()
    : now instanceof Date
      ? new Date(now.getTime())
      : new Date(now);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError('Cue migration requires a valid `now` timestamp.');
  }
  return date.toISOString();
};

const normalizeLegacyMimeType = (mimeType: string | undefined): string => {
  const normalized = mimeType?.trim().toLowerCase();
  switch (normalized) {
    case 'audio/mp3':
    case 'audio/mpg':
    case 'audio/mpeg3':
      return 'audio/mpeg';
    case 'audio/x-wav':
    case 'audio/wave':
      return 'audio/wav';
    case 'audio/x-ogg':
    case 'application/ogg':
      return 'audio/ogg';
    default:
      // Preserve unknown legacy MIME values. Runtime validation will keep them
      // out of exports instead of relabelling possibly incompatible audio bytes.
      return normalized || 'application/octet-stream';
  }
};

const extensionForMimeType = (mimeType: string): string => {
  switch (mimeType) {
    case 'audio/mpeg':
      return 'mp3';
    case 'audio/wav':
      return 'wav';
    case 'audio/ogg':
      return 'ogg';
    default:
      return 'bin';
  }
};

const fileStem = (name: string): string => {
  const withoutExtension = name.replace(/\.[a-z0-9]{1,8}$/i, '');
  const sanitized = withoutExtension
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return sanitized || 'legacy-cue';
};

const approximateBase64ByteLength = (base64: string): number => {
  const compact = base64.replace(/\s/g, '');
  if (compact.length === 0) return 0;
  const padding = compact.endsWith('==') ? 2 : compact.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((compact.length * 3) / 4) - padding);
};

const finiteNonNegative = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

const allocateFallbackCueId = (usedCueIds: Set<string>): string => {
  let suffix = 1;
  let candidate = `${FALLBACK_CUE_ID_BASE}.${String(suffix).padStart(2, '0')}`;
  while (usedCueIds.has(candidate)) {
    suffix += 1;
    candidate = `${FALLBACK_CUE_ID_BASE}.${String(suffix).padStart(2, '0')}`;
  }
  usedCueIds.add(candidate);
  return candidate;
};

const buildLegacyCue = (
  legacy: LegacySoundAsset,
  cueId: string,
  now: string,
): LibraryCueAsset => {
  const displayName = legacy.name?.trim() || 'Untitled legacy cue';
  const prompt = legacy.prompt ?? '';
  const createdAt = toIsoTimestamp(legacy.createdAt, now);
  const updatedAt = toIsoTimestamp(legacy.updatedAt, createdAt);
  const mimeType = normalizeLegacyMimeType(legacy.mimeType);
  const durationSeconds = finiteNonNegative(legacy.durationSeconds)
    ? legacy.durationSeconds
    : 0;
  const fileSizeBytes = finiteNonNegative(legacy.fileSize)
    ? Math.round(legacy.fileSize)
    : approximateBase64ByteLength(legacy.audioBase64);
  const isLoop = legacy.loop === true;

  return {
    id: cueId,
    version: 1,
    displayName,
    audio: {
      fileName: `${fileStem(displayName)}.${extensionForMimeType(mimeType)}`,
      // Unsupported legacy values deliberately remain visible to validation.
      mimeType: mimeType as SupportedAudioMimeType,
      durationMs: Math.round(durationSeconds * 1000),
      fileSizeBytes,
    },
    category: 'object',
    family: 'uncategorized',
    action: 'unknown',
    playback: {
      type: isLoop ? 'loop' : 'one-shot',
      loopable: isLoop,
      defaultVolume: 1,
      ...(isLoop ? { fadeInMs: 1500, fadeOutMs: 1500 } : {}),
    },
    narrative: {
      tags: ['migrated'],
    },
    source: {
      provider: 'elevenlabs',
      prompt,
      ...(finiteNonNegative(legacy.durationSeconds)
        ? { requestedDurationSeconds: legacy.durationSeconds }
        : {}),
      requestedLoop: isLoop,
      generatedAt: createdAt,
    },
    curation: {
      status: 'candidate',
      notes: 'Migrated from legacy Library Cues storage.',
    },
    createdAt,
    updatedAt,
  };
};

/**
 * Converts legacy records as one deterministic batch. Canonical wrappers are
 * returned by reference and are never timestamp-bumped or otherwise rewritten.
 */
export const migrateCueRecords = (
  values: readonly unknown[],
  options: CueMigrationOptions = {},
): CueMigrationBatch => {
  const now = resolveNow(options.now);
  const results: StoredCueRecord[] = new Array(values.length);
  const migratedIds: string[] = [];
  const usedCueIds = new Set(options.existingCueIds ?? []);
  const legacyEntries: Array<{ index: number; legacy: LegacySoundAsset }> = [];
  const storageIds = new Set<string>();

  values.forEach((value, index) => {
    if (isStoredCueRecord(value)) {
      if (storageIds.has(value.id)) {
        throw new Error(`Duplicate stored cue id "${value.id}".`);
      }
      storageIds.add(value.id);
      usedCueIds.add(value.cue.id);
      results[index] = value;
      return;
    }

    const legacy = requireLegacyRecord(value);
    if (storageIds.has(legacy.id)) {
      throw new Error(`Duplicate stored cue id "${legacy.id}".`);
    }
    storageIds.add(legacy.id);
    legacyEntries.push({ index, legacy });
  });

  // IndexedDB key order and localStorage array order must not influence public
  // cue IDs. Sorting only controls allocation; results retain input order.
  legacyEntries
    .sort((left, right) => left.legacy.id.localeCompare(right.legacy.id))
    .forEach(({ index, legacy }) => {
      const record: StoredCueRecord = {
        id: legacy.id,
        cue: buildLegacyCue(legacy, allocateFallbackCueId(usedCueIds), now),
        audioBase64: legacy.audioBase64,
        ...(typeof legacy.previousAudioBase64 === 'string'
          ? { previousAudioBase64: legacy.previousAudioBase64 }
          : {}),
        ...(Array.isArray(legacy.peaks) && legacy.peaks.every(Number.isFinite)
          ? { peaks: [...legacy.peaks] }
          : {}),
        ...(finiteNonNegative(legacy.sampleRate) ? { sampleRate: legacy.sampleRate } : {}),
      };

      results[index] = record;
      migratedIds.push(record.id);
    });

  return { records: results, migratedIds };
};

export const migrateCueRecord = (
  value: unknown,
  options: CueMigrationOptions = {},
): MigratedCueRecord => {
  const batch = migrateCueRecords([value], options);
  return {
    record: batch.records[0],
    migrated: batch.migratedIds.length === 1,
  };
};
