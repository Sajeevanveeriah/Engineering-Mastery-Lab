import { describe, expect, it } from "vitest";
import {
  assessAdc,
  assessBinaryClassification,
  assessMechanicalLimit,
  assessSampling,
  assessSecondOrderStability,
  assessSensorBound,
  assessSensorInterface,
  assessSingleFeatureRegression,
  assessTiming,
  axialStressPa,
  cantileverTipDeflectionM,
  classImbalanceWarning,
  deterministicDatasetSplit,
  diagnosePid,
  differentialDriveTrajectory,
  educationalModelCard,
  factorOfSafety,
  firstOrderStepFixture,
  fuseScalarPosition,
  leakageWarnings,
  meanRegressionBaseline,
  movingAverage,
  rotationalLoadFixture,
  runCheckedFsm,
  secondOrderStepFixture,
  trajectoryTrackingMetrics,
  worstCaseToleranceStack,
  type DatasetRow
} from "../lib/flagships";
import { defaultPidParams } from "../lib/simulations/control";
import { trafficLightFsm } from "../lib/simulations/embedded";

describe("controls flagship depth", () => {
  it("matches first-order analytical fixtures", () => {
    const initial = firstOrderStepFixture(2, 4, 3, 0);
    const atTau = firstOrderStepFixture(2, 4, 3, 4);
    expect(initial.output).toBe(0);
    expect(initial.steadyState).toBe(6);
    expect(atTau.output).toBeCloseTo(6 * (1 - Math.exp(-1)), 12);
    expect(atTau.remainingError).toBeCloseTo(6 * Math.exp(-1), 12);
  });

  it("covers underdamped, critical, and overdamped second-order regimes", () => {
    const under = secondOrderStepFixture(1, 2, 0.5, 1, 1);
    const critical = secondOrderStepFixture(1, 2, 1, 1, 1);
    const over = secondOrderStepFixture(1, 2, 2, 1, 1);
    expect(under.regime).toBe("underdamped");
    expect(critical.regime).toBe("critically-damped");
    expect(over.regime).toBe("overdamped");
    expect([under.output, critical.output, over.output].every(Number.isFinite)).toBe(true);
    expect(secondOrderStepFixture(1, 2, 0.5, 1, 0).output).toBeCloseTo(0);
  });

  it("rejects invalid time and damping domains", () => {
    expect(() => firstOrderStepFixture(1, 0, 1, 1)).toThrow(/timeConstantS/);
    expect(() => secondOrderStepFixture(1, 2, -0.1, 1, 1)).toThrow(/dampingRatio/);
    expect(() => secondOrderStepFixture(1, 2, 0.5, 1, -1)).toThrow(/timeS/);
  });

  it("classifies canonical second-order stability from independently checked poles", () => {
    const stable = assessSecondOrderStability(2, 0.5);
    expect(stable.classification).toBe("asymptotically-stable");
    expect(stable.poles[0].realPerS).toBeCloseTo(-1, 12);
    expect(Math.abs(stable.poles[0].imaginaryPerS)).toBeCloseTo(Math.sqrt(3), 12);
    expect(assessSecondOrderStability(2, 0).classification).toBe("marginal");
    expect(assessSecondOrderStability(2, -0.5).classification).toBe("unstable");
  });

  it("reports saturation and the conditional-integration anti-windup strategy", () => {
    const diagnostic = diagnosePid({
      ...defaultPidParams,
      kp: 100,
      ki: 20,
      setpoint: 10,
      uMin: -1,
      uMax: 1,
      duration: 1
    });
    expect(diagnostic.saturatedSamples).toBeGreaterThan(0);
    expect(diagnostic.saturationFraction).toBeGreaterThan(0.25);
    expect(diagnostic.antiWindupStrategy).toBe("conditional-integration");
    expect(diagnostic.diagnosis.join(" ")).toMatch(/saturation/i);
    expect(diagnostic.points[0]).toMatchObject({ t: 0, pv: 0 });
  });
});

