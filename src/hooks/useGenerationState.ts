import { useState, useCallback } from 'react';
import { GenerationParams, SoundAsset } from '../types';

export interface DiagnosticToastData {
  show: boolean;
  title: string;
  description: string;
  success: boolean;
  logs: string[];
  originalSize?: number;
  processedSize?: number;
  asset?: SoundAsset;
}

export function useGenerationState(onShowToast?: (toast: DiagnosticToastData) => void) {
  const [params, setParams] = useState<GenerationParams>({
    prompt: '',
    durationSeconds: 3.0,
    promptInfluence: 0.7,
    loop: false,
    trimSilence: false,
    normalizeLoudness: false,
    fadeIn: 0,
    fadeOut: 0
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingCount, setGeneratingCount] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [variations, setVariations] = useState<SoundAsset[]>([]);
  const [selectedSynthesisIds, setSelectedSynthesisIds] = useState<Set<string>>(new Set());

  const handleGenerate = useCallback(async (count: number = 1, useCache: boolean = false) => {
    setIsGenerating(true);
    setGeneratingCount(count);
    setErrorMsg(null);
    setVariations([]);
    setSelectedSynthesisIds(new Set());

    try {
      const promises = Array.from({ length: count }, (_, i) => i + 1).map(async (num) => {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...params,
            useCache,
            variationLabel: count > 1 ? `Variation ${num}` : 'Variation'
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to generate');
        }
        const data = await response.json();

        const baseName = 'SFX - Var';

        return {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
          name: count > 1 ? `${baseName} ${num}` : baseName,
          prompt: params.prompt,
          audioBase64: data.audioBase64,
          mimeType: data.mimeType,
          createdAt: Date.now(),
          durationSeconds: params.durationSeconds,
          loop: params.loop,
          diagnostics: data.diagnostics,
          appliedEffects: {
            trimSilence: params.trimSilence,
            normalizeLoudness: params.normalizeLoudness,
            fadeIn: params.fadeIn > 0 ? params.fadeIn : undefined,
            fadeOut: params.fadeOut > 0 ? params.fadeOut : undefined
          }
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

      if (successfulVariations.length > 0 && onShowToast) {
        const lastAsset = successfulVariations[successfulVariations.length - 1];
        if (lastAsset.diagnostics) {
          const wasProcessed = params.trimSilence || params.normalizeLoudness || params.fadeIn > 0 || params.fadeOut > 0;
          let description = `Synthesized ${successfulVariations.length} sound file(s) using ElevenLabs.`;
          if (wasProcessed) {
            if (lastAsset.diagnostics.success) {
              description += ` The backend successfully ran the FFmpeg post-processing pipeline on the generated buffer.`;
            } else {
              description += ` The backend post-processing failed and fell back to the original generated audio.`;
            }
          }
          onShowToast({
            show: true,
            title: 'Synthesis & DSP Pipeline Complete',
            description,
            success: !wasProcessed || !!lastAsset.diagnostics.success,
            logs: lastAsset.diagnostics.logs || [],
            originalSize: lastAsset.diagnostics.originalSize,
            processedSize: lastAsset.diagnostics.processedSize,
            asset: lastAsset
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error generating sounds. Please check your credentials and try again.');
      if (onShowToast) {
        onShowToast({
          show: true,
          title: 'Synthesis Pipeline Failed',
          description: `Pipeline warning: ${err.message || 'An error occurred while generating or processing the sound asset.'}`,
          success: false,
          logs: [`[!] Error: ${err.message || 'ElevenLabs API call failed'}`]
        });
      }
    } finally {
      setIsGenerating(false);
    }
  }, [params, onShowToast]);

  const handleReject = useCallback((id: string) => {
    setVariations(prev => prev.filter(v => v.id !== id));
    setSelectedSynthesisIds(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleRenameVariation = useCallback((id: string, newName: string) => {
    setVariations(prev => prev.map(a => a.id === id ? { ...a, name: newName } : a));
  }, []);

  const handleUpdateVariationAsset = useCallback((updatedAsset: SoundAsset) => {
    setVariations(prev => prev.map(v => v.id === updatedAsset.id ? updatedAsset : v));
  }, []);

  const handleToggleSynthesisSelect = useCallback((id: string) => {
    setSelectedSynthesisIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleSynthesisSelectAll = useCallback(() => {
    setSelectedSynthesisIds(prev => {
      if (prev.size === variations.length) {
        return new Set();
      }
      return new Set(variations.map(a => a.id));
    });
  }, [variations]);

  const handleBulkKeepSynthesis = useCallback(async (handleBulkKeep: (assets: SoundAsset[]) => Promise<void>) => {
    const toKeep = selectedSynthesisIds.size > 0
      ? variations.filter(a => selectedSynthesisIds.has(a.id))
      : variations;

    await handleBulkKeep(toKeep);
    setSelectedSynthesisIds(new Set());
  }, [selectedSynthesisIds, variations]);

  const handleBulkExportSynthesis = useCallback((exportKit: (assets?: SoundAsset[]) => void) => {
    if (selectedSynthesisIds.size > 0) {
      const selectedAssets = variations.filter(a => selectedSynthesisIds.has(a.id));
      exportKit(selectedAssets);
    } else if (variations.length > 0) {
      exportKit(variations);
    }
  }, [selectedSynthesisIds, variations]);

  const handleBulkRejectSynthesis = useCallback(() => {
    if (selectedSynthesisIds.size > 0) {
      setVariations(prev => prev.filter(v => !selectedSynthesisIds.has(v.id)));
      setSelectedSynthesisIds(new Set());
    } else {
      setVariations([]);
    }
  }, [selectedSynthesisIds]);

  return {
    params,
    setParams,
    isGenerating,
    generatingCount,
    errorMsg,
    setErrorMsg,
    variations,
    setVariations,
    selectedSynthesisIds,
    setSelectedSynthesisIds,
    handleGenerate,
    handleReject,
    handleRenameVariation,
    handleUpdateVariationAsset,
    handleToggleSynthesisSelect,
    handleToggleSynthesisSelectAll,
    handleBulkKeepSynthesis,
    handleBulkExportSynthesis,
    handleBulkRejectSynthesis
  };
}
