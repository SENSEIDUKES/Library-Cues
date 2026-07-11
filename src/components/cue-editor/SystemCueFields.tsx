import type { SystemCueProfile } from '../../types/cues';
import { RARITIES, SYSTEM_EVENTS, SYSTEM_MAGNITUDES, SYSTEM_TONES, labelize } from './options';
import { inputClassName, labelClassName, sectionClassName, sectionTitleClassName } from './styles';

interface SystemCueFieldsProps { value: SystemCueProfile; onChange: (value: SystemCueProfile) => void; }

export function SystemCueFields({ value, onChange }: SystemCueFieldsProps) {
  const update = <K extends keyof SystemCueProfile>(field: K, nextValue: SystemCueProfile[K]) => onChange({ ...value, [field]: nextValue });
  return (
    <fieldset className={sectionClassName}>
      <legend className={`${sectionTitleClassName} px-1`}>System profile</legend>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label><span className={labelClassName}>Event</span><select className={inputClassName} value={value.event} onChange={(event) => update('event', event.target.value as SystemCueProfile['event'])}>{SYSTEM_EVENTS.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select></label>
        <label><span className={labelClassName}>Tone</span><select className={inputClassName} value={value.tone} onChange={(event) => update('tone', event.target.value as SystemCueProfile['tone'])}>{SYSTEM_TONES.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select></label>
        <label><span className={labelClassName}>Rarity</span><select className={inputClassName} value={value.rarity ?? ''} onChange={(event) => update('rarity', (event.target.value || undefined) as SystemCueProfile['rarity'])}><option value="">Any rarity</option>{RARITIES.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select></label>
        <label><span className={labelClassName}>Magnitude</span><select className={inputClassName} value={value.magnitude ?? ''} onChange={(event) => update('magnitude', (event.target.value || undefined) as SystemCueProfile['magnitude'])}><option value="">Any magnitude</option>{SYSTEM_MAGNITUDES.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select></label>
      </div>
    </fieldset>
  );
}
