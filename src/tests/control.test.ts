import { describe, it, expect } from "vitest";
import { simulatePid, stepMetrics, defaultPidParams } from "../lib/simulations/control";

describe("simulatePid", () => {
  it("P-only control of a first-order plant leaves steady-state error", () => {
    const pts = simulatePid({ ...defaultPidParams, kp: 2, ki: 0, kd: 0, plant: "first-order", duration: 30 });
    const last = pts[pts.length - 1].pv;
    // Closed-loop DC gain = Kp/(1+Kp) = 2/3
    expect(last).toBeGreaterThan(0.6);
    expect(last).toBeLessThan(0.7);
  });

  it("PI control removes steady-state error", () => {
    const pts = simulatePid({ ...defaultPidParams, kp: 2, ki: 1, kd: 0, duration: 40 });
    const m = stepMetrics(pts, 1);
    expect(Math.abs(m.steadyStateError)).toBeLessThan(0.01);
  });

  it("first-order plant under pure P does not overshoot", () => {
    const pts = simulatePid({ ...defaultPidParams, kp: 5, ki: 0, kd: 0, plant: "first-order" });
    const m = stepMetrics(pts, 1);
    expect(m.overshootPct).toBeLessThan(0.5);
  });

  it("respects actuator saturation limits", () => {
    const pts = simulatePid({ ...defaultPidParams, kp: 100 });
    expect(Math.max(...pts.map((p) => p.u))).toBeLessThanOrEqual(defaultPidParams.uMax);
    expect(Math.min(...pts.map((p) => p.u))).toBeGreaterThanOrEqual(defaultPidParams.uMin);
  });
});

describe("stepMetrics", () => {
  it("computes overshoot for a peaking response", () => {
    const pts = [
      { t: 0, pv: 0, sp: 1, u: 0 },
      { t: 1, pv: 1.2, sp: 1, u: 0 },
      { t: 2, pv: 1.0, sp: 1, u: 0 }
    ];
    expect(stepMetrics(pts, 1).overshootPct).toBeCloseTo(20, 5);
  });

  it("returns null settling time when never settled", () => {
    const pts = Array.from({ length: 10 }, (_, i) => ({ t: i, pv: 0.5, sp: 1, u: 0 }));
    expect(stepMetrics(pts, 1).settlingTime).toBeNull();
  });
});
