import test from "node:test";
import assert from "node:assert/strict";
import { applyApiUrls, applyEngineOverrides } from "../dist/index.js";

test("applyApiUrls sets configured endpoint URLs", () => {
  const target = {};
  applyApiUrls(target, {
    voicevoxApiUrl: "http://127.0.0.1:50021",
    voicepeakApiUrl: "http://127.0.0.1:52001",
    aivisSpeechApiUrl: "http://127.0.0.1:10101",
    openAiCompatibleApiUrl: "http://localhost:8880",
    geminiTtsApiUrl: "https://generativelanguage.googleapis.com",
  });

  assert.equal(target.voicevoxApiUrl, "http://127.0.0.1:50021");
  assert.equal(target.voicepeakApiUrl, "http://127.0.0.1:52001");
  assert.equal(target.aivisSpeechApiUrl, "http://127.0.0.1:10101");
  assert.equal(target.openAiCompatibleApiUrl, "http://localhost:8880");
  assert.equal(target.geminiTtsApiUrl, "https://generativelanguage.googleapis.com");
});

test("applyEngineOverrides maps voicevox fields", () => {
  const target = {};
  applyEngineOverrides(target, "voicevox", {
    voicevox: {
      speedScale: 1.2,
      pitchScale: 0.3,
      intonationScale: 1.1,
      volumeScale: 0.9,
    },
  });

  assert.equal(target.voicevoxSpeedScale, 1.2);
  assert.equal(target.voicevoxPitchScale, 0.3);
  assert.equal(target.voicevoxIntonationScale, 1.1);
  assert.equal(target.voicevoxVolumeScale, 0.9);
});

test("applyEngineOverrides maps voicepeak fields", () => {
  const target = {};
  applyEngineOverrides(target, "voicepeak", {
    voicepeak: {
      speed: 1.1,
      pitch: 0.2,
    },
  });

  assert.equal(target.voicepeakSpeed, 1.1);
  assert.equal(target.voicepeakPitch, 0.2);
});

test("applyEngineOverrides maps openai fields", () => {
  const target = {};
  applyEngineOverrides(target, "openai", {
    openai: {
      model: "tts-1",
      speed: 0.9,
    },
  });

  assert.equal(target.openAiModel, "tts-1");
  assert.equal(target.openAiSpeed, 0.9);
});

test("applyEngineOverrides maps aivisSpeech fields", () => {
  const target = {};
  applyEngineOverrides(target, "aivisSpeech", {
    aivisSpeech: {
      speedScale: 1.05,
      pitchScale: 0.1,
    },
  });

  assert.equal(target.aivisSpeechSpeedScale, 1.05);
  assert.equal(target.aivisSpeechPitchScale, 0.1);
});

test("applyEngineOverrides maps xai fields", () => {
  const target = {};
  applyEngineOverrides(target, "xai", {
    xai: {
      language: "ja",
      codec: "mp3",
      sampleRate: 24000,
      bitRate: 128000,
    },
  });

  assert.equal(target.xaiLanguage, "ja");
  assert.equal(target.xaiCodec, "mp3");
  assert.equal(target.xaiSampleRate, 24000);
  assert.equal(target.xaiBitRate, 128000);
});

test("applyEngineOverrides maps geminiTts fields", () => {
  const target = {};
  applyEngineOverrides(target, "geminiTts", {
    geminiTts: {
      model: "gemini-2.5-flash-preview-tts",
      languageCode: "ja-JP",
      prompt: "calm",
    },
  });

  assert.equal(target.geminiTtsModel, "gemini-2.5-flash-preview-tts");
  assert.equal(target.geminiTtsLanguageCode, "ja-JP");
  assert.equal(target.geminiTtsPrompt, "calm");
});

test("applyEngineOverrides maps openaiCompatible fields", () => {
  const target = {};
  applyEngineOverrides(target, "openaiCompatible", {
    openaiCompatible: {
      model: "tts-1",
      speed: 1.1,
    },
  });

  assert.equal(target.openAiCompatibleModel, "tts-1");
  assert.equal(target.openAiCompatibleSpeed, 1.1);
});

test("applyEngineOverrides maps aivisCloud fields", () => {
  const target = {};
  applyEngineOverrides(target, "aivisCloud", {
    aivisCloud: {
      speakingRate: 1.15,
      pitch: -0.1,
    },
  });

  assert.equal(target.aivisCloudSpeakingRate, 1.15);
  assert.equal(target.aivisCloudPitch, -0.1);
});

test("applyEngineOverrides maps minimax fields", () => {
  const target = {};
  applyEngineOverrides(target, "minimax", {
    minimax: {
      speed: 1.03,
      pitch: 0.05,
    },
  });

  assert.equal(target.minimaxSpeed, 1.03);
  assert.equal(target.minimaxPitch, 0.05);
});

test("applyEngineOverrides does nothing when override does not exist", () => {
  const target = {};
  applyEngineOverrides(target, "openai", {
    voicevox: {
      speedScale: 1.1,
    },
  });
  assert.deepEqual(target, {});
});
