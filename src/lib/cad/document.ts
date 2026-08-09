import type { CadDesign } from "./model";

export type CadBodyId = string & { readonly __cadBodyId: unique symbol };
export type CadFeatureId = string & { readonly __cadFeatureId: unique symbol };
export type CadAssetId = string & { readonly __cadAssetId: unique symbol };
export type CadSketchId = string & { readonly __cadSketchId: unique symbol };

export type CadLengthUnit = "mm";
export type CadAngleUnit = "rad";
export type CadParameter =
  | { readonly value: number; readonly unit: CadLengthUnit }
  | { readonly value: number; readonly unit: CadAngleUnit }
  | { readonly value: number; readonly unit: "kg/m3" }
  | { readonly value: number; readonly unit: "count" | "ratio" };

export interface CadTransform {
  readonly translationMm: readonly [number, number, number];
  readonly rotationRad: readonly [number, number, number];
  readonly scale: readonly [number, number, number];
}

export interface CadBody {
  readonly id: CadBodyId;
  readonly name: string;
  readonly kind: "solid" | "surface" | "mesh-reference";
  readonly sourceFeatureId: CadFeatureId;
  readonly visible: boolean;
  readonly referenceOnly: boolean;
}

export interface CadSketch {
  readonly id: CadSketchId;
  readonly name: string;
  readonly plane: "xy" | "xz" | "yz";
  readonly sourceHash: string;
}

export interface CadWarning {
  readonly code: string;
  readonly message: string;
  readonly severity: "info" | "warning";
}

export interface CadFeatureEvaluation {
  readonly state: "pending" | "valid" | "failed";
  readonly warnings: readonly CadWarning[];
  readonly sourceHash?: string;
}

export interface CadFeature {
  readonly id: CadFeatureId;
  readonly name: string;
  readonly kind: "primitive" | "sketch" | "extrude" | "pocket" | "revolve" | "boolean" | "fillet" | "chamfer" | "mesh-reference";
  readonly dependsOn: readonly CadFeatureId[];
  readonly parameters: Readonly<Record<string, CadParameter>>;
  readonly bodyIds: readonly CadBodyId[];
  readonly sketchIds?: readonly CadSketchId[];
  readonly assetId?: CadAssetId;
  readonly suppression?: "active" | "suppressed";
  readonly evaluation?: CadFeatureEvaluation;
  /** @deprecated Use suppression instead. Retained for version-2 compatibility. */
  readonly suppressed?: boolean;
}

export interface CadAsset {
  readonly id: CadAssetId;
  readonly name: string;
  readonly kind: "mesh";
  readonly format: "stl" | "3mf";
  readonly sha256: string;
  readonly byteLength: number;
  readonly referenceOnly: true;
}

export interface CadSelection {
  readonly kind: "body" | "feature" | "asset";
  readonly id: CadBodyId | CadFeatureId | CadAssetId;
  readonly subElement?: { readonly kind: "face" | "edge" | "vertex"; readonly index: number };
}

export interface CadDocument {
  readonly version: 2;
  readonly id: string;
  readonly name: string;
  readonly units: { readonly length: CadLengthUnit; readonly angle: CadAngleUnit };
  readonly features: readonly CadFeature[];
  readonly sketches?: readonly CadSketch[];
  readonly bodies: readonly CadBody[];
  readonly assets: readonly CadAsset[];
  readonly selections: readonly CadSelection[];
}

export interface CadDocumentValidation {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly featureOrder: readonly CadFeatureId[];
}

export interface CadRebuildSuccess<T> {
  readonly status: "ok";
  readonly featureId: CadFeatureId;
  readonly result: T;
  readonly lastValidResult: T;
}

export interface CadRebuildFailure<T> {
  readonly status: "failed";
  readonly featureId: CadFeatureId;
  readonly error: string;
  readonly lastValidResult?: T;
}

export type CadRebuildRecord<T> = CadRebuildSuccess<T> | CadRebuildFailure<T>;

export interface CadRebuildReport<T> {
  readonly document: CadDocument;
  readonly records: readonly CadRebuildRecord<T>[];
  readonly lastValidResults: ReadonlyMap<CadFeatureId, T>;
  readonly selectionWarnings: readonly CadSelectionWarning[];
}

export interface CadSelectionWarning extends CadWarning {
  readonly selection: CadSelection;
  readonly code: "DANGLING_SUBELEMENT_SELECTION" | "SUBELEMENT_IDENTITY_UNSTABLE";
}

export interface CadCommand {
  readonly label: string;
  readonly apply: (document: CadDocument) => CadDocument;
}

