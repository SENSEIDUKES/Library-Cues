import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GenerationControls } from './GenerationControls';
import { GenerationParams } from '../types';

describe('GenerationControls', () => {
  const defaultParams: GenerationParams = {
    prompt: 'A test prompt',
    durationSeconds: 4,
    promptInfluence: 0.7,
    loop: false,
  };

  it('renders the generation button and prompt input', () => {
    render(
      <GenerationControls
        params={defaultParams}
        onChange={() => {}}
        onGenerate={() => {}}
        isGenerating={false}
      />
    );

    expect(screen.getByRole('textbox')).toHaveValue('A test prompt');
    expect(screen.getByRole('button', { name: /Synthesize Sounds/i })).toBeInTheDocument();
  });

  it('disables the generate button when isGenerating is true', () => {
    render(
      <GenerationControls
        params={defaultParams}
        onChange={() => {}}
        onGenerate={() => {}}
        isGenerating={true}
      />
    );

    const button = screen.getByRole('button', { name: /Synthesizing audio.../i });
    expect(button).toBeDisabled();
  });

  it('calls onGenerate when the generate button is clicked', () => {
    const handleGenerate = vi.fn();
    render(
      <GenerationControls
        params={defaultParams}
        onChange={() => {}}
        onGenerate={handleGenerate}
        isGenerating={false}
      />
    );

    const button = screen.getByRole('button', { name: /Synthesize Sounds/i });
    fireEvent.click(button);
    expect(handleGenerate).toHaveBeenCalledTimes(1);
  });

  it('updates prompt when typing and handles clear button', () => {
    const handleChange = vi.fn();
    render(
      <GenerationControls
        params={defaultParams}
        onChange={handleChange}
        onGenerate={() => {}}
        isGenerating={false}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'New prompt' } });
    expect(handleChange).toHaveBeenCalledWith({ ...defaultParams, prompt: 'New prompt' });

    const clearBtn = screen.getByText('Clear');
    fireEvent.click(clearBtn);
    expect(handleChange).toHaveBeenCalledWith({ ...defaultParams, prompt: '' });
  });

  it('updates duration when slider changes', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <GenerationControls
        params={defaultParams}
        onChange={handleChange}
        onGenerate={() => {}}
        isGenerating={false}
      />
    );

    const sliders = container.querySelectorAll('input[type="range"]');
    // duration slider is the first one
    fireEvent.change(sliders[0], { target: { value: '10' } });
    expect(handleChange).toHaveBeenCalledWith({ ...defaultParams, durationSeconds: 10 });
  });

  it('updates prompt influence when slider changes', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <GenerationControls
        params={defaultParams}
        onChange={handleChange}
        onGenerate={() => {}}
        isGenerating={false}
      />
    );

    const sliders = container.querySelectorAll('input[type="range"]');
    // influence slider is the second one
    fireEvent.change(sliders[1], { target: { value: '0.9' } });
    expect(handleChange).toHaveBeenCalledWith({ ...defaultParams, promptInfluence: 0.9 });
  });

  it('updates loop when toggle is clicked', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <GenerationControls
        params={defaultParams}
        onChange={handleChange}
        onGenerate={() => {}}
        isGenerating={false}
      />
    );

    const toggleButton = screen.getByRole('button', { hidden: true, name: '' });
    // Since there are multiple buttons, we can find by nearest class or just click the toggle button.
    // The toggle button is the one with w-11 class. Let's find it.
    const buttons = screen.getAllByRole('button');
    const loopToggle = buttons.find(b => b.className.includes('w-11'));
    if (loopToggle) {
      fireEvent.click(loopToggle);
    }
    expect(handleChange).toHaveBeenCalledWith({ ...defaultParams, loop: true });
  });
});
