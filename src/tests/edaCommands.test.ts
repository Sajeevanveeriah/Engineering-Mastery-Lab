import { describe, expect, it } from "vitest";
import { canonicalEdaJson, createEdaHistory, createVoltageDividerFixture, dispatchEdaCommand, dispatchEdaCommandGroup, redoEdaCommand, undoEdaCommand } from "../lib/eda";

describe("bounded immutable EDA command history", () => {
  it("applies, undoes and redoes authoring mutations without changing the source", () => {
    const source = createVoltageDividerFixture();
    const before = canonicalEdaJson(source);
    let history = createEdaHistory(source);
    history = dispatchEdaCommand(history, { type: "schematic.add", collection: "junctions", value: { id: "junction-extra", at: { xMm: 5, yMm: 5 } } });
    history = dispatchEdaCommand(history, { type: "document.setTitle", title: "Edited divider" });
    history = dispatchEdaCommand(history, { type: "session.setLayerVisible", layer: "B.Cu", visible: false });
    expect(history.present.document.schematic.junctions).toHaveLength(2);
    expect(history.present.session.visible["B.Cu"]).toBe(false);
    expect(canonicalEdaJson(source)).toBe(before);

    history = undoEdaCommand(history);
    expect(history.present.session.visible["B.Cu"]).toBe(true);
    history = redoEdaCommand(history);
    expect(history.present.session.visible["B.Cu"]).toBe(false);
  });

  it("rejects duplicate additions and clears redo after a new command", () => {
    let history = createEdaHistory(createVoltageDividerFixture());
    expect(() => dispatchEdaCommand(history, { type: "schematic.add", collection: "junctions", value: { id: "junction-mid", at: { xMm: 0, yMm: 0 } } })).toThrow(/Duplicate/);
    history = dispatchEdaCommand(history, { type: "document.setTitle", title: "A" });
    history = undoEdaCommand(history);
    history = dispatchEdaCommand(history, { type: "document.setTitle", title: "B" });
    expect(history.future).toEqual([]);
  });

  it("rejects invalid commands atomically and bounds grouped history", () => {
    const initial = createEdaHistory(createVoltageDividerFixture(), undefined, 2);
    const snapshot = canonicalEdaJson(initial.present.document);
    expect(() => dispatchEdaCommand(initial, { type: "pcb.setRules", rules: { ...initial.present.document.pcb.rules, clearanceMm: -1 } })).toThrow(/INVALID_DIMENSION/);
    expect(canonicalEdaJson(initial.present.document)).toBe(snapshot);
    let history = dispatchEdaCommandGroup(initial, [{ type: "document.setTitle", title: "A" }, { type: "session.setLayerVisible", layer: "B.Cu", visible: false }]);
    history = dispatchEdaCommand(history, { type: "document.setTitle", title: "B" });
    history = dispatchEdaCommand(history, { type: "document.setTitle", title: "C" });
    expect(history.past).toHaveLength(2);
    expect(undoEdaCommand(history).present.document.title).toBe("B");
  });

  it("moves and rotates symbol pins and footprint pads atomically around their origins", () => {
    let history = createEdaHistory(createVoltageDividerFixture());
    const pinBefore = history.present.document.schematic.symbols.find((symbol) => symbol.id === "v1")!.pins[1].at;
    history = dispatchEdaCommand(history, { type: "schematic.transformSymbol", id: "v1", at: { xMm: 20, yMm: 20 }, rotationDeg: 90 });
    const movedSymbol = history.present.document.schematic.symbols.find((symbol) => symbol.id === "v1")!;
    expect(pinBefore).toEqual({ xMm: 10, yMm: 30 });
    expect(movedSymbol.pins[1].at).toEqual({ xMm: 0, yMm: 20 });
    const padBefore = history.present.document.pcb.footprints.find((footprint) => footprint.id === "r1-fp")!.pads[1];
    history = dispatchEdaCommand(history, { type: "pcb.transformFootprint", id: "r1-fp", at: { xMm: 30, yMm: 20 }, rotationDeg: 90 });
    const movedPad = history.present.document.pcb.footprints.find((footprint) => footprint.id === "r1-fp")!.pads[1];
    expect(padBefore.at).toEqual({ xMm: 27.54, yMm: 10 });
    expect(movedPad.at).toEqual({ xMm: 30, yMm: 22.54 });
    expect(movedPad.net).toBe("VOUT");
  });
});
