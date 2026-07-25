export interface UnitDefinition {
  id: string;
  label: string;
  symbol: string;
  scale: number;
  offset?: number;
}

export interface UnitCategory {
  id: string;
  label: string;
  units: UnitDefinition[];
}

export const unitCategories: UnitCategory[] = [
  {
    id: "length",
    label: "Length",
    units: [
      { id: "m", label: "metre", symbol: "m", scale: 1 },
      { id: "mm", label: "millimetre", symbol: "mm", scale: 0.001 },
      { id: "um", label: "micrometre", symbol: "um", scale: 1e-6 },
      { id: "km", label: "kilometre", symbol: "km", scale: 1000 },
      { id: "in", label: "inch", symbol: "in", scale: 0.0254 },
      { id: "ft", label: "foot", symbol: "ft", scale: 0.3048 }
    ]
  },
  {
    id: "area",
    label: "Area",
    units: [
      { id: "m2", label: "square metre", symbol: "m2", scale: 1 },
      { id: "mm2", label: "square millimetre", symbol: "mm2", scale: 1e-6 },
      { id: "cm2", label: "square centimetre", symbol: "cm2", scale: 1e-4 },
      { id: "in2", label: "square inch", symbol: "in2", scale: 0.00064516 },
      { id: "ft2", label: "square foot", symbol: "ft2", scale: 0.09290304 }
    ]
  },
  {
    id: "volume",
    label: "Volume",
    units: [
      { id: "m3", label: "cubic metre", symbol: "m3", scale: 1 },
      { id: "l", label: "litre", symbol: "L", scale: 0.001 },
      { id: "ml", label: "millilitre", symbol: "mL", scale: 1e-6 },
      { id: "cm3", label: "cubic centimetre", symbol: "cm3", scale: 1e-6 },
      { id: "in3", label: "cubic inch", symbol: "in3", scale: 0.000016387064 }
    ]
  },
  {
    id: "mass",
    label: "Mass",
    units: [
      { id: "kg", label: "kilogram", symbol: "kg", scale: 1 },
      { id: "g", label: "gram", symbol: "g", scale: 0.001 },
      { id: "t", label: "tonne", symbol: "t", scale: 1000 },
      { id: "lb", label: "pound", symbol: "lb", scale: 0.45359237 },
      { id: "oz", label: "ounce", symbol: "oz", scale: 0.028349523125 }
    ]
  },
  {
    id: "force",
    label: "Force",
    units: [
      { id: "n", label: "newton", symbol: "N", scale: 1 },
      { id: "kn", label: "kilonewton", symbol: "kN", scale: 1000 },
      { id: "kgf", label: "kilogram-force", symbol: "kgf", scale: 9.80665 },
      { id: "lbf", label: "pound-force", symbol: "lbf", scale: 4.4482216152605 }
    ]
  },
  {
    id: "pressure",
    label: "Pressure",
    units: [
      { id: "pa", label: "pascal", symbol: "Pa", scale: 1 },
      { id: "kpa", label: "kilopascal", symbol: "kPa", scale: 1000 },
      { id: "mpa", label: "megapascal", symbol: "MPa", scale: 1e6 },
      { id: "bar", label: "bar", symbol: "bar", scale: 1e5 },
      { id: "psi", label: "pound per square inch", symbol: "psi", scale: 6894.757293168 }
    ]
  },
  {
    id: "torque",
    label: "Torque",
    units: [
      { id: "nm", label: "newton metre", symbol: "N m", scale: 1 },
      { id: "nmm", label: "newton millimetre", symbol: "N mm", scale: 0.001 },
      { id: "lbfft", label: "pound-force foot", symbol: "lbf ft", scale: 1.3558179483314 },
      { id: "lbfin", label: "pound-force inch", symbol: "lbf in", scale: 0.11298482902762 }
    ]
  },
  {
    id: "power",
    label: "Power",
    units: [
      { id: "w", label: "watt", symbol: "W", scale: 1 },
      { id: "kw", label: "kilowatt", symbol: "kW", scale: 1000 },
      { id: "mw", label: "megawatt", symbol: "MW", scale: 1e6 },
      { id: "hp", label: "mechanical horsepower", symbol: "hp", scale: 745.69987158227 }
    ]
  },
  {
    id: "energy",
    label: "Energy",
    units: [
      { id: "j", label: "joule", symbol: "J", scale: 1 },
      { id: "kj", label: "kilojoule", symbol: "kJ", scale: 1000 },
      { id: "wh", label: "watt-hour", symbol: "Wh", scale: 3600 },
      { id: "kwh", label: "kilowatt-hour", symbol: "kWh", scale: 3.6e6 },
      { id: "btu", label: "British thermal unit", symbol: "BTU", scale: 1055.05585262 }
    ]
  },
  {
    id: "temperature",
    label: "Temperature",
    units: [
      { id: "k", label: "kelvin", symbol: "K", scale: 1 },
      { id: "c", label: "degree Celsius", symbol: "deg C", scale: 1, offset: 273.15 },
      { id: "f", label: "degree Fahrenheit", symbol: "deg F", scale: 5 / 9, offset: 255.3722222222222 }
    ]
  },
  {
    id: "speed",
    label: "Linear speed",
    units: [
      { id: "ms", label: "metre per second", symbol: "m/s", scale: 1 },
      { id: "kmh", label: "kilometre per hour", symbol: "km/h", scale: 1 / 3.6 },
      { id: "mph", label: "mile per hour", symbol: "mph", scale: 0.44704 },
      { id: "fts", label: "foot per second", symbol: "ft/s", scale: 0.3048 }
    ]
  },
  {
    id: "flow",
    label: "Volumetric flow",
    units: [
      { id: "m3s", label: "cubic metre per second", symbol: "m3/s", scale: 1 },
      { id: "ls", label: "litre per second", symbol: "L/s", scale: 0.001 },
      { id: "lmin", label: "litre per minute", symbol: "L/min", scale: 1 / 60000 },
      { id: "m3h", label: "cubic metre per hour", symbol: "m3/h", scale: 1 / 3600 },
      { id: "gpm", label: "US gallon per minute", symbol: "US gpm", scale: 0.003785411784 / 60 }
    ]
  }
];

export function convertUnit(categoryId: string, value: number, sourceId: string, targetId: string): number {
  if (!Number.isFinite(value)) throw new Error("Conversion value must be finite.");
  const category = unitCategories.find((item) => item.id === categoryId);
  if (!category) throw new Error(`Unknown unit category: ${categoryId}`);
  const source = category.units.find((unit) => unit.id === sourceId);
  const target = category.units.find((unit) => unit.id === targetId);
  if (!source || !target) throw new Error("Source and target units must belong to the selected category.");
  const base = source.scale * value + (source.offset ?? 0);
  if (!Number.isFinite(base)) throw new Error("Conversion result is outside the supported numeric range.");
  if (category.id === "temperature" && base < 0) throw new Error("Temperature cannot be below absolute zero.");
  const result = (base - (target.offset ?? 0)) / target.scale;
  if (!Number.isFinite(result)) throw new Error("Conversion result is outside the supported numeric range.");
  return result;
}
