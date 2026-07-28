import { EngineeringProject, exportProjectBundle, validateEngineeringProject } from "./bundle";
import { EngineeringDataset } from "./datasets";
import { MotorSizingInput, MotorSizingResult, calculateMotorSizing } from "./motorSizing";
import {
  EngineeringScenario,
  ScenarioComparisonRow,
  compareScenarios,
  resolveScenarioVariables
} from "./scenarios";
import { CalculationRecord, CalculationVariableSnapshot, EngineeringVariable } from "./variables";
import { EngineeringDimension, toBaseEngineeringValue } from "./units";
import { requireUtcTimestamp } from "./validation";

export interface MotorSizingVerticalSlice {
  project: EngineeringProject;
  result: MotorSizingResult;
  alternateResult: MotorSizingResult;
  comparison: ScenarioComparisonRow[];
  bundle: string;
}

export function createMotorSizingVerticalSlice(
  timestamp = "2026-01-01T00:00:00.000Z"
): MotorSizingVerticalSlice {
  const recordedAt = requireUtcTimestamp(timestamp, "vertical slice timestamp");
  const projectId = "motor-sizing-study";
  const motorSizing: MotorSizingInput = {
    continuousLoadTorque: { value: 10, unitId: "N.m" },
    peakLoadTorque: { value: 20, unitId: "N.m" },
    continuousOutputSpeed: { value: 600, unitId: "rpm" },
    peakOutputSpeed: { value: 600, unitId: "rpm" },
    gearRatio: 2,
    drivetrainEfficiency: 0.8,
    loadInertia: { value: 0.5, unitId: "kg.m2" },
    angularAcceleration: { value: 4, unitId: "rad-per-s2" },
    accelerationDutyCycle: 0.25,
    safetyFactor: 1.5,
    recordedAt,
    projectId
  };
  const result = calculateMotorSizing(motorSizing);
  const alternateResult = calculateMotorSizing({
    ...motorSizing,
    continuousOutputSpeed: { value: 480, unitId: "rpm" },
    peakOutputSpeed: { value: 480, unitId: "rpm" }
  });
  const variables: EngineeringVariable[] = [
    variable({
      id: "continuous-load-torque",
      label: "Continuous load torque",
      role: "input",
      dimension: "torque",
      value: 10,
      unitId: "N.m",
      maximumBase: 100,
      assumptionStatus: "specified",
      provenance: { kind: "dataset", referenceId: "load-cases" },
      uncertainty: { kind: "uncertainty", plusMinus: 0.2, unitId: "N.m", confidencePercent: 95 },
      timestamp: recordedAt
    }),
    variable({
      id: "peak-load-torque",
      label: "Peak load torque",
      role: "input",
      dimension: "torque",
      value: 20,
      unitId: "N.m",
      maximumBase: 100,
      assumptionStatus: "specified",
      provenance: { kind: "dataset", referenceId: "load-cases" },
      timestamp: recordedAt
    }),
    variable({
      id: "continuous-output-speed",
      label: "Continuous output speed",
      role: "input",
      dimension: "angular-speed",
      value: 600,
      unitId: "rpm",
      maximumBase: 500,
      assumptionStatus: "specified",
      provenance: { kind: "dataset", referenceId: "load-cases" },
      timestamp: recordedAt
    }),
    variable({
      id: "peak-output-speed",
      label: "Peak output speed",
      role: "input",
      dimension: "angular-speed",
      value: 600,
      unitId: "rpm",
      maximumBase: 500,
      assumptionStatus: "specified",
      provenance: { kind: "dataset", referenceId: "load-cases" },
      timestamp: recordedAt
    }),
    variable({
      id: "gear-ratio",
      label: "Gear ratio",
      role: "assumption",
      dimension: "dimensionless",
      value: 2,
      unitId: "one",
      minimumBase: 0.000001,
      maximumBase: 1_000,
      assumptionStatus: "assumed",
      provenance: { kind: "manual", note: "Motor speed divided by output speed." },
      timestamp: recordedAt,
      warning: "Confirm the selected transmission ratio before design release."
    }),
    variable({
      id: "drivetrain-efficiency",
      label: "Drivetrain efficiency",
      role: "assumption",
      dimension: "dimensionless",
      value: 80,
      unitId: "percent",
      minimumBase: 0.000001,
      maximumBase: 1,
      assumptionStatus: "assumed",
      provenance: { kind: "manual", note: "Constant efficiency assumption." },
      timestamp: recordedAt,
      warning: "Replace the assumed efficiency with measured or manufacturer evidence."
    }),
    variable({
      id: "load-inertia",
      label: "Load inertia",
      role: "input",
      dimension: "rotational-inertia",
      value: 0.5,
      unitId: "kg.m2",
      minimumBase: 0,
      maximumBase: 100,
      assumptionStatus: "specified",
      provenance: { kind: "manual" },
      timestamp: recordedAt
    }),
    variable({
      id: "angular-acceleration",
      label: "Angular acceleration",
      role: "input",
      dimension: "angular-acceleration",
      value: 4,
      unitId: "rad-per-s2",
      minimumBase: 0,
      maximumBase: 1_000,
      assumptionStatus: "specified",
      provenance: { kind: "manual" },
      timestamp: recordedAt
    }),
    variable({
      id: "acceleration-duty-cycle",
      label: "Acceleration duty cycle",
      role: "assumption",
      dimension: "dimensionless",
      value: 25,
      unitId: "percent",
      minimumBase: 0,
      maximumBase: 1,
      assumptionStatus: "assumed",
      provenance: { kind: "manual" },
      timestamp: recordedAt,
      warning: "Confirm duty cycle against the intended motion profile."
    }),
    variable({
      id: "safety-factor",
      label: "Safety factor",
      role: "assumption",
      dimension: "dimensionless",
      value: 1.5,
      unitId: "one",
      minimumBase: 1,
      maximumBase: 100,
      assumptionStatus: "assumed",
      provenance: { kind: "manual" },
      timestamp: recordedAt
    }),
    derivedVariable(
      "continuous-motor-torque",
      "Continuous motor torque",
      "torque",
      result.continuous.motorTorqueNm,
      "N.m",
      recordedAt
    ),
    derivedVariable(
      "continuous-motor-speed",
      "Continuous motor speed",
      "angular-speed",
      result.continuous.motorSpeedRpm,
      "rpm",
      recordedAt
    ),
    derivedVariable(
      "continuous-motor-power",
      "Continuous motor mechanical power",
      "power",
      result.continuous.mechanicalPowerW,
      "W",
      recordedAt
    ),
    derivedVariable(
      "peak-motor-torque",
      "Peak motor torque",
      "torque",
      result.peak.motorTorqueNm,
      "N.m",
      recordedAt
    ),
    derivedVariable(
      "peak-motor-speed",
      "Peak motor speed",
      "angular-speed",
      result.peak.motorSpeedRpm,
      "rpm",
      recordedAt
    ),
    derivedVariable(
      "peak-motor-power",
      "Peak motor mechanical power",
      "power",
      result.peak.mechanicalPowerW,
      "W",
      recordedAt
    )
  ];

  const inputIds = [
    "continuous-load-torque",
    "peak-load-torque",
    "continuous-output-speed",
    "peak-output-speed",
    "gear-ratio",
    "drivetrain-efficiency",
    "load-inertia",
    "angular-acceleration",
    "acceleration-duty-cycle",
    "safety-factor"
  ];
  const outputIds = [
    "continuous-motor-torque",
    "continuous-motor-speed",
    "continuous-motor-power",
    "peak-motor-torque",
    "peak-motor-speed",
    "peak-motor-power"
  ];
  const byId = new Map(variables.map((item) => [item.id, item]));
  const calculation: CalculationRecord = {
    version: 1,
    id: "motor-sizing-result",
    label: "Motor sizing operating points",
    equation: "omega = 2 * pi * rpm / 60; P = torque * omega",
    algorithmId: result.algorithmId,
    algorithmVersion: result.algorithmVersion,
    inputs: inputIds.map((id) => snapshot(requiredVariable(byId, id))),
    outputs: outputIds.map((id) => snapshot(requiredVariable(byId, id))),
    assumptions: result.assumptions,
    warnings: result.warnings,
    boundaries: result.boundaries,
    sourceDatasetId: "load-cases",
    scenarioId: "baseline",
    recordedAt,
    evidenceIds: ["baseline", "load-cases"],
    projectId
  };
  const alternateInputValues = new Map<string, { value: number; unitId: string }>([
    ["continuous-output-speed", { value: 480, unitId: "rpm" }],
    ["peak-output-speed", { value: 480, unitId: "rpm" }]
  ]);
  const alternateOutputValues = new Map<string, { value: number; unitId: string }>([
    ["continuous-motor-torque", { value: alternateResult.continuous.motorTorqueNm, unitId: "N.m" }],
    ["continuous-motor-speed", { value: alternateResult.continuous.motorSpeedRpm, unitId: "rpm" }],
    ["continuous-motor-power", { value: alternateResult.continuous.mechanicalPowerW, unitId: "W" }],
    ["peak-motor-torque", { value: alternateResult.peak.motorTorqueNm, unitId: "N.m" }],
    ["peak-motor-speed", { value: alternateResult.peak.motorSpeedRpm, unitId: "rpm" }],
    ["peak-motor-power", { value: alternateResult.peak.mechanicalPowerW, unitId: "W" }]
  ]);
  const alternateCalculation: CalculationRecord = {
    ...calculation,
    id: "motor-sizing-reduced-speed",
    label: "Reduced-speed motor sizing operating points",
    inputs: inputIds.map((id) =>
      snapshotWithOverride(requiredVariable(byId, id), alternateInputValues.get(id))
    ),
    outputs: outputIds.map((id) =>
      snapshotWithOverride(requiredVariable(byId, id), alternateOutputValues.get(id))
    ),
    scenarioId: "reduced-speed",
    evidenceIds: ["load-cases", "reduced-speed"]
  };
  const dataset: EngineeringDataset = {
    version: 1,
    id: "load-cases",
    name: "Motor load cases",
    source: "manual",
    provenance: {
      sourceLabel: "Engineering Mastery Lab deterministic motor-sizing fixture",
      licenceId: "MIT",
      learnerGenerated: false
    },
    columns: [
      { id: "case", label: "Case", type: "text" },
      { id: "torque", label: "Output torque", type: "number", unitId: "N.m" },
      { id: "speed", label: "Output speed", type: "number", unitId: "rpm" }
    ],
    rows: [
      { case: "continuous", torque: 10, speed: 600 },
      { case: "peak", torque: 20, speed: 600 }
    ]
  };
  const project = validateEngineeringProject({
    version: 2,
    id: projectId,
    name: "Motor sizing study",
    description: "A deterministic engineering-kernel vertical slice for load, gearing and motor operating points.",
    revision: 1,
    createdAt: recordedAt,
    updatedAt: recordedAt,
    variables,
    datasets: [dataset],
    scenarioSet: {
      version: 1,
      baselineId: "baseline",
      scenarios: [
        { version: 1, id: "baseline", name: "Baseline", kind: "baseline", overrides: {} },
        {
          version: 1,
          id: "reduced-speed",
          name: "Reduced speed",
          kind: "named",
          overrides: {
            "continuous-output-speed": { value: 480, unitId: "rpm" },
            "peak-output-speed": { value: 480, unitId: "rpm" }
          }
        }
      ]
    },
    notebook: {
      version: 1,
      blocks: [
        {
          version: 1,
          id: "scope-note",
          kind: "note",
          text: "Size operating points only. A manufacturer motor selection is deliberately outside scope."
        },
        {
          version: 1,
          id: "duty-assumption-note",
          kind: "assumption",
          text: "Acceleration duty is represented as a declared RMS contribution."
        },
        {
          version: 1,
          id: "load-torque-variable-note",
          kind: "variable",
          text: "Continuous load torque is retained with its SI base value.",
          referenceId: "continuous-load-torque"
        },
        {
          version: 1,
          id: "scenario-comparison-note",
          kind: "scenario",
          text: "The reduced-speed scenario changes the two output-speed inputs.",
          referenceId: "reduced-speed"
        },
        {
          version: 1,
          id: "load-data-note",
          kind: "dataset",
          text: "Continuous and peak output load cases.",
          referenceId: "load-cases"
        },
        {
          version: 1,
          id: "calculation-note",
          kind: "calculation",
          text: "Reproducible SI motor sizing result.",
          referenceId: "motor-sizing-result"
        },
        {
          version: 1,
          id: "alternate-calculation-note",
          kind: "calculation",
          text: "Recomputed reduced-speed operating points.",
          referenceId: "motor-sizing-reduced-speed"
        },
        {
          version: 1,
          id: "power-evidence-note",
          kind: "evidence",
          text: "Continuous power is retained as a derived evidence node.",
          referenceId: "continuous-motor-power"
        },
        {
          version: 1,
          id: "operating-point-table-note",
          kind: "table",
          text: "The continuous and peak result rows are available as an accessible table.",
          referenceId: "motor-operating-point"
        },
        {
          version: 1,
          id: "engineering-reflection",
          kind: "reflection",
          text: "The result is a requirement calculation, not a commercial motor selection."
        }
      ]
    },
    evidenceGraph: {
      version: 1,
      nodes: [
        { id: "motor-sizing-study", kind: "project", label: "Motor sizing study" },
        { id: "requirements-review", kind: "milestone", label: "Requirements review" },
        { id: "load-cases", kind: "dataset", label: "Motor load cases" },
        { id: "baseline", kind: "scenario", label: "Baseline scenario" },
        { id: "reduced-speed", kind: "scenario", label: "Reduced-speed scenario" },
        { id: "duty-cycle-assumption", kind: "assumption", label: "Acceleration duty-cycle assumption" },
        { id: "motor-sizing-result", kind: "calculation", label: "Motor sizing result" },
        {
          id: "motor-sizing-reduced-speed",
          kind: "calculation",
          label: "Reduced-speed motor sizing result"
        },
        { id: "continuous-motor-power", kind: "variable", label: "Continuous motor power" },
        { id: "motor-operating-point", kind: "result", label: "Motor operating-point requirements" },
        { id: "known-answer-validation", kind: "validation", label: "Known-answer validation" },
        { id: "power-evidence-note", kind: "notebook", label: "Power evidence note" },
        { id: "power-evidence-record", kind: "evidence-record", label: "Motor power evidence record" },
        { id: "engineering-report", kind: "report", label: "Engineering report" }
      ],
      edges: [
        { from: "motor-sizing-study", to: "requirements-review", relation: "documents" },
        { from: "requirements-review", to: "load-cases", relation: "supports" },
        { from: "load-cases", to: "motor-sizing-result", relation: "supports" },
        { from: "baseline", to: "motor-sizing-result", relation: "supports" },
        { from: "duty-cycle-assumption", to: "motor-sizing-result", relation: "supports" },
        { from: "motor-sizing-result", to: "continuous-motor-power", relation: "derives" },
        { from: "motor-sizing-result", to: "motor-operating-point", relation: "derives" },
        { from: "load-cases", to: "motor-sizing-reduced-speed", relation: "supports" },
        { from: "reduced-speed", to: "motor-sizing-reduced-speed", relation: "supports" },
        {
          from: "motor-sizing-reduced-speed",
          to: "continuous-motor-power",
          relation: "derives"
        },
        { from: "continuous-motor-power", to: "power-evidence-note", relation: "documents" },
        { from: "known-answer-validation", to: "motor-operating-point", relation: "verifies" },
        { from: "motor-operating-point", to: "power-evidence-record", relation: "supports" },
        { from: "power-evidence-record", to: "engineering-report", relation: "documents" }
      ]
    },
    motorSizing,
    calculations: [calculation, alternateCalculation]
  });
  const baseline = requiredScenario(project.scenarioSet.scenarios, "baseline");
  const alternate = requiredScenario(project.scenarioSet.scenarios, "reduced-speed");
  return {
    project,
    result,
    alternateResult,
    comparison: compareMotorSizingProjectScenarios(project, baseline.id, alternate.id),
    bundle: exportProjectBundle(project)
  };
}

