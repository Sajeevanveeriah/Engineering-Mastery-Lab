import { sha256Hex } from "../platform/memoryBridge";
import { EngineeringDataset, validateDataset } from "./datasets";
import { EngineeringEvidenceGraph, validateEvidenceGraph } from "./evidenceGraph";
import { KERNEL_LIMITS } from "./limits";
import { MotorSizingInput, validateMotorSizingInput } from "./motorSizing";
import { EngineeringNotebook, validateNotebook } from "./notebook";
import { EngineeringScenarioSet, validateScenarioSet } from "./scenarios";
import {
  CalculationRecord,
  EngineeringVariable,
  validateCalculationRecords,
  validateEngineeringVariables
} from "./variables";
import {
  assertNoUnsafeKeysDeep,
  assertOnlyKeys,
  assertUniqueIds,
  compareOrdinal,
  isPlainRecord,
  optionalText,
  requireArray,
  requireIdentifier,
  requireInteger,
  requireRecord,
  requireText,
  requireUtcTimestamp
} from "./validation";

export const PROJECT_BUNDLE_FORMAT = "engineering-mastery-lab/project-bundle" as const;
export const PROJECT_BUNDLE_VERSION = 2 as const;

export interface EngineeringProject {
  version: 2;
  id: string;
  name: string;
  description: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  variables: EngineeringVariable[];
  calculations: CalculationRecord[];
  datasets: EngineeringDataset[];
  scenarioSet: EngineeringScenarioSet;
  notebook: EngineeringNotebook;
  evidenceGraph: EngineeringEvidenceGraph;
  motorSizing?: MotorSizingInput;
}

export interface ProjectBundleInspection {
  project: EngineeringProject;
  sourceVersion: 1 | 2;
  migrated: boolean;
  digest: string;
}

export type BundleConflictScope =
  | "project"
  | "variable"
  | "calculation"
  | "dataset"
  | "scenario"
  | "notebook"
  | "evidence-node"
  | "motor-sizing";

export interface BundleConflict {
  scope: BundleConflictScope;
  id: string;
  message: string;
}

export interface ProjectBundlePreview extends ProjectBundleInspection {
  conflicts: BundleConflict[];
}

export interface BundleApplyOptions {
  expectedStoreRevision?: number;
  conflictPolicy?: "reject" | "replace";
}

export interface BundleApplyReceipt {
  storeRevision: number;
  projectId: string;
  replaced: boolean;
  conflicts: BundleConflict[];
}

interface BundlePayloadV2 {
  format: typeof PROJECT_BUNDLE_FORMAT;
  version: 2;
  project: EngineeringProject;
}

interface BundleEnvelopeV2 extends BundlePayloadV2 {
  integrity: {
    algorithm: "SHA-256";
    digest: string;
  };
}

export function createEmptyEngineeringProject(
  id: string,
  name: string,
  timestamp: string
): EngineeringProject {
  const projectId = requireIdentifier(id, "project id");
  const validTimestamp = requireUtcTimestamp(timestamp, "project timestamp");
  return validateEngineeringProject({
    version: 2,
    id: projectId,
    name,
    description: "",
    revision: 0,
    createdAt: validTimestamp,
    updatedAt: validTimestamp,
    variables: [],
    calculations: [],
    datasets: [],
    scenarioSet: {
      version: 1,
      baselineId: "baseline",
      scenarios: [{ version: 1, id: "baseline", name: "Baseline", kind: "baseline", overrides: {} }]
    },
    notebook: { version: 1, blocks: [] },
    evidenceGraph: { version: 1, nodes: [], edges: [] }
  });
}

