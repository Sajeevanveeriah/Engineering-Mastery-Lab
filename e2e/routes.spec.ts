import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { entitlementIds } from "../src/data/commercial";
import { hostedCapabilityStates } from "../src/lib/ecosystem";
import {
  localBillingProvider,
  openSourceEntitlementProvider
} from "../src/lib/providers";
import { documentOverflow, emptyProgress, installProgress, monitorRuntimeErrors } from "./support";

const paypalSupportUrl = "https://paypal.me/SajeevanVeeriah95";

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
  "/learn/courses",
  "/learn/courses/ACADEMY-E0",
  "/learn/courses/ACADEMY-E0/units/EML-E0-D01",
  "/learn/courses/ACADEMY-E0/units/EML-E0-D01/lessons/EML-E0-D01-L01",
  "/learn/courses/ACADEMY-E4/units/EML-E4-D24/lessons/EML-E4-D24-L01",
  "/learn/courses/ACADEMY-E0/units/EML-E0-D01/assessments/quiz",
  "/learn/courses/ACADEMY-E0/challenge",
  "/learn/review",
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
  "/support",
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

test("Support resolves with the correct title and shared navigation discovery", async ({ page }) => {
  await installProgress(page, emptyProgress);
  await page.goto("#/support");

  await expect(page).toHaveTitle("Support | Engineering Mastery Lab");
  await expect(page.getByRole("heading", {
    level: 1,
    name: "Support Engineering Mastery Lab"
  })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Product information" })
    .getByRole("link", { name: "Support", exact: true })).toBeVisible();

  await page.goto("#/more");
  await expect(page.getByRole("link", {
    name: "Support Engineering Mastery Lab",
    exact: true
  })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("#/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Product information" })
    .getByRole("link", { name: "Support", exact: true })).toBeVisible();
});

test("Support web mode uses one explicit safe PayPal anchor without an eager request", async ({ page }) => {
  const paypalRequests: string[] = [];
  page.on("request", (request) => {
    const hostname = new URL(request.url()).hostname.toLocaleLowerCase("en-AU");
    if (hostname === "paypal.me" || hostname.endsWith(".paypal.me")
      || hostname === "paypal.com" || hostname.endsWith(".paypal.com")) {
      paypalRequests.push(request.url());
    }
  });
  await installProgress(page, emptyProgress);
  await page.goto("#/support");

  const supportLink = page.getByRole("link", { name: "Support via PayPal" });
  await expect(supportLink).toHaveAttribute("href", paypalSupportUrl);
  await expect(supportLink).toHaveAttribute("target", "_blank");
  await expect(supportLink).toHaveAttribute("rel", "noopener noreferrer");
  await expect(supportLink).toHaveAttribute("referrerpolicy", "no-referrer");
  await expect(page.getByText("Opens PayPal in a new tab.", { exact: true })).toBeVisible();
  await expect(page.locator("main#main-content iframe")).toHaveCount(0);
  await expect(page.locator("main#main-content form")).toHaveCount(0);
  await expect(page.locator('script[src*="paypal" i]')).toHaveCount(0);
  expect(paypalRequests).toEqual([]);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileTarget = await supportLink.boundingBox();
  expect(mobileTarget).not.toBeNull();
  expect(mobileTarget?.width).toBeGreaterThanOrEqual(44);
  expect(mobileTarget?.height).toBeGreaterThanOrEqual(44);
  expect(await documentOverflow(page)).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 720, height: 450 });
  expect(await documentOverflow(page), "Support overflow at a 200 percent zoom equivalent viewport")
    .toBeLessThanOrEqual(1);
});

test("Support Tauri mode presents selectable text without remote navigation", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      configurable: true,
      value: {}
    });
  });
  await installProgress(page, emptyProgress);
  await page.goto("#/support");

  await expect(page.getByText("Open this address in your normal browser:", {
    exact: true
  })).toBeVisible();
  const address = page.getByText(paypalSupportUrl, { exact: true });
  await expect(address).toBeVisible();
  expect(await address.evaluate((element) => getComputedStyle(element).userSelect))
    .not.toBe("none");
  await expect(page.getByRole("link", { name: "Support via PayPal" })).toHaveCount(0);
  await expect(page.locator(`main#main-content a[href="${paypalSupportUrl}"]`)).toHaveCount(0);
});

test("Support preserves progress, entitlements and unavailable hosted capabilities", async ({ page }) => {
  expect(localBillingProvider.available).toBe(false);
  expect(entitlementIds.every((entitlement) => openSourceEntitlementProvider.has(entitlement)))
    .toBe(true);
  for (const capability of [
    hostedCapabilityStates.identity,
    hostedCapabilityStates.synchronisation,
    hostedCapabilityStates.billing,
    hostedCapabilityStates.cohorts,
    hostedCapabilityStates.collaboration
  ]) {
    expect(capability).toMatchObject({
      status: "unavailable",
      executionBoundary: "none",
      networkAccess: false,
      hostedService: false
    });
  }

  await installProgress(page, emptyProgress);
  await page.goto("#/");
  await expect(page.locator("main#main-content h1").first()).toBeVisible();
  const before = await page.evaluate(() => Object.fromEntries(
    Object.entries(localStorage)
      .filter(([key]) => key.startsWith("engineering-mastery-lab/progress/"))
      .sort(([left], [right]) => left.localeCompare(right, "en-AU"))
  ));

  await page.getByRole("navigation", { name: "Product information" })
    .getByRole("link", { name: "Support", exact: true }).click();
  await expect(page.getByRole("heading", {
    level: 1,
    name: "Support Engineering Mastery Lab"
  })).toBeVisible();
  const after = await page.evaluate(() => Object.fromEntries(
    Object.entries(localStorage)
      .filter(([key]) => key.startsWith("engineering-mastery-lab/progress/"))
      .sort(([left], [right]) => left.localeCompare(right, "en-AU"))
  ));

  expect(after).toEqual(before);
});

test("Support source contains no embedded payment integration", async () => {
  const supportSourcePath = fileURLToPath(new URL("../src/pages/Support.tsx", import.meta.url));
  const source = await readFile(supportSourcePath, "utf8");

  expect(source).toContain(`const PAYPAL_SUPPORT_URL = "${paypalSupportUrl}";`);
  expect(source).not.toMatch(/<script\b|<iframe\b|<form\b/i);
  expect(source).not.toMatch(/paypal\.Buttons|paypalobjects|client[-_]?id|client[-_]?secret|access[-_]?token|webhook/i);
  expect(source).not.toMatch(/fetch\s*\(|XMLHttpRequest|WebSocket/i);
});
