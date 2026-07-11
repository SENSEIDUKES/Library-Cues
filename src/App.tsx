import React, { useState } from 'react';
import { GenerationParams, SoundAsset } from './types';
import { GenerationControls } from './components/GenerationControls';
import { AudioWaveform } from './components/AudioWaveform';
import { FolderArchive, Library, Sparkles, AlertTriangle, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSoundLibrary } from './hooks/useSoundLibrary';

export default function App() {
  const [params, setParams] = useState<GenerationParams>({
    prompt: '',
    durationSeconds: 4.0,
    promptInfluence: 0.7,
    loop: false
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [variations, setVariations] = useState<SoundAsset[]>([]);
  
  const {
    library,
    handleKeep,
    handleRemoveFromLibrary,
    handleRenameLibraryAsset,
    exportKit
  } = useSoundLibrary();

  const [activeTab, setActiveTab] = useState<'synthesize' | 'library'>('synthesize');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    setVariations([]);
    
    try {
      // Generate 3 variations concurrently
      const promises = [1, 2, 3].map(async (num) => {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...params, variationLabel: `Variation ${num}` })
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to generate');
        }
        const data = await response.json();
        
        return {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
          name: `SFX - Var ${num}`,
          prompt: params.prompt,
          audioBase64: data.audioBase64,
          mimeType: data.mimeType,
          createdAt: Date.now(),
          durationSeconds: params.durationSeconds,
          loop: params.loop
        } as SoundAsset;
      });

      const results = await Promise.allSettled(promises);
      const successfulVariations = results
        .filter((r): r is PromiseFulfilledResult<SoundAsset> => r.status === 'fulfilled')
        .map(r => r.value);
        
      if (successfulVariations.length === 0) {
        const failure = results.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
        throw new Error(failure?.reason?.message || 'Failed to generate variations');
      }
        
      setVariations(successfulVariations);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error generating sounds. Please check your credentials and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReject = (id: string) => {
    setVariations(variations.filter(v => v.id !== id));
  };

  const handleRenameVariation = (id: string, newName: string) => {
    setVariations(variations.map(a => a.id === id ? { ...a, name: newName } : a));
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex justify-center font-sans antialiased w-full relative">
      
      {/* Premium Ambient Radial Glow Background */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.015] rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Main Responsive Viewport */}
      <div className="w-full max-w-7xl min-h-screen relative flex flex-col border-x border-white/[0.02]">
        
        {/* Sticky Glassmorphic Header */}
        <header className="px-5 py-4 border-b border-white/[0.04] bg-black/80 backdrop-blur-xl flex items-center justify-between z-35 shrink-0 sticky top-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-black shadow-md shadow-white/5">
              <Music className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-neutral-100 leading-tight">Library Cues</h1>
              <p className="text-[10px] text-neutral-500 font-medium tracking-wide uppercase">Sound engine</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'library' && library.length > 0 && (
              <motion.button
                key="export-btn"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportKit}
                className="flex items-center gap-1.5 text-[11px] font-semibold bg-white text-black px-3 py-1.5 rounded-full transition-all shadow cursor-pointer select-none"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                Export Kit
              </motion.button>
            )}
          </AnimatePresence>
        </header>

        {/* Scrollable Viewport Container */}
        <div className="flex-1 overflow-y-auto scrollbar-none pb-24 relative bg-black">
          <AnimatePresence mode="wait">
            {activeTab === 'synthesize' ? (
              <motion.div
                key="synthesize-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-5 flex flex-col gap-5"
              >
                {/* Generation Controls */}
                <section className="bg-neutral-900/30 border border-white/[0.03] rounded-2xl p-4.5 backdrop-blur-md">
                  <GenerationControls 
                    params={params} 
                    onChange={setParams} 
                    onGenerate={handleGenerate} 
                    isGenerating={isGenerating} 
                  />
                </section>

                {/* API Error Box */}
                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-2xl text-rose-200 text-[12px] flex flex-col gap-2"
                  >
                    <div className="font-semibold flex items-center gap-2 text-rose-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Setup Required</span>
                    </div>
                    <p className="leading-relaxed opacity-90">{errorMsg}</p>
                    <div className="mt-1 text-[11px] text-rose-400/80 leading-relaxed pt-2 border-t border-rose-900/20">
                      To fix, click <strong className="text-rose-200">Secrets</strong> in AI Studio, add <code className="bg-rose-950/80 px-1.5 py-0.5 rounded text-rose-300 font-mono text-[10px]">ELEVENLABS_API_KEY</code>, then restart the dev server.
                    </div>
                  </motion.div>
                )}

                {/* Generated Variations Container */}
                {(variations.length > 0 || isGenerating) && (
                  <section className="flex flex-col gap-3.5 mt-2">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-[11px] font-bold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                        Generated Variations
                      </h2>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      {isGenerating ? (
                        <>
                          {[1, 2, 3].map((i) => (
                            <div key={`skeleton-${i}`} className="p-4 rounded-2xl bg-neutral-900/35 border border-white/[0.04] backdrop-blur-xl relative flex flex-col animate-pulse">
                              <div className="flex items-center justify-between mb-3.5">
                                <div className="flex items-center gap-2.5 w-full">
                                  <div className="w-4.5 h-4.5 rounded-full bg-neutral-800 shrink-0" />
                                  <div className="h-4 bg-neutral-800 rounded-md w-32" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-4 h-4 bg-neutral-800 rounded-sm" />
                                  <div className="w-4 h-4 bg-neutral-800 rounded-sm" />
                                </div>
                              </div>
                              <div className="flex items-center gap-3.5">
                                <div className="w-9 h-9 rounded-full bg-neutral-800 shrink-0" />
                                <div className="flex-1 min-w-0 relative h-10 bg-neutral-800/50 rounded-lg" />
                                <div className="w-10 h-3 bg-neutral-800 rounded-sm shrink-0" />
                              </div>
                              <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-white/[0.04] pt-2.5">
                                <div className="h-3 bg-neutral-800 rounded-full w-48" />
                                <div className="h-3 bg-neutral-800 rounded-sm w-20" />
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        variations.map(asset => {
                          const isKept = library.some(l => l.id === asset.id);
                          return (
                            <AudioWaveform 
                              key={asset.id} 
                              asset={asset} 
                              onKeep={() => handleKeep(asset)}
                              onReject={() => handleReject(asset.id)}
                              onRename={(name) => handleRenameVariation(asset.id, name)}
                              isKept={isKept}
                            />
                          );
                        })
                      )}
                    </div>
                  </section>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="library-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-5 flex flex-col gap-3.5"
              >
                {library.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                    <div className="w-14 h-14 rounded-full bg-neutral-900/60 border border-white/[0.04] flex items-center justify-center text-neutral-500 mb-4 shadow-inner">
                      <Library className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-neutral-300">Your library is empty</h3>
                    <p className="text-xs text-neutral-500 mt-1 max-w-[200px] leading-relaxed">
                      Generate and keep audio variations in the synthesis tab to save them here.
                    </p>
                    <button 
                      onClick={() => setActiveTab('synthesize')}
                      className="mt-5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-white/[0.04] text-neutral-300 text-xs font-semibold rounded-full transition-all cursor-pointer select-none"
                    >
                      Open Synthesizer
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {library.map(asset => (
                      <AudioWaveform 
                        key={asset.id} 
                        asset={asset}
                        onReject={() => handleRemoveFromLibrary(asset.id)}
                        onRename={(name) => handleRenameLibraryAsset(asset.id, name)}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Glassmorphic Bottom Tab Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[72px] bg-black/85 border-t border-white/[0.04] backdrop-blur-xl flex items-center justify-around px-6 pb-4 z-40 shrink-0">
          <button
            onClick={() => setActiveTab('synthesize')}
            className={`flex flex-col items-center gap-1.5 cursor-pointer select-none relative transition-colors py-1 ${
              activeTab === 'synthesize' ? 'text-white' : 'text-neutral-500'
            }`}
          >
            <Sparkles className="w-4.5 h-4.5" />
            <span className="text-[10px] font-bold tracking-tight">Synthesize</span>
            {activeTab === 'synthesize' && (
              <motion.div 
                layoutId="activeTabDot" 
                className="absolute -bottom-2 w-1.5 h-1.5 bg-white rounded-full" 
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('library')}
            className={`flex flex-col items-center gap-1.5 cursor-pointer select-none relative transition-colors py-1 ${
              activeTab === 'library' ? 'text-white' : 'text-neutral-500'
            }`}
          >
            <div className="relative">
              <Library className="w-4.5 h-4.5" />
              {library.length > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-white text-black font-bold text-[8px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow">
                  {library.length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold tracking-tight">Saved Kit</span>
            {activeTab === 'library' && (
              <motion.div 
                layoutId="activeTabDot" 
                className="absolute -bottom-2 w-1.5 h-1.5 bg-white rounded-full" 
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              />
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
