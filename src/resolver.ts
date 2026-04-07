import type { CliOptions, ResolvedOptions, EngineType, Preset } from "./types.js";
import { getDefaultConfig, loadConfig } from "./config.js";
import { resolveApiKey } from "./utils/api-key.js";
import { resolveSpeaker } from "./utils/config-resolution.js";
import { resolveLocalEngineApiUrl } from "./utils/local-engine-api.js";

const SUPPORTED_ENGINES: EngineType[] = [
  "voicevox",
  "voicepeak",
  "openai",
  "xai",
  "geminiTts",
  "openaiCompatible",
  "aivisSpeech",
  "aivisCloud",
  "minimax",
];

export function getSupportedEngines(): EngineType[] {
  return [...SUPPORTED_ENGINES];
}

export function isValidEngineType(engine: string): engine is EngineType {
  return SUPPORTED_ENGINES.includes(engine as EngineType);
}

export function resolveOptions(cliOptions: CliOptions): ResolvedOptions {
  // Load config (use CLI-specified path or default)
  let config = loadConfig(cliOptions.config);

  // If no config exists, use built-in defaults
  if (!config) {
    config = getDefaultConfig();
  }

  // Determine preset
  const presetName = cliOptions.preset ?? "default";
  const preset: Preset = config.presets?.[presetName] ?? {};

  // Resolve engineType: CLI > default
  let engineType: EngineType = config.default.engineType;
  if (cliOptions.engine) {
    if (!isValidEngineType(cliOptions.engine)) {
      throw new Error(
        `Invalid engine type: ${cliOptions.engine}. Supported: ${SUPPORTED_ENGINES.join(", ")}`
      );
    }
    engineType = cliOptions.engine;
  } else if (!isValidEngineType(engineType)) {
    throw new Error(
      `Invalid engine type in config: ${engineType}. Supported: ${SUPPORTED_ENGINES.join(", ")}`
    );
  }

  // Resolve speaker: CLI > preset.engineOverrides[engine] > default
  const speaker = resolveSpeaker(
    config.default.speaker,
    preset,
    engineType,
    cliOptions.speaker
  );

  // Resolve API key
  const apiKey = resolveApiKey(config);

  return {
    engineType,
    speaker,
    apiKey,
    voicevoxApiUrl: resolveLocalEngineApiUrl("voicevox", config.default.voicevoxApiUrl),
    voicepeakApiUrl: resolveLocalEngineApiUrl("voicepeak", config.default.voicepeakApiUrl),
    aivisSpeechApiUrl: resolveLocalEngineApiUrl("aivisSpeech", config.default.aivisSpeechApiUrl),
    openAiCompatibleApiUrl: resolveLocalEngineApiUrl(
      "openaiCompatible",
      config.default.openAiCompatibleApiUrl
    ),
    geminiTtsApiUrl: config.default.geminiTtsApiUrl,
    speakOptions: preset.speakOptions,
    engineOverrides: preset.engineOverrides,
  };
}
