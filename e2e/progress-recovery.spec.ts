import { expect, test } from "@playwright/test";

const progressKey = "engineering-mastery-lab/progress/v5";
const invalidProgressBytes = "{\"version\":5,\"academy\":{\"resumeCursor\":{\"route\":\"https://example.invalid\"}}}";

test("preserves invalid v5 bytes until an explicit recovery decision", async ({ page }) => {
  await page.addInitScript(
    ({ key, bytes, marker }) => {
      if (sessionStorage.getItem(marker) === "seeded") return;
      localStorage.setItem(key, bytes);
      sessionStorage.setItem(marker, "seeded");
    },
    {
      key: progressKey,
      bytes: invalidProgressBytes,
      marker: "engineering-mastery-lab/test-invalid-progress-seeded"
    }
  );
  await page.goto("#/settings");
  const recoveryLink = page.getByRole("link", {
    name: "Progress recovery required. Open Settings."
  });
  await expect(recoveryLink).toBeVisible();
  await recoveryLink.click();
  const recoveryAlert = page.getByRole("alert").filter({
    hasText: "Progress recovery is required."
  });
  await expect(recoveryAlert).toBeVisible();
  await expect.poll(() => page.evaluate(
    (key) => localStorage.getItem(key),
    progressKey
  )).toBe(invalidProgressBytes);

  await page.getByLabel("Colour theme").selectOption("dark");
  await expect.poll(() => page.evaluate(
    (key) => localStorage.getItem(key),
    progressKey
  )).toBe(invalidProgressBytes);

  await page.reload();
  await recoveryLink.click();
  await expect(recoveryAlert).toBeVisible();
  await expect.poll(() => page.evaluate(
    (key) => localStorage.getItem(key),
    progressKey
  )).toBe(invalidProgressBytes);

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset learning records" }).click();

  await expect(recoveryAlert).toHaveCount(0);
  const recovered = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as { version?: unknown } : null;
  }, progressKey);
  expect(recovered).toMatchObject({ version: 5 });
  expect(await page.evaluate((key) => localStorage.getItem(key), progressKey))
    .not.toBe(invalidProgressBytes);
});
