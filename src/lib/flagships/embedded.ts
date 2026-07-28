import { adcQuantise } from "../simulations/electrical";
import { runFsm, type FsmDefinition } from "../simulations/embedded";

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

export interface SamplingAssessment {
  signalFrequencyHz: number;
  sampleFrequencyHz: number;
  nyquistFrequencyHz: number;
  samplesPerCycle: number;
  aliasFrequencyHz: number;
  isNyquistSatisfied: boolean;
  diagnosis: string;
}

/**
 * Assesses a single sinusoidal component against the Nyquist bound and folds
 * it into the first Nyquist zone to show the apparent alias frequency.
 */
export function assessSampling(signalFrequencyHz: number, sampleFrequencyHz: number): SamplingAssessment {
  finite("signalFrequencyHz", signalFrequencyHz);
  if (signalFrequencyHz < 0) {
    throw new Error("signalFrequencyHz must be greater than or equal to zero");
  }
  positive("sampleFrequencyHz", sampleFrequencyHz);
  const nyquistFrequencyHz = sampleFrequencyHz / 2;
  const wrapped =
    ((signalFrequencyHz + nyquistFrequencyHz) % sampleFrequencyHz + sampleFrequencyHz) % sampleFrequencyHz -
    nyquistFrequencyHz;
  const aliasFrequencyHz = Math.abs(wrapped);
  const isNyquistSatisfied = signalFrequencyHz < nyquistFrequencyHz;
  return {
    signalFrequencyHz,
    sampleFrequencyHz,
    nyquistFrequencyHz,
    samplesPerCycle: signalFrequencyHz === 0 ? Number.POSITIVE_INFINITY : sampleFrequencyHz / signalFrequencyHz,
    aliasFrequencyHz,
    isNyquistSatisfied,
    diagnosis: isNyquistSatisfied
      ? "The sinusoidal component is strictly below the Nyquist frequency."
      : signalFrequencyHz === nyquistFrequencyHz
        ? "The component lies exactly at the Nyquist boundary and is not treated as satisfying the strict sampling criterion."
        : `Aliasing is expected; the component appears at ${aliasFrequencyHz} Hz in the first Nyquist zone.`
  };
}

export interface SensorInterfaceInput {
  supplyVoltageV: number;
  activeCurrentA: number;
  unloadedHighVoltageV: number;
  receiverHighThresholdV: number;
  sourceResistanceOhm: number;
  receiverInputResistanceOhm: number;
}

export interface SensorInterfaceAssessment extends SensorInterfaceInput {
  activePowerW: number;
  loadedHighVoltageV: number;
  loadedHighMarginV: number;
  loadingFraction: number;
  compatible: boolean;
  diagnosis: string[];
}

/**
 * Bounded low-voltage educational interface check. It uses a resistive loading
 * model and declared logic threshold only; it does not establish electrical
 * compatibility, EMC performance, transient tolerance, or hardware safety.
 */
export function assessSensorInterface(input: SensorInterfaceInput): SensorInterfaceAssessment {
  positive("supplyVoltageV", input.supplyVoltageV);
  finite("activeCurrentA", input.activeCurrentA);
  if (input.activeCurrentA < 0) throw new Error("activeCurrentA must be greater than or equal to zero");
  finite("unloadedHighVoltageV", input.unloadedHighVoltageV);
  finite("receiverHighThresholdV", input.receiverHighThresholdV);
  if (
    input.unloadedHighVoltageV < 0 ||
    input.unloadedHighVoltageV > input.supplyVoltageV ||
    input.receiverHighThresholdV < 0 ||
    input.receiverHighThresholdV > input.supplyVoltageV
  ) {
    throw new Error("Logic voltages must be from zero to the declared supply voltage");
  }
  finite("sourceResistanceOhm", input.sourceResistanceOhm);
  if (input.sourceResistanceOhm < 0) {
    throw new Error("sourceResistanceOhm must be greater than or equal to zero");
  }
  positive("receiverInputResistanceOhm", input.receiverInputResistanceOhm);
  const resistanceTotal = input.sourceResistanceOhm + input.receiverInputResistanceOhm;
  const loadedHighVoltageV =
    input.unloadedHighVoltageV * input.receiverInputResistanceOhm / resistanceTotal;
  const loadedHighMarginV = loadedHighVoltageV - input.receiverHighThresholdV;
  const loadingFraction = input.sourceResistanceOhm / resistanceTotal;
  const activePowerW = input.supplyVoltageV * input.activeCurrentA;
  const compatible = loadedHighMarginV >= 0;
  const diagnosis = [
    compatible
      ? "The loaded high-level voltage remains at or above the declared receiver threshold."
      : "The loaded high-level voltage is below the declared receiver threshold.",
    loadingFraction > 0.01
      ? "The resistive model predicts more than 1% output-voltage loading; review the interface assumptions."
      : "The resistive model predicts at most 1% output-voltage loading."
  ];
  return {
    ...input,
    activePowerW,
    loadedHighVoltageV,
    loadedHighMarginV,
    loadingFraction,
    compatible,
    diagnosis
  };
}

export function movingAverage(values: number[], windowSamples: number): number[] {
  if (!Number.isInteger(windowSamples) || windowSamples < 1) {
    throw new Error("windowSamples must be a positive integer");
  }
  if (values.length === 0) {
    return [];
  }
  values.forEach((value, index) => finite(`values[${index}]`, value));
  const output: number[] = [];
  let sum = 0;
  for (let index = 0; index < values.length; index += 1) {
    sum += values[index];
    if (index >= windowSamples) {
      sum -= values[index - windowSamples];
    }
    output.push(sum / Math.min(index + 1, windowSamples));
  }
  return output;
}

