import { KERNEL_LIMITS } from "./limits";
import {
  ENGINEERING_UNIT_REGISTRY,
  EngineeringUnitRegistry,
  convertEngineeringValue,
  getEngineeringUnit,
  toBaseEngineeringValue
} from "./units";
import { EngineeringVariable } from "./variables";
import {
  assertOnlyKeys,
  assertUniqueIds,
  compareOrdinal,
  defineSafe,
  requireArray,
  requireFiniteNumber,
  requireIdentifier,
  requireRecord,
  requireText
} from "./validation";

export interface ScenarioOverride {
  value: number;
  unitId: string;
}

export interface EngineeringScenario {
  version: 1;
  id: string;
  name: string;
  kind: "baseline" | "named";
  overrides: Record<string, ScenarioOverride>;
}

export interface EngineeringScenarioSet {
  version: 1;
  baselineId: string;
  scenarios: EngineeringScenario[];
}

export interface ScenarioComparisonRow {
  variableId: string;
  role: "input" | "output";
  dimension: EngineeringVariable["dimension"];
  unitId: string;
  baselineValue: number;
  candidateValue: number;
  delta: number;
  relativePercent: number | null;
  changed: boolean;
}

export function validateScenarioSet(
  value: unknown,
  variables: ReadonlyArray<EngineeringVariable>,
  registry: EngineeringUnitRegistry = ENGINEERING_UNIT_REGISTRY,
  path = "scenario set"
): EngineeringScenarioSet {
  const record = requireRecord(value, path);
  assertOnlyKeys(record, new Set(["version", "baselineId", "scenarios"]), path);
  if (record.version !== 1) throw new Error(`${path}.version is unsupported`);
  const variableById = new Map(variables.map((variable) => [variable.id, variable]));
  const scenarios = requireArray(record.scenarios, `${path}.scenarios`, KERNEL_LIMITS.collectionEntries)
    .map((scenario, index) =>
      validateScenario(scenario, variableById, registry, `${path}.scenarios[${index}]`)
    );
  assertUniqueIds(scenarios, `${path}.scenarios`);
  const baselineId = requireIdentifier(record.baselineId, `${path}.baselineId`);
  const baselines = scenarios.filter((scenario) => scenario.kind === "baseline");
  if (baselines.length !== 1) throw new Error(`${path} must contain exactly one baseline scenario`);
  if (baselines[0].id !== baselineId) throw new Error(`${path}.baselineId does not identify the baseline scenario`);
  return {
    version: 1,
    baselineId,
    scenarios: [...scenarios].sort((left, right) => compareOrdinal(left.id, right.id))
  };
}

export function resolveScenarioVariables(
  variables: ReadonlyArray<EngineeringVariable>,
  scenario: EngineeringScenario,
  registry: EngineeringUnitRegistry = ENGINEERING_UNIT_REGISTRY
): EngineeringVariable[] {
  const validated = validateScenario(
    scenario,
    new Map(variables.map((variable) => [variable.id, variable])),
    registry,
    "scenario"
  );
  return [...variables]
    .sort((left, right) => compareOrdinal(left.id, right.id))
    .map((variable) => {
      const override = validated.overrides[variable.id];
      if (!override) return structuredClone(variable);
      const convertedValue = convertEngineeringValue(
        override.value,
        override.unitId,
        variable.unitId,
        registry
      );
      return {
        ...structuredClone(variable),
        value: convertedValue,
        baseValue: toBaseEngineeringValue(convertedValue, variable.unitId, registry)
      };
    });
}

export function compareScenarios(
  variables: ReadonlyArray<EngineeringVariable>,
  baseline: EngineeringScenario,
  candidate: EngineeringScenario,
  registry: EngineeringUnitRegistry = ENGINEERING_UNIT_REGISTRY
): ScenarioComparisonRow[] {
  const baselineVariables = resolveScenarioVariables(variables, baseline, registry);
  const candidateVariables = resolveScenarioVariables(variables, candidate, registry);
  const candidateById = new Map(candidateVariables.map((variable) => [variable.id, variable]));
  return baselineVariables.map((baselineVariable) => {
    const candidateVariable = candidateById.get(baselineVariable.id);
    if (!candidateVariable) throw new Error(`Candidate scenario is missing variable ${baselineVariable.id}`);
    const baselineValue = toBaseEngineeringValue(baselineVariable.value, baselineVariable.unitId, registry);
    const candidateValue = toBaseEngineeringValue(candidateVariable.value, candidateVariable.unitId, registry);
    const delta = candidateValue - baselineValue;
    return {
      variableId: baselineVariable.id,
      role: baselineVariable.role === "derived" ? "output" : "input",
      dimension: baselineVariable.dimension,
      unitId: getEngineeringUnit(baselineVariable.unitId, registry).id,
      baselineValue,
      candidateValue,
      delta,
      relativePercent: baselineValue === 0 ? null : (delta / Math.abs(baselineValue)) * 100,
      changed: !numbersEquivalent(baselineValue, candidateValue)
    };
  });
}

