import type { Diagnostic, EdaDocument, Footprint, Pcb, Point, Schematic, SchematicSymbol } from "./types";

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const REFERENCE_PATTERN = /^(?:#PWR\d*|[A-Z]+\d+)$/;

export function createEmptyEdaDocument(id: string, title: string): EdaDocument {
  return {
    kind: "engineering-mastery-lab/eda-document",
    version: 1,
    id,
    title,
    project: { name: title, revision: "Rev00", units: "mm" },
    sheets: [{ id: `${id}:sheet:1`, name: "Main", order: 1 }],
    nets: [],
    layers: [
      { id: "layer:F.Cu", name: "F.Cu", kind: "copper", side: "front" },
      { id: "layer:B.Cu", name: "B.Cu", kind: "copper", side: "back" },
      { id: "layer:Edge.Cuts", name: "Edge.Cuts", kind: "outline", side: "both" },
      { id: "layer:Silkscreen", name: "Silkscreen", kind: "silkscreen", side: "both" }
    ],
    annotations: [],
    validationResults: [],
    provenance: [],
    schematic: { symbols: [], wires: [], junctions: [], noConnects: [], netLabels: [], powerSymbols: [] },
    pcb: { outline: [], footprints: [], tracks: [], vias: [], rules: { clearanceMm: 0.2, minTrackWidthMm: 0.2, minEdgeClearanceMm: 0.25, minViaDiameterMm: 0.6, minViaDrillMm: 0.3 } }
  };
}

export function validateEdaDocument(document: EdaDocument): Diagnostic[] {
  const out: Diagnostic[] = [];
  if (document.kind !== "engineering-mastery-lab/eda-document" || document.version !== 1) issue(out, "SCHEMA_VERSION", "Unsupported EDA document kind or version", [document.id]);
  if (!validId(document.id)) issue(out, "INVALID_ID", "Document ID is not stable or filename-safe", [document.id]);
  if (!document.title.trim()) issue(out, "INVALID_TITLE", "Document title is required", [document.id]);
  if (!document.project.name.trim() || !document.project.revision.trim() || document.project.units !== "mm") issue(out, "INVALID_PROJECT_METADATA", "Project metadata requires a name, revision and millimetre units", [document.id]);
  if (!document.sheets.length || document.sheets.some((sheet) => !sheet.name.trim() || !Number.isInteger(sheet.order) || sheet.order < 1)) issue(out, "INVALID_SHEET", "At least one ordered named sheet is required", document.sheets.map((sheet) => sheet.id));
  if (duplicates(document.nets.map((net) => net.name)).length) issue(out, "DUPLICATE_NET_NAME", "Explicit net names must be unique", document.nets.map((net) => net.id));
  const requiredLayers = ["F.Cu", "B.Cu", "Edge.Cuts", "Silkscreen"];
  if (requiredLayers.some((name) => !document.layers.some((layer) => layer.name === name))) issue(out, "MISSING_LAYER", "Required EDA layer definitions are missing", []);

  const everyId: string[] = [document.id];
  const pushIds = (items: ReadonlyArray<{ id: string }>) => everyId.push(...items.map((item) => item.id));
  pushIds(document.schematic.symbols);
  pushIds(document.schematic.wires);
  pushIds(document.schematic.junctions);
  pushIds(document.schematic.noConnects);
  pushIds(document.schematic.netLabels);
  pushIds(document.schematic.powerSymbols);
  pushIds(document.pcb.footprints);
  pushIds(document.pcb.tracks);
  pushIds(document.pcb.vias);
  pushIds(document.sheets); pushIds(document.nets); pushIds(document.layers); pushIds(document.annotations); pushIds(document.validationResults); pushIds(document.provenance);
  for (const symbol of document.schematic.symbols) pushIds(symbol.pins);
  for (const footprint of document.pcb.footprints) pushIds(footprint.pads);
  for (const id of everyId) if (!validId(id)) issue(out, "INVALID_ID", `Invalid stable ID: ${id}`, [id]);
  duplicates(everyId).forEach((id) => issue(out, "DUPLICATE_ID", `Duplicate ID: ${id}`, [id]));
  const knownIds = new Set(everyId);
  for (const annotation of document.annotations) if (annotation.targetId && !knownIds.has(annotation.targetId)) issue(out, "DANGLING_ANNOTATION", `Annotation ${annotation.id} refers to missing target ${annotation.targetId}`, [annotation.id, annotation.targetId]);

  const symbols = new Map(document.schematic.symbols.map((symbol) => [symbol.id, symbol]));
  const footprints = new Map(document.pcb.footprints.map((footprint) => [footprint.id, footprint]));
  const references = document.schematic.symbols.map((symbol) => symbol.reference).filter((reference) => reference !== "" && !reference.endsWith("?"));
  duplicates(references).forEach((reference) => issue(out, "DUPLICATE_REFERENCE", `Duplicate schematic reference: ${reference}`, document.schematic.symbols.filter((symbol) => symbol.reference === reference).map((symbol) => symbol.id)));
  for (const symbol of document.schematic.symbols) {
    if (!symbol.reference || symbol.reference.endsWith("?") || !REFERENCE_PATTERN.test(symbol.reference)) issue(out, "MISSING_REFERENCE", `Symbol ${symbol.id} requires an annotated reference`, [symbol.id]);
    if (symbol.footprintId && !footprints.has(symbol.footprintId)) issue(out, "DANGLING_FOOTPRINT", `Symbol ${symbol.id} refers to missing footprint ${symbol.footprintId}`, [symbol.id, symbol.footprintId]);
    duplicates(symbol.pins.map((pin) => pin.number)).forEach((number) => issue(out, "DUPLICATE_PIN_NUMBER", `Duplicate pin number ${number} on ${symbol.id}`, [symbol.id]));
  }
  for (const noConnect of document.schematic.noConnects) {
    const symbol = symbols.get(noConnect.symbolId);
    if (!symbol || !symbol.pins.some((pin) => pin.id === noConnect.pinId)) issue(out, "DANGLING_NO_CONNECT", `No-connect ${noConnect.id} refers to a missing symbol pin`, [noConnect.id, noConnect.symbolId, noConnect.pinId]);
  }
  for (const footprint of document.pcb.footprints) {
    const symbol = document.schematic.symbols.find((candidate) => candidate.footprintId === footprint.id);
    if (!symbol) issue(out, "ORPHAN_FOOTPRINT", `Footprint ${footprint.id} is not linked from a schematic symbol`, [footprint.id]);
    if (symbol && symbol.reference !== footprint.reference) issue(out, "REFERENCE_MISMATCH", `Footprint ${footprint.id} reference does not match ${symbol.id}`, [footprint.id, symbol.id]);
    duplicates(footprint.pads.map((pad) => pad.number)).forEach((number) => issue(out, "DUPLICATE_PAD_NUMBER", `Duplicate pad number ${number} on ${footprint.id}`, [footprint.id]));
  }
  const declaredNets = new Set(document.nets.map((net) => net.name));
  for (const item of [...document.pcb.tracks, ...document.pcb.vias, ...document.pcb.footprints.flatMap((footprint) => footprint.pads)].filter((candidate) => candidate.net)) if (!declaredNets.has(item.net as string)) issue(out, "UNDECLARED_NET", `Copper item ${item.id} uses an undeclared net`, [item.id]);
  validateFiniteGeometry(document.schematic, document.pcb, out);
  return out.sort(compareDiagnostic);
}

export function assertValidEdaDocument(document: EdaDocument): void {
  const errors = validateEdaDocument(document);
  if (errors.length) throw new Error(errors.map((error) => `${error.code}: ${error.message}`).join("\n"));
}

export function canonicalEdaJson(document: EdaDocument): string {
  assertDocumentShape(document as unknown as Record<string, unknown>);
  assertValidEdaDocument(document);
  return `${canonicalStringify(normaliseDocument(document))}\n`;
}

export function reopenEdaDocument(source: string): EdaDocument {
  if (new TextEncoder().encode(source).byteLength > 5_000_000) throw new Error("EDA document exceeds 5000000 bytes");
  let value: unknown;
  try { value = JSON.parse(source); } catch { throw new Error("EDA document is not valid JSON"); }
  if (!isRecord(value)) throw new Error("EDA document must be an object");
  const migrated = migrateLegacyV1(value);
  assertExactKeys(migrated, ["kind", "version", "id", "title", "project", "sheets", "nets", "layers", "annotations", "validationResults", "provenance", "schematic", "pcb"], "document");
  assertDocumentShape(migrated);
  const document = migrated as unknown as EdaDocument;
  assertValidEdaDocument(document);
  return structuredClone(document);
}

export function generateBom(document: EdaDocument): Array<{ quantity: number; value: string; libraryId: string; references: string[] }> {
  assertValidEdaDocument(document);
  const groups = new Map<string, { quantity: number; value: string; libraryId: string; references: string[] }>();
  for (const symbol of document.schematic.symbols.filter((item) => !item.reference.startsWith("#PWR"))) {
    const key = `${symbol.value}\u0000${symbol.libraryId}`;
    const group = groups.get(key) ?? { quantity: 0, value: symbol.value, libraryId: symbol.libraryId, references: [] };
    group.quantity += 1;
    group.references.push(symbol.reference);
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => ({ ...group, references: group.references.sort(naturalCompare) })).sort((a, b) => a.libraryId.localeCompare(b.libraryId) || a.value.localeCompare(b.value));
}

export function generatePickAndPlace(document: EdaDocument): Array<{ reference: string; xMm: number; yMm: number; rotationDeg: number; side: "front" | "back" }> {
  assertValidEdaDocument(document);
  return document.pcb.footprints.map((footprint) => ({ reference: footprint.reference, xMm: footprint.at.xMm, yMm: footprint.at.yMm, rotationDeg: footprint.rotationDeg, side: footprint.side })).sort((a, b) => naturalCompare(a.reference, b.reference));
}

export function preservePadNetMapping(original: Footprint, moved: Pick<Footprint, "at" | "rotationDeg" | "side">): Footprint {
  return transformFootprint(original, moved.at, moved.rotationDeg, moved.side);
}

export function transformSchematicSymbol(original: SchematicSymbol, at: Point, rotationDeg: SchematicSymbol["rotationDeg"]): SchematicSymbol {
  const delta = rotationDeg - original.rotationDeg;
  return { ...structuredClone(original), at: { ...at }, rotationDeg, pins: original.pins.map((pin) => ({ ...structuredClone(pin), at: transformPoint(pin.at, original.at, at, delta) })) };
}

export function transformFootprint(original: Footprint, at: Point, rotationDeg: Footprint["rotationDeg"], side = original.side): Footprint {
  const sideChanged = side !== original.side;
  return { ...structuredClone(original), at: { ...at }, rotationDeg, side, pads: original.pads.map((pad) => ({ ...structuredClone(pad), at: transformPlacedPoint(pad.at, original.at, at, original.rotationDeg, rotationDeg, sideChanged), net: pad.net })) };
}

function normaliseDocument(document: EdaDocument): EdaDocument {
  const clone = structuredClone(document);
  clone.schematic.symbols.sort(byId).forEach((symbol) => symbol.pins.sort(byId));
  clone.schematic.wires.sort(byId); clone.schematic.junctions.sort(byId); clone.schematic.noConnects.sort(byId); clone.schematic.netLabels.sort(byId); clone.schematic.powerSymbols.sort(byId);
  clone.pcb.footprints.sort(byId).forEach((footprint) => footprint.pads.sort(byId)); clone.pcb.tracks.sort(byId); clone.pcb.vias.sort(byId);
  clone.sheets.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)); clone.nets.sort(byId); clone.layers.sort(byId); clone.annotations.sort(byId); clone.validationResults.sort(byId); clone.provenance.sort(byId);
  return clone;
}

