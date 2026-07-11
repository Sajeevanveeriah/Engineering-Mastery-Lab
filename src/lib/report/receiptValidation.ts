// Runtime validation and deterministic codec for latest-run receipts. Loaded
// JSON is untrusted and remains bounded before it can become an AdapterResult.

import type {
  AdapterResult,
  AdapterStatus,
  DataSeries,
  DataTable,
  Diagnostic,
  GeneratedFile
} from "../adapters/contract";
import { isSafeRelPath } from "../platform/paths";
import { collectSimulationInputPaths } from "../workspace/inputs";
import type { RequirementRef, SimulationConfig, WorkspaceManifest } from "../workspace/manifest";
import type { InputFileRecord } from "./evidence";
import { RunReceiptError } from "./receiptError";

export const LATEST_RUN_RECEIPT_SCHEMA_VERSION = 2 as const;
export const LATEST_RUN_RECEIPT_REL_PATH = "evidence/latest-run.json";
// Large enough for both bridge-capped raw streams plus structured values, but
// below the host's 16 MiB text-read ceiling.
export const MAX_LATEST_RUN_RECEIPT_BYTES = 8 * 1024 * 1024;

const MAX_INPUT_FILES = 256;
const MAX_TABLES = 32;
const MAX_COLUMNS_PER_TABLE = 64;
const MAX_VALUES_PER_COLUMN = 250_000;
const MAX_SCALARS = 4_096;
const MAX_DIAGNOSTICS = 4_096;
const MAX_GENERATED_FILES = 4_096;
const MAX_ID_CHARS = 256;
const MAX_SHORT_TEXT_CHARS = 4_096;
const MAX_MESSAGE_CHARS = 64 * 1024;
const MAX_RAW_STREAM_CHARS = 2 * 1024 * 1024;

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const SHA256 = /^[a-f0-9]{64}$/;
const NUMBER_TAG = "__engineeringWorkbenchNumber";
const ADAPTER_STATUSES = new Set<AdapterStatus>([
  "ok",
  "failed",
  "timeout",
  "cancelled",
  "tool-missing",
  "invalid-input"
]);

export interface LatestRunReceipt {
  schemaVersion: typeof LATEST_RUN_RECEIPT_SCHEMA_VERSION;
  simulationId: string;
  /** ISO-8601 UTC supplied at capture time. */
  capturedUtc: string;
  /** Hashes of the workspace inputs used for this run. */
  inputFiles: InputFileRecord[];
  /** Declared inputs that did not exist when the run was captured. */
  missingInputPaths: string[];
  /** Exact simulation, requirement and declared-input definition at capture. */
  definition: RunDefinition;
  /** The adapter's actual result. No fallback or synthetic result is created. */
  result: AdapterResult;
}

export interface RunDefinition {
  simulation: SimulationConfig;
  linkedRequirements: RequirementRef[];
  declaredInputPaths: string[];
}

export type LatestRunReceiptInput = Omit<
  LatestRunReceipt,
  "schemaVersion" | "definition" | "missingInputPaths"
>;
export type ReceiptManifest = Pick<WorkspaceManifest, "requirements" | "simulations">;

/** Parse, bound and validate an untrusted receipt value into a defensive copy. */
export function validateLatestRunReceipt(
  value: unknown,
  manifest?: ReceiptManifest
): LatestRunReceipt {
  const record = validateReceiptRecord(value);
  const simulationId = boundedString(record.simulationId, "simulationId", MAX_ID_CHARS, false);
  const capturedUtc = validateCapturedUtc(record.capturedUtc);
  const inputFiles = validateInputFiles(record.inputFiles);
  const missingInputPaths = validatePathList(record.missingInputPaths, "missingInputPaths");
  const definition = validateRunDefinition(record.definition);
  const result = validateAdapterResult(record.result);
  validateReceiptBinding(simulationId, result, inputFiles, missingInputPaths, definition);
  if (manifest) validateDefinitionAgainstManifest(definition, inputFiles, manifest);

  return {
    schemaVersion: LATEST_RUN_RECEIPT_SCHEMA_VERSION,
    simulationId,
    capturedUtc,
    inputFiles,
    missingInputPaths,
    definition,
    result
  };
}

function validateReceiptRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) fail("must contain a JSON object");
  assertOnlyKeys(
    value,
    ["schemaVersion", "simulationId", "capturedUtc", "inputFiles", "missingInputPaths", "definition", "result"],
    "receipt"
  );
  if (value.schemaVersion === LATEST_RUN_RECEIPT_SCHEMA_VERSION) return value;
  if (typeof value.schemaVersion === "number" && value.schemaVersion > LATEST_RUN_RECEIPT_SCHEMA_VERSION) {
    fail(
      `was created by a newer Engineering Workbench receipt schema (version ${value.schemaVersion}; ` +
        `this build supports ${LATEST_RUN_RECEIPT_SCHEMA_VERSION})`
    );
  }
  fail(`has unsupported schemaVersion ${String(value.schemaVersion)}`);
}

function validateCapturedUtc(value: unknown): string {
  const capturedUtc = boundedString(value, "capturedUtc", 64, false);
  if (!isValidIsoUtc(capturedUtc)) fail("capturedUtc must be a valid ISO-8601 UTC timestamp");
  return capturedUtc;
}

function validateInputFiles(value: unknown): InputFileRecord[] {
  const values = limitedArray(value, "inputFiles", MAX_INPUT_FILES, "file");
  const inputFiles = values.map((file, index) => validateInputFile(file, index));
  const duplicateInput = findDuplicate(inputFiles.map((file) => file.relPath));
  if (duplicateInput) fail(`inputFiles contains duplicate path ${JSON.stringify(duplicateInput)}`);
  return inputFiles.sort((a, b) => compareText(a.relPath, b.relPath) || compareText(a.sha256, b.sha256));
}

/** Deterministic JSON serialisation, including lossless tags for non-finite numbers. */
export function serializeLatestRunReceipt(
  receipt: LatestRunReceipt,
  manifest?: ReceiptManifest
): string {
  const validated = validateLatestRunReceipt(receipt, manifest);
  const json = JSON.stringify(sortKeysDeep(validated), replaceNonFiniteNumber, 2) + "\n";
  assertReceiptSize(json);
  return json;
}

