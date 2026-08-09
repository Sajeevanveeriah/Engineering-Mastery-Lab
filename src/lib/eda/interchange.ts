import { canonicalEdaJson, createEmptyEdaDocument } from "./document";
import type { EdaDocument, Footprint, LossEntry, Pad, PinElectricalType, Point, SchematicPin, SchematicSymbol } from "./types";

export const EML_KICAD_GENERATOR = "engineering-mastery-lab";

const MAX_FILE_BYTES = 10_000_000;
const MAX_NODES = 200_000;
const MAX_DEPTH = 64;
const MAX_STRING_CHARS = 65_536;
const MAX_ATOM_CHARS = 1_024;

export interface NgspiceSeries { id: string; label: string; unit: "s" | "V" | "A"; values: number[] }
export interface ControlledNgspiceResult { fixtureId: "eml-voltage-divider-v1"; engine: "controlled-fixture"; series: NgspiceSeries[]; accessibleTable: Array<{ timeS: number; inputV: number; outputV: number }> }
export interface KicadExport { text: string; lossReport: LossEntry[]; lossAcknowledgement?: KicadLossAcknowledgement }
export interface KicadProjectExport { schematicText: string; pcbText: string; lossReport: LossEntry[]; lossAcknowledgement?: KicadLossAcknowledgement }
export interface KicadImport { document: EdaDocument; lossReport: LossEntry[]; generator: string; lossAcknowledgementToken?: string; lossAcknowledgement?: KicadLossAcknowledgement }
export interface KicadProjectImport extends KicadImport { schematicGenerator: string; pcbGenerator: string }
export interface KicadLossAcknowledgement { token: string; codes: string[] }
export interface KicadExportOptions { preservedUnsupported?: LossEntry[]; lossAcknowledgement?: KicadLossAcknowledgement }

interface SList { kind: "list"; value: SExpr[]; start: number; end: number }
interface SAtom { kind: "atom" | "string"; value: string; start: number; end: number }
type SExpr = SList | SAtom;

export function generateVoltageDividerNgspiceNetlist(): string {
  return ["* EML controlled voltage divider fixture", "V1 in 0 DC 10", "R1 in out 10k", "R2 out 0 10k", ".tran 1m 5m", ".print tran v(in) v(out)", ".end", ""].join("\n");
}

export function createControlledNgspiceResult(): ControlledNgspiceResult {
  const time = [0, 0.001, 0.002, 0.003, 0.004, 0.005];
  const input = time.map(() => 10);
  const output = time.map(() => 5);
  return { fixtureId: "eml-voltage-divider-v1", engine: "controlled-fixture", series: [{ id: "time", label: "Time", unit: "s", values: time }, { id: "v-in", label: "Input voltage", unit: "V", values: input }, { id: "v-out", label: "Output voltage", unit: "V", values: output }], accessibleTable: time.map((timeS, index) => ({ timeS, inputV: input[index], outputV: output[index] })) };
}

export function acknowledgeKicadLosses(losses: readonly LossEntry[]): KicadLossAcknowledgement {
  const sorted = sortLosses(losses);
  return { token: lossToken(sorted), codes: [...new Set(sorted.map((loss) => loss.code))] };
}

export function inspectKicadProjectLosses(document: EdaDocument, preservedUnsupported: readonly LossEntry[] = []): LossEntry[] {
  canonicalEdaJson(document);
  return sortLosses([...preservedUnsupported, ...projectExportLosses(document)]);
}

export function inspectKicadSExpressionLosses(document: EdaDocument, preservedUnsupported: readonly LossEntry[] = []): LossEntry[] {
  return sortLosses([...inspectKicadProjectLosses(document, preservedUnsupported), schematicOnlyLoss()]);
}

export function exportKicadProject(document: EdaDocument, options: KicadExportOptions = {}): KicadProjectExport {
  const lossReport = inspectKicadProjectLosses(document, options.preservedUnsupported);
  requireLossAcknowledgement(lossReport, options.lossAcknowledgement);
  return {
    schematicText: exportSchematic(document),
    pcbText: exportPcb(document),
    lossReport,
    lossAcknowledgement: lossReport.length ? acknowledgeKicadLosses(lossReport) : undefined
  };
}

/** Backwards-compatible schematic-only export. Use exportKicadProject for a complete project. */
export function exportKicadSExpression(document: EdaDocument, preservedUnsupported: LossEntry[] = [], lossAcknowledgement?: KicadLossAcknowledgement): KicadExport {
  const lossReport = inspectKicadSExpressionLosses(document, preservedUnsupported);
  requireLossAcknowledgement(lossReport, lossAcknowledgement);
  return { text: exportSchematic(document), lossReport, lossAcknowledgement: lossReport.length ? acknowledgeKicadLosses(lossReport) : undefined };
}

export function importKicadProject(input: { schematicText: string; pcbText: string }): KicadProjectImport {
  const schematic = parseRoot(input.schematicText, "kicad_sch");
  const pcb = parseRoot(input.pcbText, "kicad_pcb");
  const document = createEmptyEdaDocument(rootUuid(schematic.root) ?? "imported-kicad-project", "Imported KiCad project");
  const losses = [...importSchematic(schematic, document), ...importPcb(pcb, document)];
  linkSymbolsAndFootprints(document, losses);
  declareReferencedNets(document, declaredPcbNetNames(pcb.root));
  recordImportProvenance(document, `${schematic.generator};${pcb.generator}`);
  canonicalEdaJson(document);
  const lossReport = sortLosses(losses);
  const lossAcknowledgement = lossReport.length ? acknowledgeKicadLosses(lossReport) : undefined;
  return {
    document,
    lossReport,
    generator: schematic.generator === pcb.generator ? schematic.generator : `${schematic.generator};${pcb.generator}`,
    schematicGenerator: schematic.generator,
    pcbGenerator: pcb.generator,
    lossAcknowledgementToken: lossAcknowledgement?.token,
    lossAcknowledgement
  };
}

