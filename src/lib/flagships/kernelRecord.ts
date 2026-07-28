import {
  exportProjectBundle,
  getEngineeringUnit,
  toBaseEngineeringValue,
  validateDataset,
  validateEngineeringProject,
  type CalculationVariableSnapshot,
  type CalculationRecord,
  type EngineeringProject,
  type EngineeringVariable
} from "../kernel";
import { assessSampling } from "./embedded";
import type { FlagshipFixtureSummary } from "./fixtures";
import { rotationalLoadFixture } from "./mechanical";
import { fuseScalarPosition } from "./robotics";
import type { FlagshipDomain, FlagshipWorkflowSpecification } from "./types";

const FLAGSHIP_RECORDED_AT = "2026-01-01T00:00:00.000Z";

export interface FlagshipKernelPackage {
  project: EngineeringProject;
  calculation: CalculationRecord;
  bundle: string;
}

interface FlagshipKernelInput {
  id: string;
  label: string;
  description: string;
  value: number;
  unitId: string;
  minimumBase?: number;
  maximumBase?: number;
}

interface FlagshipKernelDefinition {
  outputMetricLabel: string;
  outputUnitId: string;
  equation: string;
  inputs: FlagshipKernelInput[];
  datasetUnitIds: Array<string | undefined>;
}

function fixtureUnitId(unit: string): string | null {
  const mapped: Record<string, string> = {
    normalised: "one",
    "1": "one",
    count: "one",
    m: "m",
    "m^2": "m2",
    Hz: "Hz",
    V: "V",
    W: "W",
    "N*m": "N.m",
    "N m": "N.m",
    Pa: "Pa"
  };
  return mapped[unit] ?? null;
}

