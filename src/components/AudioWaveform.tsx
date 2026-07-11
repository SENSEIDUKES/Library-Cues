import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Download, Trash2, CheckCircle, Circle, Volume2, Activity, Info, CheckSquare, Square, Scissors, Loader2, Undo2, Pencil } from 'lucide-react';
import { cn } from '../lib/utils';
import { SoundAsset } from '../types';
import { useAudioWaveform } from '../hooks/useAudioWaveform';
import { downloadFormatForMimeType, sanitizeFileStem } from '../lib/mime';

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
  onEdit?: () => void;
  badges?: string[];
  className?: string;
}

export function AudioWaveform({ asset, onKeep, onReject, onRename, onTrimSilence, onUndoTrim, onNormalizeLoudness, onFadeAudio, isKept, isSelected, onToggleSelect, onEdit, badges = [], className }: AudioWaveformProps) {
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

  const handleCanvasKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (displayDuration <= 0) return;
    const step = Math.max(0.25, displayDuration / 20);
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      if (event.key === 'Home') seek(0);
      else if (event.key === 'End') seek(displayDuration);
      else seek(Math.max(0, Math.min(displayDuration, currentTime + (event.key === 'ArrowRight' ? step : -step))));
    }
  };

  const handleDownload = () => {
    const format = downloadFormatForMimeType(asset.mimeType);
    if (!format) {
      console.error(`Cannot download unsupported audio MIME type: ${asset.mimeType}`);
      return;
    }
    const link = document.createElement('a');
    link.href = `data:${format.mimeType};base64,${asset.audioBase64}`;
    link.download = `${sanitizeFileStem(asset.name)}.${format.extension}`;
    link.click();
  };

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "w-full min-w-0 p-4 rounded-2xl bg-neutral-900/35 border border-white/[0.04] backdrop-blur-xl transition-all duration-300 relative group",
      isKept ? "border-white/[0.12] bg-white/[0.01]" : "", 
      className
    )}>
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {onToggleSelect && (
            <button 
              onClick={onToggleSelect} 
              aria-label={`${isSelected ? 'Deselect' : 'Select'} ${asset.name}`}
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
              aria-label={`${isKept ? 'Edit saved cue' : 'Keep and classify'} ${asset.name}`}
              className={cn(
                "text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer select-none", 
                isKept && "text-emerald-400 hover:text-emerald-300"
              )}
            >
              {isKept ? <CheckCircle className="w-4.5 h-4.5 fill-emerald-500/10" /> : <Circle className="w-4.5 h-4.5" />}
            </button>
          )}
          <input 
            aria-label="Sound name"
            className="min-w-0 w-full truncate bg-transparent border-none outline-none font-semibold text-sm text-neutral-200 focus:text-white placeholder-neutral-600 tracking-tight focus:ring-0 focus:border-none p-0"
            value={asset.name}
            onChange={(e) => onRename && onRename(e.target.value)}
            placeholder="Name this sound..."
          />
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Edit cue metadata"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
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
      
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
        <button 
          onClick={togglePlay}
          aria-label={`${isPlaying ? 'Pause' : 'Play'} ${asset.name}`}
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
            onKeyDown={handleCanvasKeyDown}
            aria-label={`Waveform for ${asset.name}`}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={displayDuration}
            aria-valuenow={Math.min(currentTime, displayDuration)}
            tabIndex={0}
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
        <div className="hidden text-[10px] font-mono text-neutral-500 tabular-nums shrink-0 w-9 text-right sm:block">
          {formatTime(currentTime)}
        </div>
      </div>

      <div className="mt-3.5 flex min-w-0 flex-col items-stretch gap-2 border-t border-white/[0.04] pt-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap gap-1">
          {badges.map((badge) => (
            <span key={badge} className="text-[9px] font-medium font-sans px-2 py-0.5 rounded-full bg-sky-400/10 border border-sky-300/10 text-sky-200/80 capitalize">
              {badge}
            </span>
          ))}
          {asset.loop && (
            <span className="text-[9px] font-medium font-sans px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.02] text-neutral-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80"></span>
              Seamless Loop
            </span>
          )}
          <span className="max-w-full truncate rounded-full border border-white/[0.02] bg-white/[0.03] px-2 py-0.5 font-sans text-[9px] font-medium text-neutral-500 sm:max-w-[200px]" title={asset.prompt}>
            {asset.prompt}
          </span>
        </div>
        
        <div className="flex w-full min-w-0 flex-wrap items-center gap-3 sm:w-auto sm:gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity" title="Volume">
              <Volume2 className="w-3 h-3 text-neutral-400" />
              <input 
                aria-label={`Volume for ${asset.name}`}
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
                aria-label={`Playback speed for ${asset.name}`}
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
                className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 sm:ml-2"
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
                className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 sm:ml-2"
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
                className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 sm:ml-2"
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
                className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 sm:ml-2"
                title="Apply Fade In/Out (from Synthesis Settings)"
              >
                <svg className="w-3 h-3 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg>
                <span className="text-[9px] font-sans font-medium text-neutral-400">Apply Fade</span>
              </button>
            )}
          </div>
          
          <div className="ml-auto flex items-center gap-2 text-[9px] font-mono text-neutral-500">
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

