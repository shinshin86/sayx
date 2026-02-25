export type EngineType =
  | "voicevox"
  | "voicepeak"
  | "openai"
  | "aivisSpeech"
  | "aivisCloud"
  | "minimax";

export interface EngineOverrides {
  voicevox?: {
    speaker?: string;
    speedScale?: number;
    pitchScale?: number;
    intonationScale?: number;
    volumeScale?: number;
  };
  voicepeak?: {
    speaker?: string;
    speed?: number;
    pitch?: number;
  };
  openai?: {
    speaker?: string;
    model?: string;
    speed?: number;
  };
  aivisSpeech?: {
    speaker?: string;
    speedScale?: number;
    pitchScale?: number;
  };
  aivisCloud?: {
    speaker?: string;
    speakingRate?: number;
    pitch?: number;
  };
  minimax?: {
    speaker?: string;
    speed?: number;
    pitch?: number;
  };
}

export interface SpeakOptions {
  speed?: number;
  pitch?: number;
  volume?: number;
}

export interface Preset {
  speakOptions?: SpeakOptions;
  engineOverrides?: EngineOverrides;
}

export interface ConfigDefault {
  engineType: EngineType;
  speaker?: string;
  apiKey?: string;
  apiKeyEnv?: string;
  voicevoxApiUrl?: string;
  voicepeakApiUrl?: string;
  aivisSpeechApiUrl?: string;
}

export interface Config {
  default: ConfigDefault;
  presets?: Record<string, Preset>;
}

export interface ResolvedOptions {
  engineType: EngineType;
  speaker: string;
  apiKey?: string;
  voicevoxApiUrl?: string;
  voicepeakApiUrl?: string;
  aivisSpeechApiUrl?: string;
  speakOptions?: SpeakOptions;
  engineOverrides?: EngineOverrides;
}

export interface CliOptions {
  engine?: string;
  speaker?: string;
  preset?: string;
  config?: string;
  out?: string;
  play?: boolean;
}
