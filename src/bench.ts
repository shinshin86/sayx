import fs from "node:fs";
import path from "node:path";
import { VoiceEngineAdapter } from "@aituber-onair/voice";
import type { VoiceServiceOptions, ChatScreenplay } from "@aituber-onair/voice";
import type { Config, EngineType, Preset, ResolvedOptions } from "./types.js";
import { loadConfig, getDefaultConfig, getConfigPath } from "./config.js";
import { isValidEngineType, getSupportedEngines } from "./resolver.js";
import {
  buildMissingApiKeyError,
  requiresApiKey,
  resolveApiKey,
} from "./utils/api-key.js";
import { resolveSpeaker } from "./utils/config-resolution.js";
import { applyApiUrls, applyEngineOverrides } from "./utils/voice-options.js";
import { detectExtension } from "./utils/audio.js";
import { resolveLocalEngineApiUrl } from "./utils/local-engine-api.js";

export interface BenchOptions {
  text: string;
  outdir: string;
  engines: EngineType[];
  presets: string[];
  concurrency: number;
  generateHtml: boolean;
  configPath?: string;
  speakerOverride?: string;
}

export interface BenchItem {
  engineType: EngineType;
  preset: string;
  speaker: string;
  file: string | null;
  format: string | null;
  bytes: number;
  ok: boolean;
  error: string | null;
  resolved: {
    voiceServiceOptions: Partial<VoiceServiceOptions>;
    speakOptions: Record<string, unknown>;
  };
}

export interface BenchReport {
  version: string;
  timestamp: string;
  node: string;
  platform: string;
  text: string;
  outdir: string;
  items: BenchItem[];
  summary: {
    total: number;
    ok: number;
    failed: number;
  };
}

export interface ResolvedBenchConfig {
  engines: EngineType[];
  presets: string[];
  matrix: Array<{
    engineType: EngineType;
    preset: string;
    resolvedOptions: ResolvedOptions;
    voiceServiceOptions: Partial<VoiceServiceOptions>;
  }>;
}

interface JobResult {
  engineType: EngineType;
  preset: string;
  speaker: string;
  file: string | null;
  format: string | null;
  bytes: number;
  ok: boolean;
  error: string | null;
  voiceServiceOptions: Partial<VoiceServiceOptions>;
  speakOptions: Record<string, unknown>;
}

let interrupted = false;

const configPath = getConfigPath();

export function setupInterruptHandler(): void {
  process.on("SIGINT", () => {
    if (!interrupted) {
      interrupted = true;
      console.log("\nInterrupted. Writing partial report...");
    }
  });
}

export function isInterrupted(): boolean {
  return interrupted;
}

function resolveOptionsForBench(
  config: Config,
  engineType: EngineType,
  presetName: string,
  speakerOverride?: string
): { resolved: ResolvedOptions; voiceServiceOptions: Partial<VoiceServiceOptions> } {
  const preset: Preset = config.presets?.[presetName] ?? {};
  const speaker = resolveSpeaker(config.default.speaker, preset, engineType, speakerOverride);

  const apiKey = resolveApiKey(config);

  const resolved: ResolvedOptions = {
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
    unrealSpeechApiUrl: config.default.unrealSpeechApiUrl,
    elevenLabsApiUrl: config.default.elevenLabsApiUrl,
    inworldApiUrl: config.default.inworldApiUrl,
    speakOptions: preset.speakOptions,
    engineOverrides: preset.engineOverrides,
  };

  const voiceServiceOptions: Partial<VoiceServiceOptions> = {
    speaker,
    engineType,
    apiKey,
  };

  applyApiUrls(voiceServiceOptions, resolved);
  applyEngineOverrides(voiceServiceOptions, engineType, preset.engineOverrides);

  return { resolved, voiceServiceOptions };
}

export function resolveBenchConfig(
  options: {
    engines?: string[];
    presets?: string[];
    configPath?: string;
    speakerOverride?: string;
  }
): ResolvedBenchConfig {
  let config = loadConfig(options.configPath);
  if (!config) {
    config = getDefaultConfig();
  }

  const supportedEngines = getSupportedEngines();
  const supportedList = supportedEngines.join(", ");

  let engines: EngineType[];
  if (options.engines && options.engines.length > 0) {
    engines = options.engines.filter(isValidEngineType) as EngineType[];
    if (engines.length === 0) {
      throw new Error(
        `No valid engines specified. Valid engines: ${supportedList}`
      );
    }
  } else {
    if (!isValidEngineType(config.default.engineType)) {
      throw new Error(
        `Invalid engine type in config: ${config.default.engineType}. Supported: ${supportedList}`
      );
    }
    engines = [config.default.engineType];
  }

  let presets: string[];
  if (options.presets && options.presets.length > 0) {
    presets = options.presets;
  } else if (config.presets && Object.keys(config.presets).length > 0) {
    presets = ["default"];
    if (!config.presets["default"]) {
      presets = [Object.keys(config.presets)[0]];
    }
  } else {
    presets = ["default"];
  }

  const matrix: ResolvedBenchConfig["matrix"] = [];
  for (const engineType of engines) {
    for (const preset of presets) {
      const { resolved, voiceServiceOptions } = resolveOptionsForBench(
        config,
        engineType,
        preset,
        options.speakerOverride
      );
      matrix.push({
        engineType,
        preset,
        resolvedOptions: resolved,
        voiceServiceOptions,
      });
    }
  }

  return { engines, presets, matrix };
}

