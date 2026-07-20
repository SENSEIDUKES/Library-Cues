export type PresetCategory = 'Atmosphere' | 'Beasts' | 'Weapons' | 'Artifacts/Relics' | 'Locations' | 'Factions/Rituals' | 'System/Fate';

export interface SoundPreset {
  name: string;
  category: PresetCategory;
  prompt: string;
  subcategory?: string;
}

export const soundPresets: SoundPreset[] = [
  // =========================================================================
  // ATMOSPHERE (Grouped by Atmospheric Categories/Subcategories)
  // =========================================================================
  
  // --- Wind ---
  { 
    name: 'Gentle Wind', 
    category: 'Atmosphere' as const, 
    subcategory: 'Wind', 
    prompt: 'High quality sound effect of a gentle wind, soft breeze whispering through dense forest leaves, serene and detailed, highly realistic ambient audio.' 
  },
  { 
    name: 'Strong Wind', 
    category: 'Atmosphere' as const, 
    subcategory: 'Wind', 
    prompt: 'High quality sound effect of strong wind, heavy howling gusts sweeping across wide open fields, dynamic and detailed, realistic game ambience.' 
  },
  { 
    name: 'Mountain Wind', 
    category: 'Atmosphere' as const, 
    subcategory: 'Wind', 
    prompt: 'High quality sound effect of freezing mountain wind, desolate high-altitude howling gusts echoing off sharp rocky peaks, clear and realistic.' 
  },

  // --- Crowd ---
  { 
    name: 'Crowd Chatter', 
    category: 'Atmosphere' as const, 
    subcategory: 'Crowd', 
    prompt: 'High quality sound effect of pleasant crowd chatter, a murmur of distinct human voices, laughter, and background whispers in a bustling tavern or hall.' 
  },
  { 
    name: 'Crowd Roar', 
    category: 'Atmosphere' as const, 
    subcategory: 'Crowd', 
    prompt: 'High quality sound effect of a massive crowd roar, thunderous collective cheering and clapping from a packed stadium, highly realistic and immersive.' 
  },
  { 
    name: 'Festival Crowd', 
    category: 'Atmosphere' as const, 
    subcategory: 'Crowd', 
    prompt: 'High quality sound effect of a lively festival crowd, joyful celebration chatter, street music, laughing, and busy marketplace atmosphere.' 
  },
  { 
    name: 'Quiet Crowd', 
    category: 'Atmosphere' as const, 
    subcategory: 'Crowd', 
    prompt: 'High quality sound effect of a quiet crowd, silent tension, soft shifting, low and rare whispers, suspenseful and clear ambient audio.' 
  },

  // --- Waves ---
  { 
    name: 'Gentle Waves', 
    category: 'Atmosphere' as const, 
    subcategory: 'Waves', 
    prompt: 'High quality sound effect of gentle waves, soft oceanic water lapping rhythmically onto a clean sandy beach, peaceful and detailed.' 
  },
  { 
    name: 'Strong Waves', 
    category: 'Atmosphere' as const, 
    subcategory: 'Waves', 
    prompt: 'High quality sound effect of strong waves, powerful sea swells crashing heavily against rocky shorelines and coastal cliffs, clear and dramatic.' 
  },
  { 
    name: 'Stormy Sea', 
    category: 'Atmosphere' as const, 
    subcategory: 'Waves', 
    prompt: 'High quality sound effect of a stormy sea, violent turbulent waves crashing amidst rain, thunder, and whistling ocean winds, chaotic and realistic.' 
  },

  // --- Rain ---
  { 
    name: 'Light Rain', 
    category: 'Atmosphere' as const, 
    subcategory: 'Rain', 
    prompt: 'High quality sound effect of light rain, soothing pitter-patter of tiny water droplets falling on plant leaves and pavement, clear and serene.' 
  },
  { 
    name: 'Heavy Rain', 
    category: 'Atmosphere' as const, 
    subcategory: 'Rain', 
    prompt: 'High quality sound effect of heavy rain, a dense continuous tropical downpour falling on fertile soil and mud, deep realistic white noise.' 
  },
  { 
    name: 'Rainstorm', 
    category: 'Atmosphere' as const, 
    subcategory: 'Rain', 
    prompt: 'High quality sound effect of a fierce rainstorm, heavy downpour with rolling thunderclaps, lightning, and intense wind gusts.' 
  },

  // --- Combat ---
  { 
    name: 'Distant Battle', 
    category: 'Atmosphere' as const, 
    subcategory: 'Combat', 
    prompt: 'High quality sound effect of a distant battle, muffled war cries, clanging steel swords, and faint horn blasts echoing far across hills and valleys.' 
  },
  { 
    name: 'Active Battlefield', 
    category: 'Atmosphere' as const, 
    subcategory: 'Combat', 
    prompt: 'High quality sound effect of an active battlefield, chaotic clashing swords, warrior shouts, whistling arrows, shields splintering, and general mayhem.' 
  },
  { 
    name: 'Intense Combat', 
    category: 'Atmosphere' as const, 
    subcategory: 'Combat', 
    prompt: 'High quality sound effect of intense hand-to-hand combat, heavy weapon slashes, grunting combatants, and metal armor clashing in proximity.' 
  },

  // --- Noise ---
  { 
    name: 'Machinery Hum', 
    category: 'Atmosphere' as const, 
    subcategory: 'Noise', 
    prompt: 'High quality sound effect of a steady machinery hum, low-frequency electrical vibration, mechanical drone of a high-tech factory or industrial room.' 
  },
  { 
    name: 'Forest bug and bird ambience', 
    category: 'Atmosphere' as const, 
    subcategory: 'Noise', 
    prompt: 'High quality sound effect of forest bug and bird ambience, chirping cicadas, calling wild birds, and rustling tree canopies under light wind.' 
  },
  { 
    name: 'Snowy Tundra', 
    category: 'Atmosphere' as const, 
    subcategory: 'Noise', 
    prompt: 'High quality sound effect of a freezing snowy tundra, desolate wind whistling through ice fields, distant ice cracks, chilling atmospheric noise.' 
  },
  { 
    name: 'Cosmic Deep Space Drone', 
    category: 'Atmosphere' as const, 
    subcategory: 'Noise', 
    prompt: 'High quality sound effect of a cosmic deep space drone, abstract cinematic synthesizer rumble, stellar low-frequency background noise.' 
  },
  { 
    name: 'Mystical Whispering Cave', 
    category: 'Atmosphere' as const, 
    subcategory: 'Noise', 
    prompt: 'High quality sound effect of a mystical whispering cave, echoing moisture droplets, faint ancient wind murmurs, eerie cavern ambience.' 
  },

  // =========================================================================
  // BEASTS
  // =========================================================================
  { name: 'Small Beast Call', category: 'Beasts' as const, prompt: 'High quality sound effect of small beast call, clear and detailed, realistic fantasy game audio.' },
  { name: 'Medium Beast Call', category: 'Beasts' as const, prompt: 'High quality sound effect of medium beast call, clear and detailed, realistic fantasy game audio.' },
  { name: 'Small Beast Hiss', category: 'Beasts' as const, prompt: 'High quality sound effect of small beast hiss, clear and detailed, realistic fantasy game audio.' },
  { name: 'Small Serpent Hiss', category: 'Beasts' as const, prompt: 'High quality sound effect of small serpent hiss, clear and detailed, realistic fantasy game audio.' },
  { name: 'Medium Serpent Hiss', category: 'Beasts' as const, prompt: 'High quality sound effect of medium serpent hiss, clear and detailed, realistic fantasy game audio.' },
  { name: 'Giant Serpent Hiss', category: 'Beasts' as const, prompt: 'High quality sound effect of giant serpent hiss, clear and detailed, realistic fantasy game audio.' },
  { name: 'Small Beast Howl', category: 'Beasts' as const, prompt: 'High quality sound effect of small beast howl, clear and detailed, realistic fantasy game audio.' },
  { name: 'Medium Beast Howl', category: 'Beasts' as const, prompt: 'High quality sound effect of medium beast howl, clear and detailed, realistic fantasy game audio.' },
  { name: 'Giant Beast Howl', category: 'Beasts' as const, prompt: 'High quality sound effect of giant beast howl, clear and detailed, realistic fantasy game audio.' },
  { name: 'Small Beast Roar', category: 'Beasts' as const, prompt: 'High quality sound effect of small beast roar, clear and detailed, realistic fantasy game audio.' },
  { name: 'Medium Beast Roar', category: 'Beasts' as const, prompt: 'High quality sound effect of medium beast roar, clear and detailed, realistic fantasy game audio.' },
  { name: 'Giant Beast Roar', category: 'Beasts' as const, prompt: 'High quality sound effect of giant beast roar, clear and detailed, realistic fantasy game audio.' },

  // =========================================================================
  // WEAPONS
  // =========================================================================
  { name: 'Sword Impact', category: 'Weapons' as const, prompt: 'High quality sound effect of sword impact, clear and detailed, realistic fantasy game audio.' },
  { name: 'Heavy Weapon Impact', category: 'Weapons' as const, prompt: 'High quality sound effect of heavy weapon impact, clear and detailed, realistic fantasy game audio.' },
  { name: 'Sword Swing', category: 'Weapons' as const, prompt: 'High quality sound effect of sword swing, clear and detailed, realistic fantasy game audio.' },
  { name: 'Heavy Weapon Swing', category: 'Weapons' as const, prompt: 'High quality sound effect of heavy weapon swing, clear and detailed, realistic fantasy game audio.' },
  { name: 'Sword Unsheathe', category: 'Weapons' as const, prompt: 'High quality sound effect of sword unsheathe, clear and detailed, realistic fantasy game audio.' },
  { name: 'Heavy Blade Unsheathe', category: 'Weapons' as const, prompt: 'High quality sound effect of heavy blade unsheathe, clear and detailed, realistic fantasy game audio.' },
  { name: 'Bow Shot', category: 'Weapons' as const, prompt: 'High quality sound effect of bow shot, clear and detailed, realistic fantasy game audio.' },
  { name: 'Magical Projectile', category: 'Weapons' as const, prompt: 'High quality sound effect of magical projectile, clear and detailed, realistic fantasy game audio.' },
  { name: 'Spell Cast', category: 'Weapons' as const, prompt: 'High quality sound effect of spell cast, clear and detailed, realistic fantasy game audio.' },
  { name: 'Spell Impact', category: 'Weapons' as const, prompt: 'High quality sound effect of spell impact, clear and detailed, realistic fantasy game audio.' },

  // =========================================================================
  // ARTIFACTS/RELICS
  // =========================================================================
  { name: 'Artifact Activation', category: 'Artifacts/Relics' as const, prompt: 'High quality sound effect of artifact activation, clear and detailed, realistic fantasy game audio.' },
  { name: 'Artifact Broken', category: 'Artifacts/Relics' as const, prompt: 'High quality sound effect of artifact broken, clear and detailed, realistic fantasy game audio.' },
  { name: 'Artifact Lost', category: 'Artifacts/Relics' as const, prompt: 'High quality sound effect of artifact lost, clear and detailed, realistic fantasy game audio.' },
  { name: 'Artifact Upgrade', category: 'Artifacts/Relics' as const, prompt: 'High quality sound effect of artifact upgrade, clear and detailed, realistic fantasy game audio.' },
  { name: 'Relic Pulse', category: 'Artifacts/Relics' as const, prompt: 'High quality sound effect of relic pulse, clear and detailed, realistic fantasy game audio.' },
  { name: 'Relic Resonance', category: 'Artifacts/Relics' as const, prompt: 'High quality sound effect of relic resonance, clear and detailed, realistic fantasy game audio.' },
  { name: 'Relic Awakening', category: 'Artifacts/Relics' as const, prompt: 'High quality sound effect of relic awakening, clear and detailed, realistic fantasy game audio.' },
  { name: 'Relic Manifestation', category: 'Artifacts/Relics' as const, prompt: 'High quality sound effect of relic manifestation, clear and detailed, realistic fantasy game audio.' },

  // =========================================================================
  // LOCATIONS
  // =========================================================================
  { name: 'Location Atmosphere', category: 'Locations' as const, prompt: 'High quality sound effect of location atmosphere, clear and detailed, realistic fantasy game audio.' },
  { name: 'Location Signature', category: 'Locations' as const, prompt: 'High quality sound effect of location signature, clear and detailed, realistic fantasy game audio.' },
  { name: 'Crowd Cheer', category: 'Locations' as const, prompt: 'High quality sound effect of crowd cheer, clear and detailed, realistic fantasy game audio.' },
  { name: 'Crowd Chant', category: 'Locations' as const, prompt: 'High quality sound effect of crowd chant, clear and detailed, realistic fantasy game audio.' },
  { name: 'Crowd Gasp', category: 'Locations' as const, prompt: 'High quality sound effect of crowd gasp, clear and detailed, realistic fantasy game audio.' },
  { name: 'Crowd Panic', category: 'Locations' as const, prompt: 'High quality sound effect of crowd panic, clear and detailed, realistic fantasy game audio.' },
  { name: 'Crowd Reverence', category: 'Locations' as const, prompt: 'High quality sound effect of crowd reverence, clear and detailed, realistic fantasy game audio.' },

  // =========================================================================
  // FACTIONS/RITUALS
  // =========================================================================
  { name: 'Faction Bell', category: 'Factions/Rituals' as const, prompt: 'High quality sound effect of faction bell, clear and detailed, realistic fantasy game audio.' },
  { name: 'Faction Ceremony', category: 'Factions/Rituals' as const, prompt: 'High quality sound effect of faction ceremony, clear and detailed, realistic fantasy game audio.' },
  { name: 'Faction Chant', category: 'Factions/Rituals' as const, prompt: 'High quality sound effect of faction chant, clear and detailed, realistic fantasy game audio.' },
  { name: 'Faction Horn', category: 'Factions/Rituals' as const, prompt: 'High quality sound effect of faction horn, clear and detailed, realistic fantasy game audio.' },
  { name: 'Faction Signature', category: 'Factions/Rituals' as const, prompt: 'High quality sound effect of faction signature, clear and detailed, realistic fantasy game audio.' },
  { name: 'Ritual Chant', category: 'Factions/Rituals' as const, prompt: 'High quality sound effect of ritual chant, clear and detailed, realistic fantasy game audio.' },
  { name: 'War Chant', category: 'Factions/Rituals' as const, prompt: 'High quality sound effect of war chant, clear and detailed, realistic fantasy game audio.' },
  { name: 'Sect Warning Bell', category: 'Factions/Rituals' as const, prompt: 'High quality sound effect of sect warning bell, clear and detailed, realistic fantasy game audio.' },

  // =========================================================================
  // SYSTEM/FATE
  // =========================================================================
  { 
    name: 'Soft Open', 
    category: 'System/Fate' as const, 
    subcategory: 'Open / Reveal', 
    prompt: 'premium sci-fi fantasy UI sound, high definition, holographic, crystalline, subtle, clean, short, no arcade bleeps, no retro 8-bit. Soft organic open sweep, gentle crystal chime, elegant sliding panel reveal transition.' 
  },
  { 
    name: 'Holographic Reveal', 
    category: 'System/Fate' as const, 
    subcategory: 'Open / Reveal', 
    prompt: 'premium sci-fi fantasy UI sound, high definition, holographic, crystalline, subtle, clean, short, no arcade bleeps, no retro 8-bit. Shimmering high-tech blue hologram interface activation, soft digital sweep, sophisticated menu layout initialization.' 
  },
  { 
    name: 'Dramatic Reveal', 
    category: 'System/Fate' as const, 
    subcategory: 'Open / Reveal', 
    prompt: 'premium sci-fi fantasy UI sound, high definition, holographic, crystalline, subtle, clean, short, no arcade bleeps, no retro 8-bit. Deep resonant bass swell rising to a dramatic pristine shimmering crystal flourish, epic celestial system notification.' 
  },
  { 
    name: 'Soft Close', 
    category: 'System/Fate' as const, 
    subcategory: 'Close / Dismiss', 
    prompt: 'premium sci-fi fantasy UI sound, high definition, holographic, crystalline, subtle, clean, short, no arcade bleeps, no retro 8-bit. Soft organic closing sweep, gentle crystal chime fade-out, elegant menu collapse transition.' 
  },
  { 
    name: 'Energy Collapse', 
    category: 'System/Fate' as const, 
    subcategory: 'Close / Dismiss', 
    prompt: 'premium sci-fi fantasy UI sound, high definition, holographic, crystalline, subtle, clean, short, no arcade bleeps, no retro 8-bit. Energy discharge collapse, smooth low-frequency digital implosion, futuristic window dismissal.' 
  },
  { 
    name: 'Digital Fade', 
    category: 'System/Fate' as const, 
    subcategory: 'Close / Dismiss', 
    prompt: 'premium sci-fi fantasy UI sound, high definition, holographic, crystalline, subtle, clean, short, no arcade bleeps, no retro 8-bit. Ultra-minimalist digital fade-out tone, high-frequency crystal decrescendo, elegant clean closure sweep.' 
  },
  { 
    name: 'Selection Confirmed', 
    category: 'System/Fate' as const, 
    subcategory: 'Confirm / Success', 
    prompt: 'premium sci-fi fantasy UI sound, high definition, holographic, crystalline, subtle, clean, short, no arcade bleeps, no retro 8-bit. Soft positive select chime, crisp double-resonance crystal confirmation click, pristine feedback.' 
  },
  { 
    name: 'Action Accepted', 
    category: 'System/Fate' as const, 
    subcategory: 'Confirm / Success', 
    prompt: 'premium sci-fi fantasy UI sound, high definition, holographic, crystalline, subtle, clean, short, no arcade bleeps, no retro 8-bit. Satisfying double-pulse crystalline feedback, clean action accepted notification, high-end design.' 
  },
  { 
    name: 'Reward Confirmed', 
    category: 'System/Fate' as const, 
    subcategory: 'Confirm / Success', 
    prompt: 'premium sci-fi fantasy UI sound, high definition, holographic, crystalline, subtle, clean, short, no arcade bleeps, no retro 8-bit. Uplifting shimmering melodic chime, sparkling celestial crystal reward fanfare, premium feedback.' 
  },
  { 
    name: 'Warning', 
    category: 'System/Fate' as const, 
    subcategory: 'Alert / Failure', 
    prompt: 'premium sci-fi fantasy UI sound, high definition, holographic, crystalline, subtle, clean, short, no arcade bleeps, no retro 8-bit. Soft warning sound, warm low-frequency pulse, elegant caution tone, ambient system notification.' 
  },
  { 
    name: 'Denied', 
    category: 'System/Fate' as const, 
    subcategory: 'Alert / Failure', 
    prompt: 'premium sci-fi fantasy UI sound, high definition, holographic, crystalline, subtle, clean, short, no arcade bleeps, no retro 8-bit. Refusal tone, soft double-pulse negative resonance, clean modern alert signal.' 
  },
  { 
    name: 'Critical Error', 
    category: 'System/Fate' as const, 
    subcategory: 'Alert / Failure', 
    prompt: 'premium sci-fi fantasy UI sound, high definition, holographic, crystalline, subtle, clean, short, no arcade bleeps, no retro 8-bit. Deep resonant alarm, low-frequency synthetic sweep, clean alert, high priority warning.' 
  }
];