const FLAGSHIP_KERNEL_DEFINITIONS: Record<FlagshipDomain, FlagshipKernelDefinition> = {
  controls: {
    outputMetricLabel: "Output at one time constant",
    outputUnitId: "one",
    equation: "y(t) = K u (1 - exp(-t / tau))",
    inputs: [
      {
        id: "controls-gain",
        label: "Process gain",
        description: "Steady-state output change per unit step input.",
        value: 1,
        unitId: "one"
      },
      {
        id: "controls-time-constant",
        label: "Time constant",
        description: "First-order response time constant.",
        value: 2,
        unitId: "s",
        minimumBase: 0
      },
      {
        id: "controls-step-input",
        label: "Step input",
        description: "Normalised input step applied at time zero.",
        value: 1,
        unitId: "one"
      },
      {
        id: "controls-evaluation-time",
        label: "Evaluation time",
        description: "Elapsed time at which the response is evaluated.",
        value: 2,
        unitId: "s",
        minimumBase: 0
      }
    ],
    datasetUnitIds: ["s", "one", "one", "one"]
  },
  "robotics-autonomy": {
    outputMetricLabel: "Kalman gain",
    outputUnitId: "one",
    equation: "P_pred = P_prior + Q; K = P_pred / (P_pred + R)",
    inputs: [
      {
        id: "robotics-prior-estimate",
        label: "Prior position estimate",
        description: "Position estimate before applying commanded motion.",
        value: 0,
        unitId: "m"
      },
      {
        id: "robotics-prior-covariance",
        label: "Prior position covariance",
        description: "Scalar prior position uncertainty.",
        value: 1,
        unitId: "m2",
        minimumBase: 0
      },
      {
        id: "robotics-commanded-delta",
        label: "Commanded position delta",
        description: "Commanded forward position change.",
        value: 1,
        unitId: "m"
      },
      {
        id: "robotics-process-variance",
        label: "Process variance",
        description: "Scalar process uncertainty added during prediction.",
        value: 0.25,
        unitId: "m2",
        minimumBase: 0
      },
      {
        id: "robotics-measurement",
        label: "Position measurement",
        description: "Measured position before bias correction.",
        value: 1.4,
        unitId: "m"
      },
      {
        id: "robotics-measurement-variance",
        label: "Measurement variance",
        description: "Scalar measurement uncertainty.",
        value: 0.25,
        unitId: "m2",
        minimumBase: 0
      },
      {
        id: "robotics-measurement-bias",
        label: "Measurement bias",
        description: "Known position bias removed from the measurement.",
        value: 0.1,
        unitId: "m"
      },
      {
        id: "robotics-slip-fraction",
        label: "Slip fraction",
        description: "Fraction of commanded motion lost to slip.",
        value: 10,
        unitId: "percent",
        minimumBase: 0,
        maximumBase: 1
      },
      {
        id: "robotics-measurement-age",
        label: "Measurement age",
        description: "Age of the measurement at the fusion instant.",
        value: 0.05,
        unitId: "s",
        minimumBase: 0
      },
      {
        id: "robotics-maximum-measurement-age",
        label: "Maximum measurement age",
        description: "Maximum accepted measurement age.",
        value: 0.1,
        unitId: "s",
        minimumBase: 0
      }
    ],
    datasetUnitIds: ["m", "m", "one", "m", undefined]
  },
  "embedded-electronics-sensing": {
    outputMetricLabel: "Nyquist frequency",
    outputUnitId: "Hz",
    equation: "f_N = f_s / 2",
    inputs: [
      {
        id: "embedded-signal-frequency",
        label: "Signal frequency",
        description: "Input signal component assessed for sampling aliasing.",
        value: 70,
        unitId: "Hz",
        minimumBase: 0
      },
      {
        id: "embedded-sample-frequency",
        label: "Sample frequency",
        description: "Sampling frequency used by the digital acquisition chain.",
        value: 100,
        unitId: "Hz",
        minimumBase: 0
      }
    ],
    datasetUnitIds: ["Hz", "Hz", undefined, "Hz", "V", "one"]
  },
  "mechanical-design-dynamics": {
    outputMetricLabel: "Required torque",
    outputUnitId: "N.m",
    equation: "T_required = T_load + J alpha",
    inputs: [
      {
        id: "mechanical-load-torque",
        label: "Load torque",
        description: "External resisting load torque.",
        value: 2,
        unitId: "N.m"
      },
      {
        id: "mechanical-load-inertia",
        label: "Load inertia",
        description: "Rotational inertia accelerated by the actuator.",
        value: 0.25,
        unitId: "kg.m2",
        minimumBase: 0
      },
      {
        id: "mechanical-angular-acceleration",
        label: "Angular acceleration",
        description: "Required angular acceleration of the load.",
        value: 4,
        unitId: "rad-per-s2"
      },
      {
        id: "mechanical-rotational-speed",
        label: "Rotational speed",
        description: "Operating speed used by the coupled power calculation.",
        value: 60,
        unitId: "rpm",
        minimumBase: 0
      }
    ],
    datasetUnitIds: ["N.m", "N.m", "rad-per-s", "W", "Pa", "m"]
  },
  "applied-ai-ml": {
    outputMetricLabel: "Train samples",
    outputUnitId: "one",
    equation: "n_train = floor(n_total r_train)",
    inputs: [
      {
        id: "ml-total-samples",
        label: "Total sample count",
        description: "Number of ordered synthetic samples in the dataset.",
        value: 10,
        unitId: "one",
        minimumBase: 3
      },
      {
        id: "ml-training-fraction",
        label: "Training fraction",
        description: "Fraction of samples assigned to the training partition.",
        value: 60,
        unitId: "percent",
        minimumBase: 0,
        maximumBase: 1
      },
      {
        id: "ml-validation-fraction",
        label: "Validation fraction",
        description: "Fraction of samples assigned to the validation partition.",
        value: 20,
        unitId: "percent",
        minimumBase: 0,
        maximumBase: 1
      },
      {
        id: "ml-test-fraction",
        label: "Test fraction",
        description: "Fraction of samples reserved for final testing.",
        value: 20,
        unitId: "percent",
        minimumBase: 0,
        maximumBase: 1
      }
    ],
    datasetUnitIds: [undefined, "one", undefined, undefined]
  }
};

function getRequiredSnapshot(
  definition: FlagshipKernelDefinition,
  snapshots: ReadonlyArray<CalculationVariableSnapshot>,
  id: string
): CalculationVariableSnapshot {
  const inputDefinition = definition.inputs.find((input) => input.id === id);
  const snapshot = snapshots.find((candidate) => candidate.variableId === id);
  if (!inputDefinition || !snapshot) {
    throw new Error(`Flagship calculation is missing input ${id}`);
  }
  if (snapshot.unitId !== inputDefinition.unitId) {
    throw new Error(`Flagship input ${id} must use ${inputDefinition.unitId}`);
  }
  return snapshot;
}