/** Imports one genuine KiCad file. The other editor surface remains empty. */
export function importKicadSExpression(text: string): KicadImport {
  const parsed = parseRoot(text);
  const document = createEmptyEdaDocument(rootUuid(parsed.root) ?? `imported-${parsed.name}`, `Imported ${parsed.name === "kicad_sch" ? "KiCad schematic" : "KiCad PCB"}`);
  const losses = parsed.name === "kicad_sch" ? importSchematic(parsed, document) : importPcb(parsed, document);
  linkSymbolsAndFootprints(document, losses);
  declareReferencedNets(document, parsed.name === "kicad_pcb" ? declaredPcbNetNames(parsed.root) : []);
  recordImportProvenance(document, parsed.generator);
  canonicalEdaJson(document);
  const lossReport = sortLosses(losses);
  const lossAcknowledgement = lossReport.length ? acknowledgeKicadLosses(lossReport) : undefined;
  return { document, lossReport, generator: parsed.generator, lossAcknowledgementToken: lossAcknowledgement?.token, lossAcknowledgement };
}

function exportSchematic(document: EdaDocument): string {
  const lines = [`(kicad_sch (version 20231120) (generator ${quote(EML_KICAD_GENERATOR)})`, `  (uuid ${quote(document.id)})`, `  (paper "A4")`, "  (lib_symbols"];
  const footprintById = new Map(document.pcb.footprints.map((footprint) => [footprint.id, footprint]));
  const byLibrary = new Map<string, SchematicSymbol>();
  for (const symbol of document.schematic.symbols) if (!byLibrary.has(symbol.libraryId)) byLibrary.set(symbol.libraryId, symbol);
  for (const [libraryId, symbol] of [...byLibrary].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`    (symbol ${quote(libraryId)}`);
    lines.push("      (pin_names (offset 0)) (exclude_from_sim no) (in_bom yes) (on_board yes)");
    for (const pin of [...symbol.pins].sort((a, b) => a.number.localeCompare(b.number, "en", { numeric: true }))) {
      const dx = round(pin.at.xMm - symbol.at.xMm); const dy = round(pin.at.yMm - symbol.at.yMm);
      lines.push(`      (pin ${pinTypeToKicad(pin.electricalType)} line (at ${dx} ${dy} 0) (length 2.54) (name ${quote(pin.name)} (effects (font (size 1.27 1.27)))) (number ${quote(pin.number)} (effects (font (size 1.27 1.27)))))`);
    }
    lines.push("    )");
  }
  lines.push("  )");
  for (const item of [...document.schematic.junctions].sort(byId)) lines.push(`  (junction (at ${round(item.at.xMm)} ${round(item.at.yMm)}) (diameter 0) (color 0 0 0 0) (uuid ${quote(item.id)}))`);
  for (const wire of [...document.schematic.wires].sort(byId)) lines.push(`  (wire (pts (xy ${round(wire.from.xMm)} ${round(wire.from.yMm)}) (xy ${round(wire.to.xMm)} ${round(wire.to.yMm)})) (stroke (width 0) (type default)) (uuid ${quote(wire.id)}))`);
  for (const label of [...document.schematic.netLabels].sort(byId)) lines.push(`  (label ${quote(label.text)} (at ${round(label.at.xMm)} ${round(label.at.yMm)} 0) (effects (font (size 1.27 1.27)) (justify left bottom)) (uuid ${quote(label.id)}))`);
  for (const symbol of [...document.schematic.symbols].sort(byId)) {
    lines.push(`  (symbol (lib_id ${quote(symbol.libraryId)}) (at ${round(symbol.at.xMm)} ${round(symbol.at.yMm)} ${symbol.rotationDeg}) (unit 1) (exclude_from_sim no) (in_bom yes) (on_board yes) (uuid ${quote(symbol.id)})`);
    lines.push(`    (property "Reference" ${quote(symbol.reference)} (at ${round(symbol.at.xMm)} ${round(symbol.at.yMm - 2.54)} 0) (effects (font (size 1.27 1.27))))`);
    lines.push(`    (property "Value" ${quote(symbol.value)} (at ${round(symbol.at.xMm)} ${round(symbol.at.yMm + 2.54)} 0) (effects (font (size 1.27 1.27))))`);
    if (symbol.footprintId) lines.push(`    (property "Footprint" ${quote(footprintById.get(symbol.footprintId)?.libraryId ?? "")} (at ${round(symbol.at.xMm)} ${round(symbol.at.yMm + 5.08)} 0) (effects (font (size 1.27 1.27)) hide))`);
    for (const pin of [...symbol.pins].sort((a, b) => a.number.localeCompare(b.number, "en", { numeric: true }))) lines.push(`    (pin ${quote(pin.number)} (uuid ${quote(pin.id)}))`);
    lines.push("  )");
  }
  for (const noConnect of [...document.schematic.noConnects].sort(byId)) {
    const at = document.schematic.symbols.flatMap((symbol) => symbol.pins).find((pin) => pin.id === noConnect.pinId)?.at;
    if (at) lines.push(`  (no_connect (at ${round(at.xMm)} ${round(at.yMm)}) (uuid ${quote(noConnect.id)}))`);
  }
  lines.push(")", "");
  return lines.join("\n");
}

