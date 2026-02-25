import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      cli: "src/cli.ts",
    },
    format: ["esm"],
    dts: true,
    clean: true,
    target: "node20",
    shims: false,
    banner: {
      js: "#!/usr/bin/env node",
    },
    noExternal: ["@aituber-onair/voice"],
  },
  {
    entry: {
      index: "src/index.ts",
    },
    format: ["esm"],
    dts: true,
    clean: false,
    target: "node20",
    shims: false,
    noExternal: ["@aituber-onair/voice"],
  },
]);
