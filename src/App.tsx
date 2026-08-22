import React, { useState, useCallback, useMemo } from 'react';
import { SoundAsset } from './types';
import { GenerationControls } from './components/GenerationControls';
import { AudioWaveform } from './components/AudioWaveform';
import { FolderArchive, Library, Sparkles, AlertTriangle, CheckSquare, Square, Trash2, Download, CheckCircle, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSoundLibrary } from './hooks/useSoundLibrary';
import { useGenerationState } from './hooks/useGenerationState';
import { useLibraryFilters } from './hooks/useLibraryFilters';
import { useAudioProcessing } from './hooks/useAudioProcessing';
import { useDiagnosticsLab } from './hooks/useDiagnosticsLab';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { LibraryView } from './components/LibraryView';
import { ProfileView } from './components/ProfileView';
import { CreateKitModal } from './components/CreateKitModal';
import { KitTemplate } from './data/kitTemplates';
import { RenameKitModal } from './components/RenameKitModal';
import { BatchAssignModal } from './components/BatchAssignModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { TestCenterModal } from './components/TestCenterModal';
import { ShortcutsOverlay } from './components/ShortcutsOverlay';
import { DiagnosticToast } from './components/common';
import { cn } from './lib/utils';

export default function App() {
  const [activeTab, setActiveTab] = useState<'synthesize' | 'library' | 'profile'>('synthesize');

  // Sound Library persistence & kits hook
  const {
    library,
    kits,
    handleKeep,
    handleBulkKeep,
    handleRemoveFromLibrary,
    handleBulkRemoveFromLibrary,
    handleRenameLibraryAsset,
    handleUpdateAsset,
    handleCreateKit,
    handleDeleteKit,
    handleRenameKit,
    handleAssignSoundToKit,
    handleRemoveSoundFromKit,
    handleBulkAssignSoundsToKit,
    handleBulkRemoveSoundsFromKit,
    exportKit
  } = useSoundLibrary();

  // Audio DSP processing and diagnostic toasts hook
  const {
    selectedDiagnosticAsset,
    setSelectedDiagnosticAsset,
    diagnosticToast,
    setDiagnosticToast,
    showToast,
    handleTrimSilence,
    handleNormalizeLoudness,
    handleFade,
    handleUndoTrim
  } = useAudioProcessing(handleUpdateAsset);

  // Audio synthesis & variations generation hook
  const {
    params,
    setParams,
    isGenerating,
    generatingCount,
    errorMsg,
    variations,
    setVariations,
    selectedSynthesisIds,
    setSelectedSynthesisIds,
    handleGenerate,
    handleReject,
    handleRenameVariation,
    handleToggleSynthesisSelect,
    handleToggleSynthesisSelectAll,
    handleBulkKeepSynthesis,
    handleBulkExportSynthesis,
    handleBulkRejectSynthesis
  } = useGenerationState(showToast);

  // Library searching, filtering, sorting, pagination, and selection hook
  const {
    searchQuery,
    setSearchQuery,
    selectedKitId,
    setSelectedKitId,
    selectedCategory,
    setSelectedCategory,
    selectedDuration,
    setSelectedDuration,
    selectedLoopStatus,
    setSelectedLoopStatus,
    sortBy,
    setSortBy,
    viewDensity,
    setViewDensity,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    focusedSoundId,
    setFocusedSoundId,
    selectedLibraryIds,
    setSelectedLibraryIds,
    sortedLibrary,
    paginatedLibrary,
    totalSounds,
    totalPages,
    startIndex,
    endIndex,
    handleCycleFocus,
    handleToggleSelect,
    handleToggleSelectAll,
    clearSelection
  } = useLibraryFilters({ library, kits });

  // Diagnostics, DSP sweep, and storage health hook
  const {
    diagLog,
    setDiagLog,
    diagProgress,
    isDiagRunning,
    synthSweepPlaying,
    testRunnerState,
    testRunnerResults,
    pressedKeys,
    setPressedKeys,
    runFrequencySweep,
    runStorageDiagnostic,
    runTestSuiteSimulation
  } = useDiagnosticsLab();

  // Kit Creation / Editing Modals State
  const [showCreateKitModal, setShowCreateKitModal] = useState(false);
  const [newKitName, setNewKitName] = useState('');
  const [newKitDescription, setNewKitDescription] = useState('');
  const [showRenameKitModal, setShowRenameKitModal] = useState(false);
  const [kitToRenameId, setKitToRenameId] = useState<string | null>(null);
  const [renameKitName, setRenameKitName] = useState('');
  const [showBatchAssignModal, setShowBatchAssignModal] = useState(false);
  const [batchAssignKitId, setBatchAssignKitId] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTestCenter, setShowTestCenter] = useState(false);

  // Bulk actions handlers
  const handleBulkExport = useCallback(() => {
    if (selectedLibraryIds.size > 0) {
      const selectedAssets = library.filter(a => selectedLibraryIds.has(a.id));
      exportKit(selectedAssets);
    } else {
      exportKit(sortedLibrary);
    }
  }, [selectedLibraryIds, library, exportKit, sortedLibrary]);

  const handleBulkDelete = useCallback(() => {
    if (selectedLibraryIds.size > 0) {
      setShowDeleteModal(true);
    }
  }, [selectedLibraryIds]);

  const confirmBulkDelete = useCallback(async () => {
    if (selectedLibraryIds.size > 0) {
      await handleBulkRemoveFromLibrary(Array.from(selectedLibraryIds) as string[]);
      clearSelection();
      setShowDeleteModal(false);
    }
  }, [selectedLibraryIds, handleBulkRemoveFromLibrary, clearSelection]);

  const handleKeyboardDelete = useCallback(() => {
    if (selectedLibraryIds.size > 0) {
      setShowDeleteModal(true);
    } else if (focusedSoundId) {
      setSelectedLibraryIds(new Set([focusedSoundId]));
      setShowDeleteModal(true);
    }
  }, [selectedLibraryIds, focusedSoundId, setSelectedLibraryIds]);

  const handleCreateKitSubmit = useCallback(async (autoAssignMatching?: boolean, selectedTemplate?: KitTemplate | null) => {
    if (!newKitName.trim()) return;

    let initialSoundIds: string[] = [];
    if (autoAssignMatching && selectedTemplate) {
      const matching = library.filter(asset => {
        const matchesCategory = asset.category === selectedTemplate.category;
        const matchesTag = selectedTemplate.tags.some(tag =>
          asset.name?.toLowerCase().includes(tag) ||
          asset.prompt?.toLowerCase().includes(tag)
        );
        return matchesCategory || matchesTag;
      });
      initialSoundIds = matching.map(a => a.id);
    }

    const createdKit = await handleCreateKit(newKitName.trim(), newKitDescription.trim(), initialSoundIds);
    setNewKitName('');
    setNewKitDescription('');
    setShowCreateKitModal(false);

    if (createdKit) {
      setSelectedKitId(createdKit.id);
      showToast({
        show: true,
        title: 'Sound Kit Created',
        description: initialSoundIds.length > 0
          ? `Created "${createdKit.name}" and auto-assigned ${initialSoundIds.length} matching library sound(s).`
          : `Created "${createdKit.name}" sound kit.`,
        success: true,
        logs: []
      });
    }
  }, [newKitName, newKitDescription, library, handleCreateKit, setSelectedKitId, showToast]);

  const handleRenameKitSubmit = useCallback(async () => {
    if (!kitToRenameId || !renameKitName.trim()) return;
    await handleRenameKit(kitToRenameId, renameKitName.trim());
    setKitToRenameId(null);
    setRenameKitName('');
    setShowRenameKitModal(false);
  }, [kitToRenameId, renameKitName, handleRenameKit]);

  const handleBatchAssignSubmit = useCallback(async () => {
    if (!batchAssignKitId || selectedLibraryIds.size === 0) return;
    const soundIds = Array.from(selectedLibraryIds) as string[];
    await handleBulkAssignSoundsToKit(batchAssignKitId, soundIds);
    clearSelection();
    setShowBatchAssignModal(false);
    showToast({
      show: true,
      title: 'Batch Assignment Success',
      description: `Added ${soundIds.length} sounds to the selected kit.`,
      success: true,
      logs: []
    });
  }, [batchAssignKitId, selectedLibraryIds, handleBulkAssignSoundsToKit, clearSelection, showToast]);

  const handleBatchRemoveSubmit = useCallback(async () => {
    if (selectedKitId === 'all' || selectedKitId === 'unassigned' || selectedLibraryIds.size === 0) return;
    const soundIds = Array.from(selectedLibraryIds) as string[];
    await handleBulkRemoveSoundsFromKit(selectedKitId, soundIds);
    clearSelection();
    showToast({
      show: true,
      title: 'Batch Removal Success',
      description: `Removed ${soundIds.length} sounds from the current kit.`,
      success: true,
      logs: []
    });
  }, [selectedKitId, selectedLibraryIds, handleBulkRemoveSoundsFromKit, clearSelection, showToast]);

  // Fast set lookup for kept sounds in library
  const libraryIdSet = useMemo(() => new Set(library.map(lib => lib.id)), [library]);

  // Memoized handlers for Synthesis variations cards (avoids recreating inline closures on every render)
  const handleTrimSilenceVariation = useCallback((asset: SoundAsset) => {
    return handleTrimSilence(asset, false);
  }, [handleTrimSilence]);

  const handleUndoTrimVariation = useCallback((asset: SoundAsset) => {
    return handleUndoTrim(asset, false);
  }, [handleUndoTrim]);

  const handleNormalizeLoudnessVariation = useCallback((asset: SoundAsset) => {
    return handleNormalizeLoudness(asset, false);
  }, [handleNormalizeLoudness]);

  const handleFadeVariation = useCallback((asset: SoundAsset) => {
    return handleFade(asset, false, params.fadeIn, params.fadeOut);
  }, [handleFade, params.fadeIn, params.fadeOut]);

  const handleUpdateVariation = useCallback((updated: SoundAsset) => {
    setVariations(prev => prev.map(v => v.id === updated.id ? updated : v));
  }, [setVariations]);

  // Memoized handlers for Library View DSP actions
  const handleTrimSilenceLibrary = useCallback((asset: SoundAsset) => {
    return handleTrimSilence(asset, true);
  }, [handleTrimSilence]);

  const handleUndoTrimLibrary = useCallback((asset: SoundAsset) => {
    return handleUndoTrim(asset, true);
  }, [handleUndoTrim]);

  const handleNormalizeLoudnessLibrary = useCallback((asset: SoundAsset) => {
    return handleNormalizeLoudness(asset, true);
  }, [handleNormalizeLoudness]);

  const handleFadeLibrary = useCallback((asset: SoundAsset) => {
    return handleFade(asset, true, params.fadeIn, params.fadeOut);
  }, [handleFade, params.fadeIn, params.fadeOut]);

  // Global Keyboard Shortcuts
  const {
    isModifierHeld,
    setIsModifierHeld,
    isShortcutsPinned,
    setIsShortcutsPinned,
    activeKeys
  } = useKeyboardShortcuts({
    activeTab,
    setActiveTab,
    showTestCenter,
    setShowTestCenter,
    showCreateKitModal,
    setShowCreateKitModal,
    showRenameKitModal,
    setShowRenameKitModal,
    showBatchAssignModal,
    setShowBatchAssignModal,
    showDeleteModal,
    setShowDeleteModal,
    selectedLibraryIds,
    clearLibrarySelection: clearSelection,
    selectedSynthesisIds,
    clearSynthesisSelection: useCallback(() => setSelectedSynthesisIds(new Set()), [setSelectedSynthesisIds]),
    exportKit: useCallback(() => exportKit(), [exportKit]),
    libraryLength: library.length,
    handleGenerate,
    isGenerating,
    prompt: params.prompt,
    generatingCount,
    handleToggleSelectAll,
    handleToggleSynthesisSelectAll,
    variationsLength: variations.length,
    handleKeyboardDelete,
    handleCycleFocus,
    onPressedKeysChange: setPressedKeys
  });

  const onExecuteBulkKeep = useCallback(() => handleBulkKeepSynthesis(handleBulkKeep), [handleBulkKeepSynthesis, handleBulkKeep]);
  const onExecuteBulkExport = useCallback(() => handleBulkExportSynthesis(exportKit), [handleBulkExportSynthesis, exportKit]);

  const onRunStorageDiag = useCallback(() => {
    runStorageDiagnostic(library.length, kits.length);
  }, [runStorageDiagnostic, library.length, kits.length]);

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex justify-center font-sans antialiased w-full relative">
      {/* Premium Ambient Radial Glow Background */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.015] rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Main Responsive Viewport */}
      <div className="w-full max-w-7xl min-h-screen relative flex flex-col border-x border-white/[0.02]">
        {/* Sticky Glassmorphic Header */}
        <header className="px-5 py-4 border-b border-white/[0.04] bg-black/80 backdrop-blur-xl flex items-center justify-between z-35 shrink-0 sticky top-0">
          <div 
            onClick={() => setActiveTab('synthesize')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('synthesize');
              }
            }}
            title="Return to Synthesizer"
          >
            <motion.img 
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.15 }}
              src="https://pub-e482c2dbbb984c3c87ecdd8ae3a92183.r2.dev/LIBRARY/images/CELESTIAL%20LIBRARY%20ICON.jpg" 
              alt="Library Cues Logo"
              className="w-8 h-8 rounded-lg object-cover shadow-md shadow-white/5 transition-transform"
            />
            <div>
              <h1 className="text-sm font-bold tracking-tight text-neutral-100 leading-tight group-hover:text-white transition-colors">Library Cues</h1>
              <p className="text-[10px] text-neutral-500 font-medium tracking-wide uppercase">Sound engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={cn(
                "flex items-center gap-1.5 text-[11px] font-semibold border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-neutral-300 hover:text-white px-3.5 py-1.5 rounded-full transition-all cursor-pointer select-none shadow-sm",
                activeTab === 'profile' && "border-white/20 bg-white/10 text-white"
              )}
              title="Open User Profile & Advanced Systems Menu"
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </button>

            <AnimatePresence mode="wait">
              {activeTab === 'library' && library.length > 0 && (
                <motion.button
                  key="export-btn"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => exportKit()}
                  className="flex items-center gap-1.5 text-[11px] font-semibold bg-white text-black px-3 py-1.5 rounded-full transition-all shadow cursor-pointer select-none"
                >
                  <FolderArchive className="w-3.5 h-3.5" />
                  Export Kit
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Scrollable Viewport Container */}
        <div id="app-main-scroll-container" className="flex-1 overflow-y-auto scrollbar-none pb-24 relative bg-black">
          <AnimatePresence mode="wait">
            {activeTab === 'synthesize' ? (
              <motion.div
                key="synthesize-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-5 flex flex-col gap-5"
              >
                {/* Generation Controls */}
                <section className="bg-neutral-900/30 border border-white/[0.03] rounded-2xl p-4.5 backdrop-blur-md">
                  <GenerationControls 
                    params={params} 
                    onChange={setParams} 
                    onGenerate={handleGenerate} 
                    isGenerating={isGenerating} 
                  />
                </section>

                {/* API Error Box */}
                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-2xl text-rose-200 text-[12px] flex flex-col gap-2"
                  >
                    <div className="font-semibold flex items-center gap-2 text-rose-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Setup Required</span>
                    </div>
                    <p className="leading-relaxed opacity-90">{errorMsg}</p>
                    <div className="mt-1 text-[11px] text-rose-400/80 leading-relaxed pt-2 border-t border-rose-900/20">
                      To fix, click <strong className="text-rose-200">Secrets</strong> in AI Studio, add <code className="bg-rose-950/80 px-1.5 py-0.5 rounded text-rose-300 font-mono text-[10px]">ELEVENLABS_API_KEY</code>, then restart the dev server.
                    </div>
                  </motion.div>
                )}

                {/* Generated Variations Container */}
                {(variations.length > 0 || isGenerating) && (
                  <section className="flex flex-col gap-3.5 mt-2">
                    <div className="flex items-center justify-between px-1 mb-1">
                      <h2 className="text-[11px] font-bold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                        Generated Variations
                      </h2>

                      {!isGenerating && variations.length > 0 && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleToggleSynthesisSelectAll}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-400 hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
                          >
                            {selectedSynthesisIds.size === variations.length ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                            Select All
                          </button>

                          <AnimatePresence>
                            {selectedSynthesisIds.size > 0 && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center gap-1.5 border-l border-white/10 pl-3"
                              >
                                <span className="text-[10px] text-neutral-500 font-medium tracking-wide mr-1">
                                  {selectedSynthesisIds.size} selected
                                </span>
                                <button
                                  onClick={onExecuteBulkKeep}
                                  className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-full transition-colors cursor-pointer"
                                  title="Keep Selected"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Keep
                                </button>
                                <button
                                  onClick={onExecuteBulkExport}
                                  className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold bg-white text-black rounded-full hover:bg-neutral-200 transition-colors cursor-pointer shadow"
                                  title="Download Selected"
                                >
                                  <Download className="w-3 h-3" />
                                  Download
                                </button>
                                <button
                                  onClick={handleBulkRejectSynthesis}
                                  className="w-7 h-7 flex items-center justify-center rounded-full bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer ml-1"
                                  title="Delete Selected"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      {isGenerating ? (
                        <>
                          {Array.from({ length: generatingCount }).map((_, i) => (
                            <div key={`skeleton-${i}`} className="p-4 rounded-2xl bg-neutral-900/35 border border-white/[0.04] backdrop-blur-xl relative flex flex-col animate-pulse">
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
                          ))}
                        </>
                      ) : (
                        variations.map(asset => {
                          const isKept = libraryIdSet.has(asset.id);
                          return (
                            <AudioWaveform 
                              id={`synth-card-${asset.id}`}
                              key={asset.id} 
                              asset={asset} 
                              onKeep={handleKeep}
                              onReject={handleReject}
                              onRenameAsset={handleRenameVariation}
                              onTrimSilence={handleTrimSilenceVariation}
                              onUndoTrim={handleUndoTrimVariation}
                              onNormalizeLoudness={handleNormalizeLoudnessVariation}
                              onFadeAudio={handleFadeVariation}
                              onUpdateAsset={handleUpdateVariation}
                              isKept={isKept}
                              isSelected={selectedSynthesisIds.has(asset.id)}
                              onToggleSelect={handleToggleSynthesisSelect}
                              onShowDiagnostics={setSelectedDiagnosticAsset}
                            />
                          );
                        })
                      )}
                    </div>
                  </section>
                )}
              </motion.div>
            ) : activeTab === 'library' ? (
              <motion.div
                key="library-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-5 flex flex-col gap-5"
              >
                <LibraryView
                  library={library}
                  kits={kits}
                  selectedKitId={selectedKitId}
                  setSelectedKitId={setSelectedKitId}
                  setShowCreateKitModal={setShowCreateKitModal}
                  setKitToRenameId={setKitToRenameId}
                  setRenameKitName={setRenameKitName}
                  setShowRenameKitModal={setShowRenameKitModal}
                  handleDeleteKit={handleDeleteKit}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  handleBulkExport={handleBulkExport}
                  viewDensity={viewDensity}
                  setViewDensity={setViewDensity}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedDuration={selectedDuration}
                  setSelectedDuration={setSelectedDuration}
                  selectedLoopStatus={selectedLoopStatus}
                  setSelectedLoopStatus={setSelectedLoopStatus}
                  handleToggleSelectAll={handleToggleSelectAll}
                  selectedLibraryIds={selectedLibraryIds}
                  sortedLibrary={sortedLibrary}
                  setShowBatchAssignModal={setShowBatchAssignModal}
                  handleBatchRemoveSubmit={handleBatchRemoveSubmit}
                  handleBulkDelete={handleBulkDelete}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  paginatedLibrary={paginatedLibrary}
                  handleRemoveFromLibrary={handleRemoveFromLibrary}
                  handleRenameLibraryAsset={handleRenameLibraryAsset}
                  handleTrimSilence={handleTrimSilenceLibrary}
                  handleUndoTrim={handleUndoTrimLibrary}
                  handleNormalizeLoudness={handleNormalizeLoudnessLibrary}
                  handleFade={handleFadeLibrary}
                  handleUpdateAsset={handleUpdateAsset}
                  handleToggleSelect={handleToggleSelect}
                  setSelectedDiagnosticAsset={setSelectedDiagnosticAsset}
                  handleAssignSoundToKit={handleAssignSoundToKit}
                  handleRemoveSoundFromKit={handleRemoveSoundFromKit}
                  focusedSoundId={focusedSoundId}
                  setFocusedSoundId={setFocusedSoundId}
                  totalSounds={totalSounds}
                  pageSize={pageSize}
                  setPageSize={setPageSize}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalPages={totalPages}
                  onSwitchToSynthesize={() => setActiveTab('synthesize')}
                />
              </motion.div>
            ) : (
              <motion.div
                key="profile-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ProfileView
                  userEmail="amaurylindy@gmail.com"
                  userName="Amaury Lindy"
                  library={library}
                  kits={kits}
                  params={params}
                  setParams={setParams}
                  viewDensity={viewDensity}
                  setViewDensity={setViewDensity}
                  runFrequencySweep={runFrequencySweep}
                  synthSweepPlaying={synthSweepPlaying}
                  runStorageDiagnostic={onRunStorageDiag}
                  isDiagRunning={isDiagRunning}
                  diagProgress={diagProgress}
                  diagLog={diagLog}
                  setDiagLog={setDiagLog}
                  runTestSuiteSimulation={runTestSuiteSimulation}
                  testRunnerState={testRunnerState}
                  testRunnerResults={testRunnerResults}
                  pressedKeys={pressedKeys}
                  onOpenShortcutsOverlay={() => setIsShortcutsPinned(true)}
                  isShortcutsPinned={isShortcutsPinned}
                  setIsShortcutsPinned={setIsShortcutsPinned}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="w-full py-8 pb-28 text-center flex flex-col items-center justify-center gap-1.5 mt-auto border-t border-white/[0.04]">
          <p className="text-sm font-medium tracking-wide text-neutral-400">Ⓢ SEN</p>
          <p className="text-xs text-neutral-500 font-medium">SEIHouse Expanded Novels</p>
          <p className="text-[10px] text-neutral-600 uppercase tracking-widest mt-1">An Experience by SEIHouse Productions LLC</p>
        </footer>

        {/* Floating Glassmorphic Bottom Tab Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[72px] bg-black/85 border-t border-white/[0.04] backdrop-blur-xl flex items-center justify-around px-6 pb-4 z-40 shrink-0">
          <button
            onClick={() => setActiveTab('synthesize')}
            className={`flex flex-col items-center gap-1.5 cursor-pointer select-none relative transition-colors py-1 ${
              activeTab === 'synthesize' ? 'text-white' : 'text-neutral-500'
            }`}
          >
            <Sparkles className="w-4.5 h-4.5" />
            <span className="text-[10px] font-bold tracking-tight">Synthesize</span>
            {activeTab === 'synthesize' && (
              <motion.div 
                layoutId="activeTabDot" 
                className="absolute -bottom-2 w-1.5 h-1.5 bg-white rounded-full" 
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('library')}
            className={`flex flex-col items-center gap-1.5 cursor-pointer select-none relative transition-colors py-1 ${
              activeTab === 'library' ? 'text-white' : 'text-neutral-500'
            }`}
          >
            <div className="relative">
              <Library className="w-4.5 h-4.5" />
              {library.length > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-white text-black font-bold text-[8px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow">
                  {library.length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold tracking-tight">Saved Kit</span>
            {activeTab === 'library' && (
              <motion.div 
                layoutId="activeTabDot" 
                className="absolute -bottom-2 w-1.5 h-1.5 bg-white rounded-full" 
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1.5 cursor-pointer select-none relative transition-colors py-1 ${
              activeTab === 'profile' ? 'text-white' : 'text-neutral-500'
            }`}
          >
            <User className="w-4.5 h-4.5" />
            <span className="text-[10px] font-bold tracking-tight">Profile</span>
            {activeTab === 'profile' && (
              <motion.div 
                layoutId="activeTabDot" 
                className="absolute -bottom-2 w-1.5 h-1.5 bg-white rounded-full" 
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              />
            )}
          </button>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        selectedCount={selectedLibraryIds.size}
        onConfirm={confirmBulkDelete}
      />

      {/* Premium Diagnostic Toasts */}
      {diagnosticToast && (
        <DiagnosticToast
          show={diagnosticToast.show}
          title={diagnosticToast.title}
          description={diagnosticToast.description}
          success={diagnosticToast.success}
          originalSize={diagnosticToast.originalSize}
          processedSize={diagnosticToast.processedSize}
          logs={diagnosticToast.logs}
          onDismiss={() => setDiagnosticToast(prev => prev ? { ...prev, show: false } : null)}
          onViewTelemetry={diagnosticToast.logs?.length > 0 ? () => {
            setSelectedDiagnosticAsset(diagnosticToast.asset || null);
            setDiagnosticToast(prev => prev ? { ...prev, show: false } : null);
          } : undefined}
        />
      )}

      <CreateKitModal
        isOpen={showCreateKitModal}
        onClose={() => {
          setShowCreateKitModal(false);
          setNewKitName('');
          setNewKitDescription('');
        }}
        newKitName={newKitName}
        setNewKitName={setNewKitName}
        newKitDescription={newKitDescription}
        setNewKitDescription={setNewKitDescription}
        onSubmit={handleCreateKitSubmit}
        librarySoundsCount={library.length}
      />

      <RenameKitModal
        isOpen={showRenameKitModal}
        onClose={() => {
          setShowRenameKitModal(false);
          setKitToRenameId(null);
          setRenameKitName('');
        }}
        renameKitName={renameKitName}
        setRenameKitName={setRenameKitName}
        onSubmit={handleRenameKitSubmit}
      />

      <BatchAssignModal
        isOpen={showBatchAssignModal}
        onClose={() => {
          setShowBatchAssignModal(false);
          setBatchAssignKitId('');
        }}
        selectedCount={selectedLibraryIds.size}
        batchAssignKitId={batchAssignKitId}
        setBatchAssignKitId={setBatchAssignKitId}
        kits={kits}
        onSubmit={handleBatchAssignSubmit}
      />

      <TestCenterModal
        isOpen={showTestCenter}
        onClose={() => setShowTestCenter(false)}
        pressedKeys={pressedKeys}
        runFrequencySweep={runFrequencySweep}
        synthSweepPlaying={synthSweepPlaying}
        runStorageDiagnostic={onRunStorageDiag}
        isDiagRunning={isDiagRunning}
        diagProgress={diagProgress}
        diagLog={diagLog}
        setDiagLog={setDiagLog}
        runTestSuiteSimulation={runTestSuiteSimulation}
        testRunnerState={testRunnerState === 'success' ? 'completed' : testRunnerState}
        testRunnerResults={testRunnerResults}
      />

      <DiagnosticsModal
        asset={selectedDiagnosticAsset}
        onClose={() => setSelectedDiagnosticAsset(null)}
      />

      <ShortcutsOverlay
        isOpen={isModifierHeld || isShortcutsPinned}
        onClose={() => {
          setIsShortcutsPinned(false);
          setIsModifierHeld(false);
        }}
        isModifierHeld={isModifierHeld}
        activeKeys={activeKeys}
        isPinned={isShortcutsPinned}
        onTogglePin={() => setIsShortcutsPinned(prev => !prev)}
      />
    </div>
  );
}
