import { describe, it, expect } from "vitest";
import { tankStep, defaultTankConfig, conveyorScan, initialConveyorState, type TankState, type ConveyorInputs } from "../lib/simulations/plc";

const idleTank: TankState = {
  level: 50,
  fillValveOpen: false,
  drainValveOpen: false,
  highAlarm: false,
  lowAlarm: false,
  highHighTrip: false
};

describe("tankStep", () => {
  it("fills and drains at the configured rates", () => {
    const filled = tankStep({ ...idleTank, fillValveOpen: true }, defaultTankConfig, 1);
    expect(filled.level).toBeCloseTo(58);
    const drained = tankStep({ ...idleTank, drainValveOpen: true }, defaultTankConfig, 1);
    expect(drained.level).toBeCloseTo(44);
  });

  it("raises high alarm and latches the high-high trip", () => {
    let s: TankState = { ...idleTank, level: 94, fillValveOpen: true };
    s = tankStep(s, defaultTankConfig, 1);
    expect(s.highAlarm).toBe(true);
    expect(s.highHighTrip).toBe(true);
    expect(s.fillValveOpen).toBe(false); // trip forces valve closed
    // Trip stays latched even as level drops
    s = tankStep({ ...s, drainValveOpen: true }, defaultTankConfig, 5);
    expect(s.highHighTrip).toBe(true);
  });

  it("clamps level between 0 and 100", () => {
    const s = tankStep({ ...idleTank, level: 1, drainValveOpen: true }, defaultTankConfig, 5);
    expect(s.level).toBe(0);
  });
});

const healthy: ConveyorInputs = {
  startPb: false,
  stopPb: false,
  eStop: false,
  jamSensor: false,
  guardClosed: true,
  resetPb: false
};

describe("conveyorScan", () => {
  it("starts with the start button and seals in", () => {
    let s = conveyorScan(initialConveyorState, { ...healthy, startPb: true });
    expect(s.running).toBe(true);
    s = conveyorScan(s, healthy); // button released, motor stays on
    expect(s.running).toBe(true);
  });

  it("stops with the stop button", () => {
    let s = conveyorScan(initialConveyorState, { ...healthy, startPb: true });
    s = conveyorScan(s, { ...healthy, stopPb: true });
    expect(s.running).toBe(false);
  });

  it("latches a fault on jam and refuses restart until reset", () => {
    let s = conveyorScan(initialConveyorState, { ...healthy, startPb: true });
    s = conveyorScan(s, { ...healthy, jamSensor: true });
    expect(s.running).toBe(false);
    expect(s.faultLatched).toBe(true);
    // Jam cleared but no reset: still latched
    s = conveyorScan(s, { ...healthy, startPb: true });
    expect(s.running).toBe(false);
    // Reset clears the latch, then start works
    s = conveyorScan(s, { ...healthy, resetPb: true });
    expect(s.faultLatched).toBe(false);
    s = conveyorScan(s, { ...healthy, startPb: true });
    expect(s.running).toBe(true);
  });

  it("inhibits start while the guard is open", () => {
    const s = conveyorScan(initialConveyorState, { ...healthy, startPb: true, guardClosed: false });
    expect(s.running).toBe(false);
    expect(s.alarms.join(" ")).toContain("GUARD");
  });

  it("reset does not clear the fault while the e-stop is still pressed", () => {
    let s = conveyorScan(initialConveyorState, { ...healthy, eStop: true });
    s = conveyorScan(s, { ...healthy, eStop: true, resetPb: true });
    expect(s.faultLatched).toBe(true);
  });
});
