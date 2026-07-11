import type { LibraryCueAsset } from '../types/cues';
import { audioFileNameForCue, sanitizeFileStem } from './mime';

const compactParts = (parts: Array<string | undefined>): string[] => {
  const seen = new Set<string>();
  return parts
    .map((part) => part && sanitizeFileStem(part))
    .filter((part): part is string => Boolean(part))
    .filter((part) => {
      if (seen.has(part)) return false;
      seen.add(part);
      return true;
    });
};

export function cueIdBase(asset: LibraryCueAsset): string {
  if (asset.category === 'beast' && asset.beast) {
    return compactParts([
      asset.category,
      asset.beast.sizes?.[0],
      asset.beast.bodyTypes?.[0],
      asset.beast.elements?.[0],
      asset.beast.signatureSounds?.[0] ?? asset.action,
      asset.beast.distance,
    ]).join('.');
  }

  if (asset.category === 'movement' && asset.movement) {
    return compactParts([asset.category, asset.family, asset.movement.movement, asset.movement.surface, asset.variant]).join('.');
  }

  if (asset.category === 'combat' && asset.combat) {
    return compactParts([asset.category, asset.family, asset.combat.event, asset.combat.weapon, asset.combat.force, asset.variant]).join('.');
  }

  if ((asset.category === 'ambience' || asset.category === 'weather') && asset.ambience) {
    return compactParts([asset.category, asset.ambience.atmosphere, asset.family, asset.action, asset.variant]).join('.');
  }

  if ((asset.category === 'cultivation' || asset.category === 'magic') && asset.cultivation) {
    return compactParts([asset.category, asset.cultivation.event, asset.cultivation.magnitude, asset.variant]).join('.');
  }

  if (asset.category === 'system' && asset.system) {
    return compactParts([asset.category, asset.system.event, asset.system.tone, asset.variant]).join('.');
  }

  return compactParts([asset.category, asset.family, asset.action, asset.variant]).join('.') || 'object.uncategorized.unknown';
}

export function createCueId(asset: LibraryCueAsset, existingIds: Iterable<string> = []): string {
  const base = cueIdBase(asset);
  const used = new Set(existingIds);
  let suffix = 1;
  let candidate = `${base}.${String(suffix).padStart(2, '0')}`;
  while (used.has(candidate)) {
    suffix += 1;
    candidate = `${base}.${String(suffix).padStart(2, '0')}`;
  }
  return candidate;
}

export function withCanonicalCueIdentity(
  asset: LibraryCueAsset,
  existingIds: Iterable<string> = [],
  preserveExistingId = false,
): LibraryCueAsset {
  const id = preserveExistingId && asset.id && !asset.id.startsWith('draft.')
    ? asset.id
    : createCueId(asset, existingIds);
  return {
    ...asset,
    id,
    audio: {
      ...asset.audio,
      fileName: audioFileNameForCue(id, asset.audio.mimeType),
    },
  };
}
