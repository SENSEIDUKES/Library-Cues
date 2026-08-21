import { useState, useEffect, useRef } from 'react';

export interface KeyboardActions {
  activeTab: 'synthesize' | 'library' | 'profile';
  setActiveTab: (tab: 'synthesize' | 'library' | 'profile') => void;
  isShortcutsPinned: boolean;
  setIsShortcutsPinned: (pinned: boolean | ((prev: boolean) => boolean)) => void;
  showTestCenter: boolean;
  setShowTestCenter: (show: boolean) => void;
  showCreateKitModal: boolean;
  setShowCreateKitModal: (show: boolean) => void;
  showRenameKitModal: boolean;
  setShowRenameKitModal: (show: boolean) => void;
  showBatchAssignModal: boolean;
  setShowBatchAssignModal: (show: boolean) => void;
  showDeleteModal: boolean;
  setShowDeleteModal: (show: boolean) => void;
  selectedLibraryIds: Set<string>;
  clearLibrarySelection: () => void;
  selectedSynthesisIds: Set<string>;
  clearSynthesisSelection: () => void;
  exportKit: () => void;
  libraryLength: number;
  handleGenerate: (count: number, useCache: boolean) => void;
  isGenerating: boolean;
  prompt: string;
  generatingCount: number;
  handleToggleSelectAll: () => void;
  handleToggleSynthesisSelectAll: () => void;
  variationsLength: number;
  handleKeyboardDelete: () => void;
  handleCycleFocus: (direction: 'next' | 'prev') => void;
  onModifierHeldChange?: (isHeld: boolean) => void;
  onActiveKeysChange?: (keys: Set<string>) => void;
  onPressedKeysChange?: (keys: Set<string>) => void;
}

