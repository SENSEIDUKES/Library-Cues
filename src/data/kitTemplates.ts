import { PresetCategory } from '../presets';

export interface KitTemplate {
  id: string;
  name: string;
  description: string;
  category: PresetCategory;
  iconName: 'Zap' | 'MousePointer' | 'Sparkles' | 'Flame' | 'Radio' | 'Sword' | 'Cpu' | 'Compass';
  tags: string[];
  suggestedPrompts?: string[];
}

export const KIT_TEMPLATES: KitTemplate[] = [
  {
    id: 'scifi-lasers',
    name: 'Sci-Fi Lasers',
    description: 'Futuristic laser blasters, plasma cannons, energy shields, and beam discharges.',
    category: 'Weapons',
    iconName: 'Zap',
    tags: ['laser', 'plasma', 'blaster', 'beam', 'energy', 'scifi'],
    suggestedPrompts: [
      'High quality sound effect of a heavy plasma blaster shot, futuristic laser energy beam discharge',
      'High quality sound effect of sci-fi laser recharge, energy charging pulse with crisp high frequency chime',
      'High quality sound effect of sci-fi laser deflection against energy shield'
    ]
  },
  {
    id: 'ui-clicks',
    name: 'UI Clicks',
    description: 'Clean modern UI clicks, glass button taps, toggle switches, and subtle confirmation chimes.',
    category: 'System/Fate',
    iconName: 'MousePointer',
    tags: ['ui', 'click', 'confirm', 'toggle', 'chime', 'button', 'select'],
    suggestedPrompts: [
      'premium sci-fi fantasy UI sound, high definition, soft positive select chime, crisp double-resonance crystal confirmation click',
      'premium sci-fi fantasy UI sound, clean minimal button hover tick, subtle organic glass tap',
      'premium sci-fi fantasy UI sound, smooth toggle switch flip with soft metallic resonance'
    ]
  },
  {
    id: 'fantasy-spells',
    name: 'Fantasy Spells',
    description: 'Arcane spell casting, elemental fire/ice explosions, enchanted relic pulse, and divine magic.',
    category: 'Weapons',
    iconName: 'Sparkles',
    tags: ['magic', 'spell', 'arcane', 'relic', 'divine', 'enchant'],
    suggestedPrompts: [
      'High quality sound effect of arcane spell cast, shimmering magic projectile launching through air',
      'High quality sound effect of elemental spell impact, divine crystal explosion',
      'High quality sound effect of relic awakening, magical aura pulsing with ethereal shimmer'
    ]
  },
  {
    id: 'beast-monster',
    name: 'Beast & Monster SFX',
    description: 'Guttural creature roars, giant serpent hisses, mythic dragon bellows, and spirit vocalizations.',
    category: 'Beasts',
    iconName: 'Flame',
    tags: ['beast', 'roar', 'growl', 'serpent', 'dragon', 'creature'],
    suggestedPrompts: [
      'High quality sound effect of giant beast roar, thunderous guttural echo, realistic fantasy game audio',
      'High quality sound effect of giant serpent hiss, deep resonance',
      'High quality sound effect of a legendary celestial dragon roar, booming divine roar echoing across mountain crests'
    ]
  },
  {
    id: 'atmospheric-ambience',
    name: 'Atmospheric Ambience',
    description: 'Serene forest breeze, heavy rainstorms, coastal waves, and eerie cavern drones.',
    category: 'Atmosphere',
    iconName: 'Compass',
    tags: ['wind', 'rain', 'waves', 'ambience', 'drone', 'nature'],
    suggestedPrompts: [
      'High quality sound effect of gentle wind whispering through dense forest leaves, serene ambient audio',
      'High quality sound effect of heavy tropical downpour with distant rolling thunder',
      'High quality sound effect of mystical whispering cave, echoing moisture droplets and ancient wind'
    ]
  },
  {
    id: 'cyberpunk-interface',
    name: 'Cyberpunk Interface',
    description: 'Holographic reveals, high-tech terminal blips, digital matrix fades, and cyber pulses.',
    category: 'System/Fate',
    iconName: 'Cpu',
    tags: ['hologram', 'cyber', 'terminal', 'digital', 'tech', 'matrix'],
    suggestedPrompts: [
      'premium sci-fi fantasy UI sound, shimmering high-tech blue hologram interface activation',
      'premium sci-fi fantasy UI sound, energy discharge collapse, smooth low-frequency digital implosion',
      'premium sci-fi fantasy UI sound, ultra-minimalist digital fade-out tone, high-frequency crystal decrescendo'
    ]
  },
  {
    id: 'medieval-combat',
    name: 'Medieval Combat',
    description: 'Steel blade unsheathes, heavy sword impacts, shield clashing, and bowstring releases.',
    category: 'Weapons',
    iconName: 'Sword',
    tags: ['sword', 'steel', 'blade', 'impact', 'bow', 'combat'],
    suggestedPrompts: [
      'High quality sound effect of heavy blade unsheathe, crisp steel friction',
      'High quality sound effect of sword impact against iron armor, realistic clashing steel',
      'High quality sound effect of bow shot, heavy wooden bowstring release and whistling arrow flight'
    ]
  },
  {
    id: 'retro-arcade',
    name: 'Retro Arcade SFX',
    description: 'Vintage 8-bit power-up chimes, retro jump blips, arcade coin drops, and victory fanfare.',
    category: 'System/Fate',
    iconName: 'Radio',
    tags: ['retro', 'arcade', '8bit', 'coin', 'blip', 'powerup'],
    suggestedPrompts: [
      'High quality sound effect of retro 8-bit power up chime, cheerful vintage video game audio',
      'High quality sound effect of arcade jump blip, classic nostalgic coin collect sound',
      'High quality sound effect of retro game over sequence, descending 8-bit synth tones'
    ]
  }
];
