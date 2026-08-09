import { describe, expect, it } from "vitest";
import { EML_KICAD_GENERATOR, acknowledgeKicadLosses, canonicalEdaJson, createControlledNgspiceResult, createEdaHistory, createVoltageDividerFixture, exportKicadProject, exportKicadSExpression, generateVoltageDividerNgspiceNetlist, importKicadProject, importKicadSExpression, inspectKicadProjectLosses, inspectKicadSExpressionLosses, validateEdaDocument } from "../lib/eda";
import { KICAD_FIXTURE_VERSIONS, independentKicadProjectFixture } from "./fixtures/edaKicad";

describe("bounded semantic KiCad interchange", () => {
  it("rejects malformed, deeply nested, oversized and invalid-escape inputs", () => {
    expect(() => importKicadSExpression("(kicad_sch (version 20231120)")).toThrow(/unbalanced/);
    expect(() => importKicadSExpression(`(kicad_sch (version 20231120) (generator "bad\\q"))`)).toThrow(/unsupported escape/);
    expect(() => importKicadSExpression(`(kicad_sch (version 20231120) ${"(x ".repeat(70)}${")".repeat(70)})`)).toThrow(/depth 64/);
    expect(() => importKicadSExpression(`(kicad_sch (version 20231120) (generator "${"x".repeat(65_537)}"))`)).toThrow(/string exceeds 65536/);
    expect(() => importKicadSExpression(`(kicad_sch (version 20231120) (generator ${"x".repeat(1_025)}))`)).toThrow(/atom exceeds 1024/);
    expect(() => importKicadSExpression(`(kicad_sch (version 20231120)${" ".repeat(10_000_000)})`)).toThrow(/exceeds 10000000 bytes/);
    expect(() => importKicadSExpression(`(kicad_sch (version 20200101) (generator eeschema))`)).toThrow(/KiCad 6 or newer/);
  });

  it.each(KICAD_FIXTURE_VERSIONS)("imports independent KiCad $major semantic schematic and PCB fixtures", ({ major }) => {
    const imported = importKicadProject(independentKicadProjectFixture(major));
    expect(validateEdaDocument(imported.document)).toEqual([]);
    expect(() => canonicalEdaJson(imported.document)).not.toThrow();
    expect(createEdaHistory(imported.document).present.document.id).toBe(imported.document.id);
    expect(imported.document.nets.map((net) => net.name)).toEqual(["UNUSED", "VIN", "VOUT"]);
    expect(imported.document.schematic.symbols).toHaveLength(1);
    expect(imported.document.schematic.symbols[0]).toMatchObject({ libraryId: "Device:R", reference: "R1", value: "10 kOhm", rotationDeg: 0 });
    expect(imported.document.schematic.symbols[0].pins.map((pin) => [pin.number, pin.name, pin.at])).toEqual([
      ["1", "A", { xMm: 25, yMm: 20 }],
      ["2", "B", { xMm: 35, yMm: 20 }]
    ]);
    expect(imported.document.schematic.wires).toHaveLength(2);
    expect(imported.document.schematic.junctions).toHaveLength(1);
    expect(imported.document.schematic.netLabels.map((label) => label.text)).toEqual(["VIN", "VOUT"]);
    expect(imported.document.pcb.footprints[0]).toMatchObject({ reference: "R1", side: "front", rotationDeg: 90 });
    expect(imported.document.pcb.footprints[0].pads.map((pad) => pad.net)).toEqual(["VIN", "VOUT"]);
    expect(imported.document.pcb.outline).toEqual([{ xMm: 0, yMm: 0 }, { xMm: 60, yMm: 0 }, { xMm: 60, yMm: 40 }, { xMm: 0, yMm: 40 }, { xMm: 0, yMm: 0 }]);
    expect(imported.document.pcb.tracks.map((track) => track.net)).toEqual(["VIN", "VOUT"]);
    expect(imported.document.pcb.vias[0]).toMatchObject({ net: "VOUT", diameterMm: 0.8, drillMm: 0.4 });
    expect(imported.lossReport.map((loss) => loss.code)).toEqual(expect.arrayContaining(["KICAD_FOOTPRINT_PROPERTY_UNSUPPORTED", "KICAD_FOOTPRINT_ROTATION_QUANTISED", "KICAD_HIERARCHY_UNSUPPORTED", "KICAD_LIB_SYMBOL_UNSUPPORTED_NODE", "KICAD_PAD_DRILL_NOT_REPRESENTED", "KICAD_PAD_SHAPE_DOWNGRADED", "KICAD_RULE_UNSUPPORTED", "KICAD_SYMBOL_PROPERTY_UNSUPPORTED", "KICAD_ZONE_UNSUPPORTED"]));
    expect(imported.lossReport.some((loss) => loss.preserved.includes("SAFE_HIERARCHY"))).toBe(true);
    expect(imported.lossReport.some((loss) => loss.preserved.startsWith("(polyline"))).toBe(true);
    expect(imported.lossReport.some((loss) => loss.preserved.startsWith("(zone"))).toBe(true);
    expect(imported.lossReport.some((loss) => loss.preserved.includes("Datasheet"))).toBe(true);
    expect(imported.lossReport.some((loss) => loss.preserved.includes("Manufacturer"))).toBe(true);
    expect(imported.lossReport.some((loss) => loss.code === "KICAD_FOOTPRINT_ROTATION_QUANTISED" && loss.preserved.includes("92.5"))).toBe(true);
    expect(imported.lossReport.some((loss) => loss.code === "KICAD_PAD_DRILL_NOT_REPRESENTED" && loss.preserved.includes("(drill 0.9)"))).toBe(true);
    expect(imported.lossReport.some((loss) => loss.code === "KICAD_PAD_SHAPE_DOWNGRADED" && loss.preserved.includes("roundrect"))).toBe(true);
    expect(imported.lossReport.some((loss) => loss.code === "KICAD_RULE_UNSUPPORTED" && loss.preserved.includes("pad_to_mask_clearance 0.07"))).toBe(true);
  });

  it("exports genuine schematic and PCB forms without a private document envelope", () => {
    const original = createVoltageDividerFixture();
    const lossReport = inspectKicadProjectLosses(original);
    expect(() => exportKicadProject(original)).toThrow(/explicit acknowledgement/);
    const acknowledgement = acknowledgeKicadLosses(lossReport);
    const exported = exportKicadProject(original, { lossAcknowledgement: acknowledgement });
    expect(exported.lossAcknowledgement).toEqual(acknowledgement);
    expect(exported.schematicText).toMatch(/^\(kicad_sch /);
    expect(exported.pcbText).toMatch(/^\(kicad_pcb /);
    expect(exported.schematicText).toContain(`(generator "${EML_KICAD_GENERATOR}")`);
    expect(exported.pcbText).toContain(`(generator "${EML_KICAD_GENERATOR}")`);
    expect(`${exported.schematicText}${exported.pcbText}`).not.toContain("eml_document");
    expect(exported.schematicText).toContain("(lib_symbols");
    expect(exported.schematicText).toContain("(wire (pts");
    expect(exported.pcbText).toContain("(footprint");
    expect(exported.pcbText).toContain("(segment");

    const reopened = importKicadProject({ schematicText: exported.schematicText, pcbText: exported.pcbText });
    expect(validateEdaDocument(reopened.document)).toEqual([]);
    expect(() => canonicalEdaJson(reopened.document)).not.toThrow();
    expect(createEdaHistory(reopened.document).present.document.id).toBe(original.id);
    expect(reopened.schematicGenerator).toBe(EML_KICAD_GENERATOR);
    expect(reopened.pcbGenerator).toBe(EML_KICAD_GENERATOR);
    expect(reopened.document.schematic.symbols.map((symbol) => symbol.reference)).toEqual(["#PWR1", "R1", "R2", "V1"]);
    expect(reopened.document.pcb.footprints).toHaveLength(original.pcb.footprints.length);
    expect(reopened.document.pcb.vias).toHaveLength(original.pcb.vias.length);
  });

  it("requires exact explicit loss acknowledgement before re-export", () => {
    const imported = importKicadProject(independentKicadProjectFixture(8));
    expect(imported.lossReport.length).toBeGreaterThan(0);
    expect(() => exportKicadProject(imported.document, { preservedUnsupported: imported.lossReport })).toThrow(/explicit acknowledgement/);
    const importAcknowledgement = acknowledgeKicadLosses(imported.lossReport);
    expect(importAcknowledgement).toEqual(imported.lossAcknowledgement);
    expect(importAcknowledgement.token).toBe(imported.lossAcknowledgementToken);
    expect(() => exportKicadProject(imported.document, { preservedUnsupported: imported.lossReport, lossAcknowledgement: importAcknowledgement })).toThrow(/explicit acknowledgement/);
    const completeLossReport = inspectKicadProjectLosses(imported.document, imported.lossReport);
    const acknowledgement = acknowledgeKicadLosses(completeLossReport);
    const reexported = exportKicadProject(imported.document, { preservedUnsupported: imported.lossReport, lossAcknowledgement: acknowledgement });
    expect(reexported.lossReport).toEqual(completeLossReport);
    expect(reexported.lossAcknowledgement).toEqual(acknowledgement);
    expect(reexported.schematicText).not.toContain("SAFE_HIERARCHY");
    const changedLosses = [...imported.lossReport, { code: "KICAD_NEW_LOSS", message: "Changed after acknowledgement", preserved: "changed" }];
    expect(() => exportKicadProject(imported.document, { preservedUnsupported: changedLosses, lossAcknowledgement: acknowledgement })).toThrow(/explicit acknowledgement/);
  });

  it("declares sanitisation-colliding referenced net names with stable collision-safe IDs", () => {
    const fixture = independentKicadProjectFixture(8);
    const input = {
      schematicText: fixture.schematicText.replaceAll("VIN", "A B").replaceAll("VOUT", "A-B").replace('(uuid "symbol-r1")', '(uuid "net:A-B")'),
      pcbText: fixture.pcbText.replaceAll("VIN", "A B").replaceAll("VOUT", "A-B")
    };
    const first = importKicadProject(input);
    const second = importKicadProject(input);
    expect(first.document.nets.map((net) => net.name)).toEqual(["A B", "A-B", "UNUSED"]);
    expect(new Set(first.document.nets.map((net) => net.id)).size).toBe(3);
    expect(first.document.nets.every((net) => net.id !== "net:A-B")).toBe(true);
    expect(validateEdaDocument(first.document)).toEqual([]);
    expect(canonicalEdaJson(first.document)).toBe(canonicalEdaJson(second.document));
  });

  it("keeps schematic-only compatibility explicit about omitted PCB data", () => {
    const document = createVoltageDividerFixture();
    const lossReport = inspectKicadSExpressionLosses(document);
    expect(() => exportKicadSExpression(document)).toThrow(/explicit acknowledgement/);
    const acknowledgement = acknowledgeKicadLosses(lossReport);
    const exported = exportKicadSExpression(document, [], acknowledgement);
    expect(exported.lossAcknowledgement).toEqual(acknowledgement);
    expect(exported.lossReport).toContainEqual(expect.objectContaining({ code: "KICAD_PCB_REQUIRES_PROJECT_EXPORT" }));
    const imported = importKicadSExpression(exported.text);
    expect(imported.document.schematic.symbols.length).toBeGreaterThan(0);
    expect(imported.document.pcb.footprints).toEqual([]);
    expect(validateEdaDocument(imported.document)).toEqual([]);
  });

  it("audits every unrepresented EDA document field before export", () => {
    const document = createVoltageDividerFixture();
    document.annotations = [{ id: "annotation-export", kind: "warning", text: "Retain this", targetId: "r1" }];
    document.validationResults = [{ id: "validation-export", scope: "drc", passed: false, codes: ["FIXTURE"] }];
    const losses = inspectKicadProjectLosses(document);
    expect(losses.map((loss) => loss.code)).toEqual(expect.arrayContaining([
      "KICAD_ANNOTATIONS_NOT_EMBEDDED",
      "KICAD_BOARD_RULES_NOT_EMBEDDED",
      "KICAD_DOCUMENT_METADATA_NOT_EMBEDDED",
      "KICAD_LAYER_METADATA_NOT_EMBEDDED",
      "KICAD_NET_IDS_NOT_EMBEDDED",
      "KICAD_PAD_DRILL_ASSUMED",
      "KICAD_PIN_REQUIRED_FLAGS_NOT_EMBEDDED",
      "KICAD_PROVENANCE_NOT_EMBEDDED",
      "KICAD_SHEETS_NOT_EMBEDDED",
      "KICAD_TRACK_GROUPING_NOT_EMBEDDED",
      "KICAD_VALIDATION_RESULTS_NOT_EMBEDDED"
    ]));
    expect(losses.find((loss) => loss.code === "KICAD_BOARD_RULES_NOT_EMBEDDED")?.preserved).toBe(JSON.stringify(document.pcb.rules));
    expect(losses.find((loss) => loss.code === "KICAD_DOCUMENT_METADATA_NOT_EMBEDDED")?.preserved).toContain(document.project.revision);
  });

  it("provides a fixed ngspice netlist and accessible series data", () => {
    expect(generateVoltageDividerNgspiceNetlist()).toContain("R2 out 0 10k");
    const result = createControlledNgspiceResult();
    expect(result.engine).toBe("controlled-fixture");
    expect(result.series.find((series) => series.id === "v-out")?.values).toEqual([5, 5, 5, 5, 5, 5]);
    expect(result.accessibleTable.at(-1)).toEqual({ timeS: 0.005, inputV: 10, outputV: 5 });
  });
});
