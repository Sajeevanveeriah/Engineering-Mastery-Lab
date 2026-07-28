import { KERNEL_LIMITS } from "./limits";
import {
  ENGINEERING_UNIT_REGISTRY,
  EngineeringDimension,
  EngineeringUnitRegistry,
  getEngineeringUnit,
  toBaseEngineeringValue
} from "./units";
import {
  assertOnlyKeys,
  assertUniqueIds,
  compareOrdinal,
  optionalText,
  requireArray,
  requireFiniteNumber,
  requireIdentifier,
  requireRecord,
  requireText,
  requireUtcTimestamp
} from "./validation";

export type EngineeringVariableRole = "input" | "assumption" | "derived";
export type AssumptionStatus = "measured" | "specified" | "assumed" | "derived";
export type VariableValidationStatus = "valid" | "warning" | "invalid";

export interface VariableRange {
  minimumBase?: number;
  maximumBase?: number;
}

export interface VariableValidation {
  status: VariableValidationStatus;
  messages: string[];
}

export interface VariableProvenance {
  kind: "manual" | "dataset" | "calculation" | "import";
  referenceId?: string;
  note?: string;
}

export interface VariableUncertainty {
  kind: "tolerance" | "uncertainty";
  plusMinus: number;
  unitId: string;
  confidencePercent?: number;
}

export interface CalculationVersionReference {
  calculationId: string;
  algorithmId: string;
  algorithmVersion: string;
}

export interface EngineeringVariable {
  version: 1;
  id: string;
  label: string;
  role: EngineeringVariableRole;
  dimension: EngineeringDimension;
  value: number;
  baseValue: number;
  unitId: string;
  validRange: VariableRange;
  validation: VariableValidation;
  provenance: VariableProvenance;
  assumptionStatus: AssumptionStatus;
  uncertainty?: VariableUncertainty;
  createdAt: string;
  updatedAt: string;
  calculationVersionRef?: CalculationVersionReference;
  description?: string;
}

export interface CalculationVariableSnapshot {
  variableId: string;
  value: number;
  baseValue: number;
  unitId: string;
  dimension: EngineeringDimension;
}

export interface CalculationRecord {
  version: 1;
  id: string;
  label: string;
  equation: string;
  algorithmId: string;
  algorithmVersion: string;
  inputs: CalculationVariableSnapshot[];
  outputs: CalculationVariableSnapshot[];
  assumptions: string[];
  warnings: string[];
  boundaries: string[];
  sourceDatasetId?: string;
  scenarioId?: string;
  recordedAt: string;
  evidenceIds: string[];
  projectId: string;
}

