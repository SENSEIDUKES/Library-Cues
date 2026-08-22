import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Keyboard, 
  X, 
  Sparkles, 
  Library, 
  Terminal, 
  FolderPlus, 
  Download, 
  Trash2, 
  Play, 
  Compass, 
  CheckSquare, 
  CornerDownLeft,
  Pin,
  PinOff
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface ShortcutItem {
  id: string;
  keys: string[];
  description: string;
  category: 'Navigation' | 'Selection' | 'Playback & Actions';
  contextBadge?: string;
  icon?: React.ReactNode;
}

export interface ShortcutsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  isModifierHeld: boolean;
  activeKeys?: Set<string>;
  isPinned?: boolean;
  onTogglePin?: () => void;
  isMac?: boolean;
}

export const ShortcutsOverlay: React.FC<ShortcutsOverlayProps> = React.memo(({
  isOpen,
  onClose,
  isModifierHeld,
  activeKeys = new Set(),
  isPinned = false,
  onTogglePin,
  isMac = typeof navigator !== 'undefined' ? /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent) : true,
}) => {
  const modifierLabel = isMac ? '⌘' : 'Ctrl';
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Focus trap & focus restoration lifecycle
  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element before opening
    if (typeof document !== 'undefined') {
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement;
    }

    // Set initial focus inside overlay
    const frameId = requestAnimationFrame(() => {
      if (containerRef.current) {
        const firstFocusable = containerRef.current.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    });

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown, true);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', handleWindowKeyDown, true);
      if (previouslyFocusedElementRef.current && typeof previouslyFocusedElementRef.current.focus === 'function') {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  // Tab key trap inside dialog
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab' && containerRef.current) {
      const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  const shortcuts: ShortcutItem[] = [
    // Navigation
    {
      id: 'nav-synth',
      keys: [modifierLabel, '1'],
      description: 'Switch to Synthesizer Tab',
      category: 'Navigation',
      contextBadge: 'Global',
      icon: <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
    },
    {
      id: 'nav-lib',
      keys: [modifierLabel, '2'],
      description: 'Switch to Saved Kit Library',
      category: 'Navigation',
      contextBadge: 'Global',
      icon: <Library className="w-3.5 h-3.5 text-neutral-400" />
    },
    {
      id: 'nav-profile',
      keys: [modifierLabel, '3'],
      description: 'Switch to User Profile & Advanced Menu',
      category: 'Navigation',
      contextBadge: 'Global',
      icon: <Terminal className="w-3.5 h-3.5 text-neutral-400" />
    },
    {
      id: 'nav-test',
      keys: [modifierLabel, 'T'],
      description: 'Open Advanced Diagnostics Lab',
      category: 'Navigation',
      contextBadge: 'Global',
      icon: <Terminal className="w-3.5 h-3.5 text-neutral-400" />
    },
    {
      id: 'nav-help',
      keys: [modifierLabel, '/'],
      description: 'Toggle Shortcuts Overlay',
      category: 'Navigation',
      contextBadge: 'Global',
      icon: <Keyboard className="w-3.5 h-3.5 text-neutral-400" />
    },

    // Selection & Management
    {
      id: 'sel-all',
      keys: [modifierLabel, 'A'],
      description: 'Select / Deselect All Items',
      category: 'Selection',
      contextBadge: 'Library & Synth',
      icon: <CheckSquare className="w-3.5 h-3.5 text-neutral-400" />
    },
    {
      id: 'sel-del',
      keys: ['Delete', 'or', '⌫'],
      description: 'Delete Selected Sound(s)',
      category: 'Selection',
      contextBadge: 'Library',
      icon: <Trash2 className="w-3.5 h-3.5 text-neutral-400" />
    },
    {
      id: 'sel-nav',
      keys: ['↑', '↓', '←', '→'],
      description: 'Cycle & Focus Sounds',
      category: 'Selection',
      contextBadge: 'Library',
      icon: <Compass className="w-3.5 h-3.5 text-neutral-400" />
    },
    {
      id: 'sel-clear',
      keys: ['Esc'],
      description: 'Clear Selection / Close Modals',
      category: 'Selection',
      contextBadge: 'Global',
      icon: <X className="w-3.5 h-3.5 text-neutral-400" />
    },

    // Playback & Actions
    {
      id: 'act-play',
      keys: ['Space'],
      description: 'Play / Pause Focused Sound',
      category: 'Playback & Actions',
      contextBadge: 'Focused',
      icon: <Play className="w-3.5 h-3.5 text-neutral-400" />
    },
    {
      id: 'act-gen',
      keys: [modifierLabel, 'Enter'],
      description: 'Synthesize Audio Variation',
      category: 'Playback & Actions',
      contextBadge: 'Synthesizer',
      icon: <CornerDownLeft className="w-3.5 h-3.5 text-neutral-400" />
    },
    {
      id: 'act-kit',
      keys: [modifierLabel, 'N'],
      description: 'Create New Sound Kit',
      category: 'Playback & Actions',
      contextBadge: 'Global',
      icon: <FolderPlus className="w-3.5 h-3.5 text-neutral-400" />
    },
    {
      id: 'act-exp',
      keys: [modifierLabel, 'E'],
      description: 'Export Active Kit / Library (.zip)',
      category: 'Playback & Actions',
      contextBadge: 'Library',
      icon: <Download className="w-3.5 h-3.5 text-neutral-400" />
    },
  ];

  const categories = ['Navigation', 'Selection', 'Playback & Actions'] as const;

  const isKeyActive = (keyStr: string): boolean => {
    if (keyStr === '⌘' || keyStr === 'Ctrl' || keyStr.toLowerCase() === 'meta') {
      return isModifierHeld || activeKeys.has('meta') || activeKeys.has('control');
    }
    const lower = keyStr.toLowerCase();
    if (lower === 'space') return activeKeys.has('space');
    if (lower === 'enter' || lower === 'return') return activeKeys.has('enter');
    if (lower === 'delete' || lower === 'del') return activeKeys.has('delete');
    if (lower === '⌫' || lower === 'backspace') return activeKeys.has('backspace');
    if (lower === 'esc' || lower === 'escape') return activeKeys.has('escape');
    if (['↑', '↓', '←', '→'].includes(keyStr)) {
      return activeKeys.has('arrowup') || activeKeys.has('arrowdown') || activeKeys.has('arrowleft') || activeKeys.has('arrowright');
    }
    return activeKeys.has(lower);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="shortcuts-overlay-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            id="shortcuts-overlay-container"
            ref={containerRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-overlay-title"
            aria-describedby="shortcuts-overlay-desc"
            onKeyDown={handleKeyDown}
            initial={{ scale: 0.96, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="bg-neutral-900/95 border border-white/10 rounded-2xl max-w-2xl w-full shadow-2xl shadow-black/80 flex flex-col overflow-hidden text-neutral-200 my-auto relative focus:outline-none"
          >
            {/* Top Accent Light & Header */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 shrink-0 bg-neutral-950/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white shadow-inner">
                  <Keyboard className="w-4 h-4 text-neutral-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 id="shortcuts-overlay-title" className="text-sm font-bold text-white tracking-tight">Keyboard Shortcuts</h2>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white/10 text-neutral-300 border border-white/10">
                      {isModifierHeld ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {modifierLabel} Active
                        </span>
                      ) : (
                        `Hold ${modifierLabel}`
                      )}
                    </span>
                  </div>
                  <p id="shortcuts-overlay-desc" className="text-[11px] text-neutral-400 mt-0.5">
                    Hold <kbd className="px-1 py-0.2 bg-white/10 rounded font-mono text-[10px] text-white border border-white/10">{modifierLabel}</kbd> anytime to reveal this helper HUD.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onTogglePin && (
                  <button
                    id="shortcuts-pin-btn"
                    onClick={onTogglePin}
                    aria-label={isPinned ? "Unpin shortcuts overlay" : "Pin shortcuts overlay open"}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer select-none border",
                      isPinned
                        ? "bg-white text-black border-white shadow-sm"
                        : "bg-white/[0.04] text-neutral-400 hover:text-white border-white/5 hover:bg-white/10"
                    )}
                    title={isPinned ? "Unpin overlay" : "Pin overlay open"}
                  >
                    {isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                    <span className="hidden sm:inline">{isPinned ? 'Pinned' : 'Pin'}</span>
                  </button>
                )}

                <button
                  id="shortcuts-close-btn"
                  onClick={onClose}
                  aria-label="Close shortcuts overlay"
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Close (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Shortcut Categories List */}
            <div className="p-5 max-h-[70vh] overflow-y-auto flex flex-col gap-5 scrollbar-none">
              {categories.map((cat) => {
                const categoryShortcuts = shortcuts.filter(s => s.category === cat);
                return (
                  <div key={cat} className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                        {cat}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {categoryShortcuts.map((shortcut) => {
                        const allKeysActive = shortcut.keys
                          .filter(k => k !== 'or')
                          .every(k => isKeyActive(k));

                        return (
                          <div
                            key={shortcut.id}
                            id={`shortcut-card-${shortcut.id}`}
                            className={cn(
                              "p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all duration-150",
                              allKeysActive
                                ? "bg-white/10 border-white/30 text-white shadow-md shadow-black/40 ring-1 ring-white/20"
                                : "bg-neutral-950/60 border-white/[0.04] text-neutral-300 hover:border-white/10 hover:bg-neutral-950"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={cn(
                                "p-1.5 rounded-lg shrink-0",
                                allKeysActive ? "bg-white text-black" : "bg-white/[0.04] text-neutral-400"
                              )}>
                                {shortcut.icon}
                              </span>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[11px] font-semibold text-white truncate leading-tight">
                                  {shortcut.description}
                                </span>
                                {shortcut.contextBadge && (
                                  <span className="text-[9px] text-neutral-500 font-mono mt-0.5">
                                    {shortcut.contextBadge}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Keycaps */}
                            <div className="flex items-center gap-1 shrink-0 font-mono">
                              {shortcut.keys.map((key, kIdx) => {
                                if (key === 'or') {
                                  return (
                                    <span key={kIdx} className="text-[9px] text-neutral-500 px-0.5">
                                      /
                                    </span>
                                  );
                                }
                                const active = isKeyActive(key);
                                return (
                                  <kbd
                                    key={kIdx}
                                    className={cn(
                                      "px-2 py-1 rounded-md text-[10px] font-bold border transition-all duration-100 flex items-center justify-center min-w-[22px] shadow-sm select-none",
                                      active
                                        ? "bg-white text-black border-white shadow-md scale-105"
                                        : "bg-neutral-800/90 text-neutral-300 border-white/10"
                                    )}
                                  >
                                    {key}
                                  </kbd>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Footer Info */}
            <div className="px-5 py-3 border-t border-white/[0.06] bg-neutral-950/70 flex flex-wrap items-center justify-between gap-2 text-[10px] text-neutral-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live modifier detection active
              </span>
              <span className="font-mono text-neutral-400">
                Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-[9px] text-white">Esc</kbd> to dismiss
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
