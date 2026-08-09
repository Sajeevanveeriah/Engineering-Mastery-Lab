import type { Footprint, PinElectricalType, Point, SchematicPin, SchematicSymbol } from "./types";

export type PaletteKind = "resistor" | "capacitor" | "diode" | "led" | "source" | "ground" | "connector" | "ic";

export interface PaletteEntry {
  kind: PaletteKind;
  libraryId: string;
  referencePrefix: string;
  defaultValue: string;
  pins: ReadonlyArray<{ number: string; name: string; electricalType: PinElectricalType; required: boolean; offset: Point }>;
  footprintLibraryId: string;
}

export const OFFLINE_PALETTE: Readonly<Record<PaletteKind, PaletteEntry>> = Object.freeze({
  resistor: entry("resistor", "Device:R", "R", "1 kOhm", "Resistor_THT:R_Axial", [["1", "A", "passive", true, -5], ["2", "B", "passive", true, 5]]),
  capacitor: entry("capacitor", "Device:C", "C", "100 nF", "Capacitor_THT:C_Disc", [["1", "+", "passive", true, -5], ["2", "-", "passive", true, 5]]),
  diode: entry("diode", "Device:D", "D", "1N4148", "Diode_THT:D_DO-35", [["1", "K", "passive", true, -5], ["2", "A", "passive", true, 5]]),
  led: entry("led", "Device:LED", "D", "LED", "LED_THT:LED_D5.0mm", [["1", "K", "passive", true, -5], ["2", "A", "passive", true, 5]]),
  source: entry("source", "Simulation:VDC", "V", "5 V", "Connector:TestPoint_2Pole", [["1", "+", "power-out", true, -5], ["2", "-", "power-out", true, 5]]),
  ground: entry("ground", "Power:GND", "#PWR", "GND", "Connector:TestPoint", [["1", "GND", "power-in", true, 0]]),
  connector: entry("connector", "Connector_Generic:Conn_01x02", "J", "Conn_01x02", "Connector_PinHeader_2.54mm:PinHeader_1x02", [["1", "Pin_1", "passive", true, -2.54], ["2", "Pin_2", "passive", true, 2.54]]),
  ic: entry("ic", "EML:Generic_IC", "U", "Generic IC", "Package_DIP:DIP-8_W7.62mm", [["1", "IN", "input", true, -5], ["2", "OUT", "output", true, 5], ["3", "VCC", "power-in", true, -2.5], ["4", "GND", "power-in", true, 2.5]])
});

function entry(kind: PaletteKind, libraryId: string, referencePrefix: string, defaultValue: string, footprintLibraryId: string, pins: Array<[string, string, PinElectricalType, boolean, number]>): PaletteEntry {
  return { kind, libraryId, referencePrefix, defaultValue, footprintLibraryId, pins: pins.map(([number, name, electricalType, required, xMm]) => ({ number, name, electricalType, required, offset: { xMm, yMm: 0 } })) };
}

export function createPaletteSymbol(kind: PaletteKind, id: string, at: Point, reference = `${OFFLINE_PALETTE[kind].referencePrefix}?`): SchematicSymbol {
  const item = OFFLINE_PALETTE[kind];
  const pins: SchematicPin[] = item.pins.map((pin, index) => ({ id: `${id}:pin:${index + 1}`, number: pin.number, name: pin.name, electricalType: pin.electricalType, required: pin.required, at: { xMm: at.xMm + pin.offset.xMm, yMm: at.yMm + pin.offset.yMm } }));
  return { id, libraryId: item.libraryId, reference, value: item.defaultValue, at: { ...at }, rotationDeg: 0, pins, footprintId: `${id}:footprint` };
}

export function createPaletteFootprint(kind: PaletteKind, symbol: SchematicSymbol, at: Point): Footprint {
  const item = OFFLINE_PALETTE[kind];
  return { id: symbol.footprintId ?? `${symbol.id}:footprint`, libraryId: item.footprintLibraryId, reference: symbol.reference, at: { ...at }, rotationDeg: 0, side: "front", pads: symbol.pins.map((pin, index) => ({ id: `${symbol.id}:pad:${pin.number}`, number: pin.number, at: { xMm: at.xMm + index * 2.54, yMm: at.yMm }, sizeMm: { width: 1.8, height: 1.8 }, shape: index === 0 ? "rect" : "circle", throughHole: true })) };
}
