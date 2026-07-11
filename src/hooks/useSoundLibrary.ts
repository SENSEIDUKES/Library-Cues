import { useCallback, useEffect, useMemo, useState } from 'react';
import type { StoredCueRecord } from '../types/cues';
import {
  deleteCueRecord,
  deleteCueRecords,
  getCueRecords,
  migrateLegacyLocalStorage,
  saveCueRecord,
} from '../lib/storage';
import { downloadCueKit } from '../lib/cueExport';

export function useSoundLibrary() {
  const [library, setLibrary] = useState<StoredCueRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setStorageError(null);
      let migrationWarning: string | null = null;
      try {
        await migrateLegacyLocalStorage();
      } catch (error) {
        console.error('Unable to migrate legacy cue storage.', error);
        migrationWarning = error instanceof Error ? error.message : 'Unable to migrate legacy cue storage.';
      }
      try {
        const records = await getCueRecords();
        if (active) {
          setLibrary(records);
          setStorageError(migrationWarning);
        }
      } catch (error) {
        console.error('Unable to load the cue library.', error);
        if (active) setStorageError(error instanceof Error ? error.message : 'Unable to load the cue library.');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const handleSaveCueRecord = useCallback(async (record: StoredCueRecord) => {
    await saveCueRecord(record);
    setLibrary((current) => {
      const exists = current.some((item) => item.id === record.id);
      const next = exists
        ? current.map((item) => item.id === record.id ? record : item)
        : [record, ...current];
      return next.sort((left, right) => Date.parse(right.cue.createdAt) - Date.parse(left.cue.createdAt));
    });
  }, []);

  const handleRemoveFromLibrary = useCallback(async (id: string) => {
    await deleteCueRecord(id);
    setLibrary((current) => current.filter((record) => record.id !== id));
  }, []);

  const handleBulkRemoveFromLibrary = useCallback(async (ids: string[]) => {
    await deleteCueRecords(ids);
    const selected = new Set(ids);
    setLibrary((current) => current.filter((record) => !selected.has(record.id)));
  }, []);

  const handleRenameLibraryAsset = useCallback(async (id: string, displayName: string) => {
    const current = library.find((record) => record.id === id);
    if (!current) return;
    const updated: StoredCueRecord = {
      ...current,
      cue: {
        ...current.cue,
        displayName,
        updatedAt: new Date().toISOString(),
      },
    };
    setLibrary((records) => records.map((record) => record.id === id ? updated : record));
    try {
      await saveCueRecord(updated);
    } catch (error) {
      setLibrary((records) => records.map((record) => record.id === id ? current : record));
      setStorageError(error instanceof Error ? error.message : 'Unable to rename this cue.');
      throw error;
    }
  }, [library]);

  const exportKit = useCallback(async (records?: readonly StoredCueRecord[]) => {
    return downloadCueKit(records ?? library, { mode: records === undefined ? 'approved' : 'explicit' });
  }, [library]);

  const approvedCount = useMemo(
    () => library.filter((record) => record.cue.curation.status === 'approved').length,
    [library],
  );

  return {
    library,
    isLoading,
    storageError,
    approvedCount,
    handleSaveCueRecord,
    handleRemoveFromLibrary,
    handleBulkRemoveFromLibrary,
    handleRenameLibraryAsset,
    exportKit,
  };
}