export function validateEngineeringProject(value: unknown): EngineeringProject {
  const record = requireRecord(value, "engineering project");
  assertOnlyKeys(record, new Set([
    "version",
    "id",
    "name",
    "description",
    "revision",
    "createdAt",
    "updatedAt",
    "variables",
    "calculations",
    "datasets",
    "scenarioSet",
    "notebook",
    "evidenceGraph",
    "motorSizing"
  ]), "engineering project");
  if (record.version !== 2) throw new Error("engineering project.version is unsupported");
  const id = requireIdentifier(record.id, "engineering project.id");
  const createdAt = requireUtcTimestamp(record.createdAt, "engineering project.createdAt");
  const updatedAt = requireUtcTimestamp(record.updatedAt, "engineering project.updatedAt");
  if (Date.parse(updatedAt) < Date.parse(createdAt)) {
    throw new Error("engineering project.updatedAt must not precede createdAt");
  }
  const variables = validateEngineeringVariables(record.variables);
  const calculations = validateCalculationRecords(record.calculations, variables);
  const datasets = requireArray(
    record.datasets,
    "engineering project.datasets",
    KERNEL_LIMITS.collectionEntries
  ).map((dataset, index) => validateDataset(dataset, undefined, `engineering project.datasets[${index}]`));
  assertUniqueIds(datasets, "engineering project.datasets");
  datasets.sort((left, right) => compareOrdinal(left.id, right.id));
  const scenarioSet = validateScenarioSet(record.scenarioSet, variables);
  const notebook = validateNotebook(record.notebook, "engineering project.notebook");
  const evidenceGraph = validateEvidenceGraph(record.evidenceGraph);
  const motorSizing = record.motorSizing === undefined
    ? undefined
    : validateMotorSizingInput(record.motorSizing);

  validateProjectReferences({
    projectId: id,
    variables,
    calculations,
    datasets,
    scenarioSet,
    notebook,
    evidenceGraph,
    motorSizing
  });

  return {
    version: 2,
    id,
    name: requireText(record.name, "engineering project.name", KERNEL_LIMITS.shortTextCharacters),
    description: requireText(
      record.description,
      "engineering project.description",
      KERNEL_LIMITS.projectDescriptionCharacters
    ),
    revision: requireInteger(record.revision, "engineering project.revision", 0, Number.MAX_SAFE_INTEGER),
    createdAt,
    updatedAt,
    variables,
    calculations,
    datasets,
    scenarioSet,
    notebook,
    evidenceGraph,
    ...(motorSizing !== undefined ? { motorSizing } : {})
  };
}

export function exportProjectBundle(project: EngineeringProject): string {
  const validProject = validateEngineeringProject(project);
  const payload: BundlePayloadV2 = {
    format: PROJECT_BUNDLE_FORMAT,
    version: PROJECT_BUNDLE_VERSION,
    project: validProject
  };
  const digest = sha256Hex(canonicalStringify(payload));
  const envelope: BundleEnvelopeV2 = {
    ...payload,
    integrity: { algorithm: "SHA-256", digest }
  };
  return canonicalStringify(envelope);
}

export function importProjectBundle(text: string): ProjectBundleInspection {
  if (text.length > KERNEL_LIMITS.bundleCharacters) {
    throw new Error(`Project bundle exceeds ${KERNEL_LIMITS.bundleCharacters} characters`);
  }
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    throw new Error("Project bundle is not valid JSON");
  }
  assertNoUnsafeKeysDeep(value, "project bundle");
  const record = requireRecord(value, "project bundle");
  if (record.format !== PROJECT_BUNDLE_FORMAT) throw new Error("Project bundle format is unsupported");
  if (record.version === 1) return importVersionOneBundle(record);
  if (record.version !== 2) throw new Error("Project bundle version is unsupported");
  assertOnlyKeys(record, new Set(["format", "version", "project", "integrity"]), "project bundle");
  const integrity = validateIntegrity(record.integrity);
  const payload = {
    format: PROJECT_BUNDLE_FORMAT,
    version: 2,
    project: record.project
  };
  const digest = sha256Hex(canonicalStringify(payload));
  if (!constantTimeStringEqual(integrity.digest, digest)) throw new Error("Project bundle integrity check failed");
  return {
    project: validateEngineeringProject(record.project),
    sourceVersion: 2,
    migrated: false,
    digest
  };
}

export function previewProjectBundle(
  text: string,
  currentProject: EngineeringProject | null = null
): ProjectBundlePreview {
  const inspection = importProjectBundle(text);
  const conflicts = currentProject === null
    ? []
    : detectBundleConflicts(validateEngineeringProject(currentProject), inspection.project);
  return { ...inspection, conflicts };
}

