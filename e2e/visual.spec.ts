import { test, expect } from "@playwright/test";

test("dashboard visual baseline", async ({ page }) => {
  await page.goto("/dashboard");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page).toHaveScreenshot("dashboard.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixelRatio: 0.002,
  });
});

test("brand studio visual baseline", async ({ page }) => {
  await page.goto("/branding");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page).toHaveScreenshot("branding.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixelRatio: 0.002,
  });
});
