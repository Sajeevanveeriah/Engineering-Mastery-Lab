import { assertOnlyKeys, assertUniqueIds, requireFiniteNumber, requireIdentifier, requireRecord, requireText } from "./validation";

export type EngineeringDimension =
  | "dimensionless"
  | "length"
  | "area"
  | "mass"
  | "time"
  | "frequency"
  | "temperature"
  | "voltage"
  | "electric-current"
  | "resistance"
  | "force"
  | "pressure"
  | "torque"
  | "power"
  | "angular-speed"
  | "angular-acceleration"
  | "rotational-inertia";

export interface EngineeringUnit {
  id: string;
  label: string;
  symbol: string;
  dimension: EngineeringDimension;
  scaleToBase: number;
  offsetToBase: number;
  minimumBase?: number;
}

export interface EngineeringUnitRegistry {
  version: 1;
  units: EngineeringUnit[];
}

const DIMENSIONS = new Set<EngineeringDimension>([
  "dimensionless",
  "length",
  "area",
  "mass",
  "time",
  "frequency",
  "temperature",
  "voltage",
  "electric-current",
  "resistance",
  "force",
  "pressure",
  "torque",
  "power",
  "angular-speed",
  "angular-acceleration",
  "rotational-inertia"
]);

const DIMENSION_LABELS: Readonly<Record<EngineeringDimension, string>> = Object.freeze({
  dimensionless: "Dimensionless",
  length: "Length",
  area: "Area",
  mass: "Mass",
  time: "Time",
  frequency: "Frequency",
  temperature: "Temperature",
  voltage: "Voltage",
  "electric-current": "Electric current",
  resistance: "Resistance",
  force: "Force",
  pressure: "Pressure",
  torque: "Torque",
  power: "Power",
  "angular-speed": "Angular speed",
  "angular-acceleration": "Angular acceleration",
  "rotational-inertia": "Rotational inertia"
});

