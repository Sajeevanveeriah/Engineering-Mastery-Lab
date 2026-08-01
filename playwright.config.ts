import { defineConfig, devices } from "@playwright/test";

const port = 4174;
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH?.trim();
const channel = process.env.PLAYWRIGHT_CHANNEL?.trim();

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: "line",
  outputDir: "test-results",
  snapshotPathTemplate: "{testDir}/__snapshots__/{platform}/{arg}{ext}",
  projects: [
    {
      name: "functional",
      testIgnore: [
        "**/cad-recovery.spec.ts",
        "**/routes.spec.ts",
        "**/visual-review.spec.ts",
        "**/visual.spec.ts"
      ]
    },
    {
      name: "cad-recovery",
      testMatch: "**/cad-recovery.spec.ts"
    },
    {
      name: "routes",
      testMatch: "**/routes.spec.ts"
    },
    {
      name: "visual-review",
      testMatch: ["**/visual-review.spec.ts", "**/visual.spec.ts"]
    }
  ],
  use: {
    baseURL: `http://127.0.0.1:${port}/Engineering-Mastery-Lab/`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    ...devices["Desktop Chrome"],
    channel: channel || undefined,
    launchOptions: executablePath ? { executablePath } : undefined
  },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}/Engineering-Mastery-Lab/`,
    reuseExistingServer: false,
    timeout: 120_000
  }
});