function canonicalStringify(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") { if (!Number.isFinite(value)) throw new Error("Canonical JSON requires finite numbers"); return JSON.stringify(Object.is(value, -0) ? 0 : value); }
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().filter((key) => value[key] !== undefined).map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
  throw new Error("Canonical JSON contains an unsupported value");
}

function assertDocumentShape(value: Record<string, unknown>): void {
  assertExactKeys(value, ["kind", "version", "id", "title", "project", "sheets", "nets", "layers", "annotations", "validationResults", "provenance", "schematic", "pcb"], "document");
  if (value.kind !== "engineering-mastery-lab/eda-document" || value.version !== 1 || typeof value.id !== "string" || typeof value.title !== "string") throw new Error("EDA document header is invalid");
  const project = recordAt(value.project, "project"); assertExactKeys(project, ["name", "revision", "units"], "project"); assertStringFields(project, ["name", "revision", "units"], "project"); if (project.units !== "mm") throw new Error("project.units must be mm");
  for (const key of ["sheets", "nets", "layers", "annotations", "validationResults", "provenance"] as const) if (!Array.isArray(value[key])) throw new Error(`${key} must be an array`);
  assertSimpleRecords(value.sheets as unknown[], ["id", "name", "order"], ["id", "name"], ["order"], "sheets");
  assertSimpleRecords(value.nets as unknown[], ["id", "name"], ["id", "name"], [], "nets");
  assertSimpleRecords(value.layers as unknown[], ["id", "name", "kind", "side"], ["id", "name", "kind", "side"], [], "layers");
  for (const [index, raw] of (value.layers as unknown[]).entries()) { const layer = recordAt(raw, `layers[${index}]`); if (!["F.Cu", "B.Cu", "Edge.Cuts", "Silkscreen"].includes(layer.name as string) || !["copper", "outline", "silkscreen"].includes(layer.kind as string) || !["front", "back", "both"].includes(layer.side as string)) throw new Error(`layers[${index}] contains an invalid enum`); }
  assertSimpleRecords(value.annotations as unknown[], ["id", "kind", "text", "targetId"], ["id", "kind", "text"], [], "annotations", ["targetId"]);
  for (const [index, raw] of (value.annotations as unknown[]).entries()) if (!["note", "warning"].includes(recordAt(raw, `annotations[${index}]`).kind as string)) throw new Error(`annotations[${index}].kind is invalid`);
  for (const [index, raw] of (value.validationResults as unknown[]).entries()) { const result = recordAt(raw, `validationResults[${index}]`); assertExactKeys(result, ["id", "scope", "passed", "codes"], `validationResults[${index}]`); assertStringFields(result, ["id", "scope"], `validationResults[${index}]`); if (typeof result.passed !== "boolean" || !Array.isArray(result.codes) || result.codes.some((code) => typeof code !== "string")) throw new Error(`validationResults[${index}] is invalid`); if (!["document", "erc", "drc"].includes(result.scope as string)) throw new Error(`validationResults[${index}].scope is invalid`); }
  assertSimpleRecords(value.provenance as unknown[], ["id", "source", "detail"], ["id", "source", "detail"], [], "provenance");
  for (const [index, raw] of (value.provenance as unknown[]).entries()) if (!["user", "offline-fixture", "import"].includes(recordAt(raw, `provenance[${index}]`).source as string)) throw new Error(`provenance[${index}].source is invalid`);
  if (!isRecord(value.schematic) || !isRecord(value.pcb)) throw new Error("EDA document requires schematic and pcb objects");
  assertExactKeys(value.schematic, ["symbols", "wires", "junctions", "noConnects", "netLabels", "powerSymbols"], "schematic");
  assertExactKeys(value.pcb, ["outline", "footprints", "tracks", "vias", "rules"], "pcb");
  for (const key of ["symbols", "wires", "junctions", "noConnects", "netLabels", "powerSymbols"] as const) if (!Array.isArray(value.schematic[key])) throw new Error(`schematic.${key} must be an array`);
  for (const key of ["outline", "footprints", "tracks", "vias"] as const) if (!Array.isArray(value.pcb[key])) throw new Error(`pcb.${key} must be an array`);
  if (!isRecord(value.pcb.rules)) throw new Error("pcb.rules must be an object");
  assertExactKeys(value.pcb.rules, ["clearanceMm", "minTrackWidthMm", "minEdgeClearanceMm", "minViaDiameterMm", "minViaDrillMm"], "pcb.rules");
  assertNumberFields(value.pcb.rules, ["clearanceMm", "minTrackWidthMm", "minEdgeClearanceMm", "minViaDiameterMm", "minViaDrillMm"], "pcb.rules");
  for (const [index, raw] of (value.schematic.symbols as unknown[]).entries()) {
    const symbol = recordAt(raw, `schematic.symbols[${index}]`);
    assertExactKeys(symbol, ["id", "libraryId", "reference", "value", "at", "rotationDeg", "pins", "footprintId"], `schematic.symbols[${index}]`);
    assertStringFields(symbol, ["id", "libraryId", "reference", "value"], `schematic.symbols[${index}]`);
    assertPoint(symbol.at, `schematic.symbols[${index}].at`);
    if (![0, 90, 180, 270].includes(symbol.rotationDeg as number)) throw new Error(`schematic.symbols[${index}].rotationDeg is invalid`);
    if (!Array.isArray(symbol.pins)) throw new Error(`schematic.symbols[${index}].pins must be an array`);
    if (symbol.footprintId !== undefined && typeof symbol.footprintId !== "string") throw new Error(`schematic.symbols[${index}].footprintId must be a string`);
    for (const [pinIndex, rawPin] of symbol.pins.entries()) {
      const pin = recordAt(rawPin, `schematic.symbols[${index}].pins[${pinIndex}]`);
      assertExactKeys(pin, ["id", "number", "name", "electricalType", "required", "at"], `schematic.symbols[${index}].pins[${pinIndex}]`);
      assertStringFields(pin, ["id", "number", "name", "electricalType"], `schematic.symbols[${index}].pins[${pinIndex}]`);
      if (!["input", "output", "bidirectional", "passive", "power-in", "power-out", "open-collector", "no-connect"].includes(pin.electricalType as string)) throw new Error(`schematic.symbols[${index}].pins[${pinIndex}].electricalType is invalid`);
      if (typeof pin.required !== "boolean") throw new Error(`schematic.symbols[${index}].pins[${pinIndex}].required must be boolean`);
      assertPoint(pin.at, `schematic.symbols[${index}].pins[${pinIndex}].at`);
    }
  }
  assertEntityPoints(value.schematic.wires as unknown[], ["id", "from", "to"], ["from", "to"], "schematic.wires");
  assertEntityPoints(value.schematic.junctions as unknown[], ["id", "at"], ["at"], "schematic.junctions");
  assertEntityPoints(value.schematic.netLabels as unknown[], ["id", "text", "at"], ["at"], "schematic.netLabels", ["text"]);
  assertEntityPoints(value.schematic.powerSymbols as unknown[], ["id", "netName", "at", "powerType"], ["at"], "schematic.powerSymbols", ["netName", "powerType"]);
  for (const raw of value.schematic.powerSymbols as unknown[]) if (!["power-in", "power-out"].includes(recordAt(raw, "power symbol").powerType as string)) throw new Error("power symbol type is invalid");
  for (const [index, raw] of (value.schematic.noConnects as unknown[]).entries()) { const item = recordAt(raw, `schematic.noConnects[${index}]`); assertExactKeys(item, ["id", "symbolId", "pinId"], `schematic.noConnects[${index}]`); assertStringFields(item, ["id", "symbolId", "pinId"], `schematic.noConnects[${index}]`); }
  for (const [index, raw] of (value.pcb.outline as unknown[]).entries()) assertPoint(raw, `pcb.outline[${index}]`);
  for (const [index, raw] of (value.pcb.footprints as unknown[]).entries()) {
    const footprint = recordAt(raw, `pcb.footprints[${index}]`);
    assertExactKeys(footprint, ["id", "libraryId", "reference", "at", "rotationDeg", "side", "pads"], `pcb.footprints[${index}]`);
    assertStringFields(footprint, ["id", "libraryId", "reference", "side"], `pcb.footprints[${index}]`); assertPoint(footprint.at, `pcb.footprints[${index}].at`);
    if (!["front", "back"].includes(footprint.side as string) || ![0, 45, 90, 135, 180, 225, 270, 315].includes(footprint.rotationDeg as number)) throw new Error(`pcb.footprints[${index}] placement is invalid`);
    if (!Array.isArray(footprint.pads)) throw new Error(`pcb.footprints[${index}].pads must be an array`);
    for (const [padIndex, rawPad] of footprint.pads.entries()) {
      const pad = recordAt(rawPad, `pcb.footprints[${index}].pads[${padIndex}]`);
      assertExactKeys(pad, ["id", "number", "at", "sizeMm", "shape", "rotationDeg", "net", "throughHole"], `pcb.footprints[${index}].pads[${padIndex}]`);
      assertStringFields(pad, ["id", "number", "shape"], `pcb.footprints[${index}].pads[${padIndex}]`); assertPoint(pad.at, `pcb.footprints[${index}].pads[${padIndex}].at`);
      if (!["circle", "rect", "oval"].includes(pad.shape as string)) throw new Error(`pcb.footprints[${index}].pads[${padIndex}].shape is invalid`);
      if (pad.rotationDeg !== undefined && ![0, 45, 90, 135, 180, 225, 270, 315].includes(pad.rotationDeg as number)) throw new Error(`pcb.footprints[${index}].pads[${padIndex}].rotationDeg is invalid`);
      const size = recordAt(pad.sizeMm, `pcb.footprints[${index}].pads[${padIndex}].sizeMm`); assertExactKeys(size, ["width", "height"], `pcb.footprints[${index}].pads[${padIndex}].sizeMm`); assertNumberFields(size, ["width", "height"], `pcb.footprints[${index}].pads[${padIndex}].sizeMm`);
      if (pad.net !== undefined && typeof pad.net !== "string") throw new Error(`pcb.footprints[${index}].pads[${padIndex}].net must be a string`);
      if (typeof pad.throughHole !== "boolean") throw new Error(`pcb.footprints[${index}].pads[${padIndex}].throughHole must be boolean`);
    }
  }
  for (const [index, raw] of (value.pcb.tracks as unknown[]).entries()) { const track = recordAt(raw, `pcb.tracks[${index}]`); assertExactKeys(track, ["id", "net", "layer", "widthMm", "points"], `pcb.tracks[${index}]`); assertStringFields(track, ["id", "net", "layer"], `pcb.tracks[${index}]`); assertNumberFields(track, ["widthMm"], `pcb.tracks[${index}]`); if (!Array.isArray(track.points) || track.points.length < 2) throw new Error(`pcb.tracks[${index}].points must contain at least two points`); if (!["F.Cu", "B.Cu"].includes(track.layer as string)) throw new Error(`pcb.tracks[${index}].layer is invalid`); track.points.forEach((point, pointIndex) => assertPoint(point, `pcb.tracks[${index}].points[${pointIndex}]`)); }
  assertEntityPoints(value.pcb.vias as unknown[], ["id", "net", "at", "diameterMm", "drillMm"], ["at"], "pcb.vias", ["net"], ["diameterMm", "drillMm"]);
}

