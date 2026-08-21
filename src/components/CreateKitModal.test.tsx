import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CreateKitModal } from './CreateKitModal';
import { KIT_TEMPLATES } from '../data/kitTemplates';

describe('CreateKitModal', () => {
  it('renders pre-populated kit templates when modal is open', () => {
    render(
      <CreateKitModal
        isOpen={true}
        onClose={vi.fn()}
        newKitName=""
        setNewKitName={vi.fn()}
        newKitDescription=""
        setNewKitDescription={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText('Create Sound Kit')).toBeInTheDocument();
    expect(screen.getByText('Pre-Populated Kit Templates')).toBeInTheDocument();
    
    // Check template chips exist
    expect(screen.getByText('Sci-Fi Lasers')).toBeInTheDocument();
    expect(screen.getByText('UI Clicks')).toBeInTheDocument();
    expect(screen.getByText('Fantasy Spells')).toBeInTheDocument();
  });

  it('populates kit name and description when template chip is clicked', () => {
    const setNewKitName = vi.fn();
    const setNewKitDescription = vi.fn();

    render(
      <CreateKitModal
        isOpen={true}
        onClose={vi.fn()}
        newKitName=""
        setNewKitName={setNewKitName}
        newKitDescription=""
        setNewKitDescription={setNewKitDescription}
        onSubmit={vi.fn()}
      />
    );

    const laserChip = screen.getByText('Sci-Fi Lasers');
    fireEvent.click(laserChip);

    const scifiTemplate = KIT_TEMPLATES.find(t => t.name === 'Sci-Fi Lasers');
    expect(setNewKitName).toHaveBeenCalledWith(scifiTemplate?.name);
    expect(setNewKitDescription).toHaveBeenCalledWith(scifiTemplate?.description);
  });

  it('resets form when reset button is clicked', () => {
    const setNewKitName = vi.fn();
    const setNewKitDescription = vi.fn();

    render(
      <CreateKitModal
        isOpen={true}
        onClose={vi.fn()}
        newKitName="Sci-Fi Lasers"
        setNewKitName={setNewKitName}
        newKitDescription="Futuristic laser blasters"
        setNewKitDescription={setNewKitDescription}
        onSubmit={vi.fn()}
      />
    );

    const resetButton = screen.getByTitle('Reset template selection and fields');
    fireEvent.click(resetButton);

    expect(setNewKitName).toHaveBeenCalledWith('');
    expect(setNewKitDescription).toHaveBeenCalledWith('');
  });

  it('submits with selected kit name', () => {
    const onSubmit = vi.fn();

    render(
      <CreateKitModal
        isOpen={true}
        onClose={vi.fn()}
        newKitName="Fantasy Spells"
        setNewKitName={vi.fn()}
        newKitDescription="Arcane spellcasts"
        setNewKitDescription={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Create/i });
    fireEvent.click(submitBtn);

    expect(onSubmit).toHaveBeenCalled();
  });
});
