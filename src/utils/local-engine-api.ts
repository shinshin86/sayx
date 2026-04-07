export type LocalEngineType = "voicevox" | "voicepeak" | "aivisSpeech" | "openaiCompatible";

export const LOCAL_ENGINE_DEFAULT_URLS: Record<LocalEngineType, string> = {
  voicevox: "http://127.0.0.1:50021",
  voicepeak: "http://127.0.0.1:20202",
  aivisSpeech: "http://127.0.0.1:10101",
  openaiCompatible: "http://localhost:8880",
};

const LOCAL_ENGINE_URL_CANDIDATES: Record<LocalEngineType, string[]> = {
  voicevox: ["http://127.0.0.1:50021", "http://localhost:50021"],
  voicepeak: ["http://127.0.0.1:20202", "http://localhost:20202"],
  aivisSpeech: ["http://127.0.0.1:10101", "http://localhost:10101"],
  openaiCompatible: ["http://localhost:8880", "http://127.0.0.1:8880"],
};

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export function resolveLocalEngineApiUrl(
  engine: LocalEngineType,
  configuredUrl?: string
): string {
  const base = configuredUrl ?? LOCAL_ENGINE_DEFAULT_URLS[engine];
  return normalizeBaseUrl(base);
}

export function getLocalEngineApiUrlCandidates(
  engine: LocalEngineType,
  configuredUrl?: string
): string[] {
  const primary = resolveLocalEngineApiUrl(engine, configuredUrl);
  const defaults = LOCAL_ENGINE_URL_CANDIDATES[engine]
    .map((candidate) => normalizeBaseUrl(candidate))
    .filter((candidate) => candidate !== primary);
  return [primary, ...defaults];
}
