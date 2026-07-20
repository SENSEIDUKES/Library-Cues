import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GenerationParams } from '../types';
import { Sparkles, Repeat, Scissors, Activity, ArrowRightFromLine, ArrowLeftToLine, Loader2 } from 'lucide-react';

interface GenerationControlsProps {
  params: GenerationParams;
  onChange: (params: GenerationParams) => void;
  onGenerate: (count: number, useCache: boolean) => void;
  isGenerating: boolean;
}

export function GenerationControls({ params, onChange, onGenerate, isGenerating }: GenerationControlsProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'Atmosphere' | 'Actions' | 'Beasts & Combat'>('Atmosphere');

  const presets = [
    // Atmosphere
    { name: 'Rain', category: 'Atmosphere' as const, prompt: 'Gentle rain tapping against a glass window, heard from inside a quiet room. Natural uneven droplets, realistic field recording, no thunder, no voices, no music, seamless ambient loop.' },
    { name: 'Location Signature', category: 'Atmosphere' as const, prompt: 'Ethereal ambient drone marking a mystical location, wind howling through ancient ruins, subtle harmonic whispers, haunting atmosphere' },
    { name: 'War Horn', category: 'Atmosphere' as const, prompt: 'Deep resonant blast of a massive war horn, booming low-mid frequency, aggressive battle call, distant mountain echo' },
    { name: 'Sect Bell', category: 'Atmosphere' as const, prompt: 'Heavy bronze temple bell tolling, rich metallic overtones, solemn spiritual resonance, long decay in an open valley' },
    { name: 'Fate Chime', category: 'Atmosphere' as const, prompt: 'Crystalline celestial chime of fate, solitary resonant bell strike, sparkling stardust tail, infinite ethereal delay' },
    { name: 'Footstep on Stone', category: 'Atmosphere' as const, prompt: 'A single firm boot step on a stone floor, close and realistic with a short natural echo, no background ambience, no music, one-shot sound effect.' },
    { name: 'Door Slam', category: 'Atmosphere' as const, prompt: 'A heavy wooden door slamming shut, strong close impact with a brief room echo, no voices, no music, one-shot sound effect.' },

    // Actions
    { name: 'Sword Swing', category: 'Actions' as const, prompt: 'Swift aerodynamic sword swoosh, sharp metallic wind cleave, high-frequency air displacement, dry close-mic recording' },
    { name: 'Sword Unsheathe', category: 'Actions' as const, prompt: 'Crisp metallic ring of a sword drawn from a scabbard, bright resonant friction, scraping metal overtone, clean stereo image' },
    { name: 'Weapon Activation', category: 'Actions' as const, prompt: 'High-tech weapon powering up, ascending electronic hum, glowing plasma crackle, synthetic bass charge, punchy energy surge' },
    { name: 'Item Manifestation', category: 'Actions' as const, prompt: 'Magical item materializing, ethereal shimmering chimes, soft vacuum implosion, glowing arcane resonance, wide stereo field' },
    { name: 'Relic Awakening', category: 'Actions' as const, prompt: 'Ancient relic powering on, deep stone grinding, resonant crystal harmonic drone, mystical pulsing energy waves' },
    { name: 'Artifact Resonance', category: 'Actions' as const, prompt: 'Otherworldly artifact vibrating, sustained eerie harmonic ring, pulsing magnetic hum, metallic singing bowl texture' },
    { name: 'Formation Activation', category: 'Actions' as const, prompt: 'Magical array formation activating, complex interwoven energy beams, geometric humming tones, crystalline power surge' },

    // Beasts & Combat
    { name: 'Small Beast Roar', category: 'Beasts & Combat' as const, prompt: 'Guttural snarling roar of a small predatory beast, sharp transient rasps, wet mouth sounds, echoing in a dense forest' },
    { name: 'Giant Beast Roar', category: 'Beasts & Combat' as const, prompt: 'Massive deafening monster roar, deep chest resonance, ground-shaking low frequency rumble, cavernous acoustic decay' },
    { name: 'Dragon Roar', category: 'Beasts & Combat' as const, prompt: 'Epic dragon bellow, piercing reptilian screech blending into a sub-bass rumble, fiery breath transients, expansive stereo width' },
    { name: 'Injured Beast Cry', category: 'Beasts & Combat' as const, prompt: 'A wounded fantasy beast giving a short strained cry, painful and animal-like, weak but still aggressive, no human speech, no music, one-shot sound effect.' },
    { name: 'Sword Clash', category: 'Beasts & Combat' as const, prompt: 'Two steel swords striking each other with a sharp metallic clash, close and forceful, brief natural ring afterward, no music, one-shot sound effect.' },
    { name: 'Rapid Sword Exchange', category: 'Beasts & Combat' as const, prompt: 'A fast series of short steel sword clashes during close combat, sharp metallic impacts with quick movement, energetic but not exaggerated, no music, short action sound effect.' },
    { name: 'Heavy Weapon Impact', category: 'Beasts & Combat' as const, prompt: 'A large metal weapon slamming into a steel blade, heavy metallic impact with a deep ringing tail, powerful and close, no music, one-shot sound effect.' },
    { name: 'Crowd Chant', category: 'Beasts & Combat' as const, prompt: 'Massive crowd chanting rhythmically in a grand arena, booming unison voices, aggressive percussive stomps, wide stadium reverb' },
    { name: 'Crowd Gasp', category: 'Beasts & Combat' as const, prompt: 'Sudden collective crowd gasp of shock, sharp inhalation of breath from hundreds of people, tense stadium acoustics' }
  ];

  const updateParam = (key: keyof GenerationParams, value: any) => {
    onChange({ ...params, [key]: value });
  };

  const handleEnhance = async () => {
    if (!params.prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: params.prompt })
      });
      if (!response.ok) {
        throw new Error('Failed to enhance prompt');
      }
      const data = await response.json();
      updateParam('prompt', data.enhancedPrompt);
    } catch (err) {
      console.error('Error enhancing prompt:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Description input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
            Sound Description
          </label>
          <span className="text-[10px] text-neutral-600 font-medium">Type simple words, then Enhance</span>
        </div>
        <div className="relative group">
          <textarea 
            value={params.prompt}
            onChange={(e) => updateParam('prompt', e.target.value)}
            placeholder="e.g. A guttural, echoing roar of a massive beast in a cave..."
            className="w-full bg-neutral-900/40 border border-white/[0.04] rounded-2xl p-4 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-white/[0.12] focus:ring-1 focus:ring-white/[0.12] resize-none h-28 transition-all duration-200 backdrop-blur-md leading-relaxed pr-12"
          />
          {params.prompt.length > 0 && (
            <button 
              onClick={() => updateParam('prompt', '')}
              className="absolute right-3 top-3 text-[10px] text-neutral-500 hover:text-neutral-300 font-mono transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Apple-styled Inspirations and AI Enhance actions */}
        <div className="flex flex-col gap-3 mt-1.5 pt-1">
          {/* Menu Tab System */}
          <div className="flex flex-col gap-3">
            <div className="flex border border-white/[0.04] p-0.5 gap-1 self-start bg-neutral-950/60 rounded-xl">
              {(['Atmosphere', 'Actions', 'Beasts & Combat'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer select-none ${
                    activeCategory === cat
                      ? 'bg-neutral-900 border border-white/[0.04] text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Filtered Preset Badges */}
            <div className="flex flex-wrap gap-1.5 items-center bg-neutral-950/30 p-2.5 rounded-xl border border-white/[0.02]">
              {presets
                .filter((p) => p.category === activeCategory)
                .map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      const durationSeconds = preset.category === 'Atmosphere' ? 30 : 3;
                      const loop = preset.category === 'Atmosphere';
                      onChange({
                        ...params,
                        prompt: preset.prompt,
                        durationSeconds,
                        loop
                      });
                    }}
                    className="text-[10px] font-medium px-2.5 py-1.5 rounded-lg bg-neutral-900/40 border border-white/[0.02] hover:border-white/[0.08] hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer select-none active:scale-95"
                  >
                    {preset.name}
                  </button>
                ))}
            </div>
          </div>

          <div className="flex justify-end pt-0.5">
            <motion.button
              type="button"
              whileHover={{ scale: params.prompt.trim() ? 1.01 : 1 }}
              whileTap={{ scale: params.prompt.trim() ? 0.99 : 1 }}
              onClick={handleEnhance}
              disabled={isEnhancing || !params.prompt.trim()}
              className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full overflow-hidden text-xs font-semibold shadow-inner border transition-all cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-30 bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white"
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />
                  <span className="text-[11px]">Expanding...</span>
                </>
              ) : (
                <>
                  {/* Premium Indigo/Cyan micro ambient glow on the AI button when active */}
                  {params.prompt.trim() && (
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600/15 via-indigo-600/15 to-cyan-600/15 animate-pulse -z-10" />
                  )}
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
                  <span className="text-[11px] font-medium tracking-tight">AI Enhance Prompt</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Duration Slider */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
            <span>Duration</span>
            <span className="text-neutral-300 font-mono">{params.durationSeconds.toFixed(1)}s</span>
          </div>
          <div className="relative flex items-center h-6">
            <input 
              type="range" 
              min="0.1" 
              max="30" 
              step="0.1"
              value={params.durationSeconds}
              onChange={(e) => updateParam('durationSeconds', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
              style={{
                background: `linear-gradient(to right, #ffffff ${((params.durationSeconds - 0.1) / 29.9) * 100}%, #262626 ${((params.durationSeconds - 0.1) / 29.9) * 100}%)`
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-neutral-600 font-mono">
            <span>0.1s</span>
            <span>30.0s</span>
          </div>
        </div>

        {/* Prompt Influence Slider */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
            <span>Prompt Influence</span>
            <span className="text-neutral-300 font-mono">{(params.promptInfluence * 100).toFixed(0)}%</span>
          </div>
          <div className="relative flex items-center h-6">
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01"
              value={params.promptInfluence}
              onChange={(e) => updateParam('promptInfluence', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
              style={{
                background: `linear-gradient(to right, #ffffff ${params.promptInfluence * 100}%, #262626 ${params.promptInfluence * 100}%)`
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-neutral-600 font-mono">
            <span>Creative</span>
            <span>Strict</span>
          </div>
        </div>
      </div>

      {/* Loop Toggle */}
      <div className="flex items-center justify-between bg-neutral-900/40 border border-white/[0.04] p-4 rounded-2xl">
        <div className="flex items-center gap-3 text-sm text-neutral-200">
          <div className="w-8 h-8 rounded-full bg-neutral-800/50 flex items-center justify-center text-neutral-400">
            <Repeat className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium">Seamless Loop</div>
            <div className="text-[11px] text-neutral-500">Generate audio that loops perfectly</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => updateParam('loop', !params.loop)}
          className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer select-none ${
            params.loop ? 'bg-white' : 'bg-neutral-700'
          }`}
        >
          <motion.div
            layout
            className={`w-5 h-5 rounded-full shadow-sm ${
              params.loop ? 'bg-black translate-x-5' : 'bg-neutral-300 translate-x-0'
            }`}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Trim Silence Toggle */}
      <div className="flex items-center justify-between bg-neutral-900/40 border border-white/[0.04] p-4 rounded-2xl -mt-3">
        <div className="flex items-center gap-3 text-sm text-neutral-200">
          <div className="w-8 h-8 rounded-full bg-neutral-800/50 flex items-center justify-center text-neutral-400">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium">Trim Silence</div>
            <div className="text-[11px] text-neutral-500">Automatically remove silence from start and end</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => updateParam('trimSilence', !params.trimSilence)}
          className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer select-none ${
            params.trimSilence ? 'bg-white' : 'bg-neutral-700'
          }`}
        >
          <motion.div
            layout
            className={`w-5 h-5 rounded-full shadow-sm ${
              params.trimSilence ? 'bg-black translate-x-5' : 'bg-neutral-300 translate-x-0'
            }`}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Normalize Loudness Toggle */}
      <div className="flex items-center justify-between bg-neutral-900/40 border border-white/[0.04] p-4 rounded-2xl -mt-3">
        <div className="flex items-center gap-3 text-sm text-neutral-200">
          <div className="w-8 h-8 rounded-full bg-neutral-800/50 flex items-center justify-center text-neutral-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium">Normalize Loudness</div>
            <div className="text-[11px] text-neutral-500">Ensure consistent volume levels (EBU R128)</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => updateParam('normalizeLoudness', !params.normalizeLoudness)}
          className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer select-none ${
            params.normalizeLoudness ? 'bg-white' : 'bg-neutral-700'
          }`}
        >
          <motion.div
            layout
            className={`w-5 h-5 rounded-full shadow-sm ${
              params.normalizeLoudness ? 'bg-black translate-x-5' : 'bg-neutral-300 translate-x-0'
            }`}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Fade In & Out */}
      <div className="bg-neutral-900/40 border border-white/[0.04] p-4 rounded-2xl -mt-3 flex flex-col gap-4">
        {/* Fade In */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-neutral-300">
              <ArrowRightFromLine className="w-3.5 h-3.5 text-neutral-500" />
              <span>Fade In</span>
            </div>
            <span className="font-mono text-neutral-400 bg-black/30 px-2 py-0.5 rounded text-xs">{params.fadeIn.toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={params.fadeIn}
            onChange={(e) => updateParam('fadeIn', parseFloat(e.target.value))}
            className="w-full accent-white bg-neutral-800 h-1.5 rounded-full appearance-none cursor-pointer"
          />
        </div>

        {/* Fade Out */}
        <div className="flex flex-col gap-3 pt-2 border-t border-white/[0.04]">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-neutral-300">
              <ArrowLeftToLine className="w-3.5 h-3.5 text-neutral-500" />
              <span>Fade Out</span>
            </div>
            <span className="font-mono text-neutral-400 bg-black/30 px-2 py-0.5 rounded text-xs">{params.fadeOut.toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={params.fadeOut}
            onChange={(e) => updateParam('fadeOut', parseFloat(e.target.value))}
            className="w-full accent-white bg-neutral-800 h-1.5 rounded-full appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col gap-3 mt-2">
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onGenerate(1, false)}
            disabled={isGenerating || !params.prompt.trim()}
            className="flex-1 py-4 px-4 bg-white text-black font-semibold rounded-2xl hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2 shadow-lg shadow-white/5 font-sans cursor-pointer select-none"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                <span className="tracking-tight text-sm">Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-neutral-900 fill-neutral-900" />
                <span className="tracking-tight text-sm">Generate New (1)</span>
              </>
            )}
          </motion.button>
  
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onGenerate(3, false)}
            disabled={isGenerating || !params.prompt.trim()}
            className="flex-1 py-4 px-4 bg-neutral-800 text-white font-semibold rounded-2xl hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2 shadow-lg shadow-black/20 font-sans cursor-pointer select-none border border-white/[0.04]"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span className="tracking-tight text-sm">Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white fill-white" />
                <span className="tracking-tight text-sm">Variants (3)</span>
              </>
            )}
          </motion.button>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onGenerate(1, true)}
          disabled={isGenerating || !params.prompt.trim()}
          className="w-full py-3 px-4 bg-transparent text-neutral-400 font-semibold rounded-2xl hover:bg-neutral-900/50 hover:text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2 font-sans cursor-pointer select-none border border-neutral-800 border-dashed"
        >
          <Repeat className="w-3.5 h-3.5" />
          <span className="tracking-tight text-xs uppercase">Reuse Previous Generation</span>
        </motion.button>
      </div>
    </div>
  );
}
