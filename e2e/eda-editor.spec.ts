import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { emptyProgress, installProgress, monitorRuntimeErrors } from "./support";

async function openStudio(page: Page) {
  await installProgress(page, emptyProgress);
  await page.goto("#/tools/eda");
  await expect(page.getByRole("heading", { level: 1, name: "Engineering Design Studio" })).toBeVisible();
}

async function startEmpty(page: Page) {
  await page.getByRole("button", { name: "Start empty", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Empty EDA project started");
}

async function place(page: Page, kind: string, count = 1) {
  for (let index = 0; index < count; index += 1) await page.getByRole("button", { name: new RegExp(`^${kind}`) }).click();
}

test("a user constructs and edits a voltage divider from an empty document", async ({ page }) => {
  await openStudio(page);
  const runtimeErrors = monitorRuntimeErrors(page);
  await startEmpty(page);
  await place(page, "source");
  await place(page, "resistor", 2);
  await place(page, "ground");

  const symbolTable = page.getByRole("table", { name: "Schematic symbols and pin geometry" });
  await expect(symbolTable).toContainText("V1");
  await expect(symbolTable).toContainText("R1");
  await expect(symbolTable).toContainText("R2");
  await expect(symbolTable).toContainText("#PWR1");

  const r1Row = symbolTable.getByRole("row").filter({ has: page.getByRole("rowheader", { name: "R1", exact: true }) });
  const before = await r1Row.textContent();
  await r1Row.getByRole("button", { name: "Select" }).click();
  await page.getByRole("button", { name: "Move +X" }).click();
  await expect(r1Row).not.toHaveText(before ?? "");
  await page.getByRole("button", { name: "Rotate", exact: true }).click();
  await expect(r1Row).toContainText("90 deg");

  await page.getByRole("tab", { name: "wire", exact: true }).click();
  await page.getByLabel("Wire start X (mm)").fill("5");
  await page.getByLabel("Wire start Y (mm)").fill("10");
  await page.getByLabel("Wire end X (mm)").fill("25");
  await page.getByLabel("Wire end Y (mm)").fill("20");
  await page.getByRole("button", { name: "Add wire" }).click();
  const geometryTable = page.getByRole("table", { name: "Wires, junctions, labels and no-connects" });
  await expect(geometryTable.getByText("Wire", { exact: true })).toHaveCount(2);
  await expect(geometryTable).toContainText("5,10 to 25,10 mm");
  await expect(geometryTable).toContainText("25,10 to 25,20 mm");

  await page.getByRole("button", { name: "Introduce ERC issue" }).click();
  await expect(page.getByText("ERC_CONNECTED_NO_CONNECT", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Repair and recheck" }).click();
  await expect(page.getByText("ERC_CONNECTED_NO_CONNECT", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("Current-document ERC finding repaired");

  const r2Row = symbolTable.getByRole("row").filter({ has: page.getByRole("rowheader", { name: "R2", exact: true }) });
  await r2Row.getByRole("button", { name: "Select" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(r2Row).toHaveCount(0);
  await page.getByRole("tab", { name: "PCB", exact: true }).click();
  const footprintTable = page.getByRole("table", { name: "Footprints and pad geometry" });
  await expect(footprintTable.getByRole("rowheader", { name: "R2", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(footprintTable.getByRole("rowheader", { name: "R2", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(footprintTable.getByRole("rowheader", { name: "R2", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByRole("tab", { name: "Schematic", exact: true }).click();

  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("button", { name: "Reopen", exact: true }).click();
  await expect(symbolTable).toContainText("R2");
  expect(runtimeErrors).toEqual([]);
});

test("a user constructs a routed two-layer LED board and repairs DRC in place", async ({ page }) => {
  await openStudio(page);
  await startEmpty(page);
  await place(page, "connector");
  await place(page, "resistor");
  await place(page, "led");
  await place(page, "ground");
  await page.getByRole("tab", { name: "PCB", exact: true }).click();

  const footprintTable = page.getByRole("table", { name: "Footprints and pad geometry" });
  const j1 = footprintTable.getByRole("row").filter({ has: page.getByRole("rowheader", { name: "J1", exact: true }) });
  await j1.getByRole("button", { name: "Select" }).click();
  await page.getByLabel("Pad 1 net").selectOption("VCC");
  await page.getByLabel("Pad 2 net").selectOption("GND");
  const r1 = footprintTable.getByRole("row").filter({ has: page.getByRole("rowheader", { name: "R1", exact: true }) });
  await r1.getByRole("button", { name: "Select" }).click();
  await page.getByLabel("Pad 1 net").selectOption("VCC");
  await page.getByLabel("Pad 2 net").selectOption("LED_A");

  await page.getByRole("tab", { name: "outline", exact: true }).click();
  await page.locator('.eda-authoring textarea[name="points"]').fill("0,0; 60,0; 60,40; 0,40; 0,0");
  await page.getByRole("button", { name: "Add outline" }).click();
  await page.getByRole("tab", { name: "track", exact: true }).click();
  await page.getByLabel("Track vertices (X,Y; X,Y)").fill("10,10; 20,10; 30,20");
  await page.getByLabel("Track net").selectOption("VCC");
  await page.getByLabel("Track layer").selectOption("F.Cu");
  await page.getByRole("button", { name: "Add track" }).click();
  await page.getByLabel("Track vertices (X,Y; X,Y)").fill("10,20; 20,20; 30,30");
  await page.getByLabel("Track net").selectOption("GND");
  await page.getByLabel("Track layer").selectOption("B.Cu");
  await page.getByRole("button", { name: "Add track" }).click();
  await page.getByRole("tab", { name: "via", exact: true }).click();
  await page.getByLabel("Via net").selectOption("GND");
  await page.getByLabel("via X (mm)").fill("20");
  await page.getByLabel("via Y (mm)").fill("20");
  await page.getByRole("button", { name: "Add via" }).click();

  const copperTable = page.getByRole("table", { name: "Tracks, vias and ratsnest" });
  await expect(copperTable).toContainText("F.Cu");
  await expect(copperTable).toContainText("B.Cu");
  await expect(copperTable).toContainText("Via");
  await page.getByRole("checkbox", { name: "tracks", exact: true }).uncheck();
  await page.getByRole("checkbox", { name: "tracks", exact: true }).check();
  await page.getByRole("checkbox", { name: "vias", exact: true }).uncheck();
  await page.getByRole("checkbox", { name: "vias", exact: true }).check();
  await page.getByRole("checkbox", { name: "ratsnest", exact: true }).uncheck();
  await page.getByRole("checkbox", { name: "ratsnest", exact: true }).check();
  await page.getByRole("checkbox", { name: "pads", exact: true }).uncheck();
  await page.getByRole("checkbox", { name: "pads", exact: true }).check();

  await page.getByRole("button", { name: "Introduce DRC issue" }).click();
  await expect(page.getByText("DRC_TRACK_WIDTH", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Repair and recheck" }).click();
  await expect(page.getByText("DRC_TRACK_WIDTH", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("Current-document DRC finding repaired");
  await expect(footprintTable).toContainText("J1");
});

test("EML JSON downloads and imports through the explicit browser boundary", async ({ page }) => {
  await openStudio(page);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "EML JSON", exact: true }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  await startEmpty(page);
  await page.getByLabel("Import EML JSON").setInputFiles(path as string);
  await expect(page.getByRole("status")).toContainText("Imported");
  await expect(page.getByRole("table", { name: "Schematic symbols and pin geometry" })).toContainText("R1");
  await expect(page.getByText("5 MB", { exact: false })).toBeVisible();
});

test("delete then re-add allocates unique validator-clean identities", async ({ page }) => {
  await openStudio(page);
  await startEmpty(page);
  await place(page, "resistor", 2);
  const symbols = page.getByRole("table", { name: "Schematic symbols and pin geometry" });
  const r1 = symbols.getByRole("row").filter({ has: page.getByRole("rowheader", { name: "R1", exact: true }) });
  await r1.getByRole("button", { name: "Select" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(r1).toHaveCount(0);
  await place(page, "resistor");
  await expect(page.getByRole("status")).not.toContainText("Change held");
  await expect(symbols.getByRole("rowheader", { name: "R1", exact: true })).toHaveCount(1);
  await expect(symbols.getByRole("rowheader", { name: "R2", exact: true })).toHaveCount(1);
  await page.getByRole("tab", { name: "PCB", exact: true }).click();
  const footprints = page.getByRole("table", { name: "Footprints and pad geometry" });
  await expect(footprints.getByRole("rowheader", { name: "R1", exact: true })).toHaveCount(1);
  await expect(footprints.getByRole("rowheader", { name: "R2", exact: true })).toHaveCount(1);
});

test("lossy paired KiCad import is previewed and genuine project files export separately", async ({ page }) => {
  await openStudio(page);
  await page.getByRole("tab", { name: "KiCad", exact: true }).click();
  const symbols = page.getByRole("table", { name: "Schematic symbols and pin geometry" });
  await expect(symbols).toContainText("R1");
  await page.getByLabel("KiCad schematic (.kicad_sch)").setInputFiles({ name: "oversized.kicad_sch", mimeType: "text/plain", buffer: Buffer.alloc(10_000_001, 32) });
  await page.getByRole("button", { name: "Preview KiCad import" }).click();
  await expect(page.getByRole("alert")).toContainText("10000000 byte import limit");
  await expect(symbols).toContainText("R1");
  const schematic = `(kicad_sch (version 20231120) (generator "fixture-schematic") (uuid "fixture-sch") (paper "A4") (lib_symbols) (text "unsupported" (at 0 0 0)))`;
  const pcb = `(kicad_pcb (version 20240108) (generator "fixture-pcb") (general (thickness 1.6)) (paper "A4") (layers (0 "F.Cu" signal) (31 "B.Cu" signal) (44 "Edge.Cuts" user)) (setup (pad_to_mask_clearance 0)) (zone (net 0) (layer "F.Cu")))`;
  await page.getByLabel("KiCad schematic (.kicad_sch)").setInputFiles({ name: "fixture.kicad_sch", mimeType: "text/plain", buffer: Buffer.from(schematic) });
  await page.getByLabel("Optional KiCad PCB (.kicad_pcb)").setInputFiles({ name: "fixture.kicad_pcb", mimeType: "text/plain", buffer: Buffer.from(pcb) });
  await page.getByRole("button", { name: "Preview KiCad import" }).click();
  const importLosses = page.getByRole("table", { name: "KiCad import loss report" });
  await expect(importLosses).toBeVisible();
  expect(await importLosses.getByRole("row").count()).toBeGreaterThan(1);
  const replace = page.getByRole("button", { name: "Replace current document" });
  await expect(replace).toBeDisabled();
  await page.getByRole("checkbox", { name: /confirm replacement/ }).check();
  await expect(replace).toBeEnabled();
  await replace.click();
  await expect(page.getByRole("status")).toContainText("Imported bounded KiCad subset");

  await page.getByRole("button", { name: "Prepare KiCad export" }).click();
  await expect(page.getByRole("table", { name: "KiCad export loss report" })).toBeVisible();
  await page.getByRole("checkbox", { name: /acknowledge every reported export loss/ }).check();
  const schDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download .kicad_sch" }).click();
  const schPath = await (await schDownloadPromise).path();
  expect(schPath).toBeTruthy();
  const schText = await readFile(schPath as string, "utf8");
  expect(schText).toContain("(kicad_sch");
  expect(schText).not.toContain("eml_document_v1");
  const pcbDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download .kicad_pcb" }).click();
  const pcbPath = await (await pcbDownloadPromise).path();
  expect(pcbPath).toBeTruthy();
  const pcbText = await readFile(pcbPath as string, "utf8");
  expect(pcbText).toContain("(kicad_pcb");
  expect(pcbText).not.toContain("eml_document_v1");
});

test("keyboard, pointer cursor and external verification states are explicit", async ({ page }) => {
  await openStudio(page);
  await page.keyboard.press("Alt+k");
  const dialog = page.getByRole("dialog", { name: "Command palette" });
  await dialog.getByLabel("Search commands").fill("PCB");
  await dialog.getByRole("button", { name: "Open PCB editor" }).click();
  const canvas = page.getByRole("img", { name: "PCB editor" });
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await canvas.click({ position: { x: Math.min((box?.width ?? 500) - 50, 400), y: 50 } });
  await expect(page.getByRole("status")).toContainText("cursor");
  await expect(page.getByRole("status")).not.toContainText("cursor 10,10 mm");
  await page.getByRole("tab", { name: "Simulation" }).click();
  await expect(page.getByText("FIXTURE_VERIFIED", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("REAL_TOOL_NOT_VERIFIED", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Adapters invoked: false", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("img", { name: "Voltage over time" })).toBeVisible();
});
