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

test.describe("canonical route smoke at 320 CSS px", () => {
  for (const route of canonicalRoutes) {
    test(`${route} keeps the application usable without horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await installProgress(page, emptyProgress);
      const runtimeErrors = monitorRuntimeErrors(page);

      await page.goto(`#${route}`);

      await expect(page.locator("main#main-content")).toBeVisible();
      await expect(page.locator("main#main-content h1").first()).toBeVisible();
      await expect(page).toHaveTitle(/\S+ \| Engineering Mastery Lab/);
      await expect(page.getByRole("navigation", { name: "Primary mobile navigation" })).toBeVisible();
      expect(await documentOverflow(page), `document overflow on ${route}`).toBeLessThanOrEqual(1);
      expect(runtimeErrors, `runtime errors on ${route}`).toEqual([]);
      await expect(page.getByRole("heading", { name: "This screen could not be rendered" })).toHaveCount(0);
    });
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
