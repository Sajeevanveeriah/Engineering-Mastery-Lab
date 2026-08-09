import { createEmptyEdaDocument } from "./document";
import type { EdaDocument, EdaExternalVerificationState, Footprint, PinElectricalType, Point, SchematicSymbol } from "./types";

interface PinSpec { number: string; name: string; type: PinElectricalType; at: Point }

export const EDA_EXTERNAL_VERIFICATION_STATE: Readonly<EdaExternalVerificationState> = Object.freeze({ fixture: "FIXTURE_VERIFIED", realTool: "REAL_TOOL_NOT_VERIFIED", adaptersInvoked: false });

export function createVoltageDividerFixture(options: { repaired?: boolean } = {}): EdaDocument {
  const repaired = options.repaired ?? true;
  const document = createEmptyEdaDocument("voltage-divider-v1", "Voltage divider");
  const symbols = [
    symbol("v1", "Simulation:VDC", "V1", "10 V", [{ number: "1", name: "+", type: "power-out", at: point(10, 10) }, { number: "2", name: "-", type: "power-out", at: point(10, 30) }]),
    symbol("r1", "Device:R", "R1", "10 kOhm", [{ number: "1", name: "A", type: "passive", at: point(20, 10) }, { number: "2", name: "B", type: "passive", at: point(30, 20) }]),
    symbol("r2", "Device:R", "R2", "10 kOhm", [{ number: "1", name: "A", type: "passive", at: point(30, 20) }, { number: "2", name: "B", type: "passive", at: point(20, 30) }]),
    symbol("g1", "Power:GND", "#PWR1", "GND", [{ number: "1", name: "GND", type: "power-in", at: point(10, 30) }])
  ];
  document.schematic.symbols = symbols;
  document.schematic.wires = [wire("w-vcc", 10, 10, 20, 10), wire("w-mid", 30, 20, 40, 20), wire("w-gnd", 20, 30, 10, 30)];
  document.schematic.netLabels = [{ id: "label-vcc", text: "VCC", at: point(15, 10) }, { id: "label-mid", text: "VOUT", at: point(40, 20) }, { id: "label-gnd", text: "GND", at: point(15, 30) }];
  document.schematic.junctions = [{ id: "junction-mid", at: point(30, 20) }];
  document.pcb.outline = repaired ? rectangle(0, 0, 60, 40) : rectangle(0, 0, 60, 40).slice(0, -1);
  document.pcb.footprints = [footprint(symbols[0], 10, 10, ["VCC", "GND"]), footprint(symbols[1], 25, 10, ["VCC", "VOUT"]), footprint(symbols[2], 40, 25, ["VOUT", "GND"]), footprint(symbols[3], 15, 25, ["GND"])];
  document.pcb.footprints[0].pads[1].at = point(10, 12.54);
  document.pcb.tracks = repaired ? [track("t-vcc", "VCC", "F.Cu", 0.4, [point(10, 10), point(25, 10)]), track("t-mid", "VOUT", "F.Cu", 0.4, [point(27.54, 10), point(35, 17.46), point(40, 22.46), point(40, 25)]), track("t-gnd", "GND", "B.Cu", 0.4, [point(10, 12.54), point(12.46, 15), point(15, 17.54), point(15, 25), point(15, 30), point(42.54, 30), point(42.54, 25)])] : [track("t-vcc", "VCC", "F.Cu", 0.1, [point(10, 10), point(25, 11)])];
  enrichFixture(document, ["GND", "VCC", "VOUT"]);
  return document;
}

