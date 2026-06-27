import os from "node:os";
import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

function defaultBrowsersPath() {
  const home = os.homedir();

  if (process.platform === "darwin") {
    return path.join(home, "Library/Caches/ms-playwright");
  }

  if (process.platform === "win32") {
    return path.join(home, "AppData/Local/ms-playwright");
  }

  return path.join(home, ".cache/ms-playwright");
}

// Agent's sandbox redirects browser installs to a temp dir that is wiped each run.
// Prefer the permanent user cache unless the caller set a custom path outside sandbox.
const browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH;
if (!browsersPath || browsersPath.includes("sandbox-cache")) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = defaultBrowsersPath();
}

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60_000,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "DATABASE_URL=file:./e2e.db VITE_E2E=true pnpm dev --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
