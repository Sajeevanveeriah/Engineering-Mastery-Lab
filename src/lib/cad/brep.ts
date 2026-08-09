import type { AnyShape, Drawing, Face, Shape3D, Sketch } from "replicad";

export const BREP_SCHEMA_VERSION = 1 as const;
export const BREP_WORKER_TIMEOUT_MS = 60_000;
export const BREP_WASM_BASENAME = "replicad_single.wasm" as const;
export const BREP_CAPABILITIES = {
  planarFaceSketches: "top-planar-z-only",
  stableEdgeSelection: false,
  stepImportRepresentation: "tessellated-preview"
} as const;

export type BrepPlane = "XY" | "XZ" | "YZ";
export type Point2 = readonly [number, number];
export type Point3 = readonly [number, number, number];
export type BrepSketchSupport =
  | { kind: "datum-plane" }
  | { kind: "planar-face"; targetId: string; selector: "top-planar-z" };

interface SketchEntityBase {
  id: string;
  construction?: boolean;
}

export type BrepSketchEntity =
  | (SketchEntityBase & { kind: "line"; start: Point2; end: Point2 })
  | (SketchEntityBase & { kind: "polyline"; points: readonly Point2[]; closed: boolean })
  | (SketchEntityBase & {
      kind: "rectangle";
      origin: Point2;
      width: number;
      height: number;
    })
  | (SketchEntityBase & { kind: "circle"; centre: Point2; radius: number })
  | (SketchEntityBase & {
      kind: "arc";
      start: Point2;
      via: Point2;
      end: Point2;
      closed: boolean;
    });

interface BrepFeatureBase {
  id: string;
  name: string;
  suppressed?: boolean;
}

export type BrepFeature =
  | (BrepFeatureBase & { kind: "box"; width: number; depth: number; height: number })
  | (BrepFeatureBase & { kind: "cylinder"; radius: number; height: number })
  | (BrepFeatureBase & { kind: "sphere"; radius: number })
  | (BrepFeatureBase & {
      kind: "sketch";
      plane: BrepPlane;
      offset: number;
      support?: BrepSketchSupport;
      entities: readonly BrepSketchEntity[];
    })
  | (BrepFeatureBase & {
      kind: "pad" | "extrude";
      sketchId: string;
      length: number;
      direction?: "positive" | "negative";
    })
  | (BrepFeatureBase & {
      kind: "pocket";
      targetId: string;
      sketchId: string;
      depth: number;
      direction?: "positive" | "negative";
    })
  | (BrepFeatureBase & {
      kind: "revolve";
      sketchId: string;
      axis: Point3;
      origin: Point3;
      angleDegrees: number;
    })
  | (BrepFeatureBase & {
      kind: "boolean";
      operation: "union" | "subtract" | "intersect";
      targetId: string;
      toolId: string;
    })
  | (BrepFeatureBase & {
      kind: "fillet" | "chamfer";
      targetId: string;
      radius: number;
    });

export interface BrepDocument {
  schemaVersion: typeof BREP_SCHEMA_VERSION;
  units: "mm";
  features: readonly BrepFeature[];
  bodies: readonly BrepBody[];
}

export interface BrepBody {
  id: string;
  name: string;
  sourceFeatureId: string;
  visible: boolean;
}

export interface BrepBodyResult extends BrepBody {
  status: "resolved" | "dangling";
  resolvedFeatureId?: string;
}

export type BrepErrorCode =
  | "CANCELLED"
  | "DOCUMENT_INVALID"
  | "EXPORT_FAILED"
  | "FEATURE_FAILED"
  | "IMPORT_FAILED"
  | "INITIALISATION_FAILED"
  | "TIMEOUT"
  | "UNSUPPORTED_FEATURE"
  | "UNSUPPORTED_FORMAT"
  | "WORKER_FAILED";

export interface BrepError {
  code: BrepErrorCode;
  message: string;
  featureId?: string;
  recoverable: boolean;
  recovery?: "none" | "replace-worker" | "retry-job";
}

export class BrepWorkerJobError extends Error {
  readonly detail: BrepError;

  constructor(detail: BrepError) {
    super(detail.message);
    this.name = "BrepWorkerJobError";
    this.detail = detail;
  }
}

export interface BrepFeatureResult {
  featureId: string;
  status: "built" | "rolled-back" | "sketched" | "suppressed";
  message?: string;
  operationScope?: "all-edges";
}

export interface BrepMeshPayload {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  edgePositions: Float32Array;
  faceGroups: Uint32Array;
  edgeGroups: Uint32Array;
  bounds: { min: Point3; max: Point3 };
}

export interface BrepEvaluation {
  ok: boolean;
  outputBodyId?: string;
  outputFeatureId?: string;
  mesh?: BrepMeshPayload;
  bodies: BrepBodyResult[];
  features: BrepFeatureResult[];
  errors: BrepError[];
  failedFeatureIds: string[];
  rolledBackFeatureIds: string[];
  constructionEntityCount: number;
}

export type BrepExportFormat = "stl-binary" | "stl-ascii" | "step";
export type BrepImportFormat = "step" | "iges" | "brep";

export interface BrepBinaryResult {
  ok: boolean;
  format: BrepExportFormat;
  bytes?: ArrayBuffer;
  mediaType?: string;
  error?: BrepError;
}

export interface BrepStepImportMetadata {
  representation: "tessellated-preview";
  assumedUnits: "mm";
  unitsStatus: "assumed-not-verified";
  hierarchyPreserved: false;
  editableFeaturesPreserved: false;
  exactBrepExposed: false;
  losses: readonly [
    "assembly hierarchy is not exposed",
    "source units are not verified",
    "parametric features are not reconstructed",
    "the imported OCCT shape is returned only as tessellated display data"
  ];
  notice: string;
}

export type BrepImportResult =
  | { ok: true; format: "step"; mesh: BrepMeshPayload; metadata: BrepStepImportMetadata }
  | { ok: false; format: BrepImportFormat; error: BrepError };

export interface BrepRuntime {
  evaluate(document: BrepDocument, signal?: AbortSignal): Promise<BrepEvaluation>;
  export(document: BrepDocument, format: BrepExportFormat, signal?: AbortSignal): Promise<BrepBinaryResult>;
  import(format: BrepImportFormat, bytes: ArrayBuffer, signal?: AbortSignal): Promise<BrepImportResult>;
}

type ReplicadModule = typeof import("replicad");
type OcFactory = (options?: {
  locateFile?: (path: string) => string;
  wasmBinary?: Uint8Array;
}) => Promise<Parameters<ReplicadModule["setOC"]>[0]>;

export interface BrepRuntimeOptions {
  wasmBinary?: ArrayBuffer;
  wasmUrl?: string;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

class BrepDocumentValidationError extends Error {
  readonly code: "DOCUMENT_INVALID" | "UNSUPPORTED_FEATURE";