export function createLedBoardFixture(options: { repaired?: boolean } = {}): EdaDocument {
  const repaired = options.repaired ?? true;
  const document = createEmptyEdaDocument("led-board-v1", "LED board");
  const symbols = [
    symbol("j1", "Connector_Generic:Conn_01x02", "J1", "Power", [{ number: "1", name: "VCC", type: "power-out", at: point(10, 10) }, { number: "2", name: "GND", type: "power-out", at: point(10, 30) }]),
    symbol("r1", "Device:R", repaired ? "R1" : "R?", "330 Ohm", [{ number: "1", name: "A", type: "passive", at: point(20, 10) }, { number: "2", name: "B", type: "passive", at: point(30, 10) }]),
    symbol("d1", "Device:LED", "D1", "Red LED", [{ number: "2", name: "A", type: "passive", at: point(30, 10) }, { number: "1", name: "K", type: "passive", at: point(30, 30) }]),
    symbol("g1", "Power:GND", "#PWR1", "GND", [{ number: "1", name: "GND", type: "power-in", at: point(10, 30) }])
  ];
  document.schematic.symbols = symbols;
  document.schematic.wires = [wire("w1", 10, 10, 20, 10), ...(repaired ? [wire("w3", 30, 30, 10, 30)] : [])];
  document.schematic.netLabels = [{ id: "label-vcc", text: "VCC", at: point(15, 10) }, { id: "label-led", text: "LED_A", at: point(30, 10) }, ...(repaired ? [{ id: "label-gnd", text: "GND", at: point(20, 30) }] : [])];
  document.pcb.outline = repaired ? rectangle(0, 0, 50, 40) : [point(0, 0), point(50, 0), point(50, 40)];
  document.pcb.footprints = [footprint(symbols[0], 10, 10, ["VCC", "GND"]), footprint(symbols[1], 22, 10, ["VCC", "LED_A"]), footprint(symbols[2], 35, 22, ["LED_A", "GND"]), footprint(symbols[3], 12, 25, ["GND"])];
  document.pcb.footprints[0].pads[1].at = point(10, 12.54);
  document.pcb.tracks = repaired ? [track("t1", "VCC", "F.Cu", 0.4, [point(10, 10), point(22, 10)]), track("t2", "LED_A", "F.Cu", 0.4, [point(24.54, 10), point(29, 14.46), point(35, 20.46), point(35, 22)]), track("t3", "GND", "B.Cu", 0.4, [point(10, 12.54), point(10, 23), point(12, 25), point(37.54, 25), point(37.54, 22)])] : [track("t1", "VCC", "F.Cu", 0.1, [point(0.1, 0.1), point(22, 11)])];
  enrichFixture(document, ["GND", "LED_A", "VCC"]);
  return document;
}

function symbol(id: string, libraryId: string, reference: string, value: string, pins: PinSpec[]): SchematicSymbol { return { id, libraryId, reference, value, at: pins[0].at, rotationDeg: 0, footprintId: `${id}-fp`, pins: pins.map((pin) => ({ id: `${id}-pin-${pin.number}`, number: pin.number, name: pin.name, electricalType: pin.type, required: true, at: pin.at })) }; }
function footprint(source: SchematicSymbol, xMm: number, yMm: number, nets: string[]): Footprint { return { id: source.footprintId as string, libraryId: `EML:${source.libraryId.replaceAll(":", "-")}`, reference: source.reference, at: point(xMm, yMm), rotationDeg: 0, side: "front", pads: source.pins.map((pin, index) => ({ id: `${source.id}-pad-${pin.number}`, number: pin.number, at: point(xMm + index * 2.54, yMm), sizeMm: { width: 1.6, height: 1.6 }, shape: index ? "circle" : "rect", net: nets[index], throughHole: true })) }; }
function wire(id: string, x1: number, y1: number, x2: number, y2: number) { return { id, from: point(x1, y1), to: point(x2, y2) }; }
function track(id: string, net: string, layer: "F.Cu" | "B.Cu", widthMm: number, points: Point[]) { return { id, net, layer, widthMm, points }; }
function rectangle(x: number, y: number, width: number, height: number): Point[] { return [point(x, y), point(x + width, y), point(x + width, y + height), point(x, y + height), point(x, y)]; }
function point(xMm: number, yMm: number): Point { return { xMm, yMm }; }
function enrichFixture(document: EdaDocument, names: string[]): void { document.nets = names.map((name) => ({ id: `${document.id}:net:${name}`, name })); document.provenance = [{ id: `${document.id}:provenance:1`, source: "offline-fixture", detail: document.title }]; }
