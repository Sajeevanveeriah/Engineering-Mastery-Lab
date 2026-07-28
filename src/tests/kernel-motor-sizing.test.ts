import { describe, expect, it } from "vitest";
import {
  angularVelocityFromRpm,
  calculateMotorSizing,
  createMotorSizingVerticalSlice,
  mechanicalPowerFromTorque
} from "../lib/kernel";

const knownInput = {
  continuousLoadTorque: { value: 10, unitId: "N.m" },
  peakLoadTorque: { value: 20, unitId: "N.m" },
  continuousOutputSpeed: { value: 600, unitId: "rpm" },
  peakOutputSpeed: { value: 600, unitId: "rpm" },
  gearRatio: 2,
  drivetrainEfficiency: 0.8,
  loadInertia: { value: 0.5, unitId: "kg.m2" },
  angularAcceleration: { value: 4, unitId: "rad-per-s2" },
  accelerationDutyCycle: 0.25,
  safetyFactor: 1.5,
  recordedAt: "2026-01-01T00:00:00.000Z",
  projectId: "motor-sizing-study"
};

describe("motor sizing vertical slice", () => {
  it("reproduces omega = 2*pi*rpm/60 and P = torque*omega", () => {
    expect(angularVelocityFromRpm(60)).toBeCloseTo(2 * Math.PI, 14);
    expect(mechanicalPowerFromTorque(10, 2 * Math.PI)).toBeCloseTo(20 * Math.PI, 14);

    const result = calculateMotorSizing(knownInput);
    const accelerationTorque = 0.5 * 4;
    const continuousOutputTorque = Math.sqrt(10 ** 2 + 0.25 * accelerationTorque ** 2) * 1.5;
    const continuousMotorTorque = continuousOutputTorque / (2 * 0.8);
    const motorOmega = 2 * Math.PI * 1_200 / 60;
    expect(result.accelerationTorqueNm).toBe(2);
    expect(result.continuous.outputTorqueNm).toBeCloseTo(continuousOutputTorque, 12);
    expect(result.continuous.motorTorqueNm).toBeCloseTo(continuousMotorTorque, 12);
    expect(result.continuous.motorSpeedRpm).toBeCloseTo(1_200, 12);
    expect(result.continuous.omegaRadPerSec).toBeCloseTo(motorOmega, 12);
    expect(result.continuous.mechanicalPowerW).toBeCloseTo(continuousMotorTorque * motorOmega, 10);
    expect(result.peak.outputTorqueNm).toBeCloseTo((20 + 2) * 1.5, 12);
    expect(result.peak.motorTorqueNm).toBeCloseTo(33 / 1.6, 12);
    expect(result.boundaries).toContain("P = torque * omega");
  });

  it("keeps continuous and peak operating points separate in a complete deterministic fixture", () => {
    const first = createMotorSizingVerticalSlice();
    const second = createMotorSizingVerticalSlice();
    expect(first.project.id).toBe("motor-sizing-study");
    expect(first.project.scenarioSet.scenarios.map((scenario) => scenario.id)).toEqual([
      "baseline",
      "reduced-speed"
    ]);
    expect(first.project.calculations).toHaveLength(2);
    expect(first.project.evidenceGraph.edges).toHaveLength(14);
    expect(first.bundle).toBe(second.bundle);
    expect(first.result.peak.motorTorqueNm).toBeGreaterThan(first.result.continuous.motorTorqueNm);
    expect(first.alternateResult.continuous.mechanicalPowerW)
      .toBeCloseTo(first.result.continuous.mechanicalPowerW * 0.8, 10);
    expect(first.comparison.some((row) => row.role === "input" && row.changed)).toBe(true);
    expect(first.comparison.some((row) => row.role === "output" && row.changed)).toBe(true);
  });

  it("rejects invalid efficiency, negative inertia, invalid units and invalid safety boundaries", () => {
    expect(() => calculateMotorSizing({ ...knownInput, drivetrainEfficiency: 0 })).toThrow(/efficiency/i);
    expect(() => calculateMotorSizing({
      ...knownInput,
      loadInertia: { value: -0.1, unitId: "kg.m2" }
    })).toThrow(/non-negative/);
    expect(() => calculateMotorSizing({
      ...knownInput,
      continuousLoadTorque: { value: 10, unitId: "kg" }
    })).toThrow(/torque dimension/);
    expect(() => calculateMotorSizing({ ...knownInput, safetyFactor: 0.9 })).toThrow(/at least one/);
    expect(() => calculateMotorSizing({ ...knownInput, accelerationDutyCycle: 1.1 })).toThrow(/zero to one/);
  });
});
