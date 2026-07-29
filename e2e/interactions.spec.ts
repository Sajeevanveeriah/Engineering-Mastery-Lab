import { expect, test } from "@playwright/test";
import { createV4Progress, documentOverflow, emptyProgress, installProgress } from "./support";

test.beforeEach(async ({ page }) => {
  await installProgress(page, emptyProgress);
});

test("skip navigation moves keyboard focus to the main landmark", async ({ page }) => {
  await page.goto("#/");
  await expect(page.getByRole("heading", { level: 1, name: "Today" })).toBeVisible();

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.locator("main#main-content")).toBeFocused();
});

test("primary navigation preserves the route-change focus contract", async ({ page }) => {
  await page.goto("#/");
  await expect(page.getByRole("heading", { level: 1, name: "Today" })).toBeVisible();

  await page.getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: "Learn" })
    .click();

  await expect.poll(() => new URL(page.url()).hash).toBe("#/learn");
  await expect(page.getByRole("heading", { level: 1, name: "Learn", exact: true })).toBeVisible();
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
  const storageKey = "engineering-mastery-lab/progress/v4";
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), storageKey)).not.toBeNull();
  const beforeImport = await page.evaluate((key) => localStorage.getItem(key), storageKey);

  const importedProgress = {
    ...structuredClone(emptyProgress),
    theme: "dark" as const,
    bookmarks: { pid: true },
    achievements: ["local-import-test"]
  };
  await page.getByLabel("Choose progress backup").setInputFiles({
    name: "progress-version-2.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(importedProgress))
  });

  await expect(page.getByRole("region", { name: "progress-version-2.json" })).toBeVisible();
  await page.getByRole("button", { name: "Replace with validated import" }).click();
  await expect(page.getByRole("status")).toContainText("Progress imported and validated");
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), storageKey)).not.toBe(beforeImport);
  await page.getByRole("button", { name: "Undo last import or reset" }).click();

  await expect(page.getByRole("status")).toContainText("exact previous exported state was restored");
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(beforeImport);
});

test("System appearance follows operating-system changes while manual choices do not", async ({ page }) => {
  await installProgress(page, createV4Progress(emptyProgress, { themePreference: "system" }));
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("#/settings");
  await expect.poll(() => page.locator("html").getAttribute("data-theme")).toBe("light");
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "system");

  await page.emulateMedia({ colorScheme: "dark" });
  await expect.poll(() => page.locator("html").getAttribute("data-theme")).toBe("dark");

  await page.getByLabel("Colour theme").selectOption("light");
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect.poll(() => page.locator("html").getAttribute("data-theme")).toBe("light");
});

test("weekly review records save locally and survive reload", async ({ page }) => {
  await page.goto("#/tools/progress");
  await expect(page.getByRole("heading", { level: 2, name: /weekly review$/ })).toBeVisible();

  await page.getByRole("spinbutton", { name: "Completed blocks", exact: true }).fill("9");
  await page.getByRole("spinbutton", { name: "Evidence items retained", exact: true }).fill("3");
  await page.getByLabel("Short reflection").fill("State estimation improved; actuator evidence remains next.");
  await page.getByRole("button", { name: "Save weekly review" }).click();

  await expect(page.getByRole("status")).toContainText(/^Saved \d{4}-W\d{2} locally\.$/);
  const savedReview = await page.evaluate(() => {
    const raw = localStorage.getItem("engineering-mastery-lab/progress/v4");
    const parsed = raw ? JSON.parse(raw) as { weeklyReviews: Record<string, unknown> } : null;
    return parsed ? Object.values(parsed.weeklyReviews)[0] : null;
  });
  expect(savedReview).toMatchObject({
    completedBlocks: 9,
    evidenceCount: 3,
    reflection: "State estimation improved; actuator evidence remains next."
  });

  await page.reload();
  await expect(page.getByRole("spinbutton", { name: "Completed blocks", exact: true })).toHaveValue("9");
  await expect(page.getByRole("spinbutton", { name: "Evidence items retained", exact: true })).toHaveValue("3");
  await expect(page.getByLabel("Short reflection")).toHaveValue("State estimation improved; actuator evidence remains next.");
});

test("session save confirmation survives the progress-state rerender", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("#/learn/reboot/sessions/S001");
  await expect(page.getByRole("heading", { level: 1, name: "What a robot is" })).toBeVisible();
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));

  const record = page.locator("aside.session-record");
  await record.getByLabel("Notes").fill("Confirmation persistence regression.");
  await record.getByRole("button", { name: "Save local record" }).click();

  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem("engineering-mastery-lab/progress/v4");
    const progress = raw ? JSON.parse(raw) as {
      curriculumRecords?: Record<string, { notes?: string }>;
    } : null;
    return progress?.curriculumRecords?.S001?.notes;
  })).toBe("Confirmation persistence regression.");

  await expect(page.getByRole("status")).toHaveText("Local session record saved.");
});

test.describe("curriculum responsive width matrix", () => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    test(`complete roadmap has no document overflow at ${width} CSS pixels`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("#/learn/roadmap");
      await expect(page.getByRole("heading", { level: 1, name: "Complete engineering curriculum" })).toBeVisible();
      expect(await documentOverflow(page)).toBeLessThanOrEqual(1);
    });
  }
});

test.describe("representative zoom reflow", () => {
  for (const [route, zoom] of [
    ["/", 2],
    ["/learn/labs/pid?stage=simulate", 4],
    ["/tools/calculators", 4],
    ["/tools/cad", 2],
    ["/learn/roadmap", 2],
    ["/learn/reboot/sessions/S110", 4],
    ["/learn/modules/EML-E2-D11", 4]
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
