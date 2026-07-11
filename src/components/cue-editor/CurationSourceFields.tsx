import type { LibraryCueAsset } from '../../types/cues';
import { inputClassName, labelClassName } from './styles';

interface CurationSourceFieldsProps { asset: LibraryCueAsset; onChange: (asset: LibraryCueAsset) => void; }

export function CurationSourceFields({ asset, onChange }: CurationSourceFieldsProps) {
  const updateCuration = <K extends keyof LibraryCueAsset['curation']>(field: K, value: LibraryCueAsset['curation'][K]) => onChange({ ...asset, curation: { ...asset.curation, [field]: value } });
  const updateSource = <K extends keyof LibraryCueAsset['source']>(field: K, value: LibraryCueAsset['source'][K]) => onChange({ ...asset, source: { ...asset.source, [field]: value } });
  return (
    <details className="rounded-2xl border border-white/[0.06] bg-white/[0.025] open:bg-white/[0.035]">
      <summary className="cursor-pointer select-none px-4 py-4 text-xs font-bold uppercase tracking-[0.14em] text-neutral-400 sm:px-5">Curation, identity, and source</summary>
      <div className="grid gap-4 border-t border-white/[0.05] p-4 sm:grid-cols-2 sm:p-5">
        <label className="sm:col-span-2"><span className={labelClassName}>Description</span><textarea className={`${inputClassName} min-h-20 resize-y`} value={asset.description ?? ''} onChange={(event) => onChange({ ...asset, description: event.target.value || undefined })} /></label>
        <label><span className={labelClassName}>Variant</span><input className={inputClassName} value={asset.variant ?? ''} onChange={(event) => onChange({ ...asset, variant: event.target.value || undefined })} /></label>
        <label><span className={labelClassName}>Rating</span><input className={inputClassName} type="number" min="1" max="5" step="1" value={asset.curation.rating ?? ''} onChange={(event) => updateCuration('rating', event.target.value === '' ? undefined : Number(event.target.value))} /></label>
        <label className="sm:col-span-2"><span className={labelClassName}>Curation notes</span><textarea className={`${inputClassName} min-h-20 resize-y`} value={asset.curation.notes ?? ''} onChange={(event) => updateCuration('notes', event.target.value || undefined)} /></label>
        <label><span className={labelClassName}>Approved at</span><input className={inputClassName} value={asset.curation.approvedAt ?? ''} onChange={(event) => updateCuration('approvedAt', event.target.value || undefined)} placeholder="ISO timestamp" /></label>
        <label><span className={labelClassName}>Replaced by cue ID</span><input className={inputClassName} value={asset.curation.replacedBy ?? ''} onChange={(event) => updateCuration('replacedBy', event.target.value || undefined)} /></label>
        <div className="sm:col-span-2 mt-2 border-t border-white/[0.05] pt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">Generation provenance</div>
        <label><span className={labelClassName}>Provider</span><select className={inputClassName} value={asset.source.provider} onChange={(event) => updateSource('provider', event.target.value as LibraryCueAsset['source']['provider'])}>{['elevenlabs', 'recorded', 'licensed', 'synthetic'].map((provider) => <option key={provider} value={provider}>{provider}</option>)}</select></label>
        <label><span className={labelClassName}>Model</span><input className={inputClassName} value={asset.source.model ?? ''} onChange={(event) => updateSource('model', event.target.value || undefined)} /></label>
        <label className="sm:col-span-2"><span className={labelClassName}>Original prompt</span><textarea className={`${inputClassName} min-h-20 resize-y`} value={asset.source.prompt ?? ''} onChange={(event) => updateSource('prompt', event.target.value || undefined)} /></label>
        <label><span className={labelClassName}>Prompt influence</span><input className={inputClassName} type="number" min="0" max="1" step="0.01" value={asset.source.promptInfluence ?? ''} onChange={(event) => updateSource('promptInfluence', event.target.value === '' ? undefined : Number(event.target.value))} /></label>
        <label><span className={labelClassName}>Requested duration (seconds)</span><input className={inputClassName} type="number" min="0" step="0.1" value={asset.source.requestedDurationSeconds ?? ''} onChange={(event) => updateSource('requestedDurationSeconds', event.target.value === '' ? undefined : Number(event.target.value))} /></label>
        <label className="flex min-h-11 cursor-pointer items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5 sm:col-span-2"><span className="text-xs font-semibold text-neutral-300">Originally requested as a loop</span><input type="checkbox" className="h-4 w-4 accent-white" checked={asset.source.requestedLoop ?? false} onChange={(event) => updateSource('requestedLoop', event.target.checked)} /></label>
      </div>
    </details>
  );
}
