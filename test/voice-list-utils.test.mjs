import test from "node:test";
import assert from "node:assert/strict";
import { listVoices, listVoicesWithStatus } from "../dist/index.js";

function createResolvedOptions(engineType) {
  return {
    engineType,
    speaker: "1",
    voicevoxApiUrl: "http://127.0.0.1:50021",
    voicepeakApiUrl: "http://127.0.0.1:20202",
    aivisSpeechApiUrl: "http://127.0.0.1:10101",
    openAiCompatibleApiUrl: "http://localhost:8880",
    geminiTtsApiUrl: "https://generativelanguage.googleapis.com",
  };
}

test("listVoicesWithStatus returns unsupported for engines without list support", async () => {
  for (const engine of [
    "voicepeak",
    "xai",
    "unrealSpeech",
    "elevenLabs",
    "inworld",
    "geminiTts",
    "openaiCompatible",
    "aivisCloud",
    "minimax",
  ]) {
    const result = await listVoicesWithStatus(createResolvedOptions(engine));
    assert.equal(result.status, "unsupported");
    assert.deepEqual(result.voices, []);
  }
});

test("listVoicesWithStatus returns static voices for openai", async () => {
  const result = await listVoicesWithStatus(createResolvedOptions("openai"));
  assert.equal(result.status, "ok");
  assert.equal(result.voices.length > 0, true);
  assert.equal(result.voices.some((voice) => voice.startsWith("alloy:")), true);
});

test("listVoicesWithStatus returns unavailable when aivisSpeech endpoint is unreachable", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("connect ECONNREFUSED");
  });

  const result = await listVoicesWithStatus(createResolvedOptions("aivisSpeech"));
  assert.equal(result.status, "unavailable");
  assert.match(result.reason ?? "", /could not reach voice list endpoint/);
});

test("listVoicesWithStatus returns parsed voices for aivisSpeech", async (t) => {
  t.mock.method(globalThis, "fetch", async (url) => {
    const urlString = String(url);
    if (urlString.endsWith("/speakers")) {
      return {
        ok: true,
        status: 200,
        async json() {
          return [
            {
              name: "Anneli",
              styles: [{ id: 888753760, name: "ノーマル" }],
            },
          ];
        },
      };
    }

    return {
      ok: false,
      status: 404,
      async json() {
        return {};
      },
    };
  });

  const result = await listVoicesWithStatus(createResolvedOptions("aivisSpeech"));
  assert.equal(result.status, "ok");
  assert.equal(result.voices.includes("888753760: Anneli (ノーマル)"), true);
});

test("listVoices keeps compatibility and returns null on unavailable", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("connect ETIMEDOUT");
  });

  const voices = await listVoices(createResolvedOptions("voicevox"));
  assert.equal(voices, null);
});
