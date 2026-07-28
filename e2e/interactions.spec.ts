import { expect, test } from "@playwright/test";
import { documentOverflow, emptyProgress, installProgress } from "./support";

test.beforeEach(async ({ page }) => {
  await installProgress(page, emptyProgress);
});

test("skip navigation moves keyboard focus to the main landmark", async ({ page }) => {
  await page.goto("#/");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.locator("main#main-content")).toBeFocused();
});

test("global search traps focus, closes with Escape and restores focus", async ({ page }) => {
  await page.goto("#/");
  const trigger = page.getByRole("button", { name: "Open global search" });
  await trigger.focus();
  await page.keyboard.press("Control+k");

  const dialog = page.getByRole("dialog", { name: "Search Engineering Mastery Lab" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Search Engineering Mastery Lab" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("mobile navigation traps focus, closes with Escape and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("#/");
  const trigger = page.getByRole("button", { name: "Open navigation" });

  await trigger.click();
  const navigation = page.getByRole("navigation", { name: "Primary navigation" });
  await expect(navigation).toBeVisible();
  await expect(page.getByRole("button", { name: "Close navigation" }).first()).toBeFocused();

  for (let index = 0; index < 10; index += 1) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => (
      document.querySelector(".product-rail")?.contains(document.activeElement)
    ))).toBe(true);
  }

  await page.keyboard.press("Escape");
  await expect(navigation).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("laboratory stage changes remain addressable in the URL", async ({ page }) => {
  await page.goto("#/learn/labs/pid?stage=learn");
  await expect(page.getByRole("region", { name: "Learn stage" })).toBeVisible();

  await page.getByRole("button", { name: /^Simulate/ }).click();

  await expect(page.getByRole("region", { name: "Simulate stage" })).toBeVisible();
  await expect.poll(() => new URL(page.url()).hash).toContain("stage=simulate");
});

test("a confirmed progress import can be undone to the exact prior in-session state", async ({ page }) => {
  await page.goto("#/settings");
  const storageKey = "engineering-mastery-lab/progress/v3";
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), storageKey)).not.toBeNull();
  const beforeImport = await page.evaluate((key) => localStorage.getItem(key), storageKey);

  const importedProgress = {
    ...structuredClone(emptyProgress),
    theme: "dark" as const,
    bookmarks: { pid: true },
    achievements: ["local-import-test"]
  };
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Choose progress backup").setInputFiles({
    name: "progress-version-2.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(importedProgress))
  });

  await expect(page.getByRole("status")).toContainText("Progress imported and validated");
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), storageKey)).not.toBe(beforeImport);
  await page.getByRole("button", { name: "Undo last import or reset" }).click();

  await expect(page.getByRole("status")).toContainText("previous in-session state was restored");
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(beforeImport);
});

test.describe("representative zoom reflow", () => {
  for (const [route, zoom] of [
    ["/", 2],
    ["/learn/labs/pid?stage=simulate", 4],
    ["/tools/calculators", 4],
    ["/tools/cad", 2]
  ] as const) {
    test(`${route} reflows without document overflow at ${zoom * 100}% browser zoom equivalent`, async ({ page }) => {
      await page.setViewportSize({
        width: Math.floor(1280 / zoom),
        height: Math.floor(900 / zoom)
      });
      await page.goto(`#${route}`);

      await expect(page.locator("main#main-content h1").first()).toBeVisible();
      expect(await documentOverflow(page)).toBeLessThanOrEqual(1);
    });
  }
});
