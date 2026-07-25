import { describe, expect, it } from "vitest";
import {
  EngineeringInputError,
  calculateById,
  calculatorDefinitions,
  defaultInputs,
  type CalculatorOutput
} from "../lib/engineering/calculators";

function resultValue(output: CalculatorOutput, label: string, occurrence = 0): number {
  const matches = output.values.filter((value) => value.label === label);
  const match = matches[occurrence];
  if (!match) throw new Error(`Missing calculator result: ${label}`);
  return match.value;
}

describe("engineering calculator catalogue", () => {
  it("has unique ids and evaluates every default case to finite results", () => {
    expect(new Set(calculatorDefinitions.map((definition) => definition.id)).size).toBe(calculatorDefinitions.length);
    expect(calculatorDefinitions).toHaveLength(12);

    for (const definition of calculatorDefinitions) {
      const output = calculateById(definition.id, defaultInputs(definition));
      expect(output.values.length, definition.id).toBeGreaterThan(0);
      for (const value of output.values) {
        expect(Number.isFinite(value.value), `${definition.id}: ${value.label}`).toBe(true);
      }
    }
  });

  it("returns the reference beam stress and deflection", () => {
    const output = calculateById("beam-bending", {
      load: 1000,
      length: 2,
      width: 50,
      height: 100,
      modulus: 200,
      yield: 250
    });

    expect(resultValue(output, "Maximum moment")).toBeCloseTo(500, 10);
    expect(resultValue(output, "Maximum stress")).toBeCloseTo(6, 10);
    expect(resultValue(output, "Centre deflection")).toBeCloseTo(0.2, 10);
    expect(resultValue(output, "Elastic factor of safety")).toBeCloseTo(250 / 6, 10);
  });

  it("returns the reference solid-shaft torsion result", () => {
    const output = calculateById("shaft-torsion", {
      torque: 100,
      length: 1,
      outerDiameter: 20,
      innerDiameter: 0,
      shearModulus: 80,
      allowableShear: 100
    });

    expect(resultValue(output, "Polar second moment")).toBeCloseTo(Math.PI * 20 ** 4 / 32, 8);
    expect(resultValue(output, "Maximum shear stress")).toBeCloseTo(63.661977, 5);
    expect(resultValue(output, "Angle of twist")).toBeCloseTo(4.559453, 5);
    expect(resultValue(output, "Shear factor of safety")).toBeCloseTo(1.570796, 5);
  });

  it("computes balanced three-phase power", () => {
    const output = calculateById("three-phase-power", {
      voltage: 400,
      current: 10,
      powerFactor: 0.8,
      efficiency: 0.9
    });

    expect(resultValue(output, "Apparent power")).toBeCloseTo(6.928203, 5);
    expect(resultValue(output, "Real input power")).toBeCloseTo(5.542563, 5);
    expect(resultValue(output, "Reactive power")).toBeCloseTo(4.156922, 5);
    expect(resultValue(output, "Estimated output power")).toBeCloseTo(4.988307, 5);
  });

  it("maps a 12 mA signal to the midpoint of a 4 to 20 mA span", () => {
    const output = calculateById("linear-scaling", {
      signal: 12,
      signalMinimum: 4,
      signalMaximum: 20,
      engineeringMinimum: 0,
      engineeringMaximum: 100
    });

    expect(resultValue(output, "Engineering value")).toBe(50);
    expect(resultValue(output, "Span position")).toBe(50);
    expect(output.warnings).toEqual([]);
  });

  it("reports both planar robot inverse-kinematics solutions", () => {
    const output = calculateById("robot-arm", {
      link1: 1,
      link2: 1,
      targetX: 1,
      targetY: 1
    });

    expect(resultValue(output, "Elbow-up shoulder")).toBeCloseTo(0, 10);
    expect(resultValue(output, "Elbow-up elbow")).toBeCloseTo(90, 10);
    expect(resultValue(output, "Elbow-down shoulder")).toBeCloseTo(90, 10);
    expect(resultValue(output, "Elbow-down elbow")).toBeCloseTo(-90, 10);
  });
});

describe("engineering calculator validation", () => {
  it("rejects unknown tools, non-finite input and invalid geometry", () => {
    expect(() => calculateById("not-a-tool", {})).toThrow(EngineeringInputError);
    expect(() => calculateById("beam-bending", {
      load: Number.NaN,
      length: 2,
      width: 50,
      height: 100,
      modulus: 200,
      yield: 250
    })).toThrow(/finite number/);
    expect(() => calculateById("shaft-torsion", {
      torque: 100,
      length: 1,
      outerDiameter: 20,
      innerDiameter: 20,
      shearModulus: 80,
      allowableShear: 100
    })).toThrow(/smaller than the outer diameter/);
  });

  it("rejects results outside the supported numeric range", () => {
    expect(() => calculateById("beam-bending", {
      load: 1e308,
      length: 1e308,
      width: 1,
      height: 1,
      modulus: 1,
      yield: 1
    })).toThrow(/supported numeric range/);
  });

  it("rejects unreachable robot targets and invalid efficiency", () => {
    expect(() => calculateById("robot-arm", {
      link1: 1,
      link2: 1,
      targetX: 3,
      targetY: 0
    })).toThrow(/outside the reachable annulus/);
    expect(() => calculateById("three-phase-power", {
      voltage: 400,
      current: 10,
      powerFactor: 0.8,
      efficiency: 0
    })).toThrow(/within \(0, 1\]/);
  });

  it("warns when linear scaling extrapolates", () => {
    const output = calculateById("linear-scaling", {
      signal: 22,
      signalMinimum: 4,
      signalMaximum: 20,
      engineeringMinimum: 0,
      engineeringMaximum: 100
    });

    expect(resultValue(output, "Engineering value")).toBe(112.5);
    expect(output.warnings).toEqual([expect.stringMatching(/above the configured range/)]);
  });
});
