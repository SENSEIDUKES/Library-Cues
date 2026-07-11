import { useState, type KeyboardEvent } from 'react';
import { inputClassName, labelClassName } from './styles';

interface TagInputProps {
  label: string;
  values: readonly string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function TagInput({ label, values, onChange, placeholder = 'Type and press Enter' }: TagInputProps) {
  const [entry, setEntry] = useState('');

  const commit = (rawValue: string) => {
    const additions = rawValue
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (additions.length === 0) return;
    onChange(Array.from(new Set([...values, ...additions])));
    setEntry('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commit(entry);
    }
  };

  return (
    <div>
      <label className={labelClassName}>{label}</label>
      {values.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {values.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange(values.filter((item) => item !== value))}
              className="rounded-full border border-white/[0.08] bg-white/[0.05] px-2.5 py-1 text-[11px] text-neutral-300 hover:border-rose-400/30 hover:text-rose-300"
              aria-label={`Remove ${value}`}
            >
              {value} <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}
      <input
        className={inputClassName}
        value={entry}
        onChange={(event) => setEntry(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => commit(entry)}
        placeholder={placeholder}
      />
    </div>
  );
}