export function validateEngineeringVariable(
  value: unknown,
  registry: EngineeringUnitRegistry = ENGINEERING_UNIT_REGISTRY,
  path = "variable"
): EngineeringVariable {
  const record = requireRecord(value, path);
  assertOnlyKeys(record, new Set([
    "version", "id", "label", "role", "dimension", "value", "baseValue", "unitId",
    "validRange", "validation", "provenance", "assumptionStatus", "uncertainty",
    "createdAt", "updatedAt", "calculationVersionRef", "description"
  ]), path);
  if (record.version !== 1) throw new Error(`${path}.version is unsupported`);
  if (record.role !== "input" && record.role !== "assumption" && record.role !== "derived") {
    throw new Error(`${path}.role is invalid`);
  }
  const unitId = requireIdentifier(record.unitId, `${path}.unitId`);
  const unit = getEngineeringUnit(unitId, registry);
  if (record.dimension !== unit.dimension) {
    throw new Error(`${path}.dimension does not match unit ${unitId}`);
  }
  if (
    record.assumptionStatus !== "measured" &&
    record.assumptionStatus !== "specified" &&
    record.assumptionStatus !== "assumed" &&
    record.assumptionStatus !== "derived"
  ) {
    throw new Error(`${path}.assumptionStatus is invalid`);
  }
  const displayValue = requireFiniteNumber(record.value, `${path}.value`);
  const computedBaseValue = toBaseEngineeringValue(displayValue, unitId, registry);
  const suppliedBaseValue = requireFiniteNumber(record.baseValue, `${path}.baseValue`);
  if (!numbersEquivalent(suppliedBaseValue, computedBaseValue)) {
    throw new Error(`${path}.baseValue does not match its display value and unit`);
  }
  const validRange = validateVariableRange(record.validRange, `${path}.validRange`);
  const validation = validateVariableValidation(record.validation, `${path}.validation`);
  const outsideRange =
    (validRange.minimumBase !== undefined && computedBaseValue < validRange.minimumBase) ||
    (validRange.maximumBase !== undefined && computedBaseValue > validRange.maximumBase);
  if (outsideRange && validation.status !== "invalid") {
    throw new Error(`${path}.validation must be invalid when the value is outside its valid range`);
  }
  const description = optionalText(
    record.description,
    `${path}.description`,
    KERNEL_LIMITS.projectDescriptionCharacters
  );
  return {
    version: 1,
    id: requireIdentifier(record.id, `${path}.id`),
    label: requireText(record.label, `${path}.label`, KERNEL_LIMITS.shortTextCharacters),
    role: record.role,
    dimension: unit.dimension,
    value: displayValue,
    baseValue: computedBaseValue,
    unitId,
    validRange,
    validation,
    provenance: validateVariableProvenance(record.provenance, `${path}.provenance`),
    assumptionStatus: record.assumptionStatus,
    ...(record.uncertainty !== undefined
      ? { uncertainty: validateVariableUncertainty(record.uncertainty, unit.dimension, registry, `${path}.uncertainty`) }
      : {}),
    createdAt: requireUtcTimestamp(record.createdAt, `${path}.createdAt`),
    updatedAt: requireUtcTimestamp(record.updatedAt, `${path}.updatedAt`),
    ...(record.calculationVersionRef !== undefined
      ? { calculationVersionRef: validateCalculationVersionReference(
        record.calculationVersionRef,
        `${path}.calculationVersionRef`
      ) }
      : {}),
    ...(description !== undefined ? { description } : {})
  };
}

export function validateEngineeringVariables(
  value: unknown,
  registry: EngineeringUnitRegistry = ENGINEERING_UNIT_REGISTRY,
  path = "variables"
): EngineeringVariable[] {
  const variables = requireArray(value, path, KERNEL_LIMITS.collectionEntries)
    .map((item, index) => validateEngineeringVariable(item, registry, `${path}[${index}]`));
  assertUniqueIds(variables, path);
  return [...variables].sort((left, right) => compareOrdinal(left.id, right.id));
}

export function validateCalculationRecord(
  value: unknown,
  variableIds?: ReadonlySet<string>,
  path = "calculation"
): CalculationRecord {
  const record = requireRecord(value, path);
  assertOnlyKeys(record, new Set([
    "version", "id", "label", "equation", "algorithmId", "algorithmVersion", "inputs",
    "outputs", "assumptions", "warnings", "boundaries", "sourceDatasetId", "scenarioId",
    "recordedAt", "evidenceIds", "projectId"
  ]), path);
  if (record.version !== 1) throw new Error(`${path}.version is unsupported`);
  const inputs = validateSnapshots(record.inputs, `${path}.inputs`);
  const outputs = validateSnapshots(record.outputs, `${path}.outputs`);
  if (inputs.length === 0) throw new Error(`${path} must retain at least one input snapshot`);
  if (outputs.length === 0) throw new Error(`${path} must retain at least one output snapshot`);
  if (variableIds) {
    for (const snapshot of [...inputs, ...outputs]) {
      if (!variableIds.has(snapshot.variableId)) {
        throw new Error(`${path} references missing variable ${snapshot.variableId}`);
      }
    }
  }
  const sourceDatasetId = record.sourceDatasetId === undefined
    ? undefined
    : requireIdentifier(record.sourceDatasetId, `${path}.sourceDatasetId`);
  const scenarioId = record.scenarioId === undefined
    ? undefined
    : requireIdentifier(record.scenarioId, `${path}.scenarioId`);
  return {
    version: 1,
    id: requireIdentifier(record.id, `${path}.id`),
    label: requireText(record.label, `${path}.label`, KERNEL_LIMITS.shortTextCharacters),
    equation: requireText(record.equation, `${path}.equation`, 1_000),
    algorithmId: requireIdentifier(record.algorithmId, `${path}.algorithmId`),
    algorithmVersion: requireText(record.algorithmVersion, `${path}.algorithmVersion`, 80),
    inputs,
    outputs,
    assumptions: validateTextArray(record.assumptions, `${path}.assumptions`),
    warnings: validateTextArray(record.warnings, `${path}.warnings`),
    boundaries: validateTextArray(record.boundaries, `${path}.boundaries`),
    ...(sourceDatasetId !== undefined ? { sourceDatasetId } : {}),
    ...(scenarioId !== undefined ? { scenarioId } : {}),
    recordedAt: requireUtcTimestamp(record.recordedAt, `${path}.recordedAt`),
    evidenceIds: validateIdentifierArray(record.evidenceIds, `${path}.evidenceIds`),
    projectId: requireIdentifier(record.projectId, `${path}.projectId`)
  };
}

