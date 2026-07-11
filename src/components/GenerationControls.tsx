import React from 'react';
import { motion } from 'motion/react';
import { GenerationParams } from '../types';
import { Sparkles, Repeat } from 'lucide-react';

interface GenerationControlsProps {
  params: GenerationParams;
  onChange: (params: GenerationParams) => void;
  onGenerate: (count: number) => void;
  isGenerating: boolean;
}

export function GenerationControls({ params, onChange, onGenerate, isGenerating }: GenerationControlsProps) {
  const updateParam = (key: keyof GenerationParams, value: any) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
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

      {/* Primary Action Buttons */}
      <div className="flex gap-3 mt-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onGenerate(1)}
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
              <span className="tracking-tight text-sm">Synthesize</span>
            </>
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onGenerate(3)}
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
    </div>
  );
}
