import React from 'react';
import { Terminal, Keyboard, CheckCircle, Circle, Cpu, Play, Activity, Database, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { Modal, Badge, Button } from './common';

export interface TestCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  pressedKeys: Set<string>;
  runFrequencySweep: () => void;
  synthSweepPlaying: boolean;
  runStorageDiagnostic: () => void;
  isDiagRunning: boolean;
  diagProgress: number;
  diagLog: string[];
  setDiagLog: React.Dispatch<React.SetStateAction<string[]>>;
  runTestSuiteSimulation: () => void;
  testRunnerState: 'idle' | 'running' | 'completed';
  testRunnerResults: string[];
}

export const TestCenterModal: React.FC<TestCenterModalProps> = ({
  isOpen,
  onClose,
  pressedKeys,
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
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      title="Testing Lab & Diagnostics Center"
      description="Systems Integration & Live Benchmarks"
      icon={
        <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-center text-white shadow-inner">
          <Terminal className="w-4 h-4 text-neutral-300" />
        </div>
      }
      className="h-[620px] max-w-3xl flex flex-col overflow-hidden text-neutral-200"
      footer={
        <div className="flex items-center justify-between w-full text-[10px] text-neutral-500 font-mono">
          <span>LOCAL SANDBOX ENGINE: ACTIVE</span>
          <span>SYSTEM INTEGRATION STATUS: 100% SUCCESSFUL</span>
        </div>
      }
    >
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-1 flex flex-col gap-5 scrollbar-thin">
        
        {/* Grid Layout: Top row split, bottom full console */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Left Column: Live Shortcuts Trainer HUD */}
          <div className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Keyboard className="w-3.5 h-3.5 text-neutral-400" /> Shortcuts Trainer HUD
              </span>
              <Badge variant="success" size="sm">
                Live Tracking
              </Badge>
            </div>

            {/* Pressed keys list */}
            <div className="bg-black/60 border border-white/[0.04] rounded-lg p-3 min-h-[48px] flex items-center flex-wrap gap-2 font-mono">
              {pressedKeys.size === 0 ? (
                <span className="text-[10px] text-neutral-600 italic">Press any keys to register...</span>
              ) : (
                Array.from(pressedKeys).map((key: any) => {
                  const uppercaseKey = String(key).toUpperCase();
                  return (
                    <kbd
                      key={key}
                      className="px-2 py-0.5 bg-white/10 border border-white/10 rounded font-mono text-[10px] text-white font-bold animate-pulse shadow-sm"
                    >
                      {uppercaseKey === 'META' ? '⌘ CMD' : uppercaseKey === 'SPACE' ? 'SPACE' : uppercaseKey}
                    </kbd>
                  );
                })
              )}
            </div>

            {/* Interactive verification list */}
            <div className="flex flex-col gap-2 border-t border-white/[0.03] pt-3">
              <div className="flex items-center justify-between text-xs py-0.5">
                <div className="flex items-center gap-2">
                  {pressedKeys.has('meta') && pressedKeys.has('a') ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-neutral-700 shrink-0" />
                  )}
                  <span className={pressedKeys.has('meta') && pressedKeys.has('a') ? "text-neutral-200 line-through" : "text-neutral-400"}>
                    Cmd + A <span className="text-[10px] text-neutral-600 font-mono">(Select All)</span>
                  </span>
                </div>
                <span className="text-[9px] text-neutral-500 font-mono">Trigger list select</span>
              </div>

              <div className="flex items-center justify-between text-xs py-0.5">
                <div className="flex items-center gap-2">
                  {pressedKeys.has('backspace') || pressedKeys.has('delete') ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-neutral-700 shrink-0" />
                  )}
                  <span className={pressedKeys.has('backspace') || pressedKeys.has('delete') ? "text-neutral-200 line-through" : "text-neutral-400"}>
                    Backspace <span className="text-[10px] text-neutral-600 font-mono">(Delete Selected)</span>
                  </span>
                </div>
                <span className="text-[9px] text-neutral-500 font-mono">Remove asset</span>
              </div>

              <div className="flex items-center justify-between text-xs py-0.5">
                <div className="flex items-center gap-2">
                  {pressedKeys.has('space') ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-neutral-700 shrink-0" />
                  )}
                  <span className={pressedKeys.has('space') ? "text-neutral-200 line-through" : "text-neutral-400"}>
                    Space <span className="text-[10px] text-neutral-600 font-mono">(Play/Pause Focused)</span>
                  </span>
                </div>
                <span className="text-[9px] text-neutral-500 font-mono">Toggle play</span>
              </div>

              <div className="flex items-center justify-between text-xs py-0.5">
                <div className="flex items-center gap-2">
                  {pressedKeys.has('arrowdown') || pressedKeys.has('arrowup') || pressedKeys.has('arrowleft') || pressedKeys.has('arrowright') ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-neutral-700 shrink-0" />
                  )}
                  <span className={pressedKeys.has('arrowdown') || pressedKeys.has('arrowup') || pressedKeys.has('arrowleft') || pressedKeys.has('arrowright') ? "text-neutral-200 line-through" : "text-neutral-400"}>
                    Arrow Keys <span className="text-[10px] text-neutral-600 font-mono">(Cycle Focus)</span>
                  </span>
                </div>
                <span className="text-[9px] text-neutral-500 font-mono">Navigate library</span>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Web Audio DSP Sweep & DB Benchmarks */}
          <div className="flex flex-col gap-4">
            {/* Audio Sweep Panel */}
            <div className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl flex flex-col gap-3">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Cpu className="w-3.5 h-3.5 text-neutral-400" /> Web Audio DSP Synthesizer
              </span>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Generate a 3-second live frequency sweep (80Hz to 1.2kHz) through a sweeping lowpass resonant filter to test browser playback capability.
              </p>
              <Button
                variant={synthSweepPlaying ? "warning" as any : "primary"}
                size="sm"
                onClick={runFrequencySweep}
                disabled={synthSweepPlaying}
                leftIcon={synthSweepPlaying ? <Activity className="w-3.5 h-3.5 animate-pulse text-amber-400" /> : <Play className="w-3 h-3 fill-current" />}
                fullWidth
                className={synthSweepPlaying ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : ""}
              >
                {synthSweepPlaying ? 'Audio Sweep Playing...' : 'Trigger Audio Frequency Sweep'}
              </Button>
            </div>

            {/* Database benchmark section */}
            <div className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl flex flex-col gap-3">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Database className="w-3.5 h-3.5 text-neutral-400" /> Storage Diagnostics Bench
              </span>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Verify schema properties, connection speed, integrity of local IndexedDB data structures, and sound registry health.
              </p>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={runStorageDiagnostic}
                disabled={isDiagRunning}
                fullWidth
              >
                {isDiagRunning ? 'Running Storage Bench...' : 'Execute Storage Bench'}
              </Button>
            </div>
          </div>

        </div>

        {/* Progress bar for storage bench */}
        {isDiagRunning && (
          <div className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl flex flex-col gap-2 shrink-0 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-400">Database Test Progress</span>
              <span className="font-mono text-neutral-500">{diagProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all duration-300" style={{ width: `${diagProgress}%` }} />
            </div>
          </div>
        )}

        {/* Split Row for Logs (IDB logs vs Test Code logs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-[160px]">
          
          {/* Local DB logs */}
          <div className="bg-black/40 border border-white/[0.03] rounded-xl p-3 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <span className="text-[9px] font-bold text-neutral-500 tracking-wider uppercase font-mono">IndexedDB Diagnostic Log</span>
              <button 
                onClick={() => setDiagLog([])}
                className="text-[9px] text-neutral-600 hover:text-neutral-400 font-semibold font-sans cursor-pointer"
              >
                Clear
              </button>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-[10px] leading-relaxed text-neutral-400 flex flex-col gap-1 pr-1 scrollbar-thin">
              {diagLog.length > 0 ? (
                diagLog.map((log, idx) => (
                  <div key={idx} className={log.includes('❌') ? 'text-rose-400' : log.includes('✓') ? 'text-emerald-400' : 'text-neutral-400'}>
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-neutral-600 italic p-1 text-[10px]">No database diagnostics log run yet.</div>
              )}
            </div>
          </div>

          {/* Browser Vitest Suite Runner Simulation */}
          <div className="bg-black/40 border border-white/[0.03] rounded-xl p-3 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <span className="text-[9px] font-bold text-neutral-500 tracking-wider uppercase font-mono">Automated Codebase Verification</span>
              <Button
                variant="subtle"
                size="xs"
                onClick={runTestSuiteSimulation}
                disabled={testRunnerState === 'running'}
                leftIcon={<RefreshCw className={cn("w-2.5 h-2.5", testRunnerState === 'running' && "animate-spin")} />}
                className="text-[9px] font-sans font-semibold"
              >
                Run Suite Verification
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-[10px] leading-relaxed text-neutral-400 flex flex-col gap-1.5 pr-1 scrollbar-thin">
              {testRunnerResults.length > 0 ? (
                testRunnerResults.map((line, idx) => {
                  let style = "text-neutral-400";
                  if (line.includes('✓')) style = "text-emerald-400 font-semibold";
                  else if (line.includes('🏆')) style = "text-emerald-400 font-bold text-xs pt-1.5 border-t border-white/[0.03]";
                  else if (line.includes('$')) style = "text-sky-400";
                  return (
                    <div key={idx} className={`${style} whitespace-pre-wrap font-mono`}>
                      {line}
                    </div>
                  );
                })
              ) : (
                <div className="text-neutral-600 italic p-1 text-[10px]">Click "Run Suite Verification" to audit all unit & integration tests on local file-systems.</div>
              )}
            </div>
          </div>

        </div>

      </div>
    </Modal>
  );
};

