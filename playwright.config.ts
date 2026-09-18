import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "e2e/reports/html", open: "never" }],
    ["json", { outputFile: "e2e/reports/results.json" }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:4173",
    locale: "zh-CN",
    timezoneId: "Asia/Shanghai",
    screenshot: "only-on-failure",
    // 浏览器解析：默认 Playwright 托管浏览器（CI 经 `playwright install chromium` 提供）；
    // 特殊环境可通过 PLAYWRIGHT_CHROMIUM 指定系统 chromium 绝对路径
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined,
    },
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm preview -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    env: { PORT: "4173" },
  },
})
