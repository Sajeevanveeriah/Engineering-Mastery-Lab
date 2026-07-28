import { expect, test, type Page } from "@playwright/test";
import { emptyProgress, installProgress, monitorRuntimeErrors } from "./support";

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
  await expect(page.getByRole("link", { name: "Back to Analyse" })).toBeVisible();
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
  await page.getByRole("link", { name: "Back to Analyse" }).click();

  await expect.poll(() => new URL(page.url()).hash).toBe("#/tools");
  await expect(page.locator("main#main-content h1").first()).toHaveText("Analyse");
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
      requestAnimationFrame(() => requestAnimationFrame(() => {
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
      }));
    });
  });
  expect(framebuffer.errorCode).toBe(0);
  expect(framebuffer.uniqueSampledColours).toBeGreaterThan(16);
  expect(runtimeErrors).toEqual([]);

  await page.getByRole("link", { name: "Analyse" }).first().click();
  await expect.poll(() => new URL(page.url()).hash).toBe("#/tools");
  await expect(page.locator("canvas[data-cad-preview]")).toHaveCount(0);

  await page.goto("#/tools/cad");
  await expect(page.locator("canvas[data-cad-preview]")).toHaveCount(1);
  expect(runtimeErrors).toEqual([]);
});
