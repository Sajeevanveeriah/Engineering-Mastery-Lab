import {
  ENGINEERING_UNIT_REGISTRY,
  EngineeringDimension,
  EngineeringUnitRegistry,
  getEngineeringUnit,
  toBaseEngineeringValue
} from "./units";
import {
  assertOnlyKeys,
  requireFiniteNumber,
  requireIdentifier,
  requireRecord,
  requireText,
  requireUtcTimestamp
} from "./validation";

export interface UnitQuantity {
  value: number;
  unitId: string;
}

export interface MotorSizingInput {
  continuousLoadTorque: UnitQuantity;
  peakLoadTorque: UnitQuantity;
  continuousOutputSpeed: UnitQuantity;
  peakOutputSpeed: UnitQuantity;
  gearRatio: number;
  drivetrainEfficiency: number;
  loadInertia: UnitQuantity;
  angularAcceleration: UnitQuantity;
  accelerationDutyCycle: number;
  safetyFactor: number;
  recordedAt: string;
  projectId: string;
}

export interface MotorOperatingPoint {
  outputTorqueNm: number;
  motorTorqueNm: number;
  outputSpeedRpm: number;
  motorSpeedRpm: number;
  omegaRadPerSec: number;
  mechanicalPowerW: number;
}

export interface MotorSizingResult {
  algorithmId: "motor-sizing";
  algorithmVersion: "1.0.0";
  continuous: MotorOperatingPoint;
  peak: MotorOperatingPoint;
  accelerationTorqueNm: number;
  normalisedInputs: {
    continuousLoadTorqueNm: number;
    peakLoadTorqueNm: number;
    continuousOutputSpeedRpm: number;
    peakOutputSpeedRpm: number;
    loadInertiaKgM2: number;
    angularAccelerationRadPerSec2: number;
    gearRatio: number;
    drivetrainEfficiency: number;
    accelerationDutyCycle: number;
    safetyFactor: number;
  };
  assumptions: string[];
  boundaries: string[];
  warnings: string[];
  recordedAt: string;
  projectId: string;
}

export function angularVelocityFromRpm(rpm: number): number {
  const validRpm = requireFiniteNumber(rpm, "rpm");
  if (validRpm < 0) throw new Error("rpm must be non-negative");
  return 2 * Math.PI * validRpm / 60;
}

export function mechanicalPowerFromTorque(torqueNm: number, omegaRadPerSec: number): number {
  const torque = requireFiniteNumber(torqueNm, "torque");
  const omega = requireFiniteNumber(omegaRadPerSec, "angular velocity");
  if (torque < 0 || omega < 0) throw new Error("Torque and angular velocity must be non-negative");
  const power = torque * omega;
  if (!Number.isFinite(power)) throw new Error("Mechanical power is outside the supported numeric range");
  return power;
}

