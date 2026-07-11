import type { CombatCueProfile } from '../../types/cues';
import { MultiSelectField } from './MultiSelectField';
import { COMBAT_EVENTS, FORCES, MATERIALS, PERSPECTIVES, SPEEDS, WEAPONS, labelize } from './options';
import { inputClassName, labelClassName, sectionClassName, sectionTitleClassName } from './styles';

interface CombatCueFieldsProps { value: CombatCueProfile; onChange: (value: CombatCueProfile) => void; }

export function CombatCueFields({ value, onChange }: CombatCueFieldsProps) {
  const update = <K extends keyof CombatCueProfile>(field: K, nextValue: CombatCueProfile[K]) => onChange({ ...value, [field]: nextValue });
  return (
    <fieldset className={sectionClassName}>
      <legend className={`${sectionTitleClassName} px-1`}>Combat profile</legend>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label><span className={labelClassName}>Event</span><select className={inputClassName} value={value.event} onChange={(event) => update('event', event.target.value as CombatCueProfile['event'])}>{COMBAT_EVENTS.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select></label>
        <label><span className={labelClassName}>Weapon</span><select className={inputClassName} value={value.weapon ?? ''} onChange={(event) => update('weapon', (event.target.value || undefined) as CombatCueProfile['weapon'])}><option value="">Any weapon</option>{WEAPONS.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select></label>
        <div className="sm:col-span-2"><MultiSelectField label="Materials" options={MATERIALS} values={value.material} onChange={(items) => update('material', items)} /></div>
        <label><span className={labelClassName}>Force</span><select className={inputClassName} value={value.force ?? ''} onChange={(event) => update('force', (event.target.value || undefined) as CombatCueProfile['force'])}><option value="">Any force</option>{FORCES.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select></label>
        <label><span className={labelClassName}>Speed</span><select className={inputClassName} value={value.speed ?? ''} onChange={(event) => update('speed', (event.target.value || undefined) as CombatCueProfile['speed'])}><option value="">Any speed</option>{SPEEDS.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select></label>
        <label><span className={labelClassName}>Perspective</span><select className={inputClassName} value={value.perspective ?? ''} onChange={(event) => update('perspective', (event.target.value || undefined) as CombatCueProfile['perspective'])}><option value="">Any distance</option>{PERSPECTIVES.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select></label>
      </div>
    </fieldset>
  );
}
