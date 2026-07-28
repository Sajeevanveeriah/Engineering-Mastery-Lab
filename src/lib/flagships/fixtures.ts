import {
  assessSecondOrderStability,
  diagnosePid,
  firstOrderStepFixture,
  secondOrderStepFixture
} from "./controls";
import {
  assessAdc,
  assessSampling,
  assessSensorInterface,
  assessTiming,
  movingAverage,
  runCheckedFsm
} from "./embedded";
import {
  assessMechanicalLimit,
  axialStressPa,
  cantileverTipDeflectionM,
  factorOfSafety,
  rotationalLoadFixture,
  worstCaseToleranceStack
} from "./mechanical";
import {
  assessBinaryClassification,
  assessSingleFeatureRegression,
  classImbalanceWarning,
  deterministicDatasetSplit,
  educationalModelCard,
  leakageWarnings,
  meanRegressionBaseline,
  type DatasetRow
} from "./ml";
import {
  differentialDriveTrajectory,
  fuseScalarPosition,
  trajectoryTrackingMetrics
} from "./robotics";
import { getFlagshipWorkflow } from "./specifications";
import { defaultPidParams } from "../simulations/control";
import { trafficLightFsm } from "../simulations/embedded";

export interface FlagshipFixtureTable {
  columns: string[];
  rows: (string | number | boolean)[][];
}

export interface FlagshipFixtureSummary {
  workflowId: string;
  title: string;
  metrics: { label: string; value: number | string; unit: string }[];
  table: FlagshipFixtureTable;
  supportingTables: Array<{ title: string; table: FlagshipFixtureTable; textAlternative: string }>;
  provenance: {
    sourceLabel: string;
    classification: "analytical" | "synthetic";
    licenceId: string;
    learnerGenerated: boolean;
  };
  textAlternative: string;
}

function controlsFixture(workflowId: string, title: string): FlagshipFixtureSummary {
  const atZero = firstOrderStepFixture(1, 2, 1, 0);
  const atTau = firstOrderStepFixture(1, 2, 1, 2);
  const atFiveTau = firstOrderStepFixture(1, 2, 1, 10);
  const secondOrder = secondOrderStepFixture(1, 2, 0.5, 1, 1);
  const stability = assessSecondOrderStability(2, 0.5);
  const pid = diagnosePid({
    ...defaultPidParams,
    kp: 100,
    ki: 20,
    setpoint: 10,
    uMin: -1,
    uMax: 1,
    duration: 1
  });
  return {
    workflowId,
    title,
    metrics: [
      { label: "Output at one time constant", value: atTau.output, unit: "normalised" },
      { label: "Output at five time constants", value: atFiveTau.output, unit: "normalised" },
      { label: "Stability classification", value: stability.classification, unit: "" },
      { label: "Saturated sample fraction", value: pid.saturationFraction, unit: "1" }
    ],
    table: {
      columns: ["time (s)", "output", "steady state", "remaining error"],
      rows: [
        [atZero.timeS, atZero.output, atZero.steadyState, atZero.remainingError],
        [atTau.timeS, atTau.output, atTau.steadyState, atTau.remainingError],
        [atFiveTau.timeS, atFiveTau.output, atFiveTau.steadyState, atFiveTau.remainingError]
      ]
    },
    supportingTables: [
      {
        title: "Second-order poles and stability",
        table: {
          columns: ["case", "output at 1 s", "regime", "pole 1 real (1/s)", "pole 1 imaginary (1/s)", "classification"],
          rows: [[
            "zeta 0.5, wn 2 rad/s",
            secondOrder.output,
            secondOrder.regime,
            stability.poles[0].realPerS,
            stability.poles[0].imaginaryPerS,
            stability.classification
          ]]
        },
        textAlternative: `${stability.diagnosis} The underdamped analytical output at 1 s is ${secondOrder.output}.`
      },
      {
        title: "PID saturation and performance",
        table: {
          columns: ["overshoot (%)", "rise time (s)", "settling time (s)", "steady-state error", "saturated samples", "saturation fraction", "anti-windup"],
          rows: [[
            pid.metrics.overshootPct,
            pid.metrics.riseTime ?? "not reached",
            pid.metrics.settlingTime ?? "not settled",
            pid.metrics.steadyStateError,
            pid.saturatedSamples,
            pid.saturationFraction,
            pid.antiWindupStrategy
          ]]
        },
        textAlternative: pid.diagnosis.join(" ")
      }
    ],
    provenance: {
      sourceLabel: "Built-in deterministic analytical first-order fixture",
      classification: "analytical",
      licenceId: "MIT",
      learnerGenerated: false
    },
    textAlternative:
      "A unit-gain first-order response with a 2 s time constant rises from zero to about 63.2% at 2 s and 99.3% at 10 s. Supporting tables retain second-order pole stability and PID saturation and performance evidence."
  };
}