function exportPcb(document: EdaDocument): string {
  const netNames = [...new Set(document.pcb.footprints.flatMap((footprint) => footprint.pads.map((pad) => pad.net)).concat(document.pcb.tracks.map((track) => track.net), document.pcb.vias.map((via) => via.net)).filter((name): name is string => Boolean(name)))].sort();
  const netCode = new Map(netNames.map((name, index) => [name, index + 1]));
  const lines = [`(kicad_pcb (version 20240108) (generator ${quote(EML_KICAD_GENERATOR)})`, "  (general (thickness 1.6))", "  (paper \"A4\")", "  (layers", "    (0 \"F.Cu\" signal)", "    (31 \"B.Cu\" signal)", "    (36 \"B.SilkS\" user \"b.silkscreen\")", "    (37 \"F.SilkS\" user \"f.silkscreen\")", "    (44 \"Edge.Cuts\" user)", "  )", `  (setup (pad_to_mask_clearance 0) (allow_soldermask_bridges_in_footprints no))`, `  (net 0 "")`];
  for (const name of netNames) lines.push(`  (net ${netCode.get(name)} ${quote(name)})`);
  for (const footprint of [...document.pcb.footprints].sort(byId)) {
    const layer = footprint.side === "front" ? "F.Cu" : "B.Cu";
    lines.push(`  (footprint ${quote(footprint.libraryId)} (layer ${quote(layer)}) (uuid ${quote(footprint.id)}) (at ${round(footprint.at.xMm)} ${round(footprint.at.yMm)} ${footprint.rotationDeg})`);
    lines.push(`    (property "Reference" ${quote(footprint.reference)} (at 0 -2.5 ${footprint.rotationDeg}) (layer ${quote(footprint.side === "front" ? "F.SilkS" : "B.SilkS")}))`);
    for (const pad of [...footprint.pads].sort(byId)) {
      const local = inverseTransform(pad.at, footprint.at, footprint.rotationDeg);
      const type = pad.throughHole ? "thru_hole" : "smd";
      const layers = pad.throughHole ? '"*.Cu" "*.Mask"' : `${quote(layer)} ${quote(footprint.side === "front" ? "F.Paste" : "B.Paste")} ${quote(footprint.side === "front" ? "F.Mask" : "B.Mask")}`;
      const drill = pad.throughHole ? ` (drill ${round(Math.min(pad.sizeMm.width, pad.sizeMm.height) * 0.5)})` : "";
      const net = pad.net ? ` (net ${netCode.get(pad.net) ?? 0} ${quote(pad.net)})` : "";
      lines.push(`    (pad ${quote(pad.number)} ${type} ${pad.shape} (at ${round(local.xMm)} ${round(local.yMm)}) (size ${round(pad.sizeMm.width)} ${round(pad.sizeMm.height)})${drill} (layers ${layers})${net} (uuid ${quote(pad.id)}))`);
    }
    lines.push("  )");
  }
  for (let index = 1; index < document.pcb.outline.length; index += 1) {
    const start = document.pcb.outline[index - 1]; const end = document.pcb.outline[index];
    lines.push(`  (gr_line (start ${round(start.xMm)} ${round(start.yMm)}) (end ${round(end.xMm)} ${round(end.yMm)}) (stroke (width 0.05) (type default)) (layer "Edge.Cuts") (uuid ${quote(`outline-${index}`)}))`);
  }
  for (const track of [...document.pcb.tracks].sort(byId)) for (let index = 1; index < track.points.length; index += 1) {
    const start = track.points[index - 1]; const end = track.points[index];
    const segmentId = track.points.length === 2 ? track.id : `${track.id}-${index}`;
    lines.push(`  (segment (start ${round(start.xMm)} ${round(start.yMm)}) (end ${round(end.xMm)} ${round(end.yMm)}) (width ${round(track.widthMm)}) (layer ${quote(track.layer)}) (net ${netCode.get(track.net) ?? 0}) (uuid ${quote(segmentId)}))`);
  }
  for (const via of [...document.pcb.vias].sort(byId)) lines.push(`  (via (at ${round(via.at.xMm)} ${round(via.at.yMm)}) (size ${round(via.diameterMm)}) (drill ${round(via.drillMm)}) (layers "F.Cu" "B.Cu") (net ${netCode.get(via.net) ?? 0}) (uuid ${quote(via.id)}))`);
  lines.push(")", "");
  return lines.join("\n");
}

function importSchematic(parsed: ParsedRoot, document: EdaDocument): LossEntry[] {
  const losses: LossEntry[] = [];
  const libraries = new Map<string, SchematicPin[]>();
  const libSymbols = child(parsed.root, "lib_symbols");
  if (libSymbols) {
    for (const definition of children(libSymbols, "symbol")) {
      const libraryId = scalar(definition, 1) ?? `unknown-library-${libraries.size + 1}`;
      const pins: SchematicPin[] = descendants(definition, "pin").filter((pin) => scalar(pin, 1) && child(pin, "number")).map((pin, index) => {
        const at = atPoint(pin); const number = scalar(child(pin, "number"), 1) ?? String(index + 1); const name = scalar(child(pin, "name"), 1) ?? number;
        return { id: `library-${safeId(libraryId)}-pin-${safeId(number)}`, number, name, electricalType: pinTypeFromKicad(scalar(pin, 1) ?? "passive"), required: true, at };
      });
      libraries.set(libraryId, uniquePins(pins));
      const unsupported = unsupportedLibraryNodes(definition);
      for (const node of unsupported) losses.push(loss(parsed.text, "KICAD_LIB_SYMBOL_UNSUPPORTED_NODE", `Unsupported ${head(node)} node inside lib_symbols was reported`, node));
    }
  }
  for (const form of topLevel(parsed.root)) {
    const name = head(form);
    if (name === "symbol" && child(form, "lib_id")) {
      const libraryId = scalar(child(form, "lib_id"), 1) ?? "Unknown:Symbol"; const at = atPoint(form); const rawRotation = numberAt(child(form, "at"), 3, 0); const rotationDeg = normaliseSchRotation(rawRotation);
      if (!sameAngle(rawRotation, rotationDeg)) losses.push(loss(parsed.text, "KICAD_SYMBOL_ROTATION_QUANTISED", `Schematic rotation ${rawRotation} degrees was quantised to ${rotationDeg} degrees`, child(form, "at") ?? form));
      const reference = property(form, "Reference") ?? `U${document.schematic.symbols.length + 1}`; const value = property(form, "Value") ?? libraryId.split(":").at(-1) ?? libraryId;
      const id = entityId(form, `symbol-${reference}`); const libraryPins = libraries.get(libraryId) ?? [];
      const instancePins = children(form, "pin");
      const pins = (libraryPins.length ? libraryPins : instancePins.map((pin, index) => ({ id: "", number: scalar(pin, 1) ?? String(index + 1), name: scalar(pin, 1) ?? String(index + 1), electricalType: "passive" as PinElectricalType, required: true, at: { xMm: 0, yMm: 0 } }))).map((pin) => {
        const instance = instancePins.find((candidate) => scalar(candidate, 1) === pin.number);
        return { ...pin, id: entityId(instance, `${id}-pin-${safeId(pin.number)}`), at: transform(pin.at, at, rotationDeg) };
      });
      document.schematic.symbols.push({ id, libraryId, reference, value, at, rotationDeg, pins, footprintId: property(form, "Footprint") || undefined });
      for (const propertyForm of children(form, "property").filter((item) => !["Reference", "Value", "Footprint"].includes(scalar(item, 1) ?? ""))) losses.push(loss(parsed.text, "KICAD_SYMBOL_PROPERTY_UNSUPPORTED", `Unsupported symbol property ${scalar(propertyForm, 1) ?? "unknown"} was reported`, propertyForm));
      continue;
    }
    if (name === "wire") { const pts = child(form, "pts"); const xy = pts ? children(pts, "xy") : []; if (xy.length >= 2) document.schematic.wires.push({ id: entityId(form, `wire-${document.schematic.wires.length + 1}`), from: xyPoint(xy[0]), to: xyPoint(xy[xy.length - 1]) }); else losses.push(loss(parsed.text, "KICAD_WIRE_INVALID", "Wire without two points was not imported", form)); continue; }
    if (name === "junction") { document.schematic.junctions.push({ id: entityId(form, `junction-${document.schematic.junctions.length + 1}`), at: atPoint(form) }); continue; }
    if (name === "label" || name === "global_label") { document.schematic.netLabels.push({ id: entityId(form, `label-${document.schematic.netLabels.length + 1}`), text: scalar(form, 1) ?? "", at: atPoint(form) }); if (name === "global_label") losses.push(loss(parsed.text, "KICAD_GLOBAL_LABEL_DOWNGRADED", "Global label was imported as a local net label", form)); continue; }
    if (name === "no_connect") { const at = atPoint(form); const match = nearestPin(document.schematic.symbols, at); if (match) document.schematic.noConnects.push({ id: entityId(form, `no-connect-${document.schematic.noConnects.length + 1}`), symbolId: match.symbol.id, pinId: match.pin.id }); else losses.push(loss(parsed.text, "KICAD_NO_CONNECT_UNRESOLVED", "No-connect point did not match an imported pin", form)); continue; }
    if (!["version", "generator", "generator_version", "uuid", "paper", "lib_symbols"].includes(name)) losses.push(loss(parsed.text, unsupportedCode(name), `Unsupported KiCad schematic form ${name} was reported`, form));
  }
  return losses;
}

