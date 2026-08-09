import { describe, expect, it } from "vitest";
import { annotateSchematic, buildConnectivityGraph, canonicalEdaJson, createLedBoardFixture, createVoltageDividerFixture, generateSchematicNetlist, reopenEdaDocument, runErc, type EdaDocument } from "../lib/eda";

describe("deterministic schematic connectivity and ERC", () => {
  it("detects missing annotation and an unconnected required LED pin before repair", () => {
    const bad = createLedBoardFixture({ repaired: false });
    expect(runErc(bad).map((item) => item.code)).toEqual(expect.arrayContaining(["MISSING_REFERENCE", "ERC_UNCONNECTED_REQUIRED_PIN"]));
    const repaired = createLedBoardFixture();
    expect(runErc(repaired)).toEqual([]);
  });

  it("detects conflicting outputs on a named net", () => {
    const bad = createVoltageDividerFixture();
    bad.schematic.symbols[1].pins[0].electricalType = "output";
    bad.schematic.symbols[0].pins[0].electricalType = "output";
    expect(runErc(bad)).toContainEqual(expect.objectContaining({ code: "ERC_OUTPUT_CONFLICT" }));
  });

  it("builds stable named nets, annotation and netlist", () => {
    const document = createLedBoardFixture();
    document.schematic.symbols[1].reference = "R?";
    document.pcb.footprints.find((item) => item.id === "r1-fp")!.reference = "R?";
    const annotated = annotateSchematic(document);
    expect(annotated.schematic.symbols.find((item) => item.id === "r1")?.reference).toBe("R1");
    expect(buildConnectivityGraph(annotated).nets.map((net) => net.name)).toEqual(["GND", "LED_A", "VCC"]);
    expect(generateSchematicNetlist(annotated)).toContain("(generator engineering-mastery-lab)");
  });

  it("preserves the exact connectivity graph through save and reopen", () => {
    const document = createVoltageDividerFixture();
    expect(buildConnectivityGraph(reopenEdaDocument(canonicalEdaJson(document)))).toEqual(buildConnectivityGraph(document));
  });

  it.each([
    ["wire", (document: EdaDocument): string => { const at = document.schematic.symbols[0].pins[0].at; document.schematic.wires = [{ id: "attached-wire", from: at, to: { xMm: at.xMm + 5, yMm: at.yMm } }]; return "attached-wire"; }],
    ["junction", (document: EdaDocument): string => { document.schematic.junctions = [{ id: "attached-junction", at: document.schematic.symbols[0].pins[0].at }]; return "attached-junction"; }],
    ["label", (document: EdaDocument): string => { document.schematic.netLabels = [{ id: "attached-label", text: "ONLY_LABEL", at: document.schematic.symbols[0].pins[0].at }]; return "attached-label"; }],
    ["power", (document: EdaDocument): string => { document.schematic.powerSymbols = [{ id: "attached-power", netName: "ONLY_POWER", powerType: "power-in", at: document.schematic.symbols[0].pins[0].at }]; return "attached-power"; }]
  ] as const)("detects a no-connect pin attached only to one %s source", (_kind, attach) => {
    const document = isolatedPinFixture();
    const sourceId = attach(document);
    expect(buildConnectivityGraph(document).nets[0].pinKeys).toHaveLength(1);
    expect(runErc(document)).toContainEqual({ code: "ERC_CONNECTED_NO_CONNECT", severity: "error", message: expect.stringContaining("No-connect pin"), ids: [sourceId, "g1", "g1-pin-1", "nc-isolated"].sort() });
  });

  it("allows a genuinely isolated no-connect pin", () => {
    expect(runErc(isolatedPinFixture()).filter((item) => item.code === "ERC_CONNECTED_NO_CONNECT")).toEqual([]);
  });

  it.each([
    ["label-label", [{ kind: "label", id: "source-z", name: "Z_NET" }, { kind: "label", id: "source-a", name: "A_NET" }]],
    ["label-power", [{ kind: "label", id: "source-z", name: "Z_NET" }, { kind: "power", id: "source-a", name: "A_NET" }]],
    ["power-power", [{ kind: "power", id: "source-z", name: "Z_NET" }, { kind: "power", id: "source-a", name: "A_NET" }]]
  ] as const)("reports one deterministic %s connected-component naming conflict", (_case, sources) => {
    const document = namedComponentFixture(sources);
    const conflicts = runErc(document).filter((item) => item.code === "ERC_NET_NAME_CONFLICT");
    expect(conflicts).toEqual([{ code: "ERC_NET_NAME_CONFLICT", severity: "error", message: "Connected component has conflicting net names: A_NET, Z_NET", ids: ["source-a", "source-z"] }]);
    expect(buildConnectivityGraph(document).nets[0].name).toBe("A_NET");
    const reversed = structuredClone(document); reversed.schematic.netLabels.reverse(); reversed.schematic.powerSymbols.reverse();
    expect(runErc(reversed)).toEqual(runErc(document));
  });

  it("does not report repeated identical label and power names as a conflict", () => {
    const document = namedComponentFixture([{ kind: "label", id: "source-label", name: "SAME" }, { kind: "power", id: "source-power", name: "SAME" }]);
    expect(runErc(document).filter((item) => item.code === "ERC_NET_NAME_CONFLICT")).toEqual([]);
  });
});

function isolatedPinFixture(): EdaDocument {
  const document = createVoltageDividerFixture();
  document.schematic.symbols = document.schematic.symbols.filter((symbol) => symbol.id === "g1");
  document.schematic.wires = []; document.schematic.junctions = []; document.schematic.netLabels = []; document.schematic.powerSymbols = [];
  document.schematic.noConnects = [{ id: "nc-isolated", symbolId: "g1", pinId: "g1-pin-1" }];
  document.pcb.footprints = document.pcb.footprints.filter((footprint) => footprint.id === "g1-fp"); document.pcb.tracks = []; document.pcb.vias = [];
  return document;
}

function namedComponentFixture(sources: ReadonlyArray<{ kind: "label" | "power"; id: string; name: string }>): EdaDocument {
  const document = isolatedPinFixture(); document.schematic.noConnects = [];
  const at = document.schematic.symbols[0].pins[0].at;
  document.schematic.netLabels = sources.filter((source) => source.kind === "label").map((source) => ({ id: source.id, text: source.name, at }));
  document.schematic.powerSymbols = sources.filter((source) => source.kind === "power").map((source) => ({ id: source.id, netName: source.name, powerType: "power-in" as const, at }));
  return document;
}