export function compareMotorSizingProjectScenarios(
  project: EngineeringProject,
  baselineScenarioId: string,
  candidateScenarioId: string
): ScenarioComparisonRow[] {
  const baseline = requiredScenario(project.scenarioSet.scenarios, baselineScenarioId);
  const candidate = requiredScenario(project.scenarioSet.scenarios, candidateScenarioId);
  return compareScenarios(
    project.variables,
    withComputedMotorSizingOutputs(
      project,
      baseline,
      calculateMotorSizingProjectScenario(project, baseline.id)
    ),
    withComputedMotorSizingOutputs(
      project,
      candidate,
      calculateMotorSizingProjectScenario(project, candidate.id)
    )
  );
}

export function calculateMotorSizingProjectScenario(
  project: EngineeringProject,
  scenarioId: string
): MotorSizingResult {
  const scenario = requiredScenario(project.scenarioSet.scenarios, scenarioId);
  const resolved = new Map(
    resolveScenarioVariables(project.variables, scenario).map((variableValue) => [
      variableValue.id,
      variableValue
    ])
  );
  const source = project.motorSizing;
  if (!source) throw new Error("Engineering project does not contain motor sizing inputs");
  const quantity = (id: string) => {
    const value = requiredVariable(resolved, id);
    return { value: value.value, unitId: value.unitId };
  };
  return calculateMotorSizing({
    continuousLoadTorque: quantity("continuous-load-torque"),
    peakLoadTorque: quantity("peak-load-torque"),
    continuousOutputSpeed: quantity("continuous-output-speed"),
    peakOutputSpeed: quantity("peak-output-speed"),
    gearRatio: requiredVariable(resolved, "gear-ratio").baseValue,
    drivetrainEfficiency: requiredVariable(resolved, "drivetrain-efficiency").baseValue,
    loadInertia: quantity("load-inertia"),
    angularAcceleration: quantity("angular-acceleration"),
    accelerationDutyCycle: requiredVariable(resolved, "acceleration-duty-cycle").baseValue,
    safetyFactor: requiredVariable(resolved, "safety-factor").baseValue,
    recordedAt: source.recordedAt,
    projectId: project.id
  });
}