function importPcb(parsed: ParsedRoot, document: EdaDocument): LossEntry[] {
  const losses: LossEntry[] = []; const nets = new Map<number, string>(); const outlineSegments: Array<{ start: Point; end: Point }> = [];
  for (const net of children(parsed.root, "net")) {
    const code = numberAt(net, 1, 0); const name = scalar(net, 2) ?? "";
    if (nets.has(code) && nets.get(code) !== name) losses.push(loss(parsed.text, "KICAD_NET_TABLE_COLLISION", `Net code ${code} has conflicting names`, net));
    else nets.set(code, name);
  }
  for (const form of topLevel(parsed.root)) {
    const name = head(form);
    if (name === "footprint") { const footprint = parseFootprint(form, nets, losses, parsed.text); document.pcb.footprints.push(footprint); continue; }
    if (name === "gr_line" && scalar(child(form, "layer"), 1) === "Edge.Cuts") { outlineSegments.push({ start: namedPoint(form, "start"), end: namedPoint(form, "end") }); continue; }
    if (name === "gr_line") { losses.push(loss(parsed.text, "KICAD_GRAPHIC_UNSUPPORTED", "Non-outline PCB graphic was reported and not imported", form)); continue; }
    if (name === "segment") { const net = nets.get(numberAt(child(form, "net"), 1, numberAt(form, indexOfAtom(form, "net") + 1, 0))) ?? `Net-${numberAt(child(form, "net"), 1, 0)}`; const rawLayer = scalar(child(form, "layer"), 1) ?? "F.Cu"; if (rawLayer !== "F.Cu" && rawLayer !== "B.Cu") losses.push(loss(parsed.text, "KICAD_LAYER_UNSUPPORTED", `Track layer ${rawLayer} was downgraded to F.Cu`, form)); document.pcb.tracks.push({ id: entityId(form, `track-${document.pcb.tracks.length + 1}`), net, layer: rawLayer === "B.Cu" ? "B.Cu" : "F.Cu", widthMm: numberAt(child(form, "width"), 1, 0.25), points: [namedPoint(form, "start"), namedPoint(form, "end")] }); continue; }
    if (name === "via") { const code = numberAt(child(form, "net"), 1, 0); document.pcb.vias.push({ id: entityId(form, `via-${document.pcb.vias.length + 1}`), net: nets.get(code) ?? `Net-${code}`, at: atPoint(form), diameterMm: numberAt(child(form, "size"), 1, 0.8), drillMm: numberAt(child(form, "drill"), 1, 0.4) }); continue; }
    if (name === "zone") { losses.push(loss(parsed.text, "KICAD_ZONE_UNSUPPORTED", "Copper zone was retained in the loss report and not imported", form)); continue; }
    if (name === "setup") { losses.push(loss(parsed.text, "KICAD_RULE_UNSUPPORTED", "KiCad setup and board rules were reported because the bounded subset does not translate them", form)); continue; }
    if (!["version", "generator", "generator_version", "general", "paper", "layers", "net", "gr_line"].includes(name)) losses.push(loss(parsed.text, unsupportedCode(name), `Unsupported KiCad PCB form ${name} was reported`, form));
  }
  document.pcb.outline = orderOutline(outlineSegments, losses);
  return losses;
}