/** Parse receipt JSON. This rejects corrupt, unsupported and oversized data. */
export function parseLatestRunReceipt(
  json: string,
  manifest?: ReceiptManifest
): LatestRunReceipt {
  assertReceiptSize(json);
  let parsed: unknown;
  try {
    parsed = JSON.parse(json, reviveNonFiniteNumber);
  } catch (error) {
    throw new RunReceiptError(
      `Latest-run receipt is not valid JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  return validateLatestRunReceipt(parsed, manifest);
}

/** Build the canonical manifest-bound definition used by create and validate. */
export function createRunDefinition(
  manifest: ReceiptManifest,
  simulationId: string
): RunDefinition {
  const simulation = manifest.simulations.find((candidate) => candidate.id === simulationId);
  if (!simulation) {
    fail(`simulationId ${JSON.stringify(simulationId)} is not present in the workspace manifest`);
  }
  const requirementById = new Map(manifest.requirements.map((requirement) => [requirement.id, requirement]));
  const linkedRequirements = simulation.requirementIds.map((requirementId) => {
    const requirement = requirementById.get(requirementId);
    if (!requirement) fail(`simulation ${JSON.stringify(simulationId)} references missing requirement ${JSON.stringify(requirementId)}`);
    return requirement;
  });
  return validateRunDefinition({
    simulation,
    linkedRequirements,
    declaredInputPaths: collectSimulationInputPaths(simulation, manifest)
  });
}

function validateReceiptBinding(
  simulationId: string,
  result: AdapterResult,
  inputFiles: InputFileRecord[],
  missingInputPaths: string[],
  definition: RunDefinition
): void {
  if (simulationId !== definition.simulation.id) {
    fail(`simulationId ${JSON.stringify(simulationId)} does not match definition simulation id ${JSON.stringify(definition.simulation.id)}`);
  }
  if (definition.simulation.capabilityId !== result.capabilityId) {
    fail(
      `result capabilityId ${JSON.stringify(result.capabilityId)} does not match simulation ` +
        `${JSON.stringify(simulationId)} capabilityId ${JSON.stringify(definition.simulation.capabilityId)}`
    );
  }
  const declared = definition.declaredInputPaths;
  const present = inputFiles.map((file) => file.relPath);
  const observed = [...present, ...missingInputPaths].sort(compareText);
  if (findDuplicate(observed)) fail("input state contains a path more than once");
  if (canonicalKey(observed) !== canonicalKey(declared)) {
    fail("input state does not exactly cover the declared input-path set");
  }
}

function validateDefinitionAgainstManifest(
  definition: RunDefinition,
  inputFiles: InputFileRecord[],
  manifest: ReceiptManifest
): void {
  const expected = createRunDefinition(manifest, definition.simulation.id);
  if (canonicalKey(expected) !== canonicalKey(definition)) {
    fail(`definition for simulation ${JSON.stringify(definition.simulation.id)} does not match the current workspace manifest`);
  }
  const declared = new Set(expected.declaredInputPaths);
  const extra = inputFiles.find((file) => !declared.has(file.relPath));
  if (extra) fail(`input file ${JSON.stringify(extra.relPath)} is not declared by the current simulation definition`);
}

function validateRunDefinition(value: unknown): RunDefinition {
  if (!isRecord(value)) fail("definition must be an object");
  assertOnlyKeys(value, ["simulation", "linkedRequirements", "declaredInputPaths"], "definition");
  const simulation = validateDefinitionSimulation(value.simulation);
  const linkedRequirements = limitedArray(
    value.linkedRequirements,
    "definition.linkedRequirements",
    MAX_INPUT_FILES,
    "requirement"
  ).map(validateDefinitionRequirement);
  const duplicateRequirement = findDuplicate(linkedRequirements.map((requirement) => requirement.id));
  if (duplicateRequirement) fail(`definition.linkedRequirements contains duplicate id ${JSON.stringify(duplicateRequirement)}`);
  const linkedIds = linkedRequirements.map((requirement) => requirement.id).sort(compareText);
  if (canonicalKey(linkedIds) !== canonicalKey(simulation.requirementIds)) {
    fail("definition linked requirements do not exactly match simulation requirementIds");
  }
  const declaredInputPaths = validatePathList(value.declaredInputPaths, "definition.declaredInputPaths");
  linkedRequirements.sort((a, b) => compareText(a.id, b.id));
  return { simulation, linkedRequirements, declaredInputPaths };
}

function validateDefinitionSimulation(value: unknown): SimulationConfig {
  if (!isRecord(value)) fail("definition.simulation must be an object");
  assertOnlyKeys(value, ["id", "title", "capabilityId", "params", "requirementIds"], "definition.simulation");
  const requirementIds = validateStringList(value.requirementIds, "definition.simulation.requirementIds");
  const duplicateRequirement = findDuplicate(requirementIds);
  if (duplicateRequirement) fail(`definition.simulation.requirementIds contains duplicate id ${JSON.stringify(duplicateRequirement)}`);
  return {
    id: boundedString(value.id, "definition.simulation.id", MAX_ID_CHARS, false),
    title: boundedString(value.title, "definition.simulation.title", MAX_SHORT_TEXT_CHARS, false),
    capabilityId: boundedString(value.capabilityId, "definition.simulation.capabilityId", MAX_ID_CHARS, false),
    params: validateJsonObject(value.params, "definition.simulation.params"),
    requirementIds
  };
}

function validateDefinitionRequirement(value: unknown, index: number): RequirementRef {
  const path = `definition.linkedRequirements[${index}]`;
  if (!isRecord(value)) fail(`${path} must be an object`);
  assertOnlyKeys(value, ["id", "title", "sourceRelPath"], path);
  const sourceRelPath = value.sourceRelPath === undefined
    ? undefined
    : boundedString(value.sourceRelPath, `${path}.sourceRelPath`, 4_096, false);
  if (sourceRelPath !== undefined && !isSafeRelPath(sourceRelPath)) fail(`${path}.sourceRelPath must be a safe workspace-relative path`);
  return {
    id: boundedString(value.id, `${path}.id`, MAX_ID_CHARS, false),
    title: boundedString(value.title, `${path}.title`, MAX_SHORT_TEXT_CHARS, false),
    ...(sourceRelPath !== undefined ? { sourceRelPath } : {})
  };
}

function validatePathList(value: unknown, path: string): string[] {
  const values = validateStringList(value, path, 4_096);
  const duplicate = findDuplicate(values);
  if (duplicate) fail(`${path} contains duplicate path ${JSON.stringify(duplicate)}`);
  values.forEach((relPath, index) => {
    if (!isSafeRelPath(relPath)) fail(`${path}[${index}] must be a safe workspace-relative path`);
  });
  return values.sort(compareText);
}

function validateStringList(value: unknown, path: string, maxChars = MAX_ID_CHARS): string[] {
  return limitedArray(value, path, MAX_INPUT_FILES, "entry")
    .map((item, index) => boundedString(item, `${path}[${index}]`, maxChars, false))
    .sort(compareText);
}

function validateJsonObject(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) fail(`${path} must be an object`);
  return validateJsonValue(value, path, 0, { count: 0 }) as Record<string, unknown>;
}

function validateJsonValue(
  value: unknown,
  path: string,
  depth: number,
  state: { count: number }
): unknown {
  state.count += 1;
  if (state.count > 100_000) fail(`${path} exceeds the JSON value limit`);
  if (depth > 64) fail(`${path} exceeds the nesting limit`);
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${path} must contain finite JSON numbers`);
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => validateJsonValue(item, `${path}[${index}]`, depth + 1, state));
  }
  if (!isRecord(value)) fail(`${path} contains an unsupported JSON value`);
  const out: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(value).sort(compareText)) {
    if (key === "__proto__" || key === "prototype" || key === "constructor") fail(`${path} contains reserved key ${JSON.stringify(key)}`);
    out[key] = validateJsonValue(value[key], `${path}.${key}`, depth + 1, state);
  }
  return out;
}

