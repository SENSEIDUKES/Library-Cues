import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

let mockLibrary: any[] = [];
let mockKits: any[] = [];

vi.mock('./lib/storage', () => ({
  getSounds: vi.fn(async () => {
    return [...mockLibrary];
  }),
  saveSound: vi.fn(async (sound) => {
    if (!mockLibrary.find(s => s.id === sound.id)) {
      mockLibrary.push(sound);
    } else {
      mockLibrary = mockLibrary.map(s => s.id === sound.id ? sound : s);
    }
  }),
  saveSounds: vi.fn(async (sounds) => {
    sounds.forEach(sound => {
      if (!mockLibrary.find(s => s.id === sound.id)) {
        mockLibrary.push(sound);
      } else {
        mockLibrary = mockLibrary.map(s => s.id === sound.id ? sound : s);
      }
    });
  }),
  deleteSound: vi.fn(async (id) => {
    mockLibrary = mockLibrary.filter(s => s.id !== id);
  }),
  updateSoundName: vi.fn(async (id, newName) => {
    mockLibrary = mockLibrary.map(s => s.id === id ? { ...s, name: newName } : s);
  }),
  getKits: vi.fn(async () => {
    return [...mockKits];
  }),
  saveKit: vi.fn(async (kit) => {
    const existsIdx = mockKits.findIndex(k => k.id === kit.id);
    if (existsIdx > -1) {
      mockKits[existsIdx] = kit;
    } else {
      mockKits.unshift(kit);
    }
  }),
  deleteKit: vi.fn(async (id) => {
    mockKits = mockKits.filter(k => k.id !== id);
  }),
}));

vi.mock('./hooks/useAudioWaveform', () => ({
  useAudioWaveform: vi.fn(() => ({
    isPlaying: false,
    currentTime: 0,
    displayDuration: 4,
    togglePlay: vi.fn(),
    seek: vi.fn(),
    peaks: [],
    playbackRate: 1.0,
    setPlaybackRate: vi.fn(),
    volume: 1.0,
    setVolume: vi.fn(),
  })),
}));

// Mock JSZip
vi.mock('jszip', () => {
  return {
    default: class JSZip {
      file = vi.fn();
      generateAsync = vi.fn(() => Promise.resolve(new Blob()));
    }
  };
});

