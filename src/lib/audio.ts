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
    const n = Math.random() * 2 - 1;
    left[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    right[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
  }
  return impulse;
};