export function canonicalStringify(value: unknown): string {
  const stack = new Set<object>();
  const encode = (item: unknown, path: string): string => {
    if (item === null) return "null";
    if (typeof item === "string" || typeof item === "boolean") return JSON.stringify(item);
    if (typeof item === "number") {
      if (!Number.isFinite(item)) throw new Error(`${path} contains a non-finite number`);
      return JSON.stringify(Object.is(item, -0) ? 0 : item);
    }
    if (Array.isArray(item)) {
      if (stack.has(item)) throw new Error(`${path} contains a circular reference`);
      stack.add(item);
      const result = `[${item.map((entry, index) => encode(entry, `${path}[${index}]`)).join(",")}]`;
      stack.delete(item);
      return result;
    }
    if (isPlainRecord(item)) {
      if (stack.has(item)) throw new Error(`${path} contains a circular reference`);
      stack.add(item);
      const entries = Object.keys(item)
        .sort(compareOrdinal)
        .map((key) => {
          assertNoUnsafeKeysDeep({ [key]: null }, path);
          const entry = item[key];
          if (entry === undefined) throw new Error(`${path}.${key} is undefined`);
          return `${JSON.stringify(key)}:${encode(entry, `${path}.${key}`)}`;
        });
      stack.delete(item);
      return `{${entries.join(",")}}`;
    }
    throw new Error(`${path} contains a non-JSON value`);
  };
  return encode(value, "value");
}

export class InMemoryProjectBundleStore {
  private project: EngineeringProject | null;
  private readonly history: Array<EngineeringProject | null> = [];
  private revision = 0;

  constructor(initialProject: EngineeringProject | null = null) {
    this.project = initialProject === null ? null : structuredClone(validateEngineeringProject(initialProject));
  }

  get storeRevision(): number {
    return this.revision;
  }

  snapshot(): EngineeringProject | null {
    return this.project === null ? null : structuredClone(this.project);
  }

  preview(text: string): ProjectBundlePreview {
    return previewProjectBundle(text, this.project);
  }

  apply(text: string, options: BundleApplyOptions = {}): BundleApplyReceipt {
    if (
      options.expectedStoreRevision !== undefined &&
      options.expectedStoreRevision !== this.revision
    ) {
      throw new Error("Project bundle store revision conflict");
    }
    const preview = this.preview(text);
    const policy = options.conflictPolicy ?? "reject";
    if (preview.conflicts.length > 0 && policy === "reject") {
      throw new Error(`Project bundle has ${preview.conflicts.length} unresolved conflicts`);
    }
    const previous = this.project === null ? null : structuredClone(this.project);
    const candidate = structuredClone(preview.project);
    this.history.push(previous);
    this.project = candidate;
    this.revision++;
    return {
      storeRevision: this.revision,
      projectId: candidate.id,
      replaced: previous !== null,
      conflicts: preview.conflicts
    };
  }

  undo(expectedStoreRevision?: number): EngineeringProject | null {
    if (expectedStoreRevision !== undefined && expectedStoreRevision !== this.revision) {
      throw new Error("Project bundle store revision conflict");
    }
    if (this.history.length === 0) throw new Error("No project bundle apply operation is available to undo");
    this.project = this.history.pop() ?? null;
    this.revision++;
    return this.snapshot();
  }
}

function importVersionOneBundle(record: Record<string, unknown>): ProjectBundleInspection {
  assertOnlyKeys(record, new Set(["format", "version", "project", "integrity"]), "project bundle");
  const payload = { format: PROJECT_BUNDLE_FORMAT, version: 1, project: record.project };
  const digest = sha256Hex(canonicalStringify(payload));
  if (record.integrity !== undefined) {
    const integrity = validateIntegrity(record.integrity);
    if (!constantTimeStringEqual(integrity.digest, digest)) throw new Error("Project bundle integrity check failed");
  }
  return {
    project: migrateVersionOneProject(record.project),
    sourceVersion: 1,
    migrated: true,
    digest
  };
}