export function calculateMotorSizing(
  input: MotorSizingInput,
  registry: EngineeringUnitRegistry = ENGINEERING_UNIT_REGISTRY
): MotorSizingResult {
  const continuousLoadTorqueNm = requireQuantityBase(
    input.continuousLoadTorque,
    "torque",
    "continuousLoadTorque",
    registry
  );
  const peakLoadTorqueNm = requireQuantityBase(input.peakLoadTorque, "torque", "peakLoadTorque", registry);
  const continuousOutputSpeedRadPerSec = requireQuantityBase(
    input.continuousOutputSpeed,
    "angular-speed",
    "continuousOutputSpeed",
    registry
  );
  const peakOutputSpeedRadPerSec = requireQuantityBase(
    input.peakOutputSpeed,
    "angular-speed",
    "peakOutputSpeed",
    registry
  );
  const loadInertiaKgM2 = requireQuantityBase(input.loadInertia, "rotational-inertia", "loadInertia", registry);
  const angularAccelerationRadPerSec2 = requireQuantityBase(
    input.angularAcceleration,
    "angular-acceleration",
    "angularAcceleration",
    registry
  );
  if (
    continuousLoadTorqueNm < 0 ||
    peakLoadTorqueNm < 0 ||
    continuousOutputSpeedRadPerSec < 0 ||
    peakOutputSpeedRadPerSec < 0
  ) {
    throw new Error("Motor torque and speed inputs must be non-negative");
  }
  if (peakLoadTorqueNm < continuousLoadTorqueNm) {
    throw new Error("peakLoadTorque must not be less than continuousLoadTorque");
  }
  if (loadInertiaKgM2 < 0) throw new Error("loadInertia must be non-negative");
  if (angularAccelerationRadPerSec2 < 0) throw new Error("angularAcceleration must be non-negative");
  const gearRatio = requireFiniteNumber(input.gearRatio, "gearRatio");
  if (gearRatio <= 0) throw new Error("gearRatio must be greater than zero");
  const drivetrainEfficiency = requireFiniteNumber(input.drivetrainEfficiency, "drivetrainEfficiency");
  if (drivetrainEfficiency <= 0 || drivetrainEfficiency > 1) {
    throw new Error("drivetrainEfficiency must be greater than zero and at most one");
  }
  const accelerationDutyCycle = requireFiniteNumber(input.accelerationDutyCycle, "accelerationDutyCycle");
  if (accelerationDutyCycle < 0 || accelerationDutyCycle > 1) {
    throw new Error("accelerationDutyCycle must be from zero to one");
  }
  const safetyFactor = requireFiniteNumber(input.safetyFactor, "safetyFactor");
  if (safetyFactor < 1) throw new Error("safetyFactor must be at least one");
  const recordedAt = requireUtcTimestamp(input.recordedAt, "recordedAt");
  const projectId = requireIdentifier(input.projectId, "projectId");

  const accelerationTorqueNm = loadInertiaKgM2 * angularAccelerationRadPerSec2;
  const continuousOutputTorqueNm =
    Math.sqrt(continuousLoadTorqueNm ** 2 + accelerationDutyCycle * accelerationTorqueNm ** 2) *
    safetyFactor;
  const peakOutputTorqueNm = (peakLoadTorqueNm + accelerationTorqueNm) * safetyFactor;
  const continuousOutputSpeedRpm = continuousOutputSpeedRadPerSec * 60 / (2 * Math.PI);
  const peakOutputSpeedRpm = peakOutputSpeedRadPerSec * 60 / (2 * Math.PI);
  const continuous = createOperatingPoint(
    continuousOutputTorqueNm,
    continuousOutputSpeedRpm,
    gearRatio,
    drivetrainEfficiency
  );
  const peak = createOperatingPoint(
    peakOutputTorqueNm,
    peakOutputSpeedRpm,
    gearRatio,
    drivetrainEfficiency
  );

  return {
    algorithmId: "motor-sizing",
    algorithmVersion: "1.0.0",
    continuous,
    peak,
    accelerationTorqueNm,
    normalisedInputs: {
      continuousLoadTorqueNm,
      peakLoadTorqueNm,
      continuousOutputSpeedRpm,
      peakOutputSpeedRpm,
      loadInertiaKgM2,
      angularAccelerationRadPerSec2,
      gearRatio,
      drivetrainEfficiency,
      accelerationDutyCycle,
      safetyFactor
    },
    assumptions: [
      "Gear ratio is motor speed divided by output speed.",
      "Drivetrain efficiency is constant at both operating points.",
      "Acceleration torque is load inertia multiplied by angular acceleration.",
      "Continuous torque combines load and acceleration torque by an RMS duty model.",
      "Peak torque combines peak load and full acceleration torque.",
      "Safety factor is applied to output torque before conversion to motor torque.",
      "Motor product selection, thermal limits and manufacturer curves are outside this calculation."
    ],
    boundaries: [
      "omega = 2 * pi * rpm / 60",
      "P = torque * omega",
      "0 < drivetrain efficiency <= 1",
      "0 <= acceleration duty cycle <= 1",
      "load inertia and angular acceleration are non-negative"
    ],
    warnings: [],
    recordedAt,
    projectId
  };
}