describe("robotics flagship depth", () => {
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

  it("performs the deterministic scalar covariance update in SI units", () => {
    const result = fuseScalarPosition(fusionInput);
    expect(result.predictedEstimateM).toBeCloseTo(0.9, 12);
    expect(result.predictedCovarianceM2).toBeCloseTo(1.25, 12);
    expect(result.correctedMeasurementM).toBeCloseTo(1.3, 12);
    expect(result.kalmanGain).toBeCloseTo(1.25 / 1.5, 12);
    expect(result.posteriorEstimateM).toBeCloseTo(1.2333333333333334, 12);
    expect(result.posteriorCovarianceM2).toBeCloseTo(1.25 / 6, 12);
    expect(result.measurementAccepted).toBe(true);
  });

  it("rejects delayed measurements without changing the prediction", () => {
    const result = fuseScalarPosition({ ...fusionInput, measurementAgeS: 0.2 });
    expect(result.measurementAccepted).toBe(false);
    expect(result.kalmanGain).toBe(0);
    expect(result.posteriorEstimateM).toBe(result.predictedEstimateM);
    expect(result.posteriorCovarianceM2).toBe(result.predictedCovarianceM2);
    expect(result.diagnostics.join(" ")).toMatch(/age exceeded/);
  });

  it("rejects invalid covariance and slip states", () => {
    expect(() => fuseScalarPosition({ ...fusionInput, priorCovarianceM2: -0.1 })).toThrow(/priorCovarianceM2/);
    expect(() => fuseScalarPosition({ ...fusionInput, slipFraction: 1.1 })).toThrow(/slipFraction/);
    expect(() =>
      fuseScalarPosition({
        ...fusionInput,
        priorCovarianceM2: 0,
        processVarianceM2: 0,
        measurementVarianceM2: 0
      })
    ).toThrow(/cannot both be zero/);
  });

  it("reuses differential-drive motion deterministically", () => {
    const input = {
      initialPose: { x: 0, y: 0, theta: 0 },
      leftVelocityMPerS: 1,
      rightVelocityMPerS: 1,
      wheelBaseM: 0.4,
      timeStepS: 0.25,
      steps: 4
    };
    expect(differentialDriveTrajectory(input)).toEqual(differentialDriveTrajectory(input));
    expect(differentialDriveTrajectory(input).at(-1)).toEqual({ timeS: 1, xM: 1, yM: 0, thetaRad: 0 });

    const curved = differentialDriveTrajectory({
      ...input,
      leftVelocityMPerS: 0,
      rightVelocityMPerS: 1,
      wheelBaseM: 1,
      timeStepS: 1,
      steps: 1
    }).at(-1)!;
    expect(curved.xM).toBeCloseTo(0.5 * Math.sin(1), 12);
    expect(curved.yM).toBeCloseTo(0.5 * (1 - Math.cos(1)), 12);
    expect(curved.thetaRad).toBeCloseTo(1, 12);
  });

  it("calculates time-aligned trajectory metrics", () => {
    const reference = [
      { timeS: 0, xM: 0, yM: 0 },
      { timeS: 1, xM: 1, yM: 0 },
      { timeS: 2, xM: 2, yM: 0 }
    ];
    const actual = [
      { timeS: 0, xM: 0, yM: 0 },
      { timeS: 1, xM: 1, yM: 1 },
      { timeS: 2, xM: 2, yM: 0 }
    ];
    const metrics = trajectoryTrackingMetrics(reference, actual);
    expect(metrics.rmsPositionErrorM).toBeCloseTo(Math.sqrt(1 / 3), 12);
    expect(metrics.maximumPositionErrorM).toBe(1);
    expect(metrics.terminalPositionErrorM).toBe(0);
    expect(metrics.referencePathLengthM).toBe(2);
    expect(metrics.actualPathLengthM).toBeCloseTo(2 * Math.sqrt(2), 12);
    expect(() => trajectoryTrackingMetrics(reference, actual.slice(0, 2))).toThrow(/equal sample counts/);
  });
});

