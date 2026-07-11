import type { LibraryCueAsset, LibraryCueManifest } from '../types/cues';

export function createCueManifest(
  cues: readonly LibraryCueAsset[],
  generatedAt = new Date().toISOString(),
): LibraryCueManifest {
  if (Number.isNaN(Date.parse(generatedAt))) {
    throw new TypeError('Manifest generatedAt must be a valid ISO timestamp.');
  }

  const ids = new Set<string>();
  const fileNames = new Set<string>();
  cues.forEach((cue) => {
    if (ids.has(cue.id)) throw new Error(`Duplicate cue id "${cue.id}".`);
    if (fileNames.has(cue.audio.fileName)) throw new Error(`Duplicate audio filename "${cue.audio.fileName}".`);
    ids.add(cue.id);
    fileNames.add(cue.audio.fileName);
  });

  return {
    schemaVersion: '1.0',
    generatedAt,
    app: 'Library Cues',
    compatibleWith: {
      app: 'Light-Novels',
    },
    cues: cues.map((cue) => structuredClone(cue)),
  };
}
