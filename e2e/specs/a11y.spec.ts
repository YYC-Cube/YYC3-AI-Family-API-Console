import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const routes = ["/dashboard", "/models", "/playground", "/monitor", "/branding"]

for (const route of routes) {
  test(`${route} has no serious or critical a11y violations`, async ({
    page,
  }) => {
    await page.goto(route)
    await page.waitForLoadState("networkidle")
    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze()
    expect(
      scan.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      ),
    ).toEqual([])
  })
}

test("brand settings persist in the browser", async ({ page }) => {
  await page.goto("/branding")
  const input = page.getByLabel("主标语 / 中文")
  await input.fill("持久化测试标语")
  await page.getByRole("button", { name: "保存更改" }).click()
  await page.reload()
  await expect(input).toHaveValue("持久化测试标语")
})

test("mobile viewport keeps the primary workspace available", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto("/playground")
  await expect(
    page.getByPlaceholder("输入一条消息，开始一次可观测的思考…"),
  ).toBeVisible()
})
