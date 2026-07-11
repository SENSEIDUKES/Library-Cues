import type { CueCategory, LibraryCueAsset } from '../../types/cues';
import { CUE_CATEGORIES, CURATION_STATUSES, PLAYBACK_TYPES, labelize } from './options';
import { inputClassName, labelClassName, sectionClassName, sectionTitleClassName } from './styles';

interface GeneralCueFieldsProps {
  asset: LibraryCueAsset;
  onChange: (asset: LibraryCueAsset) => void;
  onCategoryChange: (category: CueCategory) => void;
}

export function GeneralCueFields({ asset, onChange, onCategoryChange }: GeneralCueFieldsProps) {
  const updateIdentity = (field: 'displayName' | 'family' | 'action', value: string) => {
    onChange({ ...asset, [field]: value });
  };

  const updatePlayback = <K extends keyof LibraryCueAsset['playback']>(
    field: K,
    value: LibraryCueAsset['playback'][K],
  ) => {
    onChange({ ...asset, playback: { ...asset.playback, [field]: value } });
  };

  return (
    <fieldset className={sectionClassName}>
      <legend className={`${sectionTitleClassName} px-1`}>Core classification</legend>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className={labelClassName}>Display name</span>
          <input
            className={inputClassName}
            value={asset.displayName}
            onChange={(event) => updateIdentity('displayName', event.target.value)}
            placeholder="Thunder Roc warning screech"
            required
          />
        </label>

        <label>
          <span className={labelClassName}>Category</span>
          <select
            className={inputClassName}
            value={asset.category}
            onChange={(event) => onCategoryChange(event.target.value as CueCategory)}
          >
            {CUE_CATEGORIES.map((category) => (
              <option key={category} value={category}>{labelize(category)}</option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClassName}>Curation status</span>
          <select
            className={inputClassName}
            value={asset.curation.status}
            onChange={(event) => onChange({
              ...asset,
              curation: {
                ...asset.curation,
                status: event.target.value as LibraryCueAsset['curation']['status'],
              },
            })}
          >
            {CURATION_STATUSES.map((status) => (
              <option key={status} value={status}>{labelize(status)}</option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClassName}>Family</span>
          <input
            className={inputClassName}
            value={asset.family}
            onChange={(event) => updateIdentity('family', event.target.value)}
            placeholder="dragon-vocals"
            required
          />
        </label>

        <label>
          <span className={labelClassName}>Action</span>
          <input
            className={inputClassName}
            value={asset.action}
            onChange={(event) => updateIdentity('action', event.target.value)}
            placeholder="warning-screech"
            required
          />
        </label>
      </div>

      <div className="mt-5 border-t border-white/[0.05] pt-4">
        <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">Playback</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClassName}>Playback type</span>
            <select
              className={inputClassName}
              value={asset.playback.type}
              onChange={(event) => updatePlayback('type', event.target.value as LibraryCueAsset['playback']['type'])}
            >
              {PLAYBACK_TYPES.map((type) => (
                <option key={type} value={type}>{labelize(type)}</option>
              ))}
            </select>
          </label>

          <label>
            <span className={labelClassName}>Default volume</span>
            <div className="flex items-center gap-3">
              <input
                className="h-1.5 min-w-0 flex-1 cursor-pointer accent-white"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={asset.playback.defaultVolume}
                onChange={(event) => updatePlayback('defaultVolume', Number(event.target.value))}
              />
              <input
                className={`${inputClassName} w-20 text-right font-mono`}
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={asset.playback.defaultVolume}
                onChange={(event) => updatePlayback('defaultVolume', Number(event.target.value))}
              />
            </div>
          </label>

          <label className="flex min-h-11 cursor-pointer items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5 sm:col-span-2">
            <span>
              <span className="block text-xs font-semibold text-neutral-300">Loopable</span>
              <span className="block text-[10px] text-neutral-600">The audio can repeat without a hard seam.</span>
            </span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-white"
              checked={asset.playback.loopable}
              onChange={(event) => updatePlayback('loopable', event.target.checked)}
            />
          </label>
        </div>
      </div>
    </fieldset>
  );
}
