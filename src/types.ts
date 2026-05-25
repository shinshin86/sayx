export type EngineType =
  | "voicevox"
  | "voicepeak"
  | "openai"
  | "xai"
  | "unrealSpeech"
  | "elevenLabs"
  | "inworld"
  | "geminiTts"
  | "openaiCompatible"
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
  xai?: {
    speaker?: string;
    language?: string;
    codec?: string;
    sampleRate?: number;
    bitRate?: number;
  };
  unrealSpeech?: {
    speaker?: string;
    bitrate?: string;
    speed?: number;
    pitch?: number;
    codec?: "libmp3lame" | "pcm_mulaw" | "pcm_s16le";
    temperature?: number;
  };
  elevenLabs?: {
    speaker?: string;
    model?: string;
    outputFormat?: string;
    languageCode?: string;
    stability?: number;
    similarityBoost?: number;
    style?: number;
    useSpeakerBoost?: boolean;
    speed?: number;
    seed?: number;
    previousText?: string;
    nextText?: string;
    applyTextNormalization?: "auto" | "on" | "off";
    applyLanguageTextNormalization?: boolean;
    enableLogging?: boolean;
  };
  inworld?: {
    speaker?: string;
    model?: string;
    audioEncoding?: "MP3" | "OGG_OPUS" | "FLAC" | "LINEAR16" | "WAV" | "PCM" | "ALAW" | "MULAW";
    sampleRateHertz?: number;
    bitRate?: number;
    speakingRate?: number;
    language?: string;
    deliveryMode?: "STABLE" | "BALANCED" | "CREATIVE";
    temperature?: number;
  };
  geminiTts?: {
    speaker?: string;
    model?: string;
    languageCode?: string;
    prompt?: string;
  };
  openaiCompatible?: {
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
  openAiCompatibleApiUrl?: string;
  geminiTtsApiUrl?: string;
  unrealSpeechApiUrl?: string;
  elevenLabsApiUrl?: string;
  inworldApiUrl?: string;
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
  openAiCompatibleApiUrl?: string;
  geminiTtsApiUrl?: string;
  unrealSpeechApiUrl?: string;
  elevenLabsApiUrl?: string;
  inworldApiUrl?: string;
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