export const ENGINEERING_UNIT_REGISTRY: EngineeringUnitRegistry = {
  version: 1,
  units: [
    { id: "one", label: "ratio", symbol: "1", dimension: "dimensionless", scaleToBase: 1, offsetToBase: 0 },
    { id: "percent", label: "percent", symbol: "%", dimension: "dimensionless", scaleToBase: 0.01, offsetToBase: 0 },
    { id: "m", label: "metre", symbol: "m", dimension: "length", scaleToBase: 1, offsetToBase: 0 },
    { id: "mm", label: "millimetre", symbol: "mm", dimension: "length", scaleToBase: 0.001, offsetToBase: 0 },
    { id: "in", label: "inch", symbol: "in", dimension: "length", scaleToBase: 0.0254, offsetToBase: 0 },
    { id: "m2", label: "square metre", symbol: "m2", dimension: "area", scaleToBase: 1, offsetToBase: 0 },
    { id: "mm2", label: "square millimetre", symbol: "mm2", dimension: "area", scaleToBase: 1e-6, offsetToBase: 0 },
    { id: "kg", label: "kilogram", symbol: "kg", dimension: "mass", scaleToBase: 1, offsetToBase: 0 },
    { id: "g", label: "gram", symbol: "g", dimension: "mass", scaleToBase: 0.001, offsetToBase: 0 },
    { id: "s", label: "second", symbol: "s", dimension: "time", scaleToBase: 1, offsetToBase: 0 },
    { id: "min", label: "minute", symbol: "min", dimension: "time", scaleToBase: 60, offsetToBase: 0 },
    { id: "Hz", label: "hertz", symbol: "Hz", dimension: "frequency", scaleToBase: 1, offsetToBase: 0, minimumBase: 0 },
    { id: "kHz", label: "kilohertz", symbol: "kHz", dimension: "frequency", scaleToBase: 1_000, offsetToBase: 0, minimumBase: 0 },
    { id: "K", label: "kelvin", symbol: "K", dimension: "temperature", scaleToBase: 1, offsetToBase: 0, minimumBase: 0 },
    { id: "degC", label: "degree Celsius", symbol: "deg C", dimension: "temperature", scaleToBase: 1, offsetToBase: 273.15, minimumBase: 0 },
    { id: "degF", label: "degree Fahrenheit", symbol: "deg F", dimension: "temperature", scaleToBase: 5 / 9, offsetToBase: 255.3722222222222, minimumBase: 0 },
    { id: "V", label: "volt", symbol: "V", dimension: "voltage", scaleToBase: 1, offsetToBase: 0 },
    { id: "mV", label: "millivolt", symbol: "mV", dimension: "voltage", scaleToBase: 0.001, offsetToBase: 0 },
    { id: "A", label: "ampere", symbol: "A", dimension: "electric-current", scaleToBase: 1, offsetToBase: 0 },
    { id: "mA", label: "milliampere", symbol: "mA", dimension: "electric-current", scaleToBase: 0.001, offsetToBase: 0 },
    { id: "ohm", label: "ohm", symbol: "ohm", dimension: "resistance", scaleToBase: 1, offsetToBase: 0, minimumBase: 0 },
    { id: "kohm", label: "kiloohm", symbol: "kohm", dimension: "resistance", scaleToBase: 1_000, offsetToBase: 0, minimumBase: 0 },
    { id: "N", label: "newton", symbol: "N", dimension: "force", scaleToBase: 1, offsetToBase: 0 },
    { id: "kN", label: "kilonewton", symbol: "kN", dimension: "force", scaleToBase: 1_000, offsetToBase: 0 },
    { id: "Pa", label: "pascal", symbol: "Pa", dimension: "pressure", scaleToBase: 1, offsetToBase: 0 },
    { id: "MPa", label: "megapascal", symbol: "MPa", dimension: "pressure", scaleToBase: 1_000_000, offsetToBase: 0 },
    { id: "N.m", label: "newton metre", symbol: "N m", dimension: "torque", scaleToBase: 1, offsetToBase: 0 },
    { id: "N.mm", label: "newton millimetre", symbol: "N mm", dimension: "torque", scaleToBase: 0.001, offsetToBase: 0 },
    { id: "lbf.ft", label: "pound-force foot", symbol: "lbf ft", dimension: "torque", scaleToBase: 1.3558179483314, offsetToBase: 0 },
    { id: "W", label: "watt", symbol: "W", dimension: "power", scaleToBase: 1, offsetToBase: 0 },
    { id: "kW", label: "kilowatt", symbol: "kW", dimension: "power", scaleToBase: 1_000, offsetToBase: 0 },
    { id: "rad-per-s", label: "radian per second", symbol: "rad/s", dimension: "angular-speed", scaleToBase: 1, offsetToBase: 0 },
    { id: "rpm", label: "revolution per minute", symbol: "rpm", dimension: "angular-speed", scaleToBase: 2 * Math.PI / 60, offsetToBase: 0 },
    { id: "rad-per-s2", label: "radian per second squared", symbol: "rad/s2", dimension: "angular-acceleration", scaleToBase: 1, offsetToBase: 0 },
    { id: "rpm-per-s", label: "revolution per minute per second", symbol: "rpm/s", dimension: "angular-acceleration", scaleToBase: 2 * Math.PI / 60, offsetToBase: 0 },
    { id: "kg.m2", label: "kilogram square metre", symbol: "kg m2", dimension: "rotational-inertia", scaleToBase: 1, offsetToBase: 0 },
    { id: "g.cm2", label: "gram square centimetre", symbol: "g cm2", dimension: "rotational-inertia", scaleToBase: 1e-7, offsetToBase: 0 }
  ]
};

export function validateUnitRegistry(value: unknown): EngineeringUnitRegistry {
  const record = requireRecord(value, "unit registry");
  assertOnlyKeys(record, new Set(["version", "units"]), "unit registry");
  if (record.version !== 1) throw new Error("Unsupported unit registry version");
  if (!Array.isArray(record.units) || record.units.length === 0 || record.units.length > 256) {
    throw new Error("unit registry.units must contain from 1 to 256 units");
  }
  const units = record.units.map((unit, index) => validateUnit(unit, `unit registry.units[${index}]`));
  assertUniqueIds(units, "unit registry.units");
  return { version: 1, units };
}

