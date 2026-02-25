import test from "node:test";
import assert from "node:assert/strict";
import {
  requiresApiKey,
  resolveApiKey,
  buildApiKeyHelp,
  buildMissingApiKeyError,
} from "../dist/index.js";

test("requiresApiKey returns true only for cloud engines needing credentials", () => {
  assert.equal(requiresApiKey("openai"), true);
  assert.equal(requiresApiKey("aivisCloud"), true);
  assert.equal(requiresApiKey("minimax"), true);

  assert.equal(requiresApiKey("voicevox"), false);
  assert.equal(requiresApiKey("voicepeak"), false);
  assert.equal(requiresApiKey("aivisSpeech"), false);
});

test("resolveApiKey prefers direct apiKey over env value", () => {
  process.env.SAYX_TEST_KEY = "env-value";
  const result = resolveApiKey({
    default: {
      engineType: "openai",
      apiKey: "direct-value",
      apiKeyEnv: "SAYX_TEST_KEY",
    },
    presets: {},
  });
  assert.equal(result, "direct-value");
});

test("resolveApiKey resolves env value when direct apiKey is absent", () => {
  process.env.SAYX_TEST_KEY = "env-only";
  const result = resolveApiKey({
    default: {
      engineType: "openai",
      apiKeyEnv: "SAYX_TEST_KEY",
    },
    presets: {},
  });
  assert.equal(result, "env-only");
});

test("resolveApiKey returns undefined when no key is configured", () => {
  delete process.env.SAYX_TEST_KEY_MISSING;
  const result = resolveApiKey({
    default: {
      engineType: "openai",
      apiKeyEnv: "SAYX_TEST_KEY_MISSING",
    },
    presets: {},
  });
  assert.equal(result, undefined);
});

test("buildApiKeyHelp and buildMissingApiKeyError include guidance and engine name", () => {
  const help = buildApiKeyHelp("/tmp/config.yaml");
  assert.match(help, /default\.apiKey/);
  assert.match(help, /\/tmp\/config\.yaml/);

  const error = buildMissingApiKeyError("openai", "/tmp/config.yaml");
  assert.match(error, /openai/);
  assert.match(error, /default\.apiKey/);
});