function validateInputFile(value: unknown, index: number): InputFileRecord {
  if (!isRecord(value)) fail(`inputFiles[${index}] must be an object`);
  assertOnlyKeys(value, ["relPath", "sha256"], `inputFiles[${index}]`);
  const relPath = boundedString(value.relPath, `inputFiles[${index}].relPath`, 4_096, false);
  if (!isSafeRelPath(relPath)) fail(`inputFiles[${index}].relPath must be a safe workspace-relative path`);
  const sha256 = boundedString(value.sha256, `inputFiles[${index}].sha256`, 64, false);
  if (!SHA256.test(sha256)) fail(`inputFiles[${index}].sha256 must be 64 lowercase hexadecimal characters`);
  return { relPath, sha256 };
}

function validateAdapterResult(value: unknown): AdapterResult {
  const record = validateAdapterResultRecord(value);
  const status = validateAdapterStatus(record.status);
  const capabilityId = boundedString(record.capabilityId, "result.capabilityId", MAX_ID_CHARS, false);
  const message = boundedString(record.message, "result.message", MAX_MESSAGE_CHARS, true);
  const tables = validateTables(record.tables);
  const scalars = validateScalars(record.scalars);
  const diagnostics = validateDiagnostics(record.diagnostics);
  const generatedFiles = validateGeneratedFiles(record.generatedFiles);
  const raw = validateRaw(record.raw);
  const durationMs = validateDurationMs(record.durationMs);
  const toolVersion = optionalBoundedString(
    record.toolVersion,
    "result.toolVersion",
    MAX_SHORT_TEXT_CHARS
  );

  return {
    status,
    capabilityId,
    message,
    tables,
    scalars,
    diagnostics,
    generatedFiles,
    ...(raw !== undefined ? { raw } : {}),
    ...(durationMs !== undefined ? { durationMs } : {}),
    ...(toolVersion !== undefined ? { toolVersion } : {})
  };
}

function validateAdapterResultRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) fail("result must be an object");
  assertOnlyKeys(
    value,
    [
      "status",
      "capabilityId",
      "message",
      "tables",
      "scalars",
      "diagnostics",
      "generatedFiles",
      "raw",
      "durationMs",
      "toolVersion"
    ],
    "result"
  );
  return value;
}

function validateAdapterStatus(value: unknown): AdapterStatus {
  if (typeof value !== "string" || !ADAPTER_STATUSES.has(value as AdapterStatus)) {
    fail("result.status is not a supported adapter status");
  }
  return value as AdapterStatus;
}

function validateTables(value: unknown): DataTable[] {
  return limitedArray(value, "result.tables", MAX_TABLES, "table").map(validateTable);
}

function validateScalars(value: unknown): Record<string, number> {
  if (!isRecord(value)) fail("result.scalars must be an object");
  const entries = Object.entries(value);
  if (entries.length > MAX_SCALARS) fail(`result.scalars exceeds the ${MAX_SCALARS}-entry limit`);
  const scalars: Record<string, number> = {};
  for (const [key, scalar] of entries.sort(([a], [b]) => compareText(a, b))) {
    boundedString(key, "result scalar key", MAX_SHORT_TEXT_CHARS, false);
    if (key === "__proto__" || key === "prototype" || key === "constructor") {
      fail(`result scalar key ${JSON.stringify(key)} is reserved`);
    }
    scalars[key] = resultNumber(scalar, `result.scalars.${key}`);
  }
  return scalars;
}

