export interface NumericRange {
  min: number;
  max: number;
}

export type SupportedAudioMimeType = 'audio/mpeg' | 'audio/wav' | 'audio/ogg';

export type CueCategory =
  | 'ambience'
  | 'weather'
  | 'movement'
  | 'combat'
  | 'beast'
  | 'cultivation'
  | 'magic'
  | 'object'
  | 'system'
  | 'transition'
  | 'human';

export type BeastSize = 'tiny' | 'human-sized' | 'giant' | 'world-scale';
export type BeastBodyType = 'insect' | 'serpent' | 'bird' | 'mammal' | 'spirit' | 'undead' | 'dragon' | 'cosmic';
export type BeastElement = 'lightning' | 'fire' | 'ice' | 'void' | 'blood' | 'wind' | 'poison' | 'none';
export type BeastMovement = 'crawling' | 'flying' | 'burrowing' | 'teleporting' | 'stomping' | 'none';
export type BeastIntelligence = 'animal' | 'cunning' | 'ancient' | 'divine';
export type BeastThreatTier = 'common' | 'elite' | 'boss' | 'calamity' | 'mythic';
export type BeastSignatureSound = 'screech' | 'roar' | 'chitter' | 'hum' | 'pulse' | 'chant' | 'silence';
export type BeastEventType = 'reveal' | 'power-up' | 'technique' | 'injury' | 'turning-point' | 'death' | 'breakthrough';

export interface BeastCueProfile {
  sizes?: BeastSize[];
  bodyTypes?: BeastBodyType[];
  elements?: BeastElement[];
  movements?: BeastMovement[];
  intelligences?: BeastIntelligence[];
  threatTiers?: BeastThreatTier[];
  signatureSounds?: BeastSignatureSound[];
  eventTypes?: BeastEventType[];
  distance?: 'very-distant' | 'distant' | 'mid' | 'close';
  vocalState?: 'curious' | 'warning' | 'aggressive' | 'attacking' | 'injured' | 'dying' | 'summoning';
  scaleWeight?: number;
}

export interface MovementCueProfile {
  movement: 'walk' | 'run' | 'sprint' | 'stalk' | 'drag' | 'crawl' | 'land' | 'jump' | 'dash' | 'fly' | 'charge';
  surface?: 'dirt' | 'gravel' | 'grass' | 'leaves' | 'wood' | 'stone' | 'snow' | 'water' | 'sand' | 'metal';
  weight?: 'light' | 'medium' | 'heavy' | 'massive';
  pace?: 'slow' | 'normal' | 'fast';
  armor?: 'none' | 'light' | 'heavy';
  entityType?: 'human' | 'beast' | 'mounted' | 'unknown';
  stepCount?: number;
}

export interface CombatCueProfile {
  event: 'draw' | 'sheathe' | 'swing' | 'clash' | 'block' | 'parry' | 'impact' | 'pierce' | 'break' | 'miss' | 'projectile' | 'explosion';
  weapon?: 'sword' | 'saber' | 'spear' | 'axe' | 'bow' | 'fist' | 'kick' | 'shield' | 'generic';
  material?: Array<'flesh' | 'cloth' | 'wood' | 'stone' | 'metal' | 'energy'>;
  force?: 'light' | 'medium' | 'heavy' | 'catastrophic';
  speed?: 'slow' | 'normal' | 'fast' | 'instant';
  perspective?: 'close' | 'mid' | 'distant';
}

export interface AmbienceCueProfile {
  atmosphere: 'wind' | 'rain' | 'ocean' | 'crowd' | 'combat' | 'forest' | 'cave' | 'river' | 'fire' | 'swamp' | 'desert' | 'temple' | 'dungeon' | 'village' | 'city';
  timeOfDay?: Array<'dawn' | 'morning' | 'day' | 'dusk' | 'night'>;
  weather?: Array<'clear' | 'rain' | 'storm' | 'snow' | 'wind' | 'fog' | 'sandstorm'>;
  density?: 'minimal' | 'light' | 'moderate' | 'dense';
  interior?: boolean;
  populated?: boolean;
  seamlessLoop: boolean;
}

