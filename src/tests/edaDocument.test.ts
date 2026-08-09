import { describe, expect, it } from "vitest";
import { EDA_EXTERNAL_VERIFICATION_STATE, canonicalEdaJson, createVoltageDividerFixture, generateBom, generatePickAndPlace, reopenEdaDocument, validateEdaDocument } from "../lib/eda";

describe("EdaDocument v1 validation and persistence", () => {
  it("rejects known-bad duplicate IDs and dangling references before accepting repairs", () => {
    const bad = createVoltageDividerFixture();
    bad.schematic.wires[1].id = bad.schematic.wires[0].id;
    bad.schematic.symbols[0].footprintId = "missing-footprint";
    expect(validateEdaDocument(bad).map((item) => item.code)).toEqual(expect.arrayContaining(["DUPLICATE_ID", "DANGLING_FOOTPRINT"]));
    expect(() => canonicalEdaJson(bad)).toThrow(/DUPLICATE_ID/);

    const repaired = createVoltageDividerFixture();
    expect(validateEdaDocument(repaired)).toEqual([]);
  });

  it("serialises canonically and reopens without shared references", () => {
    const document = createVoltageDividerFixture();
    const first = canonicalEdaJson(document);
    const reordered = structuredClone(document);
    reordered.schematic.symbols.reverse();
    reordered.pcb.footprints.reverse();
    expect(canonicalEdaJson(reordered)).toBe(first);
    const reopened = reopenEdaDocument(first);
    expect(canonicalEdaJson(reopened)).toBe(first);
    reopened.title = "Changed";
    expect(document.title).toBe("Voltage divider");
  });

  it("produces deterministic BOM and pick-and-place outputs", () => {
    const document = createVoltageDividerFixture();
    expect(generateBom(document).find((item) => item.libraryId === "Device:R")).toEqual({ quantity: 2, value: "10 kOhm", libraryId: "Device:R", references: ["R1", "R2"] });
    expect(generatePickAndPlace(document).map((item) => item.reference)).toEqual(["#PWR1", "R1", "R2", "V1"]);
  });

  it("rejects unknown top-level schema keys", () => {
    const value = JSON.parse(canonicalEdaJson(createVoltageDividerFixture())) as Record<string, unknown>;
    value.unsafe = true;
    expect(() => reopenEdaDocument(JSON.stringify(value))).toThrow(/unsupported keys/);
  });

  it("requires enriched schema fields and migrates legacy v1 saves deterministically", () => {
    const document = createVoltageDividerFixture();
    expect(document.project.units).toBe("mm");
    expect(document.sheets).toHaveLength(1);
    expect(document.nets.map((net) => net.name)).toEqual(["GND", "VCC", "VOUT"]);
    expect(document.layers.map((layer) => layer.name)).toEqual(["F.Cu", "B.Cu", "Edge.Cuts", "Silkscreen"]);
    expect(document.provenance[0].source).toBe("offline-fixture");
    const legacy = JSON.parse(canonicalEdaJson(document)) as Record<string, unknown>;
    for (const key of ["project", "sheets", "nets", "layers", "annotations", "validationResults", "provenance"]) delete legacy[key];
    const reopened = reopenEdaDocument(JSON.stringify(legacy));
    expect(reopened.project).toEqual({ name: "Voltage divider", revision: "Rev00", units: "mm" });
    expect(reopened.nets.map((net) => net.name)).toEqual(["GND", "VCC", "VOUT"]);
  });

  it("rejects runtime enum injection and malformed rule geometry", () => {
    const injected = JSON.parse(canonicalEdaJson(createVoltageDividerFixture())) as { pcb: { tracks: Array<{ layer: string }>; footprints: Array<{ pads: Array<{ shape: string }> }>; rules: { clearanceMm: number } } };
    injected.pcb.tracks[0].layer = "Inner.Cu";
    expect(() => reopenEdaDocument(JSON.stringify(injected))).toThrow(/layer is invalid/);
    injected.pcb.tracks[0].layer = "F.Cu";
    injected.pcb.footprints[0].pads[0].shape = "triangle";
    expect(() => reopenEdaDocument(JSON.stringify(injected))).toThrow(/shape is invalid/);
    injected.pcb.footprints[0].pads[0].shape = "rect";
    injected.pcb.rules.clearanceMm = -1;
    expect(() => reopenEdaDocument(JSON.stringify(injected))).toThrow(/INVALID_DIMENSION/);
  });

  it("exposes the offline verification boundary without claiming a real-tool run", () => {
    expect(EDA_EXTERNAL_VERIFICATION_STATE).toEqual({ fixture: "FIXTURE_VERIFIED", realTool: "REAL_TOOL_NOT_VERIFIED", adaptersInvoked: false });
    expect(Object.isFrozen(EDA_EXTERNAL_VERIFICATION_STATE)).toBe(true);
  });
});