export function duplicateScenario(
  set: EngineeringScenarioSet,
  sourceId: string,
  newId: string,
  newName: string,
  variables: ReadonlyArray<EngineeringVariable>,
  registry: EngineeringUnitRegistry = ENGINEERING_UNIT_REGISTRY
): EngineeringScenarioSet {
  const valid = validateScenarioSet(set, variables, registry);
  const source = valid.scenarios.find((scenario) => scenario.id === sourceId);
  if (!source) throw new Error(`Scenario ${sourceId} does not exist`);
  const targetId = requireIdentifier(newId, "new scenario id");
  if (valid.scenarios.some((scenario) => scenario.id === targetId)) {
    throw new Error(`Scenario ${targetId} already exists`);
  }
  return validateScenarioSet({
    ...valid,
    scenarios: [
      ...valid.scenarios,
      {
        version: 1,
        id: targetId,
        name: requireText(newName, "new scenario name", KERNEL_LIMITS.shortTextCharacters),
        kind: "named",
        overrides: structuredClone(source.overrides)
      }
    ]
  }, variables, registry);
}

export function renameScenario(
  set: EngineeringScenarioSet,
  scenarioId: string,
  newName: string,
  variables: ReadonlyArray<EngineeringVariable>,
  registry: EngineeringUnitRegistry = ENGINEERING_UNIT_REGISTRY
): EngineeringScenarioSet {
  const valid = validateScenarioSet(set, variables, registry);
  const id = requireIdentifier(scenarioId, "scenario id");
  if (!valid.scenarios.some((scenario) => scenario.id === id)) {
    throw new Error(`Scenario ${id} does not exist`);
  }
  const name = requireText(newName, "scenario name", KERNEL_LIMITS.shortTextCharacters).trim();
  if (name.length === 0) throw new Error("scenario name must not be empty");
  return validateScenarioSet({
    ...valid,
    scenarios: valid.scenarios.map((scenario) =>
      scenario.id === id ? { ...scenario, name } : scenario
    )
  }, variables, registry);
}

export function scenarioDeletionToken(scenarioId: string): string {
  return `delete-scenario:${requireIdentifier(scenarioId, "scenario id")}`;
}

export function deleteScenario(
  set: EngineeringScenarioSet,
  scenarioId: string,
  confirmationToken: string,
  variables: ReadonlyArray<EngineeringVariable>,
  registry: EngineeringUnitRegistry = ENGINEERING_UNIT_REGISTRY
): EngineeringScenarioSet {
  const valid = validateScenarioSet(set, variables, registry);
  const id = requireIdentifier(scenarioId, "scenario id");
  const scenario = valid.scenarios.find((candidate) => candidate.id === id);
  if (!scenario) throw new Error(`Scenario ${id} does not exist`);
  if (scenario.kind === "baseline" || id === valid.baselineId) {
    throw new Error("The baseline scenario cannot be deleted");
  }
  if (confirmationToken !== scenarioDeletionToken(id)) {
    throw new Error("Scenario deletion confirmation token is invalid");
  }
  return validateScenarioSet({
    ...valid,
    scenarios: valid.scenarios.filter((candidate) => candidate.id !== id)
  }, variables, registry);
}

function validateScenario(
  value: unknown,
  variableById: ReadonlyMap<string, EngineeringVariable>,
  registry: EngineeringUnitRegistry,
  path: string
): EngineeringScenario {
  const record = requireRecord(value, path);
  assertOnlyKeys(record, new Set(["version", "id", "name", "kind", "overrides"]), path);
  if (record.version !== 1) throw new Error(`${path}.version is unsupported`);
  if (record.kind !== "baseline" && record.kind !== "named") throw new Error(`${path}.kind is invalid`);
  const overridesRecord = requireRecord(record.overrides, `${path}.overrides`);
  if (Object.keys(overridesRecord).length > KERNEL_LIMITS.collectionEntries) {
    throw new Error(`${path}.overrides exceeds ${KERNEL_LIMITS.collectionEntries} entries`);
  }
  const overrides: Record<string, ScenarioOverride> = {};
  const overrideEntries = Object.entries(overridesRecord)
    .sort(([left], [right]) => compareOrdinal(left, right));
  for (const [variableIdValue, overrideValue] of overrideEntries) {
    const variableId = requireIdentifier(variableIdValue, `${path}.overrides key`);
    const variable = variableById.get(variableId);
    if (!variable) throw new Error(`${path}.overrides references missing variable ${variableId}`);
    const overrideRecord = requireRecord(overrideValue, `${path}.overrides.${variableId}`);
    assertOnlyKeys(overrideRecord, new Set(["value", "unitId"]), `${path}.overrides.${variableId}`);
    const unitId = requireIdentifier(overrideRecord.unitId, `${path}.overrides.${variableId}.unitId`);
    const unit = getEngineeringUnit(unitId, registry);
    if (unit.dimension !== variable.dimension) {
      throw new Error(`${path}.overrides.${variableId}.unitId has the wrong dimension`);
    }
    const override = {
      value: requireFiniteNumber(overrideRecord.value, `${path}.overrides.${variableId}.value`),
      unitId
    };
    const converted = convertEngineeringValue(override.value, unitId, variable.unitId, registry);
    const baseValue = toBaseEngineeringValue(converted, variable.unitId, registry);
    if (
      (variable.validRange.minimumBase !== undefined && baseValue < variable.validRange.minimumBase) ||
      (variable.validRange.maximumBase !== undefined && baseValue > variable.validRange.maximumBase)
    ) {
      throw new Error(`${path}.overrides.${variableId} is outside the variable valid range`);
    }
    defineSafe(overrides, variableId, override);
  }
  return {
    version: 1,
    id: requireIdentifier(record.id, `${path}.id`),
    name: requireText(record.name, `${path}.name`, KERNEL_LIMITS.shortTextCharacters),
    kind: record.kind,
    overrides
  };
}

function numbersEquivalent(left: number, right: number): boolean {
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= Number.EPSILON * scale * 16;
}
