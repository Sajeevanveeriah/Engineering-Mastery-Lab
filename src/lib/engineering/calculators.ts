export type EngineeringCategory =
  | "Mechanical"
  | "Electrical"
  | "Instrumentation"
  | "Thermal and fluids"
  | "Manufacturing"
  | "Robotics";

export interface CalculatorField {
  id: string;
  label: string;
  unit: string;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  help?: string;
}

export interface CalculatorValue {
  label: string;
  value: number;
  unit: string;
  digits?: number;
}

export interface CalculatorOutput {
  values: CalculatorValue[];
  warnings?: string[];
}

export interface CalculatorDefinition {
  id: string;
  title: string;
  category: EngineeringCategory;
  description: string;
  equation: string;
  assumptions: string[];
  fields: CalculatorField[];
  calculate: (inputs: Record<string, number>) => CalculatorOutput;
}

export class EngineeringInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EngineeringInputError";
  }
}

function numberInput(inputs: Record<string, number>, id: string, label: string): number {
  const value = inputs[id];
  if (!Number.isFinite(value)) throw new EngineeringInputError(`${label} must be a finite number.`);
  return value;
}

function positiveInput(inputs: Record<string, number>, id: string, label: string): number {
  const value = numberInput(inputs, id, label);
  if (value <= 0) throw new EngineeringInputError(`${label} must be greater than zero.`);
  return value;
}

function boundedInput(
  inputs: Record<string, number>,
  id: string,
  label: string,
  minimum: number,
  maximum: number,
  minimumInclusive = true
): number {
  const value = numberInput(inputs, id, label);
  const below = minimumInclusive ? value < minimum : value <= minimum;
  if (below || value > maximum) {
    const left = minimumInclusive ? "[" : "(";
    throw new EngineeringInputError(`${label} must be within ${left}${minimum}, ${maximum}].`);
  }
  return value;
}

function beamCalculation(inputs: Record<string, number>): CalculatorOutput {
  const load = positiveInput(inputs, "load", "Centre load");
  const length = positiveInput(inputs, "length", "Span");
  const width = positiveInput(inputs, "width", "Section width") / 1000;
  const height = positiveInput(inputs, "height", "Section height") / 1000;
  const modulus = positiveInput(inputs, "modulus", "Elastic modulus") * 1e9;
  const yieldStrength = positiveInput(inputs, "yield", "Yield strength") * 1e6;
  const secondMoment = width * height ** 3 / 12;
  const moment = load * length / 4;
  const stress = moment * (height / 2) / secondMoment;
  const deflection = load * length ** 3 / (48 * modulus * secondMoment);
  const warnings: string[] = [];
  if (deflection / length > 1 / 250) warnings.push("Deflection exceeds span/250. Review serviceability and the small-deflection assumption.");
  if (stress > yieldStrength) warnings.push("Calculated elastic bending stress exceeds the entered yield strength.");
  return {
    values: [
      { label: "Maximum moment", value: moment, unit: "N m", digits: 2 },
      { label: "Maximum stress", value: stress / 1e6, unit: "MPa", digits: 3 },
      { label: "Centre deflection", value: deflection * 1000, unit: "mm", digits: 3 },
      { label: "Elastic factor of safety", value: yieldStrength / stress, unit: "", digits: 2 }
    ],
    warnings
  };
}

