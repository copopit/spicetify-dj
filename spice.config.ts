import { defineConfig } from "@spicemod/creator";

// Learn more: https://github.com/sanoojes/spicetify-creator
export default defineConfig({
  outDir: "/mnt/c/Users/joach/AppData/Roaming/spicetify/Extensions",
  framework: "react",
  linter: "biome",
  template: "extension",
  packageManager: "pnpm",
});
