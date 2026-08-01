import { expect, test, type Page } from "@playwright/test";
import { emptyProgress, installProgress, monitorRuntimeErrors } from "./support";

async function installCadRenderProbe(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const state = window as typeof window & {
      __cadDrawCalls?: number;
      __setCadDocumentHidden?: (hidden: boolean) => void;
    };
    state.__cadDrawCalls = 0;

    const instrumentPrototype = (prototype: object | undefined) => {
      if (!prototype) return;
      for (const methodName of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"]) {
        const descriptor = Object.getOwnPropertyDescriptor(prototype, methodName);
        if (typeof descriptor?.value !== "function") continue;
        const original = descriptor.value as (...args: unknown[]) => unknown;
        Object.defineProperty(prototype, methodName, {
          ...descriptor,
          value: function countedDraw(this: unknown, ...args: unknown[]) {
            state.__cadDrawCalls = (state.__cadDrawCalls ?? 0) + 1;
            return Reflect.apply(original, this, args);
          }
        });
      }
    };

    instrumentPrototype(WebGLRenderingContext?.prototype);
    instrumentPrototype(WebGL2RenderingContext?.prototype);

    let hidden = false;
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => hidden
    });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => hidden ? "hidden" : "visible"
    });
    state.__setCadDocumentHidden = (nextHidden) => {
      hidden = nextHidden;
      document.dispatchEvent(new Event("visibilitychange"));
    };
  });
}

async function cadDrawCalls(page: Page): Promise<number> {
  return page.evaluate(() => (
    window as typeof window & { __cadDrawCalls?: number }
  ).__cadDrawCalls ?? -1);
}

async function cadRenderingIsIdle(page: Page): Promise<boolean> {
  const before = await cadDrawCalls(page);
  await page.waitForTimeout(250);
  return await cadDrawCalls(page) === before;
}

async function makeWebGlUnavailable(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const state = window as typeof window & { __cadWebGlBlocked?: boolean };
    state.__cadWebGlBlocked = true;
    HTMLCanvasElement.prototype.getContext = function getContext(
      contextId: string,
      options?: CanvasRenderingContext2DSettings
    ) {
      if (state.__cadWebGlBlocked && contextId.toLocaleLowerCase("en-AU").includes("webgl")) return null;
      return originalGetContext.call(this, contextId as "2d", options);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
}

test.beforeEach(async ({ page }) => {
  await installProgress(page, emptyProgress);
});

test("WebGL unavailable before initialisation keeps CAD and the shell usable", async ({ page }) => {
  await makeWebGlUnavailable(page);
  const runtimeErrors = monitorRuntimeErrors(page);

  await page.goto("#/tools/cad");

  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "3D preview unavailable" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to More" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Parameters" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Export design" })).toBeVisible();
  await expect(page.getByRole("region", { name: /Dimensioned drawing fallback/ })).toBeVisible();
  await expect(page.locator("canvas[data-cad-preview]")).toHaveCount(0);
  expect(runtimeErrors).toEqual([]);
});

test("renderer construction failure after a positive capability check is contained", async ({ page }) => {
  await page.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    let webGl2Requests = 0;
    HTMLCanvasElement.prototype.getContext = function getContext(
      contextId: string,
      options?: CanvasRenderingContext2DSettings
    ) {
      if (contextId.toLocaleLowerCase("en-AU") === "webgl2") {
        webGl2Requests += 1;
        if (webGl2Requests === 1) {
          return {
            getExtension: () => ({ loseContext: () => undefined })
          } as unknown as WebGL2RenderingContext;
        }
        return null;
      }
      if (contextId.toLocaleLowerCase("en-AU").includes("webgl")) return null;
      return originalGetContext.call(this, contextId as "2d", options);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });

  await page.goto("#/tools/cad");

  await expect(page.getByRole("heading", { name: "3D preview unavailable" })).toBeVisible();
  await expect(page.locator("main#main-content")).toContainText("CAD Studio");
  await expect(page.getByRole("heading", { name: "This screen could not be rendered" })).toHaveCount(0);
});

test("retry remounts the renderer without duplicating its canvas", async ({ page }) => {
  await makeWebGlUnavailable(page);
  await page.goto("#/tools/cad");
  await expect(page.getByRole("heading", { name: "3D preview unavailable" })).toBeVisible();

  await page.evaluate(() => {
    (window as typeof window & { __cadWebGlBlocked?: boolean }).__cadWebGlBlocked = false;
  });
  await page.getByRole("button", { name: "Retry 3D preview" }).click();

  await expect(page.getByRole("heading", { name: "3D preview unavailable" })).toHaveCount(0);
  await expect(page.locator("canvas[data-cad-preview]")).toHaveCount(1);
  await expect(page.locator("canvas[data-cad-preview]")).toBeVisible();
});

