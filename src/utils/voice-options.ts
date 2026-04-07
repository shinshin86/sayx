import type { VoiceServiceOptions } from "@aituber-onair/voice";
import type { EngineOverrides, EngineType, ResolvedOptions } from "../types.js";

export function applyApiUrls(
  target: Partial<VoiceServiceOptions>,
  options: Pick<
    ResolvedOptions,
    | "voicevoxApiUrl"
    | "voicepeakApiUrl"
    | "aivisSpeechApiUrl"
    | "openAiCompatibleApiUrl"
    | "geminiTtsApiUrl"
  >
): void {
  const mutableTarget = target as Record<string, unknown>;

  if (options.voicevoxApiUrl) {
    mutableTarget.voicevoxApiUrl = options.voicevoxApiUrl;
  }

  if (options.voicepeakApiUrl) {
    mutableTarget.voicepeakApiUrl = options.voicepeakApiUrl;
  }

  if (options.aivisSpeechApiUrl) {
    mutableTarget.aivisSpeechApiUrl = options.aivisSpeechApiUrl;
  }

  if (options.openAiCompatibleApiUrl) {
    mutableTarget.openAiCompatibleApiUrl = options.openAiCompatibleApiUrl;
  }

  if (options.geminiTtsApiUrl) {
    mutableTarget.geminiTtsApiUrl = options.geminiTtsApiUrl;
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

  const mutableTarget = target as Record<string, unknown>;

  switch (engineType) {
    case "voicevox":
      if ("speedScale" in engineOverride && engineOverride.speedScale !== undefined) {
        mutableTarget.voicevoxSpeedScale = engineOverride.speedScale;
      }
      if ("pitchScale" in engineOverride && engineOverride.pitchScale !== undefined) {
        mutableTarget.voicevoxPitchScale = engineOverride.pitchScale;
      }
      if ("intonationScale" in engineOverride && engineOverride.intonationScale !== undefined) {
        mutableTarget.voicevoxIntonationScale = engineOverride.intonationScale;
      }
      if ("volumeScale" in engineOverride && engineOverride.volumeScale !== undefined) {
        mutableTarget.voicevoxVolumeScale = engineOverride.volumeScale;
      }
      break;
    case "voicepeak":
      if ("speed" in engineOverride && engineOverride.speed !== undefined) {
        mutableTarget.voicepeakSpeed = engineOverride.speed;
      }
      if ("pitch" in engineOverride && engineOverride.pitch !== undefined) {
        mutableTarget.voicepeakPitch = engineOverride.pitch;
      }
      break;
    case "openai":
      if ("model" in engineOverride && engineOverride.model !== undefined) {
        mutableTarget.openAiModel = engineOverride.model;
      }
      if ("speed" in engineOverride && engineOverride.speed !== undefined) {
        mutableTarget.openAiSpeed = engineOverride.speed;
      }
      break;
    case "xai":
      if ("language" in engineOverride && engineOverride.language !== undefined) {
        mutableTarget.xaiLanguage = engineOverride.language;
      }
      if ("codec" in engineOverride && engineOverride.codec !== undefined) {
        mutableTarget.xaiCodec = engineOverride.codec;
      }
      if ("sampleRate" in engineOverride && engineOverride.sampleRate !== undefined) {
        mutableTarget.xaiSampleRate = engineOverride.sampleRate;
      }
      if ("bitRate" in engineOverride && engineOverride.bitRate !== undefined) {
        mutableTarget.xaiBitRate = engineOverride.bitRate;
      }
      break;
    case "geminiTts":
      if ("model" in engineOverride && engineOverride.model !== undefined) {
        mutableTarget.geminiTtsModel = engineOverride.model;
      }
      if ("languageCode" in engineOverride && engineOverride.languageCode !== undefined) {
        mutableTarget.geminiTtsLanguageCode = engineOverride.languageCode;
      }
      if ("prompt" in engineOverride && engineOverride.prompt !== undefined) {
        mutableTarget.geminiTtsPrompt = engineOverride.prompt;
      }
      break;
    case "openaiCompatible":
      if ("model" in engineOverride && engineOverride.model !== undefined) {
        mutableTarget.openAiCompatibleModel = engineOverride.model;
      }
      if ("speed" in engineOverride && engineOverride.speed !== undefined) {
        mutableTarget.openAiCompatibleSpeed = engineOverride.speed;
      }
      break;
    case "aivisSpeech":
      if ("speedScale" in engineOverride && engineOverride.speedScale !== undefined) {
        mutableTarget.aivisSpeechSpeedScale = engineOverride.speedScale;
      }
      if ("pitchScale" in engineOverride && engineOverride.pitchScale !== undefined) {
        mutableTarget.aivisSpeechPitchScale = engineOverride.pitchScale;
      }
      break;
    case "aivisCloud":
      if ("speakingRate" in engineOverride && engineOverride.speakingRate !== undefined) {
        mutableTarget.aivisCloudSpeakingRate = engineOverride.speakingRate;
      }
      if ("pitch" in engineOverride && engineOverride.pitch !== undefined) {
        mutableTarget.aivisCloudPitch = engineOverride.pitch;
      }
      break;
    case "minimax":
      if ("speed" in engineOverride && engineOverride.speed !== undefined) {
        mutableTarget.minimaxSpeed = engineOverride.speed;
      }
      if ("pitch" in engineOverride && engineOverride.pitch !== undefined) {
        mutableTarget.minimaxPitch = engineOverride.pitch;
      }
      break;
  }
}
