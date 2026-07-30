import { expect, test } from "@playwright/test";
import { emptyProgress, installProgress } from "./support";

test("a transient lazy tool load failure stays local and Retry loads a fresh route component", async ({ page }) => {
  await installProgress(page, emptyProgress);
  let chunkRequests = 0;
  await page.route("**/assets/CadStudioPage-*.js", async (route) => {
    chunkRequests += 1;
    if (chunkRequests === 1) {
      await route.abort("failed");
      return;
    }
    await route.continue();
  });
  await page.goto("#/");

  await page.goto("#/tools/cad");
  await expect(page.getByRole("heading", { name: "CAD Studio could not be opened" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "This screen could not be rendered" })).toHaveCount(0);

  await Promise.all([
    page.waitForEvent("load"),
    page.getByRole("button", { name: "Retry tool" }).click()
  ]);
  await expect(page.locator("main#main-content h1").first()).toHaveText("CAD Studio");
  await expect(page.getByRole("heading", { name: "Parameters" })).toBeVisible();
  expect(chunkRequests).toBeGreaterThanOrEqual(1);

  await page.getByRole("link", { name: "Analyse" }).first().click();
  await expect.poll(() => new URL(page.url()).hash).toBe("#/tools");
  await expect(page.locator("main#main-content h1").first()).toHaveText("Analyse");
  await expect(page.getByRole("heading", { name: "CAD Studio could not be opened" })).toHaveCount(0);
});
