# sayx

![Logo](https://github.com/shinshin86/sayx/raw/main/images/logo.png)

Text-to-speech CLI tool powered by [@aituber-onair/voice](https://www.npmjs.com/package/@aituber-onair/voice).

- Japanese documentation: [README.ja.md](./README.ja.md)

## Quick Start

### Using npx (no install required)

```bash
npx @shinshin86/sayx こんにちは
```

By default, `sayx` uses the built-in config (if no config file exists):
- Engine: `voicevox`
- Speaker: `1` (VOICEVOX speaker ID)
- Preset: `default`

This means VOICEVOX must be running locally at `http://127.0.0.1:50021` for the quick start to work.
If you want to use a cloud engine (e.g. OpenAI), set up an API key and pass `--engine openai`.

### Global Install

```bash
npm install -g @shinshin86/sayx
sayx こんにちは
```

### Local Install

```bash
npm install @shinshin86/sayx
```

### Local Development

```bash
git clone <repository>
cd sayx
npm install
npm run build
node dist/cli.js こんにちは
```

## Requirements

- Node.js 20+
- Audio player installed on your system (e.g., `afplay` on macOS, `aplay` on Linux, or media player on Windows)
- A voice engine running (see [Supported Engines](#supported-engines))

## Usage

### Basic Usage

```bash
# Speak text
sayx こんにちは

# Multiple words are joined with spaces
sayx こんにちは 世界

# Read from stdin
echo "Hello, world!" | sayx
cat message.txt | sayx
```

### Options

```bash
sayx [options] [text...]

Options:
  -e, --engine <engineType>  Override engine type
  -s, --speaker <speaker>    Override speaker
  -p, --preset <presetName>  Select preset (default: default)
  --config <path>            Specify config file path
  --out <file>               Save audio to file
  --no-play                  Do not play audio (file output only)
  -V, --version              Output version number
  -h, --help                 Display help
```

### Examples

```bash
# Save to file
sayx "Hello" --out hello.wav

# Save to a specific path without extension (auto-detected extension is appended)
sayx "Hello" --out ./output/hello

# Save without playing
sayx "Hello" --out hello.wav --no-play

# Use OpenAI TTS
sayx "Hello" --engine openai --speaker alloy

# Use a preset
sayx "Hello" --preset narrator
```

## For AI Agents

`sayx` is designed for command-based automation, so agents can chain small CLI actions safely.

### Recommended Agent Flow

1. Run health checks first:
   ```bash
   sayx doctor
   ```
2. Fetch available voices for the target engine:
   ```bash
   sayx list voices --engine aivisSpeech
   ```
3. Speak with an explicit speaker ID:
   ```bash
   sayx "Hello from agent" --engine aivisSpeech --speaker 888753760
   ```

### Example: Random AivisSpeech Voice (2-step)

```bash
# Step 1: get one random speaker id from `list voices`
VOICE_ID=$(sayx list voices --engine aivisSpeech \
  | awk '/^[[:space:]]+[0-9]+:/{gsub(":", "", $1); print $1}' \
  | awk 'BEGIN{srand()} {a[NR]=$1} END{if(NR>0) print a[int(rand()*NR)+1]}')

# Step 2: speak with the selected speaker
sayx "Hello from random AivisSpeech voice" --engine aivisSpeech --speaker "$VOICE_ID"
```

### Headless / CI Usage

Use file output mode when running in non-interactive environments:

```bash
sayx "CI speech test" --engine aivisSpeech --speaker 888753760 --out ./out/sample --no-play
```

### Exit Codes for Automation

- `0`: success (including supported empty voice list and unsupported voice-list engines)
- `1`: command failure (invalid options, missing config/API key, engine connection failure, voice list unreachable, synthesis failure)

## Commands

Main commands and what they do:

- `sayx init`:
  Creates a default config file.
  Config path:
  macOS/Linux: `~/.config/sayx/config.yaml`
  Windows: `%APPDATA%\sayx\config.yaml`
- `sayx config path`:
  Shows the config file path currently in use.
- `sayx list engines`:
  Lists supported engine types.
- `sayx list voices` / `sayx list voices --engine openai`:
  Lists available voices for an engine (engine-dependent; may be unsupported).
- `sayx list presets`:
  Lists preset names defined in config.
- `sayx list presets --verbose`:
  Shows detailed preset settings (`speakOptions` / `engineOverrides`).
- `sayx list presets --json`:
  Outputs presets in JSON format.
- `sayx doctor`:
  Diagnoses engine availability, API key readiness, and voice-list support.
- `sayx doctor --verbose`:
  Includes detailed voice entries when available.
- `sayx bench ...`:
  Runs benchmark jobs across engine/preset combinations and generates reports.

### Benchmark (Compare Engines/Presets)

Examples:

```bash
# Basic usage - uses default engine and preset
sayx bench "Hello, world!"

# Compare multiple engines
sayx bench "Hello" --engines voicevox,openai

# Compare multiple presets
sayx bench "Hello" --presets default,narrator

# Full matrix: multiple engines x multiple presets
sayx bench "Hello" --engines voicevox,openai --presets default,narrator

# Specify output directory
sayx bench "Hello" --outdir ./my-bench-results

# Open report in browser after generation
sayx bench "Hello" --open

# JSON only (skip HTML generation)
sayx bench "Hello" --no-html

# Control parallelism
sayx bench "Hello" --concurrency 4
```

#### Bench Output

By default, benchmark results are saved to `./sayx-bench-YYYYMMDD-HHMMSS/`:

```
sayx-bench-20240115-143022/
├── index.html           # Interactive HTML report
├── report.json          # Machine-readable results
├── resolved-config.json # Configuration used for this run
└── samples/
    ├── voicevox/
    │   └── default.wav
    └── openai/
        └── default.mp3
```

#### Viewing the Report

Open `index.html` directly in your browser. If audio doesn't play due to browser security restrictions, run a local server:

```bash
# Using npx
npx serve ./sayx-bench-20240115-143022

# Or Python
python -m http.server 8000 -d ./sayx-bench-20240115-143022
```

Then open `http://localhost:3000/index.html` (or port 8000 for Python).

#### Bench Options

| Option | Description | Default |
|--------|-------------|---------|
| `--outdir <dir>` | Output directory | `./sayx-bench-YYYYMMDD-HHMMSS` |
| `--engines <list>` | Comma-separated engines | Config default engine |
| `--presets <list>` | Comma-separated presets | `default` preset |
| `--concurrency <n>` | Parallel jobs | 2 |
| `--open` | Open report in browser | No |
| `--no-html` | Skip HTML, JSON only | Generate both |
| `--config <path>` | Config file path | Default location |
| `-s, --speaker` | Override speaker | From config/preset |

### Output File Behavior

- `--out <path>` saves synthesized audio to the target path.
- If `<path>` has no extension, `sayx` detects the generated format and appends the extension automatically.
- Use `--no-play` if you want file output only.

## Configuration

Config file uses YAML format. Run `sayx init` to create a default config.

For local engines (`voicevox`, `voicepeak`, `aivisSpeech`, `openaiCompatible`), if API URL is not set in config,
`sayx` falls back to default local endpoints:
- `voicevox`: `http://127.0.0.1:50021`
- `voicepeak`: `http://127.0.0.1:20202`
- `aivisSpeech`: `http://127.0.0.1:10101`
- `openaiCompatible`: `http://127.0.0.1:8880`

### Example Config

```yaml
default:
  engineType: voicevox
  speaker: "1"
  apiKeyEnv: OPENAI_API_KEY
  voicevoxApiUrl: http://127.0.0.1:50021

presets:
  default:
    speakOptions: {}
    engineOverrides:
      voicevox:
        speaker: "1"
      openai:
        speaker: alloy
        model: tts-1
      xai:
        speaker: Zephyr
      unrealSpeech:
        speaker: af_bella
        bitrate: 192k
      elevenLabs:
        speaker: JBFqnCBsd6RMkjVDRZzb
        model: eleven_multilingual_v2
      inworld:
        speaker: Ashley
        model: inworld-tts-2
      geminiTts:
        speaker: Kore
        model: gemini-2.5-flash-preview-tts
      openaiCompatible:
        speaker: my-voice

  narrator:
    speakOptions:
      speed: 0.9
    engineOverrides:
      openai:
        speaker: onyx
        model: tts-1-hd
      voicevox:
        speaker: "3"
        speedScale: 0.95
```

### Config Priority

Options are resolved in this order (higher priority first):

1. CLI options (`--engine`, `--speaker`, etc.)
2. Preset settings
3. Config default settings
4. Built-in defaults

### API Keys

API keys are resolved from config only (no automatic env var discovery).
Only these engines require API keys: `openai`, `aivisCloud`, `minimax`, `xai`, `unrealSpeech`, `elevenLabs`, `inworld`, `geminiTts`.
Local engines like `voicevox`, `voicepeak`, and `aivisSpeech` do not require an API key.

1. **Config file**:
   ```yaml
   default:
     apiKey: "sk-..."  # Avoid storing secrets in config
   ```

2. **Config + environment variable**:
   ```yaml
   default:
     apiKeyEnv: OPENAI_API_KEY
   ```
   ```bash
   export OPENAI_API_KEY=sk-...
   ```

## Supported Engines

| Engine | Description | Requirements |
|--------|-------------|--------------|
| `voicevox` | Local Japanese TTS | [VOICEVOX](https://voicevox.hiroshiba.jp/) running |
| `voicepeak` | VOICEPEAK TTS | VOICEPEAK API server |
| `openai` | OpenAI TTS API | `apiKey` or `apiKeyEnv` |
| `aivisSpeech` | AIVIS Speech (local) | AIVIS Speech server |
| `aivisCloud` | AIVIS Cloud API | `apiKey` or `apiKeyEnv` |
| `minimax` | MiniMax TTS API | `apiKey` or `apiKeyEnv` |
| `xai` | xAI (Grok) TTS API | `apiKey` or `apiKeyEnv` |
| `unrealSpeech` | Unreal Speech TTS API | `apiKey` or `apiKeyEnv` |
| `elevenLabs` | ElevenLabs TTS API | `apiKey` or `apiKeyEnv` |
| `inworld` | Inworld TTS API | `apiKey` or `apiKeyEnv` |
| `geminiTts` | Google Gemini TTS API | `apiKey` or `apiKeyEnv` |
| `openaiCompatible` | OpenAI-compatible endpoint | Server running (API key optional) |

## Troubleshooting

### "VOICEVOX is not running"

VOICEVOX engine must be running locally. Download from [voicevox.hiroshiba.jp](https://voicevox.hiroshiba.jp/) and start the application.

Default URL: `http://127.0.0.1:50021`

### "No API key found"

Set `apiKey` or `apiKeyEnv` in your config file:

```yaml
default:
  apiKeyEnv: OPENAI_API_KEY
```
```bash
export OPENAI_API_KEY=sk-...
```

### "Playback failed"

Ensure you have an audio player installed:

- **macOS**: `afplay` (pre-installed)
- **Linux**: Install `aplay` (ALSA), `mpg123`, or `sox`
- **Windows**: Should work with default media player

If playback fails, the audio file is saved to a temp location (path shown in error message).

### "No text provided"

Provide text as arguments or via stdin:

```bash
sayx "Hello"
echo "Hello" | sayx
```

### "Voice listing is currently unavailable"

For local engines, this usually means the endpoint is not reachable.

```bash
sayx doctor
sayx list voices --engine aivisSpeech
```

### Bench: Audio doesn't play in browser

Browsers block local file access for security. Use a local server:

```bash
npx serve ./sayx-bench-*
```

## License

MIT
