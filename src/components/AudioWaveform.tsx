import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Download, Trash2, CheckCircle, Circle, Volume2, Activity, Info, CheckSquare, Square, Scissors, Loader2, Undo2, Sliders, Tag, ChevronDown, Plus, X, FileText, Layers, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  onUpdateAsset?: (updatedAsset: SoundAsset) => void;
  isKept?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  className?: string;
}

export function AudioWaveform({ asset, onKeep, onReject, onRename, onTrimSilence, onUndoTrim, onNormalizeLoudness, onFadeAudio, onUpdateAsset, isKept, isSelected, onToggleSelect, className }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isTrimming, setIsTrimming] = useState(false);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
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
                  <span className="text-[9px] text-neutral-600 font-mono">Simulated Analog Signal Path</span>
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

