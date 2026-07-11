import type { LibraryCueAsset } from '../../types/cues';
import { MultiSelectField } from './MultiSelectField';
import { NumericRangeField } from './NumericRangeField';
import { MUSIC_MOODS, MUSIC_REGIONS } from './options';
import { TagInput } from './TagInput';
import { sectionClassName, sectionTitleClassName } from './styles';

interface NarrativeFieldsProps {
  value: LibraryCueAsset['narrative'];
  onChange: (value: LibraryCueAsset['narrative']) => void;
}

export function NarrativeFields({ value, onChange }: NarrativeFieldsProps) {
  const update = <K extends keyof LibraryCueAsset['narrative']>(
    field: K,
    nextValue: LibraryCueAsset['narrative'][K],
  ) => onChange({ ...value, [field]: nextValue });

  return (
    <section className={sectionClassName} aria-labelledby="narrative-fields-heading">
      <h2 id="narrative-fields-heading" className={sectionTitleClassName}>Narrative matching</h2>
      <p className="mt-1 text-xs leading-relaxed text-neutral-600">Ranges use normalized Light-Novels cue values from 0 to 1.</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <NumericRangeField
          label="Intensity range"
          value={value.intensityRange}
          onChange={(range) => update('intensityRange', range)}
        />
        <TagInput label="Tags" values={value.tags} onChange={(tags) => update('tags', tags)} placeholder="roar, warning, aerial" />
      </div>

      <details className="mt-4 rounded-xl border border-white/[0.05] bg-black/20 open:bg-black/30">
        <summary className="cursor-pointer select-none px-3 py-3 text-xs font-semibold text-neutral-400 hover:text-neutral-200">
          Additional narrative filters
        </summary>
        <div className="grid gap-4 border-t border-white/[0.05] p-3 sm:grid-cols-2">
          <TagInput label="Scene types" values={value.sceneTypes ?? []} onChange={(items) => update('sceneTypes', items)} />
          <TagInput label="Environments" values={value.environments ?? []} onChange={(items) => update('environments', items)} />
          <TagInput label="Motions" values={value.motions ?? []} onChange={(items) => update('motions', items)} />
          <TagInput label="Emotions" values={value.emotions ?? []} onChange={(items) => update('emotions', items)} />
          <TagInput label="Elements" values={value.elements ?? []} onChange={(items) => update('elements', items)} />
          <TagInput label="Signatures" values={value.signatures ?? []} onChange={(items) => update('signatures', items)} />
          <MultiSelectField label="Music moods" options={MUSIC_MOODS} values={value.musicMoods} onChange={(items) => update('musicMoods', items)} />
          <MultiSelectField label="Music regions" options={MUSIC_REGIONS} values={value.musicRegions} onChange={(items) => update('musicRegions', items)} />
          <NumericRangeField label="Tension range" value={value.tensionRange} onChange={(range) => update('tensionRange', range)} optional />
          <NumericRangeField label="Danger range" value={value.dangerRange} onChange={(range) => update('dangerRange', range)} optional />
          <NumericRangeField label="Mysticism range" value={value.mysticismRange} onChange={(range) => update('mysticismRange', range)} optional />
          <NumericRangeField label="Power shift range" value={value.powerShiftRange} onChange={(range) => update('powerShiftRange', range)} optional />
        </div>
      </details>
    </section>
  );
}
