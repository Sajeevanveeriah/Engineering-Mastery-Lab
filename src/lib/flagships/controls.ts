import {
  defaultPidParams,
  simulatePid,
  stepMetrics,
  type PidParams,
  type SimPoint,
  type StepMetrics
} from "../simulations/control";

function finite(name: string, value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be finite`);
  }
  return value;
}

function positive(name: string, value: number): number {
  finite(name, value);
  if (value <= 0) {
    throw new Error(`${name} must be greater than zero`);
  }
  return value;
}

export interface FirstOrderFixture {
  timeS: number;
  output: number;
  steadyState: number;
  remainingError: number;
}

/**
 * Analytical response of G(s) = gain / (tau*s + 1) to a constant step.
 * Input and output units are selected by the caller and must be consistent.
 */
export function firstOrderStepFixture(
  gain: number,
  timeConstantS: number,
  stepInput: number,
  timeS: number
): FirstOrderFixture {
  finite("gain", gain);
  positive("timeConstantS", timeConstantS);
  finite("stepInput", stepInput);
  finite("timeS", timeS);
  if (timeS < 0) {
    throw new Error("timeS must be greater than or equal to zero");
  }
  const steadyState = gain * stepInput;
  const output = steadyState * (1 - Math.exp(-timeS / timeConstantS));
  return { timeS, output, steadyState, remainingError: steadyState - output };
}

export type SecondOrderRegime = "underdamped" | "critically-damped" | "overdamped";

export interface SecondOrderFixture {
  timeS: number;
  output: number;
  steadyState: number;
  dampingRatio: number;
  naturalFrequencyRadPerS: number;
  regime: SecondOrderRegime;
}

export type StabilityClassification = "asymptotically-stable" | "marginal" | "unstable";

export interface SecondOrderStabilityAssessment {
  naturalFrequencyRadPerS: number;
  dampingRatio: number;
  classification: StabilityClassification;
  poles: Array<{ realPerS: number; imaginaryPerS: number }>;
  diagnosis: string;
}

/**
 * Classifies the poles of s^2 + 2*zeta*wn*s + wn^2.
 * This is a continuous-time canonical-model assessment, not proof of a
 * discretised controller or physical implementation.
 */
export function assessSecondOrderStability(
  naturalFrequencyRadPerS: number,
  dampingRatio: number
): SecondOrderStabilityAssessment {
  positive("naturalFrequencyRadPerS", naturalFrequencyRadPerS);
  finite("dampingRatio", dampingRatio);
  const wn = naturalFrequencyRadPerS;
  const realPerS = -dampingRatio * wn;
  const rootMagnitude = wn * Math.sqrt(Math.abs(dampingRatio * dampingRatio - 1));
  const poles = Math.abs(dampingRatio) >= 1
    ? [
        { realPerS: realPerS + rootMagnitude, imaginaryPerS: 0 },
        { realPerS: realPerS - rootMagnitude, imaginaryPerS: 0 }
      ]
    : [
        { realPerS, imaginaryPerS: rootMagnitude },
        { realPerS, imaginaryPerS: -rootMagnitude }
      ];
  const classification: StabilityClassification = dampingRatio > 0
    ? "asymptotically-stable"
    : dampingRatio === 0
      ? "marginal"
      : "unstable";
  const diagnosis = classification === "asymptotically-stable"
    ? "Both canonical continuous-time poles have negative real parts."
    : classification === "marginal"
      ? "The undamped poles lie on the imaginary axis; boundedness depends on the input and initial state."
      : "At least one canonical continuous-time pole has a positive real part.";
  return { naturalFrequencyRadPerS: wn, dampingRatio, classification, poles, diagnosis };
}

/**
 * Analytical response of the canonical second-order model
 * G(s) = gain*wn^2 / (s^2 + 2*zeta*wn*s + wn^2) to a constant step.
 */
export function secondOrderStepFixture(
  gain: number,
  naturalFrequencyRadPerS: number,
  dampingRatio: number,
  stepInput: number,
  timeS: number
): SecondOrderFixture {
  finite("gain", gain);
  positive("naturalFrequencyRadPerS", naturalFrequencyRadPerS);
  finite("dampingRatio", dampingRatio);
  if (dampingRatio < 0) {
    throw new Error("dampingRatio must be greater than or equal to zero");
  }
  finite("stepInput", stepInput);
  finite("timeS", timeS);
  if (timeS < 0) {
    throw new Error("timeS must be greater than or equal to zero");
  }

  const steadyState = gain * stepInput;
  const zeta = dampingRatio;
  const wn = naturalFrequencyRadPerS;
  let normalisedOutput: number;
  let regime: SecondOrderRegime;

  if (Math.abs(zeta - 1) <= 1e-12) {
    regime = "critically-damped";
    normalisedOutput = 1 - Math.exp(-wn * timeS) * (1 + wn * timeS);
  } else if (zeta < 1) {
    regime = "underdamped";
    const wd = wn * Math.sqrt(1 - zeta * zeta);
    normalisedOutput =
      1 -
      Math.exp(-zeta * wn * timeS) *
        (Math.cos(wd * timeS) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * timeS));
  } else {
    regime = "overdamped";
    const root = Math.sqrt(zeta * zeta - 1);
    const pole1 = -wn * (zeta - root);
    const pole2 = -wn * (zeta + root);
    normalisedOutput = 1 - (pole2 * Math.exp(pole1 * timeS) - pole1 * Math.exp(pole2 * timeS)) / (pole2 - pole1);
  }

  return {
    timeS,
    output: steadyState * normalisedOutput,
    steadyState,
    dampingRatio,
    naturalFrequencyRadPerS,
    regime
  };
}

export interface PidDiagnostic {
  points: SimPoint[];
  metrics: StepMetrics;
  saturatedSamples: number;
  saturationFraction: number;
  antiWindupStrategy: "conditional-integration";
  diagnosis: string[];
}

function validatePidParams(params: PidParams): void {
  const numericFields: (keyof PidParams)[] = [
    "kp",
    "ki",
    "kd",
    "setpoint",
    "disturbance",
    "disturbanceTime",
    "tau",
    "zeta",
    "dt",
    "duration",
    "uMin",
    "uMax"
  ];
  numericFields.forEach((field) => finite(String(field), params[field] as number));
  positive("tau", params.tau);
  positive("dt", params.dt);
  positive("duration", params.duration);
  if (params.zeta < 0) {
    throw new Error("zeta must be greater than or equal to zero");
  }
  if (params.uMin >= params.uMax) {
    throw new Error("uMin must be less than uMax");
  }
}

/**
 * Runs the existing PID engine and diagnoses actuator saturation. The existing
 * engine uses conditional integration: it reverses the just-added integral
 * term whenever the actuator clips.
 */
export function diagnosePid(params: PidParams = defaultPidParams): PidDiagnostic {
  validatePidParams(params);
  const points = simulatePid(params);
  const saturatedSamples = points.filter(
    (point) => Math.abs(point.u - params.uMin) <= 1e-12 || Math.abs(point.u - params.uMax) <= 1e-12
  ).length;
  const saturationFraction = points.length === 0 ? 0 : saturatedSamples / points.length;
  const metrics = stepMetrics(points, params.setpoint);
  const diagnosis: string[] = [];

  if (saturationFraction > 0) {
    diagnosis.push("Actuator saturation occurred; conditional integration limited integral windup.");
  }
  if (saturationFraction > 0.25) {
    diagnosis.push("Saturation dominated more than 25% of samples; review actuator range, setpoint, and gains.");
  }
  if (metrics.settlingTime === null) {
    diagnosis.push("The response did not settle inside the 2% band during the simulated duration.");
  }
  if (Math.abs(metrics.steadyStateError) > 0.02 * Math.max(1, Math.abs(params.setpoint))) {
    diagnosis.push("Steady-state error exceeded the 2% diagnostic threshold.");
  }
  if (diagnosis.length === 0) {
    diagnosis.push("No saturation or response-limit diagnostic was triggered.");
  }

  return {
    points,
    metrics,
    saturatedSamples,
    saturationFraction,
    antiWindupStrategy: "conditional-integration",
    diagnosis
  };
}
