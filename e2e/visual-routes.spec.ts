import { test, expect } from "@playwright/test";

/**
 * ♦ YYC³ 视觉基线 · 全 12 路由快照（P3 · 文档04 ⑪）
 * 每路由 dark/light 双基线（prefers-color-scheme 模拟）；
 * 首页含 LIVE 拓扑脉冲，等 health 状态稳定后截取。
 * 现有 visual.spec.ts（dashboard/branding）保留为兼容层，本文件为全集。
 */

const ROUTES = [
  { path: "/", name: "home" },
  { path: "/dashboard", name: "dashboard" },
  { path: "/models", name: "models" },
  { path: "/playground", name: "playground" },
  { path: "/routing", name: "routing" },
  { path: "/knowledge", name: "knowledge" },
  { path: "/mcp", name: "mcp" },
  { path: "/cache", name: "cache" },
  { path: "/monitor", name: "monitor" },
  { path: "/security", name: "security" },
  { path: "/branding", name: "branding" },
  { path: "/governance", name: "governance" },
] as const;

const THEMES = [
  { scheme: "dark" as const, label: "dark" },
  { scheme: "light" as const, label: "light" },
];

test.describe("all routes · dark & light", () => {
  for (const route of ROUTES) {
    for (const theme of THEMES) {
      test(`${route.name} · ${theme.label}`, async ({ page }) => {
        await page.emulateMedia({
          colorScheme: theme.scheme,
          reducedMotion: "reduce",
        });
        await page.goto(route.path);
        // 等待字体与 health 状态稳定，规避竞态像素差
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(400);
        await expect(page).toHaveScreenshot(`route-${route.name}-${theme.label}.png`, {
          animations: "disabled",
          caret: "hide",
          maxDiffPixelRatio: 0.002,
          // 首页拓扑脉冲为动态发光元素，放宽阈值
          threshold: route.path === "/" ? 0.12 : 0.2,
        });
      });
    }
  }
});
