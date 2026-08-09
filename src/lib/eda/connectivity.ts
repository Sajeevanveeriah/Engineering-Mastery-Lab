import { assertValidEdaDocument, validateEdaDocument } from "./document";
import type { Diagnostic, EdaDocument, PinElectricalType, Point, SchematicSymbol } from "./types";

export interface NetNode { id: string; sourceId: string; kind: "pin" | "junction" | "label" | "power" | "wire-end"; point: Point; symbolId?: string; pinId?: string; electricalType?: PinElectricalType }
export interface ConnectivityNet { name: string; nodes: NetNode[]; pinKeys: string[] }
export interface ConnectivityGraph { nets: ConnectivityNet[]; pinToNet: Record<string, string> }

export function buildConnectivityGraph(document: EdaDocument): ConnectivityGraph {
  const nodes: NetNode[] = [];
  for (const symbol of document.schematic.symbols) for (const pin of symbol.pins) nodes.push({ id: `pin:${symbol.id}:${pin.id}`, sourceId: pin.id, kind: "pin", point: pin.at, symbolId: symbol.id, pinId: pin.id, electricalType: pin.electricalType });
  for (const junction of document.schematic.junctions) nodes.push({ id: `junction:${junction.id}`, sourceId: junction.id, kind: "junction", point: junction.at });
  for (const label of document.schematic.netLabels) nodes.push({ id: `label:${label.id}`, sourceId: label.id, kind: "label", point: label.at });
  for (const power of document.schematic.powerSymbols) nodes.push({ id: `power:${power.id}`, sourceId: power.id, kind: "power", point: power.at, electricalType: power.powerType });
  for (const wire of document.schematic.wires) { nodes.push({ id: `wire:${wire.id}:a`, sourceId: wire.id, kind: "wire-end", point: wire.from }); nodes.push({ id: `wire:${wire.id}:b`, sourceId: wire.id, kind: "wire-end", point: wire.to }); }
  nodes.sort((a, b) => a.id.localeCompare(b.id));
  const parent = nodes.map((_, index) => index);
  const find = (index: number): number => { while (parent[index] !== index) { parent[index] = parent[parent[index]]; index = parent[index]; } return index; };
  const union = (a: number, b: number): void => { const ra = find(a); const rb = find(b); if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb); };
  for (let a = 0; a < nodes.length; a += 1) for (let b = a + 1; b < nodes.length; b += 1) if (samePoint(nodes[a].point, nodes[b].point)) union(a, b);
  for (const wire of document.schematic.wires) {
    const onWire = nodes.map((node, index) => ({ node, index })).filter(({ node }) => pointOnSegment(node.point, wire.from, wire.to));
    for (let index = 1; index < onWire.length; index += 1) union(onWire[0].index, onWire[index].index);
  }
  const labels = document.schematic.netLabels;
  for (let a = 0; a < labels.length; a += 1) for (let b = a + 1; b < labels.length; b += 1) if (labels[a].text === labels[b].text) union(nodes.findIndex((node) => node.id === `label:${labels[a].id}`), nodes.findIndex((node) => node.id === `label:${labels[b].id}`));
  const powers = document.schematic.powerSymbols;
  for (let a = 0; a < powers.length; a += 1) for (let b = a + 1; b < powers.length; b += 1) if (powers[a].netName === powers[b].netName) union(nodes.findIndex((node) => node.id === `power:${powers[a].id}`), nodes.findIndex((node) => node.id === `power:${powers[b].id}`));
  const groups = new Map<number, NetNode[]>();
  nodes.forEach((node, index) => groups.set(find(index), [...(groups.get(find(index)) ?? []), node]));
  const usedNames = new Set<string>();
  const nets = [...groups.values()].filter((group) => group.some((node) => node.kind === "pin" || node.kind === "label" || node.kind === "power")).map((group) => {
    const candidateNames = group.flatMap((node) => node.kind === "label" ? [labels.find((label) => `label:${label.id}` === node.id)?.text ?? ""] : node.kind === "power" ? [powers.find((power) => `power:${power.id}` === node.id)?.netName ?? ""] : []).filter(Boolean).sort();
    let name = candidateNames[0];
    if (!name) { const pin = group.find((node) => node.kind === "pin"); name = pin ? `Net-${pin.symbolId}-${pin.pinId}` : "Net"; }
    let uniqueName = name; let suffix = 2; while (usedNames.has(uniqueName)) uniqueName = `${name}-${suffix++}`; usedNames.add(uniqueName);
    const sortedNodes = group.sort((a, b) => a.id.localeCompare(b.id));
    return { name: uniqueName, nodes: sortedNodes, pinKeys: sortedNodes.filter((node) => node.kind === "pin").map((node) => `${node.symbolId}:${node.pinId}`) };
  }).sort((a, b) => a.name.localeCompare(b.name));
  const pinToNet: Record<string, string> = {};
  for (const net of nets) for (const key of net.pinKeys) pinToNet[key] = net.name;
  return { nets, pinToNet };
}

