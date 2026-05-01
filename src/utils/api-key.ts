import type { Config, EngineType } from "../types.js";

export const API_KEY_REQUIRED_ENGINES: EngineType[] = [
  "openai",
  "xai",
  "unrealSpeech",
  "elevenLabs",
  "geminiTts",
  "aivisCloud",
  "minimax",
];

export function requiresApiKey(engineType: EngineType): boolean {
  return API_KEY_REQUIRED_ENGINES.includes(engineType);
}

export function resolveApiKey(config: Config): string | undefined {
  if (config.default.apiKey) {
    return config.default.apiKey;
  }

  if (config.default.apiKeyEnv) {
    const envValue = process.env[config.default.apiKeyEnv];
    if (envValue) {
      return envValue;
    }
  }

  return undefined;
}

export function buildApiKeyHelp(configPath: string): string {
  return [
    `Set default.apiKey in your config (default: ${configPath})`,
    "or set default.apiKeyEnv and export that env var.",
  ].join("\n");
}

export function buildMissingApiKeyError(engineType: EngineType, configPath: string): string {
  return [
    `API key is required for engine "${engineType}".`,
    buildApiKeyHelp(configPath),
  ].join("\n");
}
