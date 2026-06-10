import { describe, it, expect } from "vitest";
import {
  fitLinearRegression,
  predictLinear,
  meanSquaredError,
  rSquared,
  trainTestSplit,
  knnClassify,
  confusionMatrix,
  zScoreAnomalies,
  syntheticVibration,
  remainingUsefulLife,
  type Point2
} from "../lib/simulations/ml";

describe("fitLinearRegression", () => {
  it("recovers a perfect linear relationship", () => {
    const xs = [0, 1, 2, 3, 4];
    const ys = xs.map((x) => 3 * x + 1);
    const m = fitLinearRegression(xs, ys);
    expect(m.slope).toBeCloseTo(3);
    expect(m.intercept).toBeCloseTo(1);
    expect(predictLinear(m, 10)).toBeCloseTo(31);
  });
});

describe("metrics", () => {
  it("MSE is zero for perfect predictions and R² is one", () => {
    expect(meanSquaredError([1, 2, 3], [1, 2, 3])).toBe(0);
    expect(rSquared([1, 2, 3], [1, 2, 3])).toBe(1);
  });
});

describe("trainTestSplit", () => {
  it("splits roughly by the requested ratio without losing samples", () => {
    const data = Array.from({ length: 100 }, (_, i) => i);
    const { train, test } = trainTestSplit(data, 0.25);
    expect(train.length + test.length).toBe(100);
    expect(test.length).toBe(25);
  });
});

describe("knnClassify", () => {
  const train: Point2[] = [
    { x: 0, y: 0, label: 0 },
    { x: 0.1, y: 0, label: 0 },
    { x: 5, y: 5, label: 1 },
    { x: 5.1, y: 5, label: 1 }
  ];
  it("classifies points near each cluster correctly", () => {
    expect(knnClassify(train, 0.05, 0.05, 3)).toBe(0);
    expect(knnClassify(train, 5.05, 5.05, 3)).toBe(1);
  });
});

describe("confusionMatrix", () => {
  it("counts all four cells and derives accuracy", () => {
    const cm = confusionMatrix([1, 1, 0, 0], [1, 0, 0, 1]);
    expect(cm.tp).toBe(1);
    expect(cm.fn).toBe(1);
    expect(cm.tn).toBe(1);
    expect(cm.fp).toBe(1);
    expect(cm.accuracy).toBe(0.5);
  });
});

describe("anomaly detection", () => {
  it("flags injected spikes in synthetic vibration data", () => {
    const idx = [50, 120];
    const signal = syntheticVibration(200, 1, idx, 6);
    const flagged = zScoreAnomalies(signal, 3);
    for (const i of idx) expect(flagged).toContain(i);
  });
});

describe("remainingUsefulLife", () => {
  it("extrapolates a linear degradation to the threshold", () => {
    const health = Array.from({ length: 50 }, (_, i) => 100 - i); // hits 20 at i=80
    const { rulSamples } = remainingUsefulLife(health, 20);
    expect(rulSamples).toBeCloseTo(31, 0); // 80 - 49
  });

  it("returns null RUL when not degrading", () => {
    const health = Array.from({ length: 50 }, (_, i) => 50 + i * 0.1);
    expect(remainingUsefulLife(health, 20).rulSamples).toBeNull();
  });
});
