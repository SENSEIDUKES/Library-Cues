import type {
  BeastCueProfile,
  LibraryCueAsset,
  StoredCueRecord,
  ValidationIssue,
  ValidationResult,
} from '../types/cues';
import { hasMatchingAudioExtension, isSupportedAudioMimeType } from './mime';

const CATEGORIES = new Set(['ambience', 'weather', 'movement', 'combat', 'beast', 'cultivation', 'magic', 'object', 'system', 'transition', 'human']);
const PLAYBACK_TYPES = new Set(['one-shot', 'loop', 'sequence', 'stinger']);
const CURATION_STATUSES = new Set(['candidate', 'approved', 'deprecated']);
const BEAST_VALUES = {
  sizes: new Set(['tiny', 'human-sized', 'giant', 'world-scale']),
  bodyTypes: new Set(['insect', 'serpent', 'bird', 'mammal', 'spirit', 'undead', 'dragon', 'cosmic']),
  elements: new Set(['lightning', 'fire', 'ice', 'void', 'blood', 'wind', 'poison', 'none']),
  movements: new Set(['crawling', 'flying', 'burrowing', 'teleporting', 'stomping', 'none']),
  intelligences: new Set(['animal', 'cunning', 'ancient', 'divine']),
  threatTiers: new Set(['common', 'elite', 'boss', 'calamity', 'mythic']),
  signatureSounds: new Set(['screech', 'roar', 'chitter', 'hum', 'pulse', 'chant', 'silence']),
  eventTypes: new Set(['reveal', 'power-up', 'technique', 'injury', 'turning-point', 'death', 'breakthrough']),
} satisfies Record<keyof Pick<BeastCueProfile, 'sizes' | 'bodyTypes' | 'elements' | 'movements' | 'intelligences' | 'threatTiers' | 'signatureSounds' | 'eventTypes'>, Set<string>>;
const BEAST_DISTANCES = new Set(['very-distant', 'distant', 'mid', 'close']);
const BEAST_VOCAL_STATES = new Set(['curious', 'warning', 'aggressive', 'attacking', 'injured', 'dying', 'summoning']);
const MOVEMENT_TYPES = new Set(['walk', 'run', 'sprint', 'stalk', 'drag', 'crawl', 'land', 'jump', 'dash', 'fly', 'charge']);
const COMBAT_EVENTS = new Set(['draw', 'sheathe', 'swing', 'clash', 'block', 'parry', 'impact', 'pierce', 'break', 'miss', 'projectile', 'explosion']);
const AMBIENCES = new Set(['wind', 'rain', 'ocean', 'crowd', 'combat', 'forest', 'cave', 'river', 'fire', 'swamp', 'desert', 'temple', 'dungeon', 'village', 'city']);
const CULTIVATION_EVENTS = new Set(['qi-gathering', 'qi-circulation', 'aura-activation', 'technique-charge', 'technique-release', 'breakthrough', 'failed-breakthrough', 'tribulation', 'realm-pressure', 'spiritual-awakening']);
const SYSTEM_EVENTS = new Set(['status', 'skill_acquired', 'level_up', 'quest', 'appraisal', 'fate_result', 'warning', 'critical_danger', 'breakthrough', 'reward', 'corruption', 'death_event', 'system_error']);
const SYSTEM_TONES = new Set(['neutral', 'positive', 'ominous', 'critical', 'sacred', 'corrupted']);
const MUSIC_MOODS = new Set(['war', 'duel', 'serenity', 'romance', 'dread', 'mystery', 'triumph', 'tribulation', 'travel', 'tragedy', 'fighting', 'adventure', 'ambient', 'boss-fight', 'tension', 'sad', 'mystical', 'excitement', 'tired', 'horror']);
const MUSIC_REGIONS = new Set(['chinese', 'japanese', 'western']);

const issue = (issues: ValidationIssue[], path: string, code: string, message: string) => {
  issues.push({ path, code, message });
};

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const validateUnitValue = (issues: ValidationIssue[], path: string, value: unknown) => {
  if (!isFiniteNumber(value) || value < 0 || value > 1) {
    issue(issues, path, 'out_of_range', 'Must be a finite number from 0 to 1.');
  }
};

const validateRange = (issues: ValidationIssue[], path: string, range: unknown) => {
  if (typeof range !== 'object' || range === null || !('min' in range) || !('max' in range)) {
    issue(issues, path, 'invalid_range', 'Must provide both min and max.');
    return;
  }
  const { min, max } = range as { min: unknown; max: unknown };
  validateUnitValue(issues, `${path}.min`, min);
  validateUnitValue(issues, `${path}.max`, max);
  if (isFiniteNumber(min) && isFiniteNumber(max) && min > max) {
    issue(issues, path, 'inverted_range', 'Minimum must not exceed maximum.');
  }
};