export interface CadCommandTransaction {
  readonly label: string;
  readonly commands: readonly CadCommand[];
}

export interface CadHistory {
  readonly present: CadDocument;
  readonly undo: readonly CadDocument[];
  readonly redo: readonly CadDocument[];
  readonly limit: number;
}

const ID_PATTERN = /^[a-z][a-z0-9-]{2,79}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const NAME_PATTERN = /^[\p{L}\p{N} _().,#+'-]{1,80}$/u;
const PARAMETER_UNITS = new Set<CadParameter["unit"]>(["mm", "rad", "kg/m3", "count", "ratio"]);
const FEATURE_KINDS = new Set<CadFeature["kind"]>(["primitive", "sketch", "extrude", "pocket", "revolve", "boolean", "fillet", "chamfer", "mesh-reference"]);

function clone<T>(value: T): T {
  return structuredClone(value);
}

function canonicalise(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalise).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalise(record[key])}`).join(",")}}`;
}

function fnv1a64(source: string): string {
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= BigInt(source.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

function safeIdPrefix(value: string): string {
  const prefix = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
  return /^[a-z]/.test(prefix) ? prefix : `cad-${prefix || "item"}`;
}

export function stableCadId(namespace: string, seed: unknown): string {
  return `${safeIdPrefix(namespace)}-${fnv1a64(canonicalise(seed))}`;
}

export function stableCadSourceHash(seed: unknown): string {
  const canonical = canonicalise(seed);
  return ["0", "1", "2", "3"].map((salt) => fnv1a64(`${salt}:${canonical}`)).join("");
}

function canonicalJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalJsonValue);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(record).sort().filter((key) => record[key] !== undefined).map((key) => [key, canonicalJsonValue(record[key])]));
  }
  return value;
}

function duplicateValues(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => seen.has(value) || !seen.add(value));
}

