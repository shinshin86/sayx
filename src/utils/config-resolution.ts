import type { EngineOverrides, EngineType, Preset } from "../types.js";

export function resolveSpeaker(
  defaultSpeaker: string | undefined,
  preset: Preset,
  engineType: EngineType,
  speakerOverride?: string
): string {
  let speaker = defaultSpeaker ?? "1";
  const engineOverride = preset.engineOverrides?.[engineType as keyof EngineOverrides];

  if (engineOverride && "speaker" in engineOverride && engineOverride.speaker) {
    speaker = engineOverride.speaker;
  }

  if (speakerOverride) {
    speaker = speakerOverride;
  }

  return speaker;
}