function migrateVersionOneProject(value: unknown): EngineeringProject {
  const record = requireRecord(value, "version 1 engineering project");
  assertOnlyKeys(record, new Set([
    "version",
    "id",
    "name",
    "description",
    "createdAt",
    "updatedAt",
    "variables",
    "calculations",
    "datasets",
    "scenarioSet",
    "notebook",
    "evidenceGraph",
    "motorSizing"
  ]), "version 1 engineering project");
  if (record.version !== 1) throw new Error("version 1 engineering project.version is invalid");
  const timestamp = "1970-01-01T00:00:00.000Z";
  const id = requireIdentifier(record.id, "version 1 engineering project.id");
  return validateEngineeringProject({
    version: 2,
    id,
    name: requireText(record.name, "version 1 engineering project.name", KERNEL_LIMITS.shortTextCharacters),
    description: optionalText(
      record.description,
      "version 1 engineering project.description",
      KERNEL_LIMITS.projectDescriptionCharacters
    ) ?? "",
    revision: 0,
    createdAt: record.createdAt ?? timestamp,
    updatedAt: record.updatedAt ?? record.createdAt ?? timestamp,
    variables: record.variables ?? [],
    calculations: record.calculations ?? [],
    datasets: record.datasets ?? [],
    scenarioSet: record.scenarioSet ?? {
      version: 1,
      baselineId: "baseline",
      scenarios: [{ version: 1, id: "baseline", name: "Baseline", kind: "baseline", overrides: {} }]
    },
    notebook: record.notebook ?? { version: 1, blocks: [] },
    evidenceGraph: record.evidenceGraph ?? { version: 1, nodes: [], edges: [] },
    ...(record.motorSizing !== undefined ? { motorSizing: record.motorSizing } : {})
  });
}

function validateIntegrity(value: unknown): { algorithm: "SHA-256"; digest: string } {
  const record = requireRecord(value, "project bundle.integrity");
  assertOnlyKeys(record, new Set(["algorithm", "digest"]), "project bundle.integrity");
  if (record.algorithm !== "SHA-256") throw new Error("Project bundle integrity algorithm is unsupported");
  if (typeof record.digest !== "string" || !/^[a-f0-9]{64}$/.test(record.digest)) {
    throw new Error("Project bundle integrity digest is invalid");
  }
  return { algorithm: "SHA-256", digest: record.digest };
}

function validateProjectReferences(parts: {
  projectId: string;
  variables: EngineeringVariable[];
  calculations: CalculationRecord[];
  datasets: EngineeringDataset[];
  scenarioSet: EngineeringScenarioSet;
  notebook: EngineeringNotebook;
  evidenceGraph: EngineeringEvidenceGraph;
  motorSizing?: MotorSizingInput;
}): void {
  const calculationById = new Map(parts.calculations.map((calculation) => [calculation.id, calculation]));
  const variableIds = new Set(parts.variables.map((variable) => variable.id));
  const datasetIds = new Set(parts.datasets.map((dataset) => dataset.id));
  const scenarioIds = new Set(parts.scenarioSet.scenarios.map((scenario) => scenario.id));
  const evidenceIds = new Set(parts.evidenceGraph.nodes.map((node) => node.id));
  for (const calculation of parts.calculations) {
    if (calculation.projectId !== parts.projectId) {
      throw new Error(`Calculation ${calculation.id} belongs to a different project`);
    }
    if (calculation.sourceDatasetId && !datasetIds.has(calculation.sourceDatasetId)) {
      throw new Error(`Calculation ${calculation.id} references missing dataset ${calculation.sourceDatasetId}`);
    }
    if (calculation.scenarioId && !scenarioIds.has(calculation.scenarioId)) {
      throw new Error(`Calculation ${calculation.id} references missing scenario ${calculation.scenarioId}`);
    }
    for (const evidenceId of calculation.evidenceIds) {
      if (!evidenceIds.has(evidenceId)) {
        throw new Error(`Calculation ${calculation.id} references missing evidence ${evidenceId}`);
      }
    }
  }
  for (const variable of parts.variables) {
    const reference = variable.calculationVersionRef;
    if (!reference) continue;
    const calculation = calculationById.get(reference.calculationId);
    if (!calculation) {
      throw new Error(`Variable ${variable.id} references missing calculation ${reference.calculationId}`);
    }
    if (
      calculation.algorithmId !== reference.algorithmId ||
      calculation.algorithmVersion !== reference.algorithmVersion
    ) {
      throw new Error(`Variable ${variable.id} calculation version reference is stale`);
    }
  }
  for (const block of parts.notebook.blocks) {
    if (!block.referenceId) continue;
    if (block.kind === "calculation" && !calculationById.has(block.referenceId)) {
      throw new Error(`Notebook block ${block.id} references missing calculation ${block.referenceId}`);
    }
    if (block.kind === "dataset" && !datasetIds.has(block.referenceId)) {
      throw new Error(`Notebook block ${block.id} references missing dataset ${block.referenceId}`);
    }
    if (block.kind === "variable" && !variableIds.has(block.referenceId)) {
      throw new Error(`Notebook block ${block.id} references missing variable ${block.referenceId}`);
    }
    if (block.kind === "scenario" && !scenarioIds.has(block.referenceId)) {
      throw new Error(`Notebook block ${block.id} references missing scenario ${block.referenceId}`);
    }
    if ((block.kind === "evidence" || block.kind === "table") && !evidenceIds.has(block.referenceId)) {
      throw new Error(`Notebook block ${block.id} references missing evidence ${block.referenceId}`);
    }
  }
  if (parts.motorSizing && parts.motorSizing.projectId !== parts.projectId) {
    throw new Error("Motor sizing input belongs to a different project");
  }
}