export function validateCadDocument(document: CadDocument): CadDocumentValidation {
  const errors: string[] = [];
  if (!document || typeof document !== "object") return { valid: false, errors: ["CAD document must be an object."], featureOrder: [] };
  if (document.version !== 2) errors.push("Unsupported CAD document version.");
  if (typeof document.id !== "string" || !ID_PATTERN.test(document.id)) errors.push("Document identifier is invalid.");
  if (typeof document.name !== "string" || !NAME_PATTERN.test(document.name.trim())) errors.push("Document name is invalid.");
  if (!document.units || document.units.length !== "mm" || document.units.angle !== "rad") errors.push("CAD document units must be millimetres and radians.");
  if (!Array.isArray(document.features) || !Array.isArray(document.bodies) || !Array.isArray(document.assets) || !Array.isArray(document.selections) || (document.sketches !== undefined && !Array.isArray(document.sketches))) {
    errors.push("CAD document features, sketches, bodies, assets and selections must be arrays.");
    return { valid: false, errors: [...new Set(errors)], featureOrder: [] };
  }

  const sketches = document.sketches ?? [];
  const featureIds = document.features.map((feature) => feature && typeof feature === "object" && typeof feature.id === "string" ? feature.id : "");
  const sketchIds = sketches.map((sketch) => sketch && typeof sketch === "object" && typeof sketch.id === "string" ? sketch.id : "");
  const bodyIds = document.bodies.map((body) => body && typeof body === "object" && typeof body.id === "string" ? body.id : "");
  const assetIds = document.assets.map((asset) => asset && typeof asset === "object" && typeof asset.id === "string" ? asset.id : "");
  if (duplicateValues(featureIds).length > 0) errors.push("Feature identifiers must be unique.");
  if (duplicateValues(sketchIds).length > 0) errors.push("Sketch identifiers must be unique.");
  if (duplicateValues(bodyIds).length > 0) errors.push("Body identifiers must be unique.");
  if (duplicateValues(assetIds).length > 0) errors.push("Asset identifiers must be unique.");

  const featureSet = new Set(featureIds);
  const sketchSet = new Set(sketchIds);
  const bodySet = new Set(bodyIds);
  const assetSet = new Set(assetIds);
  for (const feature of document.features) {
    if (!feature || typeof feature !== "object") {
      errors.push("CAD document contains a non-object feature.");
      continue;
    }
    if (typeof feature.id !== "string" || !ID_PATTERN.test(feature.id) || !FEATURE_KINDS.has(feature.kind)) errors.push(`Feature ${feature.id || "(missing)"} is invalid.`);
    if (typeof feature.name !== "string" || !NAME_PATTERN.test(feature.name.trim())) errors.push(`Feature ${feature.id} has an invalid name.`);
    if (!Array.isArray(feature.dependsOn) || !Array.isArray(feature.bodyIds) || !feature.parameters || typeof feature.parameters !== "object" || Array.isArray(feature.parameters)) {
      errors.push(`Feature ${feature.id} dependencies, body identifiers or parameters are invalid.`);
      continue;
    }
    if (duplicateValues(feature.dependsOn as readonly string[]).length > 0) errors.push(`Feature ${feature.id} has duplicate dependencies.`);
    for (const dependency of feature.dependsOn) {
      if (!featureSet.has(dependency)) errors.push(`Feature ${feature.id} depends on missing feature ${dependency}.`);
      if (dependency === feature.id) errors.push(`Feature ${feature.id} cannot depend on itself.`);
    }
    for (const bodyId of feature.bodyIds) if (!bodySet.has(bodyId)) errors.push(`Feature ${feature.id} references missing body ${bodyId}.`);
    if (feature.sketchIds !== undefined && !Array.isArray(feature.sketchIds)) errors.push(`Feature ${feature.id} sketch identifiers are invalid.`);
    else for (const sketchId of feature.sketchIds ?? []) if (!sketchSet.has(sketchId)) errors.push(`Feature ${feature.id} references missing sketch ${sketchId}.`);
    if (feature.assetId && !assetSet.has(feature.assetId)) errors.push(`Feature ${feature.id} references missing asset ${feature.assetId}.`);
    if (feature.kind === "mesh-reference" && !feature.assetId) errors.push(`Mesh-reference feature ${feature.id} requires an asset.`);
    if (feature.suppression !== undefined && feature.suppression !== "active" && feature.suppression !== "suppressed") errors.push(`Feature ${feature.id} suppression state is invalid.`);
    if (feature.suppressed !== undefined && feature.suppression !== undefined && feature.suppressed !== (feature.suppression === "suppressed")) errors.push(`Feature ${feature.id} has conflicting suppression states.`);
    if (feature.evaluation !== undefined) {
      const evaluation = feature.evaluation;
      if (!evaluation || !["pending", "valid", "failed"].includes(evaluation.state) || !Array.isArray(evaluation.warnings)) errors.push(`Feature ${feature.id} evaluation state is invalid.`);
      else {
        if (evaluation.sourceHash !== undefined && !SHA256_PATTERN.test(evaluation.sourceHash)) errors.push(`Feature ${feature.id} evaluation source hash is invalid.`);
        for (const warning of evaluation.warnings) {
          if (!warning || typeof warning.code !== "string" || !/^[A-Z][A-Z0-9_]{1,79}$/.test(warning.code) || typeof warning.message !== "string" || !["info", "warning"].includes(warning.severity)) errors.push(`Feature ${feature.id} has an invalid evaluation warning.`);
        }
      }
    }
    for (const [key, parameter] of Object.entries(feature.parameters)) {
      if (!parameter || typeof parameter !== "object") {
        errors.push(`Feature ${feature.id} has invalid parameter ${key}.`);
        continue;
      }
      const candidate = parameter as { unit?: unknown; value?: unknown };
      if (!/^[a-z][a-zA-Z0-9]{0,39}$/.test(key) || typeof candidate.unit !== "string" || !PARAMETER_UNITS.has(candidate.unit as CadParameter["unit"]) || !Number.isFinite(candidate.value)) {
        errors.push(`Feature ${feature.id} has invalid parameter ${key}.`);
        continue;
      }
      if (candidate.unit === "count" && (!Number.isInteger(candidate.value) || (candidate.value as number) < 0)) {
        errors.push(`Feature ${feature.id} count parameter ${key} must be a non-negative integer.`);
      }
    }
  }

  const order: CadFeatureId[] = [];
  const state = new Map<CadFeatureId, "visiting" | "visited">();
  const visit = (id: CadFeatureId): void => {
    const current = state.get(id);
    if (current === "visited") return;
    if (current === "visiting") {
      errors.push(`Feature dependency cycle includes ${id}.`);
      return;
    }
    state.set(id, "visiting");
    const feature = document.features.find((candidate) => candidate && typeof candidate === "object" && candidate.id === id);
    if (!feature || !Array.isArray(feature.dependsOn)) return;
    for (const dependency of feature.dependsOn) visit(dependency);
    state.set(id, "visited");
    order.push(id);
  };
  for (const feature of document.features) if (feature && typeof feature === "object" && typeof feature.id === "string") visit(feature.id);

  for (const sketch of sketches) {
    if (!sketch || typeof sketch !== "object") {
      errors.push("CAD document contains a non-object sketch.");
      continue;
    }
    if (typeof sketch.id !== "string" || !ID_PATTERN.test(sketch.id) || typeof sketch.name !== "string" || !NAME_PATTERN.test(sketch.name.trim()) || !["xy", "xz", "yz"].includes(sketch.plane) || typeof sketch.sourceHash !== "string" || !SHA256_PATTERN.test(sketch.sourceHash)) {
      errors.push(`Sketch ${sketch.id || "(missing)"} is invalid.`);
    }
  }

  for (const body of document.bodies) {
    if (!body || typeof body !== "object") {
      errors.push("CAD document contains a non-object body.");
      continue;
    }
    if (typeof body.id !== "string" || !ID_PATTERN.test(body.id) || !featureSet.has(body.sourceFeatureId)) errors.push(`Body ${body.id || "(missing)"} is invalid.`);
    if (body.kind === "mesh-reference" && !body.referenceOnly) errors.push(`Imported mesh body ${body.id} must be reference-only.`);
    if (body.kind !== "mesh-reference" && body.referenceOnly) errors.push(`Parametric body ${body.id} cannot be reference-only.`);
  }
  for (const asset of document.assets) {
    if (!asset || typeof asset !== "object") {
      errors.push("CAD document contains a non-object asset.");
      continue;
    }
    if (typeof asset.id !== "string" || !ID_PATTERN.test(asset.id) || typeof asset.sha256 !== "string" || !SHA256_PATTERN.test(asset.sha256) || !Number.isSafeInteger(asset.byteLength) || asset.byteLength < 0) {
      errors.push(`Asset ${asset.id || "(missing)"} is invalid.`);
    }
    if (asset.referenceOnly !== true) errors.push(`Imported asset ${asset.id} must be reference-only.`);
  }
  for (const selection of document.selections) {
    if (!selection || typeof selection !== "object") {
      errors.push("CAD document contains a non-object selection.");
      continue;
    }
    const validKind = selection.kind === "body" || selection.kind === "feature" || selection.kind === "asset";
    const valid = validKind && (selection.kind === "body" ? bodySet.has(selection.id) : selection.kind === "feature" ? featureSet.has(selection.id) : assetSet.has(selection.id));
    if (!valid) errors.push(`Selection references missing ${selection.kind} ${selection.id}.`);
    if (selection.subElement && (!Number.isSafeInteger(selection.subElement.index) || selection.subElement.index < 0)) errors.push("Selection sub-element index is invalid.");
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)], featureOrder: order };
}

