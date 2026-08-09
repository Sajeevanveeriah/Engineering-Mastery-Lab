import { expect, test } from "@playwright/test";
import { closeSync, ftruncateSync, openSync } from "node:fs";
import {
  createAsciiCubeStl,
  createLargeBinaryStl,
  createMalformedTruncatedStl,
  createTwoComponentMillimetre3mf
} from "../src/lib/cad/meshFixtures";
import { emptyProgress, installProgress, monitorRuntimeErrors } from "./support";

test.beforeEach(async ({ page }) => {
  await installProgress(page, emptyProgress);
});

test("CAD Studio exposes the four-panel workspace and keyboard command palette", async ({ page }) => {
  const runtimeErrors = monitorRuntimeErrors(page);
  await page.goto("#/tools/cad");

  await expect(page.getByRole("heading", { name: "CAD Studio" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Model tree" })).toBeVisible();
  await expect(page.getByRole("region", { name: "CAD viewport" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Parameters" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "History and diagnostics" })).toBeVisible();
  await expect(page.getByRole("tree", { name: "CAD document model tree" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Command history" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Diagnostics" })).toBeVisible();

  await page.getByRole("button", { name: /Commands/ }).click();
  await expect(page.getByRole("dialog", { name: "CAD commands" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "CAD commands" })).toHaveCount(0);
  await page.keyboard.press("2");
  await expect(page.getByRole("button", { name: "front", exact: true })).toHaveAttribute("aria-pressed", "true");

  const modelTreeResize = page.getByRole("separator", { name: "Resize model tree" });
  const before = await modelTreeResize.getAttribute("aria-valuenow");
  await modelTreeResize.focus();
  await page.keyboard.press("ArrowRight");
  await expect(modelTreeResize).not.toHaveAttribute("aria-valuenow", before ?? "");
  expect(runtimeErrors).toEqual([]);
});

test("ASCII STL imports through the worker, exposes assumed units and supports undoable scaling", async ({ page }) => {
  const runtimeErrors = monitorRuntimeErrors(page);
  await page.goto("#/tools/cad");
  await page.getByLabel("Choose a CAD document, STL, 3MF, STEP, IGES or BREP file").setInputFiles({
    name: "ascii-cube.stl",
    mimeType: "model/stl",
    buffer: Buffer.from(createAsciiCubeStl())
  });

  await expect(page.getByText("ascii-cube.stl", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/STL stores no units/)).toBeVisible();
  await expect(page.getByText("12 triangles", { exact: true })).toBeVisible();
  await expect(page.getByText(/Selected: ascii-cube.stl/)).toBeVisible();

  await page.getByLabel("STL source unit").selectOption("in");
  await expect(page.getByText("25.4000x", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByText("1.0000x", { exact: true })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test("3MF import reports source units, components and materials", async ({ page }) => {
  const runtimeErrors = monitorRuntimeErrors(page);
  await page.goto("#/tools/cad");
  await page.getByLabel("Choose a CAD document, STL, 3MF, STEP, IGES or BREP file").setInputFiles({
    name: "two-component.3mf",
    mimeType: "model/3mf",
    buffer: Buffer.from(createTwoComponentMillimetre3mf())
  });

  await expect(page.getByText(/3MF source unit: millimeter\. Components: 2\. Materials: 1\./)).toBeVisible();
  await expect(page.getByText("24 triangles", { exact: true })).toBeVisible();
  await expect(page.getByText("2", { exact: true }).first()).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test("structured mesh errors retain the previous rendered reference", async ({ page }) => {
  const runtimeErrors = monitorRuntimeErrors(page);
  await page.goto("#/tools/cad");
  const input = page.getByLabel("Choose a CAD document, STL, 3MF, STEP, IGES or BREP file");
  await input.setInputFiles({
    name: "known-good.stl",
    mimeType: "model/stl",
    buffer: Buffer.from(createAsciiCubeStl())
  });
  await expect(page.getByText("12 triangles", { exact: true })).toBeVisible();

  await input.setInputFiles({
    name: "truncated.stl",
    mimeType: "model/stl",
    buffer: Buffer.from(createMalformedTruncatedStl())
  });
  await expect(page.getByRole("alert").first()).toContainText("TRUNCATED");
  await expect(page.getByText(/previous model remains active/i)).toBeVisible();
  await expect(page.getByText("known-good.stl", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("12 triangles", { exact: true })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test("pre-read size gates refuse empty and oversized files while retaining the prior model", async ({ page }, testInfo) => {
  await page.goto("#/tools/cad");
  const input = page.getByLabel("Choose a CAD document, STL, 3MF, STEP, IGES or BREP file");
  await input.setInputFiles({ name: "prior-size-gate.stl", mimeType: "model/stl", buffer: Buffer.from(createAsciiCubeStl()) });
  await expect(page.getByText("12 triangles", { exact: true })).toBeVisible();

  await input.setInputFiles({ name: "empty.step", mimeType: "model/step", buffer: Buffer.alloc(0) });
  await expect(page.getByRole("alert").filter({ hasText: "IMPORT_FAILED" })).toContainText("empty");
  await expect(page.getByText("prior-size-gate.stl", { exact: true }).first()).toBeVisible();

  const oversizedPath = testInfo.outputPath("oversized.stl");
  const oversizedHandle = openSync(oversizedPath, "w");
  try {
    ftruncateSync(oversizedHandle, 64 * 1024 * 1024 + 1);
  } finally {
    closeSync(oversizedHandle);
  }
  await input.setInputFiles(oversizedPath);
  await expect(page.getByRole("alert").filter({ hasText: "FILE_TOO_LARGE" })).toContainText("64 MiB");
  await expect(page.getByText(/refused before reading bytes/)).toBeVisible();
  await expect(page.getByText("12 triangles", { exact: true })).toBeVisible();
});

test("CAD JSON pre-read gates reject empty and sparse oversized files without replacing the model", async ({ page }, testInfo) => {
  await page.goto("#/tools/cad");
  await page.getByRole("button", { name: "Circular flange" }).click();
  await expect(page.getByText(/Selected: Six-bolt flange/)).toBeVisible();
  const input = page.getByLabel("Choose a CAD document, STL, 3MF, STEP, IGES or BREP file");

  await input.setInputFiles({ name: "empty.json", mimeType: "application/json", buffer: Buffer.alloc(0) });
  await expect(page.getByRole("alert")).toContainText("JSON import failed (EMPTY_FILE)");
  await expect(page.getByText(/Selected: Six-bolt flange/)).toBeVisible();

  const oversizedJson = testInfo.outputPath("oversized-cad.json");
  const oversizedHandle = openSync(oversizedJson, "w");
  try {
    ftruncateSync(oversizedHandle, 1_000_001);
  } finally {
    closeSync(oversizedHandle);
  }
  await input.setInputFiles(oversizedJson);
  await expect(page.getByRole("alert")).toContainText("JSON import failed (FILE_TOO_LARGE)");
  await expect(page.getByText(/refused before reading text/)).toBeVisible();
  await expect(page.getByText(/Selected: Six-bolt flange/)).toBeVisible();
});

test("large STL import cancels promptly, terminates its worker and retains the prior model", async ({ page }, testInfo) => {
  const runtimeErrors = monitorRuntimeErrors(page);
  await page.goto("#/tools/cad");
  const input = page.getByLabel("Choose a CAD document, STL, 3MF, STEP, IGES or BREP file");
  await input.setInputFiles({ name: "prior-model.stl", mimeType: "model/stl", buffer: Buffer.from(createAsciiCubeStl()) });
  await expect(page.getByText("12 triangles", { exact: true })).toBeVisible();

  const started = Date.now();
  await input.setInputFiles({ name: "large-600k.stl", mimeType: "model/stl", buffer: Buffer.from(createLargeBinaryStl()) });
  await expect(page.getByRole("status").filter({ hasText: /Reading file|Validating mesh|Building transferable render mesh/ })).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByText(/Mesh import cancelled/)).toBeVisible();
  const elapsedMs = Date.now() - started;
  console.log(`CAD_LARGE_STL_CANCEL_ELAPSED_MS=${elapsedMs}`);
  await testInfo.attach("cad-large-stl-cancel.json", { body: JSON.stringify({ triangles: 600_000, bytes: 30_000_084, elapsedMs }), contentType: "application/json" });

  await page.getByLabel("Grid").uncheck();
  await expect(page.getByLabel("Grid")).not.toBeChecked();
  await page.waitForTimeout(750);
  await expect(page.getByText("prior-model.stl", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("12 triangles", { exact: true })).toBeVisible();
  await expect(page.getByRole("table", { name: "Diagnostics" })).toContainText("cancelled");
  expect(elapsedMs).toBeLessThan(5_000);
  expect(runtimeErrors).toEqual([]);
});

test("saved CAD v2 metadata rehydrates a verified deduplicated browser-profile mesh", async ({ page }) => {
  await page.goto("#/tools/cad");
  await page.getByLabel("Choose a CAD document, STL, 3MF, STEP, IGES or BREP file").setInputFiles({
    name: "metadata-only.stl",
    mimeType: "model/stl",
    buffer: Buffer.from(createAsciiCubeStl())
  });
  await expect(page.getByText("metadata-only.stl", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Mesh bytes are not embedded in JSON");

  await page.getByLabel("Choose a CAD document, STL, 3MF, STEP, IGES or BREP file").setInputFiles({
    name: "metadata-only-copy.stl",
    mimeType: "model/stl",
    buffer: Buffer.from(createAsciiCubeStl())
  });
  await expect(page.getByRole("status")).toContainText("existing hash-keyed cache entry was reused");
  const cacheCount = await page.evaluate(async () => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open("engineering-workbench-cad-assets", 1);
    request.onsuccess = () => {
      const count = request.result.transaction("mesh-assets").objectStore("mesh-assets").count();
      count.onsuccess = () => resolve(count.result);
      count.onerror = () => reject(count.error);
    };
    request.onerror = () => reject(request.error);
  }));
  expect(cacheCount).toBe(1);
  await page.getByRole("button", { name: "Save", exact: true }).click();

  await page.reload();
  await expect(page.getByRole("status")).toContainText("restored from the verified browser-profile asset cache", { timeout: 15_000 });
  await expect(page.getByText("12 triangles", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear cached mesh files" }).click();
  await expect(page.getByRole("status")).toContainText("Cleared 1 cached mesh file");
  await expect(page.getByRole("status")).toContainText("current in-memory mesh remains visible");
  await expect(page.getByText("12 triangles", { exact: true })).toBeVisible();
  const clearedCacheCount = await page.evaluate(async () => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open("engineering-workbench-cad-assets", 1);
    request.onsuccess = () => {
      const count = request.result.transaction("mesh-assets").objectStore("mesh-assets").count();
      count.onsuccess = () => resolve(count.result);
      count.onerror = () => reject(count.error);
    };
    request.onerror = () => reject(request.error);
  }));
  expect(clearedCacheCount).toBe(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Mesh source required" })).toBeVisible();
  await expect(page.getByText(/reselect the original STL or 3MF file/i)).toBeVisible();
});

test("browser-profile cache ceiling failure remains structured and keeps the imported mesh usable", async ({ page }) => {
  await page.goto("#/tools/cad");
  await page.evaluate(async () => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open("engineering-workbench-cad-assets", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("mesh-assets", { keyPath: "sha256" });
    request.onsuccess = () => {
      const transaction = request.result.transaction("mesh-assets", "readwrite");
      transaction.objectStore("mesh-assets").put({ sha256: "f".repeat(64), name: "capacity.bin", format: "stl", sourceUnit: "mm", byteLength: 64 * 1024 * 1024, blob: new Blob([new Uint8Array(1)]) });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    request.onerror = () => reject(request.error);
  }));
  await page.getByLabel("Choose a CAD document, STL, 3MF, STEP, IGES or BREP file").setInputFiles({ name: "uncached.stl", mimeType: "model/stl", buffer: Buffer.from(createAsciiCubeStl()) });
  await expect(page.getByRole("status")).toContainText("CACHE_LIMIT");
  await expect(page.getByText("12 triangles", { exact: true })).toBeVisible();
});

test("exact editor changes sketch entities, rebuilds geometry and reopens native feature history", async ({ page }) => {
  test.setTimeout(90_000);
  const runtimeErrors = monitorRuntimeErrors(page);
  await page.goto("#/tools/cad");
  await page.getByRole("button", { name: "Pad and pocket" }).click();
  await expect(page.getByText(/Selected: Sketch, pad and pocket/)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/model rebuilt/)).toBeVisible();
  await expect(page.getByText(/exact-mesh triangles/)).toBeVisible();

  await page.getByRole("button", { name: "Suppress or rebuild last feature" }).click();
  await expect(page.getByText(/Selected: Suppressed Through pocket/)).toBeVisible({ timeout: 60_000 });

  await page.getByRole("button", { name: /Base sketch/ }).click();
  await page.getByLabel("Rectangle width").fill("52");
  await page.getByLabel("Sketch entity type to add").selectOption("line");
  await page.getByRole("button", { name: "Add entity" }).click();
  await page.getByLabel("Construction geometry").check();
  await page.getByRole("button", { name: "Add entity" }).click();
  await page.getByRole("button", { name: "Delete entity" }).click();
  await page.getByRole("button", { name: "Add entity" }).click();
  const entityIds = await page.getByLabel("Selected sketch entity").locator("option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
  expect(new Set(entityIds).size).toBe(entityIds.length);
  expect(entityIds.filter((id) => id.includes("-line-")).length).toBe(2);
  await page.getByLabel("Construction geometry").check();
  await page.getByRole("button", { name: "Rebuild exact model" }).click();
  await expect(page.getByText("52.00 x 30.00 x 10.00 mm", { exact: true })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("table", { name: "Command history" })).toContainText("Changed rectangle width");

  const historyDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save exact history" }).click();
  await historyDownload;
  await page.getByLabel("Selected sketch entity").selectOption("base-rectangle");
  await page.getByLabel("Rectangle width").fill("60");
  await page.getByRole("button", { name: "Reopen exact history" }).click();
  await page.getByLabel("Selected sketch entity").selectOption("base-rectangle");
  await expect(page.getByLabel("Rectangle width")).toHaveValue("52");
  await expect(page.getByText("52.00 x 30.00 x 10.00 mm", { exact: true })).toBeVisible({ timeout: 60_000 });
  await page.getByLabel("Rectangle width").fill("");
  await page.getByRole("button", { name: "Save exact history" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Exact history was not saved" })).toContainText("DOCUMENT_INVALID");
  await expect(page.getByRole("alert").filter({ hasText: "Exact history was not saved" })).toContainText("must be finite");
  expect(runtimeErrors).toEqual([]);
});

test("invalid exact fillet visibly rolls back to the last-valid body", async ({ page }) => {
  const runtimeErrors = monitorRuntimeErrors(page);
  await page.goto("#/tools/cad");
  await page.getByRole("button", { name: "Invalid fillet fixture" }).click();
  await expect(page.getByText(/Selected: Invalid fillet rollback/)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/FEATURE_FAILED/).first()).toBeVisible();
  await expect(page.getByText(/Last-valid geometry retained: yes/)).toBeVisible();
  await expect(page.getByText(/rolled back to last valid body/)).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test("new exact shape advances the output body and planar-face UI enforces its bounded contract", async ({ page }) => {
  await page.goto("#/tools/cad");
  await page.getByRole("button", { name: "Pad and pocket" }).click();
  await expect(page.getByText(/model rebuilt/)).toBeVisible({ timeout: 60_000 });
  await page.getByLabel("Feature type to add").selectOption("box");
  await page.getByRole("button", { name: "Add feature" }).click();
  await page.getByLabel("Width").fill("41");
  await page.getByRole("button", { name: "Rebuild exact model" }).click();
  await expect(page.getByText("41.00 x 24.00 x 12.00 mm", { exact: true })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("box-5", { exact: true })).toBeVisible();

  await page.getByLabel("Feature type to add").selectOption("sketch");
  await page.getByRole("button", { name: "Add feature" }).click();
  await page.getByLabel("Sketch support").selectOption("planar-face");
  await expect(page.getByRole("combobox", { name: "Plane", exact: true })).toHaveValue("XY");
  await expect(page.getByRole("combobox", { name: "Plane", exact: true })).toBeDisabled();
  await expect(page.getByRole("spinbutton", { name: "Plane offset mm", exact: true })).toHaveValue("0");
  await expect(page.getByRole("spinbutton", { name: "Plane offset mm", exact: true })).toBeDisabled();
  await expect(page.getByLabel("Support body feature")).toBeVisible();
});
