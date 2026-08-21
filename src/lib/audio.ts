export interface DecodedAudioData {
  peaks: number[];
  sampleRate: number;
  duration: number;
}

// Queue system to prevent crashing when decoding 50+ audio files concurrently
const MAX_CONCURRENT_DECODES = 3;
let activeDecodes = 0;
const decodeQueue: (() => void)[] = [];

const acquireDecodeSlot = (): Promise<void> => {
  return new Promise(resolve => {
    if (activeDecodes < MAX_CONCURRENT_DECODES) {
      activeDecodes++;
      resolve();
    } else {
      decodeQueue.push(resolve);
    }
  });
};

const releaseDecodeSlot = () => {
  if (decodeQueue.length > 0) {
    const next = decodeQueue.shift();
    if (next) next();
  } else {
    activeDecodes--;
  }
};

export const decodeAudioBase64 = async (audioBase64: string, numBars: number = 100): Promise<DecodedAudioData> => {
  await acquireDecodeSlot();
  
  try {
    const binaryString = window.atob(audioBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const offlineCtx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(1, 1, 44100);
    const audioBuffer = await offlineCtx.decodeAudioData(bytes.buffer);
    const channelData = audioBuffer.getChannelData(0);
    
    const blockSize = Math.floor(channelData.length / numBars);
    const extractedPeaks: number[] = [];
    
    for (let i = 0; i < numBars; i++) {
      let max = 0;
      const start = i * blockSize;
      const end = start + blockSize;
      for (let j = start; j < end; j++) {
        const val = Math.abs(channelData[j]);
        if (val > max) max = val;
      }
      extractedPeaks.push(max);
    }
    
    const maxPeak = Math.max(...extractedPeaks);
    const normalized = maxPeak > 0 ? extractedPeaks.map(p => p / maxPeak) : extractedPeaks;

    return {
      peaks: normalized,
      sampleRate: audioBuffer.sampleRate,
      duration: audioBuffer.duration
    };
  } finally {
    releaseDecodeSlot();
  }
};

export const generateFallbackPeaks = (numBars: number = 100): number[] => {
  const fallback: number[] = [];
  let current = 0.5;
  for (let i = 0; i < numBars; i++) {
    current += (Math.random() - 0.5) * 0.2;
    current = Math.max(0.1, Math.min(1.0, current));
    fallback.push(current);
  }
  return fallback;
};

export const createReverbImpulse = (ctx: AudioContext, duration: number, decay: number) => {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    left[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    right[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
  }
  return impulse;
};

/**
 * Computes an anti-pop gain multiplier for seamless loop playback.
 * Applies a smooth equal-power sinusoidal curve at the loop start (fade-in)
 * and loop end (fade-out) to prevent speaker clicks/pops caused by amplitude discontinuities.
 */
export const computeLoopGain = (
  currentTime: number,
  duration: number,
  isLoop: boolean,
  fadeSeconds: number = 0.04
): number => {
  if (!isLoop || duration <= 0) return 1.0;
  
  // Adaptive fade window: typically 40ms, bounded by 10% of total duration for ultra-short clips
  const fadeDuration = Math.min(fadeSeconds, duration * 0.1);
  if (fadeDuration <= 0) return 1.0;

  if (currentTime < fadeDuration) {
    // Smooth equal-power fade in at start of loop (0.0 -> 1.0)
    const progress = Math.max(0, currentTime) / fadeDuration;
    return Math.sin(progress * (Math.PI / 2));
  } else if (currentTime > duration - fadeDuration) {
    // Smooth equal-power fade out at end of loop (1.0 -> 0.0)
    const remaining = Math.max(0, duration - currentTime);
    const progress = remaining / fadeDuration;
    return Math.sin(progress * (Math.PI / 2));
  }
  
  return 1.0;
};

/**
 * Applies a micro-fade envelope directly to an AudioBuffer's start and end samples
 * to prevent zero-crossing discontinuities when looped.
 */
export const applyAntiPopLoopFade = (
  audioBuffer: AudioBuffer,
  fadeSeconds: number = 0.04
): AudioBuffer => {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const fadeSamples = Math.min(
    Math.floor(fadeSeconds * sampleRate),
    Math.floor(audioBuffer.length * 0.1)
  );

  if (fadeSamples <= 0) return audioBuffer;

  for (let channel = 0; channel < numChannels; channel++) {
    const data = audioBuffer.getChannelData(channel);
    const length = data.length;
    for (let i = 0; i < fadeSamples; i++) {
      const fadeInGain = Math.sin((i / fadeSamples) * (Math.PI / 2));
      data[i] *= fadeInGain;

      const fadeOutGain = Math.sin((i / fadeSamples) * (Math.PI / 2));
      data[length - 1 - i] *= fadeOutGain;
    }
  }
  return audioBuffer;
};

export const getAudioBufferFromBase64 = async (audioBase64: string): Promise<AudioBuffer> => {
  const binaryString = window.atob(audioBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const offlineCtx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(1, 1, 44100);
  return await offlineCtx.decodeAudioData(bytes.buffer);
};

export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // 1 = raw PCM (16-bit integer)
  const bitDepth = 16;
  
  let result;
  if (numOfChan === 2) {
    result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
  } else {
    result = buffer.getChannelData(0);
  }
  
  const bufferLength = result.length * 2;
  const arrayBuffer = new ArrayBuffer(44 + bufferLength);
  const view = new DataView(arrayBuffer);
  
  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + bufferLength, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numOfChan, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numOfChan * (bitDepth / 8), true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, bufferLength, true);
  
  // Write PCM data
  floatTo16BitPCM(view, 44, result);
  
  return new Blob([view], { type: 'audio/wav' });
}

function interleave(inputL: Float32Array, inputR: Float32Array): Float32Array {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);
  let index = 0;
  let inputIndex = 0;
  
  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const commaIndex = base64data.indexOf(',');
      if (commaIndex !== -1) {
        resolve(base64data.substring(commaIndex + 1));
      } else {
        resolve(base64data);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const bakeEffectsOnClientSide = async (
  audioBase64: string,
  _mimeType: string,
  playbackRate: number,
  filterFreq: number,
  delayFeedback: number,
  reverbAmount: number
): Promise<{ audioBase64: string; mimeType: string; durationSeconds: number }> => {
  // 1. Decode base64 to AudioBuffer
  const sourceBuffer = await getAudioBufferFromBase64(audioBase64);
  
  // 2. Compute duration and create OfflineAudioContext
  const rate = playbackRate || 1;
  let renderedDuration = sourceBuffer.duration / rate;
  if (reverbAmount > 0 || delayFeedback > 0) {
    renderedDuration += 2.5; // add 2.5s tail for reverb/delay echo
  }
  
  const numChannels = sourceBuffer.numberOfChannels;
  const sampleRate = sourceBuffer.sampleRate;
  const length = Math.ceil(renderedDuration * sampleRate);
  
  const offlineCtx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(numChannels, length, sampleRate);
  
  // 3. Recreate nodes in Offline Context
  const sourceNode = offlineCtx.createBufferSource();
  sourceNode.buffer = sourceBuffer;
  sourceNode.playbackRate.value = rate;
  
  const filterNode = offlineCtx.createBiquadFilter();
  filterNode.type = 'lowpass';
  filterNode.frequency.value = filterFreq;
  
  const delayNode = offlineCtx.createDelay(2.0);
  delayNode.delayTime.value = 0.25; // 250ms echo
  
  const feedbackNode = offlineCtx.createGain();
  feedbackNode.gain.value = delayFeedback;
  
  const reverbNode = offlineCtx.createConvolver();
  reverbNode.buffer = createReverbImpulse(offlineCtx as unknown as AudioContext, 2.0, 2.0);
  
  const reverbGainNode = offlineCtx.createGain();
  reverbGainNode.gain.value = reverbAmount;
  
  // 4. Connect nodes in Offline Context
  sourceNode.connect(filterNode);
  filterNode.connect(offlineCtx.destination);
  
  filterNode.connect(delayNode);
  delayNode.connect(feedbackNode);
  feedbackNode.connect(filterNode);
  feedbackNode.connect(offlineCtx.destination);
  
  filterNode.connect(reverbNode);
  reverbNode.connect(reverbGainNode);
  reverbGainNode.connect(offlineCtx.destination);
  
  // 5. Start source and render
  sourceNode.start(0);
  const renderedBuffer = await offlineCtx.startRendering();
  
  // 6. Convert rendered buffer to WAV blob
  const wavBlob = audioBufferToWavBlob(renderedBuffer);
  
  // 7. Convert blob to Base64
  const base64 = await blobToBase64(wavBlob);
  
  return {
    audioBase64: base64,
    mimeType: 'audio/wav',
    durationSeconds: renderedBuffer.duration
  };
};