export function validateCalculationRecords(
  value: unknown,
  variables: ReadonlyArray<EngineeringVariable>,
  path = "calculations"
): CalculationRecord[] {
  const variableIds = new Set(variables.map((variable) => variable.id));
  const calculations = requireArray(value, path, KERNEL_LIMITS.collectionEntries)
    .map((item, index) => validateCalculationRecord(item, variableIds, `${path}[${index}]`));
  assertUniqueIds(calculations, path);
  return [...calculations].sort((left, right) => compareOrdinal(left.id, right.id));
}

function validateIdentifierArray(value: unknown, path: string): string[] {
  const ids = requireArray(value, path, KERNEL_LIMITS.collectionEntries)
    .map((item, index) => requireIdentifier(item, `${path}[${index}]`));
  if (new Set(ids).size !== ids.length) throw new Error(`${path} contains duplicate identifiers`);
  return [...ids].sort(compareOrdinal);
}

function validateTextArray(value: unknown, path: string): string[] {
  return requireArray(value, path, 64).map((item, index) =>
    requireText(item, `${path}[${index}]`, KERNEL_LIMITS.shortTextCharacters)
  );
}

function validateVariableRange(value: unknown, path: string): VariableRange {
  const record = requireRecord(value, path);
  assertOnlyKeys(record, new Set(["minimumBase", "maximumBase"]), path);
  const minimumBase = record.minimumBase === undefined
    ? undefined
    : requireFiniteNumber(record.minimumBase, `${path}.minimumBase`);
  const maximumBase = record.maximumBase === undefined
    ? undefined
    : requireFiniteNumber(record.maximumBase, `${path}.maximumBase`);
  if (minimumBase !== undefined && maximumBase !== undefined && minimumBase > maximumBase) {
    throw new Error(`${path}.minimumBase must not exceed maximumBase`);
  }
  return {
    ...(minimumBase !== undefined ? { minimumBase } : {}),
    ...(maximumBase !== undefined ? { maximumBase } : {})
  };
}

function validateVariableValidation(value: unknown, path: string): VariableValidation {
  const record = requireRecord(value, path);
  assertOnlyKeys(record, new Set(["status", "messages"]), path);
  if (record.status !== "valid" && record.status !== "warning" && record.status !== "invalid") {
    throw new Error(`${path}.status is invalid`);
  }
  return {
    status: record.status,
    messages: validateTextArray(record.messages, `${path}.messages`)
  };
}

function validateVariableProvenance(value: unknown, path: string): VariableProvenance {
  const record = requireRecord(value, path);
  assertOnlyKeys(record, new Set(["kind", "referenceId", "note"]), path);
  if (
    record.kind !== "manual" &&
    record.kind !== "dataset" &&
    record.kind !== "calculation" &&
    record.kind !== "import"
  ) {
    throw new Error(`${path}.kind is invalid`);
  }
  const referenceId = record.referenceId === undefined
    ? undefined
    : requireIdentifier(record.referenceId, `${path}.referenceId`);
  const note = optionalText(record.note, `${path}.note`, KERNEL_LIMITS.shortTextCharacters);
  if ((record.kind === "dataset" || record.kind === "calculation") && referenceId === undefined) {
    throw new Error(`${path}.referenceId is required for ${record.kind} provenance`);
  }
  return {
    kind: record.kind,
    ...(referenceId !== undefined ? { referenceId } : {}),
    ...(note !== undefined ? { note } : {})
  };
}

