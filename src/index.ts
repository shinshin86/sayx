export { loadConfig, saveConfig, initConfig, getConfigPath, getConfigDir } from "./config.js";
export { resolveOptions, getSupportedEngines, isValidEngineType } from "./resolver.js";
export { speak, listVoices, listVoicesWithStatus } from "./voice.js";
export { playAudio } from "./player.js";
export { runBench, resolveBenchConfig, formatTimestamp } from "./bench.js";
export { writeJsonReport, writeHtmlReport, generateHtmlReport } from "./report.js";
export {
  requiresApiKey,
  resolveApiKey,
  buildApiKeyHelp,
  buildMissingApiKeyError,
} from "./utils/api-key.js";
export { resolveSpeaker } from "./utils/config-resolution.js";
export { applyApiUrls, applyEngineOverrides } from "./utils/voice-options.js";
export { detectExtension } from "./utils/audio.js";
export {
  LOCAL_ENGINE_DEFAULT_URLS,
  resolveLocalEngineApiUrl,
  getLocalEngineApiUrlCandidates,
} from "./utils/local-engine-api.js";
export type {
  Config,
  ConfigDefault,
  Preset,
  EngineType,
  EngineOverrides,
  SpeakOptions,
  ResolvedOptions,
  CliOptions,
} from "./types.js";
export type { VoiceListStatus, VoiceListResult } from "./voice.js";
export type {
  BenchOptions,
  BenchItem,
  BenchReport,
  ResolvedBenchConfig,
} from "./bench.js";
