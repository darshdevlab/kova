import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "bot-teams.spec.ts",
  reporter: "list",
  outputDir: "/tmp/kova-bot-test-results",
});