function parseFootprint(form: SList, nets: Map<number, string>, losses: LossEntry[], source: string): Footprint {
  const at = atPoint(form); const rawRotation = numberAt(child(form, "at"), 3, 0); const rotationDeg = normalisePcbRotation(rawRotation); const layer = scalar(child(form, "layer"), 1) ?? "F.Cu";
  if (!sameAngle(rawRotation, rotationDeg)) losses.push(loss(source, "KICAD_FOOTPRINT_ROTATION_QUANTISED", `Footprint rotation ${rawRotation} degrees was quantised to ${rotationDeg} degrees`, child(form, "at") ?? form));
  if (layer !== "F.Cu" && layer !== "B.Cu") losses.push(loss(source, "KICAD_LAYER_UNSUPPORTED", `Footprint layer ${layer} was downgraded to F.Cu`, form));
  const reference = property(form, "Reference") ?? propertyFromFpText(form) ?? `U${stableHash(raw(source, form)).slice(0, 4)}`;
  const footprint: Footprint = { id: entityId(form, `footprint-${reference}`), libraryId: scalar(form, 1) ?? "Unknown:Footprint", reference, at, rotationDeg, side: layer.startsWith("B.") ? "back" : "front", pads: [] };
  for (const padForm of children(form, "pad")) {
    const local = atPoint(padForm); const size = child(padForm, "size"); const netForm = child(padForm, "net"); const layers = child(padForm, "layers"); const type = scalar(padForm, 2) ?? "smd"; const shape = scalar(padForm, 3);
    const padRotation = numberAt(child(padForm, "at"), 3, 0);
    if (!sameAngle(padRotation, 0)) losses.push(loss(source, "KICAD_PAD_ROTATION_NOT_REPRESENTED", `Pad rotation ${padRotation} degrees is not represented by the EDA document`, child(padForm, "at") ?? padForm));
    if (!["smd", "thru_hole", "np_thru_hole"].includes(type)) losses.push(loss(source, "KICAD_PAD_TYPE_DOWNGRADED", `Pad type ${type} was downgraded`, padForm));
    if (!["circle", "rect", "oval"].includes(shape ?? "")) losses.push(loss(source, "KICAD_PAD_SHAPE_DOWNGRADED", `Pad shape ${shape ?? "unknown"} was downgraded`, padForm));
    const drillForm = child(padForm, "drill");
    if (drillForm) losses.push(loss(source, "KICAD_PAD_DRILL_NOT_REPRESENTED", "Through-hole drill geometry is not represented by the EDA document", drillForm));
    const pad: Pad = { id: entityId(padForm, `${footprint.id}-pad-${safeId(scalar(padForm, 1) ?? String(footprint.pads.length + 1))}`), number: scalar(padForm, 1) ?? String(footprint.pads.length + 1), at: transform(local, at, rotationDeg), sizeMm: { width: numberAt(size, 1, 1.6), height: numberAt(size, 2, 1.6) }, shape: shape === "oval" ? "oval" : shape === "rect" || shape === "roundrect" ? "rect" : "circle", net: nets.get(numberAt(netForm, 1, -1)) ?? scalar(netForm, 2) ?? undefined, throughHole: type === "thru_hole" || (layers ? childrenAtoms(layers).includes("*.Cu") : false) };
    footprint.pads.push(pad);
    for (const node of padForm.value.filter((item): item is SList => isList(item)).filter((item) => !["at", "size", "drill", "layers", "net", "uuid", "tstamp"].includes(head(item)))) losses.push(loss(source, "KICAD_PAD_PROPERTY_UNSUPPORTED", `Unsupported pad property ${head(node)} was reported`, node));
  }
  for (const propertyForm of children(form, "property").filter((item) => scalar(item, 1) !== "Reference")) losses.push(loss(source, "KICAD_FOOTPRINT_PROPERTY_UNSUPPORTED", `Unsupported footprint property ${scalar(propertyForm, 1) ?? "unknown"} was reported`, propertyForm));
  return footprint;
}

function projectExportLosses(document: EdaDocument): LossEntry[] {
  const losses: LossEntry[] = [];
  losses.push({ code: "KICAD_DOCUMENT_METADATA_NOT_EMBEDDED", message: "Document title and project metadata are not represented by the bounded KiCad file pair", preserved: JSON.stringify({ title: document.title, project: document.project }) });
  losses.push({ code: "KICAD_SHEETS_NOT_EMBEDDED", message: "EDA sheet identities, names and ordering are not represented by the bounded root schematic", preserved: JSON.stringify(document.sheets) });
  losses.push({ code: "KICAD_LAYER_METADATA_NOT_EMBEDDED", message: "EDA layer identities and metadata are reduced to the supported KiCad layer names", preserved: JSON.stringify(document.layers) });
  if (document.nets.length) losses.push({ code: "KICAD_NET_IDS_NOT_EMBEDDED", message: "Net names are exported but EDA net IDs are not represented by KiCad net codes", preserved: JSON.stringify(document.nets) });
  if (document.annotations.length) losses.push({ code: "KICAD_ANNOTATIONS_NOT_EMBEDDED", message: "EDA annotations are not embedded into KiCad files", preserved: JSON.stringify(document.annotations) });
  if (document.validationResults.length) losses.push({ code: "KICAD_VALIDATION_RESULTS_NOT_EMBEDDED", message: "EDA validation results are not embedded into KiCad files", preserved: JSON.stringify(document.validationResults) });
  if (document.provenance.length) losses.push({ code: "KICAD_PROVENANCE_NOT_EMBEDDED", message: "EDA provenance records are not embedded into KiCad files", preserved: JSON.stringify(document.provenance) });
  losses.push({ code: "KICAD_BOARD_RULES_NOT_EMBEDDED", message: "EDA board-rule values require a KiCad project or design-rules file and are not embedded into the bounded PCB file", preserved: JSON.stringify(document.pcb.rules) });
  for (const power of document.schematic.powerSymbols) losses.push({ code: "KICAD_POWER_SYMBOL_UNSUPPORTED", message: "Power symbol export requires a library-specific symbol and was reported", preserved: JSON.stringify(power) });
  const requiredPins = document.schematic.symbols.flatMap((symbol) => symbol.pins.map((pin) => ({ symbolId: symbol.id, pinId: pin.id, required: pin.required })));
  if (requiredPins.length) losses.push({ code: "KICAD_PIN_REQUIRED_FLAGS_NOT_EMBEDDED", message: "EDA required-pin flags are not represented by KiCad symbol instances", preserved: JSON.stringify(requiredPins) });
  for (const pad of document.pcb.footprints.flatMap((footprint) => footprint.pads).filter((candidate) => candidate.throughHole)) {
    const assumedDrillMm = Number((Math.min(pad.sizeMm.width, pad.sizeMm.height) * 0.5).toFixed(6));
    losses.push({ code: "KICAD_PAD_DRILL_ASSUMED", message: `Pad ${pad.id} has no EDA drill field; export assumes ${assumedDrillMm} mm`, preserved: JSON.stringify({ padId: pad.id, assumedDrillMm }) });
  }
  for (const track of document.pcb.tracks.filter((candidate) => candidate.points.length > 2)) losses.push({ code: "KICAD_TRACK_GROUPING_NOT_EMBEDDED", message: `Track ${track.id} is emitted as independent KiCad segments`, preserved: JSON.stringify(track) });
  const libraries = new Map<string, SchematicSymbol>();
  for (const symbol of document.schematic.symbols) {
    const representative = libraries.get(symbol.libraryId);
    if (!representative) libraries.set(symbol.libraryId, symbol);
    else if (pinSignature(representative) !== pinSignature(symbol)) losses.push({ code: "KICAD_LIBRARY_INSTANCE_VARIATION", message: `Symbol ${symbol.id} differs from the exported ${symbol.libraryId} library definition`, preserved: JSON.stringify(symbol) });
    if (symbol.footprintId && !document.pcb.footprints.some((footprint) => footprint.id === symbol.footprintId)) losses.push({ code: "KICAD_FOOTPRINT_LINK_UNRESOLVED", message: `Symbol ${symbol.id} refers to a footprint that cannot be exported`, preserved: symbol.footprintId });
  }
  return losses;
}

