import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts, KeyboardActions } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts hook', () => {
  let mockActions: KeyboardActions;

  beforeEach(() => {
    mockActions = {
      activeTab: 'synthesize',
      setActiveTab: vi.fn(),
      showTestCenter: false,
      setShowTestCenter: vi.fn(),
      showCreateKitModal: false,
      setShowCreateKitModal: vi.fn(),
      showRenameKitModal: false,
      setShowRenameKitModal: vi.fn(),
      showBatchAssignModal: false,
      setShowBatchAssignModal: vi.fn(),
      showDeleteModal: false,
      setShowDeleteModal: vi.fn(),
      selectedLibraryIds: new Set(),
      clearLibrarySelection: vi.fn(),
      selectedSynthesisIds: new Set(),
      clearSynthesisSelection: vi.fn(),
      exportKit: vi.fn(),
      libraryLength: 5,
      handleGenerate: vi.fn(),
      isGenerating: false,
      prompt: 'test explosion prompt',
      generatingCount: 3,
      handleToggleSelectAll: vi.fn(),
      handleToggleSynthesisSelectAll: vi.fn(),
      variationsLength: 2,
      handleKeyboardDelete: vi.fn(),
      handleCycleFocus: vi.fn(),
      onModifierHeldChange: vi.fn(),
      onActiveKeysChange: vi.fn(),
      onPressedKeysChange: vi.fn(),
    };
  });

  it('attaches window event listeners once on mount and does NOT re-attach on state changes or keypresses', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { result, rerender, unmount } = renderHook(
      (props) => useKeyboardShortcuts(props),
      { initialProps: mockActions }
    );

    // Initial attachment: keydown, keyup, blur (3 calls)
    const initialAddCount = addEventListenerSpy.mock.calls.filter(
      call => call[0] === 'keydown' || call[0] === 'keyup' || call[0] === 'blur'
    ).length;
    expect(initialAddCount).toBe(3);

    // Trigger Meta keydown -> modifier held
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Meta', metaKey: true }));
    });
    expect(result.current.isModifierHeld).toBe(true);

    // Trigger Meta keyup -> modifier released
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Meta', metaKey: false }));
    });
    expect(result.current.isModifierHeld).toBe(false);

    // Toggle pin
    act(() => {
      result.current.setIsShortcutsPinned(true);
    });
    expect(result.current.isShortcutsPinned).toBe(true);

    // Rerender with updated props
    const newActions = { ...mockActions, prompt: 'updated prompt', libraryLength: 10 };
    rerender(newActions);

    // The listener count MUST remain 3 without any cleanup/re-attachment cycles
    const totalAddCount = addEventListenerSpy.mock.calls.filter(
      call => call[0] === 'keydown' || call[0] === 'keyup' || call[0] === 'blur'
    ).length;
    const totalRemoveCount = removeEventListenerSpy.mock.calls.filter(
      call => call[0] === 'keydown' || call[0] === 'keyup' || call[0] === 'blur'
    ).length;

    expect(totalAddCount).toBe(3);
    expect(totalRemoveCount).toBe(0);

    // Clean up on unmount
    unmount();
    const finalRemoveCount = removeEventListenerSpy.mock.calls.filter(
      call => call[0] === 'keydown' || call[0] === 'keyup' || call[0] === 'blur'
    ).length;
    expect(finalRemoveCount).toBe(3);

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('triggers navigation shortcuts (Cmd+1, Cmd+2, Cmd+3) with latest action handlers', () => {
    const { rerender } = renderHook(
      (props) => useKeyboardShortcuts(props),
      { initialProps: mockActions }
    );

    // Cmd + 2 -> switch to library
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '2', metaKey: true }));
    });
    expect(mockActions.setActiveTab).toHaveBeenCalledWith('library');

    // Rerender with updated setActiveTab mock
    const newSetActiveTab = vi.fn();
    rerender({ ...mockActions, setActiveTab: newSetActiveTab });

    // Cmd + 1 -> switch to synthesize using the new mock
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', metaKey: true }));
    });
    expect(newSetActiveTab).toHaveBeenCalledWith('synthesize');
  });

  it('triggers synthesize action on Cmd+Enter', () => {
    renderHook(() => useKeyboardShortcuts(mockActions));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', metaKey: true }));
    });

    expect(mockActions.handleGenerate).toHaveBeenCalledWith(3, false);
  });

  it('handles Escape key to close pinned shortcuts and modals', () => {
    const { result } = renderHook(() => useKeyboardShortcuts(mockActions));

    // Pin overlay
    act(() => {
      result.current.setIsShortcutsPinned(true);
    });
    expect(result.current.isShortcutsPinned).toBe(true);

    // Press Escape
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(result.current.isShortcutsPinned).toBe(false);
  });

  it('resets modifier and active keys on window blur', () => {
    const { result } = renderHook(() => useKeyboardShortcuts(mockActions));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true }));
    });
    expect(result.current.isModifierHeld).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(result.current.isModifierHeld).toBe(false);
  });
});
