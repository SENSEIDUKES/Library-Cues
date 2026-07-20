import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Download, Trash2, CheckCircle, Circle, Volume2, Activity, Info, CheckSquare, Square, Scissors, Loader2, Undo2, Sliders, Tag, ChevronDown, Plus, X, FileText, Layers, Pencil, Check, FolderArchive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { SoundAsset, SoundKit } from '../types';
import { useAudioWaveform } from '../hooks/useAudioWaveform';
import { decodeAudioBase64, bakeEffectsOnClientSide } from '../lib/audio';

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
  onUpdateAsset?: (updatedAsset: SoundAsset) => void;
  isKept?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  className?: string;
  onShowDiagnostics?: (asset: SoundAsset) => void;
  viewMode?: 'detailed' | 'compact';
  kits?: SoundKit[];
  onAssignToKit?: (kitId: string, soundId: string) => void;
  onRemoveFromKit?: (kitId: string, soundId: string) => void;
  isFocused?: boolean;
  onFocus?: () => void;
  id?: string;
}

export function AudioWaveform({ 
  asset, 
  onKeep, 
  onReject, 
  onRename, 
  onTrimSilence, 
  onUndoTrim, 
  onNormalizeLoudness, 
  onFadeAudio, 
  onUpdateAsset, 
  isKept, 
  isSelected, 
  onToggleSelect, 
  className, 
  onShowDiagnostics,
  viewMode = 'detailed',
  kits = [],
  onAssignToKit,
  onRemoveFromKit,
  isFocused = false,
  onFocus,
  id
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isTrimming, setIsTrimming] = useState(false);
  const [isBaking, setIsBaking] = useState(false);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [isKitDropdownOpen, setIsKitDropdownOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [localName, setLocalName] = useState(asset.name);
  
  useEffect(() => {
    setLocalName(asset.name);
  }, [asset.name]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalName(e.target.value);
  };

  const handleNameBlur = () => {
    if (localName !== asset.name && onRename) {
      onRename(localName);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const updateMetadata = (updates: Partial<SoundAsset>) => {
    if (onUpdateAsset) {
      onUpdateAsset({
        ...asset,
        ...updates
      });
    }
  };

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed) return;
    const currentTags = asset.tags || [];
    if (!currentTags.includes(trimmed)) {
      updateMetadata({ tags: [...currentTags, trimmed] });
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = asset.tags || [];
    updateMetadata({ tags: currentTags.filter(t => t !== tagToRemove) });
  };

  const handleCategorySelect = (category: string) => {
    updateMetadata({ category: asset.category === category ? '' : category });
  };

  const handleDescriptionChange = (desc: string) => {
    updateMetadata({ sourceDescription: desc });
  };
  
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
    setVolume,
    filterFreq,
    setFilterFreq,
    delayFeedback,
    setDelayFeedback,
    reverbAmount,
    setReverbAmount,
    playbackRate,
    setPlaybackRate
  } = useAudioWaveform(asset);

  // Global Space Key Listener for focused item to toggle play/pause
  useEffect(() => {
    if (!isFocused) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.hasAttribute('contenteditable')
      ) {
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isFocused, togglePlay]);

  // Note: playbackRate is now synchronized inside useAudioWaveform
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

  const hasActiveEffects = playbackRate !== 1 || filterFreq !== 20000 || delayFeedback !== 0 || reverbAmount !== 0;

  const handleBakeEffects = async () => {
    if (!hasActiveEffects) return;
    setIsBaking(true);
    try {
      const decoded = await bakeEffectsOnClientSide(
        asset.audioBase64,
        asset.mimeType,
        playbackRate,
        filterFreq,
        delayFeedback,
        reverbAmount
      );
      
      const peakResult = await decodeAudioBase64(decoded.audioBase64);
      
      const updatedAsset: SoundAsset = {
        ...asset,
        audioBase64: decoded.audioBase64,
        mimeType: decoded.mimeType,
        durationSeconds: decoded.durationSeconds,
        peaks: peakResult.peaks,
        sampleRate: peakResult.sampleRate,
        previousAudioBase64: asset.audioBase64,
        playbackRate: 1,
        filterFreq: 20000,
        delayFeedback: 0,
        reverbAmount: 0
      };
      
      setPlaybackRate(1);
      setFilterFreq(20000);
      setDelayFeedback(0);
      setReverbAmount(0);
      
      if (onUpdateAsset) {
        onUpdateAsset(updatedAsset);
      }
    } catch (err) {
      console.error("Failed to bake effects:", err);
    } finally {
      setIsBaking(false);
    }
  };

  const handleEffectChangeEnd = () => {
    if (onUpdateAsset) {
      onUpdateAsset({
        ...asset,
        playbackRate,
        filterFreq,
        delayFeedback,
        reverbAmount
      });
    }
  };

  const handleDownload = async () => {
    let base64 = asset.audioBase64;
    let mimeType = asset.mimeType;
    let extension = 'mp3';
    if (mimeType?.includes('wav')) {
      extension = 'wav';
    } else if (mimeType?.includes('ogg')) {
      extension = 'ogg';
    } else if (mimeType?.includes('aac')) {
      extension = 'aac';
    }

    if (hasActiveEffects) {
      setIsBaking(true);
      try {
        const decoded = await bakeEffectsOnClientSide(
          asset.audioBase64,
          asset.mimeType,
          playbackRate,
          filterFreq,
          delayFeedback,
          reverbAmount
        );
        base64 = decoded.audioBase64;
        mimeType = decoded.mimeType;
        extension = 'wav';
      } catch (err) {
        console.error("Failed to bake effects on download:", err);
      } finally {
        setIsBaking(false);
      }
    }
    
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${base64}`;
    link.download = `${asset.name.replace(/\s+/g, '_')}.${extension}`;
    link.click();
  };

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (viewMode === 'compact') {
    return (
      <div 
        id={id}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('input') || target.closest('select')) {
            return;
          }
          onFocus?.();
        }}
        className={cn(
          "py-2.5 px-4 rounded-xl bg-neutral-900/40 border border-white/[0.04] backdrop-blur-xl transition-all duration-200 relative group flex items-center justify-between gap-3 min-h-[52px]", 
          isSelected && "border-white/[0.15] bg-white/[0.02]",
          isFocused && "border-white/20 bg-white/[0.03] ring-1 ring-white/10 shadow-[0_0_10px_rgba(255,255,255,0.03)]",
          (isMetadataOpen || isKitDropdownOpen) ? "z-40" : "z-10",
          className
        )}
      >
        {/* Left Elements: Selection and Playback */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {onToggleSelect && (
            <button 
              onClick={onToggleSelect} 
              className={cn(
                "text-neutral-600 hover:text-neutral-400 transition-colors cursor-pointer select-none shrink-0", 
                isSelected && "text-white"
              )}
            >
              {isSelected ? <CheckSquare className="w-4.5 h-4.5" /> : <Square className="w-4.5 h-4.5" />}
            </button>
          )}

          {/* Small Circular Play Button */}
          <button 
            onClick={togglePlay}
            className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-100 active:scale-95 transition-all shadow shrink-0 cursor-pointer select-none"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current text-neutral-950" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current text-neutral-950 ml-0.5" />
            )}
          </button>

          {/* Editable Sound Name & Prompt Snippet */}
          <div className="flex flex-col min-w-0 flex-1 gap-0.5">
            <div className="group/rename relative flex items-center w-full">
              <input 
                className="bg-transparent border-none outline-none font-semibold text-xs text-neutral-200 focus:text-white placeholder-neutral-600 w-full tracking-tight focus:ring-0 focus:border-none p-0"
                value={localName}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                onKeyDown={handleNameKeyDown}
                placeholder="Name sound..."
                title="Click to rename"
              />
            </div>
            {/* Shortened Prompt or Tag Snippet */}
            <span className="text-[10px] text-neutral-500 truncate max-w-[280px]" title={asset.prompt}>
              {asset.prompt}
            </span>
          </div>
        </div>

        {/* Middle Elements: Compact Waveform, Category, Duration */}
        <div className="flex items-center gap-3.5 shrink-0">
          {/* Subtle compact waveform canvas */}
          <div className="w-20 h-6 relative bg-neutral-950/20 rounded border border-white/[0.01]">
            <canvas 
              ref={canvasRef} 
              onClick={handleCanvasClick}
              className="w-full h-full cursor-pointer rounded"
            />
          </div>

          {/* Category Pill */}
          {asset.category && (
            <span className={cn(
              "text-[8px] font-bold font-sans px-1.5 py-0.5 rounded border uppercase tracking-wider hidden sm:inline-flex items-center gap-1",
              asset.category === 'ambient' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
              asset.category === 'ui' && "bg-amber-500/10 text-amber-300 border-amber-500/20",
              asset.category === 'action' && "bg-rose-500/10 text-rose-300 border-rose-500/20",
              !['ambient', 'ui', 'action'].includes(asset.category) && "bg-white/[0.03] text-neutral-400 border-white/[0.05]"
            )}>
              {asset.category}
            </span>
          )}

          {/* Tags */}
          {asset.tags && asset.tags.length > 0 && (
            <div className="hidden md:flex items-center gap-1">
              {asset.tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-[8px] text-neutral-500 bg-white/[0.01] border border-white/[0.02] px-1 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Duration text */}
          <span className="text-[10px] font-mono text-neutral-500 w-10 text-right tabular-nums">
            {displayDuration > 0 ? `${displayDuration.toFixed(1)}s` : '--'}
          </span>
        </div>

        {/* Right Elements: Quick Actions & Kits Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Kit Assigner Button */}
          {kits && kits.length > 0 && (
            <div className="relative">
              <button 
                onClick={() => setIsKitDropdownOpen(!isKitDropdownOpen)}
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer select-none text-neutral-400 hover:bg-white/[0.05] hover:text-white",
                  isKitDropdownOpen && "bg-white text-black hover:bg-white"
                )}
                title="Add to Kit"
              >
                <FolderArchive className="w-3.5 h-3.5" />
              </button>

              <AnimatePresence>
                {isKitDropdownOpen && (
                  <>
                    {/* Click-away backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsKitDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="absolute right-0 bottom-full mb-2 z-50 bg-neutral-900 border border-white/[0.08] rounded-xl p-1.5 shadow-xl w-48 text-left"
                    >
                      <div className="px-2 py-1 text-[9px] font-bold text-neutral-500 uppercase tracking-wider border-b border-white/[0.03] mb-1">
                        Select Kits
                      </div>
                      <div className="max-h-40 overflow-y-auto scrollbar-none flex flex-col gap-0.5">
                        {kits.map(kit => {
                          const isInKit = kit.soundIds.includes(asset.id);
                          return (
                            <button
                              key={kit.id}
                              onClick={() => {
                                if (isInKit) {
                                  onRemoveFromKit?.(kit.id, asset.id);
                                } else {
                                  onAssignToKit?.(kit.id, asset.id);
                                  // Auto-close on assign
                                }
                              }}
                              className="flex items-center justify-between w-full text-left px-2 py-1.5 rounded-lg text-[11px] hover:bg-white/[0.04] transition-colors cursor-pointer"
                            >
                              <span className="truncate pr-2">{kit.name}</span>
                              {isInKit ? (
                                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                              ) : (
                                <Plus className="w-3 h-3 text-neutral-600 hover:text-white shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Download Button */}
          <button 
            onClick={handleDownload} 
            disabled={isBaking}
            className="w-6 h-6 rounded-full bg-white/[0.02] hover:bg-white/[0.06] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-50" 
            title="Download"
          >
            {isBaking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          </button>

          {/* Details / Effects Toggle */}
          <button
            onClick={() => setIsMetadataOpen(!isMetadataOpen)}
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer select-none text-neutral-400 hover:bg-white/[0.05] hover:text-white",
              isMetadataOpen && "bg-white text-black hover:bg-white"
            )}
            title="Show Effects & Details"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button */}
          {onReject && (
            <button 
              onClick={onReject} 
              className="w-6 h-6 rounded-full text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer shrink-0" 
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Collapsible details subpanel in compact row */}
        <AnimatePresence>
          {isMetadataOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-neutral-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-3.5"
            >
              {/* Volume & Pitch quick sliders */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 justify-between bg-white/[0.01] border border-white/[0.03] p-1.5 px-2.5 rounded-xl">
                  <span className="text-[10px] text-neutral-400 font-medium">Volume</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={volume !== undefined ? volume : 1}
                    onChange={(e) => setVolume && setVolume(parseFloat(e.target.value))}
                    className="w-24 h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-neutral-300 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-neutral-100 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow"
                  />
                </div>

                <div className="flex items-center gap-3 justify-between bg-white/[0.01] border border-white/[0.03] p-1.5 px-2.5 rounded-xl">
                  <span className="text-[10px] text-neutral-400 font-medium">Pitch ({playbackRate.toFixed(1)}x)</span>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2" 
                    step="0.05" 
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                    onMouseUp={handleEffectChangeEnd}
                    onTouchEnd={handleEffectChangeEnd}
                    className="w-24 h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-neutral-300 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-neutral-100 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow"
                  />
                </div>
              </div>

              {/* Sub-actions */}
              <div className="flex flex-wrap items-center justify-between border-t border-white/[0.04] pt-3.5 gap-2">
                <div className="flex gap-2">
                  {onTrimSilence && !asset.previousAudioBase64 && (
                    <button
                      onClick={async () => {
                        setIsTrimming(true);
                        try { await onTrimSilence(); } finally { setIsTrimming(false); }
                      }}
                      className="flex items-center gap-1.5 text-[10px] text-neutral-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.05] px-2.5 py-1 rounded-full border border-white/[0.04] cursor-pointer transition-colors"
                    >
                      <Scissors className="w-3 h-3" /> Trim Silence
                    </button>
                  )}
                  {onNormalizeLoudness && !asset.previousAudioBase64 && (
                    <button
                      onClick={async () => {
                        setIsTrimming(true);
                        try { await onNormalizeLoudness(); } finally { setIsTrimming(false); }
                      }}
                      className="flex items-center gap-1.5 text-[10px] text-neutral-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.05] px-2.5 py-1 rounded-full border border-white/[0.04] cursor-pointer transition-colors"
                    >
                      <Activity className="w-3 h-3" /> Normalize
                    </button>
                  )}
                  {onUndoTrim && asset.previousAudioBase64 && (
                    <button
                      onClick={async () => {
                        setIsTrimming(true);
                        try { await onUndoTrim(); } finally { setIsTrimming(false); }
                      }}
                      className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/20 cursor-pointer transition-colors"
                    >
                      <Undo2 className="w-3 h-3" /> Undo DSP
                    </button>
                  )}
                  {hasActiveEffects && !asset.previousAudioBase64 && (
                    <button
                      onClick={handleBakeEffects}
                      disabled={isBaking}
                      className="flex items-center gap-1.5 text-[10px] text-white bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-full border border-white/5 cursor-pointer transition-colors"
                    >
                      <Sliders className="w-3 h-3" /> Print Effects
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setIsMetadataOpen(false)}
                  className="text-[10px] text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div 
      id={id}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('select')) {
          return;
        }
        onFocus?.();
      }}
      className={cn(
        "p-4 rounded-2xl bg-neutral-900/35 border border-white/[0.04] backdrop-blur-xl transition-all duration-300 relative group", 
        isKept ? "border-white/[0.12] bg-white/[0.01]" : "", 
        isFocused && "border-white/20 bg-white/[0.03] ring-1 ring-white/10 shadow-[0_0_15px_rgba(255,255,255,0.04)]",
        (isMetadataOpen || isKitDropdownOpen) ? "z-40" : "z-10",
        className
      )}
    >
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
          <div className="group/rename relative flex items-center flex-1 w-full border-b border-transparent hover:border-white/20 focus-within:border-white/40 transition-colors">
            <input 
              className="bg-transparent border-none outline-none font-semibold text-sm text-neutral-200 focus:text-white placeholder-neutral-600 w-full tracking-tight focus:ring-0 focus:border-none p-0 pr-6"
              value={localName}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              onKeyDown={handleNameKeyDown}
              placeholder="Name this sound..."
              title="Click to rename"
            />
            <Pencil className="w-3 h-3 text-neutral-500 absolute right-1 opacity-0 group-hover/rename:opacity-100 transition-opacity pointer-events-none" />
          </div>
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
      
      {/* Active Applied Effects Pill Badges */}
      {(hasActiveEffects || asset.previousAudioBase64 || asset.appliedEffects || asset.diagnostics) && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3.5 px-0.5 animate-fade-in">
          {hasActiveEffects && (
            <span className="inline-flex items-center gap-1 text-[8px] font-bold tracking-tight text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full select-none">
              <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
              DSP ACTIVE
            </span>
          )}
          {((asset.appliedEffects?.trimSilence) || (asset.previousAudioBase64 && !asset.appliedEffects)) && (
            <span className="inline-flex items-center gap-1 text-[8px] font-bold tracking-tight text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full select-none">
              <span className="w-1 h-1 rounded-full bg-sky-400" />
              SILENCE TRIMMED
            </span>
          )}
          {asset.appliedEffects?.normalizeLoudness && (
            <span className="inline-flex items-center gap-1 text-[8px] font-bold tracking-tight text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full select-none">
              <span className="w-1 h-1 rounded-full bg-indigo-400" />
              NORMALIZED
            </span>
          )}
          {(asset.appliedEffects?.fadeIn !== undefined || asset.appliedEffects?.fadeOut !== undefined) && (
            <span className="inline-flex items-center gap-1 text-[8px] font-bold tracking-tight text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/20 px-2 py-0.5 rounded-full select-none">
              <span className="w-1 h-1 rounded-full bg-fuchsia-400" />
              FADED
            </span>
          )}
          {asset.appliedEffects?.printedRealtime && (
            <span className="inline-flex items-center gap-1 text-[8px] font-bold tracking-tight text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full select-none">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              DSP PRINTED
            </span>
          )}
          {asset.diagnostics && onShowDiagnostics && (
            <button
              onClick={() => onShowDiagnostics(asset)}
              className="inline-flex items-center gap-1 text-[8px] font-bold tracking-tight text-neutral-400 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 px-2.5 py-0.5 rounded-full transition-all cursor-pointer select-none ml-auto"
              title="Inspect DSP Pipeline Telemetry Logs"
            >
              <FileText className="w-2.5 h-2.5 text-neutral-400" />
              TELEMETRY LOG
            </button>
          )}
        </div>
      )}

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
          disabled={isBaking}
          className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed" 
          title={hasActiveEffects ? "Download WAV (Bakes current effects on-the-fly)" : "Download"}
        >
          {isBaking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        </button>
        <div className="text-[10px] font-mono text-neutral-500 tabular-nums shrink-0 w-9 text-right">
          {formatTime(currentTime)}
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.04] pt-2.5">
        <div className="flex flex-wrap gap-1 items-center">
          {asset.loop && (
            <span className="text-[9px] font-medium font-sans px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.02] text-neutral-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80"></span>
              Seamless Loop
            </span>
          )}
          <span className="text-[9px] font-medium font-sans px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.02] text-neutral-500 max-w-[200px] truncate" title={asset.prompt}>
            {asset.prompt}
          </span>
          {asset.category && (
            <span className={cn(
              "text-[9px] font-medium font-sans px-2 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1.5",
              asset.category === 'ambient' && "bg-blue-500/10 text-blue-300 border-blue-500/20",
              asset.category === 'ui' && "bg-amber-500/10 text-amber-300 border-amber-500/20",
              asset.category === 'action' && "bg-rose-500/10 text-rose-300 border-rose-500/20",
              !['ambient', 'ui', 'action'].includes(asset.category) && "bg-white/[0.03] text-neutral-300 border-white/[0.05]"
            )}>
              <span className={cn(
                "w-1 h-1 rounded-full",
                asset.category === 'ambient' && "bg-blue-400",
                asset.category === 'ui' && "bg-amber-400",
                asset.category === 'action' && "bg-rose-400",
                !['ambient', 'ui', 'action'].includes(asset.category) && "bg-neutral-400"
              )}></span>
              {asset.category}
            </span>
          )}
          {asset.tags && asset.tags.map(tag => (
            <span key={tag} className="text-[9px] font-medium font-sans px-2 py-0.5 rounded-full bg-white/[0.02] border border-white/[0.01] text-neutral-400">
              #{tag}
            </span>
          ))}
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
                onMouseUp={handleEffectChangeEnd}
                onTouchEnd={handleEffectChangeEnd}
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

            {hasActiveEffects && !asset.previousAudioBase64 && (
              <button
                onClick={handleBakeEffects}
                disabled={isBaking}
                className="ml-2 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 px-2.5 py-1 rounded-full transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                title="Print effects, filters, and speed changes permanently into the audio file"
              >
                {isBaking ? (
                  <Loader2 className="w-3 h-3 animate-spin text-white" />
                ) : (
                  <Sliders className="w-3 h-3 text-white" />
                )}
                <span className="text-[9px] font-sans font-bold text-white">Print Effects</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2.5 text-[9px] font-mono text-neutral-500">
            {displayDuration > 0 && <span>{displayDuration.toFixed(2)}s</span>}
            
            <button
              onClick={() => setIsMetadataOpen(!isMetadataOpen)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer text-[10px] font-sans font-medium border select-none",
                isMetadataOpen 
                  ? "bg-white text-black font-semibold border-white shadow-sm" 
                  : "bg-white/[0.02] text-neutral-400 hover:bg-white/[0.06] hover:text-white border-white/[0.04]"
              )}
              title="Edit Tags, Category, & Description"
            >
              <Sliders className="w-2.5 h-2.5" />
              <span>Details</span>
              <ChevronDown className={cn("w-2.5 h-2.5 transition-transform duration-200", isMetadataOpen && "rotate-180")} />
            </button>

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

      <AnimatePresence>
        {isMetadataOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="bg-white/[0.01] border-t border-white/[0.04] mt-3.5 pt-3.5 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-neutral-500" />
                    <span>Category</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['ambient', 'ui', 'action', 'voice', 'music'].map((cat) => {
                      const isActive = asset.category === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => handleCategorySelect(cat)}
                          className={cn(
                            "text-[10px] px-2.5 py-1 rounded-full border font-medium transition-all duration-200 cursor-pointer select-none uppercase tracking-wider",
                            isActive
                              ? cat === 'ambient' ? "bg-blue-500/20 text-blue-300 border-blue-400/40"
                                : cat === 'ui' ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
                                : cat === 'action' ? "bg-rose-500/20 text-rose-300 border-rose-400/40"
                                : "bg-white text-black border-white"
                              : "bg-white/[0.02] text-neutral-400 border-white/[0.04] hover:bg-white/[0.05] hover:text-white"
                          )}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tags Section */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-neutral-500" />
                    <span>Tags</span>
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {/* Current Tags */}
                    {asset.tags && asset.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        {asset.tags.map(tag => (
                          <span key={tag} className="text-[10px] font-medium font-sans px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-neutral-300 flex items-center gap-1.5 group/tag">
                            #{tag}
                            <button 
                              onClick={() => handleRemoveTag(tag)}
                              className="text-neutral-500 hover:text-rose-400 transition-colors"
                              title={`Remove ${tag}`}
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Add Tag Input */}
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full bg-neutral-950/40 border border-white/[0.06] rounded-xl pl-3 pr-10 py-1.5 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-white/20 focus:ring-0 transition-colors"
                        placeholder="Type a tag and press Enter..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            handleAddTag(newTag);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleAddTag(newTag)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-white text-neutral-400 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
                        title="Add Tag"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {/* Tag suggestions */}
                    <div className="flex flex-wrap gap-1 items-center mt-1">
                      <span className="text-[8px] font-mono text-neutral-600 uppercase tracking-wider mr-1">Suggestions:</span>
                      {['lofi', 'sci-fi', 'cinematic', 'bass', 'retro', 'glitch', 'warm', 'impact'].map(suggestion => {
                        const isAdded = asset.tags?.includes(suggestion);
                        if (isAdded) return null;
                        return (
                          <button
                            key={suggestion}
                            onClick={() => handleAddTag(suggestion)}
                            className="text-[9px] text-neutral-500 hover:text-neutral-300 bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.02] hover:border-white/[0.06] px-1.5 py-0.5 rounded transition-all cursor-pointer"
                          >
                            +{suggestion}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Source Description */}
              <div className="flex flex-col gap-2 mt-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-neutral-500" />
                  <span>Source Description</span>
                </label>
                <textarea
                  className="w-full bg-neutral-950/40 border border-white/[0.06] rounded-xl p-2.5 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-white/20 focus:ring-0 resize-none h-14 transition-colors duration-200"
                  placeholder="Layered modular synth, custom filtering, and dynamic panning..."
                  value={asset.sourceDescription || ''}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                />
              </div>

              {/* Real-time Web Audio DSP Controls */}
              <div className="border-t border-white/[0.04] pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Real-Time Studio Effects (Web Audio DSP)</span>
                  </h4>
                  {hasActiveEffects && !asset.previousAudioBase64 && (
                    <button
                      onClick={handleBakeEffects}
                      disabled={isBaking}
                      className="flex items-center gap-1.5 bg-white text-black hover:bg-neutral-200 px-3 py-1 rounded-full transition-all cursor-pointer text-[10px] font-bold shadow-md"
                      title="Commit these effects permanently to the audio file"
                    >
                      {isBaking ? (
                        <Loader2 className="w-3 h-3 animate-spin text-black" />
                      ) : (
                        <Sliders className="w-3.5 h-3.5 text-black" />
                      )}
                      <span>Print Effects to File</span>
                    </button>
                  )}
                  {asset.previousAudioBase64 && (
                    <span className="text-[9px] text-emerald-400 font-medium">Effects printed! Click 'Undo Action' to revert.</span>
                  )}
                  {!hasActiveEffects && !asset.previousAudioBase64 && (
                    <span className="text-[9px] text-neutral-600 font-mono">Simulated Analog Signal Path</span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white/[0.01] border border-white/[0.02] p-3 rounded-xl">
                  {/* Pitch Shift (Playback Rate) */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-neutral-400 font-sans">Pitch Shift</span>
                      <span className="text-white font-mono">
                        {playbackRate === 1 ? 'NORMAL' : `${playbackRate > 1 ? '+' : ''}${Math.round((playbackRate - 1) * 100)}%`}
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2" 
                      step="0.05"
                      value={playbackRate}
                      onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                      onMouseUp={handleEffectChangeEnd}
                      onTouchEnd={handleEffectChangeEnd}
                      className="w-full accent-white bg-neutral-800/80 h-1 rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] font-mono text-neutral-600">
                      <span>Low & Slow (-50%)</span>
                      <span>High & Fast (+100%)</span>
                    </div>
                  </div>

                  {/* Low-pass Filter cutoff */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-neutral-400 font-sans">Low-Pass Filter Cutoff</span>
                      <span className="text-white font-mono">{filterFreq === 20000 ? 'BYPASS (20 kHz)' : `${(filterFreq / 1000).toFixed(1)} kHz`}</span>
                    </div>
                    <input 
                      type="range" 
                      min="200" 
                      max="20000" 
                      step="100"
                      value={filterFreq}
                      onChange={(e) => setFilterFreq(parseInt(e.target.value))}
                      onMouseUp={handleEffectChangeEnd}
                      onTouchEnd={handleEffectChangeEnd}
                      className="w-full accent-white bg-neutral-800/80 h-1 rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] font-mono text-neutral-600">
                      <span>Muffled (200Hz)</span>
                      <span>Bright (20kHz)</span>
                    </div>
                  </div>

                  {/* Delay Echo feedback */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-neutral-400 font-sans">Space Echo (Delay)</span>
                      <span className="text-white font-mono">{delayFeedback === 0 ? 'DRY (0%)' : `${Math.round(delayFeedback * 100)}%`}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="0.8" 
                      step="0.05"
                      value={delayFeedback}
                      onChange={(e) => setDelayFeedback(parseFloat(e.target.value))}
                      onMouseUp={handleEffectChangeEnd}
                      onTouchEnd={handleEffectChangeEnd}
                      className="w-full accent-white bg-neutral-800/80 h-1 rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] font-mono text-neutral-600">
                      <span>Dry (Off)</span>
                      <span>Spacious (80%)</span>
                    </div>
                  </div>

                  {/* Reverb Amount */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-neutral-400 font-sans">Hall Reverb</span>
                      <span className="text-white font-mono">{reverbAmount === 0 ? 'DRY (0%)' : `${Math.round(reverbAmount * 100)}%`}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1.5" 
                      step="0.1"
                      value={reverbAmount}
                      onChange={(e) => setReverbAmount(parseFloat(e.target.value))}
                      onMouseUp={handleEffectChangeEnd}
                      onTouchEnd={handleEffectChangeEnd}
                      className="w-full accent-white bg-neutral-800/80 h-1 rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] font-mono text-neutral-600">
                      <span>Dry (Off)</span>
                      <span>Cathedral (150%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

