import { openDB } from 'idb';
import { SoundAsset } from '../types';

const DB_NAME = 'LibraryCuesDB';
const STORE_NAME = 'sounds';

// In-memory fallback if IndexedDB is not supported or is blocked
let memoryFallback: SoundAsset[] = [];

export const initDB = async () => {
  try {
    return await openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  } catch (error) {
    console.warn('IndexedDB initialization failed. Falling back to in-memory storage.', error);
    throw error;
  }
};

export const saveSound = async (sound: SoundAsset): Promise<void> => {
  try {
    const db = await initDB();
    await db.put(STORE_NAME, sound);
  } catch (error) {
    console.error('Failed to save sound to IndexedDB', error);
    // Sync with fallback
    if (!memoryFallback.find(item => item.id === sound.id)) {
      memoryFallback.unshift(sound);
    } else {
      memoryFallback = memoryFallback.map(item => item.id === sound.id ? sound : item);
    }
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
