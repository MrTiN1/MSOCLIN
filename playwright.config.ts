import { defineConfig } from "@playwright/test";
import { existsSync } from "fs";
import { config } from "dotenv";
config({ path: ".env.e2e", quiet: true });
if (
  !process.env.DATABASE_URL ||
  !new URL(process.env.DATABASE_URL).pathname.endsWith("_test")
)
  throw new Error("Playwright requires a dedicated _test database");
export default defineConfig({
  testDir: "tests/e2e",
  workers: 1,
  timeout: 120000,
  expect: { timeout: 15000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      executablePath:
        process.env.CHROMIUM_PATH ??
        (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
      args: ["--no-sandbox"],
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  outputDir: "test-results",
});
