categories = {
    "Atmosphere": [
        "Ambient Noise", "Light Rain", "Heavy Rain", "Gentle Waves", "Rough Waves", "Gentle Wind", "Strong Wind"
    ],
    "Beasts": [
        "Small Beast Call", "Medium Beast Call", "Small Beast Hiss", "Small Serpent Hiss", "Medium Serpent Hiss",
        "Giant Serpent Hiss", "Small Beast Howl", "Medium Beast Howl", "Giant Beast Howl", "Small Beast Roar",
        "Medium Beast Roar", "Giant Beast Roar"
    ],
    "Weapons": [
        "Sword Impact", "Heavy Weapon Impact", "Sword Swing", "Heavy Weapon Swing", "Sword Unsheathe",
        "Heavy Blade Unsheathe", "Bow Shot", "Magical Projectile", "Spell Cast", "Spell Impact"
    ],
    "Artifacts/Relics": [
        "Artifact Activation", "Artifact Broken", "Artifact Lost", "Artifact Upgrade", "Relic Pulse",
        "Relic Resonance", "Relic Awakening", "Relic Manifestation"
    ],
    "Locations": [
        "Location Atmosphere", "Location Signature", "Crowd Cheer", "Crowd Chant", "Crowd Gasp", "Crowd Roar",
        "Crowd Panic", "Crowd Reverence"
    ],
    "Factions/Rituals": [
        "Faction Bell", "Faction Ceremony", "Faction Chant", "Faction Horn", "Faction Signature",
        "Ritual Chant", "War Chant", "Sect Warning Bell"
    ],
    "System/Fate": [
        "Manifestation Chime", "Fate Chime", "Fate Warning Chime", "Fate Shift Chime", "Discovery Chime",
        "Breakthrough Chime"
    ]
}

lines = []
lines.append("export type PresetCategory = 'Atmosphere' | 'Beasts' | 'Weapons' | 'Artifacts/Relics' | 'Locations' | 'Factions/Rituals' | 'System/Fate';\n")
lines.append("export interface SoundPreset {")
lines.append("  name: string;")
lines.append("  category: PresetCategory;")
lines.append("  prompt: string;")
lines.append("}\n")
lines.append("export const soundPresets: SoundPreset[] = [")

items = []
for cat, names in categories.items():
    for name in names:
        prompt_str = f"High quality sound effect of {name.lower()}, clear and detailed, realistic fantasy game audio."
        items.append(f"  {{ name: '{name}', category: '{cat}' as const, prompt: '{prompt_str}' }}")

lines.append(",\n".join(items))
lines.append("];")

with open("src/presets.ts", "w") as f:
    f.write("\n".join(lines) + "\n")