function validateVariableUncertainty(
  value: unknown,
  dimension: EngineeringDimension,
  registry: EngineeringUnitRegistry,
  path: string
): VariableUncertainty {
  const record = requireRecord(value, path);
  assertOnlyKeys(record, new Set(["kind", "plusMinus", "unitId", "confidencePercent"]), path);
  if (record.kind !== "tolerance" && record.kind !== "uncertainty") throw new Error(`${path}.kind is invalid`);
  const plusMinus = requireFiniteNumber(record.plusMinus, `${path}.plusMinus`);
  if (plusMinus < 0) throw new Error(`${path}.plusMinus must be non-negative`);
  const unitId = requireIdentifier(record.unitId, `${path}.unitId`);
  if (getEngineeringUnit(unitId, registry).dimension !== dimension) {
    throw new Error(`${path}.unitId has the wrong dimension`);
  }
  const confidencePercent = record.confidencePercent === undefined
    ? undefined
    : requireFiniteNumber(record.confidencePercent, `${path}.confidencePercent`);
  if (confidencePercent !== undefined && (confidencePercent <= 0 || confidencePercent > 100)) {
    throw new Error(`${path}.confidencePercent must be greater than 0 and at most 100`);
  }
  return {
    kind: record.kind,
    plusMinus,
    unitId,
    ...(confidencePercent !== undefined ? { confidencePercent } : {})
  };
}

function validateCalculationVersionReference(value: unknown, path: string): CalculationVersionReference {
  const record = requireRecord(value, path);
  assertOnlyKeys(record, new Set(["calculationId", "algorithmId", "algorithmVersion"]), path);
  return {
    calculationId: requireIdentifier(record.calculationId, `${path}.calculationId`),
    algorithmId: requireIdentifier(record.algorithmId, `${path}.algorithmId`),
    algorithmVersion: requireText(record.algorithmVersion, `${path}.algorithmVersion`, 80)
  };
}

function validateSnapshots(value: unknown, path: string): CalculationVariableSnapshot[] {
  const snapshots = requireArray(value, path, KERNEL_LIMITS.collectionEntries).map((item, index) => {
    const itemPath = `${path}[${index}]`;
    const record = requireRecord(item, itemPath);
    assertOnlyKeys(record, new Set(["variableId", "value", "baseValue", "unitId", "dimension"]), itemPath);
    const unitId = requireIdentifier(record.unitId, `${itemPath}.unitId`);
    const unit = getEngineeringUnit(unitId);
    if (record.dimension !== unit.dimension) throw new Error(`${itemPath}.dimension does not match its unit`);
    const displayValue = requireFiniteNumber(record.value, `${itemPath}.value`);
    const baseValue = requireFiniteNumber(record.baseValue, `${itemPath}.baseValue`);
    const computedBaseValue = toBaseEngineeringValue(displayValue, unitId);
    if (!numbersEquivalent(baseValue, computedBaseValue)) {
      throw new Error(`${itemPath}.baseValue does not match its display value and unit`);
    }
    return {
      variableId: requireIdentifier(record.variableId, `${itemPath}.variableId`),
      value: displayValue,
      baseValue: computedBaseValue,
      unitId,
      dimension: unit.dimension
    };
  });
  const dedupe: Array<{ id: string }> = snapshots.map((snapshot) => ({ id: snapshot.variableId }));
  assertUniqueIds(dedupe, path);
  return [...snapshots].sort((left, right) => compareOrdinal(left.variableId, right.variableId));
}

function numbersEquivalent(left: number, right: number): boolean {
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= Number.EPSILON * scale * 16;
}