function schematicOnlyLoss(): LossEntry { return { code: "KICAD_PCB_REQUIRES_PROJECT_EXPORT", message: "PCB data is emitted only by exportKicadProject", preserved: "" }; }
function pinSignature(symbol: SchematicSymbol): string { return JSON.stringify(symbol.pins.map((pin) => ({ number: pin.number, name: pin.name, electricalType: pin.electricalType, offset: { xMm: pin.at.xMm - symbol.at.xMm, yMm: pin.at.yMm - symbol.at.yMm } })).sort((a, b) => a.number.localeCompare(b.number, "en", { numeric: true }))); }

interface ParsedRoot { text: string; root: SList; name: "kicad_sch" | "kicad_pcb"; generator: string }
function parseRoot(text: string, expected?: "kicad_sch" | "kicad_pcb"): ParsedRoot {
  if (new TextEncoder().encode(text).byteLength > MAX_FILE_BYTES) throw new Error(`KiCad document exceeds ${MAX_FILE_BYTES} bytes`);
  const root = parseSExpression(text); const name = head(root);
  if (name !== "kicad_sch" && name !== "kicad_pcb") throw new Error("Unsupported KiCad root expression");
  if (expected && name !== expected) throw new Error(`Expected ${expected} root expression`);
  const version = numberAt(child(root, "version"), 1, 0);
  if (!Number.isInteger(version) || version < 20211014) throw new Error("Only KiCad 6 or newer file versions are supported");
  const generator = scalar(child(root, "generator"), 1) ?? "unknown";
  return { text, root, name, generator };
}

function parseSExpression(text: string): SList {
  let index = 0; let nodes = 0;
  const whitespace = () => { while (index < text.length && /\s/.test(text[index])) index += 1; };
  const parse = (depth: number): SExpr => {
    if (++nodes > MAX_NODES) throw new Error(`KiCad S-expression exceeds ${MAX_NODES} nodes`);
    if (depth > MAX_DEPTH) throw new Error(`KiCad S-expression exceeds depth ${MAX_DEPTH}`);
    whitespace(); const start = index; const char = text[index];
    if (char === "(") { index += 1; const value: SExpr[] = []; while (true) { whitespace(); if (index >= text.length) throw new Error("Malformed KiCad S-expression: unbalanced parentheses"); if (text[index] === ")") { index += 1; return { kind: "list", value, start, end: index }; } value.push(parse(depth + 1)); } }
    if (char === "\"") { index += 1; let value = ""; while (index < text.length) { const current = text[index++]; if (current === "\"") return { kind: "string", value, start, end: index }; if (current === "\\") { if (index >= text.length) break; const escaped = text[index++]; const replacements: Record<string, string> = { "\\": "\\", "\"": "\"", n: "\n", r: "\r", t: "\t" }; if (!(escaped in replacements)) throw new Error(`Malformed KiCad S-expression: unsupported escape \\${escaped}`); value += replacements[escaped]; } else value += current; if (value.length > MAX_STRING_CHARS) throw new Error(`KiCad string exceeds ${MAX_STRING_CHARS} characters`); } throw new Error("Malformed KiCad S-expression: unterminated string"); }
    if (!char || char === ")") throw new Error("Malformed KiCad S-expression: unexpected token");
    while (index < text.length && !/[\s()]/.test(text[index])) { index += 1; if (index - start > MAX_ATOM_CHARS) throw new Error(`KiCad atom exceeds ${MAX_ATOM_CHARS} characters`); }
    return { kind: "atom", value: text.slice(start, index), start, end: index };
  };
  whitespace(); const value = parse(0); whitespace(); if (index !== text.length) throw new Error("Malformed KiCad S-expression: trailing content"); if (!isList(value)) throw new Error("KiCad root must be a list"); return value;
}

