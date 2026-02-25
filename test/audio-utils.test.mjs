import test from "node:test";
import assert from "node:assert/strict";
import { detectExtension } from "../dist/index.js";

test("detectExtension returns detected extension for known binary", async () => {
  const pngBytes = Buffer.from([
    0x89, 0x50, 0x4e, 0x47,
    0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52,
  ]);

  const ext = await detectExtension(pngBytes);
  assert.equal(ext, "png");
});

test("detectExtension returns wav as fallback when format is unknown", async () => {
  const unknownBytes = Buffer.from("not-a-real-audio-format", "utf-8");
  const ext = await detectExtension(unknownBytes);
  assert.equal(ext, "wav");
});
