import { describe, it, expect } from "vitest";
import { gearRatio, powerFromTorque, springMassDamper, naturalFrequencyHz } from "../lib/simulations/mechanical";

describe("gearRatio", () => {
  it("multiplies torque and divides speed by the ratio", () => {
    const g = gearRatio(15, 60, 3000, 0.5);
    expect(g.ratio).toBe(4);
    expect(g.outputSpeed).toBe(750);
    expect(g.outputTorque).toBe(2);
  });

  it("conserves ideal power across the mesh", () => {
    const g = gearRatio(20, 80, 1500, 1);
    expect(powerFromTorque(1, 1500)).toBeCloseTo(powerFromTorque(g.outputTorque, g.outputSpeed));
  });
});

describe("powerFromTorque", () => {
  it("matches P = T * omega", () => {
    // 1 Nm at 60 rpm = 1 Nm * 2*pi rad/s... 60 rpm = 1 rev/s = 2*pi rad/s
    expect(powerFromTorque(1, 60)).toBeCloseTo(2 * Math.PI);
  });
});

describe("springMassDamper", () => {
  it("computes natural frequency and damping ratio", () => {
    const res = springMassDamper({ mass: 1, stiffness: 100, damping: 2, x0: 0.1, v0: 0, duration: 1, dt: 0.001 });
    expect(res.naturalFreqHz).toBeCloseTo(10 / (2 * Math.PI), 3);
    expect(res.dampingRatio).toBeCloseTo(0.1, 3);
  });

  it("decays toward zero when damped", () => {
    const res = springMassDamper({ mass: 1, stiffness: 100, damping: 10, x0: 0.1, v0: 0, duration: 5, dt: 0.001 });
    expect(Math.abs(res.points[res.points.length - 1].x)).toBeLessThan(0.001);
  });
});

describe("naturalFrequencyHz", () => {
  it("matches sqrt(k/m)/2pi", () => {
    expect(naturalFrequencyHz(1, (2 * Math.PI) ** 2)).toBeCloseTo(1);
  });
});