function shaftCalculation(inputs: Record<string, number>): CalculatorOutput {
  const torque = positiveInput(inputs, "torque", "Torque");
  const length = positiveInput(inputs, "length", "Shaft length");
  const outerDiameter = positiveInput(inputs, "outerDiameter", "Outer diameter") / 1000;
  const innerDiameter = numberInput(inputs, "innerDiameter", "Inner diameter") / 1000;
  const shearModulus = positiveInput(inputs, "shearModulus", "Shear modulus") * 1e9;
  const allowableShear = positiveInput(inputs, "allowableShear", "Allowable shear stress") * 1e6;
  if (innerDiameter < 0 || innerDiameter >= outerDiameter) {
    throw new EngineeringInputError("Inner diameter must be zero or greater and smaller than the outer diameter.");
  }
  const polarMoment = Math.PI * (outerDiameter ** 4 - innerDiameter ** 4) / 32;
  const shearStress = torque * (outerDiameter / 2) / polarMoment;
  const twist = torque * length / (polarMoment * shearModulus);
  return {
    values: [
      { label: "Polar second moment", value: polarMoment * 1e12, unit: "mm4", digits: 1 },
      { label: "Maximum shear stress", value: shearStress / 1e6, unit: "MPa", digits: 3 },
      { label: "Angle of twist", value: twist * 180 / Math.PI, unit: "deg", digits: 3 },
      { label: "Shear factor of safety", value: allowableShear / shearStress, unit: "", digits: 2 }
    ],
    warnings: shearStress > allowableShear ? ["Calculated shear stress exceeds the entered allowable stress."] : []
  };
}

function driveCalculation(inputs: Record<string, number>): CalculatorOutput {
  const mass = positiveInput(inputs, "mass", "Vehicle mass");
  const acceleration = numberInput(inputs, "acceleration", "Target acceleration");
  const speed = positiveInput(inputs, "speed", "Target speed");
  const wheelRadius = positiveInput(inputs, "wheelRadius", "Wheel radius");
  const grade = numberInput(inputs, "grade", "Road grade");
  const rollingResistance = boundedInput(inputs, "rollingResistance", "Rolling resistance coefficient", 0, 1);
  const gearRatio = positiveInput(inputs, "gearRatio", "Gear ratio");
  const efficiency = boundedInput(inputs, "efficiency", "Drivetrain efficiency", 0, 1, false);
  const theta = Math.atan(grade / 100);
  const force = mass * acceleration
    + rollingResistance * mass * 9.80665 * Math.cos(theta)
    + mass * 9.80665 * Math.sin(theta);
  if (force <= 0) throw new EngineeringInputError("The requested operating point produces no positive tractive-force requirement.");
  const motorTorque = force * wheelRadius / (gearRatio * efficiency);
  const motorRpm = 60 * speed * gearRatio / (2 * Math.PI * wheelRadius);
  const inputPower = force * speed / efficiency;
  return {
    values: [
      { label: "Required wheel force", value: force, unit: "N", digits: 1 },
      { label: "Motor torque", value: motorTorque, unit: "N m", digits: 2 },
      { label: "Motor speed", value: motorRpm, unit: "rpm", digits: 0 },
      { label: "Minimum input power", value: inputPower / 1000, unit: "kW", digits: 2 }
    ]
  };
}

function pneumaticCalculation(inputs: Record<string, number>): CalculatorOutput {
  const bore = positiveInput(inputs, "bore", "Bore diameter") / 1000;
  const rod = positiveInput(inputs, "rod", "Rod diameter") / 1000;
  const pressure = positiveInput(inputs, "pressure", "Gauge pressure") * 1e5;
  const efficiency = boundedInput(inputs, "efficiency", "Mechanical efficiency", 0, 1, false);
  if (rod >= bore) throw new EngineeringInputError("Rod diameter must be smaller than bore diameter.");
  const pistonArea = Math.PI * bore ** 2 / 4;
  const annulusArea = pistonArea - Math.PI * rod ** 2 / 4;
  return {
    values: [
      { label: "Extension force", value: pressure * pistonArea * efficiency, unit: "N", digits: 1 },
      { label: "Retraction force", value: pressure * annulusArea * efficiency, unit: "N", digits: 1 },
      { label: "Piston area", value: pistonArea * 1e6, unit: "mm2", digits: 1 },
      { label: "Annulus area", value: annulusArea * 1e6, unit: "mm2", digits: 1 }
    ],
    warnings: ["Force estimate excludes breakaway friction, dynamic pressure loss, cushioning and load-side safety factors."]
  };
}