/**
 * Recomputes the primary flagship result exclusively from retained calculation
 * snapshots. The package builder uses this independent path to reject a fixture
 * whose displayed metric has drifted away from its recorded physical inputs.
 */
export function recomputeFlagshipPrimaryResult(
  domain: FlagshipDomain,
  snapshots: ReadonlyArray<CalculationVariableSnapshot>
): number {
  const definition = FLAGSHIP_KERNEL_DEFINITIONS[domain];
  if (snapshots.length !== definition.inputs.length) {
    throw new Error(`Flagship ${domain} must retain exactly ${definition.inputs.length} input snapshots`);
  }
  const input = (id: string) => getRequiredSnapshot(definition, snapshots, id);
  switch (domain) {
    case "controls": {
      const gain = input("controls-gain").baseValue;
      const timeConstantS = input("controls-time-constant").baseValue;
      const stepInput = input("controls-step-input").baseValue;
      const evaluationTimeS = input("controls-evaluation-time").baseValue;
      if (timeConstantS <= 0 || evaluationTimeS < 0) {
        throw new Error("Controls time constant must be positive and evaluation time must be non-negative");
      }
      return gain * stepInput * (1 - Math.exp(-evaluationTimeS / timeConstantS));
    }
    case "robotics-autonomy":
      return fuseScalarPosition({
        priorEstimateM: input("robotics-prior-estimate").baseValue,
        priorCovarianceM2: input("robotics-prior-covariance").baseValue,
        commandedDeltaM: input("robotics-commanded-delta").baseValue,
        processVarianceM2: input("robotics-process-variance").baseValue,
        measurementM: input("robotics-measurement").baseValue,
        measurementVarianceM2: input("robotics-measurement-variance").baseValue,
        measurementBiasM: input("robotics-measurement-bias").baseValue,
        slipFraction: input("robotics-slip-fraction").baseValue,
        measurementAgeS: input("robotics-measurement-age").baseValue,
        maximumMeasurementAgeS: input("robotics-maximum-measurement-age").baseValue
      }).kalmanGain;
    case "embedded-electronics-sensing":
      return assessSampling(
        input("embedded-signal-frequency").baseValue,
        input("embedded-sample-frequency").baseValue
      ).nyquistFrequencyHz;
    case "mechanical-design-dynamics":
      return rotationalLoadFixture(
        input("mechanical-load-torque").baseValue,
        input("mechanical-load-inertia").baseValue,
        input("mechanical-angular-acceleration").baseValue,
        input("mechanical-rotational-speed").value
      ).requiredTorqueNm;
    case "applied-ai-ml": {
      const sampleCount = input("ml-total-samples").baseValue;
      const trainFraction = input("ml-training-fraction").baseValue;
      const validationFraction = input("ml-validation-fraction").baseValue;
      const testFraction = input("ml-test-fraction").baseValue;
      if (!Number.isInteger(sampleCount) || sampleCount < 3) {
        throw new Error("ML total sample count must be an integer of at least three");
      }
      if (
        trainFraction <= 0 ||
        validationFraction <= 0 ||
        testFraction <= 0 ||
        Math.abs(trainFraction + validationFraction + testFraction - 1) > 1e-12
      ) {
        throw new Error("ML split fractions must be positive and sum to one");
      }
      const trainingSamples = Math.max(1, Math.floor(sampleCount * trainFraction));
      const validationEnd = Math.max(
        trainingSamples + 1,
        Math.floor(sampleCount * (trainFraction + validationFraction))
      );
      if (validationEnd >= sampleCount) {
        throw new Error("ML split fractions leave no test samples");
      }
      return trainingSamples;
    }
  }
}

function createInputVariable(
  input: FlagshipKernelInput,
  provenanceNote: string
): EngineeringVariable {
  const unit = getEngineeringUnit(input.unitId);
  return {
    version: 1,
    id: input.id,
    label: input.label,
    description: input.description,
    role: "input",
    dimension: unit.dimension,
    value: input.value,
    baseValue: toBaseEngineeringValue(input.value, input.unitId),
    unitId: input.unitId,
    validRange: {
      ...(input.minimumBase !== undefined ? { minimumBase: input.minimumBase } : {}),
      ...(input.maximumBase !== undefined ? { maximumBase: input.maximumBase } : {})
    },
    validation: { status: "valid", messages: [] },
    provenance: { kind: "manual", note: provenanceNote },
    assumptionStatus: "specified",
    createdAt: FLAGSHIP_RECORDED_AT,
    updatedAt: FLAGSHIP_RECORDED_AT
  };
}

