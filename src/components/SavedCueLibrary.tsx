import { AnimatePresence, motion } from 'motion/react';
import { CheckSquare, Download, Library, Square, Trash2 } from 'lucide-react';
import type { StoredCueRecord } from '../types/cues';
import { cueRecordToSoundAsset } from '../lib/cueRecord';
import { AudioWaveform } from './AudioWaveform';

interface SavedCueLibraryProps {
  records: StoredCueRecord[];
  selectedIds: Set<string>;
  onOpenSynthesizer: () => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onDeleteSelected: () => void;
  onExportSelected: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onEdit: (record: StoredCueRecord) => void;
  onTrimSilence: (record: StoredCueRecord) => Promise<void>;
  onUndo: (record: StoredCueRecord) => Promise<void>;
  onNormalize: (record: StoredCueRecord) => Promise<void>;
  onFade: (record: StoredCueRecord) => Promise<void>;
}

export function SavedCueLibrary({
  records,
  selectedIds,
  onOpenSynthesizer,
  onToggleSelect,
  onToggleSelectAll,
  onDeleteSelected,
  onExportSelected,
  onDelete,
  onRename,
  onEdit,
  onTrimSilence,
  onUndo,
  onNormalize,
  onFade,
}: SavedCueLibraryProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-14 h-14 rounded-full bg-neutral-900/60 border border-white/[0.04] flex items-center justify-center text-neutral-500 mb-4 shadow-inner">
          <Library className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-300">Your library is empty</h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-[240px] leading-relaxed">
          Generate a variation, classify its metadata, and save it to build a resolver-ready cue kit.
        </p>
        <button
          onClick={onOpenSynthesizer}
          className="mt-5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-white/[0.04] text-neutral-300 text-xs font-semibold rounded-full transition-all cursor-pointer select-none"
        >
          Open Synthesizer
        </button>
      </div>
    );
  }

  const allSelected = selectedIds.size === records.length;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between px-1 mb-1 gap-3">
        <button
          onClick={onToggleSelectAll}
          className="flex items-center gap-2 text-[11px] font-bold text-neutral-400 hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
        >
          {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          Select All
        </button>

        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <span className="text-[10px] text-neutral-500 font-medium tracking-wide">
                {selectedIds.size} selected
              </span>
              <button
                onClick={onDeleteSelected}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                title="Delete selected"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onExportSelected}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold bg-white text-black rounded-full hover:bg-neutral-200 transition-colors cursor-pointer"
                title="Export selected"
              >
                <Download className="w-3 h-3" />
                Export
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {records.map((record) => (
        <AudioWaveform
          key={record.id}
          asset={cueRecordToSoundAsset(record)}
          onReject={() => onDelete(record.id)}
          onRename={(name) => onRename(record.id, name)}
          onEdit={() => onEdit(record)}
          onTrimSilence={() => onTrimSilence(record)}
          onUndoTrim={() => onUndo(record)}
          onNormalizeLoudness={() => onNormalize(record)}
          onFadeAudio={() => onFade(record)}
          isSelected={selectedIds.has(record.id)}
          onToggleSelect={() => onToggleSelect(record.id)}
          badges={[record.cue.category, record.cue.curation.status]}
        />
      ))}
    </div>
  );
}