function threePhaseCalculation(inputs: Record<string, number>): CalculatorOutput {
  const voltage = positiveInput(inputs, "voltage", "Line voltage");
  const current = positiveInput(inputs, "current", "Line current");
  const powerFactor = boundedInput(inputs, "powerFactor", "Power factor", 0, 1);
  const efficiency = boundedInput(inputs, "efficiency", "Efficiency", 0, 1, false);
  const apparent = Math.sqrt(3) * voltage * current;
  const real = apparent * powerFactor;
  const reactive = apparent * Math.sqrt(Math.max(0, 1 - powerFactor ** 2));
  return {
    values: [
      { label: "Apparent power", value: apparent / 1000, unit: "kVA", digits: 3 },
      { label: "Real input power", value: real / 1000, unit: "kW", digits: 3 },
      { label: "Reactive power", value: reactive / 1000, unit: "kVAr", digits: 3 },
      { label: "Estimated output power", value: real * efficiency / 1000, unit: "kW", digits: 3 }
    ]
  };
}

function conductorCalculation(inputs: Record<string, number>): CalculatorOutput {
  const voltage = positiveInput(inputs, "voltage", "System voltage");
  const current = positiveInput(inputs, "current", "Load current");
  const oneWayLength = positiveInput(inputs, "length", "One-way length");
  const area = positiveInput(inputs, "area", "Conductor area");
  const temperature = numberInput(inputs, "temperature", "Conductor temperature");
  const phases = numberInput(inputs, "phases", "Circuit mode");
  if (phases !== 1 && phases !== 3) throw new EngineeringInputError("Circuit mode must be 1 for DC or single phase, or 3 for three phase.");
  const resistivity = 0.017241 * (1 + 0.00393 * (temperature - 20));
  if (resistivity <= 0) throw new EngineeringInputError("Conductor temperature is outside the valid range for this linear copper estimate.");
  const oneWayResistance = resistivity * oneWayLength / area;
  const factor = phases === 3 ? Math.sqrt(3) : 2;
  const voltageDrop = factor * current * oneWayResistance;
  const loss = phases === 3 ? 3 * current ** 2 * oneWayResistance : 2 * current ** 2 * oneWayResistance;
  return {
    values: [
      { label: "Voltage drop", value: voltageDrop, unit: "V", digits: 3 },
      { label: "Voltage drop", value: voltageDrop / voltage * 100, unit: "%", digits: 2 },
      { label: "Estimated conductor loss", value: loss, unit: "W", digits: 2 },
      { label: "One-way conductor resistance", value: oneWayResistance, unit: "ohm", digits: 5 }
    ],
    warnings: ["Resistive estimate only. It is not cable ampacity, protection, installation-method or AS/NZS 3008 selection advice."]
  };
}

function linearScalingCalculation(inputs: Record<string, number>): CalculatorOutput {
  const signal = numberInput(inputs, "signal", "Signal");
  const signalMinimum = numberInput(inputs, "signalMinimum", "Signal minimum");
  const signalMaximum = numberInput(inputs, "signalMaximum", "Signal maximum");
  const engineeringMinimum = numberInput(inputs, "engineeringMinimum", "Engineering minimum");
  const engineeringMaximum = numberInput(inputs, "engineeringMaximum", "Engineering maximum");
  if (signalMaximum === signalMinimum) throw new EngineeringInputError("Signal maximum and minimum must be different.");
  const fraction = (signal - signalMinimum) / (signalMaximum - signalMinimum);
  const engineeringValue = engineeringMinimum + fraction * (engineeringMaximum - engineeringMinimum);
  const warnings: string[] = [];
  if (fraction < 0) warnings.push("Signal is below the configured range. The result is extrapolated and has not been clamped.");
  if (fraction > 1) warnings.push("Signal is above the configured range. The result is extrapolated and has not been clamped.");
  return {
    values: [
      { label: "Engineering value", value: engineeringValue, unit: "EU", digits: 4 },
      { label: "Span position", value: fraction * 100, unit: "%", digits: 2 }
    ],
    warnings
  };
}

