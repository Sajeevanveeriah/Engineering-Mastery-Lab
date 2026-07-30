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

test("editorial artwork selects responsive local sources with intrinsic dimensions", async ({ page }) => {
  await installProgress(page, emptyProgress);

  for (const [width, expectedSource] of [
    [390, "Studio-Mobile-Rev00.webp"],
    [1024, "Studio-Tablet-Rev00.webp"],
    [1440, "Studio-Desktop-Rev00.webp"]
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("#/");

    const scene = page.locator(".engineering-scene");
    const studio = scene.locator(".engineering-scene__studio img");
    await expect(scene).toBeVisible();
    await expect(scene.locator(".engineering-scene__studio source")).toHaveCount(5);
    await expect(studio).toHaveAttribute("width", "1280");
    await expect(studio).toHaveAttribute("height", "853");
    await expect(studio).toHaveAttribute("fetchpriority", "high");
    await expect(studio).toHaveAttribute(
      "alt",
      "Three engineers collaborate around a wheeled mobile robot in an electronics laboratory with test equipment and mechanical components."
    );
    await expect.poll(() => studio.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    expect(await studio.evaluate((image: HTMLImageElement) => image.currentSrc)).toContain(expectedSource);
    expect(await documentOverflow(page), `Today artwork overflow at ${width} CSS px`).toBeLessThanOrEqual(1);
  }
});

test("editorial scene pauses when offscreen", async ({ page }) => {
  await installProgress(page, emptyProgress);
  await page.goto("#/");

  const scene = page.locator(".engineering-scene");
  await expect(scene).toHaveAttribute("data-scene-active", "true");
  await page.locator(".home-closing").scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute("data-scene-active", "false");
});

test("editorial scene honours stored reduced motion", async ({ page }) => {
  await installProgress(page, {
    ...structuredClone(emptyProgress),
    accessibility: { reducedMotion: true, highContrast: false }
  });
  await page.goto("#/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect.poll(() => page.locator(".engineering-scene__studio img").evaluate(
    (image) => getComputedStyle(image).animationName
  )).toBe("none");
});

test("shared shell exposes editorial and workspace interface modes", async ({ page }) => {
  await installProgress(page, emptyProgress);

  for (const [route, expectedMode] of [
    ["/", "editorial"],
    ["/learn", "editorial"],
    ["/learn/modules/EML-E1-D04", "workspace"],
    ["/projects", "workspace"],
    ["/tools", "workspace"],
    ["/portfolio", "workspace"],
    ["/about", "editorial"]
  ] as const) {
    await page.goto(`#${route}`);
    await expect(page.locator(".product-shell")).toHaveAttribute("data-interface-mode", expectedMode);
  }

  await page.goto("#/toolshed");
  await expect(page.locator(".product-shell")).toHaveAttribute("data-interface-mode", "editorial");
  await expect(page.locator(".product-shell")).toHaveAttribute("data-route-family", "secondary");
});

test("desktop sticky controls clear both shell headers", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await installProgress(page, emptyProgress);
  await page.goto("#/learn/roadmap");

  const jump = page.locator(".roadmap-jump");
  await jump.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 240));
  await expect.poll(() => jump.evaluate((element) => Math.round(element.getBoundingClientRect().top))).toBeGreaterThanOrEqual(130);
});

test("forced-colour media mode retains visible primary navigation", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await installProgress(page, emptyProgress);
  await page.goto("#/");

  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  expect(await page.evaluate(() => matchMedia("(forced-colors: active)").matches)).toBe(true);
});

test("forced-colour mode retains visible Settings table-region focus", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.setViewportSize({ width: 390, height: 900 });
  await installProgress(page, emptyProgress);
  await page.goto("#/settings");

  const tableRegion = page.getByRole("region", { name: "Hosted capabilities in this build" });
  await tableRegion.focus();
  await expect(tableRegion).toBeFocused();
  expect(await page.evaluate(() => matchMedia("(forced-colors: active)").matches)).toBe(true);
  expect(await tableRegion.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth
    };
  })).toEqual({
    outlineStyle: "solid",
    outlineWidth: "3px"
  });
});

test("hosted capability table keeps long labels intact at narrow widths", async ({ page }) => {
  await installProgress(page, emptyProgress);
  const runtimeErrors = monitorRuntimeErrors(page);

  for (const width of [320, 390, 600]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("#/settings");

    const hint = page.locator("#settings-capabilities-scroll-hint");
    const region = page.getByRole("region", { name: "Hosted capabilities in this build" });
    await expect(hint).toBeVisible();
    await expect(hint).toHaveText(
      "Scroll horizontally when needed to view all columns. Keyboard users can focus the table region and use the Left and Right Arrow keys."
    );
    await expect(region).toHaveAttribute("aria-labelledby", "settings-capabilities-caption");
    await expect(region).toHaveAttribute("aria-describedby", "settings-capabilities-scroll-hint");
    const table = region.getByRole("table", { name: "Hosted capabilities in this build" });
    const cells = table.locator("th, td");
    await expect(table).toBeVisible();
    await expect(cells).toHaveCount(18);
    await expect(table.getByRole("rowheader", { name: "Synchronisation" })).toBeVisible();
    expect(await region.evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(true);
    expect(await cells.evaluateAll((items) =>
      items.every((cell) => getComputedStyle(cell).overflowWrap === "normal")
    )).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    const fragmentedWords = await cells.evaluateAll((items) => {
      const fragments: string[] = [];
      for (const cell of items) {
        const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const textNode = node as Text;
          for (const match of textNode.data.matchAll(/\p{L}+/gu)) {
            const start = match.index ?? 0;
            const range = document.createRange();
            range.setStart(textNode, start);
            range.setEnd(textNode, start + match[0].length);
            const lineTops = Array.from(
              range.getClientRects(),
              (rect) => Math.round(rect.top * 2) / 2
            );
            if (new Set(lineTops).size > 1) fragments.push(match[0]);
          }
        }
      }
      return fragments;
    });
    expect(fragmentedWords, `settings table fragmented words at ${width} CSS px`).toEqual([]);
    await region.focus();
    await expect(region).toBeFocused();
    await region.evaluate((element) => { element.scrollLeft = 0; });
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    const rightScroll = await region.evaluate((element) => element.scrollLeft);
    await page.keyboard.press("ArrowLeft");
    await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeLessThan(rightScroll);
    expect(await page.evaluate(() => window.scrollX)).toBe(0);
    expect(await documentOverflow(page), `settings overflow at ${width} CSS px`).toBeLessThanOrEqual(1);
  }

  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("#/settings");
  await expect(page.locator("#settings-capabilities-scroll-hint")).toBeVisible();
  const fittedRegion = page.getByRole("region", { name: "Hosted capabilities in this build" });
  await expect(fittedRegion).toHaveAccessibleDescription(
    "Scroll horizontally when needed to view all columns. Keyboard users can focus the table region and use the Left and Right Arrow keys."
  );
  expect(await fittedRegion.evaluate(
    (element) => element.scrollWidth <= element.clientWidth + 1
  )).toBe(true);

  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("#/settings");
  await expect(page.locator("#settings-capabilities-scroll-hint")).toBeHidden();
  expect(runtimeErrors).toEqual([]);
});
