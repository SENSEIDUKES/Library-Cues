import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProfileView } from './ProfileView';
import { GenerationParams, SoundAsset, SoundKit } from '../types';

describe('ProfileView', () => {
  const mockParams: GenerationParams = {
    prompt: 'test prompt',
    durationSeconds: 3.0,
    promptInfluence: 0.7,
    loop: false,
    trimSilence: false,
    normalizeLoudness: false,
    fadeIn: 0,
    fadeOut: 0
  };

  const mockLibrary: SoundAsset[] = [
    {
      id: 'sound-1',
      name: 'Impact FX',
      prompt: 'Heavy metallic impact',
      audioBase64: 'base64',
      mimeType: 'audio/mpeg',
      createdAt: Date.now()
    }
  ];

  const mockKits: SoundKit[] = [
    {
      id: 'kit-1',
      name: 'Cyberpunk FX',
      soundIds: ['sound-1'],
      createdAt: Date.now()
    }
  ];

  const mockSetParams = vi.fn();
  const mockSetViewDensity = vi.fn();
  const mockRunFrequencySweep = vi.fn();
  const mockRunStorageDiagnostic = vi.fn();
  const mockSetDiagLog = vi.fn();
  const mockRunTestSuiteSimulation = vi.fn();
  const mockOnOpenShortcutsOverlay = vi.fn();
  const mockSetIsShortcutsPinned = vi.fn();

  const defaultProps = {
    userEmail: 'amaurylindy@gmail.com',
    userName: 'Amaury Lindy',
    library: mockLibrary,
    kits: mockKits,
    params: mockParams,
    setParams: mockSetParams,
    viewDensity: 'compact' as const,
    setViewDensity: mockSetViewDensity,
    runFrequencySweep: mockRunFrequencySweep,
    synthSweepPlaying: false,
    runStorageDiagnostic: mockRunStorageDiagnostic,
    isDiagRunning: false,
    diagProgress: 0,
    diagLog: ['[IDB] Schema verified'],
    setDiagLog: mockSetDiagLog,
    runTestSuiteSimulation: mockRunTestSuiteSimulation,
    testRunnerState: 'idle' as const,
    testRunnerResults: ['$ vitest run'],
    pressedKeys: new Set(['meta', 'a']),
    onOpenShortcutsOverlay: mockOnOpenShortcutsOverlay,
    isShortcutsPinned: false,
    setIsShortcutsPinned: mockSetIsShortcutsPinned,
  };

  it('renders user information and library stats accurately', () => {
    render(<ProfileView {...defaultProps} />);

    expect(screen.getByText('Amaury Lindy')).toBeInTheDocument();
    expect(screen.getByText('amaurylindy@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('Pro Sound Designer')).toBeInTheDocument();
    expect(screen.getByText('Library Sounds')).toBeInTheDocument();
    expect(screen.getByText('Sound Kits')).toBeInTheDocument();
  });

  it('allows toggling view density', () => {
    render(<ProfileView {...defaultProps} />);

    const spaciousBtn = screen.getByRole('button', { name: /Spacious/i });
    fireEvent.click(spaciousBtn);
    expect(mockSetViewDensity).toHaveBeenCalledWith('comfortable');
  });

  it('allows opening shortcut overlay HUD and pinning', () => {
    render(<ProfileView {...defaultProps} />);

    const openHudBtn = screen.getByRole('button', { name: /Open HUD/i });
    fireEvent.click(openHudBtn);
    expect(mockOnOpenShortcutsOverlay).toHaveBeenCalled();

    const pinBtn = screen.getByRole('button', { name: /Pin Overlay/i });
    fireEvent.click(pinBtn);
    expect(mockSetIsShortcutsPinned).toHaveBeenCalled();
  });

  it('allows switching advanced tabs and triggering diagnostic actions', () => {
    render(<ProfileView {...defaultProps} />);

    // In DSP tab by default
    const sweepBtn = screen.getByRole('button', { name: /Trigger Audio Frequency Sweep/i });
    fireEvent.click(sweepBtn);
    expect(mockRunFrequencySweep).toHaveBeenCalled();

    // Switch to Storage tab
    const storageTabBtn = screen.getByRole('button', { name: /Storage Bench & IDB/i });
    fireEvent.click(storageTabBtn);

    const storageBenchBtn = screen.getByRole('button', { name: /Execute Storage Bench/i });
    fireEvent.click(storageBenchBtn);
    expect(mockRunStorageDiagnostic).toHaveBeenCalled();

    // Switch to Test Runner tab
    const suiteTabBtn = screen.getByRole('button', { name: /Automated Test Runner/i });
    fireEvent.click(suiteTabBtn);

    const runSuiteBtn = screen.getByRole('button', { name: /Run Test Suite/i });
    fireEvent.click(runSuiteBtn);
    expect(mockRunTestSuiteSimulation).toHaveBeenCalled();

    // Switch to Keypress Telemetry tab
    const keysTabBtn = screen.getByRole('button', { name: /Keypress Telemetry/i });
    fireEvent.click(keysTabBtn);
    expect(screen.getByText('Real-time Input Monitor')).toBeInTheDocument();
  });
});