export function getEngineeringUnit(
  unitId: string,
  registry: EngineeringUnitRegistry = ENGINEERING_UNIT_REGISTRY
): EngineeringUnit {
  const unit = registry.units.find((candidate) => candidate.id === unitId);
  if (!unit) throw new Error(`Unknown engineering unit: ${unitId}`);
  return unit;
}

export function getEngineeringUnitSymbol(
  unitId: string,
  registry: EngineeringUnitRegistry = ENGINEERING_UNIT_REGISTRY
): string {
  const unit = getEngineeringUnit(unitId, registry);
  return unit.dimension === "dimensionless" && unit.id === "one" ? "" : unit.symbol;
}

export function getEngineeringDimensionLabel(dimension: EngineeringDimension): string {
  return DIMENSION_LABELS[dimension];
}

export function convertEngineeringValue(
  value: number,
  sourceUnitId: string,
  targetUnitId: string,
  registry: EngineeringUnitRegistry = ENGINEERING_UNIT_REGISTRY
): number {
  if (!Number.isFinite(value)) throw new Error("Conversion value must be finite");
  const source = getEngineeringUnit(sourceUnitId, registry);
  const target = getEngineeringUnit(targetUnitId, registry);
  if (source.dimension !== target.dimension) {
    throw new Error(`Cannot convert ${source.dimension} to ${target.dimension}`);
  }
  const baseValue = value * source.scaleToBase + source.offsetToBase;
  const minimumBase = Math.max(source.minimumBase ?? -Infinity, target.minimumBase ?? -Infinity);
  if (!Number.isFinite(baseValue)) throw new Error("Conversion result is outside the supported numeric range");
  if (baseValue < minimumBase) throw new Error("Conversion result is below the physical minimum");
  const result = (baseValue - target.offsetToBase) / target.scaleToBase;
  if (!Number.isFinite(result)) throw new Error("Conversion result is outside the supported numeric range");
  return result;
}

export function toBaseEngineeringValue(
  value: number,
  unitId: string,
  registry: EngineeringUnitRegistry = ENGINEERING_UNIT_REGISTRY
): number {
  const source = getEngineeringUnit(unitId, registry);
  const base = value * source.scaleToBase + source.offsetToBase;
  if (!Number.isFinite(base)) throw new Error("Base value is outside the supported numeric range");
  if (source.minimumBase !== undefined && base < source.minimumBase) {
    throw new Error("Base value is below the physical minimum");
  }
  return base;
}

function validateUnit(value: unknown, path: string): EngineeringUnit {
  const record = requireRecord(value, path);
  assertOnlyKeys(record, new Set([
    "id", "label", "symbol", "dimension", "scaleToBase", "offsetToBase", "minimumBase"
  ]), path);
  if (!DIMENSIONS.has(record.dimension as EngineeringDimension)) throw new Error(`${path}.dimension is invalid`);
  const scaleToBase = requireFiniteNumber(record.scaleToBase, `${path}.scaleToBase`);
  if (scaleToBase <= 0) throw new Error(`${path}.scaleToBase must be positive`);
  const minimumBase = record.minimumBase === undefined
    ? undefined
    : requireFiniteNumber(record.minimumBase, `${path}.minimumBase`);
  return {
    id: requireIdentifier(record.id, `${path}.id`),
    label: requireText(record.label, `${path}.label`, 120),
    symbol: requireText(record.symbol, `${path}.symbol`, 40),
    dimension: record.dimension as EngineeringDimension,
    scaleToBase,
    offsetToBase: requireFiniteNumber(record.offsetToBase, `${path}.offsetToBase`),
    ...(minimumBase !== undefined ? { minimumBase } : {})
  };
}

validateUnitRegistry(ENGINEERING_UNIT_REGISTRY);
