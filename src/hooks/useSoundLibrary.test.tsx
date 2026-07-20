import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSoundLibrary } from './useSoundLibrary';
import { SoundAsset } from '../types';

// Setup Mock library state
let mockDBState: SoundAsset[] = [];

const { mockZipFile, mockZipGenerateAsync, mockSaveAs } = vi.hoisted(() => ({
  mockZipFile: vi.fn(),
  mockZipGenerateAsync: vi.fn(() => Promise.resolve(new Blob())),
  mockSaveAs: vi.fn(),
}));

// Mock lib/storage
vi.mock('../lib/storage', () => ({
  getSounds: vi.fn(async () => {
    return [...mockDBState];
  }),
  saveSound: vi.fn(async (sound: SoundAsset) => {
    const existsIdx = mockDBState.findIndex(s => s.id === sound.id);
    if (existsIdx > -1) {
      mockDBState[existsIdx] = sound;
    } else {
      mockDBState.unshift(sound);
    }
  }),
  deleteSound: vi.fn(async (id: string) => {
    mockDBState = mockDBState.filter(s => s.id !== id);
  }),
  updateSoundName: vi.fn(async (id: string, newName: string) => {
    mockDBState = mockDBState.map(s => s.id === id ? { ...s, name: newName } : s);
  }),
}));

// Mock JSZip
vi.mock('jszip', () => {
  return {
    default: class JSZip {
      file = mockZipFile;
      generateAsync = mockZipGenerateAsync;
    }
  };
});

// Mock file-saver
vi.mock('file-saver', () => ({
  saveAs: mockSaveAs,
}));

