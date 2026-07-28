import { describe, expect, it } from "vitest";
import {
  ENGINEERING_UNIT_REGISTRY,
  convertEngineeringValue,
  createMotorSizingVerticalSlice,
  validateCalculationRecord,
  validateEngineeringVariable,
  validateUnitRegistry
} from "../lib/kernel";

describe("engineering kernel units and variables", () => {
  it("round-trips affine and scaled units without losing physical meaning", () => {
    expect(convertEngineeringValue(0, "degC", "degF")).toBeCloseTo(32, 10);
    expect(convertEngineeringValue(212, "degF", "degC")).toBeCloseTo(100, 10);
    expect(convertEngineeringValue(1, "in", "mm")).toBeCloseTo(25.4, 12);
    expect(convertEngineeringValue(60, "rpm", "rad-per-s")).toBeCloseTo(2 * Math.PI, 12);
    expect(convertEngineeringValue(1, "kHz", "Hz")).toBe(1_000);
    expect(convertEngineeringValue(3_300, "mV", "V")).toBeCloseTo(3.3, 12);
    expect(convertEngineeringValue(1, "MPa", "Pa")).toBe(1_000_000);
    expect(convertEngineeringValue(100, "mm2", "m2")).toBeCloseTo(0.0001, 12);

    for (const unit of ENGINEERING_UNIT_REGISTRY.units) {
      const peers = ENGINEERING_UNIT_REGISTRY.units.filter((peer) => peer.dimension === unit.dimension);
      for (const peer of peers) {
        const sample = unit.dimension === "temperature" ? 300 : 12.345;
        const converted = convertEngineeringValue(sample, unit.id, peer.id);
        expect(convertEngineeringValue(converted, peer.id, unit.id), `${unit.id} through ${peer.id}`)
          .toBeCloseTo(sample, 10);
      }
    }
  });

  it("rejects dimensional mismatches, non-physical temperature and invalid registries", () => {
    expect(() => convertEngineeringValue(1, "kg", "m")).toThrow(/Cannot convert mass to length/);
    expect(() => convertEngineeringValue(-1, "K", "degC")).toThrow(/physical minimum/);
    expect(() => validateUnitRegistry({
      version: 1,
      units: [
        { id: "x", label: "x", symbol: "x", dimension: "length", scaleToBase: 1, offsetToBase: 0 },
        { id: "x", label: "x", symbol: "x", dimension: "length", scaleToBase: 2, offsetToBase: 0 }
      ]
    })).toThrow(/duplicate id/);
  });

  it("retains display and base values, validation, provenance, uncertainty and version references", () => {
    const { project } = createMotorSizingVerticalSlice();
    const input = project.variables.find((variable) => variable.id === "continuous-load-torque");
    const output = project.variables.find((variable) => variable.id === "continuous-motor-power");

    expect(input).toMatchObject({
      value: 10,
      baseValue: 10,
      unitId: "N.m",
      dimension: "torque",
      validRange: { maximumBase: 100 },
      validation: { status: "valid", messages: [] },
      provenance: { kind: "dataset", referenceId: "load-cases" },
      assumptionStatus: "specified",
      uncertainty: { kind: "uncertainty", plusMinus: 0.2, unitId: "N.m", confidencePercent: 95 },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z"
    });
    expect(output?.calculationVersionRef).toEqual({
      calculationId: "motor-sizing-result",
      algorithmId: "motor-sizing",
      algorithmVersion: "1.0.0"
    });
  });

  it("rejects stale base values and inconsistent range validation", () => {
    const { project } = createMotorSizingVerticalSlice();
    const source = project.variables.find((variable) => variable.id === "continuous-load-torque");
    expect(source).toBeDefined();
    expect(() => validateEngineeringVariable({ ...source!, baseValue: source!.baseValue + 1 })).toThrow(/baseValue/);
    expect(() => validateEngineeringVariable({
      ...source!,
      value: 1_000,
      baseValue: 1_000,
      validation: { status: "valid", messages: [] }
    })).toThrow(/must be invalid/);
  });

  it("retains complete deterministic calculation snapshots and provenance", () => {
    const { project } = createMotorSizingVerticalSlice();
    const calculation = project.calculations.find((item) => item.id === "motor-sizing-result");
    expect(calculation).toBeDefined();
    const validated = validateCalculationRecord(
      calculation!,
      new Set(project.variables.map((variable) => variable.id))
    );
    expect(validated).toMatchObject({
      algorithmId: "motor-sizing",
      algorithmVersion: "1.0.0",
      sourceDatasetId: "load-cases",
      scenarioId: "baseline",
      recordedAt: "2026-01-01T00:00:00.000Z",
      evidenceIds: ["baseline", "load-cases"],
      projectId: "motor-sizing-study"
    });
    expect(validated.inputs.length).toBe(10);
    expect(validated.outputs.length).toBe(6);
    expect(validated.inputs.every((snapshot) => Number.isFinite(snapshot.baseValue))).toBe(true);
    expect(validated.boundaries).toContain("omega = 2 * pi * rpm / 60");
    expect(validated.boundaries).toContain("P = torque * omega");
  });
});
