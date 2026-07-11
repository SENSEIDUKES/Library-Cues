import type { CueCategory } from '../../types/cues';

export const CUE_CATEGORIES = [
  'ambience',
  'weather',
  'movement',
  'combat',
  'beast',
  'cultivation',
  'magic',
  'object',
  'system',
  'transition',
  'human',
] as const satisfies readonly CueCategory[];

export const PLAYBACK_TYPES = ['one-shot', 'loop', 'sequence', 'stinger'] as const;
export const CURATION_STATUSES = ['candidate', 'approved', 'deprecated'] as const;

export const BEAST_SIZES = [
  { value: 'tiny', label: 'Small (tiny)' },
  { value: 'human-sized', label: 'Medium (human-sized)' },
  { value: 'giant', label: 'Large (giant)' },
  { value: 'world-scale', label: 'Colossal (world-scale)' },
] as const;
export const BEAST_BODY_TYPES = ['insect', 'serpent', 'bird', 'mammal', 'spirit', 'undead', 'dragon', 'cosmic'] as const;
export const BEAST_ELEMENTS = ['lightning', 'fire', 'ice', 'void', 'blood', 'wind', 'poison', 'none'] as const;
export const BEAST_MOVEMENTS = ['crawling', 'flying', 'burrowing', 'teleporting', 'stomping', 'none'] as const;
export const BEAST_INTELLIGENCES = ['animal', 'cunning', 'ancient', 'divine'] as const;
export const BEAST_THREAT_TIERS = ['common', 'elite', 'boss', 'calamity', 'mythic'] as const;
export const BEAST_SIGNATURE_SOUNDS = ['screech', 'roar', 'chitter', 'hum', 'pulse', 'chant', 'silence'] as const;
export const BEAST_EVENT_TYPES = ['reveal', 'power-up', 'technique', 'injury', 'turning-point', 'death', 'breakthrough'] as const;
export const BEAST_DISTANCES = ['very-distant', 'distant', 'mid', 'close'] as const;
export const BEAST_VOCAL_STATES = ['curious', 'warning', 'aggressive', 'attacking', 'injured', 'dying', 'summoning'] as const;

export const MOVEMENT_TYPES = ['walk', 'run', 'sprint', 'stalk', 'drag', 'crawl', 'land', 'jump', 'dash', 'fly', 'charge'] as const;
export const SURFACES = ['dirt', 'gravel', 'grass', 'leaves', 'wood', 'stone', 'snow', 'water', 'sand', 'metal'] as const;
export const WEIGHTS = ['light', 'medium', 'heavy', 'massive'] as const;
export const PACES = ['slow', 'normal', 'fast'] as const;
export const ARMOR_TYPES = ['none', 'light', 'heavy'] as const;
export const ENTITY_TYPES = ['human', 'beast', 'mounted', 'unknown'] as const;

export const COMBAT_EVENTS = ['draw', 'sheathe', 'swing', 'clash', 'block', 'parry', 'impact', 'pierce', 'break', 'miss', 'projectile', 'explosion'] as const;
export const WEAPONS = ['sword', 'saber', 'spear', 'axe', 'bow', 'fist', 'kick', 'shield', 'generic'] as const;
export const MATERIALS = ['flesh', 'cloth', 'wood', 'stone', 'metal', 'energy'] as const;
export const FORCES = ['light', 'medium', 'heavy', 'catastrophic'] as const;
export const SPEEDS = ['slow', 'normal', 'fast', 'instant'] as const;
export const PERSPECTIVES = ['close', 'mid', 'distant'] as const;

export const ATMOSPHERES = ['wind', 'rain', 'ocean', 'crowd', 'combat', 'forest', 'cave', 'river', 'fire', 'swamp', 'desert', 'temple', 'dungeon', 'village', 'city'] as const;
export const TIMES_OF_DAY = ['dawn', 'morning', 'day', 'dusk', 'night'] as const;
export const WEATHER_TYPES = ['clear', 'rain', 'storm', 'snow', 'wind', 'fog', 'sandstorm'] as const;
export const DENSITIES = ['minimal', 'light', 'moderate', 'dense'] as const;

export const CULTIVATION_EVENTS = ['qi-gathering', 'qi-circulation', 'aura-activation', 'technique-charge', 'technique-release', 'breakthrough', 'failed-breakthrough', 'tribulation', 'realm-pressure', 'spiritual-awakening'] as const;
export const DIRECTIONS = ['rise', 'fall', 'expand', 'collapse', 'pulse'] as const;
export const CULTIVATION_MAGNITUDES = ['subtle', 'moderate', 'powerful', 'transcendent'] as const;

export const SYSTEM_EVENTS = ['status', 'skill_acquired', 'level_up', 'quest', 'appraisal', 'fate_result', 'warning', 'critical_danger', 'breakthrough', 'reward', 'corruption', 'death_event', 'system_error'] as const;
export const SYSTEM_TONES = ['neutral', 'positive', 'ominous', 'critical', 'sacred', 'corrupted'] as const;
export const RARITIES = ['common', 'rare', 'epic', 'legendary', 'mythic'] as const;
export const SYSTEM_MAGNITUDES = ['minor', 'major', 'transcendent'] as const;

export const MUSIC_MOODS = ['war', 'duel', 'serenity', 'romance', 'dread', 'mystery', 'triumph', 'tribulation', 'travel', 'tragedy', 'fighting', 'adventure', 'ambient', 'boss-fight', 'tension', 'sad', 'mystical', 'excitement', 'tired', 'horror'] as const;
export const MUSIC_REGIONS = ['chinese', 'japanese', 'western'] as const;

export function labelize(value: string): string {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