async function synthesizeAudio(
  text: string,
  voiceServiceOptions: Partial<VoiceServiceOptions>,
  outputPath: string
): Promise<{ ok: boolean; error: string | null; format: string; bytes: number }> {
  let audioBuffer: ArrayBuffer | null = null;

  const fullOptions: VoiceServiceOptions = {
    speaker: voiceServiceOptions.speaker ?? "1",
    engineType: voiceServiceOptions.engineType ?? "voicevox",
    ...voiceServiceOptions,
    onPlay: async (buffer: ArrayBuffer) => {
      audioBuffer = buffer;
    },
  };

  // For openaiCompatible, speaker is optional - omit default fallback
  if (fullOptions.engineType === "openaiCompatible" && fullOptions.speaker === "1") {
    delete (fullOptions as unknown as Record<string, unknown>).speaker;
  }

  const adapter = new VoiceEngineAdapter(fullOptions);

  try {
    const screenplay: ChatScreenplay = { text };
    await adapter.speak(screenplay);

    if (!audioBuffer) {
      return { ok: false, error: "No audio data received from voice engine", format: "", bytes: 0 };
    }

    const buffer = Buffer.from(audioBuffer);
    const extension = await detectExtension(buffer);

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const finalPath = outputPath.replace(/\.[^.]+$/, "") + "." + extension;
    fs.writeFileSync(finalPath, buffer);

    return { ok: true, error: null, format: extension, bytes: buffer.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message, format: "", bytes: 0 };
  }
}

async function runJob(
  text: string,
  engineType: EngineType,
  preset: string,
  voiceServiceOptions: Partial<VoiceServiceOptions>,
  speakOptions: Record<string, unknown>,
  samplesDir: string
): Promise<JobResult> {
  const speaker = voiceServiceOptions.speaker ?? "1";
  const outputPath = path.join(samplesDir, engineType, `${preset}.wav`);

  if (requiresApiKey(engineType) && !voiceServiceOptions.apiKey) {
    return {
      engineType,
      preset,
      speaker,
      file: null,
      format: null,
      bytes: 0,
      ok: false,
      error: buildMissingApiKeyError(engineType, configPath),
      voiceServiceOptions,
      speakOptions,
    };
  }

  const result = await synthesizeAudio(text, voiceServiceOptions, outputPath);

  let file: string | null = null;
  if (result.ok) {
    const extension = result.format;
    file = `samples/${engineType}/${preset}.${extension}`;
  }

  return {
    engineType,
    preset,
    speaker,
    file,
    format: result.ok ? result.format : null,
    bytes: result.bytes,
    ok: result.ok,
    error: result.error,
    voiceServiceOptions,
    speakOptions,
  };
}

export async function runBench(
  options: BenchOptions,
  version: string
): Promise<BenchReport> {
  const config = resolveBenchConfig({
    engines: options.engines,
    presets: options.presets,
    configPath: options.configPath,
    speakerOverride: options.speakerOverride,
  });

  if (!fs.existsSync(options.outdir)) {
    fs.mkdirSync(options.outdir, { recursive: true });
  }

  const samplesDir = path.join(options.outdir, "samples");
  if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(options.outdir, "resolved-config.json"),
    JSON.stringify(config, null, 2)
  );

  const jobs = config.matrix.map((item) => ({
    engineType: item.engineType,
    preset: item.preset,
    voiceServiceOptions: item.voiceServiceOptions,
    speakOptions: (item.resolvedOptions.speakOptions ?? {}) as Record<string, unknown>,
  }));

  const results: JobResult[] = [];

  console.log(`Running ${jobs.length} benchmark jobs with concurrency ${options.concurrency}...`);

  // Simple concurrent runner using a semaphore pattern
  let completedCount = 0;
  const runJobWithLog = async (job: typeof jobs[0], index: number): Promise<JobResult> => {
    console.log(`  [${index + 1}/${jobs.length}] ${job.engineType}/${job.preset}...`);
    const result = await runJob(
      options.text,
      job.engineType,
      job.preset,
      job.voiceServiceOptions,
      job.speakOptions,
      samplesDir
    );
    completedCount++;
    if (result.ok) {
      console.log(`    OK (${result.bytes} bytes, ${result.format})`);
    } else {
      console.log(`    FAILED: ${result.error}`);
    }
    return result;
  };

  // Process jobs with concurrency limit
  const semaphore = new Array(options.concurrency).fill(Promise.resolve());
  const jobPromises: Promise<JobResult>[] = [];

  for (let i = 0; i < jobs.length && !isInterrupted(); i++) {
    const job = jobs[i];
    const slotIndex = i % options.concurrency;

    // Wait for the slot to be available
    semaphore[slotIndex] = semaphore[slotIndex].then(async () => {
      if (isInterrupted()) return;
      const result = await runJobWithLog(job, i);
      results.push(result);
    });

    jobPromises.push(semaphore[slotIndex].then(() => results[results.length - 1]));
  }

  // Wait for all jobs to complete
  await Promise.all(semaphore);

  const items: BenchItem[] = results.map((r) => ({
    engineType: r.engineType,
    preset: r.preset,
    speaker: r.speaker,
    file: r.file,
    format: r.format,
    bytes: r.bytes,
    ok: r.ok,
    error: r.error,
    resolved: {
      voiceServiceOptions: r.voiceServiceOptions,
      speakOptions: r.speakOptions,
    },
  }));

  const report: BenchReport = {
    version,
    timestamp: new Date().toISOString(),
    node: process.version,
    platform: process.platform,
    text: options.text,
    outdir: path.resolve(options.outdir),
    items,
    summary: {
      total: items.length,
      ok: items.filter((i) => i.ok).length,
      failed: items.filter((i) => !i.ok).length,
    },
  };

  return report;
}

export function formatTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}