function pipeFlowCalculation(inputs: Record<string, number>): CalculatorOutput {
  const density = positiveInput(inputs, "density", "Fluid density");
  const viscosity = positiveInput(inputs, "viscosity", "Dynamic viscosity") / 1000;
  const diameter = positiveInput(inputs, "diameter", "Internal diameter") / 1000;
  const velocity = positiveInput(inputs, "velocity", "Mean velocity");
  const length = positiveInput(inputs, "length", "Pipe length");
  const roughness = numberInput(inputs, "roughness", "Absolute roughness") / 1000;
  if (roughness < 0) throw new EngineeringInputError("Absolute roughness cannot be negative.");
  const reynolds = density * velocity * diameter / viscosity;
  const relativeRoughness = roughness / diameter;
  const friction = reynolds < 2300
    ? 64 / reynolds
    : 0.25 / Math.log10(relativeRoughness / 3.7 + 5.74 / reynolds ** 0.9) ** 2;
  const pressureDrop = friction * length / diameter * density * velocity ** 2 / 2;
  const flow = velocity * Math.PI * diameter ** 2 / 4;
  const regime = reynolds < 2300 ? 1 : reynolds < 4000 ? 2 : 3;
  return {
    values: [
      { label: "Reynolds number", value: reynolds, unit: "", digits: 0 },
      { label: "Darcy friction factor", value: friction, unit: "", digits: 5 },
      { label: "Pressure drop", value: pressureDrop / 1000, unit: "kPa", digits: 3 },
      { label: "Volumetric flow", value: flow * 1000, unit: "L/s", digits: 3 }
    ],
    warnings: regime === 2 ? ["Flow is transitional. Friction-factor estimates are especially uncertain in this region."] : []
  };
}

function thermalExpansionCalculation(inputs: Record<string, number>): CalculatorOutput {
  const length = positiveInput(inputs, "length", "Initial length");
  const temperatureChange = numberInput(inputs, "temperatureChange", "Temperature change");
  const coefficient = positiveInput(inputs, "coefficient", "Thermal expansion coefficient") * 1e-6;
  const expansion = coefficient * length * temperatureChange;
  return {
    values: [
      { label: "Length change", value: expansion * 1000, unit: "mm", digits: 3 },
      { label: "Final length", value: length + expansion, unit: "m", digits: 6 },
      { label: "Thermal strain", value: coefficient * temperatureChange * 1e6, unit: "microstrain", digits: 1 }
    ]
  };
}

function conductionCalculation(inputs: Record<string, number>): CalculatorOutput {
  const conductivity = positiveInput(inputs, "conductivity", "Thermal conductivity");
  const area = positiveInput(inputs, "area", "Heat-transfer area");
  const thickness = positiveInput(inputs, "thickness", "Wall thickness") / 1000;
  const temperatureDifference = numberInput(inputs, "temperatureDifference", "Temperature difference");
  const heatRate = conductivity * area * temperatureDifference / thickness;
  return {
    values: [
      { label: "Heat-transfer rate", value: heatRate, unit: "W", digits: 2 },
      { label: "Thermal resistance", value: thickness / (conductivity * area), unit: "K/W", digits: 5 },
      { label: "Heat flux", value: heatRate / area, unit: "W/m2", digits: 1 }
    ],
    warnings: ["One-dimensional, steady-state conduction estimate with constant material properties and no contact or convection resistance."]
  };
}

function machiningCalculation(inputs: Record<string, number>): CalculatorOutput {
  const diameter = positiveInput(inputs, "diameter", "Cutter diameter");
  const cuttingSpeed = positiveInput(inputs, "cuttingSpeed", "Cutting speed");
  const teeth = positiveInput(inputs, "teeth", "Number of teeth");
  if (!Number.isInteger(teeth)) throw new EngineeringInputError("Number of teeth must be an integer.");
  const feedPerTooth = positiveInput(inputs, "feedPerTooth", "Feed per tooth");
  const depth = positiveInput(inputs, "depth", "Axial depth of cut");
  const width = positiveInput(inputs, "width", "Radial width of cut");
  const rpm = cuttingSpeed * 1000 / (Math.PI * diameter);
  const feed = rpm * teeth * feedPerTooth;
  return {
    values: [
      { label: "Spindle speed", value: rpm, unit: "rpm", digits: 0 },
      { label: "Table feed", value: feed, unit: "mm/min", digits: 0 },
      { label: "Material removal rate", value: feed * depth * width / 1000, unit: "cm3/min", digits: 2 }
    ],
    warnings: ["Starting estimate only. Confirm limits and cutting data with the tool, material and machine suppliers."]
  };
}