function validateDiagnostics(value: unknown): Diagnostic[] {
  return limitedArray(value, "result.diagnostics", MAX_DIAGNOSTICS, "entry").map(validateDiagnostic);
}

function validateGeneratedFiles(value: unknown): GeneratedFile[] {
  return limitedArray(value, "result.generatedFiles", MAX_GENERATED_FILES, "entry").map(validateGeneratedFile);
}

function validateRaw(value: unknown): AdapterResult["raw"] {
  if (value === undefined) return undefined;
  if (!isRecord(value)) fail("result.raw must be an object when supplied");
  assertOnlyKeys(value, ["stdout", "stderr", "truncated"], "result.raw");
  return {
    ...(value.stdout !== undefined
      ? { stdout: boundedString(value.stdout, "result.raw.stdout", MAX_RAW_STREAM_CHARS, true) }
      : {}),
    ...(value.stderr !== undefined
      ? { stderr: boundedString(value.stderr, "result.raw.stderr", MAX_RAW_STREAM_CHARS, true) }
      : {}),
    ...(value.truncated !== undefined
      ? { truncated: booleanValue(value.truncated, "result.raw.truncated") }
      : {})
  };
}

function validateDurationMs(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    fail("result.durationMs must be a non-negative finite number when supplied");
  }
  return value;
}

function validateTable(value: unknown, tableIndex: number): DataTable {
  if (!isRecord(value)) fail(`result.tables[${tableIndex}] must be an object`);
  assertOnlyKeys(value, ["title", "columns"], `result.tables[${tableIndex}]`);
  const title = boundedString(
    value.title,
    `result.tables[${tableIndex}].title`,
    MAX_SHORT_TEXT_CHARS,
    true
  );
  const columns = limitedArray(
    value.columns,
    `result.tables[${tableIndex}].columns`,
    MAX_COLUMNS_PER_TABLE,
    "column"
  ).map((column, columnIndex) => validateDataSeries(column, tableIndex, columnIndex));
  const lengths = new Set(columns.map((column) => column.values.length));
  if (lengths.size > 1) fail(`result.tables[${tableIndex}] columns must contain the same number of values`);
  return { title, columns };
}

function validateDataSeries(value: unknown, tableIndex: number, columnIndex: number): DataSeries {
  const path = `result.tables[${tableIndex}].columns[${columnIndex}]`;
  if (!isRecord(value)) fail(`${path} must be an object`);
  assertOnlyKeys(value, ["name", "unit", "values"], path);
  const name = boundedString(value.name, `${path}.name`, MAX_SHORT_TEXT_CHARS, false);
  const unit = optionalBoundedString(value.unit, `${path}.unit`, MAX_SHORT_TEXT_CHARS);
  const values = limitedArray(value.values, `${path}.values`, MAX_VALUES_PER_COLUMN, "value").map(
    (item, valueIndex) => resultNumber(item, `${path}.values[${valueIndex}]`)
  );
  return { name, ...(unit !== undefined ? { unit } : {}), values };
}

function validateDiagnostic(value: unknown, index: number): Diagnostic {
  if (!isRecord(value)) fail(`result.diagnostics[${index}] must be an object`);
  assertOnlyKeys(value, ["severity", "message", "source", "location"], `result.diagnostics[${index}]`);
  if (value.severity !== "error" && value.severity !== "warning" && value.severity !== "info") {
    fail(`result.diagnostics[${index}].severity is invalid`);
  }
  return {
    severity: value.severity,
    message: boundedString(value.message, `result.diagnostics[${index}].message`, MAX_MESSAGE_CHARS, true),
    ...(value.source !== undefined
      ? { source: boundedString(value.source, `result.diagnostics[${index}].source`, MAX_SHORT_TEXT_CHARS, true) }
      : {}),
    ...(value.location !== undefined
      ? {
          location: boundedString(
            value.location,
            `result.diagnostics[${index}].location`,
            MAX_SHORT_TEXT_CHARS,
            true
          )
        }
      : {})
  };
}

