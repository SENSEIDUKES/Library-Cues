import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { SoundAsset, SoundKit } from '../types';
import { AudioWaveform } from './AudioWaveform';
import { Cpu, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

export interface VirtualizedSoundListProps {
  items: SoundAsset[];
  viewDensity: 'comfortable' | 'compact';
  kits: SoundKit[];
  selectedLibraryIds: Set<string>;
  focusedSoundId: string | null;
  setFocusedSoundId: (id: string | null) => void;
  handleRemoveFromLibrary: (id: string) => void;
  handleRenameLibraryAsset: (id: string, name: string) => void;
  handleTrimSilence: (asset: SoundAsset) => void;
  handleUndoTrim: (asset: SoundAsset) => void;
  handleNormalizeLoudness: (asset: SoundAsset) => void;
  handleFade: (asset: SoundAsset) => void;
  handleUpdateAsset: (asset: SoundAsset) => void;
  handleToggleSelect: (id: string) => void;
  setSelectedDiagnosticAsset: (asset: SoundAsset | null) => void;
  handleAssignSoundToKit: (kitId: string, soundId: string) => void;
  handleRemoveSoundFromKit: (kitId: string, soundId: string) => void;
  className?: string;
  showTelemetry?: boolean;
}

function VirtualizedSoundListComponent({
  items,
  viewDensity,
  kits,
  selectedLibraryIds,
  focusedSoundId,
  setFocusedSoundId,
  handleRemoveFromLibrary,
  handleRenameLibraryAsset,
  handleTrimSilence,
  handleUndoTrim,
  handleNormalizeLoudness,
  handleFade,
  handleUpdateAsset,
  handleToggleSelect,
  setSelectedDiagnosticAsset,
  handleAssignSoundToKit,
  handleRemoveSoundFromKit,
  className,
  showTelemetry = true,
}: VirtualizedSoundListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Find the scrollable parent container (the app main scroll container or window)
  const getScrollElement = useCallback(() => {
    if (typeof document === 'undefined') return null;
    const parentContainer = document.getElementById('app-main-scroll-container') ||
      containerRef.current?.closest('.overflow-y-auto') ||
      document.documentElement;
    return parentContainer as HTMLElement;
  }, []);

  const estimateRowHeight = useMemo(() => {
    return viewDensity === 'compact' ? 68 : 178;
  }, [viewDensity]);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement,
    estimateSize: () => estimateRowHeight,
    getItemKey: (index) => items[index]?.id ?? index,
    overscan: 4,
    gap: 12,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  // Scroll to focused item if user navigates via keyboard shortcuts
  useEffect(() => {
    if (!focusedSoundId) return;
    const index = items.findIndex(item => item.id === focusedSoundId);
    if (index !== -1) {
      rowVirtualizer.scrollToIndex(index, { align: 'auto', behavior: 'smooth' });
    }
  }, [focusedSoundId, items, rowVirtualizer]);

  const mountedCount = virtualItems.length;
  const memorySavingsPercent = items.length > 0 
    ? Math.max(0, Math.round(((items.length - mountedCount) / items.length) * 100))
    : 0;

  return (
    <div ref={containerRef} className={cn("w-full relative flex flex-col gap-3", className)}>
      {/* Telemetry pill when library is large */}
      {showTelemetry && items.length >= 15 && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900/30 border border-white/[0.04] rounded-xl text-[10px] text-neutral-400 font-mono backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span className="text-neutral-300 font-semibold">Virtualized Windowing</span>
            <span className="text-neutral-500">•</span>
            <span>
              <strong className="text-white">{mountedCount}</strong> of <strong className="text-white">{items.length}</strong> live DOM cards
            </span>
          </div>

          <div className="flex items-center gap-2">
            {memorySavingsPercent > 0 && (
              <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-semibold text-[9px] flex items-center gap-1">
                <Cpu className="w-2.5 h-2.5" />
                {memorySavingsPercent}% DOM & Audio RAM Freed
              </span>
            )}
          </div>
        </div>
      )}

      {/* Virtualized Container */}
      <div
        style={{
          height: `${totalSize}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map(virtualRow => {
          const asset = items[virtualRow.index];
          if (!asset) return null;

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                contain: 'paint layout',
              }}
              className="pb-3"
            >
              <AudioWaveform
                id={`sound-card-${asset.id}`}
                asset={asset}
                onReject={handleRemoveFromLibrary}
                onRenameAsset={handleRenameLibraryAsset}
                onTrimSilence={handleTrimSilence}
                onUndoTrim={handleUndoTrim}
                onNormalizeLoudness={handleNormalizeLoudness}
                onFadeAudio={handleFade}
                onUpdateAsset={handleUpdateAsset}
                isSelected={selectedLibraryIds.has(asset.id)}
                onToggleSelect={handleToggleSelect}
                onShowDiagnostics={setSelectedDiagnosticAsset}
                viewMode={viewDensity === 'compact' ? 'compact' : 'detailed'}
                kits={kits}
                onAssignToKit={handleAssignSoundToKit}
                onRemoveFromKit={handleRemoveSoundFromKit}
                isFocused={focusedSoundId === asset.id}
                onFocus={setFocusedSoundId}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const VirtualizedSoundList = React.memo(VirtualizedSoundListComponent);