function robotArmCalculation(inputs: Record<string, number>): CalculatorOutput {
  const link1 = positiveInput(inputs, "link1", "Link 1 length");
  const link2 = positiveInput(inputs, "link2", "Link 2 length");
  const targetX = numberInput(inputs, "targetX", "Target X");
  const targetY = numberInput(inputs, "targetY", "Target Y");
  const radius = Math.hypot(targetX, targetY);
  if (radius > link1 + link2 || radius < Math.abs(link1 - link2)) {
    throw new EngineeringInputError("Target is outside the reachable annulus for the entered link lengths.");
  }
  const cosine2 = Math.max(-1, Math.min(1, (radius ** 2 - link1 ** 2 - link2 ** 2) / (2 * link1 * link2)));
  const angle2Up = Math.atan2(Math.sqrt(Math.max(0, 1 - cosine2 ** 2)), cosine2);
  const angle2Down = Math.atan2(-Math.sqrt(Math.max(0, 1 - cosine2 ** 2)), cosine2);
  const shoulder = (angle2: number) => Math.atan2(targetY, targetX)
    - Math.atan2(link2 * Math.sin(angle2), link1 + link2 * Math.cos(angle2));
  const angle1Up = shoulder(angle2Up);
  const angle1Down = shoulder(angle2Down);
  const singular = Math.abs(Math.sin(angle2Up)) < 1e-6;
  return {
    values: [
      { label: "Elbow-up shoulder", value: angle1Up * 180 / Math.PI, unit: "deg", digits: 3 },
      { label: "Elbow-up elbow", value: angle2Up * 180 / Math.PI, unit: "deg", digits: 3 },
      { label: "Elbow-down shoulder", value: angle1Down * 180 / Math.PI, unit: "deg", digits: 3 },
      { label: "Elbow-down elbow", value: angle2Down * 180 / Math.PI, unit: "deg", digits: 3 }
    ],
    warnings: singular ? ["Target is at or close to a kinematic singularity."] : []
  };
}

