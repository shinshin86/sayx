# sayx (日本語版)

![Logo](https://github.com/shinshin86/sayx/raw/main/images/logo.png)

`sayx` は [@aituber-onair/voice](https://www.npmjs.com/package/@aituber-onair/voice) を利用した、テキスト読み上げ CLI ツールです。

## クイックスタート

```bash
npx @shinshin86/sayx こんにちは
```

```bash
npm install -g @shinshin86/sayx
sayx こんにちは
```

```bash
npm install @shinshin86/sayx
```

設定ファイルがない場合は組み込み既定値を使います。

- Engine: `voicevox`
- Speaker: `1`
- Preset: `default`

この場合、`http://127.0.0.1:50021` で VOICEVOX が起動している必要があります。

## 使い方

```bash
sayx [options] [text...]
```

主なオプション:

- `-e, --engine <engineType>`: エンジン上書き
- `-s, --speaker <speaker>`: 話者上書き
- `-p, --preset <presetName>`: プリセット指定
- `--config <path>`: 設定ファイルパス
- `--out <file>`: 音声をファイル保存
- `--no-play`: 再生せず保存のみ

例:

```bash
sayx "こんにちは"
sayx "こんにちは" --engine openai --speaker alloy
sayx "こんにちは" --out ./output/hello
sayx "こんにちは" --out hello.wav --no-play
echo "stdin から読み上げ" | sayx
```

`--out` で拡張子なしパスを指定した場合、生成された音声形式を判定して拡張子を自動付与します。

## AIエージェント利用

`sayx` はコマンドを小さく組み合わせる運用に向いており、AIエージェントからも扱いやすい設計です。

### 推奨フロー

1. まず診断を実行:
   ```bash
   sayx doctor
   ```
2. 対象エンジンの voice 一覧を取得:
   ```bash
   sayx list voices --engine aivisSpeech
   ```
3. 話者IDを明示して発話:
   ```bash
   sayx "こんにちは（agent）" --engine aivisSpeech --speaker 888753760
   ```

### 例: AivisSpeech の声をランダムに選んで発話（2段階）

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

- `0`: 成功（voice一覧未対応エンジンや空一覧も含む）
- `1`: 失敗（引数不正、設定/APIキー不足、接続不可、voice一覧取得不可、音声生成失敗など）

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
  エンジン x プリセットの組み合わせで音声生成を比較し、レポートを出力します。

## API キー

API キーが必要なエンジン:

- `openai`
- `aivisCloud`
- `minimax`
- `xai`
- `geminiTts`

設定例:

```yaml
default:
  apiKeyEnv: OPENAI_API_KEY
```

```bash
export OPENAI_API_KEY=sk-...
```

ローカルエンジン（`voicevox`, `voicepeak`, `aivisSpeech`, `openaiCompatible`）は、設定ファイルに API URL が未設定でも
以下の既定URLに自動フォールバックします。

- `voicevox`: `http://127.0.0.1:50021`
- `voicepeak`: `http://127.0.0.1:20202`
- `aivisSpeech`: `http://127.0.0.1:10101`
- `openaiCompatible`: `http://127.0.0.1:8880`

## 対応エンジン

| Engine | 概要 | 要件 |
|--------|------|------|
| `voicevox` | ローカル日本語 TTS | VOICEVOX 起動 |
| `voicepeak` | VOICEPEAK TTS | VOICEPEAK API サーバー |
| `openai` | OpenAI TTS API | `apiKey` または `apiKeyEnv` |
| `aivisSpeech` | AIVIS Speech (ローカル) | AIVIS Speech サーバー |
| `aivisCloud` | AIVIS Cloud API | `apiKey` または `apiKeyEnv` |
| `minimax` | MiniMax TTS API | `apiKey` または `apiKeyEnv` |
| `xai` | xAI (Grok) TTS API | `apiKey` または `apiKeyEnv` |
| `geminiTts` | Google Gemini TTS API | `apiKey` または `apiKeyEnv` |
| `openaiCompatible` | OpenAI 互換エンドポイント | サーバー起動（API キー任意） |

## トラブルシューティング

### "Voice listing is currently unavailable"

ローカルエンジンでこの表示が出る場合、APIエンドポイントへ接続できていない可能性があります。

```bash
sayx doctor
sayx list voices --engine aivisSpeech
```

## ライセンス

MIT
