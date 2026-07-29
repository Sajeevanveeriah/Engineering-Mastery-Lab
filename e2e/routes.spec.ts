import { expect, test } from "@playwright/test";
import { documentOverflow, emptyProgress, installProgress, monitorRuntimeErrors } from "./support";

const laboratoryRoutes = [
  "/learn/labs/pid",
  "/learn/labs/electrical",
  "/learn/labs/embedded",
  "/learn/labs/plc",
  "/learn/labs/robotics",
  "/learn/labs/ml",
  "/learn/labs/mechanical",
  "/learn/labs/practice"
];

const flagshipRoutes = [
  "/learn/flagships/controls",
  "/learn/flagships/robotics-autonomy",
  "/learn/flagships/embedded-electronics-sensing",
  "/learn/flagships/mechanical-design-dynamics",
  "/learn/flagships/applied-ai-ml"
];

const canonicalRoutes = [
  "/",
  "/learn",
  "/learn/roadmap",
  "/learn/reboot",
  "/learn/reboot/sessions/S001",
  "/learn/reboot/sessions/S110",
  "/learn/modules/EML-E1-D04",
  "/learn/modules/EML-E2-D11",
  "/learn/modules/EML-E3-D18",
  "/learn/modules/EML-E3-D22",
  "/learn/diagnostics",
  "/learn/resources",
  "/learn/pathways",
  "/learn/pathways/controls",
  "/learn/labs",
  ...laboratoryRoutes,
  "/learn/skills",
  "/learn/bookmarks",
  ...flagshipRoutes,
  "/projects",
  "/projects/releases/P1",
  "/projects/releases/P4",
  "/projects/temperature-controller",
  "/tools",
  "/tools/progress",
  "/tools/engineering",
  "/tools/calculators",
  "/tools/converter",
  "/tools/materials",
  "/tools/cad",
  "/tools/workbench",
  "/tools/diagnostics",
  "/portfolio",
  "/portfolio/capstone",
  "/pricing",
  "/settings",
  "/about",
  "/route-that-does-not-exist"
];

const canonicalRouteWidths = [320, 390, 768, 1024, 1440] as const;

test.describe("canonical route and viewport matrix", () => {
  for (const width of canonicalRouteWidths) {
    for (const route of canonicalRoutes) {
      test(`${route} stays usable without horizontal overflow at ${width} CSS px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await installProgress(page, emptyProgress);
        const runtimeErrors = monitorRuntimeErrors(page);

        await page.goto(`#${route}`);

        await expect(page.locator("main#main-content")).toBeVisible();
        await expect(page.locator("main#main-content h1").first()).toBeVisible();
        await expect(page).toHaveTitle(/\S+ \| Engineering Mastery Lab/);
        if (laboratoryRoutes.includes(route)) {
          await expect(page.locator(".product-shell")).toHaveAttribute("data-shell-mode", "focused");
        }
        await expect(page.getByRole("navigation", {
          name: width <= 900 ? "Primary mobile navigation" : "Primary navigation"
        })).toBeVisible();
        expect(await documentOverflow(page), `document overflow on ${route} at ${width} CSS px`).toBeLessThanOrEqual(1);
        expect(runtimeErrors, `runtime errors on ${route} at ${width} CSS px`).toEqual([]);
        await expect(page.getByRole("heading", { name: "This screen could not be rendered" })).toHaveCount(0);
      });
    }
  }
});

const legacyLaboratoryRoutes = laboratoryRoutes.map((route) => [
  route.replace("/learn", ""),
  route
] as const);

const legacyRoutes = [
  ["/labs", "/learn/labs"],
  ...legacyLaboratoryRoutes,
  ["/skills", "/learn/skills"],
  ["/pathways", "/learn/pathways"],
  ["/toolbox", "/tools"],
  ["/cad", "/tools/cad"],
  ["/workbench", "/tools/workbench"],
  ["/diagnostics", "/tools/diagnostics"]
] as const;

test.describe("legacy redirects", () => {
  for (const [legacy, canonical] of legacyRoutes) {
    test(`${legacy} resolves to ${canonical}`, async ({ page }) => {
      await installProgress(page, emptyProgress);
      const runtimeErrors = monitorRuntimeErrors(page);

      await page.goto(`#${legacy}`);

      await expect.poll(() => new URL(page.url()).hash).toBe(`#${canonical}`);
      await expect(page.locator("main#main-content h1").first()).toBeVisible();
      expect(runtimeErrors).toEqual([]);
    });
  }
});

test("legacy redirects replace their browser-history entry", async ({ page }) => {
  await installProgress(page, emptyProgress);
  await page.goto("#/learn");
  await expect(page.getByRole("heading", { level: 1, name: "Learn", exact: true })).toBeVisible();

  await page.evaluate(() => {
    window.location.hash = "#/labs";
  });
  await expect.poll(() => new URL(page.url()).hash).toBe("#/learn/labs");
  await expect(page.getByRole("heading", { level: 1, name: "Learn", exact: true })).toBeVisible();

  await page.goBack();
  await expect.poll(() => new URL(page.url()).hash).toBe("#/learn");
  await expect(page.getByRole("heading", { level: 1, name: "Learn", exact: true })).toBeVisible();
});

test("HashRouter deep links survive a full document reload", async ({ page }) => {
  await installProgress(page, emptyProgress);
  await page.goto("#/tools/calculators");
  await expect(page.getByRole("heading", { level: 1, name: "Engineering Toolbox" })).toBeVisible();

  await page.reload();

  await expect.poll(() => new URL(page.url()).hash).toBe("#/tools/calculators");
  await expect(page.getByRole("heading", { level: 1, name: "Engineering Toolbox" })).toBeVisible();
});