function withComputedMotorSizingOutputs(
  project: EngineeringProject,
  scenario: EngineeringScenario,
  result: MotorSizingResult
): EngineeringScenario {
  const variableById = new Map(project.variables.map((variable) => [variable.id, variable]));
  const overrides = Object.fromEntries(
    Object.entries(scenario.overrides).filter(([variableId]) =>
      variableById.get(variableId)?.role !== "derived"
    )
  );
  return {
    ...structuredClone(scenario),
    overrides: {
      ...overrides,
      "continuous-motor-torque": {
        value: result.continuous.motorTorqueNm,
        unitId: "N.m"
      },
      "continuous-motor-speed": {
        value: result.continuous.motorSpeedRpm,
        unitId: "rpm"
      },
      "continuous-motor-power": {
        value: result.continuous.mechanicalPowerW,
        unitId: "W"
      },
      "peak-motor-torque": {
        value: result.peak.motorTorqueNm,
        unitId: "N.m"
      },
      "peak-motor-speed": {
        value: result.peak.motorSpeedRpm,
        unitId: "rpm"
      },
      "peak-motor-power": {
        value: result.peak.mechanicalPowerW,
        unitId: "W"
      }
    }
  };
}

function variable(input: {
  id: string;
  label: string;
  role: EngineeringVariable["role"];
  dimension: EngineeringDimension;
  value: number;
  unitId: string;
  minimumBase?: number;
  maximumBase?: number;
  assumptionStatus: EngineeringVariable["assumptionStatus"];
  provenance: EngineeringVariable["provenance"];
  uncertainty?: EngineeringVariable["uncertainty"];
  timestamp: string;
  warning?: string;
}): EngineeringVariable {
  const baseValue = toBaseEngineeringValue(input.value, input.unitId);
  return {
    version: 1,
    id: input.id,
    label: input.label,
    role: input.role,
    dimension: input.dimension,
    value: input.value,
    baseValue,
    unitId: input.unitId,
    validRange: {
      ...(input.minimumBase !== undefined ? { minimumBase: input.minimumBase } : {}),
      ...(input.maximumBase !== undefined ? { maximumBase: input.maximumBase } : {})
    },
    validation: input.warning
      ? { status: "warning", messages: [input.warning] }
      : { status: "valid", messages: [] },
    provenance: input.provenance,
    assumptionStatus: input.assumptionStatus,
    ...(input.uncertainty !== undefined ? { uncertainty: input.uncertainty } : {}),
    createdAt: input.timestamp,
    updatedAt: input.timestamp
  };
}

