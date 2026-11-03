import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3105);
const baseURL = process.env.BASE_URL ?? `http://127.0.0.1:${PORT}`;

const desktop = { viewport: { width: 1440, height: 900 } };

export default defineConfig({
  testDir: "./.qa/stage92/specs",
  timeout: 75_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["json", { outputFile: ".qa/stage92/out/results.json" }],
  ],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `npm run start -- -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 180_000,
      },
  projects: [
    {
      name: "chromium-1440",
      use: { ...devices["Desktop Chrome"], ...desktop },
    },
    {
      name: "chrome-1440",
      use: { ...devices["Desktop Chrome"], ...desktop, channel: "chrome" },
    },
    {
      name: "edge-1440",
      use: { ...devices["Desktop Chrome"], ...desktop, channel: "msedge" },
    },
    {
      name: "firefox-1440",
      use: { ...devices["Desktop Firefox"], ...desktop },
    },
    {
      name: "webkit-1440",
      use: { ...devices["Desktop Safari"], ...desktop },
    },
    {
      name: "pixel7-chromium",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "iphone14pro-webkit",
      use: { ...devices["iPhone 14 Pro"] },
    },
    {
      name: "ipad7-webkit",
      use: { ...devices["iPad (gen 7)"] },
    },
  ],
});
