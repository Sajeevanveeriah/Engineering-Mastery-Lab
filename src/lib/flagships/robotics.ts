import { diffDriveStep, type Pose } from "../simulations/robotics";

function finite(name: string, value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be finite`);
  }
  return value;
}

function nonNegative(name: string, value: number): number {
  finite(name, value);
  if (value < 0) {
    throw new Error(`${name} must be greater than or equal to zero`);
  }
  return value;
}

export interface ScalarFusionInput {
  priorEstimateM: number;
  priorCovarianceM2: number;
  commandedDeltaM: number;
  processVarianceM2: number;
  measurementM: number;
  measurementVarianceM2: number;
  measurementBiasM: number;
  slipFraction: number;
  measurementAgeS: number;
  maximumMeasurementAgeS: number;
}

export interface ScalarFusionResult {
  predictedEstimateM: number;
  predictedCovarianceM2: number;
  correctedMeasurementM: number;
  posteriorEstimateM: number;
  posteriorCovarianceM2: number;
  kalmanGain: number;
  measurementAccepted: boolean;
  diagnostics: string[];
}

/**
 * Deterministic scalar educational Kalman fixture. It is an explanatory
 * one-dimensional analogue, not a navigation or safety-certified estimator.
 */
export function fuseScalarPosition(input: ScalarFusionInput): ScalarFusionResult {
  finite("priorEstimateM", input.priorEstimateM);
  nonNegative("priorCovarianceM2", input.priorCovarianceM2);
  finite("commandedDeltaM", input.commandedDeltaM);
  nonNegative("processVarianceM2", input.processVarianceM2);
  finite("measurementM", input.measurementM);
  nonNegative("measurementVarianceM2", input.measurementVarianceM2);
  finite("measurementBiasM", input.measurementBiasM);
  finite("slipFraction", input.slipFraction);
  if (input.slipFraction < 0 || input.slipFraction > 1) {
    throw new Error("slipFraction must be between zero and one");
  }
  nonNegative("measurementAgeS", input.measurementAgeS);
  nonNegative("maximumMeasurementAgeS", input.maximumMeasurementAgeS);

  const predictedEstimateM = input.priorEstimateM + input.commandedDeltaM * (1 - input.slipFraction);
  const predictedCovarianceM2 = input.priorCovarianceM2 + input.processVarianceM2;
  const correctedMeasurementM = input.measurementM - input.measurementBiasM;
  const diagnostics: string[] = [];

  if (input.slipFraction > 0) {
    diagnostics.push("Commanded displacement was reduced by the stated wheel-slip fraction.");
  }
  if (input.measurementBiasM !== 0) {
    diagnostics.push("The stated measurement bias was removed before fusion.");
  }
  if (input.measurementAgeS > input.maximumMeasurementAgeS) {
    diagnostics.push("Measurement rejected because its age exceeded the configured limit.");
    return {
      predictedEstimateM,
      predictedCovarianceM2,
      correctedMeasurementM,
      posteriorEstimateM: predictedEstimateM,
      posteriorCovarianceM2: predictedCovarianceM2,
      kalmanGain: 0,
      measurementAccepted: false,
      diagnostics
    };
  }

  const innovationCovarianceM2 = predictedCovarianceM2 + input.measurementVarianceM2;
  if (innovationCovarianceM2 <= 0) {
    throw new Error("predicted and measurement covariance cannot both be zero");
  }
  const kalmanGain = predictedCovarianceM2 / innovationCovarianceM2;
  const posteriorEstimateM = predictedEstimateM + kalmanGain * (correctedMeasurementM - predictedEstimateM);
  const posteriorCovarianceM2 = (1 - kalmanGain) * predictedCovarianceM2;
  diagnostics.push("Measurement accepted and fused with the scalar covariance update.");

  return {
    predictedEstimateM,
    predictedCovarianceM2,
    correctedMeasurementM,
    posteriorEstimateM,
    posteriorCovarianceM2,
    kalmanGain,
    measurementAccepted: true,
    diagnostics
  };
}

export interface TrajectoryPoint {
  timeS: number;
  xM: number;
  yM: number;
  thetaRad?: number;
}

export interface TrajectoryTrackingMetrics {
  sampleCount: number;
  rmsPositionErrorM: number;
  maximumPositionErrorM: number;
  terminalPositionErrorM: number;
  referencePathLengthM: number;
  actualPathLengthM: number;
  pathLengthErrorM: number;
}

function pathLength(points: TrajectoryPoint[]): number {
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += Math.hypot(points[index].xM - points[index - 1].xM, points[index].yM - points[index - 1].yM);
  }
  return length;
}

function validateTrajectory(name: string, points: TrajectoryPoint[]): void {
  if (points.length === 0) {
    throw new Error(`${name} must contain at least one point`);
  }
  points.forEach((point, index) => {
    nonNegative(`${name}[${index}].timeS`, point.timeS);
    finite(`${name}[${index}].xM`, point.xM);
    finite(`${name}[${index}].yM`, point.yM);
    if (index > 0 && point.timeS <= points[index - 1].timeS) {
      throw new Error(`${name} timeS values must increase strictly`);
    }
  });
}

export function trajectoryTrackingMetrics(
  reference: TrajectoryPoint[],
  actual: TrajectoryPoint[]
): TrajectoryTrackingMetrics {
  validateTrajectory("reference", reference);
  validateTrajectory("actual", actual);
  if (reference.length !== actual.length) {
    throw new Error("reference and actual trajectories must have equal sample counts");
  }
  const errors = reference.map((point, index) => {
    if (Math.abs(point.timeS - actual[index].timeS) > 1e-9) {
      throw new Error("reference and actual timestamps must match");
    }
    return Math.hypot(point.xM - actual[index].xM, point.yM - actual[index].yM);
  });
  const referencePathLengthM = pathLength(reference);
  const actualPathLengthM = pathLength(actual);
  return {
    sampleCount: errors.length,
    rmsPositionErrorM: Math.sqrt(errors.reduce((sum, error) => sum + error * error, 0) / errors.length),
    maximumPositionErrorM: Math.max(...errors),
    terminalPositionErrorM: errors[errors.length - 1],
    referencePathLengthM,
    actualPathLengthM,
    pathLengthErrorM: actualPathLengthM - referencePathLengthM
  };
}

export interface DifferentialDriveFixtureInput {
  initialPose: Pose;
  leftVelocityMPerS: number;
  rightVelocityMPerS: number;
  wheelBaseM: number;
  timeStepS: number;
  steps: number;
}

export function differentialDriveTrajectory(input: DifferentialDriveFixtureInput): TrajectoryPoint[] {
  finite("initialPose.x", input.initialPose.x);
  finite("initialPose.y", input.initialPose.y);
  finite("initialPose.theta", input.initialPose.theta);
  finite("leftVelocityMPerS", input.leftVelocityMPerS);
  finite("rightVelocityMPerS", input.rightVelocityMPerS);
  if (!Number.isInteger(input.steps) || input.steps < 1) {
    throw new Error("steps must be a positive integer");
  }
  if (!Number.isFinite(input.wheelBaseM) || input.wheelBaseM <= 0) {
    throw new Error("wheelBaseM must be greater than zero");
  }
  if (!Number.isFinite(input.timeStepS) || input.timeStepS <= 0) {
    throw new Error("timeStepS must be greater than zero");
  }

  let pose = { ...input.initialPose };
  const points: TrajectoryPoint[] = [{ timeS: 0, xM: pose.x, yM: pose.y, thetaRad: pose.theta }];
  for (let step = 1; step <= input.steps; step += 1) {
    pose = diffDriveStep(
      pose,
      input.leftVelocityMPerS,
      input.rightVelocityMPerS,
      input.wheelBaseM,
      input.timeStepS
    );
    points.push({ timeS: step * input.timeStepS, xM: pose.x, yM: pose.y, thetaRad: pose.theta });
  }
  return points;
}
