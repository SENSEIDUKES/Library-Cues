import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { StoredCueRecord } from '../types/cues';
import {
  isStoredCueRecord,
  migrateCueRecords,
  type CueMigrationOptions,
  type LegacySoundAsset,
} from './storage/cueMigration';

export const LIBRARY_CUES_DB_NAME = 'LibraryCuesDB';
export const LIBRARY_CUES_DB_VERSION = 1;
export const LIBRARY_CUES_STORE_NAME = 'sounds';
export const LEGACY_LIBRARY_STORAGE_KEY = 'library_cues_saved_sounds';

type PersistedCueValue = StoredCueRecord | LegacySoundAsset;

interface LibraryCuesDatabase extends DBSchema {
  sounds: {
    key: string;
    value: PersistedCueValue;
  };
}

export interface LegacyLocalStorage {
  getItem(key: string): string | null;
  removeItem(key: string): void;
}

export interface LocalStorageMigrationResult {
  sourceFound: boolean;
  sourceRecordCount: number;
  writtenRecordCount: number;
  records: StoredCueRecord[];
}

const defaultLocalStorage = (): LegacyLocalStorage => {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new Error('localStorage is unavailable in this environment.');
  }
  return window.localStorage;
};

export const initDB = async (): Promise<IDBPDatabase<LibraryCuesDatabase>> =>
  openDB<LibraryCuesDatabase>(LIBRARY_CUES_DB_NAME, LIBRARY_CUES_DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(LIBRARY_CUES_STORE_NAME)) {
        db.createObjectStore(LIBRARY_CUES_STORE_NAME, { keyPath: 'id' });
      }
    },
  });

const sortNewestFirst = (records: StoredCueRecord[]): StoredCueRecord[] =>
  [...records].sort((left, right) => {
    const leftTime = Date.parse(left.cue.createdAt);
    const rightTime = Date.parse(right.cue.createdAt);
    return (Number.isFinite(rightTime) ? rightTime : 0) -
      (Number.isFinite(leftTime) ? leftTime : 0);
  });

const assertCanonicalRecord = (record: StoredCueRecord): void => {
  if (!isStoredCueRecord(record)) {
    throw new TypeError('Only canonical StoredCueRecord values may be saved.');
  }
};

/**
 * Reads every record, converts legacy values as one deterministic batch, and
 * durably rewrites only converted records under their existing top-level keys.
 */
export const getCueRecords = async (
  migrationOptions: CueMigrationOptions = {},
): Promise<StoredCueRecord[]> => {
  const db = await initDB();
  try {
    const tx = db.transaction(LIBRARY_CUES_STORE_NAME, 'readwrite');
    const rawRecords = await tx.store.getAll();
    const migration = migrateCueRecords(rawRecords, migrationOptions);
    const migratedIds = new Set(migration.migratedIds);

    for (const record of migration.records) {
      if (migratedIds.has(record.id)) {
        await tx.store.put(record);
      }
    }

    await tx.done;
    return sortNewestFirst(migration.records);
  } finally {
    db.close();
  }
};

export const saveCueRecords = async (records: readonly StoredCueRecord[]): Promise<void> => {
  const ids = new Set<string>();
  records.forEach((record) => {
    assertCanonicalRecord(record);
    if (ids.has(record.id)) {
      throw new Error(`Duplicate stored cue id "${record.id}".`);
    }
    ids.add(record.id);
  });

  const db = await initDB();
  try {
    const tx = db.transaction(LIBRARY_CUES_STORE_NAME, 'readwrite');
    for (const record of records) {
      await tx.store.put(record);
    }
    await tx.done;
  } finally {
    db.close();
  }
};

export const saveCueRecord = async (record: StoredCueRecord): Promise<void> => {
  await saveCueRecords([record]);
};

export const deleteCueRecords = async (ids: readonly string[]): Promise<void> => {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return;

  const db = await initDB();
  try {
    const tx = db.transaction(LIBRARY_CUES_STORE_NAME, 'readwrite');
    for (const id of uniqueIds) {
      await tx.store.delete(id);
    }
    await tx.done;
  } finally {
    db.close();
  }
};

export const deleteCueRecord = async (id: string): Promise<void> => {
  await deleteCueRecords([id]);
};

const recordId = (value: unknown): string => {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('id' in value) ||
    typeof value.id !== 'string' ||
    value.id.trim().length === 0
  ) {
    throw new TypeError('Every localStorage cue record must have a non-empty id.');
  }
  return value.id;
};

/**
 * Moves the former localStorage array into IndexedDB. The source key is removed
 * only after the readwrite transaction completes, so a failed or blocked write
 * leaves the recoverable source untouched. Re-running is safe: existing IDB
 * keys win unless localStorage contains a canonical replacement for a legacy
 * value under that same key.
 */
export const migrateLegacyLocalStorage = async (
  storage: LegacyLocalStorage = defaultLocalStorage(),
  migrationOptions: CueMigrationOptions = {},
  storageKey = LEGACY_LIBRARY_STORAGE_KEY,
): Promise<LocalStorageMigrationResult> => {
  const serialized = storage.getItem(storageKey);
  if (serialized === null) {
    return {
      sourceFound: false,
      sourceRecordCount: 0,
      writtenRecordCount: 0,
      records: [],
    };
  }

  const parsed: unknown = JSON.parse(serialized);
  if (!Array.isArray(parsed)) {
    throw new TypeError(`Legacy localStorage key "${storageKey}" must contain an array.`);
  }

  const sourceIds = new Set<string>();
  parsed.forEach((value) => {
    const id = recordId(value);
    if (sourceIds.has(id)) {
      throw new Error(`Duplicate localStorage cue id "${id}".`);
    }
    sourceIds.add(id);
  });

  const db = await initDB();
  let records: StoredCueRecord[] = [];
  let writtenRecordCount = 0;

  try {
    const tx = db.transaction(LIBRARY_CUES_STORE_NAME, 'readwrite');
    const existing = await tx.store.getAll();
    const combined: unknown[] = [...existing];
    const indexById = new Map(existing.map((value, index) => [recordId(value), index]));
    const writeIndexes = new Set<number>();

    for (const sourceValue of parsed) {
      const id = recordId(sourceValue);
      const existingIndex = indexById.get(id);
      if (existingIndex === undefined) {
        indexById.set(id, combined.length);
        combined.push(sourceValue);
        writeIndexes.add(combined.length - 1);
        continue;
      }

      // Prefer already-durable canonical data. If IndexedDB still contains a
      // legacy value and localStorage has its canonical successor, promote it.
      if (!isStoredCueRecord(combined[existingIndex]) && isStoredCueRecord(sourceValue)) {
        combined[existingIndex] = sourceValue;
        writeIndexes.add(existingIndex);
      }
    }

    const migration = migrateCueRecords(combined, migrationOptions);
    const migratedIds = new Set(migration.migratedIds);
    migration.records.forEach((record, index) => {
      if (migratedIds.has(record.id)) writeIndexes.add(index);
    });

    for (const index of writeIndexes) {
      await tx.store.put(migration.records[index]);
      writtenRecordCount += 1;
    }

    await tx.done;
    records = sortNewestFirst(migration.records);
  } finally {
    db.close();
  }

  // This must remain after `tx.done`; moving it earlier can destroy the only
  // durable copy when IndexedDB rejects or aborts a write.
  storage.removeItem(storageKey);

  return {
    sourceFound: true,
    sourceRecordCount: parsed.length,
    writtenRecordCount,
    records,
  };
};