function roboticsFixture(workflowId: string, title: string): FlagshipFixtureSummary {
  const fusionInput = {
    priorEstimateM: 0,
    priorCovarianceM2: 1,
    commandedDeltaM: 1,
    processVarianceM2: 0.25,
    measurementM: 1.4,
    measurementVarianceM2: 0.25,
    measurementBiasM: 0.1,
    slipFraction: 0.1,
    measurementAgeS: 0.05,
    maximumMeasurementAgeS: 0.1
  };
  const result = fuseScalarPosition(fusionInput);
  const delayed = fuseScalarPosition({ ...fusionInput, measurementAgeS: 0.2 });
  const trajectory = differentialDriveTrajectory({
    initialPose: { x: 0, y: 0, theta: 0 },
    leftVelocityMPerS: 0,
    rightVelocityMPerS: 1,
    wheelBaseM: 1,
    timeStepS: 0.25,
    steps: 4
  });
  const tracking = trajectoryTrackingMetrics(
    [
      { timeS: 0, xM: 0, yM: 0 },
      { timeS: 1, xM: 1, yM: 0 },
      { timeS: 2, xM: 2, yM: 0 }
    ],
    [
      { timeS: 0, xM: 0, yM: 0 },
      { timeS: 1, xM: 1, yM: 0.1 },
      { timeS: 2, xM: 1.9, yM: 0.1 }
    ]
  );
  return {
    workflowId,
    title,
    metrics: [
      { label: "Kalman gain", value: result.kalmanGain, unit: "1" },
      { label: "Posterior estimate", value: result.posteriorEstimateM, unit: "m" },
      { label: "Posterior covariance", value: result.posteriorCovarianceM2, unit: "m^2" },
      { label: "Tracking RMS error", value: tracking.rmsPositionErrorM, unit: "m" }
    ],
    table: {
      columns: ["predicted estimate (m)", "corrected measurement (m)", "gain", "posterior estimate (m)", "accepted"],
      rows: [
        [
          result.predictedEstimateM,
          result.correctedMeasurementM,
          result.kalmanGain,
          result.posteriorEstimateM,
          result.measurementAccepted
        ]
      ]
    },
    supportingTables: [
      {
        title: "Exact differential-drive arc",
        table: {
          columns: ["time (s)", "x (m)", "y (m)", "heading (rad)"],
          rows: trajectory.map((point) => [
            point.timeS,
            point.xM,
            point.yM,
            point.thetaRad ?? "not recorded"
          ])
        },
        textAlternative: "Unequal wheel speeds follow the exact constant-curvature arc. Heading is retained with every pose sample."
      },
      {
        title: "Accepted and delayed fusion cases",
        table: {
          columns: ["case", "prediction (m)", "posterior (m)", "posterior covariance (m2)", "gain", "accepted"],
          rows: [
            ["in-age measurement", result.predictedEstimateM, result.posteriorEstimateM, result.posteriorCovarianceM2, result.kalmanGain, result.measurementAccepted],
            ["delayed measurement", delayed.predictedEstimateM, delayed.posteriorEstimateM, delayed.posteriorCovarianceM2, delayed.kalmanGain, delayed.measurementAccepted]
          ]
        },
        textAlternative: "The delayed measurement is rejected and leaves the slip-adjusted prediction and covariance unchanged."
      },
      {
        title: "Trajectory tracking errors",
        table: {
          columns: ["samples", "RMS error (m)", "maximum error (m)", "terminal error (m)", "path-length error (m)"],
          rows: [[
            tracking.sampleCount,
            tracking.rmsPositionErrorM,
            tracking.maximumPositionErrorM,
            tracking.terminalPositionErrorM,
            tracking.pathLengthErrorM
          ]]
        },
        textAlternative: "Position errors are paired at identical timestamps and reported as RMS, maximum, terminal, and path-length differences."
      }
    ],
    provenance: {
      sourceLabel: "Built-in deterministic synthetic scalar-fusion fixture",
      classification: "synthetic",
      licenceId: "MIT",
      learnerGenerated: false
    },
    textAlternative:
      "The fixture applies 10% slip and removes 0.1 m bias before accepting an in-age measurement and reducing covariance. Supporting tables retain exact differential-drive motion, a delayed-measurement failure, and trajectory tracking errors."
  };
}

