import { useState, useEffect, useCallback } from 'react';
import { useAudioPlayer } from '@seihouse/audio-player';
import { decodeAudioBase64, generateFallbackPeaks } from '../lib/audio';
import { SoundAsset } from '../types';
import { base64ByteLength } from '../lib/mime';

export function useAudioWaveform(asset: SoundAsset) {
  const audioUrl = `data:${asset.mimeType};base64,${asset.audioBase64}`;
  const {
    audioRef,
    isPlaying,
    currentTime,
    duration: engineDuration,
    toggle: togglePlayInternal,
    seek,
    volume,
    setVolume
  } = useAudioPlayer({ src: audioUrl });

  const togglePlay = useCallback(() => {
    togglePlayInternal();
  }, [togglePlayInternal]);

  const [offlineDuration, setOfflineDuration] = useState(asset.durationSeconds || 0);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isDecoding, setIsDecoding] = useState(false);
  const [sampleRate, setSampleRate] = useState<number | null>(asset.sampleRate || null);
  const [fileSizeStr, setFileSizeStr] = useState<string>('');

  const displayDuration = engineDuration > 0 ? engineDuration : offlineDuration;

  useEffect(() => {
    const bytesCount = asset.fileSize ?? base64ByteLength(asset.audioBase64);
    if (bytesCount < 1024) {
      setFileSizeStr(`${bytesCount} B`);
    } else {
      setFileSizeStr(`${(bytesCount / 1024).toFixed(1)} KB`);
    }
  }, [asset.audioBase64, asset.fileSize]);

  useEffect(() => {
    let active = true;
    setIsDecoding(true);

    const decodeAudio = async () => {
      try {
        if (asset.peaks && asset.peaks.length > 0) {
          if (active) {
            setPeaks(asset.peaks);
            setIsDecoding(false);
          }
          return;
        }

        const decoded = await decodeAudioBase64(asset.audioBase64);
        if (active) {
          setPeaks(decoded.peaks);
          setSampleRate(decoded.sampleRate);
          setOfflineDuration(decoded.duration);
        }
      } catch (err) {
        console.error("Peak extraction failed, using fallback visual profile", err);
        if (active) {
          setPeaks(generateFallbackPeaks());
        }
      } finally {
        if (active) {
          setIsDecoding(false);
        }
      }
    };

    decodeAudio();

    return () => {
      active = false;
    };
  }, [asset.audioBase64]);

  return {
    audioRef,
    isPlaying,
    currentTime,
    displayDuration,
    togglePlay,
    seek,
    peaks,
    isDecoding,
    sampleRate,
    fileSizeStr,
    volume,
    setVolume
  };
}
