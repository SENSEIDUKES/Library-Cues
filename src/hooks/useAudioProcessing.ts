import { useState, useCallback, useEffect } from 'react';
import { SoundAsset } from '../types';
import { DiagnosticToastData } from './useGenerationState';

export function useAudioProcessing(
  handleUpdateAsset: (asset: SoundAsset) => Promise<void> | void,
  onUpdateVariation?: (asset: SoundAsset) => void
) {
  const [selectedDiagnosticAsset, setSelectedDiagnosticAsset] = useState<SoundAsset | null>(null);
  const [diagnosticToast, setDiagnosticToast] = useState<DiagnosticToastData | null>(null);

  // Auto-dismiss diagnostic toasts after 6 seconds
  useEffect(() => {
    if (diagnosticToast?.show) {
      const timer = setTimeout(() => {
        setDiagnosticToast(prev => prev ? { ...prev, show: false } : null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [diagnosticToast?.show]);

  const showToast = useCallback((toast: DiagnosticToastData) => {
    setDiagnosticToast(toast);
  }, []);

  const handleTrimSilence = useCallback(async (asset: SoundAsset, isLibraryAsset: boolean) => {
    try {
      const response = await fetch('/api/trim-silence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: asset.audioBase64, mimeType: asset.mimeType })
      });
      if (!response.ok) {
        throw new Error('Failed to trim silence');
      }
      const data = await response.json();
      const updatedAsset: SoundAsset = {
        ...asset,
        audioBase64: data.audioBase64,
        previousAudioBase64: asset.audioBase64,
        diagnostics: data.diagnostics,
        appliedEffects: {
          ...asset.appliedEffects,
          trimSilence: true
        }
      };

      if (isLibraryAsset) {
        await handleUpdateAsset(updatedAsset);
      } else if (onUpdateVariation) {
        onUpdateVariation(updatedAsset);
      }

      if (data.diagnostics) {
        setDiagnosticToast({
          show: true,
          title: 'Silence Trimmed Successfully',
          description: `The backend successfully processed the audio buffer. Removed ${data.diagnostics.originalSize - data.diagnostics.processedSize} bytes of leading/trailing silence.`,
          success: true,
          logs: data.diagnostics.logs,
          originalSize: data.diagnostics.originalSize,
          processedSize: data.diagnostics.processedSize,
          asset: updatedAsset
        });
      }
    } catch (err: any) {
      console.error('Error trimming silence:', err);
      setDiagnosticToast({
        show: true,
        title: 'Silence Trim Failed',
        description: `Failed to trim silence. Fallback system returned original audio buffer.`,
        success: false,
        logs: [`[!] Error: ${err.message || 'Unknown network error'}`],
        asset
      });
    }
  }, [handleUpdateAsset, onUpdateVariation]);

  const handleNormalizeLoudness = useCallback(async (asset: SoundAsset, isLibraryAsset: boolean) => {
    try {
      const response = await fetch('/api/normalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: asset.audioBase64, mimeType: asset.mimeType })
      });
      if (!response.ok) {
        throw new Error('Failed to normalize loudness');
      }
      const data = await response.json();
      const updatedAsset: SoundAsset = {
        ...asset,
        audioBase64: data.audioBase64,
        previousAudioBase64: asset.audioBase64,
        diagnostics: data.diagnostics,
        appliedEffects: {
          ...asset.appliedEffects,
          normalizeLoudness: true
        }
      };

      if (isLibraryAsset) {
        await handleUpdateAsset(updatedAsset);
      } else if (onUpdateVariation) {
        onUpdateVariation(updatedAsset);
      }

      if (data.diagnostics) {
        setDiagnosticToast({
          show: true,
          title: 'Loudness Normalized',
          description: `The backend successfully normalized the audio to EBU R128 loudness standards. Original size: ${data.diagnostics.originalSize} bytes, new size: ${data.diagnostics.processedSize} bytes.`,
          success: true,
          logs: data.diagnostics.logs,
          originalSize: data.diagnostics.originalSize,
          processedSize: data.diagnostics.processedSize,
          asset: updatedAsset
        });
      }
    } catch (err: any) {
      console.error('Error normalizing loudness:', err);
      setDiagnosticToast({
        show: true,
        title: 'Loudness Normalization Failed',
        description: `Failed to normalize loudness. Fallback system returned original audio buffer.`,
        success: false,
        logs: [`[!] Error: ${err.message || 'Unknown network error'}`],
        asset
      });
    }
  }, [handleUpdateAsset, onUpdateVariation]);

  const handleFade = useCallback(async (
    asset: SoundAsset,
    isLibraryAsset: boolean,
    fadeIn: number = 0,
    fadeOut: number = 0
  ) => {
    if (fadeIn === 0 && fadeOut === 0) return;
    try {
      const response = await fetch('/api/fade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: asset.audioBase64,
          mimeType: asset.mimeType,
          fadeIn,
          fadeOut
        })
      });
      if (!response.ok) {
        throw new Error('Failed to fade audio');
      }
      const data = await response.json();
      const updatedAsset: SoundAsset = {
        ...asset,
        audioBase64: data.audioBase64,
        previousAudioBase64: asset.audioBase64,
        diagnostics: data.diagnostics,
        appliedEffects: {
          ...asset.appliedEffects,
          fadeIn: fadeIn > 0 ? fadeIn : undefined,
          fadeOut: fadeOut > 0 ? fadeOut : undefined
        }
      };

      if (isLibraryAsset) {
        await handleUpdateAsset(updatedAsset);
      } else if (onUpdateVariation) {
        onUpdateVariation(updatedAsset);
      }

      if (data.diagnostics) {
        setDiagnosticToast({
          show: true,
          title: 'Fade Fused Successfully',
          description: `The backend successfully applied fades: Fade In: ${fadeIn}s | Fade Out: ${fadeOut}s.`,
          success: true,
          logs: data.diagnostics.logs,
          originalSize: data.diagnostics.originalSize,
          processedSize: data.diagnostics.processedSize,
          asset: updatedAsset
        });
      }
    } catch (err: any) {
      console.error('Error fading audio:', err);
      setDiagnosticToast({
        show: true,
        title: 'Audio Fade Failed',
        description: `Failed to apply fade. Fallback system returned original audio buffer.`,
        success: false,
        logs: [`[!] Error: ${err.message || 'Unknown network error'}`],
        asset
      });
    }
  }, [handleUpdateAsset, onUpdateVariation]);

  const handleUndoTrim = useCallback(async (asset: SoundAsset, isLibraryAsset: boolean) => {
    if (!asset.previousAudioBase64) return;
    const updatedAsset: SoundAsset = {
      ...asset,
      audioBase64: asset.previousAudioBase64,
      previousAudioBase64: undefined
    };

    if (isLibraryAsset) {
      await handleUpdateAsset(updatedAsset);
    } else if (onUpdateVariation) {
      onUpdateVariation(updatedAsset);
    }
  }, [handleUpdateAsset, onUpdateVariation]);

  return {
    selectedDiagnosticAsset,
    setSelectedDiagnosticAsset,
    diagnosticToast,
    setDiagnosticToast,
    showToast,
    handleTrimSilence,
    handleNormalizeLoudness,
    handleFade,
    handleUndoTrim
  };
}
