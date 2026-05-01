import { program, Command } from "commander";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import net from "node:net";
import { getConfigPath, initConfig, loadConfig, getDefaultConfig } from "./config.js";
import { resolveOptions, getSupportedEngines } from "./resolver.js";
import { speak, listVoicesWithStatus } from "./voice.js";
import type { VoiceListResult } from "./voice.js";
import { runBench, formatTimestamp, setupInterruptHandler } from "./bench.js";
import { writeJsonReport, writeHtmlReport } from "./report.js";
import type { CliOptions, Config, EngineType, Preset, ResolvedOptions } from "./types.js";
import { requiresApiKey, resolveApiKey } from "./utils/api-key.js";
import { getLocalEngineApiUrlCandidates } from "./utils/local-engine-api.js";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json") as { version: string };

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    const stdin = process.stdin;

    // Check if stdin is a TTY (no piped input)
    if (stdin.isTTY) {
      resolve("");
      return;
    }

    stdin.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    stdin.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf-8").trim());
    });

    stdin.on("error", reject);
  });
}

function openInBrowser(url: string): void {
  const platform = process.platform;
  let command: string;
  let args: string[];

  if (platform === "darwin") {
    command = "open";
    args = [url];
  } else if (platform === "win32") {
    command = "cmd";
    args = ["/c", "start", "", url];
  } else {
    command = "xdg-open";
    args = [url];
  }

  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

function loadConfigWithFallback(configPath?: string): { config: Config; fromFile: boolean } {
  const loaded = loadConfig(configPath);
  if (loaded) {
    return { config: loaded, fromFile: true };
  }
  return { config: getDefaultConfig(), fromFile: false };
}

function formatCompactJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function printPresetDetails(name: string, preset: Preset): void {
  console.log(`  - ${name}`);
  console.log("    speakOptions:");
  formatCompactJson(preset.speakOptions ?? {})
    .split("\n")
    .forEach((line) => {
      console.log(`      ${line}`);
    });
  console.log("    engineOverrides:");
  formatCompactJson(preset.engineOverrides ?? {})
    .split("\n")
    .forEach((line) => {
      console.log(`      ${line}`);
    });
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function getPortFromUrl(targetUrl: URL): number {
  if (targetUrl.port) {
    return Number(targetUrl.port);
  }
  return targetUrl.protocol === "https:" ? 443 : 80;
}

async function canConnectTcp(baseUrl: string, timeoutMs = 2500): Promise<boolean> {
  try {
    const targetUrl = new URL(baseUrl);
    const host = targetUrl.hostname;
    const port = getPortFromUrl(targetUrl);

    await new Promise<void>((resolve, reject) => {
      const socket = net.connect({ host, port });
      const timer = setTimeout(() => {
        socket.destroy();
        reject(new Error("timeout"));
      }, timeoutMs);

      socket.on("connect", () => {
        clearTimeout(timer);
        socket.end();
        resolve();
      });

      socket.on("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });

    return true;
  } catch {
    return false;
  }
}

async function checkReachabilityByUrl(
  baseUrl: string,
  healthPaths: string[]
): Promise<string | null> {
  const normalized = trimTrailingSlash(baseUrl);
  const errors: string[] = [];

  for (const healthPath of healthPaths) {
    try {
      await fetch(`${normalized}${healthPath}`, {
        signal: AbortSignal.timeout(2500),
      });
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${healthPath}: ${message}`);
    }
  }

  const tcpReachable = await canConnectTcp(normalized);
  if (tcpReachable) {
    return null;
  }

  return `could not connect (${errors.join(" | ")})`;
}

async function checkReachabilityCandidates(
  urls: string[],
  healthPaths: string[]
): Promise<string | null> {
  const failures: string[] = [];

  for (const url of urls) {
    const error = await checkReachabilityByUrl(url, healthPaths);
    if (!error) {
      return null;
    }
    failures.push(`${url}: ${error}`);
  }

  return failures.join(" | ");
}

async function checkLocalEngineReachability(engine: EngineType, resolved: ResolvedOptions): Promise<string | null> {
  if (engine === "voicevox") {
    const urls = getLocalEngineApiUrlCandidates("voicevox", resolved.voicevoxApiUrl);
    return checkReachabilityCandidates(urls, ["/version", "/speakers", "/"]);
  }

  if (engine === "voicepeak") {
    const urls = getLocalEngineApiUrlCandidates("voicepeak", resolved.voicepeakApiUrl);
    return checkReachabilityCandidates(urls, ["/version", "/"]);
  }

  if (engine === "aivisSpeech") {
    const urls = getLocalEngineApiUrlCandidates("aivisSpeech", resolved.aivisSpeechApiUrl);
    return checkReachabilityCandidates(urls, ["/version", "/speakers", "/"]);
  }

  if (engine === "openaiCompatible") {
    const urls = getLocalEngineApiUrlCandidates(
      "openaiCompatible",
      resolved.openAiCompatibleApiUrl
    );
    return checkReachabilityCandidates(urls, ["/v1/models", "/"]);
  }

  return null;
}

program
  .name("sayx")
  .description("Text-to-speech CLI tool powered by @aituber-onair/voice")
  .version(packageJson.version)
  .enablePositionalOptions()
  .option("-e, --engine <engineType>", "Override engine type")
  .option("-s, --speaker <speaker>", "Override speaker")
  .option("-p, --preset <presetName>", "Select preset (default: default)")
  .option("--config <path>", "Specify config file path")
  .option("--out <file>", "Save audio to file")
  .option("--no-play", "Do not play audio (file output only)")
  .argument("[text...]", "Text to speak")
  .action(async (textArgs: string[], options: CliOptions & { play?: boolean }) => {
    try {
      // Get text from arguments or stdin
      let text = textArgs.join(" ");

      if (!text) {
        text = await readStdin();
      }

      if (!text) {
        console.error("Error: No text provided. Usage: sayx <text> or echo <text> | sayx");
        process.exit(1);
      }

      const resolved = resolveOptions({
        engine: options.engine,
        speaker: options.speaker,
        preset: options.preset,
        config: options.config,
      });

      const shouldPlay = options.play !== false;

      const result = await speak(text, resolved, {
        outPath: options.out,
        shouldPlay,
      });

      if (!result.success) {
        console.error(`Error: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

// init command
program
  .command("init")
  .description("Create default config file")
  .option("--config <path>", "Specify config file path")
  .action(function (this: Command) {
    const options = this.opts<{ config?: string }>();
    try {
      const result = initConfig(options.config);

      if (result.created) {
        console.log(`Config file created: ${result.path}`);
      } else {
        console.log(`Config file already exists: ${result.path}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

// config command
const configCmd = program.command("config").description("Config management commands");

configCmd
  .command("path")
  .description("Show config file path")
  .action(() => {
    console.log(getConfigPath());
  });

// list command
const listCmd = program
  .command("list")
  .description("List available options")
  .enablePositionalOptions()
  .passThroughOptions();

listCmd
  .command("engines")
  .description("List available engine types")
  .action(() => {
    const engines = getSupportedEngines();
    console.log("Available engines:");
    engines.forEach((engine) => {
      console.log(`  - ${engine}`);
    });
  });

listCmd
  .command("voices")
  .description("List available voices for current engine")
  .option("-e, --engine <engineType>", "Override engine type")
  .option("--config <path>", "Specify config file path")
  .action(async function (this: Command) {
    const options = this.opts<{ engine?: string; config?: string }>();
    try {
      const resolved = resolveOptions({
        engine: options.engine,
        config: options.config,
      });

      console.log(`Engine: ${resolved.engineType}`);
      console.log("");

      const voiceResult = await listVoicesWithStatus(resolved);

      if (voiceResult.status === "unsupported") {
        console.log("Voice listing is not supported for this engine.");
        console.log("Please refer to the engine's documentation for available voices.");
        process.exit(0);
      }

      if (voiceResult.status === "unavailable") {
        console.error("Voice listing is currently unavailable for this engine.");
        if (voiceResult.reason) {
          console.error(`Reason: ${voiceResult.reason}`);
        }
        console.error("Hint: Ensure the engine is running and reachable, then run `sayx doctor`.");
        process.exit(1);
      }

      const voices = voiceResult.voices;

      if (voices.length === 0) {
        console.log("No voices found.");
        process.exit(0);
      }

      console.log("Available voices:");
      voices.forEach((voice) => {
        console.log(`  ${voice}`);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

listCmd
  .command("presets")
  .description("List available presets")
  .option("--config <path>", "Specify config file path")
  .option("--verbose", "Show details for each preset")
  .option("--json", "Print presets as JSON")
  .action(function (this: Command) {
    const options = this.opts<{ config?: string; verbose?: boolean; json?: boolean }>();
    try {
      const { config, fromFile } = loadConfigWithFallback(options.config);

      const presets = config.presets ?? {};
      const presetNames = Object.keys(presets);

      if (presetNames.length === 0) {
        console.log("No presets defined in config.");
        return;
      }

      if (options.json) {
        console.log(formatCompactJson(presets));
        return;
      }

      if (!fromFile) {
        console.log("No config file found. Showing built-in default presets.");
      }

      console.log("Available presets:");
      if (options.verbose) {
        presetNames.forEach((name) => {
          printPresetDetails(name, presets[name]);
        });
      } else {
        presetNames.forEach((name) => {
          console.log(`  - ${name}`);
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

interface DoctorCliOptions {
  config?: string;
  verbose?: boolean;
}

program
  .command("doctor")
  .description("Check engine availability and voice-list support")
  .option("--config <path>", "Specify config file path")
  .option("--verbose", "Show detailed voice entries when available")
  .action(async function (this: Command) {
    const options = this.opts<DoctorCliOptions>();

    try {
      const { config, fromFile } = loadConfigWithFallback(options.config);
      const engines = getSupportedEngines();
      const apiKey = resolveApiKey(config);

      if (!fromFile) {
        console.log("No config file found. Using built-in defaults.");
      }

      console.log(`Config: ${options.config ?? getConfigPath()}`);
      console.log(
        `Cloud API key (openai/xai/unrealSpeech/elevenLabs/geminiTts/aivisCloud/minimax): ${apiKey ? "configured" : "not configured"}`
      );
      console.log("");

      for (const engine of engines) {
        const resolved = resolveOptions({ engine, config: options.config });
        const apiRequired = requiresApiKey(engine);
        const apiReady = !apiRequired || Boolean(resolved.apiKey);

        let available = apiReady;
        let reason: string | null = null;

        if (!apiReady) {
          reason = "API key is required but not configured";
        }

        if (available) {
          try {
            const reachabilityError = await checkLocalEngineReachability(engine, resolved);
            if (reachabilityError) {
              available = false;
              reason = reachabilityError;
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            available = false;
            reason = message;
          }
        }

        let voiceResult: VoiceListResult | null = null;
        if (available) {
          try {
            voiceResult = await listVoicesWithStatus(resolved);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            voiceResult = {
              status: "unavailable",
              voices: [],
              reason: message,
            };
          }
        }

        console.log(`[${engine}] ${available ? "OK" : "NG"}`);
        if (apiRequired) {
          console.log(`  apiKey: ${apiReady ? "configured" : "missing"}`);
        }
        if (reason) {
          console.log(`  reason: ${reason}`);
        }
        if (!available) {
          console.log("  voices: skipped (engine unavailable)");
        } else if (!voiceResult || voiceResult.status === "unsupported") {
          console.log("  voices: connected (listing unavailable for this engine)");
        } else if (voiceResult.status === "unavailable") {
          console.log(`  voices: unavailable (${voiceResult.reason ?? "unknown error"})`);
        } else {
          console.log(`  voices: ${voiceResult.voices.length}`);
          if (options.verbose) {
            voiceResult.voices.forEach((voice) => {
              console.log(`    - ${voice}`);
            });
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

// bench command
interface BenchCliOptions {
  outdir?: string;
  engines?: string;
  presets?: string;
  concurrency?: string;
  open?: boolean;
  html?: boolean;
  config?: string;
  engine?: string;
  preset?: string;
  speaker?: string;
  play?: boolean;
}

program
  .command("bench")
  .description("Generate benchmark report comparing engines/presets")
  .argument("[text...]", "Text to synthesize")
  .option("--outdir <dir>", "Output directory for the report")
  .option("--engines <list>", "Comma-separated list of engines to test")
  .option("--presets <list>", "Comma-separated list of presets to test")
  .option("--concurrency <n>", "Number of parallel jobs", "2")
  .option("--open", "Open the report in browser after generation")
  .option("--no-html", "Skip HTML generation (JSON only)")
  .option("--config <path>", "Specify config file path")
  .option("-e, --engine <engineType>", "Single engine (use --engines for multiple)")
  .option("-p, --preset <name>", "Single preset (use --presets for multiple)")
  .option("-s, --speaker <speaker>", "Override speaker for all tests")
  .option("--play", "Play each generated audio (default: no)")
  .action(async function (this: Command, textArgs: string[]) {
    const options = this.opts<BenchCliOptions>();

    try {
      // Get text from arguments or stdin
      let text = textArgs.join(" ");

      if (!text) {
        text = await readStdin();
      }

      if (!text) {
        console.error("Error: No text provided. Usage: sayx bench <text>");
        process.exit(1);
      }

      // Determine output directory
      const outdir = options.outdir ?? `./sayx-bench-${formatTimestamp()}`;

      // Resolve engines: --engines wins over --engine
      let engines: EngineType[] | undefined;
      if (options.engines) {
        engines = options.engines.split(",").map((e) => e.trim()) as EngineType[];
      } else if (options.engine) {
        engines = [options.engine as EngineType];
      }

      // Resolve presets: --presets wins over --preset
      let presets: string[] | undefined;
      if (options.presets) {
        presets = options.presets.split(",").map((p) => p.trim());
      } else if (options.preset) {
        presets = [options.preset];
      }

      const concurrency = parseInt(options.concurrency ?? "2", 10);
      if (isNaN(concurrency) || concurrency < 1) {
        console.error("Error: --concurrency must be a positive integer");
        process.exit(1);
      }

      // Setup interrupt handler for graceful shutdown
      setupInterruptHandler();

      console.log(`sayx bench v${packageJson.version}`);
      console.log(`Output: ${outdir}`);
      console.log(`Text: "${text}"`);
      console.log("");

      const report = await runBench(
        {
          text,
          outdir,
          engines: engines ?? [],
          presets: presets ?? [],
          concurrency,
          generateHtml: options.html !== false,
          configPath: options.config,
          speakerOverride: options.speaker,
        },
        packageJson.version
      );

      // Write JSON report
      const jsonPath = writeJsonReport(report, outdir);
      console.log("");
      console.log(`Report written: ${jsonPath}`);

      // Write HTML report
      let htmlPath: string | undefined;
      if (options.html !== false) {
        htmlPath = writeHtmlReport(report, outdir);
        console.log(`HTML report: ${htmlPath}`);
      }

      // Print summary
      console.log("");
      console.log("Summary:");
      console.log(`  Total: ${report.summary.total}`);
      console.log(`  Success: ${report.summary.ok}`);
      console.log(`  Failed: ${report.summary.failed}`);

      // Open in browser if requested
      if (options.open && htmlPath) {
        console.log("");
        console.log("Opening report in browser...");
        try {
          openInBrowser(htmlPath);
        } catch {
          console.log(`Could not open browser. Open manually: ${htmlPath}`);
        }
      }

      // Exit with error code if any failed
      if (report.summary.failed > 0) {
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

program.parse();