export function useKeyboardShortcuts(actions: KeyboardActions) {
  const [isModifierHeld, setIsModifierHeld] = useState(false);
  const [isShortcutsPinned, setIsShortcutsPinned] = useState(false);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.key === 'Meta' || e.key === 'Control' || e.metaKey || e.ctrlKey;
      if (isModifier) {
        setIsModifierHeld(true);
        actionsRef.current.onModifierHeldChange?.(true);
      }

      // Update active keys set for HUD visualizers
      const keyLower = e.key.toLowerCase();
      const nextKey = keyLower === ' ' ? 'space' : keyLower;
      setActiveKeys(prev => {
        const updated = new Set(prev);
        if (e.metaKey || e.ctrlKey) updated.add('meta');
        updated.add(nextKey);
        actionsRef.current.onActiveKeysChange?.(updated);
        return updated;
      });

      // Update test center trainer keys
      actionsRef.current.onPressedKeysChange?.(
        (() => {
          const next = new Set<string>();
          if (e.ctrlKey || e.metaKey) next.add('meta');
          if (keyLower === ' ') next.add('space');
          else next.add(keyLower);
          return next;
        })()
      );

      const target = e.target as HTMLElement;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        (typeof target?.hasAttribute === 'function' && target.hasAttribute('contenteditable')) ||
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA';

      const act = actionsRef.current;

      // Always allow Escape to close shortcuts overlay, modals, or clear selection
      if (e.key === 'Escape') {
        if (isShortcutsPinned || isModifierHeld) {
          setIsShortcutsPinned(false);
          setIsModifierHeld(false);
          act.setIsShortcutsPinned(false);
          return;
        }
        if (act.showTestCenter) {
          act.setShowTestCenter(false);
          return;
        }
        if (act.showCreateKitModal) {
          act.setShowCreateKitModal(false);
          return;
        }
        if (act.showRenameKitModal) {
          act.setShowRenameKitModal(false);
          return;
        }
        if (act.showBatchAssignModal) {
          act.setShowBatchAssignModal(false);
          return;
        }
        if (act.showDeleteModal) {
          act.setShowDeleteModal(false);
          return;
        }
        if (act.selectedLibraryIds.size > 0) {
          act.clearLibrarySelection();
          return;
        }
        if (act.selectedSynthesisIds.size > 0) {
          act.clearSynthesisSelection();
          return;
        }
      }

      // Ignore other action shortcuts if user is typing in an input
      if (isInput) return;

      // 1. Navigation Shortcuts
      // Cmd/Ctrl + 1: Synthesizer
      if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        act.setActiveTab('synthesize');
        return;
      }

      // Cmd/Ctrl + 2: Library
      if ((e.metaKey || e.ctrlKey) && e.key === '2') {
        e.preventDefault();
        act.setActiveTab('library');
        return;
      }

      // Cmd/Ctrl + 3 or Cmd/Ctrl + P: Profile Tab
      if ((e.metaKey || e.ctrlKey) && (e.key === '3' || keyLower === 'p')) {
        e.preventDefault();
        act.setActiveTab('profile');
        return;
      }

      // Cmd/Ctrl + T: Test Center
      if ((e.metaKey || e.ctrlKey) && (keyLower === 't')) {
        e.preventDefault();
        act.setActiveTab('profile');
        return;
      }

      // Cmd/Ctrl + / or ?: Toggle Shortcuts pinned
      if (((e.metaKey || e.ctrlKey) && e.key === '/') || e.key === '?') {
        e.preventDefault();
        setIsShortcutsPinned(prev => {
          const next = !prev;
          act.setIsShortcutsPinned(next);
          return next;
        });
        return;
      }

      // Cmd/Ctrl + N: Create Kit Modal
      if ((e.metaKey || e.ctrlKey) && keyLower === 'n') {
        e.preventDefault();
        act.setShowCreateKitModal(true);
        return;
      }

      // Cmd/Ctrl + E: Export Active Kit
      if ((e.metaKey || e.ctrlKey) && keyLower === 'e') {
        if (act.activeTab === 'library' && act.libraryLength > 0) {
          e.preventDefault();
          act.exportKit();
          return;
        }
      }

      // Cmd/Ctrl + Enter: Synthesize Variation
      if ((e.metaKey || e.ctrlKey) && (e.key === 'Enter')) {
        if (act.activeTab === 'synthesize' && act.prompt.trim() && !act.isGenerating) {
          e.preventDefault();
          act.handleGenerate(act.generatingCount, false);
          return;
        }
      }

      // Cmd/Ctrl + A: Select All
      if ((e.metaKey || e.ctrlKey) && keyLower === 'a') {
        e.preventDefault();
        if (act.activeTab === 'library') {
          act.handleToggleSelectAll();
        } else if (act.activeTab === 'synthesize' && act.variationsLength > 0) {
          act.handleToggleSynthesisSelectAll();
        }
        return;
      }

      // Library-specific keyboard actions
      if (act.activeTab === 'library') {
        // Backspace or Delete (Delete Selected)
        if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          act.handleKeyboardDelete();
          return;
        }

        // Arrow Keys to Cycle Focus
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          act.handleCycleFocus('next');
          return;
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          act.handleCycleFocus('prev');
          return;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) {
        setIsModifierHeld(false);
        actionsRef.current.onModifierHeldChange?.(false);
      }

      const keyLower = e.key.toLowerCase();
      const nextKey = keyLower === ' ' ? 'space' : keyLower;

      setActiveKeys(prev => {
        const updated = new Set(prev);
        if (!e.metaKey && !e.ctrlKey) updated.delete('meta');
        updated.delete(nextKey);
        actionsRef.current.onActiveKeysChange?.(updated);
        return updated;
      });

      actionsRef.current.onPressedKeysChange?.(
        (() => {
          const next = new Set<string>();
          if (e.ctrlKey || e.metaKey) next.add('meta');
          if (keyLower === ' ') next.add('space');
          else next.add(keyLower);
          return next;
        })()
      );
    };

    const handleWindowBlur = () => {
      setIsModifierHeld(false);
      setActiveKeys(new Set());
      actionsRef.current.onModifierHeldChange?.(false);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isShortcutsPinned, isModifierHeld]);

  return {
    isModifierHeld,
    setIsModifierHeld,
    isShortcutsPinned,
    setIsShortcutsPinned,
    activeKeys,
    setActiveKeys
  };
}