function requireLossAcknowledgement(losses: LossEntry[], acknowledgement: KicadLossAcknowledgement | undefined): void {
  if (!losses.length) return;
  const expected = acknowledgeKicadLosses(losses);
  if (!acknowledgement || acknowledgement.token !== expected.token || acknowledgement.codes.join("\u0000") !== expected.codes.join("\u0000")) throw new Error("KiCad re-export requires explicit acknowledgement of every reported loss");
}
function lossToken(losses: readonly LossEntry[]): string { return `kicad-loss-${stableHash(losses.map((item) => `${item.code}\u0000${item.message}\u0000${item.preserved}`).join("\u0001"))}`; }
function sortLosses(losses: readonly LossEntry[]): LossEntry[] { return structuredClone([...losses]).sort((a, b) => a.code.localeCompare(b.code) || a.message.localeCompare(b.message) || a.preserved.localeCompare(b.preserved)); }
function loss(source: string, code: string, message: string, node: SExpr): LossEntry { return { code, message, preserved: raw(source, node) }; }
function unsupportedCode(name: string): string { if (name === "sheet" || name === "hierarchical_label" || name === "hierarchical_sheet") return "KICAD_HIERARCHY_UNSUPPORTED"; if (name.includes("rule")) return "KICAD_RULE_UNSUPPORTED"; return "KICAD_UNSUPPORTED_FORM"; }
function unsupportedLibraryNodes(definition: SList): SList[] {
  const unsupported: SList[] = [];
  for (const node of definition.value.slice(2)) {
    if (!isList(node)) continue;
    const name = head(node);
    if (name === "symbol") unsupported.push(...unsupportedLibraryNodes(node));
    else if (!["pin", "pin_names", "exclude_from_sim", "in_bom", "on_board"].includes(name)) unsupported.push(node);
  }
  return unsupported;
}
function raw(source: string, node: SExpr): string { return source.slice(node.start, node.end); }

