import type { NumericRange } from '../../types/cues';
import { inputClassName, labelClassName } from './styles';

interface NumericRangeFieldProps {
  label: string;
  value?: NumericRange;
  onChange: (value: NumericRange | undefined) => void;
  optional?: boolean;
}

export function NumericRangeField({ label, value, onChange, optional = false }: NumericRangeFieldProps) {
  if (optional && !value) {
    return (
      <div>
        <span className={labelClassName}>{label}</span>
        <button
          type="button"
          onClick={() => onChange({ min: 0, max: 1 })}
          className="rounded-xl border border-dashed border-white/10 px-3 py-2 text-xs text-neutral-500 hover:border-white/20 hover:text-neutral-300"
        >
          Add range
        </button>
      </div>
    );
  }

  const range = value ?? { min: 0, max: 1 };
  return (
    <fieldset>
      <div className="mb-1.5 flex items-center justify-between">
        <legend className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">{label}</legend>
        {optional && (
          <button type="button" onClick={() => onChange(undefined)} className="text-[10px] text-neutral-600 hover:text-rose-300">
            Clear
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[10px] text-neutral-500">
          Min
          <input
            className={`${inputClassName} mt-1`}
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={range.min}
            onChange={(event) => onChange({ ...range, min: Number(event.target.value) })}
          />
        </label>
        <label className="text-[10px] text-neutral-500">
          Max
          <input
            className={`${inputClassName} mt-1`}
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={range.max}
            onChange={(event) => onChange({ ...range, max: Number(event.target.value) })}
          />
        </label>
      </div>
    </fieldset>
  );
}
