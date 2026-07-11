import type { MovementCueProfile } from '../../types/cues';
import { ARMOR_TYPES, ENTITY_TYPES, MOVEMENT_TYPES, PACES, SURFACES, WEIGHTS, labelize } from './options';
import { inputClassName, labelClassName, sectionClassName, sectionTitleClassName } from './styles';

interface MovementCueFieldsProps { value: MovementCueProfile; onChange: (value: MovementCueProfile) => void; }

export function MovementCueFields({ value, onChange }: MovementCueFieldsProps) {
  const update = <K extends keyof MovementCueProfile>(field: K, nextValue: MovementCueProfile[K]) => onChange({ ...value, [field]: nextValue });
  const selects = [
    ['surface', 'Surface', SURFACES],
    ['weight', 'Weight', WEIGHTS],
    ['pace', 'Pace', PACES],
    ['armor', 'Armor', ARMOR_TYPES],
    ['entityType', 'Entity type', ENTITY_TYPES],
  ] as const;
  return (
    <fieldset className={sectionClassName}>
      <legend className={`${sectionTitleClassName} px-1`}>Movement profile</legend>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label><span className={labelClassName}>Movement</span><select className={inputClassName} value={value.movement} onChange={(event) => update('movement', event.target.value as MovementCueProfile['movement'])}>{MOVEMENT_TYPES.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select></label>
        {selects.map(([field, label, options]) => (
          <label key={field}><span className={labelClassName}>{label}</span><select className={inputClassName} value={value[field] ?? ''} onChange={(event) => update(field, (event.target.value || undefined) as MovementCueProfile[typeof field])}><option value="">Any</option>{options.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select></label>
        ))}
        <label><span className={labelClassName}>Step count</span><input className={inputClassName} type="number" min="1" step="1" value={value.stepCount ?? ''} onChange={(event) => update('stepCount', event.target.value === '' ? undefined : Number(event.target.value))} /></label>
      </div>
    </fieldset>
  );
}
