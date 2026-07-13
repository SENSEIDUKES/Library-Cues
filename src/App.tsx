import { useMemo, useState } from 'react';
import { AlertTriangle, FolderArchive, Library, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { GenerationParams, SoundAsset } from './types';
import type { LibraryCueAsset, StoredCueRecord, ValidationIssue } from './types/cues';
import { GenerationControls } from './components/GenerationControls';
import { GeneratedVariations } from './components/GeneratedVariations';
import { SavedCueLibrary } from './components/SavedCueLibrary';
import { CueMetadataEditor } from './components/cue-editor/CueMetadataEditor';
import { useSoundLibrary } from './hooks/useSoundLibrary';
import { createCueAssetDefaults } from './lib/cueDefaults';
import { withCanonicalCueIdentity } from './lib/cueId';
import { cueRecordToSoundAsset } from './lib/cueRecord';
import { validateCueAsset } from './lib/cueValidation';
import { base64ByteLength } from './lib/mime';
import { inspectAudioBase64, type AudioInspection } from './lib/audio';

interface CueEditorState {
  asset: LibraryCueAsset;
  source: SoundAsset;
  inspection?: AudioInspection;
  record?: StoredCueRecord;
}

const defaultGenerationParams: GenerationParams = {
  prompt: '',
  durationSeconds: 4,
  promptInfluence: 0.7,
  loop: false,
  trimSilence: false,
  normalizeLoudness: false,
  fadeIn: 0,
  fadeOut: 0,
};

const newInternalId = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function App() {
  const [params, setParams] = useState<GenerationParams>(defaultGenerationParams);
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingCount, setGeneratingCount] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [variations, setVariations] = useState<SoundAsset[]>([]);
  const [activeTab, setActiveTab] = useState<'synthesize' | 'library'>('synthesize');
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cueEditor, setCueEditor] = useState<CueEditorState | null>(null);
  const [preparingCueId, setPreparingCueId] = useState<string | null>(null);

  const {
    library,
    isLoading,
    storageError,
    approvedCount,
    handleSaveCueRecord,
    handleRemoveFromLibrary,
    handleBulkRemoveFromLibrary,
    handleRenameLibraryAsset,
    exportKit,
  } = useSoundLibrary();

  const keptIds = useMemo(() => new Set(library.map((record) => record.id)), [library]);

  const inspectOrFallback = async (asset: SoundAsset): Promise<Partial<AudioInspection>> => {
    try {
      return await inspectAudioBase64(asset.audioBase64);
    } catch (error) {
      console.warn('Audio metadata decoding failed; preserving requested duration as a fallback.', error);
      return {
        durationMs: Math.round((asset.durationSeconds ?? 0) * 1000),
        fileSizeBytes: base64ByteLength(asset.audioBase64),
      };
    }
  };

  const openCueEditorForVariation = async (asset: SoundAsset) => {
    const existing = library.find((record) => record.id === asset.id);
    if (existing) {
      setCueEditor({ asset: existing.cue, source: cueRecordToSoundAsset(existing), record: existing });
      return;
    }

    setPreparingCueId(asset.id);
    setErrorMsg(null);
    try {
      const inspection = await inspectOrFallback(asset);
      setCueEditor({
        asset: createCueAssetDefaults(asset, inspection),
        source: asset,
        inspection: inspection as AudioInspection,
      });
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Unable to prepare this cue for curation.');
    } finally {
      setPreparingCueId(null);
    }
  };

  const openCueEditorForRecord = async (record: StoredCueRecord) => {
    const source = cueRecordToSoundAsset(record);
    setPreparingCueId(record.id);
    try {
      const inspection = await inspectOrFallback(source);
      setCueEditor({
        asset: {
          ...record.cue,
          audio: {
            ...record.cue.audio,
            durationMs: inspection.durationMs ?? record.cue.audio.durationMs,
            fileSizeBytes: inspection.fileSizeBytes ?? record.cue.audio.fileSizeBytes,
          },
        },
        source,
        inspection: inspection as AudioInspection,
        record,
      });
    } finally {
      setPreparingCueId(null);
    }
  };

  const saveCuratedCue = async (draft: LibraryCueAsset): Promise<ValidationIssue[] | void> => {
    if (!cueEditor) return;
    const now = new Date().toISOString();
    const existingIds = library
      .filter((record) => record.id !== cueEditor.record?.id)
      .map((record) => record.cue.id);
    const identified = withCanonicalCueIdentity(draft, existingIds, Boolean(cueEditor.record));
    const approvedAt = identified.curation.status === 'approved'
      ? identified.curation.approvedAt ?? now
      : undefined;
    const cue: LibraryCueAsset = {
      ...identified,
      createdAt: cueEditor.record?.cue.createdAt ?? identified.createdAt,
      updatedAt: now,
      curation: {
        ...identified.curation,
        approvedAt,
      },
    };
    const validation = validateCueAsset(cue);
    if (!validation.valid) return validation.issues;

    const record: StoredCueRecord = {
      id: cueEditor.record?.id ?? cueEditor.source.id ?? newInternalId(),
      cue,
      audioBase64: cueEditor.record?.audioBase64 ?? cueEditor.source.audioBase64,
      previousAudioBase64: cueEditor.record?.previousAudioBase64,
      peaks: cueEditor.record?.peaks ?? cueEditor.inspection?.peaks,
      sampleRate: cueEditor.record?.sampleRate ?? cueEditor.inspection?.sampleRate,
    };
    await handleSaveCueRecord(record);
    setCueEditor(null);
    setNotice(`${cue.displayName} saved as ${cue.curation.status}.`);
  };

  const applyProcessedAudio = async (
    asset: SoundAsset,
    audioBase64: string,
    record?: StoredCueRecord,
  ) => {
    const inspection = await inspectOrFallback({ ...asset, audioBase64 });
    if (record) {
      await handleSaveCueRecord({
        ...record,
        audioBase64,
        previousAudioBase64: asset.audioBase64,
        peaks: inspection.peaks,
        sampleRate: inspection.sampleRate,
        cue: {
          ...record.cue,
          audio: {
            ...record.cue.audio,
            durationMs: inspection.durationMs ?? record.cue.audio.durationMs,
            fileSizeBytes: inspection.fileSizeBytes ?? base64ByteLength(audioBase64),
          },
          updatedAt: new Date().toISOString(),
        },
      });
      return;
    }

    setVariations((current) => current.map((candidate) => candidate.id === asset.id ? {
      ...candidate,
      audioBase64,
      previousAudioBase64: asset.audioBase64,
      peaks: inspection.peaks,
      sampleRate: inspection.sampleRate,
      durationSeconds: inspection.durationMs !== undefined ? inspection.durationMs / 1000 : candidate.durationSeconds,
      fileSize: inspection.fileSizeBytes,
    } : candidate));
  };

  const processAudio = async (
    asset: SoundAsset,
    endpoint: '/api/trim-silence' | '/api/normalize' | '/api/fade',
    record?: StoredCueRecord,
  ) => {
    setErrorMsg(null);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: asset.audioBase64,
          mimeType: asset.mimeType,
          ...(endpoint === '/api/fade' ? { fadeIn: params.fadeIn, fadeOut: params.fadeOut } : {}),
        }),
      });
      if (!response.ok) throw new Error(`Audio processing failed (${response.status}).`);
      const data = await response.json() as { audioBase64?: string };
      if (!data.audioBase64) throw new Error('Audio processing returned no audio data.');
      await applyProcessedAudio(asset, data.audioBase64, record);
    } catch (error) {
      console.error('Audio processing failed.', error);
      setErrorMsg(error instanceof Error ? error.message : 'Audio processing failed.');
    }
  };

  const undoAudioProcessing = async (asset: SoundAsset, record?: StoredCueRecord) => {
    if (!asset.previousAudioBase64) return;
    const restoredBase64 = asset.previousAudioBase64;
    const inspection = await inspectOrFallback({ ...asset, audioBase64: restoredBase64 });
    if (record) {
      await handleSaveCueRecord({
        ...record,
        audioBase64: restoredBase64,
        previousAudioBase64: undefined,
        peaks: inspection.peaks,
        sampleRate: inspection.sampleRate,
        cue: {
          ...record.cue,
          audio: {
            ...record.cue.audio,
            durationMs: inspection.durationMs ?? record.cue.audio.durationMs,
            fileSizeBytes: inspection.fileSizeBytes ?? base64ByteLength(restoredBase64),
          },
          updatedAt: new Date().toISOString(),
        },
      });
      return;
    }
    setVariations((current) => current.map((candidate) => candidate.id === asset.id ? {
      ...candidate,
      audioBase64: restoredBase64,
      previousAudioBase64: undefined,
      peaks: inspection.peaks,
      sampleRate: inspection.sampleRate,
      durationSeconds: inspection.durationMs !== undefined ? inspection.durationMs / 1000 : candidate.durationSeconds,
      fileSize: inspection.fileSizeBytes,
    } : candidate));
  };

  const handleGenerate = async (count = 1, useCache = false) => {
    setIsGenerating(true);
    setGeneratingCount(count);
    setErrorMsg(null);
    setNotice(null);
    setVariations([]);

    try {
      const requests = Array.from({ length: count }, (_, index) => index + 1).map(async (number) => {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...params,
            elevenLabsApiKey,
            useCache,
            variationLabel: count > 1 ? `Variation ${number}` : 'Variation',
          }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({})) as { error?: string };
          throw new Error(body.error || 'Failed to generate audio.');
        }
        const data = await response.json() as { audioBase64: string; mimeType: string };
        return {
          id: newInternalId(),
          name: count > 1 ? `SFX - Var ${number}` : 'SFX',
          prompt: params.prompt,
          audioBase64: data.audioBase64,
          mimeType: data.mimeType,
          createdAt: Date.now(),
          durationSeconds: params.durationSeconds,
          loop: params.loop,
          fileSize: base64ByteLength(data.audioBase64),
          generationParams: { ...params },
        } satisfies SoundAsset;
      });

      const results = await Promise.allSettled(requests);
      const successful = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
      if (successful.length === 0) {
        const failure = results.find((result) => result.status === 'rejected') as PromiseRejectedResult | undefined;
        throw new Error(failure?.reason?.message || 'Failed to generate audio.');
      }
      setVariations(successful);
      if (successful.length < count) setNotice(`${successful.length} of ${count} variations were generated.`);
    } catch (error) {
      console.error('Sound generation failed.', error);
      setErrorMsg(error instanceof Error ? error.message : 'Sound generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleSelectAll = () => {
    setSelectedLibraryIds((current) => current.size === library.length
      ? new Set()
      : new Set(library.map((record) => record.id)));
  };

  const handleToggleSelect = (id: string) => {
    setSelectedLibraryIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApprovedExport = async () => {
    setErrorMsg(null);
    try {
      const result = await exportKit();
      setNotice(`Exported ${result.manifest.cues.length} approved cue${result.manifest.cues.length === 1 ? '' : 's'}.`);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Cue export failed.');
    }
  };

  const handleSelectedExport = async () => {
    const selected = library.filter((record) => selectedLibraryIds.has(record.id));
    setErrorMsg(null);
    try {
      const result = await exportKit(selected);
      setNotice(`Exported ${result.manifest.cues.length} selected cue${result.manifest.cues.length === 1 ? '' : 's'}.`);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Cue export failed.');
    }
  };

  const confirmBulkDelete = async () => {
    await handleBulkRemoveFromLibrary([...selectedLibraryIds]);
    setSelectedLibraryIds(new Set());
    setShowDeleteModal(false);
    setNotice(null);
  };

  const handleDeleteRecord = async (id: string) => {
    await handleRemoveFromLibrary(id);
    setSelectedLibraryIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    setNotice(null);
  };

  const visibleError = errorMsg ?? storageError;

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex justify-center font-sans antialiased w-full relative">
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.015] rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="w-full max-w-7xl min-h-screen relative flex flex-col border-x border-white/[0.02]">
        <header className="px-5 py-4 border-b border-white/[0.04] bg-black/80 backdrop-blur-xl flex items-center justify-between z-35 shrink-0 sticky top-0">
          <div className="flex items-center gap-2.5">
            <img src="https://pub-e482c2dbbb984c3c87ecdd8ae3a92183.r2.dev/LIBRARY/images/CELESTIAL%20LIBRARY%20ICON.jpg" alt="Library Cues Logo" className="w-8 h-8 rounded-lg object-cover shadow-md shadow-white/5" />
            <div><h1 className="text-sm font-bold tracking-tight text-neutral-100 leading-tight">Library Cues</h1><p className="text-[10px] text-neutral-500 font-medium tracking-wide uppercase">Sound engine</p></div>
          </div>
          <AnimatePresence mode="wait">
            {activeTab === 'library' && library.length > 0 && (
              <motion.button
                key="export-approved"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => void handleApprovedExport()}
                disabled={approvedCount === 0}
                title={approvedCount === 0 ? 'Approve a cue or explicitly select candidates to export.' : 'Export approved cues'}
                className="flex items-center gap-1.5 text-[11px] font-semibold bg-white text-black px-3 py-1.5 rounded-full transition-all shadow cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-35"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export Approved ({approvedCount})</span>
                <span className="sm:hidden">Export ({approvedCount})</span>
              </motion.button>
            )}
          </AnimatePresence>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-none pb-24 relative bg-black">
          <AnimatePresence mode="wait">
            {activeTab === 'synthesize' ? (
              <motion.div key="synthesize-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="p-5 flex flex-col gap-5">
                <section className="bg-neutral-900/30 border border-white/[0.03] rounded-2xl p-4.5 backdrop-blur-md">
                  <GenerationControls
                    params={params}
                    onChange={setParams}
                    onGenerate={handleGenerate}
                    elevenLabsApiKey={elevenLabsApiKey}
                    onElevenLabsApiKeyChange={setElevenLabsApiKey}
                    isGenerating={isGenerating}
                  />
                </section>
                {visibleError && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-2xl text-rose-200 text-[12px] flex items-start gap-2" role="alert">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" /><p className="leading-relaxed">{visibleError}</p>
                  </motion.div>
                )}
                {(notice || preparingCueId) && <p className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-200/80" role="status">{preparingCueId ? 'Reading decoded audio metadata…' : notice}</p>}
                <GeneratedVariations
                  variations={variations}
                  isGenerating={isGenerating}
                  generatingCount={generatingCount}
                  keptIds={keptIds}
                  onKeep={(asset) => void openCueEditorForVariation(asset)}
                  onReject={(id) => setVariations((current) => current.filter((asset) => asset.id !== id))}
                  onRename={(id, name) => setVariations((current) => current.map((asset) => asset.id === id ? { ...asset, name } : asset))}
                  onTrimSilence={(asset) => processAudio(asset, '/api/trim-silence')}
                  onUndo={(asset) => undoAudioProcessing(asset)}
                  onNormalize={(asset) => processAudio(asset, '/api/normalize')}
                  onFade={(asset) => params.fadeIn === 0 && params.fadeOut === 0 ? Promise.resolve() : processAudio(asset, '/api/fade')}
                />
              </motion.div>
            ) : (
              <motion.div key="library-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="p-5 flex flex-col gap-3.5">
                {visibleError && <p className="rounded-xl border border-rose-500/20 bg-rose-950/20 px-3 py-2 text-xs text-rose-200" role="alert">{visibleError}</p>}
                {notice && <p className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-200/80" role="status">{notice}</p>}
                {isLoading && library.length === 0 ? <p className="py-20 text-center text-xs text-neutral-500">Loading saved cues…</p> : (
                  <SavedCueLibrary
                    records={library}
                    selectedIds={selectedLibraryIds}
                    onOpenSynthesizer={() => setActiveTab('synthesize')}
                    onToggleSelect={handleToggleSelect}
                    onToggleSelectAll={handleToggleSelectAll}
                    onDeleteSelected={() => setShowDeleteModal(true)}
                    onExportSelected={() => void handleSelectedExport()}
                    onDelete={(id) => void handleDeleteRecord(id)}
                    onRename={(id, name) => void handleRenameLibraryAsset(id, name)}
                    onEdit={(record) => void openCueEditorForRecord(record)}
                    onTrimSilence={(record) => processAudio(cueRecordToSoundAsset(record), '/api/trim-silence', record)}
                    onUndo={(record) => undoAudioProcessing(cueRecordToSoundAsset(record), record)}
                    onNormalize={(record) => processAudio(cueRecordToSoundAsset(record), '/api/normalize', record)}
                    onFade={(record) => params.fadeIn === 0 && params.fadeOut === 0 ? Promise.resolve() : processAudio(cueRecordToSoundAsset(record), '/api/fade', record)}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="w-full py-8 pb-28 text-center flex flex-col items-center justify-center gap-1.5 mt-auto border-t border-white/[0.04]">
          <p className="text-sm font-medium tracking-wide text-neutral-400">Ⓢ SEN</p><p className="text-xs text-neutral-500 font-medium">SEIHouse Expanded Novels</p><p className="text-[10px] text-neutral-600 uppercase tracking-widest mt-1">An Experience by SEIHouse Productions LLC</p>
        </footer>
        <div className="absolute bottom-0 left-0 right-0 h-[72px] bg-black/85 border-t border-white/[0.04] backdrop-blur-xl flex items-center justify-around px-6 pb-4 z-40 shrink-0">
          <button onClick={() => setActiveTab('synthesize')} className={`flex flex-col items-center gap-1.5 cursor-pointer select-none relative transition-colors py-1 ${activeTab === 'synthesize' ? 'text-white' : 'text-neutral-500'}`}>
            <Sparkles className="w-4.5 h-4.5" /><span className="text-[10px] font-bold tracking-tight">Synthesize</span>{activeTab === 'synthesize' && <motion.div layoutId="activeTabDot" className="absolute -bottom-2 w-1.5 h-1.5 bg-white rounded-full" />}
          </button>
          <button onClick={() => setActiveTab('library')} className={`flex flex-col items-center gap-1.5 cursor-pointer select-none relative transition-colors py-1 ${activeTab === 'library' ? 'text-white' : 'text-neutral-500'}`}>
            <div className="relative"><Library className="w-4.5 h-4.5" />{library.length > 0 && <span className="absolute -top-1.5 -right-2.5 bg-white text-black font-bold text-[8px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow">{library.length}</span>}</div>
            <span className="text-[10px] font-bold tracking-tight">Saved Kit</span>{activeTab === 'library' && <motion.div layoutId="activeTabDot" className="absolute -bottom-2 w-1.5 h-1.5 bg-white rounded-full" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-neutral-900 border border-white/[0.04] p-6 rounded-2xl max-w-sm w-full shadow-2xl flex flex-col gap-4" role="alertdialog" aria-modal="true" aria-labelledby="delete-cues-title">
              <div className="flex flex-col gap-2"><h2 id="delete-cues-title" className="text-lg font-semibold text-white flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-rose-500" />Delete Selected Assets?</h2><p className="text-sm text-neutral-400 leading-relaxed">Delete {selectedLibraryIds.size} selected cue{selectedLibraryIds.size === 1 ? '' : 's'}? This cannot be undone.</p></div>
              <div className="flex gap-3 mt-2"><button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 px-4 bg-neutral-800 text-white text-sm font-semibold rounded-xl hover:bg-neutral-700">Cancel</button><button onClick={() => void confirmBulkDelete()} className="flex-1 py-2.5 px-4 bg-rose-600/90 text-white text-sm font-semibold rounded-xl hover:bg-rose-500">Delete</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {cueEditor && <CueMetadataEditor asset={cueEditor.asset} open onCancel={() => setCueEditor(null)} onSave={saveCuratedCue} />}
    </div>
  );
}
