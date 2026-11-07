import { defineConfig } from "@spicemod/creator";

// Learn more: https://github.com/sanoojes/spicetify-creator
export default defineConfig({
  outDir: "/home/joachim/.spicetify/Extensions",
  framework: "react",
  linter: "biome",
  template: "extension",
  packageManager: "pnpm",
});