  constructor(message: string, code: "DOCUMENT_INVALID" | "UNSUPPORTED_FEATURE" = "DOCUMENT_INVALID") {
    super(message);
    this.name = "BrepDocumentValidationError";
    this.code = code;
  }
}

type UnknownRecord = Record<string, unknown>;

function failDocument(message: string, code: "DOCUMENT_INVALID" | "UNSUPPORTED_FEATURE" = "DOCUMENT_INVALID"): never {
  throw new BrepDocumentValidationError(message, code);
}

function asRecord(value: unknown, label: string): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) failDocument(`${label} must be an object`);
  return value as UnknownRecord;
}

function exactKeys(record: UnknownRecord, allowed: readonly string[], required: readonly string[], label: string): void {
  const allowedSet = new Set(allowed);
  const unknown = Object.keys(record).find((key) => !allowedSet.has(key));
  if (unknown) failDocument(`${label} contains unsupported field ${unknown}`);
  const missing = required.find((key) => !(key in record));
  if (missing) failDocument(`${label} is missing required field ${missing}`);
}

function requiredString(value: unknown, label: string, maxLength = 128): string {
  if (typeof value !== "string" || value.length === 0 || value.length > maxLength) {
    failDocument(`${label} must be a non-empty string no longer than ${maxLength} characters`);
  }
  return value;
}

function optionalBoolean(value: unknown, label: string): boolean {
  if (value === undefined) return false;
  if (typeof value !== "boolean") failDocument(`${label} must be a boolean when supplied`);
  return value;
}

function finiteCoordinate(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > 100_000) {
    failDocument(`${label} must be finite and within +/-100000 mm`);
  }
  return value;
}

function dimension(value: unknown, label: string, requirePositive: boolean): number {
  const numeric = finiteCoordinate(value, label);
  if (requirePositive && numeric <= 0) failDocument(`${label} must be positive`);
  return numeric;
}

function point2(value: unknown, label: string): Point2 {
  if (!Array.isArray(value) || value.length !== 2) failDocument(`${label} must be an exact two-coordinate array`);
  return [finiteCoordinate(value[0], `${label}.x`), finiteCoordinate(value[1], `${label}.y`)];
}

function point3(value: unknown, label: string): Point3 {
  if (!Array.isArray(value) || value.length !== 3) failDocument(`${label} must be an exact three-coordinate array`);
  return [
    finiteCoordinate(value[0], `${label}.x`),
    finiteCoordinate(value[1], `${label}.y`),
    finiteCoordinate(value[2], `${label}.z`)
  ];
}

function priorReference(value: unknown, label: string, available: Set<string>): string {
  const reference = requiredString(value, label);
  if (!available.has(reference)) {
    failDocument(`${label} must reference an earlier active feature of the required type; missing, forward and cyclic references are rejected`);
  }
  return reference;
}

function validateSketchEntities(value: unknown, sketchId: string): void {
  if (!Array.isArray(value) || value.length === 0 || value.length > 1_000) {
    failDocument(`Sketch ${sketchId} must contain between 1 and 1000 entities`);
  }
  const ids = new Set<string>();
  for (const [index, rawEntity] of value.entries()) {
    const entity = asRecord(rawEntity, `Sketch ${sketchId} entity ${index}`);
    const kind = requiredString(entity.kind, `Sketch ${sketchId} entity ${index}.kind`, 32);
    const commonAllowed = ["id", "kind", "construction"];
    const id = requiredString(entity.id, `Sketch ${sketchId} entity ${index}.id`);
    if (ids.has(id)) failDocument(`Sketch ${sketchId} has duplicate entity ID ${id}`);
    ids.add(id);
    optionalBoolean(entity.construction, `${id}.construction`);
    switch (kind) {
      case "line":
        exactKeys(entity, [...commonAllowed, "start", "end"], ["id", "kind", "start", "end"], `Entity ${id}`);
        point2(entity.start, `${id}.start`);
        point2(entity.end, `${id}.end`);
        break;
      case "polyline": {
        exactKeys(entity, [...commonAllowed, "points", "closed"], ["id", "kind", "points", "closed"], `Entity ${id}`);
        if (!Array.isArray(entity.points) || entity.points.length < 2 || entity.points.length > 10_000) {
          failDocument(`${id}.points must contain between 2 and 10000 exact two-coordinate arrays`);
        }
        entity.points.forEach((point, pointIndex) => point2(point, `${id}.points[${pointIndex}]`));
        if (typeof entity.closed !== "boolean") failDocument(`${id}.closed must be a boolean`);
        break;
      }
      case "rectangle":
        exactKeys(entity, [...commonAllowed, "origin", "width", "height"], ["id", "kind", "origin", "width", "height"], `Entity ${id}`);
        point2(entity.origin, `${id}.origin`);
        dimension(entity.width, `${id}.width`, true);
        dimension(entity.height, `${id}.height`, true);
        break;
      case "circle":
        exactKeys(entity, [...commonAllowed, "centre", "radius"], ["id", "kind", "centre", "radius"], `Entity ${id}`);
        point2(entity.centre, `${id}.centre`);
        dimension(entity.radius, `${id}.radius`, true);
        break;
      case "arc":
        exactKeys(entity, [...commonAllowed, "start", "via", "end", "closed"], ["id", "kind", "start", "via", "end", "closed"], `Entity ${id}`);
        point2(entity.start, `${id}.start`);
        point2(entity.via, `${id}.via`);
        point2(entity.end, `${id}.end`);
        if (typeof entity.closed !== "boolean") failDocument(`${id}.closed must be a boolean`);
        break;
      default:
        failDocument(`Sketch ${sketchId} contains unsupported entity kind ${kind}`);
    }
  }
}

