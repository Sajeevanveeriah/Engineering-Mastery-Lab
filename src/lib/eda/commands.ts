import { canonicalEdaJson, transformFootprint, transformSchematicSymbol } from "./document";
import type { BoardRules, EdaDocument, Footprint, LayerSessionState, Pcb, Point, Schematic, SchematicSymbol } from "./types";

type ArrayKey<T> = { [K in keyof T]: T[K] extends unknown[] ? K : never }[keyof T];
export type SchematicCollection = ArrayKey<Schematic>;
export type PcbCollection = Exclude<ArrayKey<Pcb>, "outline">;

export type EdaCommand =
  | { type: "schematic.add"; collection: SchematicCollection; value: Schematic[SchematicCollection] extends Array<infer U> ? U : never }
  | { type: "schematic.remove"; collection: SchematicCollection; id: string }
  | { type: "schematic.update"; collection: SchematicCollection; id: string; changes: Record<string, unknown> }
  | { type: "pcb.add"; collection: PcbCollection; value: Pcb[PcbCollection] extends Array<infer U> ? U : never }
  | { type: "pcb.remove"; collection: PcbCollection; id: string }
  | { type: "pcb.update"; collection: PcbCollection; id: string; changes: Record<string, unknown> }
  | { type: "pcb.setOutline"; outline: Pcb["outline"] }
  | { type: "pcb.setRules"; rules: BoardRules }
  | { type: "document.setTitle"; title: string }
  | { type: "schematic.transformSymbol"; id: string; at: Point; rotationDeg: SchematicSymbol["rotationDeg"] }
  | { type: "pcb.transformFootprint"; id: string; at: Point; rotationDeg: Footprint["rotationDeg"]; side?: Footprint["side"] }
  | { type: "session.setLayerVisible"; layer: keyof LayerSessionState["visible"]; visible: boolean }
  | { type: "session.setActiveLayer"; layer: LayerSessionState["activeCopperLayer"] };

export interface EdaEditorState { document: EdaDocument; session: LayerSessionState }
export interface EdaHistory { present: EdaEditorState; past: EdaEditorState[]; future: EdaEditorState[]; maxEntries?: number }

export function defaultLayerSessionState(): LayerSessionState { return { visible: { "F.Cu": true, "B.Cu": true, "Edge.Cuts": true, Silkscreen: true }, activeCopperLayer: "F.Cu" }; }
export function createEdaHistory(document: EdaDocument, session = defaultLayerSessionState(), maxEntries = 100): EdaHistory { if (!Number.isInteger(maxEntries) || maxEntries < 1 || maxEntries > 1000) throw new Error("EDA history maxEntries must be an integer from 1 to 1000"); canonicalEdaJson(document); return { present: structuredClone({ document, session }), past: [], future: [], maxEntries }; }

export function applyEdaCommand(state: EdaEditorState, command: EdaCommand): EdaEditorState {
  const next = applyUnchecked(state, command);
  canonicalEdaJson(next.document);
  return next;
}

function applyUnchecked(state: EdaEditorState, command: EdaCommand): EdaEditorState {
  const next = structuredClone(state);
  if (command.type === "schematic.transformSymbol") { const index = next.document.schematic.symbols.findIndex((symbol) => symbol.id === command.id); if (index < 0) throw new Error(`EDA symbol ${command.id} was not found`); next.document.schematic.symbols[index] = transformSchematicSymbol(next.document.schematic.symbols[index], command.at, command.rotationDeg); }
  else if (command.type === "pcb.transformFootprint") { const index = next.document.pcb.footprints.findIndex((footprint) => footprint.id === command.id); if (index < 0) throw new Error(`EDA footprint ${command.id} was not found`); next.document.pcb.footprints[index] = transformFootprint(next.document.pcb.footprints[index], command.at, command.rotationDeg, command.side); }
  else if (command.type.startsWith("schematic.")) mutateCollection(next.document.schematic as unknown as Record<string, unknown>, command as CollectionCommand);
  else if (command.type === "pcb.add" || command.type === "pcb.remove" || command.type === "pcb.update") mutateCollection(next.document.pcb as unknown as Record<string, unknown>, command as CollectionCommand);
  else if (command.type === "pcb.setOutline") next.document.pcb.outline = structuredClone(command.outline);
  else if (command.type === "pcb.setRules") next.document.pcb.rules = structuredClone(command.rules);
  else if (command.type === "document.setTitle") { next.document.title = command.title; next.document.project.name = command.title; }
  else if (command.type === "session.setLayerVisible") next.session.visible[command.layer] = command.visible;
  else if (command.type === "session.setActiveLayer") next.session.activeCopperLayer = command.layer;
  return next;
}

export function applyEdaCommandGroup(state: EdaEditorState, commands: EdaCommand[]): EdaEditorState { if (!commands.length || commands.length > 100) throw new Error("EDA command group must contain from 1 to 100 commands"); const next = commands.reduce(applyUnchecked, structuredClone(state)); canonicalEdaJson(next.document); return next; }
export function dispatchEdaCommand(history: EdaHistory, command: EdaCommand): EdaHistory { return dispatchEdaCommandGroup(history, [command]); }
export function dispatchEdaCommandGroup(history: EdaHistory, commands: EdaCommand[]): EdaHistory { const limit = historyLimit(history); const present = applyEdaCommandGroup(history.present, commands); return { present, past: [...history.past, structuredClone(history.present)].slice(-limit), future: [], maxEntries: limit }; }
export function undoEdaCommand(history: EdaHistory): EdaHistory { if (!history.past.length) return history; const limit = historyLimit(history); const prior = history.past.at(-1) as EdaEditorState; return { present: structuredClone(prior), past: history.past.slice(0, -1), future: [structuredClone(history.present), ...history.future].slice(0, limit), maxEntries: limit }; }
export function redoEdaCommand(history: EdaHistory): EdaHistory { if (!history.future.length) return history; const limit = historyLimit(history); const next = history.future[0]; return { present: structuredClone(next), past: [...history.past, structuredClone(history.present)].slice(-limit), future: history.future.slice(1), maxEntries: limit }; }

interface CollectionCommand { type: string; collection: string; id?: string; value?: unknown; changes?: Record<string, unknown> }
function mutateCollection(target: Record<string, unknown>, command: CollectionCommand): void {
  const list = target[command.collection]; if (!Array.isArray(list)) throw new Error(`Unknown EDA collection ${command.collection}`);
  if (command.type.endsWith(".add")) { const id = (command.value as { id?: unknown })?.id; if (typeof id !== "string") throw new Error("Added EDA entity requires an ID"); if (list.some((item) => (item as { id?: unknown }).id === id)) throw new Error(`Duplicate EDA entity ID ${id}`); list.push(structuredClone(command.value)); }
  else { const index = list.findIndex((item) => (item as { id?: unknown }).id === command.id); if (index < 0) throw new Error(`EDA entity ${command.id} was not found`); if (command.type.endsWith(".remove")) list.splice(index, 1); else list[index] = { ...list[index] as object, ...structuredClone(command.changes) }; }
}
function historyLimit(history: EdaHistory): number { return history.maxEntries ?? 100; }