test("a user can leave CAD after a local WebGL failure", async ({ page }) => {
  await makeWebGlUnavailable(page);
  await page.goto("#/tools/cad");
  await page.getByRole("link", { name: "Back to More" }).click();

  await expect.poll(() => new URL(page.url()).hash).toBe("#/more");
  await expect(page.locator("main#main-content h1").first()).toHaveText("More");
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
});

test("normal WebGL initialisation succeeds and unmount cleanup removes its canvas", async ({ page }) => {
  const runtimeErrors = monitorRuntimeErrors(page);
  await page.goto("#/tools/cad");

  const canvas = page.locator("canvas[data-cad-preview]");
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toBeVisible();
  const framebuffer = await canvas.evaluate(async (element) => {
    return new Promise<{ errorCode: number; uniqueSampledColours: number }>((resolve) => {
      document.dispatchEvent(new Event("visibilitychange"));
      requestAnimationFrame(() => {
        const context = element.getContext("webgl2");
        if (!context) {
          resolve({ errorCode: -1, uniqueSampledColours: 0 });
          return;
        }
        const width = context.drawingBufferWidth;
        const height = context.drawingBufferHeight;
        const pixels = new Uint8Array(width * height * 4);
        context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, pixels);
        const sampledColours = new Set<string>();
        const stride = Math.max(1, Math.floor(width * height / 20_000));
        for (let pixel = 0; pixel < width * height; pixel += stride) {
          const offset = pixel * 4;
          sampledColours.add(
            `${pixels[offset]},${pixels[offset + 1]},${pixels[offset + 2]},${pixels[offset + 3]}`
          );
        }
        resolve({
          errorCode: context.getError(),
          uniqueSampledColours: sampledColours.size
        });
      });
    });
  });
  expect(framebuffer.errorCode).toBe(0);
  expect(framebuffer.uniqueSampledColours).toBeGreaterThan(16);
  expect(runtimeErrors).toEqual([]);

  await page.getByRole("link", { name: "More" }).first().click();
  await expect.poll(() => new URL(page.url()).hash).toBe("#/more");
  await expect(page.locator("canvas[data-cad-preview]")).toHaveCount(0);

  await page.goto("#/tools/cad");
  await expect(page.locator("canvas[data-cad-preview]")).toHaveCount(1);
  expect(runtimeErrors).toEqual([]);
});

test("a lost WebGL context enters the local fallback and can retry cleanly", async ({ page }) => {
  const runtimeErrors = monitorRuntimeErrors(page);
  await page.goto("#/tools/cad");

  const canvas = page.locator("canvas[data-cad-preview]");
  await expect(canvas).toBeVisible();
  const contextLossPrevented = await canvas.evaluate((element) => {
    const event = new Event("webglcontextlost", { cancelable: true });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(contextLossPrevented).toBe(true);
  await expect(page.getByRole("heading", { name: "3D preview unavailable" })).toBeVisible();
  await expect(canvas).toHaveCount(0);

  await page.getByRole("button", { name: "Retry 3D preview" }).click();
  await expect(page.getByRole("heading", { name: "3D preview unavailable" })).toHaveCount(0);
  await expect(page.locator("canvas[data-cad-preview]")).toHaveCount(1);
  expect(runtimeErrors).toEqual([]);
});

test("document visibility pauses CAD rendering and resumes after invalidation", async ({ page }) => {
  await installCadRenderProbe(page);
  await page.goto("#/tools/cad");
  await expect(page.locator("canvas[data-cad-preview]")).toBeVisible();
  await expect.poll(() => cadDrawCalls(page)).toBeGreaterThan(0);

  await page.evaluate(() => {
    const setter = (
      window as typeof window & { __setCadDocumentHidden?: (hidden: boolean) => void }
    ).__setCadDocumentHidden;
    if (!setter) throw new Error("CAD document visibility probe was not installed.");
    setter(true);
  });
  await page.waitForTimeout(100);
  const hiddenDrawCalls = await cadDrawCalls(page);
  await page.evaluate(() => {
    const root = document.documentElement;
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  });
  await page.waitForTimeout(250);
  expect(await cadDrawCalls(page)).toBe(hiddenDrawCalls);

  await page.evaluate(() => {
    const setter = (
      window as typeof window & { __setCadDocumentHidden?: (hidden: boolean) => void }
    ).__setCadDocumentHidden;
    if (!setter) throw new Error("CAD document visibility probe was not installed.");
    setter(false);
  });
  await expect.poll(() => cadDrawCalls(page)).toBeGreaterThan(hiddenDrawCalls);
});

test("an offscreen CAD viewport stops rendering and resumes after re-entry", async ({ page }) => {
  await installCadRenderProbe(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("#/tools/cad");

  const canvas = page.locator("canvas[data-cad-preview]");
  await expect(canvas).toBeVisible();
  await expect.poll(() => cadDrawCalls(page)).toBeGreaterThan(0);
  await page.evaluate(() => {
    const spacer = document.createElement("div");
    spacer.dataset.cadScrollProbe = "true";
    spacer.style.height = "200vh";
    document.body.append(spacer);
    spacer.scrollIntoView({ block: "end" });
  });
  await expect.poll(() => canvas.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.bottom <= 0 || bounds.top >= window.innerHeight;
  })).toBe(true);
  await page.waitForTimeout(100);
  const offscreenDrawCalls = await cadDrawCalls(page);
  await page.evaluate(() => {
    const root = document.documentElement;
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  });
  await page.waitForTimeout(250);
  expect(await cadDrawCalls(page)).toBe(offscreenDrawCalls);

  await canvas.scrollIntoViewIfNeeded();
  await expect.poll(() => canvas.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.bottom > 0 && bounds.top < window.innerHeight;
  })).toBe(true);
  await expect.poll(() => cadDrawCalls(page)).toBeGreaterThan(offscreenDrawCalls);
});

