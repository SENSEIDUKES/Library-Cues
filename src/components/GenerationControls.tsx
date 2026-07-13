import React from 'react';
import { motion } from 'motion/react';
import { GenerationParams } from '../types';
import { Sparkles, Repeat, Scissors, Activity, ArrowRightFromLine, ArrowLeftToLine } from 'lucide-react';

interface GenerationControlsProps {
  params: GenerationParams;
  onChange: (params: GenerationParams) => void;
  onGenerate: (count: number, useCache: boolean) => void;
  elevenLabsApiKey: string;
  onElevenLabsApiKeyChange: (value: string) => void;
  isGenerating: boolean;
}

export function GenerationControls({
  params,
  onChange,
  onGenerate,
  elevenLabsApiKey,
  onElevenLabsApiKeyChange,
  isGenerating,
}: GenerationControlsProps) {
  const updateParam = (key: keyof GenerationParams, value: any) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <label htmlFor="elevenlabs-api-key" className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
          ElevenLabs API Key <span className="normal-case font-normal tracking-normal text-neutral-600">(optional if configured on the server)</span>
        </label>
        <input
          id="elevenlabs-api-key"
          type="password"
          value={elevenLabsApiKey}
          onChange={(event) => onElevenLabsApiKeyChange(event.target.value)}
          placeholder="Paste your key here to generate"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className="w-full bg-neutral-900/40 border border-white/[0.04] rounded-xl px-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-white/[0.12] focus:ring-1 focus:ring-white/[0.12]"
        />
        <p className="text-[10px] leading-relaxed text-neutral-600">Used only for this generation session. It is not saved to this device or the cue library.</p>
      </div>

      {/* Description input */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
          Sound Description
        </label>
        <div className="relative group">
          <textarea 
            value={params.prompt}
            onChange={(e) => updateParam('prompt', e.target.value)}
            placeholder="e.g. A guttural, echoing roar of a massive beast in a cave..."
            className="w-full bg-neutral-900/40 border border-white/[0.04] rounded-2xl p-4 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-white/[0.12] focus:ring-1 focus:ring-white/[0.12] resize-none h-28 transition-all duration-200 backdrop-blur-md leading-relaxed"
          />
          {params.prompt.length > 0 && (
            <button 
              onClick={() => updateParam('prompt', '')}
              className="absolute right-3 bottom-3 text-[10px] text-neutral-500 hover:text-neutral-300 font-mono transition-colors"
            >
              Clear
            </button>
          )}
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
              min="0.5"
              max="30" 
              step="0.1"
              value={params.durationSeconds}
              onChange={(e) => updateParam('durationSeconds', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
              style={{
                background: `linear-gradient(to right, #ffffff ${((params.durationSeconds - 0.5) / 29.5) * 100}%, #262626 ${((params.durationSeconds - 0.5) / 29.5) * 100}%)`
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-neutral-600 font-mono">
            <span>0.5s</span>
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
          aria-label="Toggle seamless loop"
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
          aria-label="Toggle trim silence"
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
          aria-label="Toggle normalize loudness"
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
