export type StableId = string;
export type Point = { xMm: number; yMm: number };
export type PinElectricalType = "input" | "output" | "bidirectional" | "passive" | "power-in" | "power-out" | "open-collector" | "no-connect";
export type CopperLayer = "F.Cu" | "B.Cu";
export type EdaLayerName = CopperLayer | "Edge.Cuts" | "Silkscreen";

export interface ProjectMetadata { name: string; revision: string; units: "mm" }
export interface EdaSheet { id: StableId; name: string; order: number }
export interface EdaNet { id: StableId; name: string }
export interface EdaLayerDefinition { id: StableId; name: EdaLayerName; kind: "copper" | "outline" | "silkscreen"; side: "front" | "back" | "both" }
export interface EdaAnnotation { id: StableId; kind: "note" | "warning"; text: string; targetId?: StableId }
export interface ValidationResult { id: StableId; scope: "document" | "erc" | "drc"; passed: boolean; codes: string[] }
export interface ProvenanceRecord { id: StableId; source: "user" | "offline-fixture" | "import"; detail: string }
export interface EdaExternalVerificationState { fixture: "FIXTURE_VERIFIED"; realTool: "REAL_TOOL_NOT_VERIFIED"; adaptersInvoked: false }

export interface SchematicPin {
  id: StableId;
  number: string;
  name: string;
  electricalType: PinElectricalType;
  required: boolean;
  at: Point;
}

export interface SchematicSymbol {
  id: StableId;
  libraryId: string;
  reference: string;
  value: string;
  at: Point;
  rotationDeg: 0 | 90 | 180 | 270;
  pins: SchematicPin[];
  footprintId?: string;
}

export interface Wire { id: StableId; from: Point; to: Point }
export interface Junction { id: StableId; at: Point }
export interface NoConnect { id: StableId; symbolId: StableId; pinId: StableId }
export interface NetLabel { id: StableId; text: string; at: Point }
export interface PowerSymbol { id: StableId; netName: string; at: Point; powerType: "power-in" | "power-out" }

export interface Schematic {
  symbols: SchematicSymbol[];
  wires: Wire[];
  junctions: Junction[];
  noConnects: NoConnect[];
  netLabels: NetLabel[];
  powerSymbols: PowerSymbol[];
}

export interface Pad {
  id: StableId;
  number: string;
  at: Point;
  sizeMm: { width: number; height: number };
  shape: "circle" | "rect" | "oval";
  rotationDeg?: 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;
  net?: string;
  throughHole: boolean;
}

export interface Footprint {
  id: StableId;
  libraryId: string;
  reference: string;
  at: Point;
  rotationDeg: 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;
  side: "front" | "back";
  pads: Pad[];
}

export interface Track {
  id: StableId;
  net: string;
  layer: CopperLayer;
  widthMm: number;
  points: Point[];
}

export interface Via {
  id: StableId;
  net: string;
  at: Point;
  diameterMm: number;
  drillMm: number;
}

export interface BoardRules {
  clearanceMm: number;
  minTrackWidthMm: number;
  minEdgeClearanceMm: number;
  minViaDiameterMm: number;
  minViaDrillMm: number;
}

export interface Pcb {
  outline: Point[];
  footprints: Footprint[];
  tracks: Track[];
  vias: Via[];
  rules: BoardRules;
}

export interface EdaDocument {
  kind: "engineering-mastery-lab/eda-document";
  version: 1;
  id: StableId;
  title: string;
  project: ProjectMetadata;
  sheets: EdaSheet[];
  nets: EdaNet[];
  layers: EdaLayerDefinition[];
  annotations: EdaAnnotation[];
  validationResults: ValidationResult[];
  provenance: ProvenanceRecord[];
  schematic: Schematic;
  pcb: Pcb;
}

export interface LayerSessionState {
  visible: Record<CopperLayer | "Edge.Cuts" | "Silkscreen", boolean>;
  activeCopperLayer: CopperLayer;
}

export interface Diagnostic {
  code: string;
  severity: "error" | "warning";
  message: string;
  ids: string[];
}

export interface LossEntry {
  code: string;
  message: string;
  preserved: string;
}