function validateFiniteGeometry(schematic: Schematic, pcb: Pcb, out: Diagnostic[]): void {
  const points: Point[] = [...schematic.symbols.flatMap((symbol) => [symbol.at, ...symbol.pins.map((pin) => pin.at)]), ...schematic.wires.flatMap((wire) => [wire.from, wire.to]), ...schematic.junctions.map((item) => item.at), ...schematic.netLabels.map((item) => item.at), ...schematic.powerSymbols.map((item) => item.at), ...pcb.outline, ...pcb.footprints.flatMap((footprint) => [footprint.at, ...footprint.pads.map((pad) => pad.at)]), ...pcb.tracks.flatMap((track) => track.points), ...pcb.vias.map((via) => via.at)];
  if (points.some((point) => !Number.isFinite(point.xMm) || !Number.isFinite(point.yMm))) issue(out, "NON_FINITE_GEOMETRY", "All coordinates must be finite SI millimetre values", []);
  const positive = [pcb.rules.clearanceMm, pcb.rules.minTrackWidthMm, pcb.rules.minEdgeClearanceMm, pcb.rules.minViaDiameterMm, pcb.rules.minViaDrillMm, ...pcb.tracks.map((track) => track.widthMm), ...pcb.vias.flatMap((via) => [via.diameterMm, via.drillMm]), ...pcb.footprints.flatMap((footprint) => footprint.pads.flatMap((pad) => [pad.sizeMm.width, pad.sizeMm.height]))];
  if (positive.some((value) => !Number.isFinite(value) || value <= 0)) issue(out, "INVALID_DIMENSION", "PCB dimensions and rules must be positive finite millimetre values", []);
  if (pcb.rules.minViaDrillMm >= pcb.rules.minViaDiameterMm) issue(out, "INVALID_RULE_RELATION", "Minimum via drill must be smaller than minimum via diameter", []);
  for (const pad of pcb.footprints.flatMap((footprint) => footprint.pads)) if (pad.shape === "circle" && Math.abs(pad.sizeMm.width - pad.sizeMm.height) > 1e-9) issue(out, "INVALID_PAD_GEOMETRY", `Circular pad ${pad.id} requires equal width and height`, [pad.id]);
  if (schematic.wires.some((wire) => samePoint(wire.from, wire.to)) || pcb.tracks.some((track) => track.points.slice(1).some((point, index) => samePoint(point, track.points[index])))) issue(out, "ZERO_LENGTH_GEOMETRY", "Wires and track segments must have non-zero length", []);
}

