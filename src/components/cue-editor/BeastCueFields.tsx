import type { BeastCueProfile } from '../../types/cues';
import { MultiSelectField } from './MultiSelectField';
import {
  BEAST_BODY_TYPES,
  BEAST_DISTANCES,
  BEAST_ELEMENTS,
  BEAST_EVENT_TYPES,
  BEAST_INTELLIGENCES,
  BEAST_MOVEMENTS,
  BEAST_SIGNATURE_SOUNDS,
  BEAST_SIZES,
  BEAST_THREAT_TIERS,
  BEAST_VOCAL_STATES,
  labelize,
} from './options';
import { inputClassName, labelClassName, sectionClassName, sectionTitleClassName } from './styles';

interface BeastCueFieldsProps {
  value: BeastCueProfile;
  onChange: (value: BeastCueProfile) => void;
}

export function BeastCueFields({ value, onChange }: BeastCueFieldsProps) {
  const update = <K extends keyof BeastCueProfile>(field: K, nextValue: BeastCueProfile[K]) => {
    onChange({ ...value, [field]: nextValue });
  };

  return (
    <fieldset className={sectionClassName}>
      <legend className={`${sectionTitleClassName} px-1`}>Beast profile</legend>
      <p className="mt-2 text-xs text-neutral-600">Friendly sizes map to the exact Light-Novels BeastSonicProfile vocabulary shown in parentheses.</p>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <MultiSelectField label="Sizes" options={BEAST_SIZES} values={value.sizes} onChange={(items) => update('sizes', items)} />
        <MultiSelectField label="Body types" options={BEAST_BODY_TYPES} values={value.bodyTypes} onChange={(items) => update('bodyTypes', items)} />
        <MultiSelectField label="Elements" options={BEAST_ELEMENTS} values={value.elements} onChange={(items) => update('elements', items)} />
        <MultiSelectField label="Movements" options={BEAST_MOVEMENTS} values={value.movements} onChange={(items) => update('movements', items)} />
        <MultiSelectField label="Intelligence" options={BEAST_INTELLIGENCES} values={value.intelligences} onChange={(items) => update('intelligences', items)} />
        <MultiSelectField label="Threat tiers" options={BEAST_THREAT_TIERS} values={value.threatTiers} onChange={(items) => update('threatTiers', items)} />
        <MultiSelectField label="Signature sounds" options={BEAST_SIGNATURE_SOUNDS} values={value.signatureSounds} onChange={(items) => update('signatureSounds', items)} />
        <MultiSelectField label="Event types" options={BEAST_EVENT_TYPES} values={value.eventTypes} onChange={(items) => update('eventTypes', items)} />

        <label>
          <span className={labelClassName}>Distance</span>
          <select className={inputClassName} value={value.distance ?? ''} onChange={(event) => update('distance', (event.target.value || undefined) as BeastCueProfile['distance'])}>
            <option value="">Any distance</option>
            {BEAST_DISTANCES.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}
          </select>
        </label>
        <label>
          <span className={labelClassName}>Vocal state</span>
          <select className={inputClassName} value={value.vocalState ?? ''} onChange={(event) => update('vocalState', (event.target.value || undefined) as BeastCueProfile['vocalState'])}>
            <option value="">Any state</option>
            {BEAST_VOCAL_STATES.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className={labelClassName}>Scale weight</span>
          <input className={inputClassName} type="number" min="0" step="0.1" value={value.scaleWeight ?? ''} onChange={(event) => update('scaleWeight', event.target.value === '' ? undefined : Number(event.target.value))} />
        </label>
      </div>
    </fieldset>
  );
}