function assertBrepDocument(value: unknown): asserts value is BrepDocument {
  const document = asRecord(value, "B-rep document");
  exactKeys(document, ["schemaVersion", "units", "features", "bodies"], ["schemaVersion", "units", "features", "bodies"], "B-rep document");
  if (document.schemaVersion !== BREP_SCHEMA_VERSION || document.units !== "mm") {
    failDocument("B-rep document must use schema version 1 and millimetres");
  }
  if (!Array.isArray(document.features) || document.features.length === 0 || document.features.length > 500) {
    failDocument("B-rep document must contain between 1 and 500 features");
  }

  const allIds = new Set<string>();
  const activeShapes = new Set<string>();
  const activeSketches = new Set<string>();
  const activeSketchSupports = new Map<string, "datum-plane" | "planar-face">();
  for (const [index, rawFeature] of document.features.entries()) {
    const feature = asRecord(rawFeature, `Feature ${index}`);
    const kind = requiredString(feature.kind, `Feature ${index}.kind`, 32);
    const id = requiredString(feature.id, `Feature ${index}.id`);
    requiredString(feature.name, `Feature ${id}.name`, 160);
    if (allIds.has(id)) failDocument(`Feature ID ${id} is duplicated`);
    allIds.add(id);
    const suppressed = optionalBoolean(feature.suppressed, `${id}.suppressed`);
    const common = ["id", "name", "kind", "suppressed"];
    switch (kind) {
      case "box":
        exactKeys(feature, [...common, "width", "depth", "height"], ["id", "name", "kind", "width", "depth", "height"], `Feature ${id}`);
        dimension(feature.width, `${id}.width`, !suppressed);
        dimension(feature.depth, `${id}.depth`, !suppressed);
        dimension(feature.height, `${id}.height`, !suppressed);
        if (!suppressed) activeShapes.add(id);
        break;
      case "cylinder":
        exactKeys(feature, [...common, "radius", "height"], ["id", "name", "kind", "radius", "height"], `Feature ${id}`);
        dimension(feature.radius, `${id}.radius`, !suppressed);
        dimension(feature.height, `${id}.height`, !suppressed);
        if (!suppressed) activeShapes.add(id);
        break;
      case "sphere":
        exactKeys(feature, [...common, "radius"], ["id", "name", "kind", "radius"], `Feature ${id}`);
        dimension(feature.radius, `${id}.radius`, !suppressed);
        if (!suppressed) activeShapes.add(id);
        break;
      case "sketch": {
        exactKeys(feature, [...common, "plane", "offset", "support", "entities"], ["id", "name", "kind", "plane", "offset", "entities"], `Feature ${id}`);
        if (feature.plane !== "XY" && feature.plane !== "XZ" && feature.plane !== "YZ") failDocument(`${id}.plane is unsupported`);
        finiteCoordinate(feature.offset, `${id}.offset`);
        validateSketchEntities(feature.entities, id);
        if (feature.support !== undefined) {
          const support = asRecord(feature.support, `${id}.support`);
          const supportKind = requiredString(support.kind, `${id}.support.kind`, 32);
          if (supportKind === "datum-plane") {
            exactKeys(support, ["kind"], ["kind"], `${id}.support`);
          } else if (supportKind === "planar-face") {
            exactKeys(support, ["kind", "targetId", "selector"], ["kind", "targetId", "selector"], `${id}.support`);
            if (feature.plane !== "XY" || feature.offset !== 0) {
              failDocument("The bounded planar-face attachment requires plane XY and offset 0; other attached orientations and offsets are unsupported", "UNSUPPORTED_FEATURE");
            }
            priorReference(support.targetId, `${id}.support.targetId`, activeShapes);
            if (support.selector !== "top-planar-z") {
              failDocument("Only the deterministic top-planar-z face selector is supported; persistent topological naming is not implemented", "UNSUPPORTED_FEATURE");
            }
          } else {
            failDocument(`${id}.support kind ${supportKind} is unsupported`, "UNSUPPORTED_FEATURE");
          }
        }
        if (!suppressed) {
          activeSketches.add(id);
          activeSketchSupports.set(id, feature.support && asRecord(feature.support, `${id}.support`).kind === "planar-face" ? "planar-face" : "datum-plane");
        }
        break;
      }
      case "pad":
      case "extrude":
        exactKeys(feature, [...common, "sketchId", "length", "direction"], ["id", "name", "kind", "sketchId", "length"], `Feature ${id}`);
        priorReference(feature.sketchId, `${id}.sketchId`, activeSketches);
        dimension(feature.length, `${id}.length`, !suppressed);
        if (feature.direction !== undefined && feature.direction !== "positive" && feature.direction !== "negative") failDocument(`${id}.direction is invalid`);
        if (!suppressed) activeShapes.add(id);
        break;
      case "pocket":
        exactKeys(feature, [...common, "targetId", "sketchId", "depth", "direction"], ["id", "name", "kind", "targetId", "sketchId", "depth"], `Feature ${id}`);
        priorReference(feature.targetId, `${id}.targetId`, activeShapes);
        priorReference(feature.sketchId, `${id}.sketchId`, activeSketches);
        dimension(feature.depth, `${id}.depth`, !suppressed);
        if (feature.direction !== undefined && feature.direction !== "positive" && feature.direction !== "negative") failDocument(`${id}.direction is invalid`);
        if (!suppressed) activeShapes.add(id);
        break;
      case "revolve": {
        exactKeys(feature, [...common, "sketchId", "axis", "origin", "angleDegrees"], ["id", "name", "kind", "sketchId", "axis", "origin", "angleDegrees"], `Feature ${id}`);
        const sketchId = priorReference(feature.sketchId, `${id}.sketchId`, activeSketches);
        if (activeSketchSupports.get(sketchId) === "planar-face") {
          failDocument("Revolve from an attached planar-face sketch is unsupported", "UNSUPPORTED_FEATURE");
        }
        const axis = point3(feature.axis, `${id}.axis`);
        point3(feature.origin, `${id}.origin`);
        if (axis.every((coordinate) => coordinate === 0)) failDocument(`${id}.axis cannot be zero`);
        const angle = finiteCoordinate(feature.angleDegrees, `${id}.angleDegrees`);
        if (!suppressed && (angle <= 0 || angle > 360)) failDocument(`${id}.angleDegrees must be within (0, 360] degrees`);
        if (!suppressed) activeShapes.add(id);
        break;
      }
      case "boolean":
        exactKeys(feature, [...common, "operation", "targetId", "toolId"], ["id", "name", "kind", "operation", "targetId", "toolId"], `Feature ${id}`);
        if (feature.operation !== "union" && feature.operation !== "subtract" && feature.operation !== "intersect") failDocument(`${id}.operation is invalid`);
        priorReference(feature.targetId, `${id}.targetId`, activeShapes);
        priorReference(feature.toolId, `${id}.toolId`, activeShapes);
        if (!suppressed) activeShapes.add(id);
        break;
      case "fillet":
      case "chamfer":
        exactKeys(feature, [...common, "targetId", "radius"], ["id", "name", "kind", "targetId", "radius"], `Feature ${id}`);
        priorReference(feature.targetId, `${id}.targetId`, activeShapes);
        dimension(feature.radius, `${id}.radius`, !suppressed);
        if (!suppressed) activeShapes.add(id);
        break;
      default:
        failDocument(`Feature ${id} has unsupported kind ${kind}`);
    }
  }

  if (!Array.isArray(document.bodies) || document.bodies.length !== 1) {
    failDocument("The current B-rep slice requires exactly one explicit body; ambiguous multi-body documents are rejected");
  }
  const bodyIds = new Set<string>();
  let visibleBodies = 0;
  for (const [index, rawBody] of document.bodies.entries()) {
    const body = asRecord(rawBody, `Body ${index}`);
    exactKeys(body, ["id", "name", "sourceFeatureId", "visible"], ["id", "name", "sourceFeatureId", "visible"], `Body ${index}`);
    const bodyId = requiredString(body.id, `Body ${index}.id`);
    if (bodyIds.has(bodyId)) failDocument(`Body ID ${bodyId} is duplicated`);
    bodyIds.add(bodyId);
    requiredString(body.name, `Body ${bodyId}.name`, 160);
    priorReference(body.sourceFeatureId, `Body ${bodyId}.sourceFeatureId`, activeShapes);
    if (typeof body.visible !== "boolean") failDocument(`Body ${bodyId}.visible must be a boolean`);
    if (body.visible) visibleBodies += 1;
  }
  if (visibleBodies !== 1) failDocument("The current B-rep slice requires its single output body to be visible");
}

