import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SoundAsset } from '../types';

// Create a mock store and a mock db to test the IndexedDB operations.
let mockStore: Record<string, any> = {};
let shouldIdbFail = false;

const mockGet = vi.fn(async (id: string) => {
  if (shouldIdbFail) throw new Error('IndexedDB get failed');
  return mockStore[id];
});
const mockPut = vi.fn(async (val: any) => {
  if (shouldIdbFail) throw new Error('IndexedDB put failed');
  mockStore[val.id] = val;
});
const mockDelete = vi.fn(async (id: string) => {
  if (shouldIdbFail) throw new Error('IndexedDB delete failed');
  delete mockStore[id];
});
const mockGetAll = vi.fn(async () => {
  if (shouldIdbFail) throw new Error('IndexedDB getAll failed');
  return Object.values(mockStore);
});

const mockTx = {
  store: {
    put: mockPut,
    get: mockGet,
    delete: mockDelete,
  },
  objectStore: vi.fn(() => ({
    get: mockGet,
    put: mockPut,
  })),
  done: Promise.resolve(),
};

const mockDb = {
  put: vi.fn(async (store: string, sound: any) => {
    if (shouldIdbFail) throw new Error('IndexedDB put failed');
    mockStore[sound.id] = sound;
  }),
  getAll: vi.fn(async (store: string) => {
    if (shouldIdbFail) throw new Error('IndexedDB getAll failed');
    return Object.values(mockStore);
  }),
  delete: vi.fn(async (store: string, id: string) => {
    if (shouldIdbFail) throw new Error('IndexedDB delete failed');
    delete mockStore[id];
  }),
  transaction: vi.fn(() => {
    if (shouldIdbFail) throw new Error('IndexedDB transaction failed');
    return mockTx;
  }),
};

// Mock the openDB function from 'idb'
vi.mock('idb', () => ({
  openDB: vi.fn(async () => {
    if (shouldIdbFail) {
      throw new Error('IndexedDB blocked');
    }
    return mockDb;
  }),
}));

// Import after mocking idb
import { getSounds, saveSound, deleteSound, updateSoundName } from './storage';

describe('storage utilities', () => {
  const testSound: SoundAsset = {
    id: 's1',
    name: 'Kick Sound',
    prompt: 'A short kick drum',
    audioBase64: 'kick-base64',
    mimeType: 'audio/wav',
    createdAt: 1000,
    durationSeconds: 1.5,
    loop: false,
  };

  const testSound2: SoundAsset = {
    id: 's2',
    name: 'Snare Sound',
    prompt: 'A crisp snare',
    audioBase64: 'snare-base64',
    mimeType: 'audio/wav',
    createdAt: 2000,
    durationSeconds: 2.0,
    loop: false,
  };

  beforeEach(() => {
    mockStore = {};
    shouldIdbFail = false;
    vi.clearAllMocks();
  });

  describe('IndexedDB successful path', () => {
    it('saves a sound and retrieves it, sorted by createdAt descending', async () => {
      await saveSound(testSound);
      await saveSound(testSound2);

      const sounds = await getSounds();
      expect(sounds).toHaveLength(2);
      // Sorted desc by createdAt, so testSound2 (2000) should be first
      expect(sounds[0].id).toBe('s2');
      expect(sounds[1].id).toBe('s1');
    });

    it('deletes a sound successfully', async () => {
      await saveSound(testSound);
      await saveSound(testSound2);

      await deleteSound('s1');

      const sounds = await getSounds();
      expect(sounds).toHaveLength(1);
      expect(sounds[0].id).toBe('s2');
    });

    it('updates a sound name', async () => {
      await saveSound(testSound);
      await updateSoundName('s1', 'Ultra Kick');

      const sounds = await getSounds();
      expect(sounds[0].name).toBe('Ultra Kick');
    });
  });

  describe('In-memory fallback path (when IndexedDB fails)', () => {
    beforeEach(() => {
      shouldIdbFail = true;
    });

    it('falls back to in-memory state when operations fail', async () => {
      // Save
      await saveSound(testSound);
      await saveSound(testSound2);

      // Get
      const sounds = await getSounds();
      expect(sounds).toHaveLength(2);
      // The fallback does unshift for new items, so testSound2 (saved second) is at the front
      expect(sounds[0].id).toBe('s2');

      // Update name
      await updateSoundName('s2', 'Fallback Snare');
      const updatedSounds = await getSounds();
      expect(updatedSounds.find(s => s.id === 's2')?.name).toBe('Fallback Snare');

      // Delete
      await deleteSound('s1');
      const finalSounds = await getSounds();
      expect(finalSounds).toHaveLength(1);
      expect(finalSounds[0].id).toBe('s2');
    });
  });
});
