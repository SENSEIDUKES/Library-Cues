import { openDB } from 'idb';
import { SoundAsset, SoundKit } from '../types';

const DB_NAME = 'LibraryCuesDB';
const STORE_NAME = 'sounds';
const KITS_STORE_NAME = 'kits';

// In-memory fallback if IndexedDB is not supported or is blocked
let memoryFallback: SoundAsset[] = [];
let kitsMemoryFallback: SoundKit[] = [];

let dbPromise: ReturnType<typeof openDB> | null = null;

export const initDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 2, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(KITS_STORE_NAME)) {
          db.createObjectStore(KITS_STORE_NAME, { keyPath: 'id' });
        }
      },
    }).catch(error => {
      console.warn('IndexedDB initialization failed. Falling back to in-memory storage.', error);
      dbPromise = null;
      throw error;
    });
  }
  return await dbPromise;
};

export const saveSound = async (sound: SoundAsset): Promise<void> => {
  return saveSounds([sound]);
};

export const saveSounds = async (sounds: SoundAsset[]): Promise<void> => {
  if (sounds.length === 0) return;
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    sounds.forEach(sound => {
      tx.store.put(sound);
    });
    await tx.done;
  } catch (error) {
    console.error('Failed to batch save sounds to IndexedDB', error);
    sounds.forEach(sound => {
      if (!memoryFallback.find(item => item.id === sound.id)) {
        memoryFallback.unshift(sound);
      } else {
        memoryFallback = memoryFallback.map(item => item.id === sound.id ? sound : item);
      }
    });
  }
};

export const getSounds = async (): Promise<SoundAsset[]> => {
  try {
    const db = await initDB();
    const sounds = await db.getAll(STORE_NAME);
    // Sort sounds by createdAt desc (or keep order if saved sequentially)
    return sounds.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Failed to get sounds from IndexedDB', error);
    return memoryFallback;
  }
};

export const deleteSound = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    await db.delete(STORE_NAME, id);
  } catch (error) {
    console.error('Failed to delete sound from IndexedDB', error);
    memoryFallback = memoryFallback.filter(item => item.id !== id);
  }
};

export const updateSoundName = async (id: string, newName: string): Promise<void> => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const sound = await store.get(id);
    if (sound) {
      sound.name = newName;
      await store.put(sound);
    }
    await tx.done;
  } catch (error) {
    console.error('Failed to update sound name in IndexedDB', error);
    memoryFallback = memoryFallback.map(item => item.id === id ? { ...item, name: newName } : item);
  }
};

export const getKits = async (): Promise<SoundKit[]> => {
  try {
    const db = await initDB();
    const kits = await db.getAll(KITS_STORE_NAME);
    return kits.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Failed to get kits from IndexedDB', error);
    return kitsMemoryFallback;
  }
};

export const saveKit = async (kit: SoundKit): Promise<void> => {
  try {
    const db = await initDB();
    const tx = db.transaction(KITS_STORE_NAME, 'readwrite');
    await tx.store.put(kit);
    await tx.done;
  } catch (error) {
    console.error('Failed to save kit to IndexedDB', error);
    const existingIndex = kitsMemoryFallback.findIndex(k => k.id === kit.id);
    if (existingIndex > -1) {
      kitsMemoryFallback[existingIndex] = kit;
    } else {
      kitsMemoryFallback.unshift(kit);
    }
  }
};

export const deleteKit = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    await db.delete(KITS_STORE_NAME, id);
  } catch (error) {
    console.error('Failed to delete kit from IndexedDB', error);
    kitsMemoryFallback = kitsMemoryFallback.filter(k => k.id !== id);
  }
};