export function validateBrepDocument(value: unknown): BrepError | null {
  try {
    assertBrepDocument(value);
    return null;
  } catch (error) {
    const validation = error instanceof BrepDocumentValidationError ? error : new BrepDocumentValidationError(messageOf(error));
    return { code: validation.code, message: validation.message, recoverable: false, recovery: "none" };
  }
}

export type BrepBodyReconciliationResult =
  | {
      ok: true;
      document: BrepDocument;
      changed: boolean;
      reason: "preserved" | "last-built" | "last-declared";
    }
  | { ok: false; error: BrepError };

function featureDeclaresShape(feature: BrepFeature): boolean {
  return feature.kind !== "sketch";
}

export function reconcileBrepOutputBody(
  document: BrepDocument,
  evaluation?: BrepEvaluation
): BrepBodyReconciliationResult {
  if (!Array.isArray(document.bodies) || document.bodies.length > 1) {
    return {
      ok: false,
      error: {
        code: "DOCUMENT_INVALID",
        message: "Body reconciliation requires zero or one body; ambiguous multi-body state is rejected",
        recoverable: false,
        recovery: "none"
      }
    };
  }
  const failed = new Set(evaluation?.failedFeatureIds ?? []);
  const eligible = document.features.filter(
    (feature) => featureDeclaresShape(feature) && !feature.suppressed && !failed.has(feature.id)
  );
  const existing = document.bodies[0];
  const accountedEvaluationIds = new Set([
    ...(evaluation?.features.map((feature) => feature.featureId) ?? []),
    ...(evaluation?.failedFeatureIds ?? [])
  ]);
  const currentIndexes = new Map(document.features.map((feature, index) => [feature.id, index]));
  const evaluationResultIndexes = evaluation?.features.map((feature) => currentIndexes.get(feature.featureId) ?? -1) ?? [];
  const evaluationMatchesDocument = Boolean(evaluation)
    && accountedEvaluationIds.size === document.features.length
    && document.features.every((feature) => accountedEvaluationIds.has(feature.id))
    && evaluationResultIndexes.every((index, position) => index >= 0 && (position === 0 || index > evaluationResultIndexes[position - 1]));
  const evaluatedFeature = evaluation?.outputFeatureId;
  const evaluatedEligible = evaluationMatchesDocument && evaluatedFeature && eligible.some((feature) => feature.id === evaluatedFeature);
  const lastDeclaredFeature = eligible.at(-1)?.id;
  const sourceFeatureId = evaluatedEligible
    ? evaluatedFeature
    : lastDeclaredFeature;
  if (!sourceFeatureId) {
    return {
      ok: false,
      error: {
        code: "DOCUMENT_INVALID",
        message: "No active successfully built or declared shape feature is available for the output body",
        recoverable: false,
        recovery: "none"
      }
    };
  }
  const body: BrepBody = {
    id: existing?.id || "body-main",
    name: existing?.name || "Main body",
    sourceFeatureId,
    visible: true
  };
  const changed = !existing || existing.sourceFeatureId !== body.sourceFeatureId || !existing.visible;
  const existingPreserved = existing?.sourceFeatureId === sourceFeatureId;
  return {
    ok: true,
    document: { ...document, bodies: [body] },
    changed,
    reason: evaluatedEligible ? "last-built" : existingPreserved ? "preserved" : "last-declared"
  };
}

function planeName(plane: BrepPlane): "XY" | "XZ" | "YZ" {
  return plane;
}

function buildEntitySketch(
  r: ReplicadModule,
  feature: Extract<BrepFeature, { kind: "sketch" }>,
  entity: BrepSketchEntity
): Sketch {
  const plane = planeName(feature.plane);
  if (entity.kind === "rectangle") {
    return new r.Sketcher(plane, feature.offset)
      .movePointerTo([...entity.origin])
      .hLine(entity.width)
      .vLine(entity.height)
      .hLine(-entity.width)
      .close();
  }
  if (entity.kind === "circle") {
    return r.sketchCircle(entity.radius, {
      plane,
      origin: planeOrigin(feature.plane, entity.centre, feature.offset)
    });
  }
  const sketcher = new r.Sketcher(plane, feature.offset);
  if (entity.kind === "line") {
    sketcher.movePointerTo([...entity.start]).lineTo([...entity.end]);
    return sketcher.done();
  }
  if (entity.kind === "polyline") {
    sketcher.movePointerTo([...entity.points[0]]);
    entity.points.slice(1).forEach((point) => sketcher.lineTo([...point]));
    return entity.closed ? sketcher.close() : sketcher.done();
  }
  sketcher.movePointerTo([...entity.start]).threePointsArcTo([...entity.end], [...entity.via]);
  return entity.closed ? sketcher.lineTo([...entity.start]).done() : sketcher.done();
}

function planeOrigin(plane: BrepPlane, point: Point2, offset: number): [number, number, number] {
  if (plane === "XY") return [point[0], point[1], offset];
  if (plane === "XZ") return [point[0], -offset, point[1]];
  return [offset, point[0], point[1]];
}

function samePoint(first: Point2, second: Point2): boolean {
  return Math.abs(first[0] - second[0]) <= 1e-9 && Math.abs(first[1] - second[1]) <= 1e-9;
}

function buildConnectedProfile(
  r: ReplicadModule,
  feature: Extract<BrepFeature, { kind: "sketch" }>,
  entities: readonly BrepSketchEntity[]
): Sketch {
  if (entities.some((entity) => entity.kind === "rectangle" || entity.kind === "circle" || (entity.kind !== "line" && entity.closed))) {
    throw new Error(`Sketch ${feature.id} contains more than one bounded profile; multi-profile holes and islands are unsupported`);
  }
  const pathEntities = entities as readonly Extract<BrepSketchEntity, { kind: "line" | "polyline" | "arc" }>[];
  const firstEntity = pathEntities[0];
  const firstPoint = firstEntity.kind === "polyline" ? firstEntity.points[0] : firstEntity.start;
  const sketcher = new r.Sketcher(planeName(feature.plane), feature.offset).movePointerTo([...firstPoint]);
  let current = firstPoint;
  for (const entity of pathEntities) {
    const start = entity.kind === "polyline" ? entity.points[0] : entity.start;
    if (!samePoint(current, start)) throw new Error(`Sketch ${feature.id} has a disconnected profile at entity ${entity.id}`);
    if (entity.kind === "line") {
      sketcher.lineTo([...entity.end]);
      current = entity.end;
    } else if (entity.kind === "polyline") {
      entity.points.slice(1).forEach((point) => sketcher.lineTo([...point]));
      current = entity.points.at(-1) as Point2;
    } else {
      sketcher.threePointsArcTo([...entity.end], [...entity.via]);
      current = entity.end;
    }
  }
  if (!samePoint(current, firstPoint)) throw new Error(`Sketch ${feature.id} is open and cannot produce a bounded solid profile`);
  return sketcher.done();
}

