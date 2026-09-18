import { test, expect } from "@playwright/test"

/**
 * ♦ YYC³ 视觉基线 · 家人徽章专项（P3 · 文档04 ⑪）
 * Governance 页聚合全部 8 位家人 FamilyBadge（motto + OWNER 卡片矩阵），
 * 以卡片为快照单元而非整页，规避动态文案宽度抖动。
 * 8 家人：zhihui/qianxing/bole/wanyu/zongshi/tianshu/xianzhi/lingyun
 * （qianxing 渲染时 data-family="qianhang"，历史命名保持一致）
 */

const FAMILY_KEYS = [
  "zhihui",
  "qianhang",
  "bole",
  "wanyu",
  "zongshi",
  "tianshu",
  "xianzhi",
  "lingyun",
] as const

test.describe("FamilyBadge matrix", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/governance")
    await page.emulateMedia({ reducedMotion: "reduce" })
    // 等待家族卡片矩阵渲染完成
    await page.locator(".family-grid article").first().waitFor()
  })

  for (const key of FAMILY_KEYS) {
    test(`badge baseline · ${key}`, async ({ page }) => {
      const badge = page
        .locator(`.family-grid article [data-family="${key}"]`)
        .first()
      await expect(badge).toBeVisible()
      await expect(badge).toHaveScreenshot(`badge-${key}.png`, {
        animations: "disabled",
        caret: "hide",
        maxDiffPixelRatio: 0.002,
      })
    })
  }

  test("full family grid baseline", async ({ page }) => {
    const grid = page.locator(".family-grid")
    await expect(grid).toHaveScreenshot("family-grid.png", {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.005,
    })
  })

  test("all 8 badges render with family tone", async ({ page }) => {
    for (const key of FAMILY_KEYS) {
      await expect(
        page.locator(`.family-grid article [data-family="${key}"]`),
      ).toHaveCount(1)
    }
  })
})
