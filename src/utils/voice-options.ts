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
    | "unrealSpeechApiUrl"
    | "elevenLabsApiUrl"
    | "inworldApiUrl"
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

  if (options.unrealSpeechApiUrl) {
    mutableTarget.unrealSpeechApiUrl = options.unrealSpeechApiUrl;
  }

  if (options.elevenLabsApiUrl) {
    mutableTarget.elevenLabsApiUrl = options.elevenLabsApiUrl;
  }

  if (options.inworldApiUrl) {
    mutableTarget.inworldApiUrl = options.inworldApiUrl;
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
    case "unrealSpeech":
      if ("bitrate" in engineOverride && engineOverride.bitrate !== undefined) {
        mutableTarget.unrealSpeechBitrate = engineOverride.bitrate;
      }
      if ("speed" in engineOverride && engineOverride.speed !== undefined) {
        mutableTarget.unrealSpeechSpeed = engineOverride.speed;
      }
      if ("pitch" in engineOverride && engineOverride.pitch !== undefined) {
        mutableTarget.unrealSpeechPitch = engineOverride.pitch;
      }
      if ("codec" in engineOverride && engineOverride.codec !== undefined) {
        mutableTarget.unrealSpeechCodec = engineOverride.codec;
      }
      if ("temperature" in engineOverride && engineOverride.temperature !== undefined) {
        mutableTarget.unrealSpeechTemperature = engineOverride.temperature;
      }
      break;
    case "elevenLabs":
      if ("model" in engineOverride && engineOverride.model !== undefined) {
        mutableTarget.elevenLabsModel = engineOverride.model;
      }
      if ("outputFormat" in engineOverride && engineOverride.outputFormat !== undefined) {
        mutableTarget.elevenLabsOutputFormat = engineOverride.outputFormat;
      }
      if ("languageCode" in engineOverride && engineOverride.languageCode !== undefined) {
        mutableTarget.elevenLabsLanguageCode = engineOverride.languageCode;
      }
      if ("stability" in engineOverride && engineOverride.stability !== undefined) {
        mutableTarget.elevenLabsStability = engineOverride.stability;
      }
      if ("similarityBoost" in engineOverride && engineOverride.similarityBoost !== undefined) {
        mutableTarget.elevenLabsSimilarityBoost = engineOverride.similarityBoost;
      }
      if ("style" in engineOverride && engineOverride.style !== undefined) {
        mutableTarget.elevenLabsStyle = engineOverride.style;
      }
      if ("useSpeakerBoost" in engineOverride && engineOverride.useSpeakerBoost !== undefined) {
        mutableTarget.elevenLabsUseSpeakerBoost = engineOverride.useSpeakerBoost;
      }
      if ("speed" in engineOverride && engineOverride.speed !== undefined) {
        mutableTarget.elevenLabsSpeed = engineOverride.speed;
      }
      if ("seed" in engineOverride && engineOverride.seed !== undefined) {
        mutableTarget.elevenLabsSeed = engineOverride.seed;
      }
      if ("previousText" in engineOverride && engineOverride.previousText !== undefined) {
        mutableTarget.elevenLabsPreviousText = engineOverride.previousText;
      }
      if ("nextText" in engineOverride && engineOverride.nextText !== undefined) {
        mutableTarget.elevenLabsNextText = engineOverride.nextText;
      }
      if (
        "applyTextNormalization" in engineOverride &&
        engineOverride.applyTextNormalization !== undefined
      ) {
        mutableTarget.elevenLabsApplyTextNormalization =
          engineOverride.applyTextNormalization;
      }
      if (
        "applyLanguageTextNormalization" in engineOverride &&
        engineOverride.applyLanguageTextNormalization !== undefined
      ) {
        mutableTarget.elevenLabsApplyLanguageTextNormalization =
          engineOverride.applyLanguageTextNormalization;
      }
      if ("enableLogging" in engineOverride && engineOverride.enableLogging !== undefined) {
        mutableTarget.elevenLabsEnableLogging = engineOverride.enableLogging;
      }
      break;
    case "inworld":
      if ("model" in engineOverride && engineOverride.model !== undefined) {
        mutableTarget.inworldModel = engineOverride.model;
      }
      if ("audioEncoding" in engineOverride && engineOverride.audioEncoding !== undefined) {
        mutableTarget.inworldAudioEncoding = engineOverride.audioEncoding;
      }
      if (
        "sampleRateHertz" in engineOverride &&
        engineOverride.sampleRateHertz !== undefined
      ) {
        mutableTarget.inworldSampleRateHertz = engineOverride.sampleRateHertz;
      }
      if ("bitRate" in engineOverride && engineOverride.bitRate !== undefined) {
        mutableTarget.inworldBitRate = engineOverride.bitRate;
      }
      if ("speakingRate" in engineOverride && engineOverride.speakingRate !== undefined) {
        mutableTarget.inworldSpeakingRate = engineOverride.speakingRate;
      }
      if ("language" in engineOverride && engineOverride.language !== undefined) {
        mutableTarget.inworldLanguage = engineOverride.language;
      }
      if ("deliveryMode" in engineOverride && engineOverride.deliveryMode !== undefined) {
        mutableTarget.inworldDeliveryMode = engineOverride.deliveryMode;
      }
      if ("temperature" in engineOverride && engineOverride.temperature !== undefined) {
        mutableTarget.inworldTemperature = engineOverride.temperature;
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