function boundedProfileEntities(feature: Extract<BrepFeature, { kind: "sketch" }>): readonly BrepSketchEntity[] {
  const entities = feature.entities.filter((entity) => !entity.construction);
  if (entities.length === 0) throw new Error(`Sketch ${feature.id} contains construction geometry only`);
  return entities;
}

function buildDatumProfile(r: ReplicadModule, feature: Extract<BrepFeature, { kind: "sketch" }>): Sketch {
  const entities = boundedProfileEntities(feature);
  if (entities.length === 1) {
    const entity = entities[0];
    if (entity.kind === "line" || (entity.kind === "polyline" && !entity.closed) || (entity.kind === "arc" && !entity.closed)) {
      throw new Error(`Sketch ${feature.id} is open and cannot produce a bounded solid profile`);
    }
    return buildEntitySketch(r, feature, entity);
  }
  return buildConnectedProfile(r, feature, entities);
}

function buildDrawingProfile(r: ReplicadModule, feature: Extract<BrepFeature, { kind: "sketch" }>): Drawing {
  const entities = boundedProfileEntities(feature);
  if (entities.length === 1) {
    const entity = entities[0];
    if (entity.kind === "line" || (entity.kind === "polyline" && !entity.closed) || (entity.kind === "arc" && !entity.closed)) {
      throw new Error(`Sketch ${feature.id} is open and cannot produce a bounded solid profile`);
    }
    if (entity.kind === "rectangle") {
      return r.draw([...entity.origin]).hLine(entity.width).vLine(entity.height).hLine(-entity.width).close();
    }
    if (entity.kind === "circle") return r.drawCircle(entity.radius).translate([...entity.centre]);
    const start = entity.kind === "polyline" ? entity.points[0] : entity.start;
    const pen = r.draw([...start]);
    if (entity.kind === "polyline") entity.points.slice(1).forEach((point) => pen.lineTo([...point]));
    else pen.threePointsArcTo([...entity.end], [...entity.via]).lineTo([...entity.start]);
    return pen.done();
  }
  if (entities.some((entity) => entity.kind === "rectangle" || entity.kind === "circle" || (entity.kind !== "line" && entity.closed))) {
    throw new Error(`Sketch ${feature.id} contains more than one bounded profile; multi-profile holes and islands are unsupported`);
  }
  const pathEntities = entities as readonly Extract<BrepSketchEntity, { kind: "line" | "polyline" | "arc" }>[];
  const first = pathEntities[0];
  const firstPoint = first.kind === "polyline" ? first.points[0] : first.start;
  const pen = r.draw([...firstPoint]);
  let current = firstPoint;
  for (const entity of pathEntities) {
    const start = entity.kind === "polyline" ? entity.points[0] : entity.start;
    if (!samePoint(current, start)) throw new Error(`Sketch ${feature.id} has a disconnected profile at entity ${entity.id}`);
    if (entity.kind === "line") {
      pen.lineTo([...entity.end]);
      current = entity.end;
    } else if (entity.kind === "polyline") {
      entity.points.slice(1).forEach((point) => pen.lineTo([...point]));
      current = entity.points.at(-1) as Point2;
    } else {
      pen.threePointsArcTo([...entity.end], [...entity.via]);
      current = entity.end;
    }
  }
  if (!samePoint(current, firstPoint)) throw new Error(`Sketch ${feature.id} is open and cannot produce a bounded solid profile`);
  return pen.done();
}

function selectTopPlanarZFace(target: Shape3D, featureId: string): { face: Face; cleanup: () => void } {
  const faces = target.faces;
  const candidates: { face: Face; z: number }[] = [];
  for (const face of faces) {
    if (face.geomType !== "PLANE") continue;
    const centre = face.center;
    const normal = face.normalAt(centre);
    const z = centre.z;
    const positiveZ = normal.z > 0.999;
    centre.delete();
    normal.delete();
    if (positiveZ) candidates.push({ face, z });
  }
  if (candidates.length === 0) {
    faces.forEach((face) => face.delete());
    throw new Error(`Sketch ${featureId} top-planar-z attachment is dangling because its target has no positive-Z planar face`);
  }
  const highestZ = Math.max(...candidates.map((candidate) => candidate.z));
  const highest = candidates.filter((candidate) => Math.abs(candidate.z - highestZ) <= 1e-7);
  if (highest.length !== 1) {
    faces.forEach((face) => face.delete());
    throw new Error(`Sketch ${featureId} top-planar-z attachment is ambiguous because ${highest.length} coplanar faces share the highest Z position`);
  }
  return { face: highest[0].face, cleanup: () => faces.forEach((face) => face.delete()) };
}

interface BuiltProfile {
  sketch: Sketch;
  cleanup: () => void;
}

function buildProfile(
  r: ReplicadModule,
  feature: Extract<BrepFeature, { kind: "sketch" }>,
  shapes: ReadonlyMap<string, Shape3D>
): BuiltProfile {
  if (feature.support?.kind !== "planar-face") return { sketch: buildDatumProfile(r, feature), cleanup: () => undefined };
  const target = shapes.get(feature.support.targetId);
  if (!target) throw new Error(`Sketch ${feature.id} planar-face target ${feature.support.targetId} is dangling`);
  const selection = selectTopPlanarZFace(target, feature.id);
  try {
    const drawing = buildDrawingProfile(r, feature);
    return { sketch: drawing.sketchOnFace(selection.face, "original") as Sketch, cleanup: selection.cleanup };
  } catch (error) {
    selection.cleanup();
    throw error;
  }
}

