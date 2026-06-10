import { describe, it, expect } from "vitest";
import {
  ohmsLaw,
  rcCharge,
  rcCutoffHz,
  rcLowPassGain,
  voltageDivider,
  adcQuantise,
  rlcStepResponse
} from "../lib/simulations/electrical";

describe("ohmsLaw", () => {
  it("computes current and power", () => {
    const r = ohmsLaw(10, 100);
    expect(r.current).toBeCloseTo(0.1);
    expect(r.power).toBeCloseTo(1);
  });
});

describe("rcCharge", () => {
  it("reaches 63.2% at one time constant", () => {
    const tau = 1; // R=1k, C=1mF
    const pts = rcCharge(10, 1000, 0.001, 5, 500);
    const atTau = pts.reduce((best, p) => (Math.abs(p.t - tau) < Math.abs(best.t - tau) ? p : best));
    expect(atTau.v / 10).toBeCloseTo(0.632, 2);
  });
});

describe("rc filter", () => {
  it("gain is 1/sqrt(2) at cutoff", () => {
    const fc = rcCutoffHz(1000, 1e-6);
    expect(rcLowPassGain(1000, 1e-6, fc)).toBeCloseTo(Math.SQRT1_2, 6);
  });
});

describe("voltageDivider", () => {
  it("halves with equal resistors", () => {
    expect(voltageDivider(5, 10000, 10000)).toBeCloseTo(2.5);
  });
});

describe("adcQuantise", () => {
  it("computes LSB and clips above Vref", () => {
    const r = adcQuantise(5, 3.3, 10);
    expect(r.code).toBe(1023);
    expect(r.lsb).toBeCloseTo(3.3 / 1024);
  });
});

describe("rlcStepResponse", () => {
  it("classifies damping regimes correctly", () => {
    // zeta = (R/2) * sqrt(C/L)
    expect(rlcStepResponse(5, 10, 0.01, 1e-5, 0.01).regime).toBe("underdamped");
    expect(rlcStepResponse(5, 500, 0.01, 1e-5, 0.01).regime).toBe("overdamped");
  });

  it("settles to the source voltage", () => {
    const res = rlcStepResponse(5, 100, 0.01, 1e-5, 0.05);
    expect(res.points[res.points.length - 1].v).toBeCloseTo(5, 1);
  });
});