export interface AdcAssessment {
  inputVoltageV: number;
  referenceVoltageV: number;
  bits: number;
  code: number;
  quantisedVoltageV: number;
  lsbVoltageV: number;
  quantisationErrorV: number;
  clipped: boolean;
}

export function assessAdc(inputVoltageV: number, referenceVoltageV: number, bits: number): AdcAssessment {
  finite("inputVoltageV", inputVoltageV);
  positive("referenceVoltageV", referenceVoltageV);
  if (!Number.isInteger(bits) || bits < 1 || bits > 24) {
    throw new Error("bits must be an integer from 1 to 24");
  }
  const result = adcQuantise(inputVoltageV, referenceVoltageV, bits);
  return {
    inputVoltageV,
    referenceVoltageV,
    bits,
    code: result.code,
    quantisedVoltageV: result.quantised,
    lsbVoltageV: result.lsb,
    quantisationErrorV: result.quantised - Math.min(Math.max(inputVoltageV, 0), referenceVoltageV),
    clipped: inputVoltageV < 0 || inputVoltageV > referenceVoltageV
  };
}

export interface PeriodicTask {
  id: string;
  worstCaseExecutionTimeS: number;
  periodS: number;
  deadlineS: number;
}

export interface TimingAssessment {
  utilisation: number;
  utilisationLimit: number;
  withinUtilisationLimit: boolean;
  deadlineViolations: string[];
  diagnosis: string[];
}

export function assessTiming(tasks: PeriodicTask[], utilisationLimit = 0.8): TimingAssessment {
  if (tasks.length === 0) {
    throw new Error("tasks must contain at least one periodic task");
  }
  finite("utilisationLimit", utilisationLimit);
  if (utilisationLimit <= 0 || utilisationLimit > 1) {
    throw new Error("utilisationLimit must be greater than zero and at most one");
  }
  const ids = new Set<string>();
  const deadlineViolations: string[] = [];
  let utilisation = 0;
  for (const task of tasks) {
    if (!task.id.trim()) {
      throw new Error("task id must not be empty");
    }
    if (ids.has(task.id)) {
      throw new Error(`duplicate task id: ${task.id}`);
    }
    ids.add(task.id);
    positive(`${task.id}.worstCaseExecutionTimeS`, task.worstCaseExecutionTimeS);
    positive(`${task.id}.periodS`, task.periodS);
    positive(`${task.id}.deadlineS`, task.deadlineS);
    utilisation += task.worstCaseExecutionTimeS / task.periodS;
    if (task.worstCaseExecutionTimeS > task.deadlineS) {
      deadlineViolations.push(task.id);
    }
  }
  const withinUtilisationLimit = utilisation <= utilisationLimit;
  const diagnosis: string[] = [];
  diagnosis.push(
    withinUtilisationLimit
      ? "Summed periodic utilisation is within the stated educational limit."
      : "Summed periodic utilisation exceeds the stated educational limit."
  );
  if (deadlineViolations.length > 0) {
    diagnosis.push("At least one task has a worst-case execution time greater than its deadline.");
  }
  return { utilisation, utilisationLimit, withinUtilisationLimit, deadlineViolations, diagnosis };
}

export interface SensorBound {
  minimum: number;
  maximum: number;
  unit: string;
}

export interface SensorBoundAssessment {
  status: "valid" | "below-range" | "above-range" | "invalid";
  value: number;
  unit: string;
  diagnosis: string;
}

export function assessSensorBound(value: number, bound: SensorBound): SensorBoundAssessment {
  finite("bound.minimum", bound.minimum);
  finite("bound.maximum", bound.maximum);
  if (bound.minimum >= bound.maximum) {
    throw new Error("sensor minimum must be less than maximum");
  }
  if (!bound.unit.trim()) {
    throw new Error("sensor unit must not be empty");
  }
  if (!Number.isFinite(value)) {
    return { status: "invalid", value, unit: bound.unit, diagnosis: "Sensor value is not finite." };
  }
  if (value < bound.minimum) {
    return { status: "below-range", value, unit: bound.unit, diagnosis: "Sensor value is below the stated bound." };
  }
  if (value > bound.maximum) {
    return { status: "above-range", value, unit: bound.unit, diagnosis: "Sensor value is above the stated bound." };
  }
  return { status: "valid", value, unit: bound.unit, diagnosis: "Sensor value is inside the stated bound." };
}

export function runCheckedFsm(
  definition: FsmDefinition,
  events: string[]
): { trace: string[]; rejected: string[]; reachedFault: boolean } {
  if (definition.states.length === 0 || !definition.states.includes(definition.initial)) {
    throw new Error("FSM must have states and a valid initial state");
  }
  const stateSet = new Set(definition.states);
  if (stateSet.size !== definition.states.length) {
    throw new Error("FSM states must be unique");
  }
  definition.transitions.forEach((transition) => {
    if (!stateSet.has(transition.from) || !stateSet.has(transition.to)) {
      throw new Error("FSM transition references an unknown state");
    }
  });
  const result = runFsm(definition, events);
  return {
    ...result,
    reachedFault: result.trace.some((state) => state.toUpperCase().includes("FAULT"))
  };
}