function embeddedFixture(workflowId: string, title: string): FlagshipFixtureSummary {
  const sampling = assessSampling(70, 100);
  const boundarySampling = assessSampling(50, 100);
  const adc = assessAdc(1.65, 3.3, 12);
  const filtered = movingAverage([0, 1, 3, 2, 0], 3);
  const timing = assessTiming([
    { id: "sample", worstCaseExecutionTimeS: 0.001, periodS: 0.01, deadlineS: 0.005 },
    { id: "filter", worstCaseExecutionTimeS: 0.002, periodS: 0.02, deadlineS: 0.004 }
  ]);
  const fsm = runCheckedFsm(trafficLightFsm, ["timer", "fault", "reset", "invalid"]);
  const sensorInterface = assessSensorInterface({
    supplyVoltageV: 3.3,
    activeCurrentA: 0.01,
    unloadedHighVoltageV: 3,
    receiverHighThresholdV: 2,
    sourceResistanceOhm: 100,
    receiverInputResistanceOhm: 100_000
  });
  return {
    workflowId,
    title,
    metrics: [
      { label: "Nyquist frequency", value: sampling.nyquistFrequencyHz, unit: "Hz" },
      { label: "Aliased frequency", value: sampling.aliasFrequencyHz, unit: "Hz" },
      { label: "ADC code", value: adc.code, unit: "count" },
      { label: "Active sensor power", value: sensorInterface.activePowerW, unit: "W" },
      { label: "Periodic utilisation", value: timing.utilisation, unit: "1" }
    ],
    table: {
      columns: ["signal (Hz)", "sample (Hz)", "Nyquist satisfied", "alias (Hz)", "ADC input (V)", "ADC code"],
      rows: [
        [
          sampling.signalFrequencyHz,
          sampling.sampleFrequencyHz,
          sampling.isNyquistSatisfied,
          sampling.aliasFrequencyHz,
          adc.inputVoltageV,
          adc.code
        ]
      ]
    },
    supportingTables: [
      {
        title: "Strict Nyquist boundary",
        table: {
          columns: ["case", "signal (Hz)", "sample (Hz)", "strict criterion satisfied", "diagnosis"],
          rows: [
            ["aliased", sampling.signalFrequencyHz, sampling.sampleFrequencyHz, sampling.isNyquistSatisfied, sampling.diagnosis],
            ["exact boundary", boundarySampling.signalFrequencyHz, boundarySampling.sampleFrequencyHz, boundarySampling.isNyquistSatisfied, boundarySampling.diagnosis]
          ]
        },
        textAlternative: "A component exactly at half the sample rate is retained as a failed strict sampling criterion, not promoted as an engineering anti-alias margin."
      },
      {
        title: "Power and resistive interface assumptions",
        table: {
          columns: ["supply (V)", "active current (A)", "power (W)", "loaded high (V)", "threshold (V)", "margin (V)", "compatible"],
          rows: [[
            sensorInterface.supplyVoltageV,
            sensorInterface.activeCurrentA,
            sensorInterface.activePowerW,
            sensorInterface.loadedHighVoltageV,
            sensorInterface.receiverHighThresholdV,
            sensorInterface.loadedHighMarginV,
            sensorInterface.compatible
          ]]
        },
        textAlternative: sensorInterface.diagnosis.join(" ")
      },
      {
        title: "Moving-average filter",
        table: {
          columns: ["sample", "raw", "filtered"],
          rows: [0, 1, 3, 2, 0].map((value, index) => [index, value, filtered[index]])
        },
        textAlternative: "A three-sample trailing moving average is applied to the fixed local sequence without hiding the raw samples."
      },
      {
        title: "Timing and fault-state trace",
        table: {
          columns: ["utilisation", "limit", "inside limit", "deadline violations", "state trace", "rejected events", "fault reached"],
          rows: [[
            timing.utilisation,
            timing.utilisationLimit,
            timing.withinUtilisationLimit,
            timing.deadlineViolations.join(", ") || "none",
            fsm.trace.join(" -> "),
            fsm.rejected.join(", ") || "none",
            fsm.reachedFault
          ]]
        },
        textAlternative: `${timing.diagnosis.join(" ")} The trace reaches the explicit fault state, resets, and retains the rejected event.`
      }
    ],
    provenance: {
      sourceLabel: "Built-in deterministic synthetic sensor-chain fixture",
      classification: "synthetic",
      licenceId: "MIT",
      learnerGenerated: false
    },
    textAlternative:
      "A 70 Hz component sampled at 100 Hz aliases to 30 Hz; a 1.65 V input on an ideal 12-bit, 3.3 V ADC maps to code 2048. Supporting tables retain strict boundary, filter, timing, state-machine, power, and low-voltage interface evidence."
  };
}

