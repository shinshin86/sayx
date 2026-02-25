import test from "node:test";
import assert from "node:assert/strict";
import { resolveSpeaker } from "../dist/index.js";

test("resolveSpeaker uses default speaker when no overrides exist", () => {
  const speaker = resolveSpeaker("1", {}, "voicevox");
  assert.equal(speaker, "1");
});

test("resolveSpeaker falls back to '1' when default speaker is undefined", () => {
  const speaker = resolveSpeaker(undefined, {}, "voicevox");
  assert.equal(speaker, "1");
});

test("resolveSpeaker applies engine override speaker", () => {
  const speaker = resolveSpeaker(
    "1",
    {
      engineOverrides: {
        openai: {
          speaker: "alloy",
        },
      },
    },
    "openai"
  );
  assert.equal(speaker, "alloy");
});

test("resolveSpeaker prioritizes CLI speaker override", () => {
  const speaker = resolveSpeaker(
    "1",
    {
      engineOverrides: {
        openai: {
          speaker: "alloy",
        },
      },
    },
    "openai",
    "nova"
  );
  assert.equal(speaker, "nova");
});