function topLevel(root: SList): SList[] { return root.value.slice(1).filter(isList); }
function child(list: SList | undefined, name: string): SList | undefined { return list?.value.find((item): item is SList => isList(item) && head(item) === name); }
function children(list: SList, name: string): SList[] { return list.value.filter((item): item is SList => isList(item) && head(item) === name); }
function descendants(list: SList, name: string): SList[] { const out: SList[] = []; for (const item of list.value) if (isList(item)) { if (head(item) === name) out.push(item); out.push(...descendants(item, name)); } return out; }
function isList(value: SExpr | undefined): value is SList { return value?.kind === "list"; }
function head(list: SList): string { return scalar(list, 0) ?? ""; }
function scalar(list: SList | undefined, index: number): string | undefined { const value = list?.value[index]; return value && !isList(value) ? value.value : undefined; }
function childrenAtoms(list: SList): string[] { return list.value.filter((item): item is SAtom => !isList(item)).map((item) => item.value); }
function numberAt(list: SList | undefined, index: number, fallback: number): number { const value = Number(scalar(list, index)); return Number.isFinite(value) ? value : fallback; }
function indexOfAtom(list: SList, value: string): number { return list.value.findIndex((node) => !isList(node) && node.value === value); }
function namedPoint(list: SList, name: string): Point { const point = child(list, name); return { xMm: numberAt(point, 1, 0), yMm: numberAt(point, 2, 0) }; }
function atPoint(list: SList): Point { return namedPoint(list, "at"); }
function xyPoint(list: SList): Point { return { xMm: numberAt(list, 1, 0), yMm: numberAt(list, 2, 0) }; }
function property(list: SList, name: string): string | undefined { const form = children(list, "property").find((item) => scalar(item, 1) === name); return scalar(form, 2); }
function propertyFromFpText(list: SList): string | undefined { const form = children(list, "fp_text").find((item) => scalar(item, 1) === "reference"); return scalar(form, 2); }
function entityId(list: SList | undefined, fallback: string): string { const value = scalar(child(list, "uuid") ?? child(list, "tstamp"), 1); return safeId(value || fallback); }
function rootUuid(root: SList): string | undefined { const value = scalar(child(root, "uuid"), 1); return value ? safeId(value) : undefined; }
function safeId(value: string): string { const cleaned = value.replace(/[^A-Za-z0-9._:-]+/g, "-").replace(/^-+|-+$/g, ""); return cleaned && /^[A-Za-z0-9]/.test(cleaned) ? cleaned : `id-${stableHash(value)}`; }
function stableHash(value: string): string { let hash = 2166136261; for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(16).padStart(8, "0"); }
function round(value: number): string { return String(Number(value.toFixed(6))); }
function quote(value: string): string { return `"${value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n").replaceAll("\r", "\\r").replaceAll("\t", "\\t")}"`; }
function byId(a: { id: string }, b: { id: string }): number { return a.id.localeCompare(b.id); }
function normaliseSchRotation(value: number): 0 | 90 | 180 | 270 { const normal = ((Math.round(value / 90) * 90) % 360 + 360) % 360; return normal === 90 || normal === 180 || normal === 270 ? normal : 0; }
function normalisePcbRotation(value: number): 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315 { const normal = ((Math.round(value / 45) * 45) % 360 + 360) % 360; return ([45, 90, 135, 180, 225, 270, 315] as const).find((candidate) => candidate === normal) ?? 0; }
function sameAngle(left: number, right: number): boolean { const delta = ((left - right) % 360 + 540) % 360 - 180; return Math.abs(delta) < 0.000001; }
function transform(local: Point, origin: Point, rotation: number): Point { const radians = rotation * Math.PI / 180; return { xMm: origin.xMm + local.xMm * Math.cos(radians) - local.yMm * Math.sin(radians), yMm: origin.yMm + local.xMm * Math.sin(radians) + local.yMm * Math.cos(radians) }; }
function inverseTransform(world: Point, origin: Point, rotation: number): Point { return transform({ xMm: world.xMm - origin.xMm, yMm: world.yMm - origin.yMm }, { xMm: 0, yMm: 0 }, -rotation); }
function pinTypeToKicad(type: PinElectricalType): string { return ({ input: "input", output: "output", bidirectional: "bidirectional", passive: "passive", "power-in": "power_in", "power-out": "power_out", "open-collector": "open_collector", "no-connect": "no_connect" })[type]; }
function pinTypeFromKicad(type: string): PinElectricalType { return ({ input: "input", output: "output", bidirectional: "bidirectional", passive: "passive", power_in: "power-in", power_out: "power-out", open_collector: "open-collector", no_connect: "no-connect" } as Record<string, PinElectricalType>)[type] ?? "passive"; }
function uniquePins(pins: SchematicPin[]): SchematicPin[] { const seen = new Set<string>(); return pins.filter((pin) => !seen.has(pin.number) && Boolean(seen.add(pin.number))); }
function nearestPin(symbols: SchematicSymbol[], at: Point): { symbol: SchematicSymbol; pin: SchematicPin } | undefined { return symbols.flatMap((symbol) => symbol.pins.map((pin) => ({ symbol, pin, distance: Math.hypot(pin.at.xMm - at.xMm, pin.at.yMm - at.yMm) }))).filter((item) => item.distance < 0.01).sort((a, b) => a.distance - b.distance)[0]; }
function linkSymbolsAndFootprints(document: EdaDocument, losses: LossEntry[]): void {
  const symbols = new Map(document.schematic.symbols.map((symbol) => [symbol.reference, symbol]));
  const usedIds = collectDocumentIds(document);
  for (const footprint of document.pcb.footprints) {
    const symbol = symbols.get(footprint.reference);
    if (symbol) {
      const assignedLibrary = symbol.footprintId;
      if (assignedLibrary && assignedLibrary !== footprint.libraryId) losses.push({ code: "KICAD_FOOTPRINT_ASSIGNMENT_MISMATCH", message: `Schematic assignment ${assignedLibrary} differs from PCB footprint ${footprint.libraryId}`, preserved: JSON.stringify({ symbolId: symbol.id, footprintId: footprint.id, assignedLibrary, actualLibrary: footprint.libraryId }) });
      symbol.footprintId = footprint.id;
    } else {
      const symbolId = uniqueStableId(`pcb-only-symbol:${footprint.reference}`, usedIds, footprint.id);
      const pins = footprint.pads.map((pad) => ({ id: uniqueStableId(`${symbolId}:pin:${safeId(pad.number)}`, usedIds, pad.id), number: pad.number, name: pad.number, electricalType: "passive" as PinElectricalType, required: true, at: { ...pad.at } }));
      document.schematic.symbols.push({ id: symbolId, libraryId: footprint.libraryId, reference: footprint.reference, value: footprint.libraryId.split(":").at(-1) ?? footprint.libraryId, at: { ...footprint.at }, rotationDeg: 0, pins, footprintId: footprint.id });
      losses.push({ code: "KICAD_ORPHAN_FOOTPRINT", message: `Footprint ${footprint.reference} had no matching schematic symbol; a bounded placeholder symbol was created`, preserved: JSON.stringify(footprint) });
    }
  }
  const footprintIds = new Set(document.pcb.footprints.map((footprint) => footprint.id));
  for (const symbol of document.schematic.symbols) if (symbol.footprintId && !footprintIds.has(symbol.footprintId)) {
    losses.push({ code: "KICAD_FOOTPRINT_ASSIGNMENT_UNRESOLVED", message: `Schematic footprint assignment ${symbol.footprintId} has no matching PCB footprint`, preserved: JSON.stringify({ symbolId: symbol.id, assignment: symbol.footprintId }) });
    symbol.footprintId = undefined;
  }
}
function declareReferencedNets(document: EdaDocument, declaredNames: readonly string[] = []): void {
  const names = new Set<string>(declaredNames.filter((name) => name.trim()));
  for (const name of [...document.schematic.netLabels.map((label) => label.text), ...document.schematic.powerSymbols.map((power) => power.netName), ...document.pcb.tracks.map((track) => track.net), ...document.pcb.vias.map((via) => via.net), ...document.pcb.footprints.flatMap((footprint) => footprint.pads.map((pad) => pad.net ?? ""))]) if (name.trim()) names.add(name);
  const usedIds = collectDocumentIds(document);
  document.nets = [...names].sort((a, b) => a.localeCompare(b)).map((name) => ({ id: uniqueStableId(`net:${safeId(name)}`, usedIds, name), name }));
}
function declaredPcbNetNames(root: SList): string[] { return children(root, "net").map((net) => scalar(net, 2) ?? "").filter((name) => name.trim()); }
function recordImportProvenance(document: EdaDocument, detail: string): void {
  const usedIds = collectDocumentIds(document);
  document.provenance = [{ id: uniqueStableId(`${document.id}:provenance:import`, usedIds, detail), source: "import", detail: `KiCad generator ${detail}` }];
}
function collectDocumentIds(document: EdaDocument): Set<string> {
  return new Set([document.id, ...document.sheets.map((item) => item.id), ...document.nets.map((item) => item.id), ...document.layers.map((item) => item.id), ...document.annotations.map((item) => item.id), ...document.validationResults.map((item) => item.id), ...document.provenance.map((item) => item.id), ...document.schematic.symbols.flatMap((symbol) => [symbol.id, ...symbol.pins.map((pin) => pin.id)]), ...document.schematic.wires.map((item) => item.id), ...document.schematic.junctions.map((item) => item.id), ...document.schematic.noConnects.map((item) => item.id), ...document.schematic.netLabels.map((item) => item.id), ...document.schematic.powerSymbols.map((item) => item.id), ...document.pcb.footprints.flatMap((footprint) => [footprint.id, ...footprint.pads.map((pad) => pad.id)]), ...document.pcb.tracks.map((item) => item.id), ...document.pcb.vias.map((item) => item.id)]);
}
function uniqueStableId(base: string, used: Set<string>, discriminator: string): string {
  let candidate = safeId(base); if (used.has(candidate)) candidate = `${candidate}-${stableHash(discriminator)}`; let suffix = 2; while (used.has(candidate)) candidate = `${safeId(base)}-${stableHash(discriminator)}-${suffix++}`; used.add(candidate); return candidate;
}
function orderOutline(segments: Array<{ start: Point; end: Point }>, losses: LossEntry[]): Point[] { if (!segments.length) return []; const remaining = [...segments]; const first = remaining.shift() as { start: Point; end: Point }; const points = [first.start, first.end]; while (remaining.length) { const tail = points[points.length - 1]; const index = remaining.findIndex((segment) => samePoint(segment.start, tail) || samePoint(segment.end, tail)); if (index < 0) { losses.push({ code: "KICAD_OUTLINE_DISCONNECTED", message: "Disconnected Edge.Cuts segments were reported", preserved: JSON.stringify(remaining) }); break; } const [next] = remaining.splice(index, 1); points.push(samePoint(next.start, tail) ? next.end : next.start); } return points; }
function samePoint(a: Point, b: Point): boolean { return Math.abs(a.xMm - b.xMm) < 0.000001 && Math.abs(a.yMm - b.yMm) < 0.000001; }