function snapshotVariable(variable: EngineeringVariable): CalculationVariableSnapshot {
  return {
    variableId: variable.id,
    value: variable.value,
    baseValue: variable.baseValue,
    unitId: variable.unitId,
    dimension: variable.dimension
  };
}

function valuesEquivalent(left: number, right: number): boolean {
  return Math.abs(left - right) <= Math.max(1, Math.abs(left), Math.abs(right)) * 1e-12;
}

/**
 * Converts a deterministic flagship fixture into a validated Phase 2 project,
 * calculation record, notebook record, evidence graph, and portable bundle.
 * It retains the physical input snapshots and unit-bearing dataset columns
 * required to reproduce the primary numeric result.
 */
export function createFlagshipKernelPackage(
  workflow: FlagshipWorkflowSpecification,
  fixture: FlagshipFixtureSummary
): FlagshipKernelPackage {
  const definition = FLAGSHIP_KERNEL_DEFINITIONS[workflow.domain];
  const primaryMetric = fixture.metrics.find((metric) =>
    metric.label === definition.outputMetricLabel &&
    typeof metric.value === "number" &&
    fixtureUnitId(metric.unit) === definition.outputUnitId
  );
  if (!primaryMetric || typeof primaryMetric.value !== "number") {
    throw new Error(`Flagship fixture ${workflow.id} is missing its primary kernel metric`);
  }
  const unitId = definition.outputUnitId;
  const unit = getEngineeringUnit(unitId);
  const projectId = `${workflow.domain}-flagship`;
  const resultId = `${workflow.domain}-primary-result`;
  const calculationId = `${workflow.domain}-fixture-calculation`;
  const datasetId = `${workflow.domain}-fixture-dataset`;
  const validationId = `${workflow.domain}-fixture-validation`;
  const notebookId = `${workflow.domain}-fixture-notebook`;
  const evidenceId = `${workflow.domain}-fixture-evidence`;
  const inputVariables = definition.inputs.map((input) =>
    createInputVariable(input, fixture.provenance.sourceLabel)
  );
  const inputSnapshots = inputVariables.map(snapshotVariable);
  const recomputedValue = recomputeFlagshipPrimaryResult(workflow.domain, inputSnapshots);
  if (!valuesEquivalent(primaryMetric.value, recomputedValue)) {
    throw new Error(
      `Flagship fixture ${workflow.id} primary metric does not match its retained input snapshots`
    );
  }
  const variables: EngineeringVariable[] = [
    ...inputVariables,
    {
      version: 1,
      id: resultId,
      label: primaryMetric.label,
      description: fixture.textAlternative,
      role: "derived",
      dimension: unit.dimension,
      value: primaryMetric.value,
      baseValue: toBaseEngineeringValue(primaryMetric.value, unitId),
      unitId,
      validRange: {},
      validation: { status: "valid", messages: [] },
      provenance: { kind: "calculation", referenceId: calculationId },
      assumptionStatus: "derived",
      createdAt: FLAGSHIP_RECORDED_AT,
      updatedAt: FLAGSHIP_RECORDED_AT,
      calculationVersionRef: {
        calculationId,
        algorithmId: workflow.id,
        algorithmVersion: workflow.schemaVersion
      }
    }
  ];
  if (definition.datasetUnitIds.length !== fixture.table.columns.length) {
    throw new Error(`Flagship fixture ${workflow.id} dataset unit mapping is incomplete`);
  }
  const columns = fixture.table.columns.map((label, columnIndex) => {
    const values = fixture.table.rows.map((row) => row[columnIndex]);
    const type = values.every((value) => typeof value === "number")
      ? "number"
      : values.every((value) => typeof value === "boolean")
        ? "boolean"
        : "text";
    const columnUnitId = definition.datasetUnitIds[columnIndex];
    if (type === "number" && columnUnitId === undefined) {
      throw new Error(`Flagship fixture ${workflow.id} numeric column ${label} has no engineering unit`);
    }
    if (type !== "number" && columnUnitId !== undefined) {
      throw new Error(`Flagship fixture ${workflow.id} non-numeric column ${label} cannot have a unit`);
    }
    return {
      id: `column-${columnIndex + 1}`,
      label,
      type,
      ...(columnUnitId !== undefined ? { unitId: columnUnitId } : {})
    } as const;
  });
  const dataset = validateDataset({
    version: 1,
    id: datasetId,
    name: `${workflow.title} primary deterministic table`,
    source: "manual",
    provenance: {
      sourceLabel: fixture.provenance.sourceLabel,
      licenceId: fixture.provenance.licenceId,
      learnerGenerated: fixture.provenance.learnerGenerated
    },
    columns,
    rows: fixture.table.rows.map((row) => Object.fromEntries(columns.map((column, columnIndex) => [
      column.id,
      column.type === "text" ? String(row[columnIndex]) : row[columnIndex]
    ])))
  });
  const calculation: CalculationRecord = {
    version: 1,
    id: calculationId,
    label: `${workflow.title} deterministic fixture`,
    equation: definition.equation,
    algorithmId: workflow.id,
    algorithmVersion: workflow.schemaVersion,
    inputs: inputSnapshots,
    outputs: [{
      variableId: resultId,
      value: primaryMetric.value,
      baseValue: toBaseEngineeringValue(primaryMetric.value, unitId),
      unitId,
      dimension: unit.dimension
    }],
    assumptions: workflow.equations.flatMap((equation) => equation.assumptions),
    warnings: [workflow.safetyBoundary],
    boundaries: workflow.equations.flatMap((equation) => equation.validWhen),
    sourceDatasetId: datasetId,
    scenarioId: "baseline",
    recordedAt: FLAGSHIP_RECORDED_AT,
    evidenceIds: [validationId],
    projectId
  };
  const project = validateEngineeringProject({
    version: 2,
    id: projectId,
    name: workflow.title,
    description: `${workflow.summary} This project contains a deterministic educational fixture record.`,
    revision: 1,
    createdAt: FLAGSHIP_RECORDED_AT,
    updatedAt: FLAGSHIP_RECORDED_AT,
    variables,
    calculations: [calculation],
    datasets: [dataset],
    scenarioSet: {
      version: 1,
      baselineId: "baseline",
      scenarios: [{ version: 1, id: "baseline", name: "Baseline fixture", kind: "baseline", overrides: {} }]
    },
    notebook: {
      version: 1,
      blocks: [
        {
          version: 1,
          id: `${workflow.domain}-fixture-assumption`,
          kind: "assumption",
          text: workflow.equations.flatMap((equation) => equation.assumptions).join("; ")
        },
        {
          version: 1,
          id: notebookId,
          kind: "calculation",
          text: fixture.textAlternative,
          referenceId: calculationId
        },
        {
          version: 1,
          id: `${workflow.domain}-fixture-dataset-note`,
          kind: "dataset",
          text: `Primary table provenance: ${fixture.provenance.sourceLabel}.`,
          referenceId: datasetId
        },
        {
          version: 1,
          id: `${workflow.domain}-fixture-reflection`,
          kind: "reflection",
          text: workflow.safetyBoundary
        }
      ]
    },
    evidenceGraph: {
      version: 1,
      nodes: [
        { id: projectId, kind: "project", label: workflow.title },
        { id: datasetId, kind: "dataset", label: `${workflow.title} deterministic table` },
        { id: calculationId, kind: "calculation", label: `${workflow.title} fixture calculation` },
        { id: resultId, kind: "result", label: primaryMetric.label },
        { id: validationId, kind: "validation", label: "Deterministic known-answer validation" },
        { id: notebookId, kind: "notebook", label: "Engineering notebook calculation record" },
        { id: evidenceId, kind: "evidence-record", label: "Portfolio-ready fixture evidence" }
      ],
      edges: [
        { from: projectId, to: datasetId, relation: "documents" },
        { from: datasetId, to: calculationId, relation: "supports" },
        { from: calculationId, to: resultId, relation: "derives" },
        { from: validationId, to: resultId, relation: "verifies" },
        { from: resultId, to: notebookId, relation: "documents" },
        { from: notebookId, to: evidenceId, relation: "supports" }
      ]
    }
  });
  return {
    project,
    calculation: project.calculations[0],
    bundle: exportProjectBundle(project)
  };
}
