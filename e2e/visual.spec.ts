import { expect, test, type Page } from "@playwright/test";
import { emptyProgress, installProgress, seededProgress } from "./support";

const visualTestTime = new Date("2026-07-01T02:00:00.000Z");

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(visualTestTime);
});

async function settleRouteEffects(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

test("Today empty state remains visually stable", async ({ page }) => {
  await installProgress(page, emptyProgress);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("#/");
  await expect(page.getByRole("heading", { level: 1, name: "Today", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Begin the Engineering Academy", exact: true })).toBeVisible();
  await settleRouteEffects(page);

  await expect(page).toHaveScreenshot("today-empty-light-desktop.png", {
    animations: "disabled",
    fullPage: true
  });
});

test("Learn discovery remains visually stable in dark mode", async ({ page }) => {
  await installProgress(page, { ...structuredClone(seededProgress), theme: "dark" });
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("#/learn");
  await expect(page.getByRole("heading", { level: 1, name: "Learn", exact: true })).toBeVisible();
  await settleRouteEffects(page);

  await expect(page).toHaveScreenshot("learn-seeded-dark-desktop.png", {
    animations: "disabled",
    fullPage: true
  });
});

test("mobile shell and navigation remain visually stable", async ({ page }) => {
  await installProgress(page, seededProgress);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("#/");
  await settleRouteEffects(page);
  const navigationTrigger = page.getByRole("button", { name: "Open navigation" });
  await navigationTrigger.click();
  await expect(page.locator("#primary-navigation-drawer")).toHaveClass(/product-rail--open/);
  await expect(page.getByRole("button", { name: "Close navigation" }).first()).toBeFocused();
  await settleRouteEffects(page);
  await expect(navigationTrigger).toHaveAttribute("aria-expanded", "true");

  await expect(page).toHaveScreenshot("today-seeded-mobile-navigation.png", {
    animations: "disabled",
    fullPage: false
  });
});

test("CAD WebGL fallback remains visually stable", async ({ page }) => {
  await installProgress(page, emptyProgress);
  await page.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(
      contextId: string,
      options?: CanvasRenderingContext2DSettings
    ) {
      if (contextId.toLocaleLowerCase("en-AU").includes("webgl")) return null;
      return originalGetContext.call(this, contextId as "2d", options);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("#/tools/cad");

  await expect(page.getByRole("heading", { name: "3D preview unavailable" })).toBeVisible();
  await expect(page).toHaveScreenshot("cad-webgl-fallback.png", {
    animations: "disabled",
    fullPage: true
  });
});

test("engineering motor-sizing workspace remains visually stable", async ({ page }) => {
  await installProgress(page, emptyProgress);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("#/tools/engineering");
  await expect(page.getByRole("heading", { name: "Continuous and peak motor requirements" })).toBeVisible();

  await expect(page).toHaveScreenshot("engineering-motor-sizing-desktop.png", {
    animations: "disabled",
    fullPage: true
  });
});

test("controls flagship workflow remains visually stable", async ({ page }) => {
  await installProgress(page, emptyProgress);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("#/learn/flagships/controls");
  await expect(page.getByRole("heading", {
    level: 1,
    name: "Controls: response, saturation, and robustness",
    exact: true
  })).toBeVisible();

  await expect(page).toHaveScreenshot("flagship-controls-desktop.png", {
    animations: "disabled",
    fullPage: true
  });
});
