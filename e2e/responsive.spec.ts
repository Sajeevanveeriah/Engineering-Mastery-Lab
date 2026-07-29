import { expect, test } from "@playwright/test";
import { documentOverflow, emptyProgress, installProgress, monitorRuntimeErrors } from "./support";

const widths = [320, 390, 768, 1024, 1440];
const primaryRoutes = ["/", "/learn", "/projects", "/tools", "/portfolio"];

for (const width of widths) {
  test(`primary destinations reflow at ${width} CSS px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await installProgress(page, emptyProgress);
    const runtimeErrors = monitorRuntimeErrors(page);

    for (const route of primaryRoutes) {
      await page.goto(`#${route}`);
      await expect(page.locator("main#main-content h1").first()).toBeVisible();
      expect(await documentOverflow(page), `${route} overflow at ${width} CSS px`).toBeLessThanOrEqual(1);
    }

    const navigationName = width <= 900 ? "Primary mobile navigation" : "Primary navigation";
    await expect(page.getByRole("navigation", { name: navigationName })).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  });
}

test("laboratory routes use focused shell mode without changing catalogue mode", async ({ page }) => {
  await installProgress(page, emptyProgress);
  await page.goto("#/learn/labs");
  await expect(page.locator(".product-shell")).toHaveAttribute("data-shell-mode", "standard");

  await page.goto("#/learn/labs/pid?stage=learn");
  await expect(page.locator(".product-shell")).toHaveAttribute("data-shell-mode", "focused");
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open navigation" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Close navigation" })).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 900 });
  const menuTrigger = page.getByRole("button", { name: "Open navigation" });
  await expect(menuTrigger).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toHaveCount(0);
  await menuTrigger.click();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await expect(page.locator("#primary-navigation-drawer").getByRole("button", { name: "Close navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menuTrigger).toBeFocused();
});

test("stored reduced-motion and contrast preferences reach the document", async ({ page }) => {
  await installProgress(page, {
    ...structuredClone(emptyProgress),
    accessibility: { reducedMotion: true, highContrast: true }
  });
  await page.goto("#/tools");

  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(page.locator("html")).toHaveAttribute("data-contrast", "high");
  await expect(page.locator("main#main-content h1").first()).toBeVisible();
});

test("forced-colour media mode retains visible primary navigation", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await installProgress(page, emptyProgress);
  await page.goto("#/");

  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  expect(await page.evaluate(() => matchMedia("(forced-colors: active)").matches)).toBe(true);
});
