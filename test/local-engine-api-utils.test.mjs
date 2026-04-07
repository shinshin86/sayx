import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  LOCAL_ENGINE_DEFAULT_URLS,
  resolveLocalEngineApiUrl,
  getLocalEngineApiUrlCandidates,
  resolveOptions,
} from "../dist/index.js";

test("resolveLocalEngineApiUrl falls back to built-in default URL", () => {
  assert.equal(
    resolveLocalEngineApiUrl("voicevox"),
    LOCAL_ENGINE_DEFAULT_URLS.voicevox
  );
  assert.equal(
    resolveLocalEngineApiUrl("voicepeak"),
    LOCAL_ENGINE_DEFAULT_URLS.voicepeak
  );
  assert.equal(
    resolveLocalEngineApiUrl("aivisSpeech"),
    LOCAL_ENGINE_DEFAULT_URLS.aivisSpeech
  );
  assert.equal(
    resolveLocalEngineApiUrl("openaiCompatible"),
    LOCAL_ENGINE_DEFAULT_URLS.openaiCompatible
  );
});

test("resolveLocalEngineApiUrl keeps configured URL and normalizes trailing slash", () => {
  assert.equal(
    resolveLocalEngineApiUrl("aivisSpeech", "http://localhost:10101/"),
    "http://localhost:10101"
  );
});

test("getLocalEngineApiUrlCandidates returns primary first and includes localhost fallback", () => {
  const candidates = getLocalEngineApiUrlCandidates(
    "aivisSpeech",
    "http://127.0.0.1:10101/"
  );

  assert.equal(candidates[0], "http://127.0.0.1:10101");
  assert.equal(candidates.includes("http://localhost:10101"), true);
  assert.equal(new Set(candidates).size, candidates.length);
});

test("resolveOptions applies default local URLs when config omits them", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sayx-test-"));
  const configPath = path.join(tempDir, "config.yaml");
  fs.writeFileSync(
    configPath,
    [
      "default:",
      "  engineType: voicevox",
      "  speaker: \"1\"",
      "presets:",
      "  default: {}",
      "",
    ].join("\n"),
    "utf-8"
  );

  const voicevox = resolveOptions({ engine: "voicevox", config: configPath });
  const voicepeak = resolveOptions({ engine: "voicepeak", config: configPath });
  const aivisSpeech = resolveOptions({ engine: "aivisSpeech", config: configPath });
  const openaiCompatible = resolveOptions({ engine: "openaiCompatible", config: configPath });

  assert.equal(voicevox.voicevoxApiUrl, LOCAL_ENGINE_DEFAULT_URLS.voicevox);
  assert.equal(voicepeak.voicepeakApiUrl, LOCAL_ENGINE_DEFAULT_URLS.voicepeak);
  assert.equal(aivisSpeech.aivisSpeechApiUrl, LOCAL_ENGINE_DEFAULT_URLS.aivisSpeech);
  assert.equal(
    openaiCompatible.openAiCompatibleApiUrl,
    LOCAL_ENGINE_DEFAULT_URLS.openaiCompatible
  );
});
