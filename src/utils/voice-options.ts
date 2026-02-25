import type { VoiceServiceOptions } from "@aituber-onair/voice";
import type { EngineOverrides, EngineType, ResolvedOptions } from "../types.js";

export function applyApiUrls(
  target: Partial<VoiceServiceOptions>,
  options: Pick<ResolvedOptions, "voicevoxApiUrl" | "voicepeakApiUrl" | "aivisSpeechApiUrl">
): void {
  if (options.voicevoxApiUrl) {
    target.voicevoxApiUrl = options.voicevoxApiUrl;
  }

  if (options.voicepeakApiUrl) {
    target.voicepeakApiUrl = options.voicepeakApiUrl;
  }

  if (options.aivisSpeechApiUrl) {
    target.aivisSpeechApiUrl = options.aivisSpeechApiUrl;
  }
}

export function applyEngineOverrides(
  target: Partial<VoiceServiceOptions>,
  engineType: EngineType,
  engineOverrides?: EngineOverrides
): void {
  const engineOverride = engineOverrides?.[engineType as keyof EngineOverrides];
  if (!engineOverride) {
    return;
  }

  switch (engineType) {
    case "voicevox":
      if ("speedScale" in engineOverride && engineOverride.speedScale !== undefined) {
        target.voicevoxSpeedScale = engineOverride.speedScale;
      }
      if ("pitchScale" in engineOverride && engineOverride.pitchScale !== undefined) {
        target.voicevoxPitchScale = engineOverride.pitchScale;
      }
      if ("intonationScale" in engineOverride && engineOverride.intonationScale !== undefined) {
        target.voicevoxIntonationScale = engineOverride.intonationScale;
      }
      if ("volumeScale" in engineOverride && engineOverride.volumeScale !== undefined) {
        target.voicevoxVolumeScale = engineOverride.volumeScale;
      }
      break;
    case "voicepeak":
      if ("speed" in engineOverride && engineOverride.speed !== undefined) {
        target.voicepeakSpeed = engineOverride.speed;
      }
      if ("pitch" in engineOverride && engineOverride.pitch !== undefined) {
        target.voicepeakPitch = engineOverride.pitch;
      }
      break;
    case "openai":
      if ("model" in engineOverride && engineOverride.model !== undefined) {
        target.openAiModel = engineOverride.model;
      }
      if ("speed" in engineOverride && engineOverride.speed !== undefined) {
        target.openAiSpeed = engineOverride.speed;
      }
      break;
    case "aivisSpeech":
      if ("speedScale" in engineOverride && engineOverride.speedScale !== undefined) {
        target.aivisSpeechSpeedScale = engineOverride.speedScale;
      }
      if ("pitchScale" in engineOverride && engineOverride.pitchScale !== undefined) {
        target.aivisSpeechPitchScale = engineOverride.pitchScale;
      }
      break;
    case "aivisCloud":
      if ("speakingRate" in engineOverride && engineOverride.speakingRate !== undefined) {
        target.aivisCloudSpeakingRate = engineOverride.speakingRate;
      }
      if ("pitch" in engineOverride && engineOverride.pitch !== undefined) {
        target.aivisCloudPitch = engineOverride.pitch;
      }
      break;
    case "minimax":
      if ("speed" in engineOverride && engineOverride.speed !== undefined) {
        target.minimaxSpeed = engineOverride.speed;
      }
      if ("pitch" in engineOverride && engineOverride.pitch !== undefined) {
        target.minimaxPitch = engineOverride.pitch;
      }
      break;
  }
}
