import { expect, test } from "@playwright/test";
import { emptyProgress, installProgress, monitorRuntimeErrors } from "./support";

test("a valid skills domain query applies and exposes its active filter", async ({ page }) => {
  await installProgress(page, emptyProgress);
  const runtimeErrors = monitorRuntimeErrors(page);

  await page.goto("#/learn/skills?domain=robotics");

  await expect(page.getByRole("heading", { level: 1, name: "Skills matrix" })).toBeVisible();
  await expect(page.locator(".matrix-summary")).toContainText("Showing 1 of 15 domains for Robotics");
  await expect(page.locator(".skill-domain")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 2, name: "Robotics" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Foundation" })).toBeVisible();
  await expect.poll(() => new URL(page.url()).hash).toBe("#/learn/skills?domain=robotics");
  expect(runtimeErrors).toEqual([]);

  await page.getByRole("button", { name: "Clear domain filter" }).click();

  await expect.poll(() => new URL(page.url()).hash).toBe("#/learn/skills");
  await expect(page.locator(".matrix-summary")).toContainText("Showing 15 of 15 domains");
  await expect(page.locator(".skill-domain")).toHaveCount(15);
});

test("an invalid skills domain query fails safely to the full matrix", async ({ page }) => {
  await installProgress(page, emptyProgress);
  const runtimeErrors = monitorRuntimeErrors(page);

  await page.goto("#/learn/skills?domain=unsupported-domain");

  await expect(page.getByRole("heading", { level: 1, name: "Skills matrix" })).toBeVisible();
  await expect(page.locator(".matrix-summary")).toContainText("Showing 15 of 15 domains");
  await expect(page.locator(".skill-domain")).toHaveCount(15);
  await expect(page.getByRole("button", { name: "Clear domain filter" })).toHaveCount(0);
  await expect.poll(() => new URL(page.url()).hash).toBe("#/learn/skills?domain=unsupported-domain");
  expect(runtimeErrors).toEqual([]);
});

const roadmapJumps = [
  {
    route: "/learn/roadmap",
    navigationName: "Capability stage shortcuts",
    shortcutName: "E4",
    target: "#stage-E4",
    href: "#/learn/roadmap#stage-E4",
    pageHeading: "Complete engineering curriculum"
  },
  {
    route: "/learn/reboot",
    navigationName: "Milestone shortcuts",
    shortcutName: "M9",
    target: "#milestone-M9",
    href: "#/learn/reboot#milestone-M9",
    pageHeading: "Accelerated reboot roadmap"
  }
] as const;

for (const roadmap of roadmapJumps) {
  test(`${roadmap.shortcutName} shortcut focuses its section without replacing the HashRouter route`, async ({ page }) => {
    await installProgress(page, emptyProgress);
    const runtimeErrors = monitorRuntimeErrors(page);
    await page.goto(`#${roadmap.route}`);
    const initialUrl = page.url();
    const shortcut = page
      .getByRole("navigation", { name: roadmap.navigationName })
      .getByRole("link", { name: roadmap.shortcutName, exact: true });
    const target = page.locator(roadmap.target);

    await expect(shortcut).toHaveAttribute("href", roadmap.href);
    await expect(target).toHaveAttribute("tabindex", "-1");
    await shortcut.focus();
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(initialUrl);
    await expect(target).toBeFocused();
    await expect(target).toBeInViewport({ ratio: 0.1 });
    const verticalClearance = await page.evaluate(({ targetSelector, navigationName }) => {
      const targetElement = document.querySelector(targetSelector);
      const jumpNavigation = Array.from(document.querySelectorAll<HTMLElement>("nav"))
        .find((element) => element.getAttribute("aria-label") === navigationName);
      if (!targetElement || !jumpNavigation) return null;
      return {
        targetTop: targetElement.getBoundingClientRect().top,
        jumpBottom: jumpNavigation.getBoundingClientRect().bottom
      };
    }, { targetSelector: roadmap.target, navigationName: roadmap.navigationName });
    expect(verticalClearance).not.toBeNull();
    expect(verticalClearance!.targetTop).toBeGreaterThanOrEqual(verticalClearance!.jumpBottom - 1);
    await expect(page.getByRole("heading", { level: 1, name: roadmap.pageHeading })).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  });
}

for (const width of [320, 390]) {
  test(`M9 shortcut clears the mobile shell at ${width} CSS px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await installProgress(page, emptyProgress);
    await page.goto("#/learn/reboot");

    const target = page.locator("#milestone-M9");
    await page
      .getByRole("navigation", { name: "Milestone shortcuts" })
      .getByRole("link", { name: "M9", exact: true })
      .click();

    await expect(target).toBeFocused();
    const clearance = await page.evaluate(() => {
      const shell = document.querySelector<HTMLElement>(".product-topbar");
      const milestone = document.querySelector<HTMLElement>("#milestone-M9");
      if (!shell || !milestone) return null;
      return {
        shellBottom: shell.getBoundingClientRect().bottom,
        milestoneTop: milestone.getBoundingClientRect().top
      };
    });
    expect(clearance).not.toBeNull();
    expect(clearance!.milestoneTop).toBeGreaterThanOrEqual(clearance!.shellBottom - 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}

for (const roadmap of roadmapJumps) {
  test(`${roadmap.shortcutName} direct hash navigation resolves its target`, async ({ page }) => {
    await installProgress(page, emptyProgress);
    await page.goto(`#${roadmap.route}${roadmap.target}`);

    const target = page.locator(roadmap.target);
    await expect(target).toBeFocused();
    await expect(target).toBeInViewport({ ratio: 0.1 });
    await expect(page).toHaveURL(new RegExp(`${roadmap.route}#${roadmap.target.slice(1)}$`));
  });
}

test("stored reduced motion makes roadmap jumps immediate", async ({ page }) => {
  await page.addInitScript(() => {
    const original = Element.prototype.scrollIntoView;
    const state = window as typeof window & { __scrollBehaviours?: ScrollBehavior[] };
    state.__scrollBehaviours = [];
    Element.prototype.scrollIntoView = function scrollIntoView(options?: boolean | ScrollIntoViewOptions) {
      if (typeof options === "object" && options.behavior) state.__scrollBehaviours?.push(options.behavior);
      return original.call(this, options);
    };
  });
  await installProgress(page, {
    ...structuredClone(emptyProgress),
    accessibility: { reducedMotion: true, highContrast: false }
  });
  await page.goto("#/learn/roadmap");

  await page
    .getByRole("navigation", { name: "Capability stage shortcuts" })
    .getByRole("link", { name: "E4", exact: true })
    .click();

  await expect(page.locator("#stage-E4")).toBeFocused();
  expect(await page.evaluate(() => (
    window as typeof window & { __scrollBehaviours?: ScrollBehavior[] }
  ).__scrollBehaviours)).toContain("auto");
});
