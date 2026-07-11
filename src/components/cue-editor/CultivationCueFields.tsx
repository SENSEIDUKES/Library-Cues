import type { CultivationCueProfile } from '../../types/cues';
import { TagInput } from './TagInput';
import { CULTIVATION_EVENTS, CULTIVATION_MAGNITUDES, DIRECTIONS, labelize } from './options';
import { inputClassName, labelClassName, sectionClassName, sectionTitleClassName } from './styles';

interface CultivationCueFieldsProps { value: CultivationCueProfile; onChange: (value: CultivationCueProfile) => void; }

export function CultivationCueFields({ value, onChange }: CultivationCueFieldsProps) {
  const update = <K extends keyof CultivationCueProfile>(field: K, nextValue: CultivationCueProfile[K]) => onChange({ ...value, [field]: nextValue });
  return (
    <fieldset className={sectionClassName}>
      <legend className={`${sectionTitleClassName} px-1`}>Cultivation profile</legend>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label><span className={labelClassName}>Event</span><select className={inputClassName} value={value.event} onChange={(event) => update('event', event.target.value as CultivationCueProfile['event'])}>{CULTIVATION_EVENTS.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select></label>
        <label><span className={labelClassName}>Direction</span><select className={inputClassName} value={value.direction ?? ''} onChange={(event) => update('direction', (event.target.value || undefined) as CultivationCueProfile['direction'])}><option value="">Any direction</option>{DIRECTIONS.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select></label>
        <label><span className={labelClassName}>Magnitude</span><select className={inputClassName} value={value.magnitude ?? ''} onChange={(event) => update('magnitude', (event.target.value || undefined) as CultivationCueProfile['magnitude'])}><option value="">Any magnitude</option>{CULTIVATION_MAGNITUDES.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select></label>
        <TagInput label="Elements" values={value.element ?? []} onChange={(items) => update('element', items)} />
      </div>
    </fieldset>
  );
}
