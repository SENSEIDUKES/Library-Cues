import React from 'react';
import { SoundAsset, SoundKit } from '../types';
import { VirtualizedSoundList } from './VirtualizedSoundList';
import { 
  FolderArchive, Library, Plus, Pencil, X, Folder, Search, 
  Download, Grid, List, CheckSquare, Square, Trash2, 
  ChevronDown, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export interface LibraryViewProps {
  library: SoundAsset[];
  kits: SoundKit[];
  selectedKitId: string;
  setSelectedKitId: (id: string) => void;
  setShowCreateKitModal: (show: boolean) => void;
  setKitToRenameId: (id: string | null) => void;
  setRenameKitName: (name: string) => void;
  setShowRenameKitModal: (show: boolean) => void;
  handleDeleteKit: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleBulkExport: () => void;
  viewDensity: 'comfortable' | 'compact';
  setViewDensity: (density: 'comfortable' | 'compact') => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedDuration: 'all' | 'short' | 'medium' | 'long';
  setSelectedDuration: (dur: 'all' | 'short' | 'medium' | 'long') => void;
  selectedLoopStatus: 'all' | 'loop' | 'oneshot';
  setSelectedLoopStatus: (status: 'all' | 'loop' | 'oneshot') => void;
  handleToggleSelectAll: () => void;
  selectedLibraryIds: Set<string>;
  sortedLibrary: SoundAsset[];
  setShowBatchAssignModal: (show: boolean) => void;
  handleBatchRemoveSubmit: () => void;
  handleBulkDelete: () => void;
  sortBy: 'latest' | 'oldest' | 'alphabetical' | 'duration-desc' | 'duration-asc';
  setSortBy: (sort: 'latest' | 'oldest' | 'alphabetical' | 'duration-desc' | 'duration-asc') => void;
  paginatedLibrary: SoundAsset[];
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
  focusedSoundId: string | null;
  setFocusedSoundId: (id: string | null) => void;
  totalSounds: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  startIndex: number;
  endIndex: number;
  totalPages: number;
  onSwitchToSynthesize: () => void;
}

const LibraryViewComponent: React.FC<LibraryViewProps> = ({
  library,
  kits,
  selectedKitId,
  setSelectedKitId,
  setShowCreateKitModal,
  setKitToRenameId,
  setRenameKitName,
  setShowRenameKitModal,
  handleDeleteKit,
  searchQuery,
  setSearchQuery,
  handleBulkExport,
  viewDensity,
  setViewDensity,
  selectedCategory,
  setSelectedCategory,
  selectedDuration,
  setSelectedDuration,
  selectedLoopStatus,
  setSelectedLoopStatus,
  handleToggleSelectAll,
  selectedLibraryIds,
  sortedLibrary,
  setShowBatchAssignModal,
  handleBatchRemoveSubmit,
  handleBulkDelete,
  sortBy,
  setSortBy,
  paginatedLibrary,
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
  focusedSoundId,
  setFocusedSoundId,
  totalSounds,
  pageSize,
  setPageSize,
  currentPage,
  setCurrentPage,
  startIndex,
  endIndex,
  totalPages,
  onSwitchToSynthesize,
}) => {
  if (library.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-14 h-14 rounded-full bg-neutral-900/60 border border-white/[0.04] flex items-center justify-center text-neutral-500 mb-4 shadow-inner">
          <Library className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-300">Your library is empty</h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-[200px] leading-relaxed">
          Generate and keep audio variations in the synthesis tab to save them here.
        </p>
        <button 
          onClick={onSwitchToSynthesize}
          className="mt-5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-white/[0.04] text-neutral-300 text-xs font-semibold rounded-full transition-all cursor-pointer select-none"
        >
          Open Synthesizer
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      {/* Left Column: Sound Kits Navigation Sidebar */}
      <div className="md:col-span-3 flex flex-col gap-4">
        <div className="p-4 rounded-2xl bg-neutral-900/30 border border-white/[0.04] backdrop-blur-xl flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <FolderArchive className="w-3.5 h-3.5 text-neutral-400" /> Sound Kits
            </span>
            <button
              onClick={() => setShowCreateKitModal(true)}
              className="w-5 h-5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white flex items-center justify-center transition-all cursor-pointer select-none"
              title="Create New Sound Kit"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Kits list */}
          <div className="flex flex-col gap-1">
            {/* All Sounds Option */}
            <button
              onClick={() => setSelectedKitId('all')}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                selectedKitId === 'all' 
                  ? "bg-white text-black font-semibold shadow" 
                  : "text-neutral-400 hover:text-white hover:bg-white/[0.02]"
              )}
            >
              <span className="flex items-center gap-2">
                <Library className="w-3.5 h-3.5" /> All Saved Sounds
              </span>
              <span className={cn(
                "text-[10px] font-mono px-1.5 py-0.5 rounded-full",
                selectedKitId === 'all' ? "bg-black/10 text-black" : "bg-white/[0.04] text-neutral-500"
              )}>
                {library.length}
              </span>
            </button>

            {/* Unassigned Sounds Option */}
            <button
              onClick={() => setSelectedKitId('unassigned')}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                selectedKitId === 'unassigned' 
                  ? "bg-white text-black font-semibold shadow" 
                  : "text-neutral-400 hover:text-white hover:bg-white/[0.02]"
              )}
            >
              <span className="flex items-center gap-2">
                <Folder className="w-3.5 h-3.5" /> Unassigned
              </span>
              <span className={cn(
                "text-[10px] font-mono px-1.5 py-0.5 rounded-full",
                selectedKitId === 'unassigned' ? "bg-black/10 text-black" : "bg-white/[0.04] text-neutral-500"
              )}>
                {library.filter(asset => !kits.some(k => k.soundIds.includes(asset.id))).length}
              </span>
            </button>

            <div className="h-[1px] bg-white/[0.04] my-1.5" />

            {/* User custom kits */}
            {kits.length === 0 ? (
              <div className="text-center py-4 px-2 text-[11px] text-neutral-500 leading-relaxed border border-dashed border-white/[0.04] rounded-xl bg-white/[0.01]">
                No kits created yet. Click "+" to create a kit and organize your library.
              </div>
            ) : (
              <div className="flex flex-col gap-1 max-h-60 overflow-y-auto scrollbar-none">
                {kits.map(kit => (
                  <div 
                    key={kit.id}
                    className={cn(
                      "flex items-center justify-between w-full rounded-xl text-xs font-medium transition-all group/kit-item",
                      selectedKitId === kit.id 
                        ? "bg-white text-black font-semibold animate-none" 
                        : "text-neutral-400 hover:text-white hover:bg-white/[0.02]"
                    )}
                  >
                    <button
                      onClick={() => setSelectedKitId(kit.id)}
                      className="flex-1 text-left px-3 py-2 flex items-center gap-2 truncate cursor-pointer"
                    >
                      <FolderArchive className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{kit.name}</span>
                    </button>

                    <div className="flex items-center gap-1.5 pr-2 shrink-0">
                      <span className={cn(
                        "text-[10px] font-mono px-1.5 py-0.5 rounded-full",
                        selectedKitId === kit.id ? "bg-black/10 text-black" : "bg-white/[0.04] text-neutral-500"
                      )}>
                        {kit.soundIds.length}
                      </span>
                      
                      {/* Rename Action */}
                      <button
                        onClick={() => {
                          setKitToRenameId(kit.id);
                          setRenameKitName(kit.name);
                          setShowRenameKitModal(true);
                        }}
                        className={cn(
                          "w-4 h-4 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer select-none",
                          selectedKitId === kit.id ? "text-neutral-600 hover:text-black" : "text-neutral-600 hover:text-neutral-200 opacity-0 group-hover/kit-item:opacity-100"
                        )}
                        title="Rename Kit"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                      </button>

                      {/* Delete Action */}
                      <button
                        onClick={() => handleDeleteKit(kit.id)}
                        className={cn(
                          "w-4 h-4 rounded-full flex items-center justify-center hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer select-none",
                          selectedKitId === kit.id ? "text-neutral-600 hover:text-rose-600" : "text-neutral-600 hover:text-rose-400 opacity-0 group-hover/kit-item:opacity-100"
                        )}
                        title="Delete Kit (keeps sounds)"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Advanced Library Dashboard */}
      <div className="md:col-span-9 flex flex-col gap-4">
        {/* Frosted Control Center */}
        <div className="p-4 rounded-2xl bg-neutral-900/30 border border-white/[0.04] backdrop-blur-xl flex flex-col gap-4">
          
          {/* Search & Layout Density Row */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search library by name, prompt or tags..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-neutral-950/40 hover:bg-neutral-950/60 focus:bg-neutral-950 border border-white/[0.03] hover:border-white/[0.08] focus:border-white/[0.15] text-white rounded-xl placeholder-neutral-500 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-neutral-500 hover:text-neutral-300 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View density and export controls */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Export active kit */}
              <button
                onClick={handleBulkExport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-neutral-100 shadow transition-all cursor-pointer"
                title="Export current set"
              >
                <Download className="w-3.5 h-3.5" />
                Export Set
              </button>

              {/* View Density Toggle */}
              <div className="flex items-center bg-neutral-950/40 border border-white/[0.03] p-1 rounded-xl">
                <button
                  onClick={() => setViewDensity('comfortable')}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors cursor-pointer select-none",
                    viewDensity === 'comfortable' ? "bg-white/[0.08] text-white" : "text-neutral-500 hover:text-neutral-300"
                  )}
                  title="Comfortable Cards"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewDensity('compact')}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors cursor-pointer select-none",
                    viewDensity === 'compact' ? "bg-white/[0.08] text-white" : "text-neutral-500 hover:text-neutral-300"
                  )}
                  title="Compact High-Density List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Filters Panel */}
          <div className="flex flex-col gap-3 pt-3 border-t border-white/[0.03]">
            {/* Categories filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider w-16">Category:</span>
              {['all', 'ambient', 'ui', 'action'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all cursor-pointer select-none uppercase tracking-wider",
                    selectedCategory === cat 
                      ? "bg-neutral-200 text-black border-transparent font-semibold shadow" 
                      : "bg-white/[0.01] text-neutral-400 border-white/[0.03] hover:text-white hover:border-white/[0.08]"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Duration filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider w-16">Duration:</span>
              {[
                { id: 'all', label: 'All' },
                { id: 'short', label: 'Short (<1.5s)' },
                { id: 'medium', label: 'Medium (1.5-4s)' },
                { id: 'long', label: 'Long (>4s)' }
              ].map(dur => (
                <button
                  key={dur.id}
                  onClick={() => setSelectedDuration(dur.id as any)}
                  className={cn(
                    "text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all cursor-pointer select-none",
                    selectedDuration === dur.id 
                      ? "bg-neutral-200 text-black border-transparent font-semibold shadow" 
                      : "bg-white/[0.01] text-neutral-400 border-white/[0.03] hover:text-white hover:border-white/[0.08]"
                  )}
                >
                  {dur.label}
                </button>
              ))}
            </div>

            {/* Loopable filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider w-16">Format:</span>
              {[
                { id: 'all', label: 'All Formats' },
                { id: 'loop', label: 'Loopable' },
                { id: 'oneshot', label: 'One-Shot' }
              ].map(fmt => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedLoopStatus(fmt.id as any)}
                  className={cn(
                    "text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all cursor-pointer select-none",
                    selectedLoopStatus === fmt.id 
                      ? "bg-neutral-200 text-black border-transparent font-semibold shadow" 
                      : "bg-white/[0.01] text-neutral-400 border-white/[0.03] hover:text-white hover:border-white/[0.08]"
                  )}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort & Quick Select / Batch Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/[0.03]">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleToggleSelectAll}
                className="flex items-center gap-2 text-[11px] font-bold text-neutral-400 hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
              >
                {selectedLibraryIds.size === sortedLibrary.length && sortedLibrary.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-white" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                Select All
              </button>

              {/* Batch operations */}
              <AnimatePresence>
                {selectedLibraryIds.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-2 border-l border-white/10 pl-3"
                  >
                    <span className="text-[10px] text-neutral-500 font-mono tracking-wide mr-1">
                      {selectedLibraryIds.size} selected
                    </span>

                    {/* Batch Add to Kit */}
                    {kits.length > 0 && (
                      <button
                        onClick={() => setShowBatchAssignModal(true)}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors cursor-pointer border border-white/[0.03]"
                        title="Add Selected to Kit"
                      >
                        <FolderArchive className="w-3 h-3" /> Add to Kit
                      </button>
                    )}

                    {/* Batch Remove from Current Kit */}
                    {selectedKitId !== 'all' && selectedKitId !== 'unassigned' && (
                      <button
                        onClick={handleBatchRemoveSubmit}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 rounded-lg transition-colors cursor-pointer border border-rose-500/10"
                        title="Remove Selected from Current Kit"
                      >
                        <X className="w-3 h-3" /> Remove from Kit
                      </button>
                    )}

                    {/* Batch Delete */}
                    <button
                      onClick={handleBulkDelete}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                      title="Delete Selected from Library"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sort dropdown */}
            <div className="flex items-center gap-2 self-end sm:self-auto text-[11px]">
              <span className="text-neutral-500">Sort By:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-neutral-950/60 hover:bg-neutral-950 border border-white/[0.03] hover:border-white/[0.08] text-white rounded-lg px-2.5 py-1 pr-7 text-xs font-medium outline-none cursor-pointer appearance-none animate-none"
                >
                  <option value="latest">Latest Saved</option>
                  <option value="oldest">Oldest Saved</option>
                  <option value="alphabetical">Alphabetical (A-Z)</option>
                  <option value="duration-desc">Duration (Longest)</option>
                  <option value="duration-asc">Duration (Shortest)</option>
                </select>
                <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-neutral-500">
                  <ChevronDown className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Paginated sound list or empty results */}
        <div className="flex flex-col gap-3 min-h-[300px]">
          {paginatedLibrary.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-neutral-900/15 border border-dashed border-white/[0.03] rounded-2xl">
              <Library className="w-8 h-8 text-neutral-600 mb-2.5" />
              <h4 className="text-xs font-semibold text-neutral-400">No matching sounds found</h4>
              <p className="text-[11px] text-neutral-600 mt-1 max-w-[240px] leading-relaxed">
                Try clearing some filters, changing kits, or updating your search query.
              </p>
            </div>
          ) : (
            <VirtualizedSoundList
              items={paginatedLibrary}
              viewDensity={viewDensity}
              kits={kits}
              selectedLibraryIds={selectedLibraryIds}
              focusedSoundId={focusedSoundId}
              setFocusedSoundId={setFocusedSoundId}
              handleRemoveFromLibrary={handleRemoveFromLibrary}
              handleRenameLibraryAsset={handleRenameLibraryAsset}
              handleTrimSilence={handleTrimSilence}
              handleUndoTrim={handleUndoTrim}
              handleNormalizeLoudness={handleNormalizeLoudness}
              handleFade={handleFade}
              handleUpdateAsset={handleUpdateAsset}
              handleToggleSelect={handleToggleSelect}
              setSelectedDiagnosticAsset={setSelectedDiagnosticAsset}
              handleAssignSoundToKit={handleAssignSoundToKit}
              handleRemoveSoundFromKit={handleRemoveSoundFromKit}
            />
          )}
        </div>

        {/* Custom Apple-style Pagination Controls */}
        {totalSounds > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 p-4 bg-neutral-900/10 border border-white/[0.03] rounded-2xl">
            <span className="text-[11px] text-neutral-500 font-mono">
              Showing <span className="text-white font-medium">{startIndex + 1}</span> to <span className="text-white font-medium">{endIndex}</span> of <span className="text-white font-medium">{totalSounds}</span> sounds
            </span>

            <div className="flex items-center gap-2">
              {/* Page size dropdown */}
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 mr-2">
                <span>View:</span>
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(parseInt(e.target.value) as any);
                      setCurrentPage(1);
                    }}
                    className="bg-neutral-950/40 hover:bg-neutral-950/60 border border-white/[0.03] text-white rounded-lg px-2 py-0.5 pr-5 font-mono text-[10px] cursor-pointer appearance-none animate-none"
                  >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                    <option value={0}>All (Virtual Stream)</option>
                  </select>
                  <span className="absolute inset-y-0 right-1.5 flex items-center pointer-events-none text-neutral-500">
                    <ChevronDown className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>

              {/* Page Buttons (only when paginated) */}
              {pageSize > 0 && totalPages > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-7 h-7 rounded-lg border border-white/[0.03] bg-neutral-950/20 hover:bg-neutral-950/60 text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 || 
                      pageNum === totalPages || 
                      Math.abs(pageNum - currentPage) <= 1
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={cn(
                            "w-7 h-7 rounded-lg text-xs font-medium font-mono transition-all cursor-pointer",
                            currentPage === pageNum 
                              ? "bg-white text-black font-bold shadow animate-none" 
                              : "border border-white/[0.03] bg-neutral-950/20 hover:bg-neutral-950/40 text-neutral-400 hover:text-white"
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (
                      (pageNum === 2 && currentPage > 3) || 
                      (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                    ) {
                      return <span key={`ellipsis-${pageNum}`} className="text-neutral-600 text-xs px-0.5">...</span>;
                    }
                    return null;
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="w-7 h-7 rounded-lg border border-white/[0.03] bg-neutral-950/20 hover:bg-neutral-950/60 text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const LibraryView = React.memo(LibraryViewComponent);