export function validateMotorSizingInput(
  value: unknown,
  registry: EngineeringUnitRegistry = ENGINEERING_UNIT_REGISTRY
): MotorSizingInput {
  const record = requireRecord(value, "motor sizing input");
  assertOnlyKeys(record, new Set([
    "continuousLoadTorque",
    "peakLoadTorque",
    "continuousOutputSpeed",
    "peakOutputSpeed",
    "gearRatio",
    "drivetrainEfficiency",
    "loadInertia",
    "angularAcceleration",
    "accelerationDutyCycle",
    "safetyFactor",
    "recordedAt",
    "projectId"
  ]), "motor sizing input");
  const result: MotorSizingInput = {
    continuousLoadTorque: validateQuantity(record.continuousLoadTorque, "continuousLoadTorque"),
    peakLoadTorque: validateQuantity(record.peakLoadTorque, "peakLoadTorque"),
    continuousOutputSpeed: validateQuantity(record.continuousOutputSpeed, "continuousOutputSpeed"),
    peakOutputSpeed: validateQuantity(record.peakOutputSpeed, "peakOutputSpeed"),
    gearRatio: requireFiniteNumber(record.gearRatio, "gearRatio"),
    drivetrainEfficiency: requireFiniteNumber(record.drivetrainEfficiency, "drivetrainEfficiency"),
    loadInertia: validateQuantity(record.loadInertia, "loadInertia"),
    angularAcceleration: validateQuantity(record.angularAcceleration, "angularAcceleration"),
    accelerationDutyCycle: requireFiniteNumber(record.accelerationDutyCycle, "accelerationDutyCycle"),
    safetyFactor: requireFiniteNumber(record.safetyFactor, "safetyFactor"),
    recordedAt: requireUtcTimestamp(record.recordedAt, "recordedAt"),
    projectId: requireIdentifier(record.projectId, "projectId")
  };
  calculateMotorSizing(result, registry);
  return result;
}

function createOperatingPoint(
  outputTorqueNm: number,
  outputSpeedRpm: number,
  gearRatio: number,
  efficiency: number
): MotorOperatingPoint {
  const motorTorqueNm = outputTorqueNm / (gearRatio * efficiency);
  const motorSpeedRpm = outputSpeedRpm * gearRatio;
  const omegaRadPerSec = angularVelocityFromRpm(motorSpeedRpm);
  const mechanicalPowerW = mechanicalPowerFromTorque(motorTorqueNm, omegaRadPerSec);
  for (const [name, value] of Object.entries({
    outputTorqueNm,
    motorTorqueNm,
    outputSpeedRpm,
    motorSpeedRpm,
    omegaRadPerSec,
    mechanicalPowerW
  })) {
    if (!Number.isFinite(value)) throw new Error(`${name} is outside the supported numeric range`);
  }
  return {
    outputTorqueNm,
    motorTorqueNm,
    outputSpeedRpm,
    motorSpeedRpm,
    omegaRadPerSec,
    mechanicalPowerW
  };
}

function requireQuantityBase(
  value: UnitQuantity,
  expectedDimension: EngineeringDimension,
  path: string,
  registry: EngineeringUnitRegistry
): number {
  if (typeof value !== "object" || value === null) throw new Error(`${path} must be a unit-bearing quantity`);
  const displayValue = requireFiniteNumber(value.value, `${path}.value`);
  const unitId = requireText(value.unitId, `${path}.unitId`, 120);
  const unit = getEngineeringUnit(unitId, registry);
  if (unit.dimension !== expectedDimension) {
    throw new Error(`${path}.unitId must have ${expectedDimension} dimension`);
  }
  return toBaseEngineeringValue(displayValue, unitId, registry);
}

function validateQuantity(value: unknown, path: string): UnitQuantity {
  const record = requireRecord(value, path);
  assertOnlyKeys(record, new Set(["value", "unitId"]), path);
  return {
    value: requireFiniteNumber(record.value, `${path}.value`),
    unitId: requireText(record.unitId, `${path}.unitId`, 120)
  };
}
