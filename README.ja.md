# sayx (日本語版)

![Logo](https://github.com/shinshin86/sayx/raw/main/images/logo.png)

[![npm version](https://img.shields.io/npm/v/@shinshin86/sayx.svg)](https://www.npmjs.com/package/@shinshin86/sayx)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/node/v/@shinshin86/sayx.svg)](https://nodejs.org)

**12 種類の TTS エンジン**（ローカル: VOICEVOX, VOICEPEAK, AivisSpeech, … / クラウド: OpenAI, ElevenLabs, Gemini, …）を 1 つの CLI で扱えるテキスト読み上げツールです。テキスト発話、stdin パイプ、音声ファイル保存、エンジン横断のベンチマークまでをコマンドラインだけで完結できます。

sayx は [@aituber-onair/voice](https://www.npmjs.com/package/@aituber-onair/voice) を CLI として薄くラップしたツールです。`@aituber-onair/voice` は [AITuber OnAir](https://aituberonair.com) プロジェクト発の音声合成ライブラリで、複数 TTS エンジンを統一インターフェースで扱うためのものです。sayx の多エンジン対応や話者・プリセットの考え方はこのライブラリ由来で、そこに YAML 設定、ファイル出力、`bench` レポートを追加してコマンドラインから使えるようにしています。

- English documentation: [README.md](./README.md)

## ✨ 特長

- **12 種類の TTS エンジンを 1 つの CLI で**: VOICEVOX, VOICEPEAK, AivisSpeech, AIVIS Cloud, OpenAI, ElevenLabs, Gemini TTS, MiniMax, xAI (Grok), Unreal Speech, Inworld, および任意の OpenAI 互換エンドポイントに対応。
- **ローカル / クラウドを自由に併用**: ローカルエンジンなら API キー不要で完全オフライン実行、クラウド API も `--engine` で即座に切替可能。
- **パイプ親和性**: `echo "hello" | sayx` や `cat message.txt | sayx` のように使えます。
- **YAML プリセット**: 発話設定をプリセットとして再利用可能。エンジンごとの上書きにも対応し、`--preset` で切替えます。
- **ベンチマーク機能内蔵**: `sayx bench` で同じテキストを複数エンジン/プリセットに通して、プレイヤー付きインタラクティブ HTML レポートを生成。
- **AI エージェント / CI 向け**: 終了コードを明確に分離。`--out` / `--no-play` でヘッドレス実行、`sayx doctor` でヘルスチェック。
- **拡張子の自動判定**: `--out ./file` のように拡張子なしで保存先を指定すると、合成された音声形式を検出して適切な拡張子を自動付与。

## 🎯 ユースケース

- **TTS エンジン選定**: `sayx bench` で全エンジンを並べて試聴し、プロジェクトに合うものを選ぶ。
- **AI エージェントに声を与える**: スクリプトから扱いやすい安定した CLI を通じて、エージェントの出力を発話。
- **CI / cron / バッチ**: `--no-play --out` で非対話環境でも音声を生成。
- **デスクトップ用クイック TTS**: 通知・リマインダー・シェルエイリアスなど。

## 📚 目次

- [クイックスタート](#クイックスタート)
- [必要環境](#必要環境)
- [使い方](#使い方)
- [AI エージェント利用](#ai-エージェント利用)
- [コマンド](#コマンド)
- [ベンチマーク（エンジン / プリセット比較）](#ベンチマークエンジン--プリセット比較)
- [設定](#設定)
- [対応エンジン](#対応エンジン)
- [トラブルシューティング](#トラブルシューティング)
- [ライセンス](#ライセンス)

## クイックスタート

### npx を使う（インストール不要）

```bash
npx @shinshin86/sayx こんにちは
```

設定ファイルが存在しない場合、`sayx` は組み込み既定値を使います。

- Engine: `voicevox`
- Speaker: `1`（VOICEVOX の話者 ID）
- Preset: `default`

この場合、ローカルで VOICEVOX が `http://127.0.0.1:50021` で起動している必要があります。
クラウドエンジン（例: OpenAI）を使う場合は、API キーを設定したうえで `--engine openai` を指定してください。

### グローバルインストール

```bash
npm install -g @shinshin86/sayx
sayx こんにちは
```

### ローカルインストール

```bash
npm install @shinshin86/sayx
```

### ローカル開発

```bash
git clone <repository>
cd sayx
npm install
npm run build
node dist/cli.js こんにちは
```

## 必要環境

- Node.js 20+
- システムにインストールされた音声プレイヤー（macOS の `afplay`、Linux の `aplay` 等、Windows の標準プレイヤー）
- 利用したい音声エンジン（[対応エンジン](#対応エンジン)を参照）

## 使い方

### 基本

```bash
# テキストを発話
sayx こんにちは

# 複数語はスペースで連結されます
sayx こんにちは 世界

# stdin から読む
echo "Hello, world!" | sayx
cat message.txt | sayx
```

### オプション

```bash
sayx [options] [text...]

Options:
  -e, --engine <engineType>  エンジン上書き
  -s, --speaker <speaker>    話者上書き
  -p, --preset <presetName>  プリセット指定 (default: default)
  --config <path>            設定ファイルパス指定
  --out <file>               音声をファイル保存
  --no-play                  再生せず保存のみ
  -V, --version              バージョン表示
  -h, --help                 ヘルプ表示
```

### 例

```bash
# ファイルに保存
sayx "こんにちは" --out hello.wav

# 拡張子なしのパスを指定（生成された音声形式に応じて拡張子が自動付与されます）
sayx "こんにちは" --out ./output/hello

# 再生せず保存のみ
sayx "こんにちは" --out hello.wav --no-play

# OpenAI TTS を使う
sayx "Hello" --engine openai --speaker alloy

# プリセットを使う
sayx "こんにちは" --preset narrator
```

### `--out` の挙動

- `--out <path>` で合成音声を指定パスに保存します。
- `<path>` に拡張子がない場合、`sayx` が生成形式を判定して自動的に拡張子を付与します。
- ファイル保存のみ行いたい場合は `--no-play` を併用してください。

## AI エージェント利用

`sayx` はコマンドを小さく組み合わせる運用に向いており、AI エージェントからも扱いやすい設計です。

### 推奨フロー

1. まず診断を実行:
   ```bash
   sayx doctor
   ```
2. 対象エンジンの voice 一覧を取得:
   ```bash
   sayx list voices --engine aivisSpeech
   ```
3. 話者 ID を明示して発話:
   ```bash
   sayx "こんにちは（agent）" --engine aivisSpeech --speaker 888753760
   ```

### 例: AivisSpeech の声をランダムに選んで発話（2 段階）

```bash
# Step 1: list voices からランダムに話者IDを1つ選ぶ
VOICE_ID=$(sayx list voices --engine aivisSpeech \
  | awk '/^[[:space:]]+[0-9]+:/{gsub(":", "", $1); print $1}' \
  | awk 'BEGIN{srand()} {a[NR]=$1} END{if(NR>0) print a[int(rand()*NR)+1]}')

# Step 2: 選んだ話者IDで発話
sayx "ランダム音声テストです" --engine aivisSpeech --speaker "$VOICE_ID"
```

### ヘッドレス / CI 実行

非対話環境では保存専用モードを使ってください:

```bash
sayx "CI speech test" --engine aivisSpeech --speaker 888753760 --out ./out/sample --no-play
```

### 自動化向け終了コード

- `0`: 成功（voice 一覧未対応エンジンや空一覧も含む）
- `1`: 失敗（引数不正、設定 / API キー不足、接続不可、voice 一覧取得不可、音声生成失敗など）

## コマンド

主なコマンドと用途:

- `sayx init`:
  既定の設定ファイルを作成します。
  設定ファイルパス:
  macOS/Linux: `~/.config/sayx/config.yaml`
  Windows: `%APPDATA%\sayx\config.yaml`
- `sayx config path`:
  現在利用される設定ファイルのパスを表示します。
- `sayx list engines`:
  利用可能なエンジン種別を一覧表示します。
- `sayx list voices` / `sayx list voices --engine openai`:
  指定エンジンで利用可能な voice を表示します（エンジンによっては未対応）。
- `sayx list presets`:
  定義済みプリセット名を一覧表示します。
- `sayx list presets --verbose`:
  各プリセットの `speakOptions` / `engineOverrides` を詳細表示します。
- `sayx list presets --json`:
  プリセット情報を JSON 形式で出力します。
- `sayx doctor`:
  各エンジンの利用可否、API キー要否、voice 一覧取得可否を診断します。
- `sayx doctor --verbose`:
  `doctor` の結果に加えて、取得できた voice の詳細も表示します。
- `sayx bench ...`:
  エンジン x プリセットの組み合わせで音声生成を比較し、レポートを出力します（[ベンチマーク](#ベンチマークエンジン--プリセット比較)を参照）。

## ベンチマーク（エンジン / プリセット比較）

`sayx bench` は同じテキストを複数のエンジン・プリセットで一度に合成し、各サンプル音声を保存したうえでブラウザで A/B 比較できるインタラクティブ HTML レポートを生成します。

### 例

```bash
# 基本: デフォルトのエンジンとプリセットで実行
sayx bench "Hello, world!"

# 複数エンジンを比較
sayx bench "Hello" --engines voicevox,openai

# 複数プリセットを比較
sayx bench "Hello" --presets default,narrator

# 完全マトリクス: 複数エンジン x 複数プリセット
sayx bench "Hello" --engines voicevox,openai --presets default,narrator

# 出力ディレクトリを指定
sayx bench "Hello" --outdir ./my-bench-results

# 生成後にブラウザで開く
sayx bench "Hello" --open

# JSON のみ出力（HTML を生成しない）
sayx bench "Hello" --no-html

# 並列度を制御
sayx bench "Hello" --concurrency 4
```

### 出力構成

既定では `./sayx-bench-YYYYMMDD-HHMMSS/` に結果が保存されます。

```
sayx-bench-20240115-143022/
├── index.html           # インタラクティブ HTML レポート
├── report.json          # 機械可読の結果
├── resolved-config.json # 実行時に解決された設定
└── samples/
    ├── voicevox/
    │   └── default.wav
    └── openai/
        └── default.mp3
```

### レポートを開く

`index.html` をブラウザで直接開いてください。ブラウザのセキュリティ制限で音声が再生されない場合は、ローカルサーバ経由でアクセスします。

```bash
# npx を使う
npx serve ./sayx-bench-20240115-143022

# Python を使う
python -m http.server 8000 -d ./sayx-bench-20240115-143022
```

その後 `http://localhost:3000/index.html`（Python の場合は port 8000）を開きます。

### bench オプション

| オプション | 説明 | デフォルト |
|--------|-------------|---------|
| `--outdir <dir>` | 出力ディレクトリ | `./sayx-bench-YYYYMMDD-HHMMSS` |
| `--engines <list>` | カンマ区切りエンジン | 設定のデフォルトエンジン |
| `--presets <list>` | カンマ区切りプリセット | `default` プリセット |
| `--concurrency <n>` | 並列ジョブ数 | 2 |
| `--open` | 生成後ブラウザで開く | しない |
| `--no-html` | HTML を生成せず JSON のみ | 両方生成 |
| `--config <path>` | 設定ファイルパス | 既定の位置 |
| `-s, --speaker` | 話者を上書き | 設定 / プリセット |

## 設定

設定ファイルは YAML 形式です。`sayx init` で既定の設定ファイルを作成できます。

ローカルエンジン（`voicevox`, `voicepeak`, `aivisSpeech`, `openaiCompatible`）は、設定ファイルに API URL が未設定でも以下の既定 URL に自動フォールバックします。

- `voicevox`: `http://127.0.0.1:50021`
- `voicepeak`: `http://127.0.0.1:20202`
- `aivisSpeech`: `http://127.0.0.1:10101`
- `openaiCompatible`: `http://127.0.0.1:8880`

### 設定例

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

### 設定の優先順位

オプションは以下の順序で解決されます（上ほど優先）。

1. CLI オプション（`--engine`, `--speaker` など）
2. プリセット設定
3. 設定ファイルの default
4. 組み込み既定値

### API キー

API キーは設定ファイルからのみ解決されます（環境変数の自動探索はしません）。
API キーが必要なエンジン: `openai`, `aivisCloud`, `minimax`, `xai`, `unrealSpeech`, `elevenLabs`, `inworld`, `geminiTts`。
`voicevox`, `voicepeak`, `aivisSpeech` などローカルエンジンは API キー不要です。

1. **設定ファイルに直接記述**:
   ```yaml
   default:
     apiKey: "sk-..."  # シークレットの直書きは推奨されません
   ```

2. **設定ファイル + 環境変数**:
   ```yaml
   default:
     apiKeyEnv: OPENAI_API_KEY
   ```
   ```bash
   export OPENAI_API_KEY=sk-...
   ```

## 対応エンジン

| Engine | 概要 | 要件 |
|--------|------|------|
| `voicevox` | ローカル日本語 TTS | [VOICEVOX](https://voicevox.hiroshiba.jp/) 起動 |
| `voicepeak` | VOICEPEAK TTS | VOICEPEAK API サーバー |
| `openai` | OpenAI TTS API | `apiKey` または `apiKeyEnv` |
| `aivisSpeech` | AIVIS Speech (ローカル) | AIVIS Speech サーバー |
| `aivisCloud` | AIVIS Cloud API | `apiKey` または `apiKeyEnv` |
| `minimax` | MiniMax TTS API | `apiKey` または `apiKeyEnv` |
| `xai` | xAI (Grok) TTS API | `apiKey` または `apiKeyEnv` |
| `unrealSpeech` | Unreal Speech TTS API | `apiKey` または `apiKeyEnv` |
| `elevenLabs` | ElevenLabs TTS API | `apiKey` または `apiKeyEnv` |
| `inworld` | Inworld TTS API | `apiKey` または `apiKeyEnv` |
| `geminiTts` | Google Gemini TTS API | `apiKey` または `apiKeyEnv` |
| `openaiCompatible` | OpenAI 互換エンドポイント | サーバー起動（API キー任意） |

## トラブルシューティング

### "VOICEVOX is not running"

VOICEVOX エンジンがローカルで起動している必要があります。[voicevox.hiroshiba.jp](https://voicevox.hiroshiba.jp/) からダウンロードして起動してください。

既定 URL: `http://127.0.0.1:50021`

### "No API key found"

設定ファイルで `apiKey` または `apiKeyEnv` を設定してください。

```yaml
default:
  apiKeyEnv: OPENAI_API_KEY
```
```bash
export OPENAI_API_KEY=sk-...
```

### "Playback failed"（再生失敗）

音声プレイヤーがインストールされているか確認してください。

- **macOS**: `afplay`（標準搭載）
- **Linux**: `aplay`（ALSA）, `mpg123`, `sox` のいずれかを導入
- **Windows**: 既定のメディアプレイヤーで動作するはず

再生に失敗した場合、音声ファイルは一時パスに保存されます（エラーメッセージにパスが表示されます）。

### "No text provided"

引数か stdin でテキストを渡してください。

```bash
sayx "こんにちは"
echo "こんにちは" | sayx
```

### "Voice listing is currently unavailable"

ローカルエンジンでこの表示が出る場合、API エンドポイントへ接続できていない可能性があります。

```bash
sayx doctor
sayx list voices --engine aivisSpeech
```

### bench: ブラウザで音声が再生されない

ブラウザはセキュリティのためローカルファイルアクセスをブロックします。ローカルサーバ経由で開いてください。

```bash
npx serve ./sayx-bench-*
```

## ライセンス

MIT
