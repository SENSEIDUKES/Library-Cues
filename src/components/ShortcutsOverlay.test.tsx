import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShortcutsOverlay } from './ShortcutsOverlay';

describe('ShortcutsOverlay Component', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ShortcutsOverlay
        isOpen={false}
        onClose={vi.fn()}
        isModifierHeld={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when isOpen is true', () => {
    render(
      <ShortcutsOverlay
        isOpen={true}
        onClose={vi.fn()}
        isModifierHeld={false}
        isMac={true}
      />
    );

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Selection')).toBeInTheDocument();
    expect(screen.getByText('Playback & Actions')).toBeInTheDocument();
    expect(screen.getByText('Switch to Synthesizer Tab')).toBeInTheDocument();
    expect(screen.getByText('Switch to Saved Kit Library')).toBeInTheDocument();
    expect(screen.getByText('Select / Deselect All Items')).toBeInTheDocument();
  });

  it('displays modifier status indicator when isModifierHeld is true', () => {
    render(
      <ShortcutsOverlay
        isOpen={true}
        onClose={vi.fn()}
        isModifierHeld={true}
        isMac={true}
      />
    );

    expect(screen.getByText(/⌘ Active/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <ShortcutsOverlay
        isOpen={true}
        onClose={onClose}
        isModifierHeld={false}
      />
    );

    const closeBtn = screen.getByTitle('Close (Esc)');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onTogglePin when pin button is clicked', () => {
    const onTogglePin = vi.fn();
    render(
      <ShortcutsOverlay
        isOpen={true}
        onClose={vi.fn()}
        isModifierHeld={false}
        isPinned={false}
        onTogglePin={onTogglePin}
      />
    );

    const pinBtn = screen.getByTitle('Pin overlay open');
    fireEvent.click(pinBtn);
    expect(onTogglePin).toHaveBeenCalledTimes(1);
  });

  it('adapts modifier label to Ctrl when isMac is false', () => {
    render(
      <ShortcutsOverlay
        isOpen={true}
        onClose={vi.fn()}
        isModifierHeld={false}
        isMac={false}
      />
    );

    expect(screen.getByText('Hold Ctrl')).toBeInTheDocument();
  });

  it('highlights keycaps when matching keys are active in activeKeys set', () => {
    const activeKeys = new Set(['meta', '1']);
    render(
      <ShortcutsOverlay
        isOpen={true}
        onClose={vi.fn()}
        isModifierHeld={true}
        activeKeys={activeKeys}
        isMac={true}
      />
    );

    const card = document.getElementById('shortcut-card-nav-synth');
    expect(card).toBeInTheDocument();
    expect(card?.className).toContain('bg-white/10');
  });
});
