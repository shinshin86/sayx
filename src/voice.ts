import { VoiceEngineAdapter } from "@aituber-onair/voice";
import type { VoiceServiceOptions, ChatScreenplay } from "@aituber-onair/voice";
import type { ResolvedOptions } from "./types.js";
import { getConfigPath } from "./config.js";
import { playAudio } from "./player.js";
import { applyApiUrls, applyEngineOverrides } from "./utils/voice-options.js";
import {
  buildApiKeyHelp,
  buildMissingApiKeyError,
  requiresApiKey,
} from "./utils/api-key.js";
import { getLocalEngineApiUrlCandidates } from "./utils/local-engine-api.js";

export interface SpeakResult {
  success: boolean;
  error?: string;
  audioPath?: string;
}

interface LocalSpeakerStyle {
  id?: number | string;
  name?: string;
}

interface LocalSpeaker {
  name?: string;
  styles?: LocalSpeakerStyle[];
}

export type VoiceListStatus = "ok" | "unsupported" | "unavailable";

export interface VoiceListResult {
  status: VoiceListStatus;
  voices: string[];
  reason?: string;
}

interface LocalVoiceFetchResult {
  connected: boolean;
  voices: string[];
  errors: string[];
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function normalizeLocalSpeakers(data: unknown): string[] {
  if (!Array.isArray(data)) {
    return [];
  }

  const speakers = data as LocalSpeaker[];
  const voices: string[] = [];

  for (const speaker of speakers) {
    const speakerName = speaker.name ?? "unknown";
    const styles = Array.isArray(speaker.styles) ? speaker.styles : [];

    if (styles.length === 0) {
      voices.push(speakerName);
      continue;
    }

    for (let i = 0; i < styles.length; i++) {
      const style = styles[i];
      const styleId = style.id ?? i;
      const styleName = style.name ? ` (${style.name})` : "";
      voices.push(`${styleId}: ${speakerName}${styleName}`);
    }
  }

  return voices;
}

async function fetchLocalVoices(baseUrl: string, paths: string[]): Promise<LocalVoiceFetchResult> {
  const normalized = trimTrailingSlash(baseUrl);
  const errors: string[] = [];

  for (const endpointPath of paths) {
    try {
      const response = await fetch(`${normalized}${endpointPath}`);
      if (!response.ok) {
        errors.push(`${endpointPath}: HTTP ${response.status}`);
        continue;
      }

      try {
        const json = await response.json();
        const voices = normalizeLocalSpeakers(json);
        return {
          connected: true,
          voices,
          errors,
        };
      } catch (error) {
        errors.push(`${endpointPath}: invalid JSON (${getErrorMessage(error)})`);
      }
    } catch (error) {
      errors.push(`${endpointPath}: ${getErrorMessage(error)}`);
    }
  }

  return {
    connected: false,
    voices: [],
    errors,
  };
}

async function listLocalVoices(candidates: string[], paths: string[]): Promise<VoiceListResult> {
  const failures: string[] = [];

  for (const candidate of candidates) {
    const result = await fetchLocalVoices(candidate, paths);
    if (result.connected) {
      return {
        status: "ok",
        voices: result.voices,
      };
    }

    const detail = result.errors.length > 0 ? result.errors.join(" | ") : "no response";
    failures.push(`${candidate}: ${detail}`);
  }

  return {
    status: "unavailable",
    voices: [],
    reason: `could not reach voice list endpoint (${failures.join(" || ")})`,
  };
}

export async function speak(
  text: string,
  options: ResolvedOptions,
  cliOptions: {
    outPath?: string;
    shouldPlay: boolean;
  }
): Promise<SpeakResult> {
  let audioBuffer: ArrayBuffer | null = null;

  if (requiresApiKey(options.engineType) && !options.apiKey) {
    return {
      success: false,
      error: buildMissingApiKeyError(options.engineType, getConfigPath()),
    };
  }

  // Build voice service options
  const voiceOptions: VoiceServiceOptions = {
    speaker: options.speaker,
    engineType: options.engineType,
    apiKey: options.apiKey,
    onPlay: async (buffer: ArrayBuffer) => {
      audioBuffer = buffer;
    },
  };

  applyApiUrls(voiceOptions, options);
  applyEngineOverrides(voiceOptions, options.engineType, options.engineOverrides);

  // Create voice adapter
  const adapter = new VoiceEngineAdapter(voiceOptions);

  try {
    // Build screenplay
    const screenplay: ChatScreenplay = {
      text,
    };

    await adapter.speak(screenplay);

    if (!audioBuffer) {
      return {
        success: false,
        error: "No audio data received from voice engine",
      };
    }

    const result = await playAudio(audioBuffer, {
      outPath: cliOptions.outPath,
      shouldPlay: cliOptions.shouldPlay,
    });

    if (result.error) {
      return {
        success: false,
        error: result.error,
        audioPath: result.tempPath,
      };
    }

    return {
      success: true,
      audioPath: cliOptions.outPath || (result.played ? undefined : result.tempPath),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Provide helpful hints for common errors
    let hint = "";
    if (message.includes("fetch failed") || message.includes("ECONNREFUSED")) {
      if (options.engineType === "voicevox") {
        hint = "\nHint: Is VOICEVOX running? Start VOICEVOX and try again.";
      } else if (options.engineType === "voicepeak") {
        hint = "\nHint: Is VOICEPEAK API server running?";
      } else if (options.engineType === "aivisSpeech") {
        hint = "\nHint: Is AIVIS Speech server running?";
      } else {
        hint = "\nHint: Check if the voice engine is running and accessible.";
      }
    } else if (message.includes("401") || message.includes("Unauthorized")) {
      hint = `\nHint: ${buildApiKeyHelp(getConfigPath())}`;
    } else if (message.includes("429") || message.includes("rate limit")) {
      hint = "\nHint: Rate limit exceeded. Wait a moment and try again.";
    }

    return {
      success: false,
      error: `Voice synthesis failed: ${message}${hint}`,
    };
  }
}

export async function listVoicesWithStatus(options: ResolvedOptions): Promise<VoiceListResult> {
  // For VOICEVOX and AivisSpeech, fetch speakers from local API
  if (options.engineType === "voicevox") {
    const candidates = getLocalEngineApiUrlCandidates("voicevox", options.voicevoxApiUrl);
    return listLocalVoices(candidates, ["/speakers"]);
  }

  if (options.engineType === "aivisSpeech") {
    const candidates = getLocalEngineApiUrlCandidates("aivisSpeech", options.aivisSpeechApiUrl);
    return listLocalVoices(candidates, ["/speakers", "/v1/speakers"]);
  }

  // For OpenAI, return static list
  if (options.engineType === "openai") {
    return {
      status: "ok",
      voices: [
        "alloy: Versatile, balanced voice",
        "echo: Warm, conversational voice",
        "fable: Expressive, narrative voice",
        "onyx: Deep, authoritative voice",
        "nova: Friendly, optimistic voice",
        "shimmer: Clear, professional voice",
      ],
    };
  }

  // Voice listing is engine-specific and not universally supported.
  return {
    status: "unsupported",
    voices: [],
  };
}

export async function listVoices(options: ResolvedOptions): Promise<string[] | null> {
  const result = await listVoicesWithStatus(options);
  return result.status === "ok" ? result.voices : null;
}
