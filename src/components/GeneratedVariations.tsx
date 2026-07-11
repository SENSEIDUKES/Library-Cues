import { Sparkles } from 'lucide-react';
import type { SoundAsset } from '../types';
import { AudioWaveform } from './AudioWaveform';

interface GeneratedVariationsProps {
  variations: SoundAsset[];
  isGenerating: boolean;
  generatingCount: number;
  keptIds: Set<string>;
  onKeep: (asset: SoundAsset) => void;
  onReject: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onTrimSilence: (asset: SoundAsset) => Promise<void>;
  onUndo: (asset: SoundAsset) => Promise<void>;
  onNormalize: (asset: SoundAsset) => Promise<void>;
  onFade: (asset: SoundAsset) => Promise<void>;
}

function VariationSkeleton({ index }: { key?: string; index: number }) {
  return (
    <div
      aria-label={`Generating variation ${index + 1}`}
      className="p-4 rounded-2xl bg-neutral-900/35 border border-white/[0.04] backdrop-blur-xl relative flex flex-col animate-pulse"
    >
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5 w-full">
          <div className="w-4.5 h-4.5 rounded-full bg-neutral-800 shrink-0" />
          <div className="h-4 bg-neutral-800 rounded-md w-32" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-neutral-800 rounded-sm" />
          <div className="w-4 h-4 bg-neutral-800 rounded-sm" />
        </div>
      </div>
      <div className="flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-full bg-neutral-800 shrink-0" />
        <div className="flex-1 min-w-0 relative h-10 bg-neutral-800/50 rounded-lg" />
        <div className="w-10 h-3 bg-neutral-800 rounded-sm shrink-0" />
      </div>
      <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-white/[0.04] pt-2.5">
        <div className="h-3 bg-neutral-800 rounded-full w-48" />
        <div className="h-3 bg-neutral-800 rounded-sm w-20" />
      </div>
    </div>
  );
}

export function GeneratedVariations({
  variations,
  isGenerating,
  generatingCount,
  keptIds,
  onKeep,
  onReject,
  onRename,
  onTrimSilence,
  onUndo,
  onNormalize,
  onFade,
}: GeneratedVariationsProps) {
  if (variations.length === 0 && !isGenerating) return null;

  return (
    <section className="flex flex-col gap-3.5 mt-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[11px] font-bold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
          Generated Variations
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {isGenerating
          ? Array.from({ length: generatingCount }, (_, index) => (
              <VariationSkeleton key={`skeleton-${index}`} index={index} />
            ))
          : variations.map((asset) => (
              <AudioWaveform
                key={asset.id}
                asset={asset}
                onKeep={() => onKeep(asset)}
                onReject={() => onReject(asset.id)}
                onRename={(name) => onRename(asset.id, name)}
                onTrimSilence={() => onTrimSilence(asset)}
                onUndoTrim={() => onUndo(asset)}
                onNormalizeLoudness={() => onNormalize(asset)}
                onFadeAudio={() => onFade(asset)}
                isKept={keptIds.has(asset.id)}
              />
            ))}
      </div>
    </section>
  );
}