const validateStringArray = (issues: ValidationIssue[], path: string, values: unknown) => {
  if (!Array.isArray(values) || values.some((value) => typeof value !== 'string' || !value.trim())) {
    issue(issues, path, 'invalid_string_list', 'Must contain only non-empty strings.');
  }
};

const validateCanonicalArray = (
  issues: ValidationIssue[],
  path: string,
  values: unknown,
  allowed: Set<string>,
) => {
  if (!Array.isArray(values) || values.some((value) => typeof value !== 'string' || !allowed.has(value))) {
    issue(issues, path, 'non_canonical_value', 'Contains a value outside the canonical Light-Novels vocabulary.');
  }
};

function validateBeast(issues: ValidationIssue[], profile: LibraryCueAsset['beast']) {
  if (!profile) {
    issue(issues, 'beast', 'required_profile', 'Beast cues require beast matching metadata.');
    return;
  }

  let selectorCount = 0;
  (Object.keys(BEAST_VALUES) as Array<keyof typeof BEAST_VALUES>).forEach((field) => {
    const values = profile[field];
    if (values !== undefined) {
      validateCanonicalArray(issues, `beast.${field}`, values, BEAST_VALUES[field]);
      selectorCount += values.length;
    }
  });
  if (profile.distance !== undefined) {
    selectorCount += 1;
    if (!BEAST_DISTANCES.has(profile.distance)) issue(issues, 'beast.distance', 'non_canonical_value', 'Invalid distance.');
  }
  if (profile.vocalState !== undefined) {
    selectorCount += 1;
    if (!BEAST_VOCAL_STATES.has(profile.vocalState)) issue(issues, 'beast.vocalState', 'non_canonical_value', 'Invalid vocal state.');
  }
  if (profile.scaleWeight !== undefined && (!isFiniteNumber(profile.scaleWeight) || profile.scaleWeight < 0)) {
    issue(issues, 'beast.scaleWeight', 'out_of_range', 'Scale weight must be a non-negative number.');
  }
  if (selectorCount === 0) issue(issues, 'beast', 'missing_selector', 'Choose at least one beast matching value.');
}

