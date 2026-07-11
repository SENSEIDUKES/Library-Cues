import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteDB, openDB } from 'idb';
import {
  getCueRecords,
  LEGACY_LIBRARY_STORAGE_KEY,
  LIBRARY_CUES_DB_NAME,
  LIBRARY_CUES_STORE_NAME,
  migrateLegacyLocalStorage,
} from '../storage';

const NOW = '2026-07-11T12:00:00.000Z';

const legacy = (id = 'legacy-id') => ({
  id,
  name: 'Saved Sound',
  prompt: 'Distant thunder',
  audioBase64: 'AQIDBA==',
  mimeType: 'audio/mpeg',
  createdAt: 1_700_000_000_000,
  durationSeconds: 3,
  loop: false,
});

const seedRecords = async (...values: Array<Record<string, unknown>>): Promise<void> => {
  const db = await openDB(LIBRARY_CUES_DB_NAME, 1, {
    upgrade(database) {
      database.createObjectStore(LIBRARY_CUES_STORE_NAME, { keyPath: 'id' });
    },
  });
  try {
    const tx = db.transaction(LIBRARY_CUES_STORE_NAME, 'readwrite');
    for (const value of values) await tx.store.put(value);
    await tx.done;
  } finally {
    db.close();
  }
};

const readRawRecords = async (): Promise<unknown[]> => {
  const db = await openDB(LIBRARY_CUES_DB_NAME, 1);
  try {
    return await db.getAll(LIBRARY_CUES_STORE_NAME);
  } finally {
    db.close();
  }
};

describe('cue storage migration', () => {
  beforeEach(async () => {
    await deleteDB(LIBRARY_CUES_DB_NAME);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await deleteDB(LIBRARY_CUES_DB_NAME);
  });

  it('migrates legacy IndexedDB values in place before returning and is idempotent', async () => {
    await seedRecords(legacy());

    const firstLoad = await getCueRecords({ now: NOW });
    const persisted = await readRawRecords();

    expect(firstLoad).toHaveLength(1);
    expect(firstLoad[0].id).toBe('legacy-id');
    expect(firstLoad[0].cue.family).toBe('uncategorized');
    expect(persisted).toEqual(firstLoad);
    expect(persisted).toHaveLength(1);

    const putSpy = vi.spyOn(IDBObjectStore.prototype, 'put');
    const secondLoad = await getCueRecords({ now: '2030-01-01T00:00:00.000Z' });

    expect(secondLoad).toEqual(firstLoad);
    expect(await readRawRecords()).toEqual(firstLoad);
    expect(putSpy).not.toHaveBeenCalled();
  });

  it('removes localStorage only after canonical records are durably written', async () => {
    const storage = {
      getItem: vi.fn(() => JSON.stringify([legacy('local-id')])),
      removeItem: vi.fn(),
    };

    const result = await migrateLegacyLocalStorage(storage, { now: NOW });

    expect(result).toMatchObject({
      sourceFound: true,
      sourceRecordCount: 1,
      writtenRecordCount: 1,
    });
    expect(await readRawRecords()).toEqual(result.records);
    expect(storage.removeItem).toHaveBeenCalledWith(LEGACY_LIBRARY_STORAGE_KEY);
  });

  it('retains localStorage when IndexedDB rejects the durable write', async () => {
    const storage = {
      getItem: vi.fn(() => JSON.stringify([legacy('local-id')])),
      removeItem: vi.fn(),
    };
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(() => {
      throw new DOMException('simulated IndexedDB write failure', 'QuotaExceededError');
    });

    await expect(migrateLegacyLocalStorage(storage, { now: NOW })).rejects.toThrow(
      'simulated IndexedDB write failure',
    );
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it('does not rewrite canonical IndexedDB values during localStorage deduplication', async () => {
    await seedRecords(legacy('same-id'));
    const [canonical] = await getCueRecords({ now: NOW });
    const putSpy = vi.spyOn(IDBObjectStore.prototype, 'put');

    const storage = {
      getItem: vi.fn(() => JSON.stringify([legacy('same-id')])),
      removeItem: vi.fn(),
    };

    const result = await migrateLegacyLocalStorage(storage, { now: NOW });

    expect(result.records).toEqual([canonical]);
    expect(result.writtenRecordCount).toBe(0);
    expect(putSpy).not.toHaveBeenCalled();
    expect(storage.removeItem).toHaveBeenCalledOnce();
  });
});
