import { useEffect, useState, type FormEvent } from 'react';
import type { CueCategory, LibraryCueAsset, ValidationIssue } from '../../types/cues';
import { AmbienceCueFields } from './AmbienceCueFields';
import { BeastCueFields } from './BeastCueFields';
import { CombatCueFields } from './CombatCueFields';
import { CultivationCueFields } from './CultivationCueFields';
import { CurationSourceFields } from './CurationSourceFields';
import { GeneralCueFields } from './GeneralCueFields';
import { MovementCueFields } from './MovementCueFields';
import { NarrativeFields } from './NarrativeFields';
import { SystemCueFields } from './SystemCueFields';

export interface LibraryCueMetadataEditorProps {
  asset: LibraryCueAsset;
  open: boolean;
  onCancel: () => void;
  onSave: (asset: LibraryCueAsset) => Promise<ValidationIssue[] | void> | ValidationIssue[] | void;
}

function issueMessage(issue: ValidationIssue): string {
  const candidate = issue as unknown as Record<string, unknown>;
  const path = typeof candidate.path === 'string' ? candidate.path : '';
  const message = typeof candidate.message === 'string' ? candidate.message : 'This cue contains invalid metadata.';
  return path ? `${path}: ${message}` : message;
}

function initializeCategoryProfile(asset: LibraryCueAsset, category: CueCategory): LibraryCueAsset {
  const next = { ...asset, category };
  if (category === 'beast' && !next.beast) next.beast = {};
  if (category === 'movement' && !next.movement) next.movement = { movement: 'walk' };
  if (category === 'combat' && !next.combat) next.combat = { event: 'impact' };
  if ((category === 'ambience' || category === 'weather') && !next.ambience) {
    next.ambience = { atmosphere: category === 'weather' ? 'rain' : 'wind', seamlessLoop: next.playback.loopable };
  }
  if ((category === 'cultivation' || category === 'magic') && !next.cultivation) next.cultivation = { event: 'qi-gathering' };
  if (category === 'system' && !next.system) next.system = { event: 'status', tone: 'neutral' };
  return next;
}

export function LibraryCueMetadataEditor({ asset, open, onCancel, onSave }: LibraryCueMetadataEditorProps) {
  const [draft, setDraft] = useState(asset);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(asset);
    setIssues([]);
    setSaveError(null);
  }, [asset, open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, open, saving]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setIssues([]);
    setSaveError(null);
    try {
      const result = await onSave(draft);
      if (Array.isArray(result) && result.length > 0) setIssues(result);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save this cue.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 px-0 pt-8 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="cue-editor-title">
      <form onSubmit={handleSubmit} className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.08] bg-neutral-950 shadow-2xl sm:max-h-[90vh] sm:rounded-3xl">
        <header className="shrink-0 border-b border-white/[0.06] bg-neutral-950/95 px-5 py-4 backdrop-blur sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600">Cue curation</p><h1 id="cue-editor-title" className="mt-1 text-lg font-semibold text-white">Classify saved sound</h1><p className="mt-1 text-xs text-neutral-500">Review matching metadata before this asset enters the library.</p></div>
            <button type="button" onClick={onCancel} disabled={saving} className="rounded-full border border-white/[0.06] px-3 py-1.5 text-xs text-neutral-400 hover:border-white/15 hover:text-white disabled:opacity-40">Close</button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {(issues.length > 0 || saveError) && (
            <div className="mb-4 rounded-2xl border border-rose-500/25 bg-rose-950/25 p-4" role="alert">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-rose-300">Fix these fields before saving</p>
              {saveError && <p className="mt-2 text-xs text-rose-200">{saveError}</p>}
              {issues.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-rose-200">{issues.map((issue, index) => <li key={`${issueMessage(issue)}-${index}`}>{issueMessage(issue)}</li>)}</ul>}
            </div>
          )}

          <div className="space-y-4">
            <GeneralCueFields asset={draft} onChange={setDraft} onCategoryChange={(category) => setDraft((current) => initializeCategoryProfile(current, category))} />
            <NarrativeFields value={draft.narrative} onChange={(narrative) => setDraft((current) => ({ ...current, narrative }))} />
            {draft.category === 'beast' && <BeastCueFields value={draft.beast ?? {}} onChange={(beast) => setDraft((current) => ({ ...current, beast }))} />}
            {draft.category === 'movement' && <MovementCueFields value={draft.movement ?? { movement: 'walk' }} onChange={(movement) => setDraft((current) => ({ ...current, movement }))} />}
            {draft.category === 'combat' && <CombatCueFields value={draft.combat ?? { event: 'impact' }} onChange={(combat) => setDraft((current) => ({ ...current, combat }))} />}
            {(draft.category === 'ambience' || draft.category === 'weather') && <AmbienceCueFields value={draft.ambience ?? { atmosphere: 'wind', seamlessLoop: draft.playback.loopable }} onChange={(ambience) => setDraft((current) => ({ ...current, ambience }))} />}
            {(draft.category === 'cultivation' || draft.category === 'magic') && <CultivationCueFields value={draft.cultivation ?? { event: 'qi-gathering' }} onChange={(cultivation) => setDraft((current) => ({ ...current, cultivation }))} />}
            {draft.category === 'system' && <SystemCueFields value={draft.system ?? { event: 'status', tone: 'neutral' }} onChange={(system) => setDraft((current) => ({ ...current, system }))} />}
            <CurationSourceFields asset={draft} onChange={setDraft} />
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-white/[0.06] bg-neutral-950/95 px-5 py-4 backdrop-blur sm:px-6">
          <button type="button" onClick={onCancel} disabled={saving} className="rounded-full px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white disabled:opacity-40">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-full bg-white px-5 py-2 text-xs font-bold text-black transition-colors hover:bg-neutral-200 disabled:cursor-wait disabled:opacity-50">{saving ? 'Validating…' : 'Save cue'}</button>
        </footer>
      </form>
    </div>
  );
}