function toMeshPayload(shape: Shape3D): BrepMeshPayload {
  const mesh = shape.mesh({ tolerance: 0.1, angularTolerance: 0.3 });
  const edges = shape.meshEdges({ tolerance: 0.1, angularTolerance: 0.3 });
  const bounds = shape.boundingBox.bounds;
  const positions = Float32Array.from(mesh.vertices);
  const normals = Float32Array.from(mesh.normals);
  const indices = Uint32Array.from(mesh.triangles);
  const edgePositions = Float32Array.from(edges.lines);
  if (positions.some((value) => !Number.isFinite(value)) || normals.some((value) => !Number.isFinite(value))) {
    throw new Error("OCCT emitted non-finite mesh coordinates");
  }
  return {
    positions,
    normals,
    indices,
    edgePositions,
    faceGroups: Uint32Array.from(mesh.faceGroups.flatMap((group) => [group.start, group.count, group.faceId])),
    edgeGroups: Uint32Array.from(edges.edgeGroups.flatMap((group) => [group.start, group.count, group.edgeId])),
    bounds: {
      min: bounds[0],
      max: bounds[1]
    }
  };
}

function ensureNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("B-rep job was cancelled", "AbortError");
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

async function evaluateWithReplicad(
  r: ReplicadModule,
  document: BrepDocument,
  signal?: AbortSignal
): Promise<{ evaluation: BrepEvaluation; shape?: Shape3D; dispose: () => void }> {
  const validationError = validateBrepDocument(document);
  if (validationError) {
    return {
      evaluation: {
        ok: false,
        bodies: [],
        features: [],
        errors: [validationError],
        failedFeatureIds: [],
        rolledBackFeatureIds: [],
        constructionEntityCount: 0
      },
      dispose: () => undefined
    };
  }
  const shapes = new Map<string, Shape3D>();
  const shapeProvenance = new Map<string, string>();
  const sketches = new Map<string, Extract<BrepFeature, { kind: "sketch" }>>();
  const results: BrepFeatureResult[] = [];
  const errors: BrepError[] = [];
  const failedFeatureIds: string[] = [];
  const rolledBackFeatureIds: string[] = [];
  let constructionEntityCount = 0;
  const dispose = () => {
    for (const shape of new Set(shapes.values())) shape.delete();
    shapes.clear();
  };

  for (const feature of document.features) {
    if (signal?.aborted) dispose();
    ensureNotAborted(signal);
    if (feature.suppressed) {
      results.push({ featureId: feature.id, status: "suppressed" });
      continue;
    }
    if (feature.kind === "sketch") {
      sketches.set(feature.id, feature);
      constructionEntityCount += feature.entities.filter((entity) => entity.construction).length;
      results.push({ featureId: feature.id, status: "sketched" });
      continue;
    }
    let rollbackShape: Shape3D | undefined;
    if ("targetId" in feature) rollbackShape = shapes.get(feature.targetId);
    try {
      let shape: Shape3D;
      switch (feature.kind) {
        case "box":
          shape = r.makeBox([0, 0, 0], [feature.width, feature.depth, feature.height]);
          break;
        case "cylinder":
          shape = r.makeCylinder(feature.radius, feature.height);
          break;
        case "sphere":
          shape = r.makeSphere(feature.radius);
          break;
        case "pad":
        case "extrude": {
          const sketch = sketches.get(feature.sketchId);
          if (!sketch) throw new Error(`Sketch ${feature.sketchId} is unavailable`);
          const distance = feature.direction === "negative" ? -feature.length : feature.length;
          const profile = buildProfile(r, sketch, shapes);
          try {
            shape = profile.sketch.extrude(distance);
          } finally {
            profile.cleanup();
          }
          break;
        }
        case "pocket": {
          const target = shapes.get(feature.targetId);
          const sketch = sketches.get(feature.sketchId);
          if (!target || !sketch) throw new Error("Pocket target or sketch is unavailable");
          const distance = feature.direction === "positive" ? feature.depth : -feature.depth;
          const profile = buildProfile(r, sketch, shapes);
          let cutter: Shape3D | undefined;
          try {
            cutter = profile.sketch.extrude(distance);
            shape = target.cut(cutter);
          } finally {
            cutter?.delete();
            profile.cleanup();
          }
          break;
        }
        case "revolve": {
          const sketch = sketches.get(feature.sketchId);
          if (!sketch) throw new Error(`Sketch ${feature.sketchId} is unavailable`);
          const profile = buildProfile(r, sketch, shapes);
          try {
            shape = profile.sketch.revolve([...feature.axis], {
              origin: [...feature.origin],
              angle: feature.angleDegrees
            });
          } finally {
            profile.cleanup();
          }
          break;
        }
        case "boolean": {
          const target = shapes.get(feature.targetId);
          const tool = shapes.get(feature.toolId);
          if (!target || !tool) throw new Error("Boolean target or tool is unavailable");
          shape = feature.operation === "union" ? target.fuse(tool) : feature.operation === "subtract" ? target.cut(tool) : target.intersect(tool);
          break;
        }
        case "fillet": {
          const target = shapes.get(feature.targetId);
          if (!target) throw new Error(`Fillet target ${feature.targetId} is unavailable`);
          shape = target.fillet(feature.radius);
          break;
        }
        case "chamfer": {
          const target = shapes.get(feature.targetId);
          if (!target) throw new Error(`Chamfer target ${feature.targetId} is unavailable`);
          shape = target.chamfer(feature.radius);
          break;
        }
      }
      shapes.set(feature.id, shape);
      shapeProvenance.set(feature.id, feature.id);
      results.push({
        featureId: feature.id,
        status: "built",
        ...((feature.kind === "fillet" || feature.kind === "chamfer") ? { operationScope: "all-edges" as const } : {})
      });
    } catch (error) {
      if (isAbort(error)) throw error;
      const failure: BrepError = {
        code: "FEATURE_FAILED",
        message: messageOf(error),
        featureId: feature.id,
        recoverable: Boolean(rollbackShape),
        recovery: rollbackShape ? "retry-job" : "none"
      };
      errors.push(failure);
      failedFeatureIds.push(feature.id);
      const preserved = rollbackShape;
      if (preserved) {
        shapes.set(feature.id, preserved);
        const actualFeatureId = "targetId" in feature ? shapeProvenance.get(feature.targetId) : undefined;
        if (actualFeatureId) shapeProvenance.set(feature.id, actualFeatureId);
        rolledBackFeatureIds.push(feature.id);
        results.push({
          featureId: feature.id,
          status: "rolled-back",
          message: failure.message,
          ...((feature.kind === "fillet" || feature.kind === "chamfer") ? { operationScope: "all-edges" as const } : {})
        });
      }
    }
  }
  if (signal?.aborted) dispose();
  ensureNotAborted(signal);
  const bodies: BrepBodyResult[] = document.bodies.map((body) => {
    const resolvedFeatureId = shapeProvenance.get(body.sourceFeatureId);
    return {
      ...body,
      status: resolvedFeatureId ? "resolved" as const : "dangling" as const,
      ...(resolvedFeatureId ? { resolvedFeatureId } : {})
    };
  });
  const outputBody = document.bodies.find((body) => body.visible) as BrepBody;
  const outputShape = shapes.get(outputBody.sourceFeatureId);
  const outputFeatureId = shapeProvenance.get(outputBody.sourceFeatureId);
  if (!outputShape || !outputFeatureId) {
    errors.push({
      code: "FEATURE_FAILED",
      message: `Visible body ${outputBody.id} is dangling because feature ${outputBody.sourceFeatureId} did not produce a valid or rolled-back shape`,
      featureId: outputBody.sourceFeatureId,
      recoverable: false,
      recovery: "none"
    });
    return {
      evaluation: {
        ok: false,
        outputBodyId: outputBody.id,
        bodies,
        features: results,
        errors,
        failedFeatureIds,
        rolledBackFeatureIds,
        constructionEntityCount
      },
      dispose
    };
  }
  try {
    return {
      shape: outputShape,
      evaluation: {
        ok: true,
        outputBodyId: outputBody.id,
        outputFeatureId,
        mesh: toMeshPayload(outputShape),
        bodies,
        features: results,
        errors,
        failedFeatureIds,
        rolledBackFeatureIds,
        constructionEntityCount
      },
      dispose
    };
  } catch (error) {
    errors.push({ code: "FEATURE_FAILED", message: messageOf(error), recoverable: false });
    return {
      evaluation: {
        ok: false,
        outputBodyId: outputBody.id,
        outputFeatureId,
        bodies,
        features: results,
        errors,
        failedFeatureIds,
        rolledBackFeatureIds,
        constructionEntityCount
      },
      dispose
    };
  }
}