test("render-on-demand settles, redraws on resize and preserves OrbitControls updates", async ({ page }) => {
  await installCadRenderProbe(page);
  const runtimeErrors = monitorRuntimeErrors(page);
  await page.goto("#/tools/cad");

  const canvas = page.locator("canvas[data-cad-preview]");
  await expect(canvas).toBeVisible();
  await expect.poll(() => cadDrawCalls(page)).toBeGreaterThan(0);
  await page.waitForTimeout(100);
  const idleDrawCalls = await cadDrawCalls(page);
  await page.waitForTimeout(250);
  expect(await cadDrawCalls(page)).toBe(idleDrawCalls);

  await page.getByRole("checkbox", { name: "Wireframe" }).check();
  await expect.poll(() => cadDrawCalls(page)).toBeGreaterThan(idleDrawCalls);
  await page.waitForTimeout(100);
  const modelIdleDrawCalls = await cadDrawCalls(page);
  await page.waitForTimeout(250);
  expect(await cadDrawCalls(page)).toBe(modelIdleDrawCalls);

  await page.getByRole("button", { name: /^front$/i }).click();
  await expect.poll(() => cadDrawCalls(page)).toBeGreaterThan(modelIdleDrawCalls);
  await page.waitForTimeout(100);
  const viewIdleDrawCalls = await cadDrawCalls(page);
  await page.waitForTimeout(250);
  expect(await cadDrawCalls(page)).toBe(viewIdleDrawCalls);

  await page.evaluate(() => {
    const root = document.documentElement;
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  });
  await expect.poll(() => cadDrawCalls(page)).toBeGreaterThan(viewIdleDrawCalls);
  await page.waitForTimeout(100);
  const themeIdleDrawCalls = await cadDrawCalls(page);
  await page.waitForTimeout(250);
  expect(await cadDrawCalls(page)).toBe(themeIdleDrawCalls);

  await canvas.scrollIntoViewIfNeeded();
  const initialCanvasSize = await canvas.evaluate((element) => ({
    height: element.height,
    width: element.width
  }));
  await page.setViewportSize({ width: 960, height: 720 });
  await expect.poll(() => canvas.evaluate((element, initialSize) => (
    element.width !== initialSize.width || element.height !== initialSize.height
  ), initialCanvasSize)).toBe(true);
  await canvas.scrollIntoViewIfNeeded();
  await expect.poll(() => cadDrawCalls(page)).toBeGreaterThan(themeIdleDrawCalls);
  await page.waitForTimeout(100);
  const resizedIdleDrawCalls = await cadDrawCalls(page);
  await page.waitForTimeout(250);
  expect(await cadDrawCalls(page)).toBe(resizedIdleDrawCalls);

  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("CAD preview canvas did not expose pointer bounds.");
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 64, bounds.y + bounds.height / 2 + 24, { steps: 4 });
  await page.mouse.up();
  await expect.poll(() => cadDrawCalls(page)).toBeGreaterThan(resizedIdleDrawCalls);
  const firstDampedDrawCalls = await cadDrawCalls(page);
  await page.waitForTimeout(250);
  expect(await cadDrawCalls(page)).toBeGreaterThan(firstDampedDrawCalls);

  await expect.poll(() => cadRenderingIsIdle(page), { timeout: 12_000 }).toBe(true);
  expect(runtimeErrors).toEqual([]);
});
