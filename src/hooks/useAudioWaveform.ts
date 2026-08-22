import { useState, useEffect, useCallback, useRef } from 'react';
import { decodeAudioBase64, generateFallbackPeaks, createReverbImpulse, computeLoopGain } from '../lib/audio';
import { SoundAsset } from '../types';
import { saveSound } from '../lib/storage';

const pauseCallbacks = new Map<string, () => void>();

export function useAudioWaveform(asset: SoundAsset) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [engineDuration, setEngineDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  
  const [offlineDuration, setOfflineDuration] = useState(asset.durationSeconds || 0);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isDecoding, setIsDecoding] = useState(false);
  const [sampleRate, setSampleRate] = useState<number | null>(asset.sampleRate || null);
  const [fileSizeStr, setFileSizeStr] = useState<string>('');

  // Web Audio DSP states and nodes
  const [filterFreq, setFilterFreq] = useState(asset.filterFreq !== undefined ? asset.filterFreq : 20000); // 20kHz default (bypass)
  const [delayFeedback, setDelayFeedback] = useState(asset.delayFeedback !== undefined ? asset.delayFeedback : 0); // 0 default (bypass)
  const [reverbAmount, setReverbAmount] = useState(asset.reverbAmount !== undefined ? asset.reverbAmount : 0); // 0 default (bypass)
  const [playbackRate, setPlaybackRateState] = useState(asset.playbackRate !== undefined ? asset.playbackRate : 1); // 1 default (normal)

  const filterFreqRef = useRef(filterFreq);
  const delayFeedbackRef = useRef(delayFeedback);
  const reverbAmountRef = useRef(reverbAmount);

  useEffect(() => {
    const nextFilterFreq = asset.filterFreq !== undefined ? asset.filterFreq : 20000;
    const nextDelayFeedback = asset.delayFeedback !== undefined ? asset.delayFeedback : 0;
    const nextReverbAmount = asset.reverbAmount !== undefined ? asset.reverbAmount : 0;
    const nextPlaybackRate = asset.playbackRate !== undefined ? asset.playbackRate : 1;

    setFilterFreq(nextFilterFreq);
    setDelayFeedback(nextDelayFeedback);
    setReverbAmount(nextReverbAmount);
    setPlaybackRateState(nextPlaybackRate);

    filterFreqRef.current = nextFilterFreq;
    delayFeedbackRef.current = nextDelayFeedback;
    reverbAmountRef.current = nextReverbAmount;
  }, [asset.id, asset.playbackRate, asset.filterFreq, asset.delayFeedback, asset.reverbAmount]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const feedbackNodeRef = useRef<GainNode | null>(null);
  const reverbNodeRef = useRef<ConvolverNode | null>(null);
  const reverbGainNodeRef = useRef<GainNode | null>(null);
  const loopGainNodeRef = useRef<GainNode | null>(null);

  const displayDuration = engineDuration > 0 ? engineDuration : offlineDuration;

  const setupWebAudio = useCallback(() => {
    if (!audioRef.current || typeof window === 'undefined') return;
    if (audioContextRef.current) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = source;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = filterFreqRef.current;
      filterNodeRef.current = filter;

      const delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.25; // 250ms echo
      delayNodeRef.current = delay;

      const feedback = ctx.createGain();
      feedback.gain.value = delayFeedbackRef.current;
      feedbackNodeRef.current = feedback;

      const reverb = ctx.createConvolver();
      reverb.buffer = createReverbImpulse(ctx, 2.0, 2.0); // 2s duration, decay 2
      reverbNodeRef.current = reverb;

      const reverbGain = ctx.createGain();
      reverbGain.gain.value = reverbAmountRef.current;
      reverbGainNodeRef.current = reverbGain;

      const loopGain = ctx.createGain();
      loopGain.gain.value = 1.0;
      loopGainNodeRef.current = loopGain;

      // Connections:
      // Source -> Filter -> LoopGain -> Destination (Dry)
      // Filter -> Delay -> Feedback -> Filter (Feedback delay loop)
      // Filter -> Reverb -> ReverbGain -> LoopGain (Reverb tail)
      // Feedback -> LoopGain (Delay tail)
      source.connect(filter);
      filter.connect(loopGain);

      filter.connect(delay);
      delay.connect(feedback);
      feedback.connect(filter);
      feedback.connect(loopGain);

      filter.connect(reverb);
      reverb.connect(reverbGain);
      reverbGain.connect(loopGain);

      loopGain.connect(ctx.destination);
    } catch (e) {
      console.warn("Web Audio API setup failed or blocked", e);
    }
  }, []);

  // Synchronize filter parameters in real time
  useEffect(() => {
    if (audioContextRef.current) {
      if (filterNodeRef.current) {
        filterNodeRef.current.frequency.setValueAtTime(filterFreq, audioContextRef.current.currentTime);
      }
      if (feedbackNodeRef.current) {
        feedbackNodeRef.current.gain.setValueAtTime(delayFeedback, audioContextRef.current.currentTime);
      }
      if (reverbGainNodeRef.current) {
        reverbGainNodeRef.current.gain.setValueAtTime(reverbAmount, audioContextRef.current.currentTime);
      }
    }
  }, [filterFreq, delayFeedback, reverbAmount]);

  const setFilterFreqWithSetup = useCallback((val: number) => {
    filterFreqRef.current = val;
    setupWebAudio();
    setFilterFreq(val);
  }, [setupWebAudio]);

  const setDelayFeedbackWithSetup = useCallback((val: number) => {
    delayFeedbackRef.current = val;
    setupWebAudio();
    setDelayFeedback(val);
  }, [setupWebAudio]);

  const setReverbAmountWithSetup = useCallback((val: number) => {
    reverbAmountRef.current = val;
    setupWebAudio();
    setReverbAmount(val);
  }, [setupWebAudio]);

  useEffect(() => {
    try {
      const binaryString = window.atob(asset.audioBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: asset.mimeType || 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      
      const audio = new Audio(url);
      audio.loop = !!asset.loop;
      audio.volume = volume;
      audio.playbackRate = playbackRate;
      if ('preservesPitch' in audio) {
        audio.preservesPitch = false;
      } else if ('mozPreservesPitch' in audio) {
        (audio as any).mozPreservesPitch = false;
      } else if ('webkitPreservesPitch' in audio) {
        (audio as any).webkitPreservesPitch = false;
      }
      audioRef.current = audio;
      
      const onTimeUpdate = () => setCurrentTime(audio.currentTime);
      const onLoadedMetadata = () => {
        if (audio.duration && audio.duration !== Infinity) {
          setEngineDuration(audio.duration);
        }
      };
      const onEnded = () => setIsPlaying(false);
      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);
      
      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('loadedmetadata', onLoadedMetadata);
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('play', onPlay);
      audio.addEventListener('pause', onPause);
      
      return () => {
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('pause', onPause);
        audio.pause();
        audioRef.current = null;
        URL.revokeObjectURL(url);

        // Web Audio Cleanup
        if (sourceNodeRef.current) {
          try { sourceNodeRef.current.disconnect(); } catch (_) {}
          sourceNodeRef.current = null;
        }
        if (filterNodeRef.current) {
          try { filterNodeRef.current.disconnect(); } catch (_) {}
          filterNodeRef.current = null;
        }
        if (delayNodeRef.current) {
          try { delayNodeRef.current.disconnect(); } catch (_) {}
          delayNodeRef.current = null;
        }
        if (feedbackNodeRef.current) {
          try { feedbackNodeRef.current.disconnect(); } catch (_) {}
          feedbackNodeRef.current = null;
        }
        if (reverbNodeRef.current) {
          try { reverbNodeRef.current.disconnect(); } catch (_) {}
          reverbNodeRef.current = null;
        }
        if (reverbGainNodeRef.current) {
          try { reverbGainNodeRef.current.disconnect(); } catch (_) {}
          reverbGainNodeRef.current = null;
        }
        if (loopGainNodeRef.current) {
          try { loopGainNodeRef.current.disconnect(); } catch (_) {}
          loopGainNodeRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }
      };
    } catch (e) {
      console.error('Error creating audio URL', e);
    }
  }, [asset.audioBase64, asset.mimeType, asset.loop]);

  // Anti-pop smooth fade-in and fade-out envelope for looped audio
  useEffect(() => {
    if (!isPlaying || !asset.loop) {
      if (audioRef.current) {
        audioRef.current.volume = volume;
      }
      if (loopGainNodeRef.current && audioContextRef.current) {
        try {
          loopGainNodeRef.current.gain.setValueAtTime(1.0, audioContextRef.current.currentTime);
        } catch (_) {}
      }
      return;
    }

    let animationFrameId: number;

    const updateLoopGain = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        const dur = audio.duration || displayDuration;
        const gainMultiplier = computeLoopGain(audio.currentTime, dur, true);
        const targetVol = Math.max(0, Math.min(1, volume * gainMultiplier));

        // Update HTMLAudioElement volume smoothly
        audio.volume = targetVol;

        // Update Web Audio GainNode if active
        if (loopGainNodeRef.current && audioContextRef.current) {
          try {
            loopGainNodeRef.current.gain.setValueAtTime(gainMultiplier, audioContextRef.current.currentTime);
          } catch (_) {}
        }
      }
      animationFrameId = requestAnimationFrame(updateLoopGain);
    };

    animationFrameId = requestAnimationFrame(updateLoopGain);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (audioRef.current) {
        audioRef.current.volume = volume;
      }
      if (loopGainNodeRef.current && audioContextRef.current) {
        try {
          loopGainNodeRef.current.gain.setValueAtTime(1.0, audioContextRef.current.currentTime);
        } catch (_) {}
      }
    };
  }, [isPlaying, asset.loop, displayDuration, volume]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    pauseCallbacks.set(asset.id, pause);
    return () => {
      pauseCallbacks.delete(asset.id);
    };
  }, [asset.id, pause]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    
    setupWebAudio();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    if (audioRef.current.paused) {
      pauseCallbacks.forEach((pauseCallback, id) => {
        if (id !== asset.id) {
          pauseCallback();
        }
      });
      audioRef.current.play().catch(e => console.error('Error playing audio', e));
    } else {
      audioRef.current.pause();
    }
  }, [asset.id, setupWebAudio]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (audioRef.current) {
      if (!asset.loop || !isPlaying) {
        audioRef.current.volume = newVolume;
      }
    }
  }, [asset.loop, isPlaying]);

  const setPlaybackRate = useCallback((newRate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
      setPlaybackRateState(newRate);
    }
  }, []);

  useEffect(() => {
    const bytesCount = asset.fileSize || Math.round((asset.audioBase64.length * 3) / 4);
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
          
          // Cache peaks on the asset object to avoid re-decoding
          asset.peaks = decoded.peaks;
          if (asset.sampleRate === undefined) asset.sampleRate = decoded.sampleRate;
          if (asset.durationSeconds === undefined) asset.durationSeconds = decoded.duration;
          
          // Persist the peaks to IndexedDB to avoid re-decoding on next load
          saveSound(asset).catch(e => console.error("Failed to persist peaks", e));
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
    setVolume,
    filterFreq,
    setFilterFreq: setFilterFreqWithSetup,
    delayFeedback,
    setDelayFeedback: setDelayFeedbackWithSetup,
    reverbAmount,
    setReverbAmount: setReverbAmountWithSetup,
    playbackRate,
    setPlaybackRate
  };
}
