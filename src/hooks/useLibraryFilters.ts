import { useState, useMemo, useEffect, useCallback } from 'react';
import { SoundAsset, SoundKit } from '../types';

export interface UseLibraryFiltersProps {
  library: SoundAsset[];
  kits: SoundKit[];
}

export function useLibraryFilters({ library, kits }: UseLibraryFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKitId, setSelectedKitId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDuration, setSelectedDuration] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [selectedLoopStatus, setSelectedLoopStatus] = useState<'all' | 'loop' | 'oneshot'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'alphabetical' | 'duration-desc' | 'duration-asc'>('latest');
  const [viewDensity, setViewDensity] = useState<'comfortable' | 'compact'>('compact');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [focusedSoundId, setFocusedSoundId] = useState<string | null>(null);
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<Set<string>>(new Set());

  // Memoized filtered library
  const filteredLibrary = useMemo(() => {
    return library.filter(asset => {
      // Search query match
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = asset.name?.toLowerCase().includes(query);
        const matchPrompt = asset.prompt?.toLowerCase().includes(query);
        const matchTags = asset.tags?.some(tag => tag.toLowerCase().includes(query));
        if (!matchName && !matchPrompt && !matchTags) return false;
      }

      // Selected kit match
      if (selectedKitId !== 'all') {
        if (selectedKitId === 'unassigned') {
          const isInAnyKit = kits.some(k => k.soundIds.includes(asset.id));
          if (isInAnyKit) return false;
        } else {
          const kit = kits.find(k => k.id === selectedKitId);
          if (!kit || !kit.soundIds.includes(asset.id)) return false;
        }
      }

      // Selected category match
      if (selectedCategory !== 'all') {
        if (asset.category !== selectedCategory) return false;
      }

      // Selected duration match
      if (selectedDuration !== 'all') {
        const dur = asset.durationSeconds || 0;
        if (selectedDuration === 'short' && dur >= 1.5) return false;
        if (selectedDuration === 'medium' && (dur < 1.5 || dur > 4.0)) return false;
        if (selectedDuration === 'long' && dur <= 4.0) return false;
      }

      // Selected loop status match
      if (selectedLoopStatus !== 'all') {
        const isLoop = !!asset.loop;
        if (selectedLoopStatus === 'loop' && !isLoop) return false;
        if (selectedLoopStatus === 'oneshot' && isLoop) return false;
      }

      return true;
    });
  }, [library, searchQuery, selectedKitId, kits, selectedCategory, selectedDuration, selectedLoopStatus]);

  // Memoized sorted library
  const sortedLibrary = useMemo(() => {
    return [...filteredLibrary].sort((a, b) => {
      if (sortBy === 'latest') {
        return b.createdAt - a.createdAt;
      }
      if (sortBy === 'oldest') {
        return a.createdAt - b.createdAt;
      }
      if (sortBy === 'alphabetical') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'duration-desc') {
        return (b.durationSeconds || 0) - (a.durationSeconds || 0);
      }
      if (sortBy === 'duration-asc') {
        return (a.durationSeconds || 0) - (b.durationSeconds || 0);
      }
      return 0;
    });
  }, [filteredLibrary, sortBy]);

  const isAllView = pageSize === 0;
  const totalSounds = sortedLibrary.length;
  const totalPages = isAllView ? 1 : Math.ceil(totalSounds / pageSize) || 1;
  const startIndex = isAllView ? 0 : (currentPage - 1) * pageSize;
  const endIndex = isAllView ? totalSounds : Math.min(startIndex + pageSize, totalSounds);

  // Memoized paginated library slice
  const paginatedLibrary = useMemo(() => {
    if (isAllView) return sortedLibrary;
    return sortedLibrary.slice(startIndex, endIndex);
  }, [sortedLibrary, startIndex, endIndex, isAllView]);

  // Auto-reset current page if out of bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Auto-reset focus if focused sound is no longer in paginatedLibrary
  useEffect(() => {
    if (focusedSoundId && !paginatedLibrary.some(asset => asset.id === focusedSoundId)) {
      setFocusedSoundId(null);
    }
  }, [paginatedLibrary, focusedSoundId]);

  const scrollToSoundId = useCallback((id: string) => {
    setTimeout(() => {
      const element = document.getElementById(`sound-card-${id}`);
      if (element && typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  }, []);

  const handleCycleFocus = useCallback((direction: 'next' | 'prev') => {
    if (paginatedLibrary.length === 0) return;

    if (!focusedSoundId) {
      const targetId = direction === 'next' ? paginatedLibrary[0].id : paginatedLibrary[paginatedLibrary.length - 1].id;
      setFocusedSoundId(targetId);
      scrollToSoundId(targetId);
      return;
    }

    const currentIndex = paginatedLibrary.findIndex(asset => asset.id === focusedSoundId);
    if (currentIndex === -1) {
      setFocusedSoundId(paginatedLibrary[0].id);
      scrollToSoundId(paginatedLibrary[0].id);
      return;
    }

    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    // Wrap around within current page
    if (nextIndex >= paginatedLibrary.length) {
      nextIndex = 0;
    } else if (nextIndex < 0) {
      nextIndex = paginatedLibrary.length - 1;
    }

    const nextId = paginatedLibrary[nextIndex].id;
    setFocusedSoundId(nextId);
    scrollToSoundId(nextId);
  }, [paginatedLibrary, focusedSoundId, scrollToSoundId]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedLibraryIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    setSelectedLibraryIds(prev => {
      if (prev.size === sortedLibrary.length) {
        return new Set();
      }
      return new Set(sortedLibrary.map(a => a.id));
    });
  }, [sortedLibrary]);

  const clearSelection = useCallback(() => {
    setSelectedLibraryIds(new Set());
  }, []);

  return {
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
    filteredLibrary,
    sortedLibrary,
    paginatedLibrary,
    totalSounds,
    totalPages,
    startIndex,
    endIndex,
    scrollToSoundId,
    handleCycleFocus,
    handleToggleSelect,
    handleToggleSelectAll,
    clearSelection
  };
}
