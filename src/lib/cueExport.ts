import type { LibraryCueManifest, StoredCueRecord, ValidationIssue } from '../types/cues';
import { withCanonicalCueIdentity } from './cueId';
import { createCueManifest } from './cueManifest';
import { validateStoredCueRecord } from './cueValidation';

export type CueExportMode = 'approved' | 'explicit';

export interface CueKitOptions {
  mode?: CueExportMode;
  generatedAt?: string;
}

export interface CueKitBuild {
  blob: Blob;
  manifest: LibraryCueManifest;
  exportedRecords: StoredCueRecord[];
}

export class CueExportValidationError extends Error {
  constructor(public readonly issues: ValidationIssue[]) {
    super(issues.map((entry) => `${entry.path}: ${entry.message}`).join('\n'));
    this.name = 'CueExportValidationError';
  }
}

export function selectCueRecordsForExport(
  records: readonly StoredCueRecord[],
  mode: CueExportMode = 'approved',
): StoredCueRecord[] {
  return mode === 'approved'
    ? records.filter((record) => record.cue.curation.status === 'approved')
    : [...records];
}

export async function buildCueKit(
  records: readonly StoredCueRecord[],
  options: CueKitOptions = {},
): Promise<CueKitBuild> {
  const { default: JSZip } = await import('jszip');
  const selected = selectCueRecordsForExport(records, options.mode ?? 'approved');
  if (selected.length === 0) {
    throw new Error(options.mode === 'explicit' ? 'No cues were selected for export.' : 'No approved cues are ready to export.');
  }

  const issues: ValidationIssue[] = [];
  const exportedRecords = selected.map((record) => {
    const cue = withCanonicalCueIdentity(record.cue, [], true);
    const canonicalRecord = { ...record, cue };
    const result = validateStoredCueRecord(canonicalRecord);
    result.issues.forEach((entry) => issues.push({ ...entry, path: `${cue.id}.${entry.path}` }));
    return canonicalRecord;
  });
  if (issues.length > 0) throw new CueExportValidationError(issues);

  const manifest = createCueManifest(
    exportedRecords.map((record) => record.cue),
    options.generatedAt,
  );
  const zip = new JSZip();
  exportedRecords.forEach((record) => {
    zip.file(`library-cues-kit/audio/${record.cue.audio.fileName}`, record.audioBase64, { base64: true });
  });
  zip.file('library-cues-kit/cue-manifest.json', JSON.stringify(manifest, null, 2));

  const blob = await zip.generateAsync({ type: 'blob' });
  return { blob, manifest, exportedRecords };
}

export async function downloadCueKit(
  records: readonly StoredCueRecord[],
  options: CueKitOptions = {},
): Promise<CueKitBuild> {
  const kit = await buildCueKit(records, options);
  const { saveAs } = await import('file-saver');
  saveAs(kit.blob, 'library-cues-kit.zip');
  return kit;
}