export function createCadHistory(document: CadDocument, limit = 50): CadHistory {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) throw new Error("CAD history limit must be an integer from 1 to 500.");
  const validation = validateCadDocument(document);
  if (!validation.valid) throw new Error(validation.errors[0]);
  return { present: clone(document), undo: [], redo: [], limit };
}

export function executeCadCommand(history: CadHistory, command: CadCommand): CadHistory {
  return executeCadTransaction(history, { label: command.label, commands: [command] });
}

export function executeCadTransaction(history: CadHistory, transaction: CadCommandTransaction): CadHistory {
  if (!transaction.label.trim() || transaction.commands.length === 0) throw new Error("CAD command transaction requires a label and at least one command.");
  let next = clone(history.present);
  for (const command of transaction.commands) next = command.apply(next);
  const validation = validateCadDocument(next);
  if (!validation.valid) throw new Error(`${transaction.label}: ${validation.errors[0]}`);
  const undo = [...history.undo, clone(history.present)].slice(-history.limit);
  return { ...history, present: clone(next), undo, redo: [] };
}

export function undoCadCommand(history: CadHistory): CadHistory {
  const previous = history.undo.at(-1);
  if (!previous) return history;
  return { ...history, present: clone(previous), undo: history.undo.slice(0, -1), redo: [clone(history.present), ...history.redo].slice(0, history.limit) };
}

export function redoCadCommand(history: CadHistory): CadHistory {
  const next = history.redo[0];
  if (!next) return history;
  return { ...history, present: clone(next), undo: [...history.undo, clone(history.present)].slice(-history.limit), redo: history.redo.slice(1) };
}

