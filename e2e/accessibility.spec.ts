import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { emptyProgress, installProgress, seededProgress } from "./support";

const criticalRoutes = [
  "/",
  "/learn",
  "/learn/roadmap",
  "/learn/reboot",
  "/learn/reboot/sessions/S001",
  "/learn/courses",
  "/learn/courses/ACADEMY-E0",
  "/learn/courses/ACADEMY-E0/units/EML-E0-D01",
  "/learn/courses/ACADEMY-E0/units/EML-E0-D01/lessons/EML-E0-D01-L01",
  "/learn/courses/ACADEMY-E1/units/EML-E1-D04/lessons/EML-E1-D04-L01",
  "/learn/courses/ACADEMY-E0/units/EML-E0-D01/assessments/quiz",
  "/learn/review",
  "/learn/modules/EML-E1-D04",
  "/learn/modules/EML-E2-D11",
  "/learn/modules/EML-E3-D18",
  "/learn/modules/EML-E3-D22",
  "/learn/diagnostics",
  "/learn/resources",
  "/learn/pathways/controls",
  "/learn/labs/pid?stage=simulate",
  "/learn/flagships/controls",
  "/learn/flagships/robotics-autonomy",
  "/learn/flagships/embedded-electronics-sensing",
  "/learn/flagships/mechanical-design-dynamics",
  "/learn/flagships/applied-ai-ml",
  "/projects",
  "/projects/releases/P4",
  "/projects/temperature-controller",
  "/tools",
  "/tools/progress",
  "/tools/engineering",
  "/tools/calculators",
  "/tools/cad",
  "/portfolio",
  "/portfolio/capstone",
  "/settings"
];

async function axeViolations(page: Page) {
  await page.locator("main#main-content > .page").evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
  });

  const results = await new AxeBuilder({ page }).analyze();

  return results.violations
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.map((node) => node.target.join(" ")).sort(),
      details: violation.nodes.map((node) => ({
        target: node.target.join(" "),
        failureSummary: node.failureSummary,
        checks: [...node.any, ...node.all, ...node.none].map((check) => ({
          message: check.message,
          data: check.data
        }))
      }))
    }));
}

test.describe("automated accessibility support", () => {
  for (const route of criticalRoutes) {
    test(`${route} has no axe findings`, async ({ page }) => {
      await installProgress(page, route === "/portfolio" ? seededProgress : emptyProgress);
      await page.goto(`#${route}`);
      await expect(page.locator("main#main-content h1").first()).toBeVisible();

      expect(await axeViolations(page)).toEqual([]);
    });
  }

  test("optional profile editor has no axe findings", async ({ page }) => {
    await installProgress(page, { ...structuredClone(emptyProgress), onboardingComplete: false });
    await page.goto("#/settings");
    await page.getByRole("button", { name: /profile$/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");

    expect(await axeViolations(page)).toEqual([]);
  });

  test("open mobile navigation has no axe findings", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installProgress(page, emptyProgress);
    await page.goto("#/");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();

    expect(await axeViolations(page)).toEqual([]);
  });
});
