import type { AmbienceCueProfile } from '../../types/cues';
import { MultiSelectField } from './MultiSelectField';
import { ATMOSPHERES, DENSITIES, TIMES_OF_DAY, WEATHER_TYPES, labelize } from './options';
import { inputClassName, labelClassName, sectionClassName, sectionTitleClassName } from './styles';

interface AmbienceCueFieldsProps { value: AmbienceCueProfile; onChange: (value: AmbienceCueProfile) => void; }

export function AmbienceCueFields({ value, onChange }: AmbienceCueFieldsProps) {
  const update = <K extends keyof AmbienceCueProfile>(field: K, nextValue: AmbienceCueProfile[K]) => onChange({ ...value, [field]: nextValue });
  return (
    <fieldset className={sectionClassName}>
      <legend className={`${sectionTitleClassName} px-1`}>Ambience profile</legend>
      <div className="mt-3 grid gap-5 sm:grid-cols-2">
        <label><span className={labelClassName}>Atmosphere</span><select className={inputClassName} value={value.atmosphere} onChange={(event) => update('atmosphere', event.target.value as AmbienceCueProfile['atmosphere'])}>{ATMOSPHERES.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select></label>
        <label><span className={labelClassName}>Density</span><select className={inputClassName} value={value.density ?? ''} onChange={(event) => update('density', (event.target.value || undefined) as AmbienceCueProfile['density'])}><option value="">Any density</option>{DENSITIES.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select></label>
        <MultiSelectField label="Time of day" options={TIMES_OF_DAY} values={value.timeOfDay} onChange={(items) => update('timeOfDay', items)} />
        <MultiSelectField label="Weather" options={WEATHER_TYPES} values={value.weather} onChange={(items) => update('weather', items)} />
        {([['interior', 'Interior'], ['populated', 'Populated'], ['seamlessLoop', 'Seamless loop']] as const).map(([field, label]) => (
          <label key={field} className="flex min-h-11 cursor-pointer items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5">
            <span className="text-xs font-semibold text-neutral-300">{label}</span>
            <input type="checkbox" className="h-4 w-4 accent-white" checked={value[field] ?? false} onChange={(event) => update(field, event.target.checked)} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