function validId(id: string): boolean { return ID_PATTERN.test(id); }
function duplicates(values: string[]): string[] { const seen = new Set<string>(); const duplicate = new Set<string>(); for (const value of values) (seen.has(value) ? duplicate : seen).add(value); return [...duplicate].sort(); }
function issue(out: Diagnostic[], code: string, message: string, ids: string[]): void { out.push({ code, severity: "error", message, ids: [...ids].sort() }); }
function compareDiagnostic(a: Diagnostic, b: Diagnostic): number { return a.code.localeCompare(b.code) || a.ids.join("\u0000").localeCompare(b.ids.join("\u0000")) || a.message.localeCompare(b.message); }
function byId(a: { id: string }, b: { id: string }): number { return a.id.localeCompare(b.id); }
function naturalCompare(a: string, b: string): number { return a.localeCompare(b, "en", { numeric: true }); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function assertExactKeys(value: Record<string, unknown>, allowed: string[], label: string): void { const extra = Object.keys(value).filter((key) => !allowed.includes(key)); if (extra.length) throw new Error(`${label} contains unsupported keys: ${extra.sort().join(", ")}`); }
function recordAt(value: unknown, label: string): Record<string, unknown> { if (!isRecord(value)) throw new Error(`${label} must be an object`); return value; }
function assertStringFields(value: Record<string, unknown>, fields: string[], label: string): void { for (const field of fields) if (typeof value[field] !== "string") throw new Error(`${label}.${field} must be a string`); }
function assertNumberFields(value: Record<string, unknown>, fields: string[], label: string): void { for (const field of fields) if (typeof value[field] !== "number" || !Number.isFinite(value[field])) throw new Error(`${label}.${field} must be a finite number`); }
function assertPoint(value: unknown, label: string): void { const point = recordAt(value, label); assertExactKeys(point, ["xMm", "yMm"], label); assertNumberFields(point, ["xMm", "yMm"], label); }
function assertEntityPoints(items: unknown[], allowed: string[], points: string[], label: string, strings: string[] = [], numbers: string[] = []): void { for (const [index, raw] of items.entries()) { const item = recordAt(raw, `${label}[${index}]`); assertExactKeys(item, allowed, `${label}[${index}]`); assertStringFields(item, ["id", ...strings], `${label}[${index}]`); assertNumberFields(item, numbers, `${label}[${index}]`); for (const point of points) assertPoint(item[point], `${label}[${index}].${point}`); } }
function assertSimpleRecords(items: unknown[], allowed: string[], strings: string[], numbers: string[], label: string, optionalStrings: string[] = []): void { for (const [index, raw] of items.entries()) { const item = recordAt(raw, `${label}[${index}]`); assertExactKeys(item, allowed, `${label}[${index}]`); assertStringFields(item, strings, `${label}[${index}]`); assertNumberFields(item, numbers, `${label}[${index}]`); for (const field of optionalStrings) if (item[field] !== undefined && typeof item[field] !== "string") throw new Error(`${label}[${index}].${field} must be a string`); } }
function transformPoint(point: Point, oldOrigin: Point, newOrigin: Point, deltaDeg: number): Point { const radians = deltaDeg * Math.PI / 180; const x = point.xMm - oldOrigin.xMm; const y = point.yMm - oldOrigin.yMm; return { xMm: normaliseZero(newOrigin.xMm + x * Math.cos(radians) - y * Math.sin(radians)), yMm: normaliseZero(newOrigin.yMm + x * Math.sin(radians) + y * Math.cos(radians)) }; }
function transformPlacedPoint(point: Point, oldOrigin: Point, newOrigin: Point, oldRotationDeg: number, newRotationDeg: number, mirrorX: boolean): Point { const local = rotateVector({ xMm: point.xMm - oldOrigin.xMm, yMm: point.yMm - oldOrigin.yMm }, -oldRotationDeg); const mirrored = { xMm: mirrorX ? -local.xMm : local.xMm, yMm: local.yMm }; const placed = rotateVector(mirrored, newRotationDeg); return { xMm: normaliseZero(newOrigin.xMm + placed.xMm), yMm: normaliseZero(newOrigin.yMm + placed.yMm) }; }
function rotateVector(point: Point, degrees: number): Point { const radians = degrees * Math.PI / 180; return { xMm: point.xMm * Math.cos(radians) - point.yMm * Math.sin(radians), yMm: point.xMm * Math.sin(radians) + point.yMm * Math.cos(radians) }; }
function normaliseZero(value: number): number { const rounded = Math.round(value * 1e12) / 1e12; return Object.is(rounded, -0) ? 0 : rounded; }
function samePoint(a: Point, b: Point): boolean { return Math.abs(a.xMm - b.xMm) < 1e-9 && Math.abs(a.yMm - b.yMm) < 1e-9; }
function migrateLegacyV1(value: Record<string, unknown>): Record<string, unknown> {
  if (value.kind !== "engineering-mastery-lab/eda-document" || value.version !== 1) return value;
  const id = typeof value.id === "string" ? value.id : "invalid"; const title = typeof value.title === "string" ? value.title : "";
  const pcb = isRecord(value.pcb) ? value.pcb : {}; const netNames = Array.isArray(pcb.footprints) ? [...new Set((pcb.footprints as unknown[]).flatMap((raw) => { const footprint = isRecord(raw) ? raw : {}; return Array.isArray(footprint.pads) ? footprint.pads.flatMap((pad) => isRecord(pad) && typeof pad.net === "string" ? [pad.net] : []) : []; }))].sort() : [];
  return { ...value, project: value.project ?? { name: title, revision: "Rev00", units: "mm" }, sheets: value.sheets ?? [{ id: `${id}:sheet:1`, name: "Main", order: 1 }], nets: value.nets ?? netNames.map((name) => ({ id: `${id}:net:${name.replaceAll(/[^A-Za-z0-9._:-]/g, "_")}`, name })), layers: value.layers ?? [{ id: "layer:F.Cu", name: "F.Cu", kind: "copper", side: "front" }, { id: "layer:B.Cu", name: "B.Cu", kind: "copper", side: "back" }, { id: "layer:Edge.Cuts", name: "Edge.Cuts", kind: "outline", side: "both" }, { id: "layer:Silkscreen", name: "Silkscreen", kind: "silkscreen", side: "both" }], annotations: value.annotations ?? [], validationResults: value.validationResults ?? [], provenance: value.provenance ?? [] };
}
