import { describe, expect, it } from "vitest";
import { buildCopperConnectivity, buildRatsnest, createEmptyEdaDocument, createLedBoardFixture, createVoltageDividerFixture, isFortyFiveDegreeTrack, runDrc, transformFootprint, validateClosedOutline, type EdaDocument, type Footprint, type Pad } from "../lib/eda";

describe("two-layer PCB geometry and copper connectivity", () => {
  it("detects the known-bad open outline, width, angle and unconnected nets", () => {
    const bad = createLedBoardFixture({ repaired: false });
    expect(runDrc(bad).map((item) => item.code)).toEqual(expect.arrayContaining(["DRC_INVALID_OUTLINE", "DRC_TRACK_WIDTH", "DRC_TRACK_ANGLE", "DRC_UNCONNECTED_NET"]));
    expect(validateClosedOutline(bad.pcb.outline)).toBe(false);
  });

  it("rejects self-intersecting outlines and copper crossing a concave cut-out", () => {
    expect(validateClosedOutline([p(0, 0), p(20, 20), p(0, 20), p(20, 0), p(0, 0)])).toBe(false);
    const board = createEmptyEdaDocument("concave-board", "Concave board");
    board.nets = [{ id: "net:N", name: "N" }];
    board.pcb.outline = [p(0, 0), p(30, 0), p(30, 30), p(20, 30), p(20, 10), p(10, 10), p(10, 30), p(0, 30), p(0, 0)];
    board.pcb.tracks = [{ id: "track-cutout", net: "N", layer: "F.Cu", widthMm: 0.4, points: [p(5, 20), p(25, 20)] }];
    expect(runDrc(board)).toContainEqual(expect.objectContaining({ code: "DRC_EDGE_CLEARANCE", ids: ["track-cutout"] }));
  });

  it("detects segment crossings and segment-to-pad or via clearance", () => {
    const crossing = createVoltageDividerFixture();
    crossing.pcb.tracks.push({ id: "remote-vcc", net: "VCC", layer: "F.Cu", widthMm: 0.4, points: [p(45, 15), p(55, 25)] }, { id: "remote-gnd", net: "GND", layer: "F.Cu", widthMm: 0.4, points: [p(45, 25), p(55, 15)] });
    expect(runDrc(crossing)).toContainEqual(expect.objectContaining({ code: "DRC_CLEARANCE", ids: ["remote-gnd", "remote-vcc"] }));
    const padAndVia = createVoltageDividerFixture();
    padAndVia.pcb.tracks.push({ id: "near-pad", net: "GND", layer: "F.Cu", widthMm: 0.4, points: [p(20, 9), p(30, 9)] });
    padAndVia.pcb.vias.push({ id: "via-gnd", net: "GND", at: p(35, 17.46), diameterMm: 0.8, drillMm: 0.4 });
    expect(runDrc(padAndVia).filter((item) => item.code === "DRC_CLEARANCE").length).toBeGreaterThanOrEqual(2);
  });

  it("does not treat a remote same-name track as connectivity", () => {
    const board = createVoltageDividerFixture();
    board.pcb.tracks = board.pcb.tracks.filter((track) => track.net !== "VCC");
    board.pcb.tracks.push({ id: "remote-vcc", net: "VCC", layer: "F.Cu", widthMm: 0.4, points: [p(45, 5), p(55, 5)] });
    expect(runDrc(board)).toContainEqual(expect.objectContaining({ code: "DRC_UNCONNECTED_NET", message: expect.stringContaining("VCC") }));
    expect(buildRatsnest(board).map((edge) => edge.net)).toContain("VCC");
  });

  it("requires a via to bridge front and back copper tracks", () => {
    const board = createVoltageDividerFixture();
    board.pcb.tracks = board.pcb.tracks.filter((track) => track.net !== "VCC");
    board.pcb.tracks.push({ id: "vcc-front", net: "VCC", layer: "F.Cu", widthMm: 0.4, points: [p(10, 10), p(17, 10)] }, { id: "vcc-back", net: "VCC", layer: "B.Cu", widthMm: 0.4, points: [p(17, 10), p(25, 10)] });
    expect(buildCopperConnectivity(board).filter((component) => component.net === "VCC" && component.padIds.length)).toHaveLength(2);
    board.pcb.vias.push({ id: "via-vcc", net: "VCC", at: p(17, 10), diameterMm: 0.8, drillMm: 0.4 });
    expect(buildCopperConnectivity(board).filter((component) => component.net === "VCC" && component.padIds.length)).toHaveLength(1);
  });

  it("passes repaired boards with no residual ratsnest", () => {
    for (const board of [createLedBoardFixture(), createVoltageDividerFixture()]) { expect(board.pcb.tracks.every(isFortyFiveDegreeTrack)).toBe(true); expect(runDrc(board)).toEqual([]); expect(buildRatsnest(board)).toEqual([]); }
  });

  it("keeps separated 10 by 1 mm rotated rectangular pads electrically distinct", () => {
    const board = padGeometryBoard(rectPad("pad-a", 10, 10, 10, 1), rectPad("pad-b", 12, 10, 10, 1), 90);
    expect(netPadComponents(board)).toHaveLength(2);
    expect(buildRatsnest(board)).toHaveLength(1);
    expect(runDrc(board)).toContainEqual(expect.objectContaining({ code: "DRC_UNCONNECTED_NET", ids: ["pad-a", "pad-b"] }));
    board.pcb.footprints.forEach((footprint) => { footprint.rotationDeg = 0; });
    expect(netPadComponents(board)).toHaveLength(1);
  });

  it("uses independent pad rotation for asymmetric rectangles and ovals", () => {
    const rectangles = padGeometryBoard({ ...rectPad("pad-a", 10, 10, 10, 1), rotationDeg: 90 }, { ...rectPad("pad-b", 12, 10, 10, 1), rotationDeg: 90 }, 0);
    expect(netPadComponents(rectangles)).toHaveLength(2);
    rectangles.pcb.footprints.flatMap((footprint) => footprint.pads).forEach((pad) => { pad.rotationDeg = 0; });
    expect(netPadComponents(rectangles)).toHaveLength(1);
    const ovals = padGeometryBoard(ovalPad("pad-a", 10, 10, 6, 2, 90), ovalPad("pad-b", 12.5, 10, 6, 2, 90), 0);
    expect(netPadComponents(ovals)).toHaveLength(2);
    ovals.pcb.footprints.flatMap((footprint) => footprint.pads).forEach((pad) => { pad.rotationDeg = 0; });
    expect(netPadComponents(ovals)).toHaveLength(1);
  });

  it("mirrors asymmetric pad placement and orientation when changing footprint side", () => {
    const asymmetric = footprint("asymmetric", 10, 10, [{ ...rectPad("pad-a", 10, 10, 6, 1), rotationDeg: 45 }]);
    const target = footprint("target", 12.7, 12.7, [{ id: "pad-b", number: "1", at: p(12.7, 12.7), sizeMm: { width: 2, height: 2 }, shape: "circle", net: "N", throughHole: true }]);
    const board = padGeometryDocument([asymmetric, target]);
    expect(netPadComponents(board)).toHaveLength(1);
    board.pcb.footprints[0] = transformFootprint(asymmetric, asymmetric.at, asymmetric.rotationDeg, "back");
    expect(board.pcb.footprints[0].side).toBe("back");
    expect(netPadComponents(board)).toHaveLength(2);
    const offset = footprint("offset", 20, 20, [rectPad("offset-pad", 23, 20, 4, 1)]);
    expect(transformFootprint(offset, offset.at, 90, "back").pads[0].at).toEqual(p(20, 17));
  });
});