export function runErc(document: EdaDocument): Diagnostic[] {
  const validation = validateEdaDocument(document);
  const graph = buildConnectivityGraph(document);
  const diagnostics: Diagnostic[] = [...validation];
  const noConnects = new Map<string, typeof document.schematic.noConnects>();
  for (const item of document.schematic.noConnects) { const key = `${item.symbolId}:${item.pinId}`; noConnects.set(key, [...(noConnects.get(key) ?? []), item]); }
  for (const symbol of document.schematic.symbols) for (const pin of symbol.pins) {
    const key = `${symbol.id}:${pin.id}`;
    const net = graph.nets.find((candidate) => candidate.pinKeys.includes(key));
    const connectedPins = net?.pinKeys.length ?? 0;
    const pinNodeId = `pin:${symbol.id}:${pin.id}`;
    const attachedNodes = net?.nodes.filter((node) => node.id !== pinNodeId) ?? [];
    if (pin.required && !noConnects.has(key) && connectedPins < 2) diagnostics.push(diag("ERC_UNCONNECTED_REQUIRED_PIN", `Required pin ${symbol.reference}.${pin.number} is unconnected`, [symbol.id, pin.id]));
    if (noConnects.has(key) && attachedNodes.length > 0) diagnostics.push(diag("ERC_CONNECTED_NO_CONNECT", `No-connect pin ${symbol.reference}.${pin.number} is attached to ${[...new Set(attachedNodes.map((node) => node.kind))].sort().join(", ")}`, [...(noConnects.get(key) ?? []).map((item) => item.id), symbol.id, pin.id, ...attachedNodes.map((node) => node.sourceId)]));
  }
  for (const net of graph.nets) {
    const outputs = net.nodes.filter((node) => node.electricalType === "output");
    if (outputs.length > 1) diagnostics.push(diag("ERC_OUTPUT_CONFLICT", `Net ${net.name} has multiple outputs`, outputs.map((node) => node.id)));
    const powerOutputs = net.nodes.filter((node) => node.electricalType === "power-out");
    if (powerOutputs.length > 1) diagnostics.push(diag("ERC_POWER_CONFLICT", `Net ${net.name} has multiple power outputs`, powerOutputs.map((node) => node.id)));
    const nameSources = net.nodes.flatMap((node) => { if (node.kind === "label") { const label = document.schematic.netLabels.find((item) => `label:${item.id}` === node.id); return label ? [{ id: label.id, name: label.text }] : []; } if (node.kind === "power") { const power = document.schematic.powerSymbols.find((item) => `power:${item.id}` === node.id); return power ? [{ id: power.id, name: power.netName }] : []; } return []; });
    const distinctNames = [...new Set(nameSources.map((source) => source.name))].sort();
    if (distinctNames.length > 1) diagnostics.push(diag("ERC_NET_NAME_CONFLICT", `Connected component has conflicting net names: ${distinctNames.join(", ")}`, nameSources.map((source) => source.id)));
  }
  return diagnostics.sort((a, b) => a.code.localeCompare(b.code) || a.ids.join().localeCompare(b.ids.join()));
}

export function annotateSchematic(document: EdaDocument): EdaDocument {
  const clone = structuredClone(document);
  const used = new Set(clone.schematic.symbols.map((symbol) => symbol.reference).filter((reference) => !reference.endsWith("?")));
  const counters = new Map<string, number>();
  for (const symbol of [...clone.schematic.symbols].sort((a, b) => a.id.localeCompare(b.id))) {
    if (!symbol.reference.endsWith("?")) continue;
    const prefix = symbol.reference.slice(0, -1) || referencePrefix(symbol);
    let number = counters.get(prefix) ?? 1;
    while (used.has(`${prefix}${number}`)) number += 1;
    symbol.reference = `${prefix}${number}`; used.add(symbol.reference); counters.set(prefix, number + 1);
    const footprint = clone.pcb.footprints.find((item) => item.id === symbol.footprintId); if (footprint) footprint.reference = symbol.reference;
  }
  return clone;
}

export function generateSchematicNetlist(document: EdaDocument): string {
  assertValidEdaDocument(document);
  const graph = buildConnectivityGraph(document);
  const symbols = new Map(document.schematic.symbols.map((symbol) => [symbol.id, symbol]));
  const lines = ["(export (version 1) (generator engineering-mastery-lab)"];
  for (const net of graph.nets) {
    const pins = net.nodes.filter((node) => node.kind === "pin").map((node) => { const symbol = symbols.get(node.symbolId ?? ""); const pin = symbol?.pins.find((item) => item.id === node.pinId); return symbol && pin ? ` (node (ref ${symbol.reference}) (pin ${pin.number}))` : ""; }).filter(Boolean).sort();
    lines.push(`  (net (name ${quote(net.name)})${pins.join("")})`);
  }
  lines.push(")"); return `${lines.join("\n")}\n`;
}

function referencePrefix(symbol: SchematicSymbol): string { return symbol.libraryId.includes("LED") || symbol.libraryId.includes(":D") ? "D" : symbol.libraryId.includes(":R") ? "R" : symbol.libraryId.includes(":C") ? "C" : "U"; }
function diag(code: string, message: string, ids: string[]): Diagnostic { return { code, severity: "error", message, ids: [...new Set(ids)].sort() }; }
function samePoint(a: Point, b: Point): boolean { return Math.abs(a.xMm - b.xMm) < 1e-9 && Math.abs(a.yMm - b.yMm) < 1e-9; }
function pointOnSegment(point: Point, a: Point, b: Point): boolean { const cross = (point.yMm - a.yMm) * (b.xMm - a.xMm) - (point.xMm - a.xMm) * (b.yMm - a.yMm); if (Math.abs(cross) > 1e-8) return false; return point.xMm >= Math.min(a.xMm, b.xMm) - 1e-9 && point.xMm <= Math.max(a.xMm, b.xMm) + 1e-9 && point.yMm >= Math.min(a.yMm, b.yMm) - 1e-9 && point.yMm <= Math.max(a.yMm, b.yMm) + 1e-9; }
function quote(value: string): string { return `"${value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"")}"`; }
