import type { SoundAsset } from '../types';
import type { StoredCueRecord } from '../types/cues';

export function cueRecordToSoundAsset(record: StoredCueRecord): SoundAsset {
  return {
    id: record.id,
    name: record.cue.displayName,
    prompt: record.cue.source.prompt ?? record.cue.description ?? record.cue.narrative.tags.join(', '),
    audioBase64: record.audioBase64,
    mimeType: record.cue.audio.mimeType,
    createdAt: Date.parse(record.cue.createdAt),
    durationSeconds: record.cue.audio.durationMs / 1000,
    loop: record.cue.playback.loopable,
    sampleRate: record.sampleRate,
    fileSize: record.cue.audio.fileSizeBytes,
    previousAudioBase64: record.previousAudioBase64,
    peaks: record.peaks,
  };
}
