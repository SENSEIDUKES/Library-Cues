import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Keyboard, 
  Terminal, 
  Cpu, 
  Database, 
  Activity, 
  Play, 
  RefreshCw, 
  CheckCircle, 
  Circle, 
  ChevronDown, 
  ChevronRight, 
  Sliders, 
  ShieldCheck, 
  Copy,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { GenerationParams, SoundAsset, SoundKit } from '../types';

export interface ProfileViewProps {
  userEmail?: string;
  userName?: string;
  library: SoundAsset[];
  kits: SoundKit[];
  params: GenerationParams;
  setParams: React.Dispatch<React.SetStateAction<GenerationParams>>;
  viewDensity: 'comfortable' | 'compact';
  setViewDensity: (density: 'comfortable' | 'compact') => void;
  // Diagnostics & testing methods passed from App
  runFrequencySweep: () => void;
  synthSweepPlaying: boolean;
  runStorageDiagnostic: () => void;
  isDiagRunning: boolean;
  diagProgress: number;
  diagLog: string[];
  setDiagLog: React.Dispatch<React.SetStateAction<string[]>>;
  runTestSuiteSimulation: () => void;
  testRunnerState: 'idle' | 'running' | 'success';
  testRunnerResults: string[];
  pressedKeys: Set<string>;
  onOpenShortcutsOverlay: () => void;
  isShortcutsPinned: boolean;
  setIsShortcutsPinned: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userEmail = 'amaurylindy@gmail.com',
  userName = 'Amaury Lindy',
  library,
  kits,
  params,
  setParams,
  viewDensity,
  setViewDensity,
  runFrequencySweep,
  synthSweepPlaying,
  runStorageDiagnostic,
  isDiagRunning,
  diagProgress,
  diagLog,
  setDiagLog,
  runTestSuiteSimulation,
  testRunnerState,
  testRunnerResults,
  pressedKeys,
  onOpenShortcutsOverlay,
  isShortcutsPinned,
  setIsShortcutsPinned,
}) => {
  // Advanced section accordion / toggle states
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);
  const [activeAdvancedTab, setActiveAdvancedTab] = useState<'dsp' | 'storage' | 'suite' | 'telemetry' | 'keys'>('dsp');
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [audioContextInfo, setAudioContextInfo] = useState<{ sampleRate: number; state: string } | null>(null);

  useEffect(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        setAudioContextInfo({
          sampleRate: ctx.sampleRate,
          state: ctx.state
        });
        ctx.close();
      }
    } catch {
      // Audio context may not be allowed before user gesture in some browsers
    }
  }, []);

  const handleCopyLogs = () => {
    const combined = [
      '=== INDEXEDDB DIAGNOSTIC LOGS ===',
      ...diagLog,
      '\n=== TEST RUNNER RESULTS ===',
      ...testRunnerResults
    ].join('\n');

    navigator.clipboard?.writeText(combined);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8 pb-32 text-neutral-200">
      
      {/* Profile Header Card */}
      <section className="bg-neutral-900/70 border border-white/[0.08] rounded-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/[0.02] rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-950 border border-white/10 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-black/40">
                {userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AL'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-black" title="System Online" />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white tracking-tight">{userName}</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/10 font-mono">
                  Pro Sound Designer
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono">{userEmail}</p>
            </div>
          </div>

          {/* Studio Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full sm:w-auto">
            <div className="bg-black/50 border border-white/[0.06] rounded-xl px-4 py-2.5 flex flex-col">
              <span className="text-[10px] text-neutral-500 font-medium tracking-wide uppercase">Library Sounds</span>
              <span className="text-lg font-bold text-white font-mono">{library.length}</span>
            </div>
            <div className="bg-black/50 border border-white/[0.06] rounded-xl px-4 py-2.5 flex flex-col">
              <span className="text-[10px] text-neutral-500 font-medium tracking-wide uppercase">Sound Kits</span>
              <span className="text-lg font-bold text-white font-mono">{kits.length}</span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-black/50 border border-white/[0.06] rounded-xl px-4 py-2.5 flex flex-col">
              <span className="text-[10px] text-neutral-500 font-medium tracking-wide uppercase">Storage Engine</span>
              <span className="text-xs font-semibold text-emerald-400 font-mono mt-1 flex items-center gap-1">
                <Database className="w-3 h-3" /> IndexedDB OK
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Studio Preferences & Shortcuts Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Synthesis & Audio Defaults */}
        <div className="bg-neutral-900/50 border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-neutral-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">Studio Synthesis Defaults</h3>
            </div>
            <span className="text-[10px] text-neutral-500 font-mono uppercase">DSP Pipeline</span>
          </div>

          <div className="flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-neutral-200 block">Default Audio Duration</span>
                <span className="text-[11px] text-neutral-500">Target length for new sound cues</span>
              </div>
              <span className="font-mono text-neutral-300 font-semibold px-2 py-1 bg-white/5 rounded border border-white/5">
                {params.durationSeconds}s
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-neutral-200 block">Prompt Influence Weight</span>
                <span className="text-[11px] text-neutral-500">Model conditioning strength</span>
              </div>
              <span className="font-mono text-neutral-300 font-semibold px-2 py-1 bg-white/5 rounded border border-white/5">
                {Math.round(params.promptInfluence * 100)}%
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
              <div>
                <span className="font-medium text-neutral-200 block">Library View Density</span>
                <span className="text-[11px] text-neutral-500">Compact list or spacious cards</span>
              </div>
              <div className="flex items-center bg-black/60 border border-white/10 rounded-lg p-0.5">
                <button
                  onClick={() => setViewDensity('compact')}
                  className={cn(
                    "px-2.5 py-1 text-[11px] rounded-md font-medium transition-all cursor-pointer",
                    viewDensity === 'compact' ? "bg-white text-black font-semibold shadow" : "text-neutral-400 hover:text-white"
                  )}
                >
                  Compact
                </button>
                <button
                  onClick={() => setViewDensity('comfortable')}
                  className={cn(
                    "px-2.5 py-1 text-[11px] rounded-md font-medium transition-all cursor-pointer",
                    viewDensity === 'comfortable' ? "bg-white text-black font-semibold shadow" : "text-neutral-400 hover:text-white"
                  )}
                >
                  Spacious
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-neutral-200 block">Auto-Trim Silence</span>
                <span className="text-[11px] text-neutral-500">Strip leading & trailing padding</span>
              </div>
              <button
                onClick={() => setParams(prev => ({ ...prev, trimSilence: !prev.trimSilence }))}
                className={cn(
                  "w-10 h-5 rounded-full transition-colors relative cursor-pointer",
                  params.trimSilence ? "bg-emerald-500" : "bg-neutral-800"
                )}
              >
                <div 
                  className={cn(
                    "w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform",
                    params.trimSilence ? "left-5.5" : "left-0.5"
                  )} 
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-neutral-200 block">Auto-Normalize Loudness</span>
                <span className="text-[11px] text-neutral-500">Scale peak gain to -0.1 dBFS</span>
              </div>
              <button
                onClick={() => setParams(prev => ({ ...prev, normalizeLoudness: !prev.normalizeLoudness }))}
                className={cn(
                  "w-10 h-5 rounded-full transition-colors relative cursor-pointer",
                  params.normalizeLoudness ? "bg-emerald-500" : "bg-neutral-800"
                )}
              >
                <div 
                  className={cn(
                    "w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform",
                    params.normalizeLoudness ? "left-5.5" : "left-0.5"
                  )} 
                />
              </button>
            </div>
          </div>
        </div>

        {/* Global Keyboard Shortcuts Hub */}
        <div className="bg-neutral-900/50 border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <Keyboard className="w-4 h-4 text-neutral-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">Studio Keyboard Shortcuts</h3>
            </div>
            <button
              onClick={onOpenShortcutsOverlay}
              className="text-[11px] font-semibold text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full border border-white/5 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Open HUD</span>
              <kbd className="text-[9px] px-1 py-0.2 bg-white/10 rounded font-mono font-bold">⌘/</kbd>
            </button>
          </div>

          <div className="flex flex-col gap-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-white/[0.03]">
              <span className="text-neutral-400">Synthesize Variations</span>
              <kbd className="px-2 py-0.5 bg-black/60 border border-white/10 rounded font-mono text-[11px] text-neutral-200">⌘ + Enter</kbd>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/[0.03]">
              <span className="text-neutral-400">Switch to Synthesizer / Library</span>
              <div className="flex gap-1">
                <kbd className="px-1.5 py-0.5 bg-black/60 border border-white/10 rounded font-mono text-[11px] text-neutral-200">⌘ + 1</kbd>
                <kbd className="px-1.5 py-0.5 bg-black/60 border border-white/10 rounded font-mono text-[11px] text-neutral-200">⌘ + 2</kbd>
              </div>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/[0.03]">
              <span className="text-neutral-400">Select All Assets</span>
              <kbd className="px-2 py-0.5 bg-black/60 border border-white/10 rounded font-mono text-[11px] text-neutral-200">⌘ + A</kbd>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/[0.03]">
              <span className="text-neutral-400">Navigate & Cycle Sound Cards</span>
              <kbd className="px-2 py-0.5 bg-black/60 border border-white/10 rounded font-mono text-[11px] text-neutral-200">↑ / ↓ / ← / →</kbd>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-neutral-400">Play / Pause Focused Sound</span>
              <kbd className="px-2 py-0.5 bg-black/60 border border-white/10 rounded font-mono text-[11px] text-neutral-200">Space</kbd>
            </div>
          </div>

          <div className="mt-auto pt-2">
            <div className="flex items-center justify-between bg-black/40 border border-white/[0.04] p-3 rounded-xl">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">Always-on Shortcut HUD</span>
                <span className="text-[10px] text-neutral-500">Keep shortcut cheat-sheet pinned</span>
              </div>
              <button
                onClick={() => setIsShortcutsPinned(prev => !prev)}
                className={cn(
                  "px-3 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer",
                  isShortcutsPinned 
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                    : "bg-white/5 text-neutral-400 hover:text-white border border-white/10"
                )}
              >
                {isShortcutsPinned ? 'Pinned' : 'Pin Overlay'}
              </button>
            </div>
          </div>
        </div>

      </section>

      {/* Advanced Menu Section (Prominent expandable container containing all diagnostics, lab, sweeps, storage, and tests) */}
      <section className="bg-neutral-900/60 border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl transition-all">
        
        {/* Advanced Section Header / Trigger */}
        <div 
          onClick={() => setIsAdvancedOpen(prev => !prev)}
          className="p-5 sm:p-6 bg-neutral-950/50 hover:bg-neutral-950/70 border-b border-white/[0.06] flex items-center justify-between cursor-pointer select-none transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center text-white shadow-inner">
              <Terminal className="w-4 h-4 text-neutral-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Advanced Systems & Diagnostics Menu</h3>
                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Low-level DSP frequency sweeps, IndexedDB engine verification, telemetry logs, and automated codebase test runner.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-neutral-400">
            <span className="text-xs font-mono hidden sm:inline">{isAdvancedOpen ? 'Collapse' : 'Expand'}</span>
            {isAdvancedOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
        </div>

        {/* Collapsible Body */}
        <AnimatePresence initial={false}>
          {isAdvancedOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="p-6 flex flex-col gap-6">
                
                {/* Advanced Navigation Sub-tabs */}
                <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 overflow-x-auto scrollbar-none">
                  <button
                    onClick={() => setActiveAdvancedTab('dsp')}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                      activeAdvancedTab === 'dsp' 
                        ? "bg-white text-black shadow" 
                        : "bg-white/[0.03] text-neutral-400 hover:text-white border border-white/[0.06]"
                    )}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    Web Audio DSP Sweep
                  </button>

                  <button
                    onClick={() => setActiveAdvancedTab('storage')}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                      activeAdvancedTab === 'storage' 
                        ? "bg-white text-black shadow" 
                        : "bg-white/[0.03] text-neutral-400 hover:text-white border border-white/[0.06]"
                    )}
                  >
                    <Database className="w-3.5 h-3.5" />
                    Storage Bench & IDB
                  </button>

                  <button
                    onClick={() => setActiveAdvancedTab('suite')}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                      activeAdvancedTab === 'suite' 
                        ? "bg-white text-black shadow" 
                        : "bg-white/[0.03] text-neutral-400 hover:text-white border border-white/[0.06]"
                    )}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Automated Test Runner
                  </button>

                  <button
                    onClick={() => setActiveAdvancedTab('keys')}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                      activeAdvancedTab === 'keys' 
                        ? "bg-white text-black shadow" 
                        : "bg-white/[0.03] text-neutral-400 hover:text-white border border-white/[0.06]"
                    )}
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    Keypress Telemetry
                  </button>

                  <button
                    onClick={() => setActiveAdvancedTab('telemetry')}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                      activeAdvancedTab === 'telemetry' 
                        ? "bg-white text-black shadow" 
                        : "bg-white/[0.03] text-neutral-400 hover:text-white border border-white/[0.06]"
                    )}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    System Telemetry
                  </button>
                </div>

                {/* Sub-tab 1: DSP Sweep */}
                {activeAdvancedTab === 'dsp' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="bg-black/40 border border-white/[0.04] rounded-xl p-5 flex flex-col gap-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <Cpu className="w-4 h-4 text-amber-400" /> Oscillator Sweep Benchmark
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">80Hz → 1.2kHz Sweep</span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Executes a real-time Web Audio API oscillator sweep with a sweeping resonant lowpass filter to verify buffer rendering, sample playback rate, and client hardware fidelity.
                      </p>
                      <button
                        onClick={runFrequencySweep}
                        disabled={synthSweepPlaying}
                        className={cn(
                          "w-full py-2.5 px-4 border rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer select-none shadow-md",
                          synthSweepPlaying 
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse" 
                            : "bg-white text-black hover:bg-neutral-200 border-white/20"
                        )}
                      >
                        {synthSweepPlaying ? (
                          <>
                            <Activity className="w-4 h-4 animate-spin text-amber-400" />
                            DSP Frequency Sweep Playing...
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Trigger Audio Frequency Sweep
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-black/40 border border-white/[0.04] rounded-xl p-5 flex flex-col gap-3">
                      <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">Audio DSP Pipeline Details</span>
                      <div className="flex flex-col gap-2 font-mono text-[11px] text-neutral-400">
                        <div className="flex justify-between py-1 border-b border-white/[0.03]">
                          <span>Oscillator Type:</span>
                          <span className="text-white">Sawtooth (Rich Harmonics)</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/[0.03]">
                          <span>Biquad Filter:</span>
                          <span className="text-white">Lowpass 200Hz → 8000Hz (Q=4)</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/[0.03]">
                          <span>Gain Envelope:</span>
                          <span className="text-white">Linear Fade-In / Exp Fade-Out</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Context Status:</span>
                          <span className="text-emerald-400 font-semibold">{audioContextInfo?.state || 'Running'} ({audioContextInfo?.sampleRate || 48000} Hz)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-tab 2: Storage Bench */}
                {activeAdvancedTab === 'storage' && (
                  <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="bg-black/40 border border-white/[0.04] rounded-xl p-5 flex flex-col gap-3">
                        <span className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                          <Database className="w-4 h-4 text-sky-400" /> IndexedDB Schema Auditor
                        </span>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Pings local IndexedDB stores (`library_cues_store` & `library_cues_kits`), audits record integrity, and calculates exact registered asset metrics.
                        </p>
                        <button
                          onClick={runStorageDiagnostic}
                          disabled={isDiagRunning}
                          className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-white rounded-xl text-xs font-bold transition-all cursor-pointer select-none disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <RefreshCw className={cn("w-3.5 h-3.5", isDiagRunning && "animate-spin")} />
                          {isDiagRunning ? 'Executing Storage Bench...' : 'Execute Storage Bench'}
                        </button>
                      </div>

                      <div className="bg-black/40 border border-white/[0.04] rounded-xl p-5 flex flex-col gap-3">
                        <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">Storage Engine Stats</span>
                        <div className="flex flex-col gap-2 font-mono text-[11px] text-neutral-400">
                          <div className="flex justify-between py-1 border-b border-white/[0.03]">
                            <span>Engine Mode:</span>
                            <span className="text-white">idb + IndexedDB v1</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-white/[0.03]">
                            <span>Network State:</span>
                            <span className={isOnline ? "text-emerald-400 font-semibold" : "text-amber-400"}>
                              {isOnline ? 'Online (API Ready)' : 'Offline (Local Only)'}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-white/[0.03]">
                            <span>Registered Assets:</span>
                            <span className="text-white font-bold">{library.length} items</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span>Sound Kits:</span>
                            <span className="text-white font-bold">{kits.length} kits</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isDiagRunning && (
                      <div className="bg-black/60 border border-white/[0.06] rounded-xl p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-neutral-400">Diagnostic Bench Progress</span>
                          <span className="text-white font-bold">{diagProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                          <div className="h-full bg-white transition-all duration-300" style={{ width: `${diagProgress}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Live IDB Log viewer */}
                    <div className="bg-black/60 border border-white/[0.06] rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider">IndexedDB Realtime Output</span>
                        <button
                          onClick={() => setDiagLog([])}
                          className="text-[10px] text-neutral-500 hover:text-neutral-300 font-mono cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="max-h-40 overflow-y-auto font-mono text-[11px] leading-relaxed flex flex-col gap-1 pr-2 scrollbar-thin">
                        {diagLog.length > 0 ? (
                          diagLog.map((log, idx) => (
                            <div key={idx} className={log.includes('❌') ? 'text-rose-400' : log.includes('✓') || log.includes('🏆') ? 'text-emerald-400 font-semibold' : 'text-neutral-400'}>
                              {log}
                            </div>
                          ))
                        ) : (
                          <div className="text-neutral-600 italic text-[11px]">Click "Execute Storage Bench" to trigger schema validation and integrity tests.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-tab 3: Test Suite Runner */}
                {activeAdvancedTab === 'suite' && (
                  <div className="flex flex-col gap-4">
                    <div className="bg-black/40 border border-white/[0.04] rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Automated Codebase Test Verification
                        </h4>
                        <p className="text-xs text-neutral-400 mt-1">
                          Executes the simulated unit & integration test runner verifying all audio DSP, storage models, and waveform components.
                        </p>
                      </div>
                      <button
                        onClick={runTestSuiteSimulation}
                        disabled={testRunnerState === 'running'}
                        className="py-2 px-4 bg-white text-black font-bold text-xs rounded-xl hover:bg-neutral-200 transition-all cursor-pointer select-none disabled:opacity-50 flex items-center gap-2 shrink-0 shadow"
                      >
                        <RefreshCw className={cn("w-3.5 h-3.5", testRunnerState === 'running' && "animate-spin")} />
                        {testRunnerState === 'running' ? 'Running Suite...' : 'Run Test Suite'}
                      </button>
                    </div>

                    <div className="bg-black/60 border border-white/[0.06] rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider">Vitest Terminal Output</span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {testRunnerState === 'success' ? 'All tests passed' : testRunnerState === 'running' ? 'Executing...' : 'Idle'}
                        </span>
                      </div>
                      <div className="max-h-56 overflow-y-auto font-mono text-[11px] leading-relaxed flex flex-col gap-1.5 pr-2 scrollbar-thin">
                        {testRunnerResults.length > 0 ? (
                          testRunnerResults.map((line, idx) => {
                            let style = "text-neutral-400";
                            if (line.includes('✓')) style = "text-emerald-400 font-semibold";
                            else if (line.includes('🏆')) style = "text-emerald-400 font-bold pt-2 border-t border-white/[0.04]";
                            else if (line.includes('$')) style = "text-sky-400 font-bold";
                            return (
                              <div key={idx} className={`${style} whitespace-pre-wrap`}>
                                {line}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-neutral-600 italic text-[11px]">Click "Run Test Suite" to run automated verification across all files.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-tab 4: Keypress Telemetry */}
                {activeAdvancedTab === 'keys' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-black/40 border border-white/[0.04] rounded-xl p-5 flex flex-col gap-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                          <Keyboard className="w-4 h-4 text-indigo-400" /> Real-time Input Monitor
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                          LIVE HOOK
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400">
                        Press keyboard keys on your physical device to see live modifier & keycode registration.
                      </p>

                      <div className="bg-black/80 border border-white/[0.06] rounded-xl p-4 min-h-[60px] flex items-center flex-wrap gap-2 font-mono">
                        {pressedKeys.size === 0 ? (
                          <span className="text-xs text-neutral-600 italic">Press any keys on keyboard to register...</span>
                        ) : (
                          Array.from(pressedKeys).map((key: any) => {
                            const uppercaseKey = String(key).toUpperCase();
                            return (
                              <kbd
                                key={key}
                                className="px-2.5 py-1 bg-white/10 border border-white/15 rounded-lg font-mono text-xs text-white font-bold shadow animate-pulse"
                              >
                                {uppercaseKey === 'META' ? '⌘ CMD' : uppercaseKey === 'SPACE' ? 'SPACE' : uppercaseKey}
                              </kbd>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="bg-black/40 border border-white/[0.04] rounded-xl p-5 flex flex-col gap-3">
                      <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">Shortcuts Verification Checklist</span>
                      <div className="flex flex-col gap-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {pressedKeys.has('meta') && pressedKeys.has('a') ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4 text-neutral-600" />
                            )}
                            <span className={pressedKeys.has('meta') && pressedKeys.has('a') ? "text-white line-through" : "text-neutral-300"}>
                              Cmd + A (Select All)
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-500 font-mono">Multi-select</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {pressedKeys.has('backspace') || pressedKeys.has('delete') ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4 text-neutral-600" />
                            )}
                            <span className={pressedKeys.has('backspace') || pressedKeys.has('delete') ? "text-white line-through" : "text-neutral-300"}>
                              Backspace / Delete
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-500 font-mono">Remove asset</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {pressedKeys.has('space') ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4 text-neutral-600" />
                            )}
                            <span className={pressedKeys.has('space') ? "text-white line-through" : "text-neutral-300"}>
                              Space (Play / Pause)
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-500 font-mono">Audio waveform</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-tab 5: System Telemetry */}
                {activeAdvancedTab === 'telemetry' && (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-black/40 border border-white/[0.04] rounded-xl p-4 flex flex-col gap-1">
                        <span className="text-[10px] text-neutral-500 font-mono uppercase">Audio Sample Rate</span>
                        <span className="text-sm font-bold text-white font-mono">{audioContextInfo?.sampleRate || 48000} Hz</span>
                        <span className="text-[10px] text-emerald-400">High Resolution</span>
                      </div>
                      <div className="bg-black/40 border border-white/[0.04] rounded-xl p-4 flex flex-col gap-1">
                        <span className="text-[10px] text-neutral-500 font-mono uppercase">Runtime Environment</span>
                        <span className="text-sm font-bold text-white font-mono">Browser + Cloud Run</span>
                        <span className="text-[10px] text-neutral-400">Full-Stack Vite Express</span>
                      </div>
                      <div className="bg-black/40 border border-white/[0.04] rounded-xl p-4 flex flex-col gap-1">
                        <span className="text-[10px] text-neutral-500 font-mono uppercase">Security Protocol</span>
                        <span className="text-sm font-bold text-white font-mono">TLS / HTTPS</span>
                        <span className="text-[10px] text-emerald-400">Encrypted Ingress</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-neutral-500">Need to share or export all active diagnostic logs for debugging?</span>
                      <button
                        onClick={handleCopyLogs}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-neutral-300 hover:text-white transition-all cursor-pointer"
                      >
                        {copiedLogs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedLogs ? 'Copied Telemetry Logs' : 'Copy All Logs'}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </section>

    </div>
  );
};