export const calculatorDefinitions: CalculatorDefinition[] = [
  {
    id: "beam-bending",
    title: "Beam bending",
    category: "Mechanical",
    description: "Simply supported rectangular beam with a central point load.",
    equation: "Mmax = PL/4, delta = PL^3/(48EI), I = bh^3/12",
    assumptions: ["Euler-Bernoulli beam", "Small deflection", "Linear elastic material", "Static centre load"],
    fields: [
      { id: "load", label: "Centre load", unit: "N", defaultValue: 1000, min: 0, step: 10 },
      { id: "length", label: "Span", unit: "m", defaultValue: 2, min: 0, step: 0.1 },
      { id: "width", label: "Section width", unit: "mm", defaultValue: 50, min: 0, step: 1 },
      { id: "height", label: "Section height", unit: "mm", defaultValue: 100, min: 0, step: 1 },
      { id: "modulus", label: "Elastic modulus", unit: "GPa", defaultValue: 200, min: 0, step: 1 },
      { id: "yield", label: "Yield strength", unit: "MPa", defaultValue: 250, min: 0, step: 1 }
    ],
    calculate: beamCalculation
  },
  {
    id: "shaft-torsion",
    title: "Shaft torsion",
    category: "Mechanical",
    description: "Stress and twist for a solid or hollow circular shaft.",
    equation: "J = pi(do^4-di^4)/32, tau = T(do/2)/J, phi = TL/(JG)",
    assumptions: ["Linear elastic torsion", "Circular uniform shaft", "Static torque", "No stress concentration"],
    fields: [
      { id: "torque", label: "Torque", unit: "N m", defaultValue: 100, min: 0, step: 1 },
      { id: "length", label: "Shaft length", unit: "m", defaultValue: 1, min: 0, step: 0.1 },
      { id: "outerDiameter", label: "Outer diameter", unit: "mm", defaultValue: 20, min: 0, step: 1 },
      { id: "innerDiameter", label: "Inner diameter", unit: "mm", defaultValue: 0, min: 0, step: 1 },
      { id: "shearModulus", label: "Shear modulus", unit: "GPa", defaultValue: 80, min: 0, step: 1 },
      { id: "allowableShear", label: "Allowable shear stress", unit: "MPa", defaultValue: 100, min: 0, step: 1 }
    ],
    calculate: shaftCalculation
  },
  {
    id: "drive-sizing",
    title: "Motor and drive sizing",
    category: "Mechanical",
    description: "Tractive force, motor torque, speed and power for a wheeled drive.",
    equation: "F = ma + Crr mg cos(theta) + mg sin(theta), T = Fr/(G eta)",
    assumptions: ["Constant grade", "No aerodynamic drag", "No wheel slip", "Steady drivetrain efficiency"],
    fields: [
      { id: "mass", label: "Vehicle mass", unit: "kg", defaultValue: 80, min: 0, step: 1 },
      { id: "acceleration", label: "Target acceleration", unit: "m/s2", defaultValue: 0.5, step: 0.1 },
      { id: "speed", label: "Target speed", unit: "m/s", defaultValue: 2, min: 0, step: 0.1 },
      { id: "wheelRadius", label: "Wheel radius", unit: "m", defaultValue: 0.15, min: 0, step: 0.01 },
      { id: "grade", label: "Road grade", unit: "%", defaultValue: 5, step: 0.5 },
      { id: "rollingResistance", label: "Rolling resistance", unit: "", defaultValue: 0.02, min: 0, max: 1, step: 0.005 },
      { id: "gearRatio", label: "Reduction ratio", unit: ":1", defaultValue: 10, min: 0, step: 0.5 },
      { id: "efficiency", label: "Drivetrain efficiency", unit: "", defaultValue: 0.85, min: 0, max: 1, step: 0.01 }
    ],
    calculate: driveCalculation
  },
  {
    id: "pneumatic-cylinder",
    title: "Pneumatic cylinder force",
    category: "Mechanical",
    description: "Extension and retraction force from cylinder geometry and gauge pressure.",
    equation: "Fextend = p pi D^2/4, Fretract = p pi(D^2-d^2)/4",
    assumptions: ["Gauge pressure at cylinder", "Static force", "Constant entered efficiency"],
    fields: [
      { id: "bore", label: "Bore diameter", unit: "mm", defaultValue: 50, min: 0, step: 1 },
      { id: "rod", label: "Rod diameter", unit: "mm", defaultValue: 20, min: 0, step: 1 },
      { id: "pressure", label: "Gauge pressure", unit: "bar", defaultValue: 6, min: 0, step: 0.1 },
      { id: "efficiency", label: "Mechanical efficiency", unit: "", defaultValue: 0.9, min: 0, max: 1, step: 0.01 }
    ],
    calculate: pneumaticCalculation
  },
  {
    id: "three-phase-power",
    title: "Three-phase power",
    category: "Electrical",
    description: "Balanced three-phase apparent, real, reactive and output power.",
    equation: "S = sqrt(3)VLLI, P = S PF, Q = S sqrt(1-PF^2)",
    assumptions: ["Balanced sinusoidal three-phase system", "Line-to-line RMS voltage", "Constant efficiency"],
    fields: [
      { id: "voltage", label: "Line voltage", unit: "V", defaultValue: 400, min: 0, step: 1 },
      { id: "current", label: "Line current", unit: "A", defaultValue: 10, min: 0, step: 0.1 },
      { id: "powerFactor", label: "Power factor", unit: "", defaultValue: 0.8, min: 0, max: 1, step: 0.01 },
      { id: "efficiency", label: "Efficiency", unit: "", defaultValue: 0.9, min: 0, max: 1, step: 0.01 }
    ],
    calculate: threePhaseCalculation
  },
  {
    id: "conductor-drop",
    title: "Copper conductor voltage drop",
    category: "Electrical",
    description: "Resistive voltage-drop and loss estimate for copper conductors.",
    equation: "rhoT = rho20[1+alpha(T-20)], R = rhoT L/A, Vdrop = 2IR or sqrt(3)IR",
    assumptions: ["Copper conductor", "Resistive estimate", "No reactance", "Uniform conductor temperature"],
    fields: [
      { id: "voltage", label: "System voltage", unit: "V", defaultValue: 24, min: 0, step: 1 },
      { id: "current", label: "Load current", unit: "A", defaultValue: 10, min: 0, step: 0.1 },
      { id: "length", label: "One-way length", unit: "m", defaultValue: 10, min: 0, step: 0.5 },
      { id: "area", label: "Conductor area", unit: "mm2", defaultValue: 2.5, min: 0, step: 0.5 },
      { id: "temperature", label: "Conductor temperature", unit: "deg C", defaultValue: 60, step: 1 },
      { id: "phases", label: "Circuit mode (1 or 3)", unit: "", defaultValue: 1, min: 1, max: 3, step: 2 }
    ],
    calculate: conductorCalculation
  },
  {
    id: "linear-scaling",
    title: "4-20 mA and linear scaling",
    category: "Instrumentation",
    description: "Map any linear signal span into engineering units without silent clamping.",
    equation: "EU = EUmin + (signal-smin)(EUmax-EUmin)/(smax-smin)",
    assumptions: ["Linear transmitter response", "No sensor calibration or uncertainty correction"],
    fields: [
      { id: "signal", label: "Signal", unit: "mA", defaultValue: 12, step: 0.1 },
      { id: "signalMinimum", label: "Signal minimum", unit: "mA", defaultValue: 4, step: 0.1 },
      { id: "signalMaximum", label: "Signal maximum", unit: "mA", defaultValue: 20, step: 0.1 },
      { id: "engineeringMinimum", label: "Engineering minimum", unit: "EU", defaultValue: 0, step: 1 },
      { id: "engineeringMaximum", label: "Engineering maximum", unit: "EU", defaultValue: 100, step: 1 }
    ],
    calculate: linearScalingCalculation
  },
  {
    id: "pipe-flow",
    title: "Pipe flow and pressure drop",
    category: "Thermal and fluids",
    description: "Reynolds number and Darcy-Weisbach pressure drop for a straight circular pipe.",
    equation: "Re = rho v D/mu, dp = f(L/D)rho v^2/2",
    assumptions: ["Steady incompressible flow", "Straight full circular pipe", "No fitting or elevation losses"],
    fields: [
      { id: "density", label: "Fluid density", unit: "kg/m3", defaultValue: 998, min: 0, step: 1 },
      { id: "viscosity", label: "Dynamic viscosity", unit: "mPa s", defaultValue: 1.002, min: 0, step: 0.01 },
      { id: "diameter", label: "Internal diameter", unit: "mm", defaultValue: 25, min: 0, step: 1 },
      { id: "velocity", label: "Mean velocity", unit: "m/s", defaultValue: 1.5, min: 0, step: 0.1 },
      { id: "length", label: "Pipe length", unit: "m", defaultValue: 20, min: 0, step: 1 },
      { id: "roughness", label: "Absolute roughness", unit: "mm", defaultValue: 0.045, min: 0, step: 0.005 }
    ],
    calculate: pipeFlowCalculation
  },
  {
    id: "thermal-expansion",
    title: "Thermal expansion",
    category: "Thermal and fluids",
    description: "Free linear thermal expansion or contraction for a uniform member.",
    equation: "deltaL = alpha L deltaT",
    assumptions: ["Uniform temperature", "Unrestrained member", "Constant expansion coefficient"],
    fields: [
      { id: "length", label: "Initial length", unit: "m", defaultValue: 2, min: 0, step: 0.1 },
      { id: "temperatureChange", label: "Temperature change", unit: "deg C", defaultValue: 40, step: 1 },
      { id: "coefficient", label: "Expansion coefficient", unit: "um/m K", defaultValue: 23.6, min: 0, step: 0.1 }
    ],
    calculate: thermalExpansionCalculation
  },
  {
    id: "heat-conduction",
    title: "Wall heat conduction",
    category: "Thermal and fluids",
    description: "One-dimensional steady conduction through a uniform flat wall.",
    equation: "Q = k A deltaT / L",
    assumptions: ["Steady state", "One-dimensional conduction", "Constant thermal conductivity"],
    fields: [
      { id: "conductivity", label: "Thermal conductivity", unit: "W/m K", defaultValue: 0.04, min: 0, step: 0.01 },
      { id: "area", label: "Heat-transfer area", unit: "m2", defaultValue: 10, min: 0, step: 0.5 },
      { id: "thickness", label: "Wall thickness", unit: "mm", defaultValue: 100, min: 0, step: 1 },
      { id: "temperatureDifference", label: "Temperature difference", unit: "K", defaultValue: 20, step: 1 }
    ],
    calculate: conductionCalculation
  },
  {
    id: "machining",
    title: "Machining speed and feed",
    category: "Manufacturing",
    description: "Spindle speed, feed rate and material-removal estimate for a milling cutter.",
    equation: "rpm = 1000Vc/(piD), feed = rpm z fz",
    assumptions: ["Constant cutting data", "Milling operation", "No machine or tool deflection limit"],
    fields: [
      { id: "diameter", label: "Cutter diameter", unit: "mm", defaultValue: 10, min: 0, step: 1 },
      { id: "cuttingSpeed", label: "Cutting speed", unit: "m/min", defaultValue: 120, min: 0, step: 5 },
      { id: "teeth", label: "Number of teeth", unit: "", defaultValue: 4, min: 1, step: 1 },
      { id: "feedPerTooth", label: "Feed per tooth", unit: "mm", defaultValue: 0.05, min: 0, step: 0.01 },
      { id: "depth", label: "Axial depth of cut", unit: "mm", defaultValue: 2, min: 0, step: 0.5 },
      { id: "width", label: "Radial width of cut", unit: "mm", defaultValue: 5, min: 0, step: 0.5 }
    ],
    calculate: machiningCalculation
  },
  {
    id: "robot-arm",
    title: "Two-link robot inverse kinematics",
    category: "Robotics",
    description: "Elbow-up and elbow-down joint angles for a planar two-link arm.",
    equation: "c2 = (x^2+y^2-L1^2-L2^2)/(2L1L2)",
    assumptions: ["Planar rigid links", "Revolute joints", "No joint limits or collision checking"],
    fields: [
      { id: "link1", label: "Link 1 length", unit: "m", defaultValue: 1, min: 0, step: 0.1 },
      { id: "link2", label: "Link 2 length", unit: "m", defaultValue: 1, min: 0, step: 0.1 },
      { id: "targetX", label: "Target X", unit: "m", defaultValue: 1, step: 0.1 },
      { id: "targetY", label: "Target Y", unit: "m", defaultValue: 1, step: 0.1 }
    ],
    calculate: robotArmCalculation
  }
];

export function defaultInputs(definition: CalculatorDefinition): Record<string, number> {
  return Object.fromEntries(definition.fields.map((field) => [field.id, field.defaultValue]));
}

export function calculateById(id: string, inputs: Record<string, number>): CalculatorOutput {
  const definition = calculatorDefinitions.find((tool) => tool.id === id);
  if (!definition) throw new EngineeringInputError(`Unknown engineering calculator: ${id}`);
  const output = definition.calculate(inputs);
  if (output.values.length === 0 || output.values.some((result) => !Number.isFinite(result.value))) {
    throw new EngineeringInputError("The result is outside the supported numeric range. Review the input magnitudes.");
  }
  return output;
}