export async function createBrepRuntime(options: BrepRuntimeOptions = {}): Promise<BrepRuntime> {
  const [ocPackage, r] = await Promise.all([import("replicad-opencascadejs"), import("replicad")]);
  const factory = ocPackage.default as OcFactory;
  const oc = await factory({
    ...(options.wasmBinary ? { wasmBinary: new Uint8Array(options.wasmBinary) } : {}),
    ...(options.wasmUrl ? { locateFile: () => options.wasmUrl as string } : {})
  });
  r.setOC(oc);

  return {
    async evaluate(document, signal) {
      ensureNotAborted(signal);
      const built = await evaluateWithReplicad(r, document, signal);
      try {
        return built.evaluation;
      } finally {
        built.dispose();
      }
    },
    async export(document, format, signal) {
      let dispose: (() => void) | undefined;
      try {
        ensureNotAborted(signal);
        const built = await evaluateWithReplicad(r, document, signal);
        dispose = built.dispose;
        if (!built.shape || !built.evaluation.ok) {
          throw new Error(built.evaluation.errors.map((error) => error.message).join("; ") || "Document did not produce a shape");
        }
        if (built.evaluation.errors.length > 0) {
          throw new Error(
            `Export refused because the rebuild contains errors in features ${built.evaluation.failedFeatureIds.join(", ")}. Resolve the errors before exporting; no implicit last-valid export acknowledgement is provided.`
          );
        }
        const blob = format === "step"
          ? built.shape.blobSTEP()
          : built.shape.blobSTL({ binary: format === "stl-binary", tolerance: 0.1, angularTolerance: 0.3 });
        const bytes = await blob.arrayBuffer();
        ensureNotAborted(signal);
        return {
          ok: true,
          format,
          bytes,
          mediaType: format === "step" ? "model/step" : "model/stl"
        };
      } catch (error) {
        return {
          ok: false,
          format,
          error: { code: isAbort(error) ? "CANCELLED" : "EXPORT_FAILED", message: messageOf(error), recoverable: true }
        };
      } finally {
        dispose?.();
      }
    },
    async import(format, bytes, signal) {
      if (format !== "step") {
        return {
          ok: false,
          format,
          error: {
            code: "UNSUPPORTED_FORMAT",
            message: `${format.toUpperCase()} import is not exposed by Replicad 0.23.1; no second kernel or guessed parser was added`,
            recoverable: true
          }
        };
      }
      try {
        ensureNotAborted(signal);
        if (bytes.byteLength === 0 || bytes.byteLength > 100 * 1024 * 1024) throw new Error("STEP input must be between 1 byte and 100 MiB");
        const imported: AnyShape = await r.importSTEP(new Blob([bytes], { type: "model/step" }));
        if (!("mesh" in imported) || !("meshEdges" in imported)) throw new Error("STEP input did not produce a renderable 3D shape");
        const shape = imported as Shape3D;
        let mesh: BrepMeshPayload;
        try {
          mesh = toMeshPayload(shape);
        } finally {
          shape.delete();
        }
        ensureNotAborted(signal);
        return {
          ok: true,
          format,
          mesh,
          metadata: {
            representation: "tessellated-preview",
            assumedUnits: "mm",
            unitsStatus: "assumed-not-verified",
            hierarchyPreserved: false,
            editableFeaturesPreserved: false,
            exactBrepExposed: false,
            losses: [
              "assembly hierarchy is not exposed",
              "source units are not verified",
              "parametric features are not reconstructed",
              "the imported OCCT shape is returned only as tessellated display data"
            ],
            notice: "STEP coordinates are treated as millimetres for display only because Replicad does not expose verified source-unit metadata through this import API."
          }
        };
      } catch (error) {
        return {
          ok: false,
          format,
          error: { code: isAbort(error) ? "CANCELLED" : "IMPORT_FAILED", message: messageOf(error), recoverable: true }
        };
      }
    }
  };
}

export type BrepWorkerRequest =
  | { kind: "evaluate"; jobId: string; document: BrepDocument }
  | { kind: "export"; jobId: string; document: BrepDocument; format: BrepExportFormat }
  | { kind: "import"; jobId: string; format: BrepImportFormat; bytes: ArrayBuffer }
  | { kind: "cancel"; jobId: string };

export type BrepWorkerRequestParseResult =
  | { ok: true; request: BrepWorkerRequest }
  | { ok: false; jobId: string; error: BrepError };

