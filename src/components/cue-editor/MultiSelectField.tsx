import { labelize } from './options';

type Option = string | { value: string; label: string };

interface MultiSelectFieldProps<T extends string> {
  label: string;
  options: readonly Option[];
  values: readonly T[] | undefined;
  onChange: (values: T[]) => void;
}

export function MultiSelectField<T extends string>({ label, options, values = [], onChange }: MultiSelectFieldProps<T>) {
  const selected = new Set<string>(values);

  return (
    <fieldset>
      <legend className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500">{label}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? labelize(option) : option.label;
          const checked = selected.has(value);
          return (
            <label
              key={value}
              className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 text-xs transition-colors ${
                checked
                  ? 'border-white/20 bg-white/10 text-white'
                  : 'border-white/[0.05] bg-black/20 text-neutral-400 hover:border-white/10'
              }`}
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-white"
                checked={checked}
                onChange={() => {
                  const next = new Set(selected);
                  if (checked) next.delete(value);
                  else next.add(value);
                  onChange(Array.from(next) as T[]);
                }}
              />
              <span>{optionLabel}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