function p(xMm: number, yMm: number) { return { xMm, yMm }; }
function rectPad(id: string, xMm: number, yMm: number, width: number, height: number): Pad { return { id, number: "1", at: p(xMm, yMm), sizeMm: { width, height }, shape: "rect", net: "N", throughHole: true }; }
function ovalPad(id: string, xMm: number, yMm: number, width: number, height: number, rotationDeg: Pad["rotationDeg"]): Pad { return { ...rectPad(id, xMm, yMm, width, height), shape: "oval", rotationDeg }; }
function footprint(id: string, xMm: number, yMm: number, pads: Pad[]): Footprint { return { id, libraryId: `Test:${id}`, reference: id.toUpperCase(), at: p(xMm, yMm), rotationDeg: 0, side: "front", pads }; }
function padGeometryDocument(footprints: Footprint[]): EdaDocument { const board = createEmptyEdaDocument("pad-geometry", "Pad geometry"); board.nets = [{ id: "net:N", name: "N" }]; board.pcb.outline = [p(0, 0), p(40, 0), p(40, 40), p(0, 40), p(0, 0)]; board.pcb.footprints = footprints; return board; }
function padGeometryBoard(first: Pad, second: Pad, rotationDeg: Footprint["rotationDeg"]): EdaDocument { const board = padGeometryDocument([footprint("fp-a", first.at.xMm, first.at.yMm, [first]), footprint("fp-b", second.at.xMm, second.at.yMm, [second])]); board.pcb.footprints.forEach((item) => { item.rotationDeg = rotationDeg; }); return board; }
function netPadComponents(document: EdaDocument) { return buildCopperConnectivity(document).filter((component) => component.net === "N" && component.padIds.length); }