describe('useSoundLibrary', () => {
  const testSound: SoundAsset = {
    id: 'id1',
    name: 'Drum Loop',
    prompt: 'A funky drum beat',
    audioBase64: 'fake-audio-1',
    mimeType: 'audio/mp3',
    createdAt: 1000,
    durationSeconds: 4,
    loop: false,
  };

  const testSound2: SoundAsset = {
    id: 'id2',
    name: 'Synth Bass',
    prompt: 'Fat analog bassline',
    audioBase64: 'fake-audio-2',
    mimeType: 'audio/wav',
    createdAt: 2000,
    durationSeconds: 2,
    loop: true,
  };

  beforeEach(() => {
    mockDBState = [];
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes the library from storage', async () => {
    mockDBState = [testSound2, testSound];

    const { result } = renderHook(() => useSoundLibrary());

    // Should load initial sounds
    await waitFor(() => {
      expect(result.current.library).toHaveLength(2);
    });

    expect(result.current.library[0]).toEqual(testSound2);
  });

  it('migrates legacy sounds from localStorage if they exist', async () => {
    localStorage.setItem('library_cues_saved_sounds', JSON.stringify([testSound]));

    const { result } = renderHook(() => useSoundLibrary());

    await waitFor(() => {
      expect(result.current.library).toHaveLength(1);
    });

    expect(result.current.library[0]).toEqual(testSound);
    expect(localStorage.getItem('library_cues_saved_sounds')).toBeNull();
  });

  it('handles keeping a new sound asset', async () => {
    const { getSounds } = await import('../lib/storage');
    const { result } = renderHook(() => useSoundLibrary());

    await waitFor(() => {
      expect(getSounds).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.handleKeep(testSound);
    });

    expect(result.current.library).toHaveLength(1);
    expect(result.current.library[0]).toEqual(testSound);
  });

  it('does not keep duplicate sound assets', async () => {
    const { getSounds } = await import('../lib/storage');
    const { result } = renderHook(() => useSoundLibrary());

    await waitFor(() => {
      expect(getSounds).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.handleKeep(testSound);
    });

    await act(async () => {
      await result.current.handleKeep(testSound);
    });

    expect(result.current.library).toHaveLength(1);
  });

  it('handles removing a sound asset from the library', async () => {
    mockDBState = [testSound];
    const { getSounds } = await import('../lib/storage');
    const { result } = renderHook(() => useSoundLibrary());

    await waitFor(() => {
      expect(getSounds).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.handleRemoveFromLibrary('id1');
    });

    expect(result.current.library).toHaveLength(0);
  });

  it('handles bulk removing sound assets from the library', async () => {
    mockDBState = [testSound, testSound2];
    const { getSounds } = await import('../lib/storage');
    const { result } = renderHook(() => useSoundLibrary());

    await waitFor(() => {
      expect(getSounds).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.handleBulkRemoveFromLibrary(['id1', 'id2']);
    });

    expect(result.current.library).toHaveLength(0);
  });

  it('handles renaming a library asset', async () => {
    mockDBState = [testSound];
    const { getSounds } = await import('../lib/storage');
    const { result } = renderHook(() => useSoundLibrary());

    await waitFor(() => {
      expect(getSounds).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.handleRenameLibraryAsset('id1', 'New Drum Loop Name');
    });

    expect(result.current.library[0].name).toBe('New Drum Loop Name');
  });

  it('handles updating a library asset completely', async () => {
    mockDBState = [testSound];
    const { getSounds } = await import('../lib/storage');
    const { result } = renderHook(() => useSoundLibrary());

    await waitFor(() => {
      expect(getSounds).toHaveBeenCalled();
    });

    const updated = { ...testSound, name: 'Cool Drums', loop: true };

    await act(async () => {
      await result.current.handleUpdateAsset(updated);
    });

    expect(result.current.library[0].name).toBe('Cool Drums');
    expect(result.current.library[0].loop).toBe(true);
  });

  it('exports kit by generating and downloading a ZIP', async () => {
    mockDBState = [
      testSound,
      { ...testSound2, mimeType: 'audio/ogg' },
      { ...testSound, id: 'id3', name: 'AAC Sound', mimeType: 'audio/aac' },
      { ...testSound, id: 'id4', name: 'WAV Sound', mimeType: 'audio/wav' }
    ];
    const { result } = renderHook(() => useSoundLibrary());

    await waitFor(() => {
      expect(result.current.library).toHaveLength(4);
    });

    await act(async () => {
      await result.current.exportKit();
    });

    expect(mockZipFile).toHaveBeenCalledTimes(4);
    expect(mockZipFile).toHaveBeenCalledWith('Sounds/Drum_Loop.mp3', 'fake-audio-1', { base64: true });
    expect(mockZipFile).toHaveBeenCalledWith('Sounds/Synth_Bass.ogg', 'fake-audio-2', { base64: true });
    expect(mockZipFile).toHaveBeenCalledWith('Sounds/AAC_Sound.aac', 'fake-audio-1', { base64: true });
    expect(mockZipFile).toHaveBeenCalledWith('Sounds/WAV_Sound.wav', 'fake-audio-1', { base64: true });
    
    expect(mockZipGenerateAsync).toHaveBeenCalledWith({ type: 'blob' });
    expect(mockSaveAs).toHaveBeenCalled();
  });

  it('exports kit using a specific subset of assets if provided', async () => {
    mockDBState = [testSound, testSound2];
    const { result } = renderHook(() => useSoundLibrary());

    await waitFor(() => {
      expect(result.current.library).toHaveLength(2);
    });

    await act(async () => {
      await result.current.exportKit([testSound2]);
    });

    // Should only have zipped testSound2
    expect(mockZipFile).toHaveBeenCalledTimes(1);
    expect(mockZipFile).toHaveBeenCalledWith('Sounds/Synth_Bass.wav', 'fake-audio-2', { base64: true });
  });

  it('does not export if library is empty and no custom assets provided', async () => {
    const { result } = renderHook(() => useSoundLibrary());

    await act(async () => {
      await result.current.exportKit();
    });

    expect(mockZipFile).not.toHaveBeenCalled();
    expect(mockSaveAs).not.toHaveBeenCalled();
  });
});
