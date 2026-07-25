// PLC/SCADA process simulations: tank fill/drain and conveyor interlocks.
// Educational models only - not for use on real machinery.

export interface TankState {
  level: number; // 0..100 %
  fillValveOpen: boolean;
  drainValveOpen: boolean;
  highAlarm: boolean;
  lowAlarm: boolean;
  highHighTrip: boolean;
}

export interface TankConfig {
  fillRate: number; // %/s
  drainRate: number; // %/s
  highLimit: number;
  lowLimit: number;
  highHighLimit: number;
}

export const defaultTankConfig: TankConfig = {
  fillRate: 8,
  drainRate: 6,
  highLimit: 85,
  lowLimit: 15,
  highHighLimit: 95
};

/** One PLC scan of the tank process. HighHigh trip latches the fill valve closed. */
export function tankStep(state: TankState, cfg: TankConfig, dt: number): TankState {
  let level = state.level;
  const fillAllowed = state.fillValveOpen && !state.highHighTrip;
  if (fillAllowed) level += cfg.fillRate * dt;
  if (state.drainValveOpen) level -= cfg.drainRate * dt;
  level = Math.min(100, Math.max(0, level));
  const highHighTrip = state.highHighTrip || level >= cfg.highHighLimit;
  return {
    ...state,
    level,
    fillValveOpen: highHighTrip ? false : state.fillValveOpen,
    highAlarm: level >= cfg.highLimit,
    lowAlarm: level <= cfg.lowLimit,
    highHighTrip
  };
}

export interface ConveyorInputs {
  startPb: boolean;
  stopPb: boolean;
  eStop: boolean;
  jamSensor: boolean;
  guardClosed: boolean;
  resetPb: boolean;
}

export interface ConveyorState {
  running: boolean;
  faultLatched: boolean;
  alarms: string[];
}

/**
 * Conveyor ladder-style logic, one scan:
 * - E-stop or jam latches a fault, stopping the motor.
 * - Guard open prevents start (interlock).
 * - Fault must be cleared with reset (and the cause removed) before restart.
 */
export function conveyorScan(state: ConveyorState, inp: ConveyorInputs): ConveyorState {
  const alarms: string[] = [];
  let faultLatched = state.faultLatched;

  if (inp.eStop) {
    faultLatched = true;
    alarms.push("EMERGENCY STOP ACTIVE");
  }
  if (inp.jamSensor) {
    faultLatched = true;
    alarms.push("CONVEYOR JAM DETECTED");
  }
  if (!inp.guardClosed) alarms.push("GUARD OPEN - START INHIBITED");

  if (faultLatched && inp.resetPb && !inp.eStop && !inp.jamSensor) {
    faultLatched = false;
  }
  if (faultLatched && !inp.eStop && !inp.jamSensor) {
    alarms.push("FAULT LATCHED - RESET REQUIRED");
  }

  // Seal-in start/stop circuit with interlocks in the rung.
  const runConditions = !faultLatched && !inp.stopPb && inp.guardClosed && !inp.eStop && !inp.jamSensor;
  const running = runConditions && (inp.startPb || state.running);

  return { running, faultLatched, alarms };
}

export const initialConveyorState: ConveyorState = { running: false, faultLatched: false, alarms: [] };
