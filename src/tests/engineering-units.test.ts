import { describe, expect, it } from "vitest";
import { convertUnit, unitCategories } from "../lib/engineering/units";

describe("engineering unit conversion", () => {
  it("uses exact engineering conversion factors", () => {
    expect(convertUnit("length", 1, "in", "mm")).toBeCloseTo(25.4, 12);
    expect(convertUnit("pressure", 1, "bar", "kpa")).toBeCloseTo(100, 12);
    expect(convertUnit("energy", 1, "kwh", "j")).toBeCloseTo(3_600_000, 12);
    expect(convertUnit("flow", 60, "lmin", "ls")).toBeCloseTo(1, 12);
  });

  it("handles affine temperature conversions", () => {
    expect(convertUnit("temperature", 0, "c", "f")).toBeCloseTo(32, 10);
    expect(convertUnit("temperature", 212, "f", "c")).toBeCloseTo(100, 10);
    expect(convertUnit("temperature", 0, "k", "c")).toBeCloseTo(-273.15, 10);
  });

  it("round-trips every unit in every category", () => {
    for (const category of unitCategories) {
      const baseUnit = category.units[0];
      for (const unit of category.units) {
        const baseValue = convertUnit(category.id, 12.345, unit.id, baseUnit.id);
        const roundTrip = convertUnit(category.id, baseValue, baseUnit.id, unit.id);
        expect(roundTrip, `${category.id}: ${unit.id}`).toBeCloseTo(12.345, 10);
      }
    }
  });

  it("rejects non-finite values and mismatched unit ids", () => {
    expect(() => convertUnit("length", Number.POSITIVE_INFINITY, "m", "mm")).toThrow(/finite/);
    expect(() => convertUnit("temperature", -1, "k", "c")).toThrow(/absolute zero/);
    expect(() => convertUnit("unknown", 1, "m", "mm")).toThrow(/Unknown unit category/);
    expect(() => convertUnit("length", 1, "m", "kg")).toThrow(/selected category/);
  });
});
