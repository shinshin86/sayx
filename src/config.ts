import fs from "node:fs";
import path from "node:path";
import envPaths from "env-paths";
import { parse, stringify } from "yaml";
import type { Config, ConfigDefault } from "./types.js";
import { LOCAL_ENGINE_DEFAULT_URLS } from "./utils/local-engine-api.js";

const paths = envPaths("sayx", { suffix: "" });

export function getConfigDir(): string {
  return paths.config;
}

export function getConfigPath(): string {
  return path.join(paths.config, "config.yaml");
}

export function getDefaultConfig(): Config {
  const defaultConfig: ConfigDefault = {
    engineType: "voicevox",
    speaker: "1",
    apiKeyEnv: "OPENAI_API_KEY",
    voicevoxApiUrl: LOCAL_ENGINE_DEFAULT_URLS.voicevox,
    voicepeakApiUrl: LOCAL_ENGINE_DEFAULT_URLS.voicepeak,
    aivisSpeechApiUrl: LOCAL_ENGINE_DEFAULT_URLS.aivisSpeech,
  };

  return {
    default: defaultConfig,
    presets: {
      default: {
        speakOptions: {},
        engineOverrides: {
          voicevox: {
            speaker: "1",
          },
          openai: {
            speaker: "alloy",
            model: "tts-1",
          },
        },
      },
    },
  };
}

export function loadConfig(configPath?: string): Config | null {
  const targetPath = configPath ?? getConfigPath();

  if (!fs.existsSync(targetPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(targetPath, "utf-8");
    const config = parse(content) as Config;
    return config;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse config file: ${message}`);
  }
}

export function saveConfig(config: Config, configPath?: string): string {
  const targetPath = configPath ?? getConfigPath();
  const dir = path.dirname(targetPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const content = stringify(config, {
    indent: 2,
    lineWidth: 0,
  });

  fs.writeFileSync(targetPath, content, "utf-8");
  return targetPath;
}

export function initConfig(configPath?: string): { path: string; created: boolean } {
  const targetPath = configPath ?? getConfigPath();

  if (fs.existsSync(targetPath)) {
    return { path: targetPath, created: false };
  }

  const config = getDefaultConfig();
  saveConfig(config, targetPath);
  return { path: targetPath, created: true };
}