describe("embedded flagship depth", () => {
  it("reports Nyquist-safe and aliased sinusoidal components", () => {
    const safe = assessSampling(20, 100);
    const aliased = assessSampling(70, 100);
    expect(safe.isNyquistSatisfied).toBe(true);
    expect(safe.aliasFrequencyHz).toBe(20);
    expect(aliased.isNyquistSatisfied).toBe(false);
    expect(aliased.aliasFrequencyHz).toBe(30);
    expect(assessSampling(50, 100).isNyquistSatisfied).toBe(false);
    expect(assessSampling(49.999, 100).isNyquistSatisfied).toBe(true);
    expect(assessSampling(50.001, 100).isNyquistSatisfied).toBe(false);
    expect(() => assessSampling(1, 0)).toThrow(/sampleFrequencyHz/);
  });

  it("calculates low-voltage power and resistive interface assumptions", () => {
    const assessment = assessSensorInterface({
      supplyVoltageV: 3.3,
      activeCurrentA: 0.01,
      unloadedHighVoltageV: 3,
      receiverHighThresholdV: 2,
      sourceResistanceOhm: 100,
      receiverInputResistanceOhm: 100_000
    });
    expect(assessment.activePowerW).toBeCloseTo(0.033, 12);
    expect(assessment.loadedHighVoltageV).toBeCloseTo(3 * 100_000 / 100_100, 12);
    expect(assessment.loadedHighMarginV).toBeGreaterThan(0);
    expect(assessment.compatible).toBe(true);
    expect(assessSensorInterface({
      ...assessment,
      unloadedHighVoltageV: 1.5,
      receiverHighThresholdV: 2
    }).compatible).toBe(false);
    expect(() => assessSensorInterface({
      ...assessment,
      unloadedHighVoltageV: 4
    })).toThrow(/Logic voltages/);
  });

  it("filters a fixed series deterministically", () => {
    expect(movingAverage([1, 2, 3, 4], 2)).toEqual([1, 1.5, 2.5, 3.5]);
    expect(movingAverage([1, 2, 3, 4], 2)).toEqual(movingAverage([1, 2, 3, 4], 2));
    expect(() => movingAverage([1], 0)).toThrow(/windowSamples/);
  });

  it("reuses ideal ADC quantisation and exposes clipping", () => {
    const mid = assessAdc(1.65, 3.3, 12);
    expect(mid.code).toBe(2048);
    expect(mid.quantisedVoltageV).toBeCloseTo(1.65, 12);
    expect(mid.clipped).toBe(false);
    expect(assessAdc(4, 3.3, 12).clipped).toBe(true);
    expect(() => assessAdc(1, 3.3, 25)).toThrow(/bits/);
  });

  it("assesses periodic timing and deadline violations", () => {
    const passing = assessTiming([
      { id: "sample", worstCaseExecutionTimeS: 0.001, periodS: 0.01, deadlineS: 0.005 },
      { id: "filter", worstCaseExecutionTimeS: 0.002, periodS: 0.02, deadlineS: 0.004 }
    ]);
    expect(passing.utilisation).toBeCloseTo(0.2, 12);
    expect(passing.withinUtilisationLimit).toBe(true);
    expect(passing.deadlineViolations).toEqual([]);
    const failing = assessTiming(
      [{ id: "blocked", worstCaseExecutionTimeS: 0.02, periodS: 0.02, deadlineS: 0.01 }],
      0.8
    );
    expect(failing.withinUtilisationLimit).toBe(false);
    expect(failing.deadlineViolations).toEqual(["blocked"]);
  });

  it("handles sensor bounds and checked fault-state traces", () => {
    const bound = { minimum: -40, maximum: 125, unit: "degC" };
    expect(assessSensorBound(25, bound).status).toBe("valid");
    expect(assessSensorBound(-50, bound).status).toBe("below-range");
    expect(assessSensorBound(130, bound).status).toBe("above-range");
    expect(assessSensorBound(Number.NaN, bound).status).toBe("invalid");
    const trace = runCheckedFsm(trafficLightFsm, ["timer", "fault", "reset"]);
    expect(trace.trace).toEqual(["RED", "GREEN", "FAULT", "RED"]);
    expect(trace.reachedFault).toBe(true);
  });
});