function mechanicalFixture(workflowId: string, title: string): FlagshipFixtureSummary {
  const rotational = rotationalLoadFixture(2, 0.25, 4, 60);
  const stress = axialStressPa(1000, 0.001);
  const deflection = cantileverTipDeflectionM(100, 1, 200e9, 1e-6);
  const safety = factorOfSafety(250e6, stress);
  const tolerance = worstCaseToleranceStack([
    { id: "shaft", nominalM: 0.1, plusToleranceM: 0.001, minusToleranceM: 0.001 },
    { id: "coupling", nominalM: 0.05, plusToleranceM: 0.002, minusToleranceM: 0.002 }
  ]);
  const interfaceLimit = assessMechanicalLimit(
    tolerance.nominalM,
    0.145,
    0.155,
    "m"
  );
  return {
    workflowId,
    title,
    metrics: [
      { label: "Required torque", value: rotational.requiredTorqueNm, unit: "N*m" },
      { label: "Required power", value: rotational.requiredPowerW, unit: "W" },
      { label: "Axial stress", value: stress, unit: "Pa" },
      { label: "Cantilever deflection", value: deflection, unit: "m" },
      { label: "Factor of safety", value: safety, unit: "1" }
    ],
    table: {
      columns: ["load torque (N*m)", "acceleration torque (N*m)", "speed (rad/s)", "power (W)", "stress (Pa)", "deflection (m)"],
      rows: [
        [
          rotational.loadTorqueNm,
          rotational.accelerationTorqueNm,
          rotational.angularSpeedRadPerS,
          rotational.requiredPowerW,
          stress,
          deflection
        ]
      ]
    },
    supportingTables: [
      {
        title: "Strength, stiffness, and model limits",
        table: {
          columns: ["axial force (N)", "area (m2)", "stress (Pa)", "allowable stress (Pa)", "factor of safety", "tip deflection (m)"],
          rows: [[1000, 0.001, stress, 250e6, safety, deflection]]
        },
        textAlternative: "The simple centric axial and small-deflection cantilever models retain their assumed geometry, material modulus, and excluded local effects."
      },
      {
        title: "Worst-case tolerance and interface limit",
        table: {
          columns: ["nominal (m)", "minimum (m)", "maximum (m)", "total tolerance (m)", "limit status", "nearest nominal margin (m)"],
          rows: [[
            tolerance.nominalM,
            tolerance.minimumM,
            tolerance.maximumM,
            tolerance.totalToleranceM,
            interfaceLimit.status,
            interfaceLimit.marginToNearestLimit
          ]]
        },
        textAlternative: "The term-by-term worst-case range is retained separately from the nominal interface-limit status; manufacturing capability is not inferred."
      }
    ],
    provenance: {
      sourceLabel: "Built-in deterministic analytical mechanical fixture",
      classification: "analytical",
      licenceId: "MIT",
      learnerGenerated: false
    },
    textAlternative:
      "The fixture adds 1 N m acceleration torque to 2 N m load torque, then reuses the shared SI angular-speed and power kernel and reports stress, deflection, factor of safety, tolerance, and limit evidence."
  };
}