export interface CultivationCueProfile {
  event: 'qi-gathering' | 'qi-circulation' | 'aura-activation' | 'technique-charge' | 'technique-release' | 'breakthrough' | 'failed-breakthrough' | 'tribulation' | 'realm-pressure' | 'spiritual-awakening';
  element?: string[];
  direction?: 'rise' | 'fall' | 'expand' | 'collapse' | 'pulse';
  magnitude?: 'subtle' | 'moderate' | 'powerful' | 'transcendent';
}

/** Exact values currently emitted by Light-Novels SystemEvent.kind/promptType. */
export type LightNovelSystemEvent =
  | 'status'
  | 'skill_acquired'
  | 'level_up'
  | 'quest'
  | 'appraisal'
  | 'fate_result'
  | 'warning'
  | 'critical_danger'
  | 'breakthrough'
  | 'reward'
  | 'corruption'
  | 'death_event'
  | 'system_error';

export interface SystemCueProfile {
  event: LightNovelSystemEvent;
  tone: 'neutral' | 'positive' | 'ominous' | 'critical' | 'sacred' | 'corrupted';
  rarity?: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  magnitude?: 'minor' | 'major' | 'transcendent';
}

export type LightNovelMusicMood =
  | 'war'
  | 'duel'
  | 'serenity'
  | 'romance'
  | 'dread'
  | 'mystery'
  | 'triumph'
  | 'tribulation'
  | 'travel'
  | 'tragedy'
  | 'fighting'
  | 'adventure'
  | 'ambient'
  | 'boss-fight'
  | 'tension'
  | 'sad'
  | 'mystical'
  | 'excitement'
  | 'tired'
  | 'horror';

export type LightNovelMusicRegion = 'chinese' | 'japanese' | 'western';

export interface LibraryCueAsset {
  id: string;
  version: number;
  displayName: string;
  description?: string;

  audio: {
    fileName: string;
    url?: string;
    mimeType: SupportedAudioMimeType;
    durationMs: number;
    fileSizeBytes?: number;
  };

  category: CueCategory;
  family: string;
  action: string;
  variant?: string;

  playback: {
    type: 'one-shot' | 'loop' | 'sequence' | 'stinger';
    loopable: boolean;
    defaultVolume: number;
    maxVolume?: number;
    fadeInMs?: number;
    fadeOutMs?: number;
    cooldownMs?: number;
    maxConcurrent?: number;
    interruptPolicy?: 'allow' | 'replace-family' | 'ignore-while-playing';
    duckNarrationDb?: number;
    duckMusicDb?: number;
  };

  narrative: {
    sceneTypes?: string[];
    environments?: string[];
    motions?: string[];
    emotions?: string[];
    elements?: string[];
    intensityRange?: NumericRange;
    tensionRange?: NumericRange;
    dangerRange?: NumericRange;
    mysticismRange?: NumericRange;
    powerShiftRange?: NumericRange;
    signatures?: string[];
    musicMoods?: LightNovelMusicMood[];
    musicRegions?: LightNovelMusicRegion[];
    tags: string[];
  };

  beast?: BeastCueProfile;
  combat?: CombatCueProfile;
  movement?: MovementCueProfile;
  ambience?: AmbienceCueProfile;
  cultivation?: CultivationCueProfile;
  system?: SystemCueProfile;

  source: {
    provider: 'elevenlabs' | 'recorded' | 'licensed' | 'synthetic';
    model?: string;
    prompt?: string;
    promptInfluence?: number;
    requestedDurationSeconds?: number;
    requestedLoop?: boolean;
    generatedAt?: string;
  };

  curation: {
    status: 'candidate' | 'approved' | 'deprecated';
    rating?: number;
    notes?: string;
    approvedAt?: string;
    replacedBy?: string;
  };

  createdAt: string;
  updatedAt: string;
}

/** Browser-only persistence wrapper. None of these fields enter the manifest. */
export interface StoredCueRecord {
  /** Stable internal IndexedDB key; legacy records keep their original key. */
  id: string;
  cue: LibraryCueAsset;
  audioBase64: string;
  previousAudioBase64?: string;
  peaks?: number[];
  sampleRate?: number;
}

export interface LibraryCueManifest {
  schemaVersion: '1.0';
  generatedAt: string;
  app: 'Library Cues';
  compatibleWith: {
    app: 'Light-Novels';
    minimumSchema?: string;
  };
  cues: LibraryCueAsset[];
}

export interface ValidationIssue {
  path: string;
  code: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