export function validateCueAsset(asset: LibraryCueAsset): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!asset.id?.trim()) issue(issues, 'id', 'required', 'Cue ID is required.');
  if (!Number.isInteger(asset.version) || asset.version < 1) issue(issues, 'version', 'invalid_version', 'Version must be a positive integer.');
  if (!asset.displayName?.trim()) issue(issues, 'displayName', 'required', 'Display name is required.');
  if (!CATEGORIES.has(asset.category)) issue(issues, 'category', 'invalid_category', 'Choose a supported category.');
  if (!asset.family?.trim()) issue(issues, 'family', 'required', 'Family is required.');
  if (!asset.action?.trim()) issue(issues, 'action', 'required', 'Action is required.');

  if (!asset.audio || !asset.audio.fileName?.trim()) {
    issue(issues, 'audio.fileName', 'required', 'Audio filename is required.');
  }
  if (!asset.audio || !isSupportedAudioMimeType(asset.audio.mimeType)) {
    issue(issues, 'audio.mimeType', 'unsupported_mime', 'Only MP3, WAV, and OGG are supported.');
  } else if (asset.audio.fileName && !hasMatchingAudioExtension(asset.audio.fileName, asset.audio.mimeType)) {
    issue(issues, 'audio.fileName', 'extension_mismatch', 'Filename extension must match the MIME type.');
  }
  if (!isFiniteNumber(asset.audio?.durationMs) || asset.audio.durationMs <= 0) {
    issue(issues, 'audio.durationMs', 'invalid_duration', 'Duration must be greater than zero.');
  }
  if (asset.audio?.fileSizeBytes !== undefined && (!isFiniteNumber(asset.audio.fileSizeBytes) || asset.audio.fileSizeBytes < 0)) {
    issue(issues, 'audio.fileSizeBytes', 'invalid_file_size', 'File size must be non-negative.');
  }

  if (!asset.playback || !PLAYBACK_TYPES.has(asset.playback.type)) {
    issue(issues, 'playback.type', 'invalid_playback_type', 'Choose a supported playback type.');
  }
  if (typeof asset.playback?.loopable !== 'boolean') issue(issues, 'playback.loopable', 'required', 'Loopable must be true or false.');
  validateUnitValue(issues, 'playback.defaultVolume', asset.playback?.defaultVolume);
  if (asset.playback?.maxVolume !== undefined) validateUnitValue(issues, 'playback.maxVolume', asset.playback.maxVolume);

  if (!asset.narrative) {
    issue(issues, 'narrative', 'required', 'Narrative matching metadata is required.');
  } else {
    validateStringArray(issues, 'narrative.tags', asset.narrative.tags);
    (['sceneTypes', 'environments', 'motions', 'emotions', 'elements', 'signatures'] as const).forEach((field) => {
      if (asset.narrative[field] !== undefined) validateStringArray(issues, `narrative.${field}`, asset.narrative[field]);
    });
    if (asset.narrative.musicMoods !== undefined) validateCanonicalArray(issues, 'narrative.musicMoods', asset.narrative.musicMoods, MUSIC_MOODS);
    if (asset.narrative.musicRegions !== undefined) validateCanonicalArray(issues, 'narrative.musicRegions', asset.narrative.musicRegions, MUSIC_REGIONS);
    (['intensityRange', 'tensionRange', 'dangerRange', 'mysticismRange', 'powerShiftRange'] as const).forEach((field) => {
      if (asset.narrative[field] !== undefined) validateRange(issues, `narrative.${field}`, asset.narrative[field]);
    });
  }

  switch (asset.category) {
    case 'beast':
      validateBeast(issues, asset.beast);
      break;
    case 'movement':
      if (!asset.movement || !MOVEMENT_TYPES.has(asset.movement.movement)) issue(issues, 'movement.movement', 'required_profile_field', 'Movement cues require a canonical movement.');
      break;
    case 'combat':
      if (!asset.combat || !COMBAT_EVENTS.has(asset.combat.event)) issue(issues, 'combat.event', 'required_profile_field', 'Combat cues require a canonical event.');
      break;
    case 'ambience':
    case 'weather':
      if (!asset.ambience || !AMBIENCES.has(asset.ambience.atmosphere)) issue(issues, 'ambience.atmosphere', 'required_profile_field', 'Ambience and weather cues require an atmosphere.');
      if (typeof asset.ambience?.seamlessLoop !== 'boolean') issue(issues, 'ambience.seamlessLoop', 'required_profile_field', 'Seamless loop must be true or false.');
      break;
    case 'cultivation':
    case 'magic':
      if (!asset.cultivation || !CULTIVATION_EVENTS.has(asset.cultivation.event)) issue(issues, 'cultivation.event', 'required_profile_field', 'Cultivation and magic cues require an event.');
      break;
    case 'system':
      if (!asset.system || !SYSTEM_EVENTS.has(asset.system.event)) issue(issues, 'system.event', 'required_profile_field', 'System cues require a Light-Novels system event.');
      if (!asset.system || !SYSTEM_TONES.has(asset.system.tone)) issue(issues, 'system.tone', 'required_profile_field', 'System cues require a tone.');
      break;
  }

  if (!asset.source || !['elevenlabs', 'recorded', 'licensed', 'synthetic'].includes(asset.source.provider)) {
    issue(issues, 'source.provider', 'invalid_provider', 'Choose a supported source provider.');
  }
  if (!asset.curation || !CURATION_STATUSES.has(asset.curation.status)) {
    issue(issues, 'curation.status', 'invalid_status', 'Choose a supported curation status.');
  }
  if (asset.curation?.rating !== undefined && (!isFiniteNumber(asset.curation.rating) || asset.curation.rating < 1 || asset.curation.rating > 5)) {
    issue(issues, 'curation.rating', 'out_of_range', 'Rating must be between 1 and 5.');
  }
  if (asset.curation?.approvedAt !== undefined && Number.isNaN(Date.parse(asset.curation.approvedAt))) issue(issues, 'curation.approvedAt', 'invalid_timestamp', 'Approval timestamp is invalid.');
  if (Number.isNaN(Date.parse(asset.createdAt))) issue(issues, 'createdAt', 'invalid_timestamp', 'Created timestamp is invalid.');
  if (Number.isNaN(Date.parse(asset.updatedAt))) issue(issues, 'updatedAt', 'invalid_timestamp', 'Updated timestamp is invalid.');

  return { valid: issues.length === 0, issues };
}

export function validateStoredCueRecord(record: StoredCueRecord): ValidationResult {
  const result = validateCueAsset(record.cue);
  const issues = [...result.issues];
  if (!record.id?.trim()) issue(issues, 'storage.id', 'required', 'Internal storage ID is required.');
  if (!record.audioBase64?.trim()) issue(issues, 'storage.audioBase64', 'required', 'Stored audio payload is required.');
  return { valid: issues.length === 0, issues };
}