function validateGeneratedFile(value: unknown, index: number): GeneratedFile {
  if (!isRecord(value)) fail(`result.generatedFiles[${index}] must be an object`);
  assertOnlyKeys(value, ["relPath", "kind", "description", "sha256"], `result.generatedFiles[${index}]`);
  const relPath = boundedString(
    value.relPath,
    `result.generatedFiles[${index}].relPath`,
    4_096,
    false
  );
  if (!isSafeRelPath(relPath)) {
    fail(`result.generatedFiles[${index}].relPath must be a safe workspace-relative path`);
  }
  const sha256 =
    value.sha256 === undefined
      ? undefined
      : boundedString(value.sha256, `result.generatedFiles[${index}].sha256`, 64, false);
  if (sha256 !== undefined && !SHA256.test(sha256)) {
    fail(`result.generatedFiles[${index}].sha256 must be 64 lowercase hexadecimal characters`);
  }
  return {
    relPath,
    kind: boundedString(value.kind, `result.generatedFiles[${index}].kind`, MAX_ID_CHARS, false),
    ...(value.description !== undefined
      ? {
          description: boundedString(
            value.description,
            `result.generatedFiles[${index}].description`,
            MAX_MESSAGE_CHARS,
            true
          )
        }
      : {}),
    ...(sha256 !== undefined ? { sha256 } : {})
  };
}

function boundedString(
  value: unknown,
  path: string,
  maxChars: number,
  allowEmpty: boolean
): string {
  if (typeof value !== "string") fail(`${path} must be a string`);
  if (!allowEmpty && value.length === 0) fail(`${path} must not be empty`);
  if (value.length > maxChars) fail(`${path} exceeds the ${maxChars}-character limit`);
  return value;
}

function optionalBoundedString(value: unknown, path: string, maxChars: number): string | undefined {
  return value === undefined ? undefined : boundedString(value, path, maxChars, true);
}

function limitedArray(value: unknown, path: string, limit: number, itemLabel: string): unknown[] {
  if (!Array.isArray(value)) fail(`${path} must be an array`);
  if (value.length > limit) fail(`${path} exceeds the ${limit}-${itemLabel} limit`);
  return value;
}

function booleanValue(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") fail(`${path} must be a boolean`);
  return value;
}

function resultNumber(value: unknown, path: string): number {
  if (typeof value !== "number") fail(`${path} must be a number`);
  return value;
}

function assertOnlyKeys(value: Record<string, unknown>, allowed: string[], path: string): void {
  const allowedSet = new Set(allowed);
  const unexpected = Object.keys(value).find((key) => !allowedSet.has(key));
  if (unexpected) fail(`${path} contains unsupported field ${JSON.stringify(unexpected)}`);
}

function assertReceiptSize(json: string): void {
  const bytes = new TextEncoder().encode(json).byteLength;
  if (bytes > MAX_LATEST_RUN_RECEIPT_BYTES) {
    throw new RunReceiptError(
      `Latest-run receipt is too large (${bytes} bytes; limit ${MAX_LATEST_RUN_RECEIPT_BYTES} bytes).`
    );
  }
}

function replaceNonFiniteNumber(_key: string, value: unknown): unknown {
  if (typeof value !== "number") return value;
  if (Object.is(value, -0)) return { [NUMBER_TAG]: "-0" };
  if (Number.isFinite(value)) return value;
  if (Number.isNaN(value)) return { [NUMBER_TAG]: "NaN" };
  return { [NUMBER_TAG]: value > 0 ? "+Infinity" : "-Infinity" };
}

function reviveNonFiniteNumber(_key: string, value: unknown): unknown {
  if (!isRecord(value) || Object.keys(value).length !== 1 || !(NUMBER_TAG in value)) return value;
  if (value[NUMBER_TAG] === "NaN") return Number.NaN;
  if (value[NUMBER_TAG] === "+Infinity") return Number.POSITIVE_INFINITY;
  if (value[NUMBER_TAG] === "-Infinity") return Number.NEGATIVE_INFINITY;
  if (value[NUMBER_TAG] === "-0") return -0;
  return value;
}

function isValidIsoUtc(value: string): boolean {
  if (!ISO_UTC.test(value)) return false;
  const milliseconds = Date.parse(value);
  if (Number.isNaN(milliseconds)) return false;
  // Date.parse normalises impossible dates such as 31 February. Comparing the
  // whole-second portion to the canonical UTC value rejects that normalisation
  // while still accepting optional fractional-second precision.
  return `${value.slice(0, 19)}Z` === `${new Date(milliseconds).toISOString().slice(0, 19)}Z`;
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (isRecord(value)) {
    const out: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const key of Object.keys(value).sort(compareText)) out[key] = sortKeysDeep(value[key]);
    return out;
  }
  return value;
}

function canonicalKey(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function findDuplicate(values: string[]): string | null {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) return value;
    seen.add(value);
  }
  return null;
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function fail(message: string): never {
  throw new RunReceiptError(`Latest-run receipt ${message}.`);
}
