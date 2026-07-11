import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

let mockLibrary: any[] = [];

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
  deleteSound: vi.fn(async (id) => {
    mockLibrary = mockLibrary.filter(s => s.id !== id);
  }),
  updateSoundName: vi.fn(async (id, newName) => {
    mockLibrary = mockLibrary.map(s => s.id === id ? { ...s, name: newName } : s);
  }),
}));

vi.mock('@seihouse/audio-player', () => ({
  useAudioPlayer: vi.fn(() => ({
    isPlaying: false,
    currentTime: 0,
    duration: 4,
    toggle: vi.fn(),
    seek: vi.fn(),
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
    expect(screen.getByText('Synthesize Sounds')).toBeInTheDocument();
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
    const synthesizeBtn = screen.getByRole('button', { name: /Synthesize Sounds/i });
    fireEvent.click(synthesizeBtn);

    // Should show loading state
    expect(screen.getByText('Synthesizing audio...')).toBeInTheDocument();

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
    const synthesizeBtn = screen.getByRole('button', { name: /Synthesize Sounds/i });
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
    fireEvent.click(screen.getByRole('button', { name: /Synthesize Sounds/i }));

    await waitFor(() => {
      expect(screen.getAllByDisplayValue(/SFX - Var/i)).toHaveLength(3);
    });

    // We need to keep a variation. The AudioWaveform component renders an input with the name 'SFX - Var 1'
    // The keep button is the first button inside each AudioWaveform
    const var1Input = screen.getByDisplayValue('SFX - Var 1');
    const waveformDiv = var1Input.closest('div.p-4');
    const keepBtn = waveformDiv?.querySelectorAll('button')[0];
    if (keepBtn) {
      fireEvent.click(keepBtn);
    }

    // Now switch to library tab
    fireEvent.click(screen.getByText('Saved Kit'));

    await waitFor(() => {
      // In the library tab, we should see the kept variation
      expect(screen.queryByText('Your library is empty')).not.toBeInTheDocument();
      // Ensure we are fully switched by waiting for Synthesize button to disappear
      expect(screen.queryByRole('button', { name: /Synthesize Sounds/i })).not.toBeInTheDocument();
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
    const libraryWaveformDiv = renamedInput.closest('div.p-4');
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
      expect(screen.getByRole('button', { name: /Synthesize Sounds/i })).toBeInTheDocument();
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
      expect(screen.getByRole('button', { name: /Synthesize Sounds/i })).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole('button', { name: /Synthesize Sounds/i }));

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
    const waveformDiv = screen.getByDisplayValue('Renamed Variation').closest('div.p-4');
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
});
