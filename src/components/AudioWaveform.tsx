import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Download, Trash2, CheckCircle, Circle, Volume2, Activity, Info, CheckSquare, Square, Scissors, Loader2, Undo2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { SoundAsset } from '../types';
import { useAudioWaveform } from '../hooks/useAudioWaveform';

interface AudioWaveformProps {
  key?: string;
  asset: SoundAsset;
  onKeep?: () => void;
  onReject?: () => void;
  onRename?: (newName: string) => void;
  onTrimSilence?: () => Promise<void>;
  onUndoTrim?: () => Promise<void>;
  onNormalizeLoudness?: () => Promise<void>;
  onFadeAudio?: () => Promise<void>;
  isKept?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  className?: string;
}

export function AudioWaveform({ asset, onKeep, onReject, onRename, onTrimSilence, onUndoTrim, onNormalizeLoudness, onFadeAudio, isKept, isSelected, onToggleSelect, className }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isTrimming, setIsTrimming] = useState(false);
  
  const {
    audioRef,
    isPlaying,
    currentTime,
    displayDuration,
    togglePlay,
    seek,
    peaks,
    isDecoding,
    sampleRate,
    fileSizeStr,
    volume,
    setVolume
  } = useAudioWaveform(asset);

  useEffect(() => {
    if (audioRef?.current) {
      audioRef.current.playbackRate = playbackRate;
      // @ts-ignore: preservesPitch is not fully typed in all TS versions
      audioRef.current.preservesPitch = false;
    }
  }, [playbackRate, audioRef]);

  // Draw Waveform onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI screens
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);

    if (peaks.length === 0) {
      // Loading State
      ctx.fillStyle = '#404040';
      ctx.font = '10px monospace';
      ctx.fillText(isDecoding ? 'ANALYZING SPECTRUM...' : 'LOADING WAVEFORM...', 10, height / 2 + 3);
      return;
    }

    const barWidth = width / peaks.length;
    const progressRatio = displayDuration > 0 ? currentTime / displayDuration : 0;
    const activeIndex = Math.floor(peaks.length * progressRatio);

    peaks.forEach((peak, index) => {
      const x = index * barWidth;
      const barHeight = Math.max(4, peak * (height - 8));
      const y = (height - barHeight) / 2;

      const isActive = index <= activeIndex;
      ctx.fillStyle = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.16)';

      // Rounded rect function
      const w = Math.max(1.5, barWidth - 1.5);
      const r = Math.min(1.5, w / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + barHeight, r);
      ctx.arcTo(x + w, y + barHeight, x, y + barHeight, r);
      ctx.arcTo(x, y + barHeight, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
    });
  }, [peaks, currentTime, displayDuration, isDecoding]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || displayDuration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = clickX / rect.width;
    const targetTime = clickRatio * displayDuration;

    seek(targetTime);
  };

  const handleDownload = () => {
    let extension = 'mp3';
    if (asset.mimeType?.includes('wav')) {
      extension = 'wav';
    } else if (asset.mimeType?.includes('ogg')) {
      extension = 'ogg';
    } else if (asset.mimeType?.includes('aac')) {
      extension = 'aac';
    }
    const link = document.createElement('a');
    link.href = `data:${asset.mimeType};base64,${asset.audioBase64}`;
    link.download = `${asset.name.replace(/\s+/g, '_')}.${extension}`;
    link.click();
  };

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "p-4 rounded-2xl bg-neutral-900/35 border border-white/[0.04] backdrop-blur-xl transition-all duration-300 relative group", 
      isKept ? "border-white/[0.12] bg-white/[0.01]" : "", 
      className
    )}>
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5 max-w-[75%]">
          {onToggleSelect && (
            <button 
              onClick={onToggleSelect} 
              className={cn(
                "text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer select-none", 
                isSelected && "text-white"
              )}
            >
              {isSelected ? <CheckSquare className="w-4.5 h-4.5" /> : <Square className="w-4.5 h-4.5" />}
            </button>
          )}
          {onKeep && (
            <button 
              onClick={onKeep} 
              className={cn(
                "text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer select-none", 
                isKept && "text-emerald-400 hover:text-emerald-300"
              )}
            >
              {isKept ? <CheckCircle className="w-4.5 h-4.5 fill-emerald-500/10" /> : <Circle className="w-4.5 h-4.5" />}
            </button>
          )}
          <input 
            className="bg-transparent border-none outline-none font-semibold text-sm text-neutral-200 focus:text-white placeholder-neutral-600 w-full tracking-tight focus:ring-0 focus:border-none p-0"
            value={asset.name}
            onChange={(e) => onRename && onRename(e.target.value)}
            placeholder="Name this sound..."
          />
        </div>
        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
          {onReject && (
            <button 
              onClick={onReject} 
              className="p-1 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer" 
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3.5">
        <button 
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-100 active:scale-95 transition-all shadow-md shadow-black/10 shrink-0 cursor-pointer select-none"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current text-neutral-950" />
          ) : (
            <Play className="w-4 h-4 fill-current text-neutral-950 ml-0.5" />
          )}
        </button>
        <div className="flex-1 min-w-0 relative h-10">
          <canvas 
            ref={canvasRef} 
            onClick={handleCanvasClick}
            className="w-full h-full cursor-pointer rounded-lg bg-neutral-950/20 border border-white/[0.02]"
          />
        </div>
        <button 
          onClick={handleDownload} 
          className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 flex items-center justify-center transition-colors cursor-pointer shrink-0" 
          title="Download"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <div className="text-[10px] font-mono text-neutral-500 tabular-nums shrink-0 w-9 text-right">
          {formatTime(currentTime)}
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.04] pt-2.5">
        <div className="flex flex-wrap gap-1">
          {asset.loop && (
            <span className="text-[9px] font-medium font-sans px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.02] text-neutral-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80"></span>
              Seamless Loop
            </span>
          )}
          <span className="text-[9px] font-medium font-sans px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.02] text-neutral-500 max-w-[200px] truncate" title={asset.prompt}>
            {asset.prompt}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity" title="Volume">
              <Volume2 className="w-3 h-3 text-neutral-400" />
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume !== undefined ? volume : 1}
                onChange={(e) => setVolume && setVolume(parseFloat(e.target.value))}
                className="w-12 h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-neutral-300 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-neutral-300 [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
            
            <div className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity" title="Pitch / Speed">
              <Activity className="w-3 h-3 text-neutral-400" />
              <input 
                type="range" 
                min="0.5" 
                max="2" 
                step="0.05" 
                value={playbackRate}
                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                className="w-12 h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-neutral-300 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-neutral-300 [&::-webkit-slider-thumb]:rounded-full"
              />
              <span className="text-[9px] font-mono text-neutral-500 w-5 text-right">{playbackRate.toFixed(1)}x</span>
            </div>

            {onTrimSilence && !asset.previousAudioBase64 && (
              <button
                onClick={async () => {
                  setIsTrimming(true);
                  try {
                    await onTrimSilence();
                  } finally {
                    setIsTrimming(false);
                  }
                }}
                disabled={isTrimming}
                className="ml-2 flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                title="Trim Silence"
              >
                {isTrimming ? <Loader2 className="w-3 h-3 text-neutral-400 animate-spin" /> : <Scissors className="w-3 h-3 text-neutral-400" />}
                <span className="text-[9px] font-sans font-medium text-neutral-400">Trim</span>
              </button>
            )}

            {onUndoTrim && asset.previousAudioBase64 && (
              <button
                onClick={async () => {
                  setIsTrimming(true);
                  try {
                    await onUndoTrim();
                  } finally {
                    setIsTrimming(false);
                  }
                }}
                disabled={isTrimming}
                className="ml-2 flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                title="Undo Action"
              >
                {isTrimming ? <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" /> : <Undo2 className="w-3 h-3 text-emerald-400" />}
                <span className="text-[9px] font-sans font-medium text-emerald-400">Undo Action</span>
              </button>
            )}

            {onNormalizeLoudness && !asset.previousAudioBase64 && (
              <button
                onClick={async () => {
                  setIsTrimming(true);
                  try {
                    await onNormalizeLoudness();
                  } finally {
                    setIsTrimming(false);
                  }
                }}
                disabled={isTrimming}
                className="ml-2 flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                title="Normalize Loudness"
              >
                <Activity className="w-3 h-3 text-neutral-400" />
                <span className="text-[9px] font-sans font-medium text-neutral-400">Normalize</span>
              </button>
            )}

            {onFadeAudio && !asset.previousAudioBase64 && (
              <button
                onClick={async () => {
                  setIsTrimming(true);
                  try {
                    await onFadeAudio();
                  } finally {
                    setIsTrimming(false);
                  }
                }}
                disabled={isTrimming}
                className="ml-2 flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                title="Apply Fade In/Out (from Synthesis Settings)"
              >
                <svg className="w-3 h-3 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg>
                <span className="text-[9px] font-sans font-medium text-neutral-400">Apply Fade</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-[9px] font-mono text-neutral-500">
            {displayDuration > 0 && <span>{displayDuration.toFixed(2)}s</span>}
            <div className="relative group/info flex items-center justify-center">
              <Info className="w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300 transition-colors cursor-help" />
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover/info:flex flex-col gap-1 bg-neutral-800/95 backdrop-blur text-neutral-300 text-[10px] p-2.5 rounded-lg shadow-xl whitespace-nowrap z-10 border border-white/10 pointer-events-none text-left">
                <div className="flex justify-between gap-6">
                  <span className="text-neutral-500">Sample Rate</span>
                  <span className="text-white">{sampleRate ? `${(sampleRate / 1000).toFixed(1)} kHz` : 'Unknown'}</span>
                </div>
                <div className="flex justify-between gap-6">
                  <span className="text-neutral-500">Bit Depth</span>
                  <span className="text-white">16-bit</span>
                </div>
                <div className="flex justify-between gap-6">
                  <span className="text-neutral-500">File Size</span>
                  <span className="text-white">{fileSizeStr || 'Unknown'}</span>
                </div>
                <div className="flex justify-between gap-6">
                  <span className="text-neutral-500">Format</span>
                  <span className="text-white uppercase">{asset.mimeType.split('/')[1] || 'WAV'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