export function rebuildCadDocument<T>(
  document: CadDocument,
  evaluate: (feature: CadFeature, dependencies: ReadonlyMap<CadFeatureId, T>) => T,
  previousLastValid: ReadonlyMap<CadFeatureId, T> = new Map()
): CadRebuildReport<T> {
  const validation = validateCadDocument(document);
  if (!validation.valid) throw new Error(validation.errors[0]);
  const results = new Map<CadFeatureId, T>();
  const lastValid = new Map(previousLastValid);
  const records: CadRebuildRecord<T>[] = [];
  for (const featureId of validation.featureOrder) {
    const feature = document.features.find((candidate) => candidate.id === featureId);
    if (!feature) continue;
    const dependencies = new Map<CadFeatureId, T>();
    for (const dependencyId of feature.dependsOn) {
      const result = results.get(dependencyId) ?? lastValid.get(dependencyId);
      if (result !== undefined) dependencies.set(dependencyId, result);
    }
    try {
      const result = evaluate(feature, dependencies);
      results.set(feature.id, result);
      lastValid.set(feature.id, result);
      records.push({ status: "ok", featureId: feature.id, result, lastValidResult: result });
    } catch (error) {
      records.push({ status: "failed", featureId: feature.id, error: error instanceof Error ? error.message : String(error), lastValidResult: lastValid.get(feature.id) });
    }
  }
  const selectionWarnings: CadSelectionWarning[] = [];
  for (const selection of document.selections) {
    if (!selection.subElement) continue;
    selectionWarnings.push({
      code: "SUBELEMENT_IDENTITY_UNSTABLE",
      message: "Face, edge and vertex indices are rebuild-local and do not provide stable topological naming.",
      severity: "warning",
      selection: clone(selection)
    });
    const body = selection.kind === "body" ? document.bodies.find((candidate) => candidate.id === selection.id) : undefined;
    const sourceFeatureId = selection.kind === "feature" ? selection.id as CadFeatureId : body?.sourceFeatureId;
    const record = sourceFeatureId ? records.find((candidate) => candidate.featureId === sourceFeatureId) : undefined;
    if (record?.status === "failed" && record.lastValidResult === undefined) {
      selectionWarnings.push({
        code: "DANGLING_SUBELEMENT_SELECTION",
        message: `Selected ${selection.subElement.kind} ${selection.subElement.index} is dangling because its source feature has no valid rebuild result.`,
        severity: "warning",
        selection: clone(selection)
      });
    }
  }
  return { document: clone(document), records, lastValidResults: lastValid, selectionWarnings };
}

function parametersForV1(design: CadDesign): Record<string, CadParameter> {
  const source = design[design.partType];
  return {
    ...Object.fromEntries(Object.entries(source).map(([key, value]) => [key, {
    value: Number(value),
    unit: key.toLowerCase().includes("count") ? "count" : "mm"
    } satisfies CadParameter])),
    materialDensity: { value: design.density, unit: "kg/m3" }
  };
}

export function migrateCadDesignV1(design: CadDesign): CadDocument {
  if (design.version !== 1) throw new Error("Only CAD design version 1 can be migrated.");
  const seed = { name: design.name, partType: design.partType, parameters: design[design.partType] };
  const documentId = stableCadId("document", seed);
  const featureId = stableCadId("feature", seed) as CadFeatureId;
  const bodyId = stableCadId("body", seed) as CadBodyId;
  const sourceHash = stableCadSourceHash(design);
  const document: CadDocument = {
    version: 2,
    id: documentId,
    name: design.name,
    units: { length: "mm", angle: "rad" },
    features: [{
      id: featureId,
      name: `${design.partType} primitive`,
      kind: "primitive",
      dependsOn: [],
      parameters: parametersForV1(design),
      bodyIds: [bodyId],
      suppression: "active",
      evaluation: { state: "pending", warnings: [], sourceHash }
    }],
    sketches: [],
    bodies: [{ id: bodyId, name: design.name, kind: "solid", sourceFeatureId: featureId, visible: true, referenceOnly: false }],
    assets: [],
    selections: []
  };
  const validation = validateCadDocument(document);
  if (!validation.valid) throw new Error(validation.errors[0]);
  return document;
}

export function importCadDocumentJson(source: string): CadDocument {
  if (source.length > 1_000_000) throw new Error("CAD document file is too large.");
  const parsed: unknown = JSON.parse(source);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("CAD document file must contain an object.");
  const version = (parsed as { version?: unknown }).version;
  if (version === 1) return migrateCadDesignV1(parsed as CadDesign);
  if (version !== 2) throw new Error(typeof version === "number" && version > 2 ? "CAD document was created by a newer unsupported version." : "Unsupported CAD document version.");
  const document = clone(parsed as CadDocument);
  const validation = validateCadDocument(document);
  if (!validation.valid) throw new Error(validation.errors[0]);
  return document;
}

export function exportCadDocumentJson(document: CadDocument): string {
  const validation = validateCadDocument(document);
  if (!validation.valid) throw new Error(validation.errors[0]);
  return JSON.stringify(canonicalJsonValue(document), null, 2);
}