function detectBundleConflicts(
  current: EngineeringProject,
  incoming: EngineeringProject
): BundleConflict[] {
  const conflicts: BundleConflict[] = [];
  if (current.id !== incoming.id) {
    conflicts.push({
      scope: "project",
      id: incoming.id,
      message: `Incoming project ${incoming.id} would replace ${current.id}`
    });
    return conflicts;
  }
  if (
    current.name !== incoming.name ||
    current.description !== incoming.description ||
    current.revision !== incoming.revision ||
    current.createdAt !== incoming.createdAt ||
    current.updatedAt !== incoming.updatedAt
  ) {
    conflicts.push({ scope: "project", id: current.id, message: "Project metadata differs" });
  }
  compareIdentifiedCollections(current.variables, incoming.variables, "variable", conflicts);
  compareIdentifiedCollections(current.calculations, incoming.calculations, "calculation", conflicts);
  compareIdentifiedCollections(current.datasets, incoming.datasets, "dataset", conflicts);
  compareIdentifiedCollections(
    current.scenarioSet.scenarios,
    incoming.scenarioSet.scenarios,
    "scenario",
    conflicts
  );
  compareIdentifiedCollections(current.notebook.blocks, incoming.notebook.blocks, "notebook", conflicts);
  compareIdentifiedCollections(
    current.evidenceGraph.nodes,
    incoming.evidenceGraph.nodes,
    "evidence-node",
    conflicts
  );
  if (canonicalStringify(current.evidenceGraph.edges) !== canonicalStringify(incoming.evidenceGraph.edges)) {
    conflicts.push({
      scope: "project",
      id: current.id,
      message: "Evidence graph relationships differ"
    });
  }
  if (canonicalStringify(current.motorSizing ?? null) !== canonicalStringify(incoming.motorSizing ?? null)) {
    conflicts.push({ scope: "motor-sizing", id: current.id, message: "Motor sizing inputs differ" });
  }
  return conflicts.sort((left, right) =>
    compareOrdinal(left.scope, right.scope) || compareOrdinal(left.id, right.id)
  );
}

function compareIdentifiedCollections<T extends { id: string }>(
  current: T[],
  incoming: T[],
  scope: Exclude<BundleConflictScope, "project" | "motor-sizing">,
  conflicts: BundleConflict[]
): void {
  const currentById = new Map(current.map((item) => [item.id, item]));
  const incomingIds = new Set(incoming.map((item) => item.id));
  for (const item of incoming) {
    const existing = currentById.get(item.id);
    if (existing && canonicalStringify(existing) !== canonicalStringify(item)) {
      conflicts.push({ scope, id: item.id, message: `Incoming ${scope} ${item.id} differs from local state` });
    }
  }
  for (const item of current) {
    if (!incomingIds.has(item.id)) {
      conflicts.push({
        scope,
        id: item.id,
        message: `Local ${scope} ${item.id} would be removed`
      });
    }
  }
}

function constantTimeStringEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}
