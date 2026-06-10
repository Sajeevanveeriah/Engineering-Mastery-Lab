import { describe, it, expect } from "vitest";
import { diffDriveStep, normalizeAngle, steerToWaypoint, aStar, makeRng } from "../lib/simulations/robotics";

describe("diffDriveStep", () => {
  it("drives straight with equal wheel speeds", () => {
    const p = diffDriveStep({ x: 0, y: 0, theta: 0 }, 1, 1, 0.3, 1);
    expect(p.x).toBeCloseTo(1);
    expect(p.y).toBeCloseTo(0);
    expect(p.theta).toBeCloseTo(0);
  });

  it("spins in place with opposite wheel speeds", () => {
    const p = diffDriveStep({ x: 0, y: 0, theta: 0 }, -0.5, 0.5, 0.3, 0.1);
    expect(p.x).toBeCloseTo(0);
    expect(p.theta).toBeGreaterThan(0);
  });
});

describe("normalizeAngle", () => {
  it("wraps into [-pi, pi]", () => {
    expect(Math.abs(normalizeAngle(3 * Math.PI))).toBeCloseTo(Math.PI);
    expect(normalizeAngle(2.5 * Math.PI)).toBeCloseTo(0.5 * Math.PI);
    expect(normalizeAngle(-2.5 * Math.PI)).toBeCloseTo(-0.5 * Math.PI);
  });
});

describe("steerToWaypoint", () => {
  it("reports reached inside the radius", () => {
    const cmd = steerToWaypoint({ x: 1, y: 1, theta: 0 }, 1.1, 1, 1, 1, 0.25);
    expect(cmd.reached).toBe(true);
  });

  it("turns left toward a target to the left", () => {
    const cmd = steerToWaypoint({ x: 0, y: 0, theta: 0 }, 0, 5, 1, 1, 0.1);
    expect(cmd.vRight).toBeGreaterThan(cmd.vLeft);
  });
});

describe("aStar", () => {
  const o = false;
  const X = true;
  it("finds a path around an obstacle wall", () => {
    const grid = [
      [o, o, o],
      [X, X, o],
      [o, o, o]
    ];
    const path = aStar(grid, [0, 0], [2, 0]);
    expect(path).not.toBeNull();
    expect(path![0]).toEqual([0, 0]);
    expect(path![path!.length - 1]).toEqual([2, 0]);
  });

  it("returns null when the goal is unreachable", () => {
    const grid = [
      [o, X],
      [X, o]
    ];
    expect(aStar(grid, [0, 0], [1, 1])).toBeNull();
  });
});

describe("makeRng", () => {
  it("is deterministic for the same seed", () => {
    const a = makeRng(42);
    const b = makeRng(42);
    expect(a()).toBe(b());
  });
});
