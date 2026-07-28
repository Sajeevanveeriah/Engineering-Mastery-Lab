import {
  angularVelocityFromRpm,
  mechanicalPowerFromTorque
} from "../kernel/motorSizing";

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

export interface RotationalLoadFixture {
  loadTorqueNm: number;
  accelerationTorqueNm: number;
  requiredTorqueNm: number;
  angularSpeedRadPerS: number;
  requiredPowerW: number;
}

export function rotationalLoadFixture(
  loadTorqueNm: number,
  loadInertiaKgM2: number,
  angularAccelerationRadPerS2: number,
  speedRpm: number
): RotationalLoadFixture {
  finite("loadTorqueNm", loadTorqueNm);
  finite("loadInertiaKgM2", loadInertiaKgM2);
  if (loadInertiaKgM2 < 0) {
    throw new Error("loadInertiaKgM2 must be greater than or equal to zero");
  }
  finite("angularAccelerationRadPerS2", angularAccelerationRadPerS2);
  finite("speedRpm", speedRpm);
  if (speedRpm < 0) {
    throw new Error("speedRpm must be greater than or equal to zero");
  }
  const accelerationTorqueNm = loadInertiaKgM2 * angularAccelerationRadPerS2;
  const requiredTorqueNm = loadTorqueNm + accelerationTorqueNm;
  const angularSpeedRadPerS = angularVelocityFromRpm(speedRpm);
  return {
    loadTorqueNm,
    accelerationTorqueNm,
    requiredTorqueNm,
    angularSpeedRadPerS,
    requiredPowerW: mechanicalPowerFromTorque(Math.abs(requiredTorqueNm), angularSpeedRadPerS)
  };
}

export function axialStressPa(forceN: number, crossSectionAreaM2: number): number {
  finite("forceN", forceN);
  positive("crossSectionAreaM2", crossSectionAreaM2);
  return forceN / crossSectionAreaM2;
}

export function cantileverTipDeflectionM(
  endForceN: number,
  lengthM: number,
  elasticModulusPa: number,
  secondMomentAreaM4: number
): number {
  finite("endForceN", endForceN);
  positive("lengthM", lengthM);
  positive("elasticModulusPa", elasticModulusPa);
  positive("secondMomentAreaM4", secondMomentAreaM4);
  return (endForceN * lengthM ** 3) / (3 * elasticModulusPa * secondMomentAreaM4);
}

export function factorOfSafety(allowableStressPa: number, actualStressPa: number): number {
  positive("allowableStressPa", allowableStressPa);
  finite("actualStressPa", actualStressPa);
  if (actualStressPa === 0) {
    throw new Error("actualStressPa magnitude must be greater than zero");
  }
  return allowableStressPa / Math.abs(actualStressPa);
}

export interface ToleranceTerm {
  id: string;
  nominalM: number;
  plusToleranceM: number;
  minusToleranceM: number;
}

export interface ToleranceStack {
  nominalM: number;
  minimumM: number;
  maximumM: number;
  totalToleranceM: number;
}

export function worstCaseToleranceStack(terms: ToleranceTerm[]): ToleranceStack {
  if (terms.length === 0) {
    throw new Error("terms must contain at least one tolerance term");
  }
  const ids = new Set<string>();
  let nominalM = 0;
  let minimumM = 0;
  let maximumM = 0;
  for (const term of terms) {
    if (!term.id.trim() || ids.has(term.id)) {
      throw new Error("tolerance term ids must be non-empty and unique");
    }
    ids.add(term.id);
    finite(`${term.id}.nominalM`, term.nominalM);
    finite(`${term.id}.plusToleranceM`, term.plusToleranceM);
    finite(`${term.id}.minusToleranceM`, term.minusToleranceM);
    if (term.plusToleranceM < 0 || term.minusToleranceM < 0) {
      throw new Error("tolerance magnitudes must be greater than or equal to zero");
    }
    nominalM += term.nominalM;
    minimumM += term.nominalM - term.minusToleranceM;
    maximumM += term.nominalM + term.plusToleranceM;
  }
  return {
    nominalM,
    minimumM,
    maximumM,
    totalToleranceM: maximumM - minimumM
  };
}

export interface LimitAssessment {
  value: number;
  minimum: number;
  maximum: number;
  unit: string;
  status: "pass" | "below-limit" | "above-limit";
  marginToNearestLimit: number;
}

export function assessMechanicalLimit(value: number, minimum: number, maximum: number, unit: string): LimitAssessment {
  finite("value", value);
  finite("minimum", minimum);
  finite("maximum", maximum);
  if (minimum >= maximum) {
    throw new Error("minimum must be less than maximum");
  }
  if (!unit.trim()) {
    throw new Error("unit must not be empty");
  }
  if (value < minimum) {
    return { value, minimum, maximum, unit, status: "below-limit", marginToNearestLimit: value - minimum };
  }
  if (value > maximum) {
    return { value, minimum, maximum, unit, status: "above-limit", marginToNearestLimit: maximum - value };
  }
  return {
    value,
    minimum,
    maximum,
    unit,
    status: "pass",
    marginToNearestLimit: Math.min(value - minimum, maximum - value)
  };
}
