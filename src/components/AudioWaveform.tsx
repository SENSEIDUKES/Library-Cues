import React, { useEffect, useRef } from 'react';
import { Play, Pause, Download, Trash2, CheckCircle, Circle } from 'lucide-react';
import { cn } from '../lib/utils';
import { SoundAsset } from '../types';
import { useAudioWaveform } from '../hooks/useAudioWaveform';

interface AudioWaveformProps {
  key?: string;
  asset: SoundAsset;
  onKeep?: () => void;
  onReject?: () => void;
  onRename?: (newName: string) => void;
  isKept?: boolean;
  className?: string;
}

export function AudioWaveform({ asset, onKeep, onReject, onRename, isKept, className }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const {
    isPlaying,
    currentTime,
    displayDuration,
    togglePlay,
    seek,
    peaks,
    isDecoding,
    sampleRate,
    fileSizeStr
  } = useAudioWaveform(asset);

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
    const extension = asset.mimeType.includes('mpeg') ? 'mp3' : 'wav';
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
          <button 
            onClick={handleDownload} 
            className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer" 
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
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
        <div className="text-[10px] font-mono text-neutral-500 tabular-nums shrink-0 w-10 text-right">
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
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-neutral-500">
          {displayDuration > 0 && <span>{displayDuration.toFixed(2)}s</span>}
          {sampleRate && (
            <>
              <span className="text-neutral-800">•</span>
              <span>{(sampleRate / 1000).toFixed(1)} kHz</span>
            </>
          )}
          {fileSizeStr && (
            <>
              <span className="text-neutral-800">•</span>
              <span>{fileSizeStr}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