// Mock file-saver
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockLibrary = [];
    localStorage.clear();
    global.fetch = vi.fn() as any;
    
    // Mock crypto.randomUUID for JSDOM
    if (!global.crypto) {
      (global as any).crypto = {};
    }
    (global.crypto as any).randomUUID = () => Math.random().toString(36).substring(2) + Date.now().toString(36);
  });

  it('renders the initial layout', () => {
    render(<App />);
    expect(screen.getByText('Library Cues')).toBeInTheDocument();
    expect(screen.getByText('Synthesize')).toBeInTheDocument();
  });

  it('can switch tabs to library', async () => {
    render(<App />);
    const libraryTab = screen.getByText('Saved Kit');
    fireEvent.click(libraryTab);
    
    await waitFor(() => {
      expect(screen.getByText('Your library is empty')).toBeInTheDocument();
    });
  });

  it('generates variations successfully', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        audioBase64: 'fake-audio-base64',
        mimeType: 'audio/mpeg',
      }),
    });

    render(<App />);
    
    // Type in prompt
    const input = screen.getByPlaceholderText(/e.g. A guttural/);
    fireEvent.change(input, { target: { value: 'Test prompt' } });

    // Click synthesize
    const synthesizeBtn = screen.getByRole('button', { name: /Variants/i });
    fireEvent.click(synthesizeBtn);

    // Should show loading state
    expect(screen.getByText('Generating...')).toBeInTheDocument();

    // Wait for variations to appear
    await waitFor(() => {
      expect(screen.getAllByDisplayValue(/SFX - Var/i)).toHaveLength(3);
    });
    
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('handles generation error', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'API Error message' }),
    });

    render(<App />);
    
    // Type in prompt
    const input = screen.getByPlaceholderText(/e.g. A guttural/);
    fireEvent.change(input, { target: { value: 'Test prompt' } });

    // Click synthesize
    const synthesizeBtn = screen.getByRole('button', { name: /Variants/i });
    fireEvent.click(synthesizeBtn);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('API Error message')).toBeInTheDocument();
    });
  });

  it('can keep a variation and remove it from library', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        audioBase64: 'fake-audio-base64',
        mimeType: 'audio/mpeg',
      }),
    });

    render(<App />);
    
    // Generate
    const input = screen.getByPlaceholderText(/e.g. A guttural/);
    fireEvent.change(input, { target: { value: 'Test prompt' } });
    fireEvent.click(screen.getByRole('button', { name: /Variants/i }));

    await waitFor(() => {
      expect(screen.getAllByDisplayValue(/SFX - Var/i)).toHaveLength(3);
    });

    // We need to keep a variation. The AudioWaveform component renders an input with the name 'SFX - Var 1'
    // The keep button is the second button inside each AudioWaveform (index 1)
    const var1Input = screen.getByDisplayValue('SFX - Var 1');
    const waveformDiv = var1Input.closest('.group');
    const keepBtn = waveformDiv?.querySelectorAll('button')[1];
    if (keepBtn) {
      fireEvent.click(keepBtn);
    }

    // Now switch to library tab
    fireEvent.click(screen.getByText('Saved Kit'));

    await waitFor(() => {
      // In the library tab, we should see the kept variation
      expect(screen.queryByText('Your library is empty')).not.toBeInTheDocument();
      // Ensure we are fully switched by waiting for Synthesize button to disappear
      expect(screen.queryByRole('button', { name: /Variants/i })).not.toBeInTheDocument();
    });

    // Rename the variation in the library
    const libraryInput = screen.getByDisplayValue('SFX - Var 1');
    fireEvent.change(libraryInput, { target: { value: 'Renamed Var' } });
    await waitFor(() => {
      expect(screen.getByDisplayValue('Renamed Var')).toBeInTheDocument();
    });

    // Remove from library
    // The library tab AudioWaveform delete button
    const renamedInput = screen.getByDisplayValue('Renamed Var');
    const libraryWaveformDiv = renamedInput.closest('.group');
    // find the button with title "Delete"
    const deleteBtn = libraryWaveformDiv?.querySelector('button[title="Delete"]');
    if (deleteBtn) {
      fireEvent.click(deleteBtn);
    }

    await waitFor(() => {
      expect(screen.getByText('Your library is empty')).toBeInTheDocument();
    });

    // Test Open Synthesizer button in empty library
    const openSynthBtn = screen.getByRole('button', { name: /Open Synthesizer/i });
    fireEvent.click(openSynthBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Variants/i })).toBeInTheDocument();
    });

    // Switch back to library using bottom nav
    const libraryNavBtn = screen.getByText('Saved Kit').closest('button');
    if (libraryNavBtn) {
      fireEvent.click(libraryNavBtn);
    }
    await waitFor(() => {
      expect(screen.getByText('Your library is empty')).toBeInTheDocument();
    });

    // Switch back to synthesize using bottom nav
    const synthesizeNavBtn = screen.getByText('Synthesize').closest('button');
    if (synthesizeNavBtn) {
      fireEvent.click(synthesizeNavBtn);
    }
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Variants/i })).toBeInTheDocument();
    });
  });

  it('can reject and rename a variation in the synthesize tab', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        audioBase64: 'fake-audio-base64',
        mimeType: 'audio/mpeg',
      }),
    });

    render(<App />);
    
    // Generate
    const input = screen.getByPlaceholderText(/e.g. A guttural/);
    fireEvent.change(input, { target: { value: 'Test prompt' } });
    fireEvent.click(screen.getByRole('button', { name: /Variants/i }));

    await waitFor(() => {
      expect(screen.getAllByDisplayValue(/SFX - Var/i)).toHaveLength(3);
    });

    // Rename
    const var1Input = screen.getByDisplayValue('SFX - Var 1');
    fireEvent.change(var1Input, { target: { value: 'Renamed Variation' } });
    await waitFor(() => {
      expect(screen.getByDisplayValue('Renamed Variation')).toBeInTheDocument();
    });

    // Reject (delete) variation
    const waveformDiv = screen.getByDisplayValue('Renamed Variation').closest('.group');
    const deleteBtn = waveformDiv?.querySelector('button[title="Delete"]');
    if (deleteBtn) {
      fireEvent.click(deleteBtn);
    }

    await waitFor(() => {
      expect(screen.queryByDisplayValue('Renamed Variation')).not.toBeInTheDocument();
      // Only 2 should remain
      expect(screen.getAllByDisplayValue(/SFX - Var/i)).toHaveLength(2);
    });
  });

  it('can export kit', async () => {
    // Mock local storage to have an item
    const mockLibrary = [{
      id: '1',
      name: 'Saved Sound',
      prompt: 'A test prompt',
      audioBase64: 'fake-audio',
      mimeType: 'audio/mpeg',
      createdAt: Date.now(),
      durationSeconds: 4,
      loop: false
    }];
    localStorage.setItem('library_cues_saved_sounds', JSON.stringify(mockLibrary));

    render(<App />);
    
    // Switch to library tab to see the export button
    fireEvent.click(screen.getByText('Saved Kit'));

    await waitFor(() => {
      expect(screen.getByText('Export Kit')).toBeInTheDocument();
    });

    const exportBtn = screen.getByText('Export Kit');
    fireEvent.click(exportBtn);

    // test that saveAs was called. We mocked file-saver
    const { saveAs } = await import('file-saver');
    await waitFor(() => {
      expect(saveAs).toHaveBeenCalled();
    });
  });

  it('handles keyboard shortcuts in library tab', async () => {
    mockLibrary = [{
      id: '1',
      name: 'Saved Sound 1',
      prompt: 'Prompt 1',
      audioBase64: 'fake-audio-1',
      mimeType: 'audio/mpeg',
      createdAt: Date.now() - 1000,
      durationSeconds: 4,
      loop: false
    }, {
      id: '2',
      name: 'Saved Sound 2',
      prompt: 'Prompt 2',
      audioBase64: 'fake-audio-2',
      mimeType: 'audio/mpeg',
      createdAt: Date.now(),
      durationSeconds: 3,
      loop: true
    }];

    render(<App />);

    // Switch to Saved Kit
    fireEvent.click(screen.getByText('Saved Kit'));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Saved Sound 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Saved Sound 2')).toBeInTheDocument();
    });

    // Press ArrowDown to focus first item
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    
    // Press ArrowDown again to cycle to next item
    fireEvent.keyDown(window, { key: 'ArrowDown' });

    // Press 'a' with metaKey or ctrlKey (Select All)
    fireEvent.keyDown(window, { key: 'a', ctrlKey: true });
    
    // Press Space to toggle play (since we mocked useAudioWaveform playbackRate/volume)
    fireEvent.keyDown(window, { key: ' ' });

    // Press Backspace to trigger delete selected
    fireEvent.keyDown(window, { key: 'Backspace' });
    
    await waitFor(() => {
      // It should show the bulk delete modal
      expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
    });
  });

  it('handles creating sound kits visually', async () => {
    mockLibrary = [{
      id: '1',
      name: 'Saved Sound 1',
      prompt: 'Prompt 1',
      audioBase64: 'fake-audio-1',
      mimeType: 'audio/mpeg',
      createdAt: Date.now() - 1000,
      durationSeconds: 4,
      loop: false
    }];

    render(<App />);

    // Switch to Saved Kit
    fireEvent.click(screen.getByText('Saved Kit'));

    await waitFor(() => {
      expect(screen.getByTitle('Create New Sound Kit')).toBeInTheDocument();
    });

    // Create a sound kit
    const createKitBtn = screen.getByTitle('Create New Sound Kit');
    fireEvent.click(createKitBtn);

    // Type name
    const kitNameInput = screen.getByPlaceholderText(/e.g. Vintage Synth/i);
    fireEvent.change(kitNameInput, { target: { value: 'Synthwave Kit' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: 'Create Kit' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // The kit "Synthwave Kit" should be displayed in the sidebar
      expect(screen.getByText('Synthwave Kit')).toBeInTheDocument();
    });
  });
});