export function parseBrepWorkerRequest(value: unknown): BrepWorkerRequestParseResult {
  let jobId = "invalid-request";
  try {
    const request = asRecord(value, "B-rep worker request");
    jobId = requiredString(request.jobId, "B-rep worker request.jobId");
    if (!/^[A-Za-z0-9._:-]+$/.test(jobId)) failDocument("B-rep worker request.jobId contains unsupported characters");
    const kind = requiredString(request.kind, "B-rep worker request.kind", 32);
    if (kind === "cancel") {
      exactKeys(request, ["kind", "jobId"], ["kind", "jobId"], "B-rep worker request");
      return { ok: true, request: request as unknown as Extract<BrepWorkerRequest, { kind: "cancel" }> };
    }
    if (kind === "evaluate" || kind === "export") {
      exactKeys(
        request,
        kind === "export" ? ["kind", "jobId", "document", "format"] : ["kind", "jobId", "document"],
        kind === "export" ? ["kind", "jobId", "document", "format"] : ["kind", "jobId", "document"],
        "B-rep worker request"
      );
      const documentError = validateBrepDocument(request.document);
      if (documentError) return { ok: false, jobId, error: documentError };
      if (kind === "export" && request.format !== "step" && request.format !== "stl-binary" && request.format !== "stl-ascii") {
        failDocument("B-rep export format is unsupported");
      }
      return { ok: true, request: request as unknown as BrepWorkerRequest };
    }
    if (kind === "import") {
      exactKeys(request, ["kind", "jobId", "format", "bytes"], ["kind", "jobId", "format", "bytes"], "B-rep worker request");
      if (request.format !== "step" && request.format !== "iges" && request.format !== "brep") failDocument("B-rep import format is unsupported");
      if (!(request.bytes instanceof ArrayBuffer) || request.bytes.byteLength === 0 || request.bytes.byteLength > 100 * 1024 * 1024) {
        failDocument("B-rep import bytes must be an ArrayBuffer between 1 byte and 100 MiB");
      }
      return { ok: true, request: request as unknown as Extract<BrepWorkerRequest, { kind: "import" }> };
    }
    failDocument(`B-rep worker request kind ${kind} is unsupported`);
  } catch (error) {
    const validation = error instanceof BrepDocumentValidationError ? error : new BrepDocumentValidationError(messageOf(error));
    return {
      ok: false,
      jobId,
      error: { code: validation.code, message: validation.message, recoverable: false, recovery: "none" }
    };
  }
}

export type BrepWorkerResponse =
  | { kind: "progress"; jobId: string; phase: "initialising" | "validating" | "modelling" | "meshing" | "serialising"; ratio: number }
  | { kind: "evaluation"; jobId: string; result: BrepEvaluation }
  | { kind: "export"; jobId: string; result: BrepBinaryResult }
  | { kind: "import"; jobId: string; result: BrepImportResult }
  | { kind: "error"; jobId: string; error: BrepError };

export function brepTransferables(value: BrepEvaluation | BrepImportResult | BrepBinaryResult): Transferable[] {
  if ("bytes" in value && value.bytes) return [value.bytes];
  const mesh = "mesh" in value ? value.mesh : undefined;
  return mesh ? [mesh.positions.buffer, mesh.normals.buffer, mesh.indices.buffer, mesh.edgePositions.buffer, mesh.faceGroups.buffer, mesh.edgeGroups.buffer] : [];
}

export interface BrepWorkerLike {
  postMessage(message: BrepWorkerRequest, transfer?: Transferable[]): void;
  terminate(): void;
  addEventListener<K extends keyof BrepWorkerEventMap>(type: K, listener: (event: BrepWorkerEventMap[K]) => void): void;
  removeEventListener<K extends keyof BrepWorkerEventMap>(type: K, listener: (event: BrepWorkerEventMap[K]) => void): void;
}

export interface BrepWorkerEventMap {
  error: ErrorEvent;
  message: MessageEvent<BrepWorkerResponse>;
  messageerror: MessageEvent<unknown>;
}

export interface BrepWorkerClient {
  run(request: Exclude<BrepWorkerRequest, { kind: "cancel" }>, onProgress?: (progress: Extract<BrepWorkerResponse, { kind: "progress" }>) => void): Promise<BrepWorkerResponse>;
  cancel(jobId: string): void;
  dispose(): void;
}

export function createBrepWorkerClient(
  workerFactory: () => BrepWorkerLike = () => new Worker(new URL("./brep.worker.ts", import.meta.url), { type: "module", name: "engineering-design-occt" }),
  timeoutMs = BREP_WORKER_TIMEOUT_MS
): BrepWorkerClient {
  let worker = workerFactory();
  const pending = new Map<string, {
    resolve: (response: BrepWorkerResponse) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
    onProgress?: (progress: Extract<BrepWorkerResponse, { kind: "progress" }>) => void;
  }>();

  const onMessage = (event: MessageEvent<BrepWorkerResponse>) => {
    const response = event.data;
    const job = pending.get(response.jobId);
    if (!job) return;
    if (response.kind === "progress") {
      job.onProgress?.(response);
      return;
    }
    clearTimeout(job.timer);
    pending.delete(response.jobId);
    if (response.kind === "error" && response.error.code === "INITIALISATION_FAILED" && response.error.recovery === "replace-worker") {
      restart();
    }
    job.resolve(response);
  };

  const onError = (event: ErrorEvent) => {
    failWorker("The OCCT worker failed", event.message || "an unspecified worker error");
  };

  const onMessageError = () => {
    failWorker("The OCCT worker response could not be deserialised", "the messageerror event did not expose a safe payload");
  };

  const attach = () => {
    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    worker.addEventListener("messageerror", onMessageError);
  };

  const detach = () => {
    worker.removeEventListener("message", onMessage);
    worker.removeEventListener("error", onError);
    worker.removeEventListener("messageerror", onMessageError);
  };

  const restart = () => {
    detach();
    worker.terminate();
    worker = workerFactory();
    attach();
  };

  const failWorker = (summary: string, detail: string) => {
    const jobs = [...pending.values()];
    for (const job of jobs) clearTimeout(job.timer);
    pending.clear();
    restart();
    for (const job of jobs) {
      job.reject(new BrepWorkerJobError({
        code: "WORKER_FAILED",
        message: `${summary}: ${detail}. The worker was replaced; retry the job explicitly.`,
        recoverable: true,
        recovery: "retry-job"
      }));
    }
  };

  attach();

  return {
    run(request, onProgress) {
      if (pending.has(request.jobId)) return Promise.reject(new Error(`Duplicate B-rep job ID: ${request.jobId}`));
      if (pending.size > 0) return Promise.reject(new Error("The OCCT worker accepts one modelling job at a time"));
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(request.jobId);
          restart();
          reject(new BrepWorkerJobError({
            code: "TIMEOUT",
            message: `B-rep job ${request.jobId} exceeded the ${timeoutMs} ms timeout and its worker was terminated`,
            recoverable: true
          }));
        }, timeoutMs);
        pending.set(request.jobId, { resolve, reject, timer, onProgress });
        worker.postMessage(request, request.kind === "import" ? [request.bytes] : []);
      });
    },
    cancel(jobId) {
      const job = pending.get(jobId);
      if (!job) return;
      clearTimeout(job.timer);
      pending.delete(jobId);
      worker.postMessage({ kind: "cancel", jobId });
      restart();
      job.reject(new DOMException(`B-rep job ${jobId} was cancelled and its worker was terminated`, "AbortError"));
    },
    dispose() {
      for (const [jobId, job] of pending) {
        clearTimeout(job.timer);
        job.reject(new DOMException(`B-rep job ${jobId} was cancelled because the client was disposed`, "AbortError"));
      }
      pending.clear();
      detach();
      worker.terminate();
    }
  };
}