function mlFixture(workflowId: string, title: string): FlagshipFixtureSummary {
  const rows: DatasetRow[] = Array.from({ length: 10 }, (_, index) => ({
    id: `sample-${index + 1}`,
    features: { time: index },
    target: index * 2
  }));
  const split = deterministicDatasetSplit(rows);
  const baseline = meanRegressionBaseline(split);
  const candidate = assessSingleFeatureRegression(split, "time");
  const classification = assessBinaryClassification(
    [0, 0, 0, 1],
    [0, 1, 1, 0],
    [0, 1, 0, 0]
  );
  const imbalance = classImbalanceWarning([0, 0, 0, 0, 0, 1]);
  const leaked = deterministicDatasetSplit(rows.map((row) => ({
    ...row,
    features: { ...row.features, future_target: row.target }
  })));
  const leakage = leakageWarnings(leaked);
  const modelCard = educationalModelCard(
    "Ten ordered synthetic linear samples with a fixed 60%, 20%, and 20% split.",
    ["validation MSE", "test MSE", "confusion counts"],
    [imbalance?.message ?? "No class-imbalance warning was triggered."]
  );
  return {
    workflowId,
    title,
    metrics: [
      { label: "Train samples", value: split.train.length, unit: "count" },
      { label: "Validation samples", value: split.validation.length, unit: "count" },
      { label: "Test samples", value: split.test.length, unit: "count" },
      { label: "Test baseline MSE", value: baseline.testMse, unit: "target-unit^2" },
      { label: "Test candidate MSE", value: candidate.testMse, unit: "target-unit^2" },
      { label: "Majority baseline accuracy", value: classification.majorityBaselineAccuracy, unit: "1" }
    ],
    table: {
      columns: ["partition", "sample count", "first ID", "last ID"],
      rows: [
        ["train", split.train.length, split.train[0].id, split.train[split.train.length - 1].id],
        ["validation", split.validation.length, split.validation[0].id, split.validation[split.validation.length - 1].id],
        ["test", split.test.length, split.test[0].id, split.test[split.test.length - 1].id]
      ]
    },
    supportingTables: [
      {
        title: "Baseline and candidate regression",
        table: {
          columns: ["model", "fit scope", "validation MSE", "test MSE", "slope", "intercept"],
          rows: [
            ["training-mean baseline", "train only", baseline.validationMse, baseline.testMse, "not applicable", baseline.trainingMean],
            ["single-feature linear candidate", "train only", candidate.validationMse, candidate.testMse, candidate.model.slope, candidate.model.intercept]
          ]
        },
        textAlternative: "The candidate and training-only mean baseline are evaluated on the same unchanged validation and test rows."
      },
      {
        title: "Held-out residuals",
        table: {
          columns: ["partition", "sample ID", "target", "residual"],
          rows: [
            ...split.validation.map((row, index) => ["validation", row.id, row.target, candidate.validationResiduals[index]]),
            ...split.test.map((row, index) => ["test", row.id, row.target, candidate.testResiduals[index]])
          ]
        },
        textAlternative: "Each validation and test residual maps one-to-one to its synthetic sample identifier."
      },
      {
        title: "Classification confusion counts",
        table: {
          columns: ["majority class", "majority baseline accuracy", "true positive", "false positive", "true negative", "false negative"],
          rows: [[
            classification.majorityClass,
            classification.majorityBaselineAccuracy,
            classification.confusion.tp,
            classification.confusion.fp,
            classification.confusion.tn,
            classification.confusion.fn
          ]]
        },
        textAlternative: "The confusion cells reconcile to the four held-out synthetic classification labels; rates are not shown without their counts."
      },
      {
        title: "Leakage, imbalance, and model-card limits",
        table: {
          columns: ["record", "status or limitation"],
          rows: [
            ["leakage diagnostic", leakage.map((warning) => warning.message).join(" ")],
            ["imbalance diagnostic", imbalance?.message ?? "No warning"],
            ["intended use", modelCard.intendedUse],
            ["data scope", modelCard.dataScope],
            ["limitations", modelCard.limitations.join(" ")],
            ["out of scope", modelCard.outOfScope.join(" ")]
          ]
        },
        textAlternative: "The deliberately target-like feature triggers a retained leakage warning, the imbalanced label fixture triggers a warning, and the model card bounds all claims to local educational comparison."
      }
    ],
    provenance: {
      sourceLabel: "Built-in deterministic synthetic linear dataset",
      classification: "synthetic",
      licenceId: "MIT",
      learnerGenerated: false
    },
    textAlternative:
      "Ten synthetic ordered samples split deterministically into six train, two validation, and two test samples before a training-only mean baseline and a linear candidate are scored. Residuals, confusion counts, leakage, imbalance, and model-card limits remain visible."
  };
}

export function runFlagshipFixtureSummary(workflowId: string): FlagshipFixtureSummary {
  const workflow = getFlagshipWorkflow(workflowId);
  if (!workflow) {
    throw new Error(`Unknown flagship workflow: ${workflowId}`);
  }
  switch (workflow.domain) {
    case "controls":
      return controlsFixture(workflow.id, workflow.title);
    case "robotics-autonomy":
      return roboticsFixture(workflow.id, workflow.title);
    case "embedded-electronics-sensing":
      return embeddedFixture(workflow.id, workflow.title);
    case "mechanical-design-dynamics":
      return mechanicalFixture(workflow.id, workflow.title);
    case "applied-ai-ml":
      return mlFixture(workflow.id, workflow.title);
  }
}