function derivedVariable(
  id: string,
  label: string,
  dimension: EngineeringDimension,
  value: number,
  unitId: string,
  timestamp: string
): EngineeringVariable {
  return {
    ...variable({
      id,
      label,
      role: "derived",
      dimension,
      value,
      unitId,
      minimumBase: 0,
      assumptionStatus: "derived",
      provenance: { kind: "calculation", referenceId: "motor-sizing-result" },
      timestamp
    }),
    calculationVersionRef: {
      calculationId: "motor-sizing-result",
      algorithmId: "motor-sizing",
      algorithmVersion: "1.0.0"
    }
  };
}

function snapshot(variableValue: EngineeringVariable): CalculationVariableSnapshot {
  return {
    variableId: variableValue.id,
    value: variableValue.value,
    baseValue: variableValue.baseValue,
    unitId: variableValue.unitId,
    dimension: variableValue.dimension
  };
}

function snapshotWithOverride(
  variableValue: EngineeringVariable,
  override?: { value: number; unitId: string }
): CalculationVariableSnapshot {
  if (!override) return snapshot(variableValue);
  return {
    variableId: variableValue.id,
    value: override.value,
    baseValue: toBaseEngineeringValue(override.value, override.unitId),
    unitId: override.unitId,
    dimension: variableValue.dimension
  };
}

function requiredVariable(
  variables: ReadonlyMap<string, EngineeringVariable>,
  id: string
): EngineeringVariable {
  const value = variables.get(id);
  if (!value) throw new Error(`Vertical slice variable ${id} is missing`);
  return value;
}

function requiredScenario(
  scenarios: ReadonlyArray<EngineeringScenario>,
  id: string
): EngineeringScenario {
  const value = scenarios.find((scenario) => scenario.id === id);
  if (!value) throw new Error(`Vertical slice scenario ${id} is missing`);
  return value;
}
