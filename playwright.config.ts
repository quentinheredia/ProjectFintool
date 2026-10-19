import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3200);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: { baseURL: BASE_URL },
  projects: [
    { name: "api", testMatch: /.*\.api\.spec\.ts/ },
    {
      name: "mobile",
      testMatch: /.*\.ui\.spec\.ts/,
      use: { ...devices["Pixel 7"], channel: process.env.E2E_BROWSER_CHANNEL ?? "msedge", viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
