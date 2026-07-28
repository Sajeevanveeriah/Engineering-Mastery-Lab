import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { emptyProgress, installProgress, seededProgress } from "./support";

const criticalRoutes = [
  "/",
  "/learn",
  "/learn/pathways/controls",
  "/learn/labs/pid?stage=simulate",
  "/learn/flagships/controls",
  "/learn/flagships/robotics-autonomy",
  "/learn/flagships/embedded-electronics-sensing",
  "/learn/flagships/mechanical-design-dynamics",
  "/learn/flagships/applied-ai-ml",
  "/projects",
  "/projects/temperature-controller",
  "/tools",
  "/tools/engineering",
  "/tools/calculators",
  "/tools/cad",
  "/portfolio",
  "/settings"
];

async function seriousOrCriticalViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  return results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.map((node) => node.target.join(" ")).sort()
    }));
}

test.describe("WCAG 2.2 AA automated support", () => {
  for (const route of criticalRoutes) {
    test(`${route} has no serious or critical axe findings`, async ({ page }) => {
      await installProgress(page, route === "/portfolio" ? seededProgress : emptyProgress);
      await page.goto(`#${route}`);
      await expect(page.locator("main#main-content h1").first()).toBeVisible();

      expect(await seriousOrCriticalViolations(page)).toEqual([]);
    });
  }

  test("new-user onboarding has no serious or critical axe findings", async ({ page }) => {
    await installProgress(page, { ...structuredClone(emptyProgress), onboardingComplete: false });
    await page.goto("#/");
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");

    expect(await seriousOrCriticalViolations(page)).toEqual([]);
  });
});
