import { defineConfig, devices } from "@playwright/test";

const port = 4173;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: "line",
  outputDir: "test-results",
  snapshotPathTemplate: "{testDir}/__snapshots__/{platform}/{arg}{ext}",
  use: {
    baseURL: `http://127.0.0.1:${port}/Engineering-Mastery-Lab/`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    ...devices["Desktop Chrome"]
  },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}/Engineering-Mastery-Lab/`,
    reuseExistingServer: false,
    timeout: 120_000
  }
});