describe("mechanical flagship depth", () => {
  it("reconciles torque, angular speed, and power in SI units", () => {
    const result = rotationalLoadFixture(2, 0.25, 4, 60);
    expect(result.accelerationTorqueNm).toBe(1);
    expect(result.requiredTorqueNm).toBe(3);
    expect(result.angularSpeedRadPerS).toBeCloseTo(2 * Math.PI, 12);
    expect(result.requiredPowerW).toBeCloseTo(6 * Math.PI, 12);
    expect(() => rotationalLoadFixture(2, -0.01, 4, 60)).toThrow(/loadInertiaKgM2/);
  });

  it("calculates axial stress, deflection, and factor of safety", () => {
    const stress = axialStressPa(1000, 0.001);
    expect(stress).toBe(1e6);
    expect(cantileverTipDeflectionM(100, 1, 200e9, 1e-6)).toBeCloseTo(1 / 6000, 12);
    expect(factorOfSafety(250e6, stress)).toBe(250);
    expect(() => axialStressPa(1000, 0)).toThrow(/crossSectionAreaM2/);
    expect(() => factorOfSafety(250e6, 0)).toThrow(/actualStressPa/);
  });

  it("calculates worst-case tolerances and explicit limit margins", () => {
    const stack = worstCaseToleranceStack([
      { id: "a", nominalM: 0.1, plusToleranceM: 0.001, minusToleranceM: 0.002 },
      { id: "b", nominalM: 0.05, plusToleranceM: 0.002, minusToleranceM: 0.001 }
    ]);
    expect(stack.nominalM).toBeCloseTo(0.15, 12);
    expect(stack.minimumM).toBeCloseTo(0.147, 12);
    expect(stack.maximumM).toBeCloseTo(0.153, 12);
    expect(stack.totalToleranceM).toBeCloseTo(0.006, 12);
    expect(assessMechanicalLimit(0.15, 0.145, 0.155, "m").status).toBe("pass");
    expect(assessMechanicalLimit(0.16, 0.145, 0.155, "m").status).toBe("above-limit");
    expect(() =>
      worstCaseToleranceStack([
        { id: "bad", nominalM: 1, plusToleranceM: -0.1, minusToleranceM: 0.1 }
      ])
    ).toThrow(/tolerance magnitudes/);
  });
});

describe("applied AI and ML flagship depth", () => {
  const rows: DatasetRow[] = Array.from({ length: 10 }, (_, index) => ({
    id: `sample-${index + 1}`,
    features: { time: index },
    target: index * 2
  }));

  it("creates deterministic train, validation, and test partitions", () => {
    const split = deterministicDatasetSplit(rows);
    expect(split.train).toHaveLength(6);
    expect(split.validation).toHaveLength(2);
    expect(split.test).toHaveLength(2);
    expect(deterministicDatasetSplit(rows)).toEqual(split);
    expect(new Set([...split.train, ...split.validation, ...split.test].map((row) => row.id)).size).toBe(10);
    expect(() => deterministicDatasetSplit(rows.slice(0, 2))).toThrow(/at least three/);
  });

  it("calculates baseline and candidate regression metrics from separated rows", () => {
    const split = deterministicDatasetSplit(rows);
    const baseline = meanRegressionBaseline(split);
    expect(baseline.trainingMean).toBe(5);
    expect(baseline.validationMse).toBe(65);
    expect(baseline.testMse).toBe(145);
    const candidate = assessSingleFeatureRegression(split, "time");
    expect(candidate.model).toEqual({ slope: 2, intercept: 0 });
    expect(candidate.validationMse).toBe(0);
    expect(candidate.testMse).toBe(0);
    expect(candidate.testResiduals).toEqual([0, 0]);
  });

  it("warns about leakage, overlap, and imbalance", () => {
    const leakedRows = rows.map((row) => ({ ...row, features: { ...row.features, future_target: row.target } }));
    const leaked = deterministicDatasetSplit(leakedRows);
    expect(leakageWarnings(leaked).some((warning) => warning.code === "target-like-feature")).toBe(true);
    const overlap = {
      train: [rows[0]],
      validation: [rows[0]],
      test: [rows[1]]
    };
    expect(leakageWarnings(overlap).some((warning) => warning.code === "split-overlap")).toBe(true);
    expect(classImbalanceWarning([0, 0, 0, 0, 0, 1])?.code).toBe("class-imbalance");
    expect(classImbalanceWarning([0, 0, 1, 1])).toBeNull();
  });

  it("reports confusion counts, baseline accuracy, and model-card limits", () => {
    const assessment = assessBinaryClassification([0, 0, 0, 1], [0, 1, 1, 0], [0, 1, 0, 0]);
    expect(assessment.majorityClass).toBe(0);
    expect(assessment.majorityBaselineAccuracy).toBe(0.5);
    expect(assessment.confusion).toMatchObject({ tp: 1, fp: 0, tn: 2, fn: 1 });
    const card = educationalModelCard("Ten ordered synthetic vibration samples.", ["test MSE", "recall"]);
    expect(card.limitations.length).toBeGreaterThanOrEqual(3);
    expect(card.outOfScope.join(" ")).toMatch(/Safety-critical/);
  });
});
