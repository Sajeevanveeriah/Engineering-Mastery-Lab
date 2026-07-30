import {
  ACADEMY_CONTENT_VERSION,
  ACADEMY_SCHEMA_VERSION,
  type AcademyInstruction,
  type AcademyDiagramStructure,
  type AcademyQuestion,
  type AcademyQuestionMathSupport,
  type AcademyReviewedMath,
  type AcademyStage,
  type AcademyStageContent,
  type FormulaSpec,
  type FormulaVariable,
  type Lesson,
  type LessonBlock,
  type WorkedExample
} from "../../lib/academy/types";
import { academyMediaByLessonId } from "../academyMedia";
import {
  academyLessonMinutePattern,
  academyUnitSeeds,
  academyUnitPrerequisiteMap,
  academyUnitSourceMap,
  academyUnits,
  lessonIdsForUnit,
  questionId,
  skillIdForUnit
} from "./catalogue";
import {
  type AcademyLessonTeachingProfileRegistry,
  validateAcademyLessonTeachingProfiles
} from "./lessonTeachingProfileValidation";

interface FormulaExampleSeed {
  problem: string;
  steps: string[];
  result: string;
  independentCheck: string;
}

const reviewedMath = (
  id: string,
  plainText: string,
  latex: string,
  spoken: string,
  displayMode = true
): AcademyReviewedMath => ({
  id,
  plainText,
  latex,
  spoken,
  displayMode
});

const reviewedTextInstruction = (text: string): AcademyInstruction => [{
  kind: "text",
  text
}];

const reviewedFormulaInstruction = (
  id: string,
  template: FormulaTemplate
): AcademyInstruction => [{
  kind: "math",
  expression: reviewedMath(
    id,
    template.latex,
    template.latex,
    template.spoken
  )
}];

interface FormulaTemplate {
  latex: string;
  spoken: string;
  variables: FormulaVariable[];
  assumptions: string[];
  derivationSteps: string[];
  dimensionalCheck: string;
  examples: readonly [FormulaExampleSeed, FormulaExampleSeed];
  numericPrompt: string;
  numericExpected: number;
  canonicalUnit: string;
  acceptedUnits: Record<string, number>;
  tolerance: number;
}

const formula = (
  latex: string,
  spoken: string,
  variables: FormulaVariable[],
  assumptions: string[],
  derivationSteps: string[],
  dimensionalCheck: string,
  examples: readonly [FormulaExampleSeed, FormulaExampleSeed],
  numericPrompt: string,
  numericExpected: number,
  canonicalUnit: string,
  acceptedUnits: Record<string, number>,
  tolerance = 0.01
): FormulaTemplate => ({
  latex,
  spoken,
  variables,
  assumptions,
  derivationSteps,
  dimensionalCheck,
  examples,
  numericPrompt,
  numericExpected,
  canonicalUnit,
  acceptedUnits,
  tolerance
});

const worked = (
  problem: string,
  relationship: string,
  substitution: string,
  evaluation: string,
  result: string,
  independentCheck: string
): FormulaExampleSeed => ({
  problem,
  steps: [relationship, substitution, evaluation],
  result,
  independentCheck
});

export const academyFormulaTemplates = {
  sum: formula(
    "q_{total}=\\sum_{i=1}^{n}q_i",
    "The total quantity equals the sum of each component quantity.",
    [
      { symbol: "q_{total}", meaning: "total quantity", siUnit: "same unit as q_i" },
      { symbol: "q_i", meaning: "component quantity i", siUnit: "same unit as q_total" },
      { symbol: "n", meaning: "number of components", siUnit: "1" }
    ],
    ["Every component uses the same unit", "Components do not overlap"],
    ["Identify the complete component boundary.", "Convert every value to one unit.", "Add the values and retain sensible precision."],
    "unit(q_total) = unit(q_i)",
    [
      {
        problem: "Four activities take 10 min, 15 min, 20 min and 5 min. Find the total.",
        steps: ["Use minutes for every term.", "Add 10 + 15 + 20 + 5.", "Retain the exact integer total."],
        result: "q_total = 50 min",
        independentCheck: "Group the terms as (10 + 20) + (15 + 5) = 30 + 20 = 50 min."
      },
      {
        problem: "Three test runs take 180 s, 240 s and 300 s. Find the total in minutes.",
        steps: ["Add 180 + 240 + 300 = 720 s.", "Convert with 60 s = 1 min.", "720 / 60 = 12 min."],
        result: "q_total = 720 s = 12 min",
        independentCheck: "3 min + 4 min + 5 min = 12 min."
      }
    ],
    "Three operations take 120 s, 180 s and 300 s. What is the total duration in seconds?",
    600,
    "s",
    { s: 1, min: 60 },
    0
  ),
  ratio: formula(
    "r=\\frac{a}{b}",
    "The ratio r compares quantity a with reference quantity b.",
    [
      { symbol: "r", meaning: "ratio", siUnit: "1" },
      { symbol: "a", meaning: "compared quantity", siUnit: "same unit as b" },
      { symbol: "b", meaning: "reference quantity", siUnit: "same unit as a" }
    ],
    ["a and b describe comparable quantities", "b is not zero"],
    ["Choose the reference quantity b.", "Convert a and b to the same unit.", "Divide a by b and state the comparison direction."],
    "1 = unit(a) / unit(b)",
    [
      {
        problem: "A mechanism moves 0.30 m for a 0.10 m input. Find the motion ratio.",
        steps: ["Use metres for both quantities.", "Substitute r = 0.30 / 0.10.", "Evaluate the dimensionless quotient."],
        result: "r = 3.0",
        independentCheck: "0.10 m multiplied by 3.0 returns 0.30 m."
      },
      {
        problem: "A test records 45 acceptable samples from 50 samples. Find the acceptable fraction.",
        steps: ["Set a = 45 and b = 50.", "Substitute r = 45 / 50.", "Evaluate and retain two significant figures."],
        result: "r = 0.90",
        independentCheck: "0.90 x 50 = 45 samples."
      }
    ],
    "A gearbox turns the output 25 times while the input turns 100 times. What is output/input?",
    0.25,
    "1",
    { "1": 1 },
    0.001
  ),
  linear: formula(
    "y=mx+c",
    "The output y equals slope m times input x plus intercept c.",
    [
      { symbol: "y", meaning: "predicted output", siUnit: "output unit" },
      { symbol: "m", meaning: "sensitivity or slope", siUnit: "output unit per input unit" },
      { symbol: "x", meaning: "input", siUnit: "input unit" },
      { symbol: "c", meaning: "output at zero input", siUnit: "output unit" }
    ],
    ["Sensitivity is constant over the stated range", "Inputs remain inside the calibrated range"],
    ["Start from a constant sensitivity dy/dx = m.", "Integrate with respect to x.", "Represent the integration constant as intercept c."],
    "unit(y) = unit(m) unit(x) = unit(c)",
    [
      {
        problem: "A sensor has m = 2.0 mV/kPa, c = 10 mV and x = 40 kPa.",
        steps: ["Substitute y = (2.0 mV/kPa)(40 kPa) + 10 mV.", "Cancel kPa.", "Add 80 mV + 10 mV."],
        result: "y = 90 mV",
        independentCheck: "Subtract the 10 mV intercept, then 80 mV / 2.0 mV/kPa = 40 kPa."
      },
      {
        problem: "A scale gives 0.50 V/kg with a 0.20 V offset for a 6.0 kg load.",
        steps: ["Substitute y = (0.50 V/kg)(6.0 kg) + 0.20 V.", "Cancel kg.", "Add 3.0 V + 0.20 V."],
        result: "y = 3.2 V",
        independentCheck: "(3.2 V - 0.20 V) / 0.50 V/kg = 6.0 kg."
      }
    ],
    "A sensor uses y = 0.25x + 0.50, with y in volts and x in kilopascals. Find y for x = 10 kPa.",
    3,
    "V",
    { V: 1, mV: 0.001 },
    0.001
  ),
  vector: formula(
    "\\lVert\\mathbf{r}\\rVert=\\sqrt{x^2+y^2}",
    "The magnitude of a planar vector is the square root of the sum of squared orthogonal components.",
    [
      { symbol: "\\lVert\\mathbf{r}\\rVert", meaning: "vector magnitude", siUnit: "m" },
      { symbol: "x", meaning: "x component", siUnit: "m" },
      { symbol: "y", meaning: "y component", siUnit: "m" }
    ],
    ["x and y use orthogonal axes", "Both components are expressed in metres"],
    ["Form a right triangle from the orthogonal components.", "Apply Pythagoras: r^2 = x^2 + y^2.", "Take the non-negative square root for magnitude."],
    "m = sqrt(m^2 + m^2)",
    [
      {
        problem: "A displacement has components x = 3.0 m and y = 4.0 m.",
        steps: ["Substitute sqrt((3.0 m)^2 + (4.0 m)^2).", "Add 9.0 m^2 + 16.0 m^2.", "Take sqrt(25.0 m^2)."],
        result: "|r| = 5.0 m",
        independentCheck: "The 3-4-5 right triangle gives the same magnitude."
      },
      {
        problem: "A position error is 0.12 m east and 0.05 m north.",
        steps: ["Square both components.", "Add 0.0144 m^2 + 0.0025 m^2 = 0.0169 m^2.", "Take the square root."],
        result: "|r| = 0.13 m",
        independentCheck: "0.13^2 = 0.0169 m^2."
      }
    ],
    "A position vector has x = 6 m and y = 8 m. What is its magnitude?",
    10,
    "m",
    { m: 1, cm: 0.01, mm: 0.001 },
    0.001
  ),
  eigen: formula(
    "A\\mathbf{v}=\\lambda\\mathbf{v}",
    "An eigenvector v keeps its direction under matrix A and is scaled by eigenvalue lambda.",
    [
      { symbol: "A", meaning: "square linear transformation matrix", siUnit: "1" },
      { symbol: "\\mathbf{v}", meaning: "non-zero eigenvector", siUnit: "1" },
      { symbol: "\\lambda", meaning: "eigenvalue scale factor", siUnit: "1" }
    ],
    ["A is square", "The eigenvector is non-zero", "All components use a consistent basis"],
    ["Apply matrix A to a candidate non-zero vector v.", "Require the output to remain parallel to v.", "The scale between output and input is eigenvalue lambda."],
    "dimensionless vector = dimensionless scale x dimensionless vector",
    [
      {
        problem: "For A = diag(2, 3), test v = [1, 0]^T.",
        steps: ["Multiply A by v to obtain [2, 0]^T.", "Compare [2, 0]^T with [1, 0]^T.", "The output is 2 times the input vector."],
        result: "lambda = 2",
        independentCheck: "A v - 2 v = [0, 0]^T."
      },
      {
        problem: "For A = diag(4, 1), test v = [0, 1]^T.",
        steps: ["Multiply A by v to obtain [0, 1]^T.", "Compare output and input directions.", "The output is 1 times the input vector."],
        result: "lambda = 1",
        independentCheck: "A v - 1 v = [0, 0]^T."
      }
    ],
    "For A = diag(3, 5) and v = [1, 0]^T, what eigenvalue satisfies A v = lambda v?",
    3,
    "1",
    { "1": 1 },
    0.001
  ),
  inverseDerivative: formula(
    "\\frac{\\mathrm{d}x}{\\mathrm{d}y}=\\frac{1}{\\mathrm{d}y/\\mathrm{d}x}",
    "The derivative of an inverse mapping is the reciprocal of the original derivative at corresponding points.",
    [
      { symbol: "x", meaning: "input of the original mapping", siUnit: "input unit" },
      { symbol: "y", meaning: "output of the original mapping", siUnit: "output unit" },
      { symbol: "\\mathrm{d}y/\\mathrm{d}x", meaning: "original local slope", siUnit: "output unit per input unit" },
      { symbol: "\\mathrm{d}x/\\mathrm{d}y", meaning: "inverse local slope", siUnit: "input unit per output unit" }
    ],
    ["The mapping is locally one-to-one", "The original derivative is finite and non-zero"],
    ["Write the identity x = f^{-1}(f(x)).", "Differentiate both sides with respect to x using the chain rule.", "Rearrange the product of slopes to obtain the reciprocal relationship."],
    "(input/output) = 1 / (output/input)",
    [
      {
        problem: "For y = 2x + 3, find the derivative of the inverse.",
        steps: ["Differentiate the original mapping: dy/dx = 2.", "Take the reciprocal.", "State the inverse slope."],
        result: "dx/dy = 0.5",
        independentCheck: "The inverse is x = (y - 3)/2, whose derivative is 0.5."
      },
      {
        problem: "For y = x^2 on x > 0, find inverse slope at x = 3.",
        steps: ["Differentiate: dy/dx = 2x.", "At x = 3, dy/dx = 6.", "Take the reciprocal."],
        result: "dx/dy = 1/6",
        independentCheck: "The inverse x = sqrt(y) has derivative 1/(2 sqrt(y)); at y = 9 this is 1/6."
      }
    ],
    "If the local slope dy/dx is 4, what is the inverse slope dx/dy?",
    0.25,
    "1",
    { "1": 1 },
    0.001
  ),
  derivative: formula(
    "v=\\frac{\\mathrm{d}x}{\\mathrm{d}t}",
    "Velocity is the time derivative of position.",
    [
      { symbol: "v", meaning: "instantaneous velocity", siUnit: "m/s" },
      { symbol: "x", meaning: "position", siUnit: "m" },
      { symbol: "t", meaning: "time", siUnit: "s" }
    ],
    ["Position is differentiable over the interval", "The chosen reference frame is fixed"],
    ["Take a position change Delta x over interval Delta t.", "Shrink the interval while retaining the quotient.", "The limiting quotient is dx/dt."],
    "m/s = m / s",
    [
      {
        problem: "For x = 2t^(2) m, find velocity at t = 3 s.",
        steps: ["Differentiate x to obtain v = 4t m/s.", "Substitute t = 3 s.", "Evaluate (4 x 3) m/s."],
        result: "v = 12 m/s",
        independentCheck: "A centred difference around 3 s approaches 12 m/s as the interval shrinks."
      },
      {
        problem: "Position changes from 1.0 m to 1.8 m in 0.20 s. Estimate average velocity.",
        steps: ["Find Delta x = 0.8 m.", "Use v_avg = Delta x / Delta t.", "Divide 0.8 m by 0.20 s."],
        result: "v_avg = 4.0 m/s",
        independentCheck: "4.0 m/s x 0.20 s = 0.8 m."
      }
    ],
    "Position changes by 2.4 m in 0.60 s. What is the average velocity?",
    4,
    "m/s",
    { "m/s": 1, "km/h": 0.2777777778 },
    0.001
  ),
  integral: formula(
    "Q=\\int_{t_0}^{t_1}q(t)\\,\\mathrm{d}t",
    "Accumulated quantity Q is the integral of rate q over time.",
    [
      { symbol: "Q", meaning: "accumulated quantity", siUnit: "rate unit times s" },
      { symbol: "q", meaning: "instantaneous rate", siUnit: "quantity/s" },
      { symbol: "t", meaning: "time", siUnit: "s" }
    ],
    ["The rate is integrable", "The integration interval is ordered"],
    ["Partition time into small intervals.", "Approximate each contribution as q Delta t.", "Sum contributions and take the interval width towards zero."],
    "unit(Q) = unit(q) s",
    [
      {
        problem: "A constant flow of 0.20 L/s lasts 30 s.",
        steps: ["For constant q, Q = q Delta t.", "Substitute 0.20 L/s x 30 s.", "Cancel seconds."],
        result: "Q = 6.0 L",
        independentCheck: "A rate of 0.20 L/s sustained for 30 s totals 6.0 L."
      },
      {
        problem: "Power is constant at 50 W for 120 s. Find energy.",
        steps: ["Use E = integral P dt = P Delta t.", "Substitute 50 J/s x 120 s.", "Cancel seconds."],
        result: "E = 6000 J",
        independentCheck: "6.0 kJ / 120 s = 50 W."
      }
    ],
    "A constant rate of 3 kg/s lasts 20 s. What mass accumulates?",
    60,
    "kg",
    { kg: 1, g: 0.001 },
    0.001
  ),
  force: formula(
    "F=ma",
    "Net force equals mass multiplied by acceleration.",
    [
      { symbol: "F", meaning: "net force", siUnit: "N" },
      { symbol: "m", meaning: "mass", siUnit: "kg" },
      { symbol: "a", meaning: "acceleration", siUnit: "m/s^2" }
    ],
    ["Mass is constant", "F is the vector sum of external forces"],
    ["Momentum is p = mv.", "For constant mass, dp/dt = m dv/dt.", "Recognise dv/dt as acceleration a."],
    "N = kg m/s^2",
    [
      {
        problem: "A 12 kg rover accelerates at 0.50 m/s^2.",
        steps: ["Substitute F = (12 kg)(0.50 m/s^2).", "Multiply the numerical values.", "Express kg m/s^2 as newtons."],
        result: "F = 6.0 N",
        independentCheck: "6.0 N / 12 kg = 0.50 m/s^2."
      },
      {
        problem: "A 2.5 kg payload experiences a 10 N net force.",
        steps: ["Rearrange a = F/m.", "Substitute 10 N / 2.5 kg.", "Evaluate and retain two significant figures."],
        result: "a = 4.0 m/s^2",
        independentCheck: "2.5 kg x 4.0 m/s^2 = 10 N."
      }
    ],
    "What net force accelerates a 20 kg mass at 0.30 m/s^2?",
    6,
    "N",
    { N: 1, kN: 1000 },
    0.001
  ),
  stress: formula(
    "\\sigma=\\frac{F}{A}",
    "Normal stress equals normal force divided by loaded area.",
    [
      { symbol: "\\sigma", meaning: "normal stress", siUnit: "Pa" },
      { symbol: "F", meaning: "normal force", siUnit: "N" },
      { symbol: "A", meaning: "loaded cross-sectional area", siUnit: "m^2" }
    ],
    ["Load is centred", "Average stress is adequate for the stated decision"],
    ["Imagine distributing force uniformly across the section.", "Define intensity as force per area.", "Use local analysis when the uniform assumption is not credible."],
    "Pa = N/m^2",
    [
      {
        problem: "A 2000 N load acts on 400 mm^2.",
        steps: ["Convert 400 mm^2 to 4.00e-4 m^2.", "Substitute sigma = 2000 N / 4.00e-4 m^2.", "Convert pascals to megapascals."],
        result: "sigma = 5.00 MPa",
        independentCheck: "5.00 N/mm^2 equals 5.00 MPa."
      },
      {
        problem: "A 10 mm by 5 mm section carries 1500 N.",
        steps: ["Area = 50 mm^2.", "Divide 1500 N by 50 mm^2.", "Use 1 N/mm^2 = 1 MPa."],
        result: "sigma = 30 MPa",
        independentCheck: "30 MPa x 50 mm^2 = 1500 N."
      }
    ],
    "A 1000 N load acts over 200 mm^2. What is the average stress in MPa?",
    5,
    "MPa",
    { MPa: 1, kPa: 0.001, Pa: 0.000001 },
    0.001
  ),
  power: formula(
    "P=T\\omega",
    "Rotational mechanical power equals torque multiplied by angular speed.",
    [
      { symbol: "P", meaning: "mechanical power", siUnit: "W" },
      { symbol: "T", meaning: "torque", siUnit: "N m" },
      { symbol: "\\omega", meaning: "angular speed", siUnit: "rad/s" }
    ],
    ["Torque and speed refer to the same shaft", "Losses are stated separately"],
    ["Incremental work in rotation is dW = T dtheta.", "Divide by dt.", "Recognise dtheta/dt as angular speed omega."],
    "W = N m rad/s, with rad dimensionless",
    [
      {
        problem: "A shaft delivers 8.0 N m at 25 rad/s.",
        steps: ["Substitute P = 8.0 N m x 25 rad/s.", "Treat radians as dimensionless.", "Multiply the values."],
        result: "P = 200 W",
        independentCheck: "200 W / 25 rad/s = 8.0 N m."
      },
      {
        problem: "A 600 W motor shaft turns at 100 rad/s.",
        steps: ["Rearrange T = P/omega.", "Substitute 600 W / 100 rad/s.", "Evaluate torque."],
        result: "T = 6.0 N m",
        independentCheck: "6.0 N m x 100 rad/s = 600 W."
      }
    ],
    "A shaft provides 4 N m at 50 rad/s. What power is transmitted?",
    200,
    "W",
    { W: 1, kW: 1000 },
    0.001
  ),
  ohm: formula(
    "V=IR",
    "Voltage across a resistor equals current through it multiplied by resistance.",
    [
      { symbol: "V", meaning: "voltage", siUnit: "V" },
      { symbol: "I", meaning: "current", siUnit: "A" },
      { symbol: "R", meaning: "resistance", siUnit: "ohm" }
    ],
    ["The element is adequately ohmic", "Values describe the same operating point"],
    ["Resistance is defined as the voltage-current ratio R = V/I.", "Multiply both sides by current I.", "Obtain V = IR."],
    "V = A ohm",
    [
      {
        problem: "A 220 ohm resistor carries 15 mA.",
        steps: ["Convert 15 mA to 0.015 A.", "Substitute V = 0.015 A x 220 ohm.", "Multiply."],
        result: "V = 3.3 V",
        independentCheck: "3.3 V / 220 ohm = 0.015 A."
      },
      {
        problem: "A 24 V supply drives 0.50 A through a resistive load.",
        steps: ["Rearrange R = V/I.", "Substitute 24 V / 0.50 A.", "Evaluate resistance."],
        result: "R = 48 ohm",
        independentCheck: "0.50 A x 48 ohm = 24 V."
      }
    ],
    "What voltage appears across 100 ohm when current is 0.020 A?",
    2,
    "V",
    { V: 1, mV: 0.001 },
    0.001
  ),
  timing: formula(
    "t=\\frac{N}{f}",
    "Elapsed time equals a count N divided by event frequency f.",
    [
      { symbol: "t", meaning: "elapsed time", siUnit: "s" },
      { symbol: "N", meaning: "number of events or cycles", siUnit: "1" },
      { symbol: "f", meaning: "event frequency", siUnit: "Hz" }
    ],
    ["Frequency is stable during the interval", "N counts complete events"],
    ["One event lasts 1/f seconds.", "N equal events last N times that period.", "Therefore t = N/f."],
    "s = 1 / Hz",
    [
      {
        problem: "A timer counts 5000 cycles at 1 MHz.",
        steps: ["Convert 1 MHz to 1.0e6 Hz.", "Substitute t = 5000 / 1.0e6 Hz.", "Convert seconds to milliseconds."],
        result: "t = 0.005 s = 5 ms",
        independentCheck: "1 MHz gives 1000 cycles per millisecond; 5000 cycles need 5 ms."
      },
      {
        problem: "A 10 kHz link sends a 20-cycle frame.",
        steps: ["Substitute t = 20 / 10000 Hz.", "Evaluate in seconds.", "Convert to milliseconds."],
        result: "t = 0.002 s = 2 ms",
        independentCheck: "Each cycle is 0.1 ms; 20 cycles need 2 ms."
      }
    ],
    "How long do 200 cycles take at 2 kHz, in seconds?",
    0.1,
    "s",
    { s: 1, ms: 0.001, us: 0.000001 },
    0.000001
  ),
  sampling: formula(
    "f_s\\geq 2f_{max}",
    "Sampling frequency must be at least twice the highest represented frequency for the ideal band-limited case.",
    [
      { symbol: "f_s", meaning: "sampling frequency", siUnit: "Hz" },
      { symbol: "f_{max}", meaning: "highest represented signal frequency", siUnit: "Hz" }
    ],
    ["The signal is band limited", "An anti-alias filter enforces the stated bandwidth"],
    ["Sampling repeats the spectrum at multiples of f_s.", "Adjacent spectral copies avoid overlap when f_s - f_max is at least f_max.", "Rearrange to f_s >= 2 f_max."],
    "Hz = Hz",
    [
      {
        problem: "A measured signal contains frequencies up to 80 Hz.",
        steps: ["Use f_s >= 2 x 80 Hz.", "Evaluate the theoretical minimum.", "Choose practical margin above the boundary."],
        result: "f_s,min = 160 Hz",
        independentCheck: "At 160 Hz, the Nyquist frequency is 80 Hz."
      },
      {
        problem: "A system samples at 1000 Hz. Find its ideal Nyquist frequency.",
        steps: ["Rearrange f_max <= f_s/2.", "Substitute 1000 Hz / 2.", "State that filtering and transition margin still matter."],
        result: "f_max <= 500 Hz",
        independentCheck: "Twice 500 Hz equals the 1000 Hz sampling rate."
      }
    ],
    "What is the theoretical minimum sample rate for a 120 Hz band-limited signal?",
    240,
    "Hz",
    { Hz: 1, kHz: 1000 },
    0.001
  ),
  control: formula(
    "u=K_p(r-y)",
    "A proportional controller applies gain Kp to the error between reference r and measured output y.",
    [
      { symbol: "u", meaning: "controller output", siUnit: "actuator unit" },
      { symbol: "K_p", meaning: "proportional gain", siUnit: "actuator unit per measured unit" },
      { symbol: "r", meaning: "reference", siUnit: "measured unit" },
      { symbol: "y", meaning: "measured output", siUnit: "measured unit" }
    ],
    ["Reference and output use the same unit", "Actuator saturation is checked separately"],
    ["Define tracking error e = r - y.", "Choose output proportional to error: u = Kp e.", "Substitute the error definition."],
    "unit(u) = unit(Kp) unit(r-y)",
    [
      {
        problem: "Reference is 10 rad/s, output is 8 rad/s and Kp = 2 V per rad/s.",
        steps: ["Compute e = 10 - 8 = 2 rad/s.", "Substitute u = 2 V/(rad/s) x 2 rad/s.", "Check the actuator range."],
        result: "u = 4 V",
        independentCheck: "u/Kp = 4/2 = 2 rad/s, matching the error."
      },
      {
        problem: "A temperature loop has r = 50 deg C, y = 47 deg C and Kp = 10 percent per deg C.",
        steps: ["Compute e = 3 deg C.", "Multiply by 10 percent per deg C.", "Compare with the 0 to 100 percent actuator boundary."],
        result: "u = 30 percent",
        independentCheck: "30 percent / 10 percent per deg C = 3 deg C."
      }
    ],
    "For Kp = 3 V/m, reference 2.0 m and output 1.5 m, what is u?",
    1.5,
    "V",
    { V: 1, mV: 0.001 },
    0.001
  ),
  robot: formula(
    "v=\\frac{v_R+v_L}{2},\\quad \\omega=\\frac{v_R-v_L}{L}",
    "Differential-drive linear speed is the wheel-speed mean and angular speed is their difference divided by wheel separation.",
    [
      { symbol: "v", meaning: "body linear speed", siUnit: "m/s" },
      { symbol: "\\omega", meaning: "body angular speed", siUnit: "rad/s" },
      { symbol: "v_R", meaning: "right wheel linear speed", siUnit: "m/s" },
      { symbol: "v_L", meaning: "left wheel linear speed", siUnit: "m/s" },
      { symbol: "L", meaning: "wheel separation", siUnit: "m" }
    ],
    ["Wheels roll without lateral slip", "Wheel speeds use the same sign convention"],
    ["The midpoint speed is the average of left and right edge speeds.", "The speed difference produces yaw across separation L.", "Apply the chosen positive-turn convention consistently."],
    "m/s = m/s; rad/s = (m/s)/m",
    [
      {
        problem: "Both wheels move at 0.60 m/s and L = 0.40 m.",
        steps: ["Average equal wheel speeds.", "Subtract equal speeds for yaw.", "Interpret the resulting straight motion."],
        result: "v = 0.60 m/s, omega = 0 rad/s",
        independentCheck: "Equal wheel travel keeps robot heading unchanged."
      },
      {
        problem: "vR = 0.50 m/s, vL = 0.10 m/s and L = 0.40 m.",
        steps: ["Compute v = (0.50 + 0.10)/2.", "Compute omega = (0.50 - 0.10)/0.40.", "Apply the positive-turn convention."],
        result: "v = 0.30 m/s, omega = 1.0 rad/s",
        independentCheck: "Reconstruct vR = v + omega L/2 = 0.50 m/s and vL = v - omega L/2 = 0.10 m/s."
      }
    ],
    "For vR = 0.8 m/s and vL = 0.4 m/s, what is body linear speed?",
    0.6,
    "m/s",
    { "m/s": 1, "km/h": 0.2777777778 },
    0.001
  ),
  estimate: formula(
    "\\hat{x}=\\frac{\\sum_i w_i x_i}{\\sum_i w_i}",
    "A weighted estimate is the weighted sum of measurements divided by total weight.",
    [
      { symbol: "\\hat{x}", meaning: "fused estimate", siUnit: "measurement unit" },
      { symbol: "w_i", meaning: "non-negative measurement weight", siUnit: "1" },
      { symbol: "x_i", meaning: "measurement i", siUnit: "measurement unit" }
    ],
    ["Weights are non-negative", "Measurements represent the same state and time"],
    ["Scale each measurement by its stated weight.", "Add the weighted measurements.", "Normalise by the sum of weights so the result keeps the measurement unit."],
    "unit(xhat) = unit(x)",
    [
      {
        problem: "Two positions are 2.0 m and 2.4 m with weights 3 and 1.",
        steps: ["Compute weighted sum 3 x 2.0 + 1 x 2.4 = 8.4 m.", "Sum weights 3 + 1 = 4.", "Divide 8.4 m by 4."],
        result: "xhat = 2.1 m",
        independentCheck: "The estimate lies between both measurements and closer to the higher-weight value."
      },
      {
        problem: "Measurements 10 deg and 14 deg have equal weights.",
        steps: ["Compute weighted sum 10 + 14 = 24 deg.", "Sum weights 2.", "Divide by 2."],
        result: "xhat = 12 deg",
        independentCheck: "Equal weights reduce to the arithmetic mean."
      }
    ],
    "Measurements 4 m and 10 m have weights 2 and 1. What is the weighted estimate?",
    6,
    "m",
    { m: 1, cm: 0.01, mm: 0.001 },
    0.001
  ),
  pinhole: formula(
    "u=f_x\\frac{X}{Z}+c_x",
    "Pinhole projection maps horizontal camera coordinate X at depth Z to image coordinate u.",
    [
      { symbol: "u", meaning: "horizontal image coordinate", siUnit: "px" },
      { symbol: "f_x", meaning: "horizontal focal length", siUnit: "px" },
      { symbol: "X", meaning: "horizontal camera coordinate", siUnit: "m" },
      { symbol: "Z", meaning: "camera depth", siUnit: "m" },
      { symbol: "c_x", meaning: "principal point", siUnit: "px" }
    ],
    ["Pinhole model is adequate", "Z is positive and non-zero", "Distortion has been corrected"],
    ["Use similar triangles: (u-cx)/fx = X/Z.", "Multiply by fx.", "Add principal point cx."],
    "px = px (m/m) + px",
    [
      {
        problem: "fx = 500 px, X = 0.20 m, Z = 2.0 m and cx = 320 px.",
        steps: ["Compute X/Z = 0.10.", "Multiply by 500 px.", "Add 320 px."],
        result: "u = 370 px",
        independentCheck: "(370 - 320)/500 = 0.10 = X/Z."
      },
      {
        problem: "fx = 600 px, u = 420 px, cx = 300 px and Z = 3.0 m. Find X.",
        steps: ["Rearrange X = (u-cx)Z/fx.", "Substitute 120 px x 3.0 m / 600 px.", "Cancel pixels."],
        result: "X = 0.60 m",
        independentCheck: "600 px x 0.60/3.0 + 300 px = 420 px."
      }
    ],
    "For fx = 400 px, X = 0.5 m, Z = 2 m and cx = 300 px, find u.",
    400,
    "px",
    { px: 1 },
    0.001
  ),
  metric: formula(
    "\\mathrm{precision}=\\frac{TP}{TP+FP}",
    "Precision is the fraction of positive predictions that are true positives.",
    [
      { symbol: "TP", meaning: "true-positive count", siUnit: "1" },
      { symbol: "FP", meaning: "false-positive count", siUnit: "1" }
    ],
    ["TP and FP use the same held-out evaluation scope", "TP + FP is non-zero"],
    ["Count every predicted-positive case.", "Separate true positives from false positives.", "Divide correct positive predictions by all positive predictions."],
    "1 = count / count",
    [
      {
        problem: "A detector reports 18 true positives and 2 false positives.",
        steps: ["Compute predicted positives 18 + 2 = 20.", "Divide 18 by 20.", "Express the result as a fraction or percentage."],
        result: "precision = 0.90 = 90 percent",
        independentCheck: "10 percent of 20 is 2 false positives, leaving 18 true positives."
      },
      {
        problem: "A classifier reports 45 true positives and 15 false positives.",
        steps: ["Compute 45 + 15 = 60 predicted positives.", "Divide 45 by 60.", "Convert 0.75 to a percentage."],
        result: "precision = 0.75 = 75 percent",
        independentCheck: "0.75 x 60 = 45 true positives."
      }
    ],
    "A detector has 32 true positives and 8 false positives. What is precision as a fraction?",
    0.8,
    "1",
    { "1": 1, percent: 0.01 },
    0.001
  ),
  uncertainty: formula(
    "u_c=\\sqrt{\\sum_{i=1}^{n}u_i^2}",
    "Combined independent standard uncertainty is the root sum square of its component standard uncertainties.",
    [
      { symbol: "u_c", meaning: "combined standard uncertainty", siUnit: "measurement unit" },
      { symbol: "u_i", meaning: "independent component standard uncertainty", siUnit: "same unit as u_c" },
      { symbol: "n", meaning: "component count", siUnit: "1" }
    ],
    ["Components use the same unit", "Components are independent for this model"],
    ["Square each independent component uncertainty.", "Add the squared contributions.", "Take the non-negative square root."],
    "unit(u_c) = sqrt(unit(u_i)^2)",
    [
      worked(
        "Two independent length uncertainties are 0.30 mm and 0.40 mm.",
        "Use the root sum square relationship.",
        "u_c = sqrt(0.30^2 + 0.40^2) mm.",
        "Evaluate sqrt(0.25) mm.",
        "u_c = 0.50 mm",
        "0.50^2 = 0.30^2 + 0.40^2 in square millimetres."
      ),
      worked(
        "Independent temperature uncertainties are 0.60 K and 0.80 K.",
        "Use the root sum square relationship.",
        "u_c = sqrt(0.60^2 + 0.80^2) K.",
        "Evaluate sqrt(1.00) K.",
        "u_c = 1.00 K",
        "The result exceeds each component but remains below their arithmetic sum of 1.40 K."
      )
    ],
    "Independent length uncertainties are 0.30 mm and 0.40 mm. Find combined standard uncertainty.",
    0.5,
    "mm",
    { mm: 1, m: 1000 },
    0.0001
  ),
  partialSensitivity: formula(
    "S_x=\\frac{\\partial y}{\\partial x}",
    "Partial sensitivity Sx is the local change in output y per change in input x while the other inputs are held fixed.",
    [
      { symbol: "S_x", meaning: "local sensitivity to x", siUnit: "output unit per input unit" },
      { symbol: "y", meaning: "model output", siUnit: "output unit" },
      { symbol: "x", meaning: "selected model input", siUnit: "input unit" }
    ],
    ["Other independent inputs are held fixed", "The model is differentiable at the operating point"],
    ["Hold the other inputs fixed.", "Form the output-change to input-change ratio.", "Take the local limit as the input interval decreases."],
    "unit(S_x) = unit(y) / unit(x)",
    [
      worked(
        "A pressure sensor output rises locally by 6 V for a 3 kPa pressure change.",
        "Approximate partial sensitivity with Delta y divided by Delta x.",
        "S_p = 6 V / 3 kPa.",
        "Divide the output change by the pressure change.",
        "S_p = 2 V/kPa",
        "2 V/kPa multiplied by 3 kPa returns the 6 V output change."
      ),
      worked(
        "A thermal model rises by 8 K when heating power changes by 4 W.",
        "Hold other inputs fixed and form Delta T divided by Delta P.",
        "S_P = 8 K / 4 W.",
        "Divide the temperature change by the power change.",
        "S_P = 2 K/W",
        "2 K/W multiplied by 4 W returns the 8 K change."
      )
    ],
    "Output changes by 2.0 V when pressure changes by 5.0 kPa. Find local sensitivity.",
    0.4,
    "V/kPa",
    { "V/kPa": 1 },
    0.0001
  ),
  firstOrderStep: formula(
    "y(t)=K u_0\\left(1-e^{-t/\\tau}\\right)",
    "A stable first-order system starting from zero reaches K times u0 times one minus the exponential of negative time over time constant tau.",
    [
      { symbol: "y", meaning: "system output", siUnit: "output unit" },
      { symbol: "K", meaning: "steady-state gain", siUnit: "output unit per input unit" },
      { symbol: "u_0", meaning: "constant step input", siUnit: "input unit" },
      { symbol: "t", meaning: "elapsed time", siUnit: "s" },
      { symbol: "\\tau", meaning: "time constant", siUnit: "s" }
    ],
    ["The model is linear and first order", "The initial output is zero", "K and tau are constant"],
    ["Write tau dy/dt + y = K u0 for a constant step.", "Solve the homogeneous and particular parts.", "Apply y(0) = 0 to obtain the exponential response."],
    "output unit = output unit x dimensionless exponential",
    [
      worked(
        "A first-order sensor has K u0 = 10 V and tau = 2 s. Find y at t = 2 s.",
        "Use the zero-initial-condition first-order step response.",
        "y = 10(1 - exp(-2/2)) V.",
        "Use exp(-1) = 0.3679.",
        "y = 6.321 V",
        "At one time constant the output is 63.21 percent of its final value."
      ),
      worked(
        "A thermal output has final value 20 K and tau = 5 s. Find y at t = 10 s.",
        "Use the first-order step response at two time constants.",
        "y = 20(1 - exp(-10/5)) K.",
        "Use exp(-2) = 0.1353.",
        "y = 17.29 K",
        "The remaining error, 2.71 K, is 13.53 percent of the final change."
      )
    ],
    "A first-order output has final value 10 V. Find the output after one time constant.",
    6.321,
    "V",
    { V: 1, mV: 0.001 },
    0.002
  ),
  mean: formula(
    "\\bar{x}=\\frac{1}{n}\\sum_{i=1}^{n}x_i",
    "The arithmetic mean is the sum of n observations divided by n.",
    [
      { symbol: "\\bar{x}", meaning: "arithmetic mean", siUnit: "same unit as x_i" },
      { symbol: "x_i", meaning: "observation i", siUnit: "measurement unit" },
      { symbol: "n", meaning: "observation count", siUnit: "1" }
    ],
    ["All observations represent the stated population or sample", "n is positive"],
    ["Add the observations in a common unit.", "Count the included observations.", "Divide the total by the count."],
    "unit(x_bar) = unit(x_i)",
    [
      worked(
        "Three readings are 2 V, 4 V and 6 V.",
        "Use the arithmetic mean.",
        "x_bar = (2 + 4 + 6) V / 3.",
        "Divide 12 V by 3.",
        "x_bar = 4 V",
        "Deviations from the mean, -2 V, 0 V and 2 V, sum to zero."
      ),
      worked(
        "Four cycle times are 8 s, 9 s, 10 s and 13 s.",
        "Use the arithmetic mean.",
        "x_bar = (8 + 9 + 10 + 13) s / 4.",
        "Divide 40 s by 4.",
        "x_bar = 10 s",
        "The four deviations -2, -1, 0 and 3 s sum to zero."
      )
    ],
    "Readings are 2, 4 and 6. Find their arithmetic mean.",
    4,
    "1",
    { "1": 1 },
    0.0001
  ),
  oscillation: formula(
    "f_n=\\frac{1}{2\\pi}\\sqrt{\\frac{k}{m}}",
    "The undamped natural frequency of a single mass and spring is one over two pi times the square root of stiffness divided by mass.",
    [
      { symbol: "f_n", meaning: "undamped natural frequency", siUnit: "Hz" },
      { symbol: "k", meaning: "spring stiffness", siUnit: "N/m" },
      { symbol: "m", meaning: "moving mass", siUnit: "kg" }
    ],
    ["The system is represented by one translational degree of freedom", "Stiffness and mass are constant"],
    ["Write the free-motion equation m x double-dot plus k x equals zero.", "Compare it with x double-dot plus omega_n squared x equals zero.", "Use omega_n = sqrt(k/m) and f_n = omega_n/(2 pi)."],
    "Hz = sqrt((N/m)/kg) / (2 pi) = 1/s",
    [
      worked(
        "A 1 kg mass is attached to a 100 N/m spring.",
        "Use the single-degree-of-freedom natural-frequency relation.",
        "f_n = sqrt(100/1)/(2 pi) Hz.",
        "Divide 10 rad/s by 2 pi.",
        "f_n = 1.592 Hz",
        "The corresponding period is 1/1.592 = 0.628 s."
      ),
      worked(
        "A 4 kg mass is attached to a 400 N/m spring.",
        "Use the same mass-spring relation.",
        "f_n = sqrt(400/4)/(2 pi) Hz.",
        "Again sqrt(100) = 10 rad/s.",
        "f_n = 1.592 Hz",
        "Quadrupling both mass and stiffness leaves their ratio and frequency unchanged."
      )
    ],
    "Find natural frequency for k = 100 N/m and m = 1 kg.",
    1.59155,
    "Hz",
    { Hz: 1, kHz: 1000 },
    0.0001
  ),
  coulomb: formula(
    "F=k_e\\frac{|q_1q_2|}{r^2}",
    "Electrostatic force magnitude equals Coulomb constant times the charge product magnitude divided by separation squared.",
    [
      { symbol: "F", meaning: "electrostatic force magnitude", siUnit: "N" },
      { symbol: "k_e", meaning: "Coulomb constant", siUnit: "N m^2/C^2" },
      { symbol: "q_1", meaning: "first charge", siUnit: "C" },
      { symbol: "q_2", meaning: "second charge", siUnit: "C" },
      { symbol: "r", meaning: "charge separation", siUnit: "m" }
    ],
    ["Charges are treated as points", "The surrounding medium is adequately represented by the stated k_e"],
    ["Electric-field magnitude from q1 is k_e |q1|/r squared.", "Force on q2 is |q2| times field magnitude.", "Combine the expressions."],
    "N = (N m^2/C^2)(C^2)/m^2",
    [
      worked(
        "Two 1 microcoulomb charges are separated by 0.10 m in vacuum.",
        "Use Coulomb's inverse-square relation.",
        "F = (8.9875e9 x 1e-6 x 1e-6 / 0.10^2) N.",
        "Evaluate the charge product and separation square.",
        "F = 0.8988 N",
        "Doubling separation would reduce the force to one quarter."
      ),
      worked(
        "Charges of 2 microcoulombs and 1 microcoulomb are separated by 0.20 m.",
        "Use the same inverse-square relation.",
        "F = (8.9875e9 x 2e-6 x 1e-6 / 0.20^2) N.",
        "Evaluate the numerator and denominator.",
        "F = 0.4494 N",
        "Relative to the first case, charge product doubles and separation square quadruples, so force halves."
      )
    ],
    "Two 1 microcoulomb charges are separated by 0.10 m in vacuum. Find force magnitude.",
    0.898755,
    "N",
    { N: 1, mN: 0.001 },
    0.0001
  ),
  heatConduction: formula(
    "\\dot{Q}=kA\\frac{\\Delta T}{L}",
    "Steady one-dimensional conduction rate equals thermal conductivity times area times temperature difference divided by thickness.",
    [
      { symbol: "\\dot{Q}", meaning: "heat-transfer rate", siUnit: "W" },
      { symbol: "k", meaning: "thermal conductivity", siUnit: "W/(m K)" },
      { symbol: "A", meaning: "conduction area", siUnit: "m^2" },
      { symbol: "\\Delta T", meaning: "temperature difference", siUnit: "K" },
      { symbol: "L", meaning: "conduction length", siUnit: "m" }
    ],
    ["Conduction is steady and one dimensional", "k is constant", "Contact resistance is excluded"],
    ["Start from Fourier heat flux q double-dot = -k dT/dx.", "Use a linear temperature gradient Delta T/L.", "Multiply flux magnitude by area."],
    "W = (W/(m K)) m^2 K / m",
    [
      worked(
        "A plate has k = 200 W/(m K), A = 0.001 m^2, Delta T = 10 K and L = 0.01 m.",
        "Use steady one-dimensional conduction.",
        "Q_dot = (200 x 0.001 x 10 / 0.01) W.",
        "Multiply the numerator and divide by thickness.",
        "Q_dot = 200 W",
        "Thermal resistance L/(kA) is 0.05 K/W, and 10 K / 0.05 K/W = 200 W."
      ),
      worked(
        "An insulator has k = 0.04 W/(m K), A = 2 m^2, Delta T = 20 K and L = 0.10 m.",
        "Use the same conduction relation.",
        "Q_dot = (0.04 x 2 x 20 / 0.10) W.",
        "Evaluate the product and quotient.",
        "Q_dot = 16 W",
        "Thermal resistance is 1.25 K/W, so 20 K / 1.25 K/W = 16 W."
      )
    ],
    "For k = 200 W/(m K), A = 0.001 m^2, Delta T = 10 K and L = 0.01 m, find heat rate.",
    200,
    "W",
    { W: 1, kW: 1000 },
    0.001
  ),
  spring: formula(
    "F=kx",
    "An ideal linear spring force magnitude equals stiffness times displacement from its unloaded position.",
    [
      { symbol: "F", meaning: "spring force magnitude", siUnit: "N" },
      { symbol: "k", meaning: "spring stiffness", siUnit: "N/m" },
      { symbol: "x", meaning: "spring displacement", siUnit: "m" }
    ],
    ["The spring is inside its linear elastic range", "Displacement is measured from the unloaded position"],
    ["Define stiffness as force change per displacement change.", "Assume constant stiffness and zero force at zero displacement.", "Integrate to obtain F = kx."],
    "N = (N/m) m",
    [
      worked(
        "A 500 N/m spring is compressed by 0.020 m.",
        "Use the linear spring relationship.",
        "F = (500 x 0.020) N.",
        "Multiply stiffness by displacement.",
        "F = 10 N",
        "10 N divided by 500 N/m returns 0.020 m."
      ),
      worked(
        "A spring carries 30 N at 0.050 m extension.",
        "Rearrange the spring relationship for stiffness.",
        "k = 30 N / 0.050 m.",
        "Divide force by displacement.",
        "k = 600 N/m",
        "600 N/m multiplied by 0.050 m returns 30 N."
      )
    ],
    "A 500 N/m spring is compressed by 0.020 m. Find force magnitude.",
    10,
    "N",
    { N: 1, kN: 1000 },
    0.001
  ),
  machiningSpeed: formula(
    "v_c=\\frac{\\pi D n}{60}",
    "Cutting speed in metres per second equals pi times tool or work diameter in metres times rotational speed in revolutions per minute divided by sixty.",
    [
      { symbol: "v_c", meaning: "surface cutting speed", siUnit: "m/s" },
      { symbol: "D", meaning: "rotating diameter", siUnit: "m" },
      { symbol: "n", meaning: "rotational speed", siUnit: "rev/min" }
    ],
    ["Diameter is constant for the evaluated cut", "Rotational speed is steady"],
    ["One revolution travels circumference pi D.", "n revolutions per minute travel pi D n metres per minute.", "Divide by 60 seconds per minute."],
    "m/s = m rev/min x min/(60 s), with revolution dimensionless",
    [
      worked(
        "A 20 mm diameter part turns at 1200 rev/min.",
        "Convert diameter to metres and use the circumference rate.",
        "v_c = (pi x 0.020 x 1200 / 60) m/s.",
        "Evaluate the product and quotient.",
        "v_c = 1.257 m/s",
        "This equals 75.40 m/min, and 75.40/60 = 1.257 m/s."
      ),
      worked(
        "A 50 mm cutter turns at 600 rev/min.",
        "Use the same surface-speed relation.",
        "v_c = (pi x 0.050 x 600 / 60) m/s.",
        "Evaluate the product and quotient.",
        "v_c = 1.571 m/s",
        "The cutter travels pi x 0.05 = 0.1571 m per revolution and 10 revolutions per second."
      )
    ],
    "Find cutting speed for D = 20 mm and n = 1200 rev/min.",
    1.25664,
    "m/s",
    { "m/s": 1, "m/min": 0.0166666667 },
    0.0001
  ),
  rcCutoff: formula(
    "f_c=\\frac{1}{2\\pi RC}",
    "The cutoff frequency of an ideal first-order RC filter is one divided by two pi times resistance times capacitance.",
    [
      { symbol: "f_c", meaning: "cutoff frequency", siUnit: "Hz" },
      { symbol: "R", meaning: "resistance", siUnit: "ohm" },
      { symbol: "C", meaning: "capacitance", siUnit: "F" }
    ],
    ["The network is an ideal first-order RC filter", "Loading is negligible"],
    ["The RC time constant is tau = RC.", "At cutoff, angular frequency omega_c tau = 1.", "Use omega_c = 2 pi f_c and rearrange."],
    "Hz = 1/(ohm F) = 1/s",
    [
      worked(
        "R = 1.0 kohm and C = 1.0 microfarad.",
        "Use the first-order RC cutoff relation.",
        "f_c = 1/(2 pi x 1000 x 1e-6) Hz.",
        "Evaluate the denominator and reciprocal.",
        "f_c = 159.15 Hz",
        "The time constant is 1 ms and 1/(2 pi x 0.001 s) = 159.15 Hz."
      ),
      worked(
        "R = 10 kohm and C = 100 nF.",
        "Use the same cutoff relation.",
        "f_c = 1/(2 pi x 10000 x 100e-9) Hz.",
        "Recognise the same 1 ms time constant.",
        "f_c = 159.15 Hz",
        "Both component pairs have RC = 0.001 s, so their ideal cutoff is equal."
      )
    ],
    "Find cutoff frequency for R = 1.0 kohm and C = 1.0 microfarad.",
    159.155,
    "Hz",
    { Hz: 1, kHz: 1000 },
    0.001
  ),
  adcResolution: formula(
    "\\Delta V=\\frac{V_{ref}}{2^N}",
    "The ideal code width of an N-bit ADC equals reference range divided by two to the power N.",
    [
      { symbol: "\\Delta V", meaning: "ideal ADC code width", siUnit: "V" },
      { symbol: "V_{ref}", meaning: "ADC reference range", siUnit: "V" },
      { symbol: "N", meaning: "ADC resolution in bits", siUnit: "1" }
    ],
    ["The ideal ADC spans zero to Vref", "Missing codes, noise and reference error are excluded"],
    ["An N-bit code has 2 to the N distinct levels.", "Divide the represented voltage range by the level count.", "State real converter errors separately."],
    "V = V / dimensionless count",
    [
      worked(
        "A 12-bit ADC uses a 3.3 V reference.",
        "Use range divided by code count.",
        "Delta V = (3.3 V)/(4096 levels).",
        "Evaluate and convert to millivolts.",
        "Delta V = 0.0008057 V = 0.8057 mV",
        "0.8057 mV multiplied by 4096 is approximately 3.3 V."
      ),
      worked(
        "An 8-bit ADC uses a 5.0 V reference.",
        "Use range divided by 256 levels.",
        "Delta V = (5.0 V)/(256 levels).",
        "Evaluate the quotient.",
        "Delta V = 0.01953 V",
        "0.01953 V multiplied by 256 is approximately 5.0 V."
      )
    ],
    "Find ideal code width for a 12-bit ADC with a 3.3 V reference.",
    0.000805664,
    "V",
    { V: 1, mV: 0.001 },
    0.0000001
  ),
  pwmDuty: formula(
    "D=\\frac{t_{on}}{T}",
    "PWM duty fraction equals on-time divided by the full switching period.",
    [
      { symbol: "D", meaning: "PWM duty fraction", siUnit: "1" },
      { symbol: "t_{on}", meaning: "on-time in each cycle", siUnit: "s" },
      { symbol: "T", meaning: "full PWM period", siUnit: "s" }
    ],
    ["On-time is between zero and the full period", "The period is non-zero"],
    ["Measure the high interval in one period.", "Divide high interval by total period.", "Check the result lies from zero to one."],
    "1 = s/s",
    [
      worked(
        "A PWM output is high for 2 ms in a 10 ms period.",
        "Use on-time divided by full period.",
        "D = 2 ms / 10 ms.",
        "Cancel milliseconds and divide.",
        "D = 0.20 = 20 percent",
        "A 20 percent duty uses 2 ms of each 10 ms cycle."
      ),
      worked(
        "A 1 kHz PWM output is high for 0.75 ms.",
        "First find period T = 1/f = 1 ms.",
        "D = 0.75 ms / 1.00 ms.",
        "Cancel milliseconds and divide.",
        "D = 0.75 = 75 percent",
        "The low interval is the remaining 0.25 ms."
      )
    ],
    "PWM is high for 2 ms in a 10 ms period. Find duty fraction.",
    0.2,
    "1",
    { "1": 1, percent: 0.01 },
    0.0001
  ),
  fourier: formula(
    "X_k=\\sum_{n=0}^{N-1}x_n e^{-j2\\pi kn/N}",
    "A discrete Fourier coefficient is the sum of time samples weighted by a complex sinusoid at frequency bin k.",
    [
      { symbol: "X_k", meaning: "discrete Fourier coefficient at bin k", siUnit: "same unit as x_n" },
      { symbol: "x_n", meaning: "sample n", siUnit: "signal unit" },
      { symbol: "k", meaning: "frequency-bin index", siUnit: "1" },
      { symbol: "N", meaning: "sample count", siUnit: "1" }
    ],
    ["Samples are uniformly spaced", "The finite record is the stated analysis window"],
    ["Choose a frequency-bin basis waveform.", "Multiply each sample by the conjugate basis value.", "Add every weighted sample across the record."],
    "unit(X_k) = unit(x_n)",
    [
      worked(
        "Samples are 1 V, 2 V, 1 V and 0 V. Find the unnormalised DC coefficient X0.",
        "At k = 0 every complex weight equals one.",
        "X0 = 1 + 2 + 1 + 0 V.",
        "Add all four samples.",
        "X0 = 4 V",
        "The sample mean is X0/N = 4/4 = 1 V."
      ),
      worked(
        "Four samples are 2 V, 2 V, 2 V and 2 V. Find X0.",
        "Use unit weights at the DC bin.",
        "X0 = 2 + 2 + 2 + 2 V.",
        "Add the constant samples.",
        "X0 = 8 V",
        "Dividing by four samples returns the 2 V constant level."
      )
    ],
    "Samples are 1 V, 2 V, 1 V and 0 V. Find the unnormalised DC coefficient X0.",
    4,
    "V",
    { V: 1, mV: 0.001 },
    0.0001
  ),
  stateSpace: formula(
    "\\dot{\\mathbf{x}}=A\\mathbf{x}+B\\mathbf{u}",
    "State rate equals the state matrix times the current state plus the input matrix times the input.",
    [
      { symbol: "\\dot{\\mathbf{x}}", meaning: "state derivative", siUnit: "state unit/s" },
      { symbol: "A", meaning: "state dynamics matrix", siUnit: "1/s" },
      { symbol: "\\mathbf{x}", meaning: "state vector", siUnit: "state unit" },
      { symbol: "B", meaning: "input influence matrix", siUnit: "state unit/(input unit s)" },
      { symbol: "\\mathbf{u}", meaning: "input vector", siUnit: "input unit" }
    ],
    ["State and input definitions are fixed", "The linear model applies near the stated operating region"],
    ["Select variables whose present values determine future evolution.", "Collect state coefficients into A and input coefficients into B.", "Write the coupled first-order equations in matrix form."],
    "state unit/s = (1/s)(state unit) + (state unit/(input unit s))(input unit)",
    [
      worked(
        "A scalar model has x_dot = -2x + 3u with x = 1 and u = 2.",
        "Use the scalar form of the state equation.",
        "x_dot = -2(1) + 3(2).",
        "Add -2 and 6.",
        "x_dot = 4 per second",
        "A forward step of 0.01 s predicts x increasing by about 0.04."
      ),
      worked(
        "A scalar model has x_dot = -x + 2u with x = 4 and u = 1.",
        "Substitute the current state and input.",
        "x_dot = -4 + 2(1).",
        "Add the contributions.",
        "x_dot = -2 per second",
        "The negative derivative predicts a decreasing state at this instant."
      )
    ],
    "For x_dot = -2x + 3u, x = 1 and u = 2, find x_dot.",
    4,
    "1/s",
    { "1/s": 1 },
    0.0001
  ),
  rigidTransform: formula(
    "x'=x\\cos\\theta-y\\sin\\theta",
    "The transformed x coordinate after a planar rotation is x cosine theta minus y sine theta.",
    [
      { symbol: "x'", meaning: "rotated x coordinate", siUnit: "m" },
      { symbol: "x", meaning: "original x coordinate", siUnit: "m" },
      { symbol: "y", meaning: "original y coordinate", siUnit: "m" },
      { symbol: "\\theta", meaning: "counter-clockwise rotation angle", siUnit: "rad" }
    ],
    ["Frames share an origin for this rotation", "The angle convention is counter-clockwise"],
    ["Project the original x component onto the rotated x axis.", "Project the original y component with the signed sine term.", "Add the two projections."],
    "m = m x dimensionless - m x dimensionless",
    [
      worked(
        "Rotate point x = 2 m, y = 0 m by 60 degrees.",
        "Use x prime = x cos theta - y sin theta.",
        "x prime = 2 cos 60 degrees - 0 sin 60 degrees.",
        "Use cos 60 degrees = 0.5.",
        "x prime = 1 m",
        "The full rotated point is (1, sqrt(3)) m and keeps its original 2 m magnitude."
      ),
      worked(
        "Rotate point x = 0 m, y = 3 m by 90 degrees.",
        "Use the planar rotation expression.",
        "x prime = 0 cos 90 degrees - 3 sin 90 degrees.",
        "Use sin 90 degrees = 1.",
        "x prime = -3 m",
        "The full point becomes (-3, 0) m and preserves the 3 m magnitude."
      )
    ],
    "Rotate x = 2 m, y = 0 m by 60 degrees. Find x prime.",
    1,
    "m",
    { m: 1, cm: 0.01, mm: 0.001 },
    0.0001
  ),
  jacobian: formula(
    "\\mathbf{v}=J(\\mathbf{q})\\dot{\\mathbf{q}}",
    "Task-space velocity equals the configuration-dependent Jacobian times joint-rate vector.",
    [
      { symbol: "\\mathbf{v}", meaning: "task-space velocity", siUnit: "m/s" },
      { symbol: "J", meaning: "kinematic Jacobian", siUnit: "m/rad" },
      { symbol: "\\dot{\\mathbf{q}}", meaning: "joint-rate vector", siUnit: "rad/s" }
    ],
    ["The Jacobian is evaluated at the current configuration", "Joint and task coordinates use consistent conventions"],
    ["Differentiate forward kinematics with respect to joint coordinates.", "Collect the partial derivatives into J.", "Multiply by joint rates to obtain instantaneous task velocity."],
    "m/s = (m/rad)(rad/s)",
    [
      worked(
        "A scalar Jacobian is 0.5 m/rad and joint rate is 2 rad/s.",
        "Use task velocity equals Jacobian times joint rate.",
        "v = (0.5 x 2) m/s.",
        "Cancel radians and multiply.",
        "v = 1.0 m/s",
        "1.0 m/s divided by 2 rad/s returns the 0.5 m/rad local motion ratio."
      ),
      worked(
        "A scalar Jacobian is -0.2 m/rad and joint rate is 3 rad/s.",
        "Preserve the coordinate sign convention.",
        "v = (-0.2 x 3) m/s.",
        "Multiply the signed quantities.",
        "v = -0.6 m/s",
        "The negative sign indicates motion opposite the positive task coordinate."
      )
    ],
    "For J = 0.5 m/rad and joint rate 2 rad/s, find task velocity.",
    1,
    "m/s",
    { "m/s": 1, "mm/s": 0.001 },
    0.0001
  ),
  inertia: formula(
    "I=mr^2",
    "The rotational inertia contribution of a point mass equals mass times squared distance from the rotation axis.",
    [
      { symbol: "I", meaning: "rotational inertia about the axis", siUnit: "kg m^2" },
      { symbol: "m", meaning: "point mass", siUnit: "kg" },
      { symbol: "r", meaning: "perpendicular distance to the axis", siUnit: "m" }
    ],
    ["Mass is represented as a point for this contribution", "r is perpendicular distance to the chosen axis"],
    ["Rotational kinetic energy is one half I omega squared.", "A point mass moving at speed r omega has energy one half m r squared omega squared.", "Equate coefficients of one half omega squared."],
    "kg m^2 = kg x m^2",
    [
      worked(
        "A 2 kg point mass is 0.30 m from an axis.",
        "Use point-mass rotational inertia.",
        "I = (2 x 0.30^2) kg m^2.",
        "Square the radius and multiply by mass.",
        "I = 0.18 kg m^2",
        "Moving the mass to 0.60 m would quadruple inertia to 0.72 kg m^2."
      ),
      worked(
        "A 0.5 kg point mass is 0.20 m from an axis.",
        "Use the same inertia contribution.",
        "I = (0.5 x 0.20^2) kg m^2.",
        "Evaluate 0.5 x 0.04.",
        "I = 0.020 kg m^2",
        "I/m = 0.04 m^2, whose square root returns r = 0.20 m."
      )
    ],
    "A 2 kg point mass is 0.30 m from an axis. Find rotational inertia.",
    0.18,
    "kg m^2",
    { "kg m^2": 1 },
    0.0001
  ),
  bayes: formula(
    "P(H\\mid E)=\\frac{P(E\\mid H)P(H)}{P(E\\mid H)P(H)+P(E\\mid \\neg H)P(\\neg H)}",
    "Posterior probability equals likelihood times prior divided by total probability of the observed evidence.",
    [
      { symbol: "P(H\\mid E)", meaning: "posterior probability of hypothesis H after evidence E", siUnit: "1" },
      { symbol: "P(E\\mid H)", meaning: "likelihood of evidence when H is true", siUnit: "1" },
      { symbol: "P(H)", meaning: "prior probability of H", siUnit: "1" },
      { symbol: "P(E\\mid \\neg H)", meaning: "likelihood of evidence when H is false", siUnit: "1" }
    ],
    ["Hypothesis H and not-H cover the stated sample space", "All probabilities use the same population and evidence definition"],
    ["Write joint probability P(E and H) as likelihood times prior.", "Partition total evidence probability over H and not-H.", "Divide the joint probability by total evidence probability."],
    "1 = (1 x 1)/(1 x 1 + 1 x 1)",
    [
      worked(
        "Prior fault probability is 0.20, detection sensitivity is 0.90 and false-positive probability is 0.10.",
        "Use Bayes rule with H as the fault.",
        "Posterior = 0.90 x 0.20 / (0.90 x 0.20 + 0.10 x 0.80).",
        "Divide 0.18 by 0.26.",
        "P(fault|alarm) = 0.6923",
        "In 1000 cases, expect 180 true alarms and 80 false alarms, so 180/260 = 0.6923."
      ),
      worked(
        "Prior fault probability is 0.01, sensitivity is 0.95 and false-positive probability is 0.05.",
        "Use the same posterior expression.",
        "Posterior = 0.95 x 0.01 / (0.95 x 0.01 + 0.05 x 0.99).",
        "Divide 0.0095 by 0.0590.",
        "P(fault|alarm) = 0.1610",
        "Low prior prevalence means false alarms outnumber true alarms despite high sensitivity."
      )
    ],
    "Prior fault probability is 0.20, sensitivity is 0.90 and false-positive probability is 0.10. Find posterior fault probability after an alarm.",
    0.6923077,
    "1",
    { "1": 1, percent: 0.01 },
    0.0001
  ),
  pathCost: formula(
    "f(n)=g(n)+h(n)",
    "A best-first planning score equals accumulated path cost g plus estimated remaining cost h.",
    [
      { symbol: "f(n)", meaning: "total evaluation score for node n", siUnit: "cost unit" },
      { symbol: "g(n)", meaning: "accumulated cost from start to n", siUnit: "cost unit" },
      { symbol: "h(n)", meaning: "estimated cost from n to goal", siUnit: "cost unit" }
    ],
    ["g and h use compatible cost units", "Heuristic assumptions are stated"],
    ["Accumulate cost along the path from the start.", "Estimate remaining cost to the goal.", "Add both terms to compare frontier nodes."],
    "cost unit = cost unit + cost unit",
    [
      worked(
        "A node has travelled cost 12 m and estimated remaining cost 5 m.",
        "Use f = g + h.",
        "f = 12 m + 5 m.",
        "Add compatible path costs.",
        "f = 17 m",
        "Subtracting h = 5 m from f = 17 m returns g = 12 m."
      ),
      worked(
        "A grid node has accumulated cost 8 and heuristic cost 6.",
        "Use the same evaluation score.",
        "f = 8 + 6.",
        "Add the dimensionless grid costs.",
        "f = 14",
        "The node score lies above each non-negative component."
      )
    ],
    "A planner node has g = 12 m and h = 5 m. Find f.",
    17,
    "m",
    { m: 1, cm: 0.01 },
    0.0001
  ),
  neuron: formula(
    "z=\\sum_i w_i x_i+b",
    "A neuron's affine input is the weighted sum of features plus a bias before applying its activation.",
    [
      { symbol: "z", meaning: "pre-activation value", siUnit: "1" },
      { symbol: "w_i", meaning: "weight for feature i", siUnit: "1" },
      { symbol: "x_i", meaning: "input feature i", siUnit: "1" },
      { symbol: "b", meaning: "bias", siUnit: "1" }
    ],
    ["Inputs have been represented on the model's declared scale", "Weights and bias belong to the evaluated model version"],
    ["Multiply each input by its corresponding weight.", "Add the weighted contributions.", "Add the bias before applying the activation function."],
    "1 = sum(1 x 1) + 1",
    [
      worked(
        "Inputs are 2 and 1, weights are 0.5 and 0.2, and bias is 0.7.",
        "Use the weighted affine sum.",
        "z = 0.5 x 2 + 0.2 x 1 + 0.7.",
        "Add 1.0, 0.2 and 0.7.",
        "z = 1.9",
        "Removing the bias leaves the weighted-input contribution 1.2."
      ),
      worked(
        "Inputs are 1 and -2, weights are 3 and 0.5, and bias is -1.",
        "Use the same affine transformation.",
        "z = 3 x 1 + 0.5 x (-2) - 1.",
        "Add 3, -1 and -1.",
        "z = 1",
        "Direct term-by-term evaluation gives the same signed total."
      )
    ],
    "Inputs are 2 and 1, weights are 0.5 and 0.2, and bias is 0.7. Find z.",
    1.9,
    "1",
    { "1": 1 },
    0.0001
  ),
  gradientDescent: formula(
    "\\theta_{next}=\\theta-\\alpha\\frac{\\partial J}{\\partial\\theta}",
    "A gradient-descent update subtracts learning rate alpha times the local loss gradient from the current parameter.",
    [
      { symbol: "\\theta_{next}", meaning: "updated parameter", siUnit: "parameter unit" },
      { symbol: "\\theta", meaning: "current parameter", siUnit: "parameter unit" },
      { symbol: "\\alpha", meaning: "learning rate", siUnit: "parameter unit squared per loss unit" },
      { symbol: "\\partial J/\\partial\\theta", meaning: "loss gradient", siUnit: "loss unit per parameter unit" }
    ],
    ["The gradient is evaluated at the current parameter", "The learning rate is positive"],
    ["Approximate local loss change with its gradient.", "Choose the negative gradient direction for local descent.", "Scale the step by learning rate alpha."],
    "parameter unit = parameter unit - (parameter unit^2/loss unit)(loss unit/parameter unit)",
    [
      worked(
        "Current parameter is 4, learning rate is 0.1 and gradient is 6.",
        "Use the gradient-descent update.",
        "theta_next = 4 - 0.1 x 6.",
        "Subtract the 0.6 step.",
        "theta_next = 3.4",
        "A positive gradient produces a negative parameter step."
      ),
      worked(
        "Current parameter is -1, learning rate is 0.05 and gradient is -4.",
        "Preserve both signs in the update.",
        "theta_next = -1 - 0.05 x (-4).",
        "Add the resulting 0.2 step.",
        "theta_next = -0.8",
        "A negative gradient moves the parameter in the positive direction."
      )
    ],
    "Current parameter is 4, learning rate is 0.1 and gradient is 6. Find the next parameter.",
    3.4,
    "1",
    { "1": 1 },
    0.0001
  ),
  compression: formula(
    "C=\\frac{S_{original}}{S_{compressed}}",
    "Compression ratio equals original representation size divided by compressed representation size.",
    [
      { symbol: "C", meaning: "compression ratio", siUnit: "1" },
      { symbol: "S_{original}", meaning: "original storage size", siUnit: "byte" },
      { symbol: "S_{compressed}", meaning: "compressed storage size", siUnit: "byte" }
    ],
    ["Both sizes use the same byte convention", "Compressed size is non-zero"],
    ["Measure the original representation size.", "Measure compressed representation size under the stated method.", "Divide original by compressed size."],
    "1 = byte/byte",
    [
      worked(
        "A model shrinks from 20 MB to 5 MB.",
        "Use original size divided by compressed size.",
        "C = 20 MB / 5 MB.",
        "Cancel megabytes and divide.",
        "C = 4",
        "The compressed model occupies one quarter of the original size."
      ),
      worked(
        "A data file shrinks from 120 MB to 80 MB.",
        "Use the same ratio.",
        "C = 120 MB / 80 MB.",
        "Cancel megabytes and divide.",
        "C = 1.5",
        "80 MB multiplied by 1.5 returns 120 MB."
      )
    ],
    "A model shrinks from 20 MB to 5 MB. Find compression ratio.",
    4,
    "1",
    { "1": 1 },
    0.0001
  ),
  tradeScore: formula(
    "S=\\sum_{i=1}^{n}w_i s_i",
    "A weighted trade score is the sum of each criterion score multiplied by its declared weight.",
    [
      { symbol: "S", meaning: "weighted alternative score", siUnit: "1" },
      { symbol: "w_i", meaning: "criterion weight", siUnit: "1" },
      { symbol: "s_i", meaning: "normalised criterion score", siUnit: "1" }
    ],
    ["Weights and scores use declared scales", "Weights sum to one for direct interpretation", "Disqualifying constraints are checked separately"],
    ["Define criteria before scoring alternatives.", "Multiply each score by its weight.", "Add contributions and retain sensitivity to assumptions."],
    "1 = sum(1 x 1)",
    [
      worked(
        "An option scores 8 and 6 under weights 0.6 and 0.4.",
        "Use the weighted score.",
        "S = 0.6 x 8 + 0.4 x 6.",
        "Add 4.8 and 2.4.",
        "S = 7.2",
        "Because weights sum to one, the result lies between scores 6 and 8."
      ),
      worked(
        "An option scores 4, 7 and 9 under weights 0.2, 0.3 and 0.5.",
        "Apply each declared weight.",
        "S = 0.2 x 4 + 0.3 x 7 + 0.5 x 9.",
        "Add 0.8, 2.1 and 4.5.",
        "S = 7.4",
        "Contributions sum to the same 7.4 total."
      )
    ],
    "An option scores 8 and 6 under weights 0.6 and 0.4. Find weighted score.",
    7.2,
    "1",
    { "1": 1 },
    0.0001
  ),
  riskScore: formula(
    "R=L\\times C",
    "A simple qualitative risk score equals declared likelihood rank times consequence rank.",
    [
      { symbol: "R", meaning: "ordinal screening risk score", siUnit: "1" },
      { symbol: "L", meaning: "likelihood rank", siUnit: "1" },
      { symbol: "C", meaning: "consequence rank", siUnit: "1" }
    ],
    ["Ranks use the declared matrix", "The product is a screening priority, not a physical probability or loss"],
    ["Assign likelihood using the matrix definition.", "Assign consequence using the same matrix.", "Multiply ranks and retain the underlying categories."],
    "1 = 1 x 1",
    [
      worked(
        "A hazard has likelihood rank 3 and consequence rank 4.",
        "Use the declared screening matrix product.",
        "R = 3 x 4.",
        "Multiply the ranks.",
        "R = 12",
        "The score retains meaning only with likelihood 3 and consequence 4 recorded."
      ),
      worked(
        "A failure mode has likelihood rank 2 and consequence rank 5.",
        "Use the same ordinal product.",
        "R = 2 x 5.",
        "Multiply the ranks.",
        "R = 10",
        "A different rank pair can produce a nearby score, so categories must not be discarded."
      )
    ],
    "Likelihood rank is 3 and consequence rank is 4. Find screening risk score.",
    12,
    "1",
    { "1": 1 },
    0.0001
  ),
  complexMagnitude: formula(
    "|z|=\\sqrt{a^2+b^2},\\quad z=a+jb",
    "The magnitude of complex number z equals the square root of its squared real and imaginary components.",
    [
      { symbol: "|z|", meaning: "complex magnitude", siUnit: "same unit as a and b" },
      { symbol: "a", meaning: "real component", siUnit: "quantity unit" },
      { symbol: "b", meaning: "imaginary component", siUnit: "quantity unit" },
      { symbol: "j", meaning: "imaginary unit with j squared equal to negative one", siUnit: "1" }
    ],
    ["Real and imaginary components use the same unit", "Magnitude is reported as non-negative"],
    ["Represent z as the point (a, b) in the complex plane.", "Apply Pythagoras to the orthogonal components.", "Take the non-negative square root."],
    "unit(z) = sqrt(unit(a)^2 + unit(b)^2)",
    [
      worked(
        "A phasor is z = 3 + j4 V.",
        "Use complex magnitude from orthogonal components.",
        "|z| = sqrt(3^2 + 4^2) V.",
        "Take the square root of 25 V squared.",
        "|z| = 5 V",
        "The 3-4-5 right triangle gives the same magnitude."
      ),
      worked(
        "An impedance is z = -5 + j12 ohm.",
        "Use the same complex-plane distance.",
        "|z| = sqrt((-5)^2 + 12^2) ohm.",
        "Take the square root of 169 ohm squared.",
        "|z| = 13 ohm",
        "Squaring 13 ohm reconstructs 25 + 144 = 169 ohm squared."
      )
    ],
    "For z = 3 + j4 V, find magnitude.",
    5,
    "V",
    { V: 1, mV: 0.001 },
    0.0001
  ),
  toleranceStack: formula(
    "T_{worst}=\\sum_{i=1}^{n}|T_i|",
    "Worst-case bilateral stack magnitude is the sum of the absolute component tolerance magnitudes.",
    [
      { symbol: "T_{worst}", meaning: "worst-case assembly tolerance magnitude", siUnit: "mm" },
      { symbol: "T_i", meaning: "component tolerance contribution", siUnit: "mm" },
      { symbol: "n", meaning: "number of contributing dimensions", siUnit: "1" }
    ],
    ["Every included dimension contributes in the analysed stack direction", "Worst-case simultaneous limits are the stated decision model"],
    ["Choose a signed dimension chain between functional interfaces.", "Convert each bilateral tolerance to a positive magnitude.", "Add magnitudes for the bounding worst case."],
    "mm = sum(mm)",
    [
      worked(
        "Three dimensions contribute plus or minus 0.10 mm, 0.20 mm and 0.05 mm.",
        "Use the worst-case sum of tolerance magnitudes.",
        "T_worst = 0.10 + 0.20 + 0.05 mm.",
        "Add all three contributions.",
        "T_worst = 0.35 mm",
        "The assembly interval is nominal plus or minus 0.35 mm when all limits align."
      ),
      worked(
        "Two dimensions contribute plus or minus 0.25 mm and 0.15 mm.",
        "Use the same worst-case bound.",
        "T_worst = 0.25 + 0.15 mm.",
        "Add both contributions.",
        "T_worst = 0.40 mm",
        "Subtracting either contribution returns the other declared component magnitude."
      )
    ],
    "Tolerance contributions are 0.10 mm, 0.20 mm and 0.05 mm. Find worst-case magnitude.",
    0.35,
    "mm",
    { mm: 1, m: 1000 },
    0.0001
  ),
  probability: formula(
    "P(A)=\\frac{n_A}{n}",
    "For an empirical sample or equally likely finite outcomes, event probability is event count divided by total count.",
    [
      { symbol: "P(A)", meaning: "probability or observed fraction of event A", siUnit: "1" },
      { symbol: "n_A", meaning: "count of outcomes in event A", siUnit: "1" },
      { symbol: "n", meaning: "total outcome count", siUnit: "1" }
    ],
    ["The denominator uses the declared sample space", "Counts are non-negative and n is positive"],
    ["Define event A and the complete outcome scope.", "Count outcomes in A and total outcomes.", "Divide event count by total count and preserve the scope."],
    "1 = count/count",
    [
      worked(
        "Eight of 40 trials show the declared event.",
        "Use event count divided by total count.",
        "P(A) = 8/40.",
        "Divide and express the fraction.",
        "P(A) = 0.20",
        "0.20 multiplied by 40 trials returns 8 event observations."
      ),
      worked(
        "Three of 12 equally likely outcomes satisfy a condition.",
        "Use favourable outcomes divided by total outcomes.",
        "P(A) = 3/12.",
        "Reduce the fraction.",
        "P(A) = 0.25",
        "One quarter of 12 outcomes is 3."
      )
    ],
    "Eight of 40 trials show event A. Find the observed probability.",
    0.2,
    "1",
    { "1": 1, percent: 0.01 },
    0.0001
  ),
  featureMatchRatio: formula(
    "\\rho=\\frac{d_1}{d_2}",
    "A nearest-neighbour feature-match ratio compares the closest descriptor distance d1 with the second-closest distance d2.",
    [
      { symbol: "\\rho", meaning: "descriptor match ratio", siUnit: "1" },
      { symbol: "d_1", meaning: "nearest descriptor distance", siUnit: "descriptor distance unit" },
      { symbol: "d_2", meaning: "second-nearest descriptor distance", siUnit: "same unit as d1" }
    ],
    ["Both distances use the same descriptor and metric", "d2 is positive", "The acceptance threshold is validated for the application"],
    ["Find the two smallest candidate descriptor distances.", "Preserve their nearest and second-nearest ordering.", "Divide d1 by d2 and compare with the declared threshold."],
    "1 = distance unit/distance unit",
    [
      worked(
        "Nearest and second-nearest descriptor distances are 0.40 and 0.80.",
        "Use nearest divided by second-nearest distance.",
        "rho = 0.40/0.80.",
        "Divide the distances.",
        "rho = 0.50",
        "The nearest distance is half the second-nearest distance."
      ),
      worked(
        "Descriptor distances are 30 and 40 in the same metric.",
        "Use the ordered distance ratio.",
        "rho = 30/40.",
        "Reduce the quotient.",
        "rho = 0.75",
        "0.75 multiplied by 40 returns the nearest distance 30."
      )
    ],
    "Nearest and second-nearest descriptor distances are 0.40 and 0.80. Find match ratio.",
    0.5,
    "1",
    { "1": 1 },
    0.0001
  ),
  transferMagnitude: formula(
    "|G(j\\omega)|=\\frac{|Y(j\\omega)|}{|U(j\\omega)|}",
    "Frequency-response magnitude is steady sinusoidal output amplitude divided by input amplitude at the same angular frequency.",
    [
      { symbol: "|G(j\\omega)|", meaning: "frequency-response magnitude", siUnit: "output unit per input unit" },
      { symbol: "|Y(j\\omega)|", meaning: "steady output amplitude", siUnit: "output unit" },
      { symbol: "|U(j\\omega)|", meaning: "steady input amplitude", siUnit: "input unit" },
      { symbol: "\\omega", meaning: "test angular frequency", siUnit: "rad/s" }
    ],
    ["Input and output are compared at the same steady sinusoidal frequency", "Input amplitude is non-zero"],
    ["Apply a bounded sinusoidal input at angular frequency omega.", "Measure steady input and output amplitudes.", "Divide output amplitude by input amplitude and retain phase separately."],
    "unit(G) = output unit/input unit",
    [
      worked(
        "A 5 V sinusoidal input produces a 2 V steady output at one frequency.",
        "Use output amplitude divided by input amplitude.",
        "|G| = 2 V / 5 V.",
        "Cancel volts and divide.",
        "|G| = 0.40",
        "0.40 multiplied by the 5 V input predicts the 2 V output amplitude."
      ),
      worked(
        "A 0.20 m command produces a 0.10 m output amplitude.",
        "Use the same-frequency amplitude ratio.",
        "|G| = 0.10 m / 0.20 m.",
        "Cancel metres and divide.",
        "|G| = 0.50",
        "An output half the input amplitude gives magnitude one half."
      )
    ],
    "A 5 V sinusoidal input produces a 2 V output amplitude at the same frequency. Find response magnitude.",
    0.4,
    "1",
    { "1": 1 },
    0.0001
  ),
  pid: formula(
    "u=K_p e+K_i\\int e\\,dt+K_d\\frac{de}{dt}",
    "PID output is the sum of proportional error, integral error accumulation and derivative error-rate contributions.",
    [
      { symbol: "u", meaning: "controller output", siUnit: "actuator unit" },
      { symbol: "e", meaning: "reference minus measured output", siUnit: "measured unit" },
      { symbol: "K_p", meaning: "proportional gain", siUnit: "actuator unit per measured unit" },
      { symbol: "K_i", meaning: "integral gain", siUnit: "actuator unit per measured unit s" },
      { symbol: "K_d", meaning: "derivative gain", siUnit: "actuator unit s per measured unit" }
    ],
    ["Error sign is reference minus measurement", "Integral initial state is stated", "Derivative filtering and actuator limits are checked separately"],
    ["Define the tracking error e = r - y.", "Form present, accumulated and rate contributions from the error.", "Add the three contributions before applying actuator and anti-windup limits."],
    "actuator unit = actuator unit + actuator unit + actuator unit",
    [
      worked(
        "Kp = 2, Ki = 0.5, Kd = 0.1, e = 1, integral error = 2 and error rate = 3 in compatible units.",
        "Evaluate each PID contribution.",
        "u = 2 x 1 + 0.5 x 2 + 0.1 x 3.",
        "Add 2, 1 and 0.3.",
        "u = 3.3 actuator units",
        "The three independently calculated terms reconcile to the 3.3 total."
      ),
      worked(
        "Kp = 1.5, Ki = 0.2, Kd = 0, e = 2 and integral error = 5 in compatible units.",
        "Use the PID sum with zero derivative contribution.",
        "u = 1.5 x 2 + 0.2 x 5 + 0.",
        "Add 3 and 1.",
        "u = 4 actuator units",
        "Removing the 1 integral unit leaves the 3 proportional units."
      )
    ],
    "Kp = 2, Ki = 0.5, Kd = 0.1, e = 1, integral error = 2 and error rate = 3. Find PID output.",
    3.3,
    "1",
    { "1": 1 },
    0.0001
  ),
  reliability: formula(
    "R_{series}=\\prod_{i=1}^{n}R_i",
    "Series-system reliability is the product of independent component reliabilities when every component must function.",
    [
      { symbol: "R_{series}", meaning: "system survival probability", siUnit: "1" },
      { symbol: "R_i", meaning: "component i survival probability", siUnit: "1" },
      { symbol: "n", meaning: "component count", siUnit: "1" }
    ],
    ["Component outcomes are independent for this model", "Every component is required for system success"],
    ["System success is the intersection of all component successes.", "For independent events, intersection probability is the product.", "Multiply all bounded probabilities."],
    "1 = product of dimensionless probabilities",
    [
      {
        problem: "Two required components each have reliability 0.95.",
        steps: ["Use R = 0.95 x 0.95.", "Multiply the probabilities.", "Check the system value does not exceed either component value."],
        result: "R = 0.9025",
        independentCheck: "Failure probability is 1 - 0.9025 = 0.0975."
      },
      {
        problem: "Three required components have reliabilities 0.99, 0.98 and 0.97.",
        steps: ["Multiply 0.99 x 0.98.", "Multiply the result by 0.97.", "Retain four significant figures."],
        result: "R = 0.9411",
        independentCheck: "The result is below 0.97, the least reliable component, as a strict series chain should be."
      }
    ],
    "Two independent required components each have reliability 0.9. What is series reliability?",
    0.81,
    "1",
    { "1": 1, percent: 0.01 },
    0.001
  ),
  diodeShockley: formula(
    "I_D=I_S\\left(e^{V_D/(nV_T)}-1\\right)",
    "Diode current I D equals saturation current I S multiplied by the exponential of diode voltage over ideality factor times thermal voltage, minus one.",
    [
      { symbol: "I_D", meaning: "forward diode current", siUnit: "A" },
      { symbol: "I_S", meaning: "reverse saturation current", siUnit: "A" },
      { symbol: "V_D", meaning: "diode junction voltage", siUnit: "V" },
      { symbol: "n", meaning: "ideality factor", siUnit: "1" },
      { symbol: "V_T", meaning: "thermal voltage", siUnit: "V" }
    ],
    [
      "The junction temperature is fixed over the calculation",
      "Series resistance and high-level injection are negligible",
      "The device remains within its stated voltage, current, power and temperature limits"
    ],
    [
      "Relate the carrier diffusion current to the junction potential barrier.",
      "Normalise the junction voltage by ideality factor times thermal voltage.",
      "Scale the resulting exponential current by the measured or specified saturation current."
    ],
    "A = A multiplied by a dimensionless exponential term",
    [
      worked(
        "A silicon diode model uses 1 nA saturation current, ideality factor 2, thermal voltage 25 mV and junction voltage 0.50 V.",
        "Use the reviewed diode-current relationship at the stated temperature.",
        "I_D = (1 nA)(exp(0.50 V/(2 x 0.025 V)) - 1).",
        "Evaluate the dimensionless exponent before scaling by saturation current.",
        "I_D = 0.0220 mA",
        "Substitution into the same model gives 22.0 microamps, which is 0.0220 mA."
      ),
      worked(
        "The same diode model is evaluated at a junction voltage of 0.60 V.",
        "Keep saturation current, ideality factor and thermal voltage unchanged.",
        "I_D = (1 nA)(exp(0.60 V/(2 x 0.025 V)) - 1).",
        "Evaluate the exponential and convert amperes to milliamps.",
        "I_D = 0.1628 mA",
        "Increasing junction voltage by 0.10 V increases current by the exponential factor predicted by the model."
      )
    ],
    "A diode model uses 1 nA saturation current, ideality factor 2, thermal voltage 25 mV and junction voltage 0.50 V. Find diode current in mA.",
    0.0220255,
    "mA",
    { A: 1000, "uA": 0.001 },
    0.0001
  ),
  kalmanUpdate: formula(
    "\\begin{aligned}K&=\\frac{P^-}{P^-+R}\\\\\\hat{x}^{+}&=\\hat{x}^{-}+K\\left(z-\\hat{x}^{-}\\right)\\\\P^{+}&=(1-K)P^-\\end{aligned}",
    "For a scalar direct measurement, Kalman gain K equals predicted covariance over predicted covariance plus measurement covariance; the posterior estimate equals the prediction plus gain times innovation; posterior covariance equals one minus gain times predicted covariance.",
    [
      { symbol: "\\hat{x}^{-}", meaning: "predicted state estimate", siUnit: "state unit" },
      { symbol: "P^-", meaning: "predicted state-error variance", siUnit: "state unit squared" },
      { symbol: "z", meaning: "direct measurement", siUnit: "state unit" },
      { symbol: "R", meaning: "measurement-error variance", siUnit: "state unit squared" },
      { symbol: "K", meaning: "Kalman gain", siUnit: "1" },
      { symbol: "\\hat{x}^{+}", meaning: "posterior state estimate", siUnit: "state unit" }
    ],
    [
      "The scalar measurement directly observes the scalar state",
      "Prediction and measurement errors are zero-mean and uncorrelated",
      "The stated covariance values represent the current operating condition"
    ],
    [
      "Predict the state and covariance from the previous posterior and process model.",
      "Form the innovation by subtracting the predicted measurement from the observation.",
      "Use covariance to calculate gain, correct the state and reduce the posterior uncertainty."
    ],
    "state unit = state unit + dimensionless gain multiplied by state unit",
    [
      worked(
        "A scalar position prediction is 2.0 m with variance 4.0 m^2; a 3.0 m measurement has variance 1.0 m^2.",
        "Calculate gain from predicted and measurement variance.",
        "K = 4.0/(4.0 + 1.0) = 0.80.",
        "Correct the prediction by 0.80 times the 1.0 m innovation.",
        "x posterior = 2.8 m and P posterior = 0.8 m^2",
        "The posterior lies between prediction and measurement and its variance is below both input variances."
      ),
      worked(
        "An angular prediction is 10 deg with variance 1 deg^2; a 14 deg measurement has variance 3 deg^2.",
        "Calculate the scalar direct-measurement gain.",
        "K = 1/(1 + 3) = 0.25.",
        "Apply one quarter of the 4 deg innovation.",
        "x posterior = 11 deg and P posterior = 0.75 deg^2",
        "The larger measurement variance keeps the posterior closer to the prediction than to the measurement."
      )
    ],
    "A scalar position prediction is 5 m with variance 4 m^2; an 8 m measurement has variance 1 m^2. Find the posterior position.",
    7.4,
    "m",
    { cm: 0.01, mm: 0.001 },
    0.001
  ),
  extendedKalmanUpdate: formula(
    "\\begin{aligned}H&=\\left.\\frac{\\partial h}{\\partial x}\\right|_{\\hat{x}^{-}}\\\\S&=HP^-H^{T}+R\\\\K&=P^-H^{T}S^{-1}\\\\\\hat{x}^{+}&=\\hat{x}^{-}+K\\left(z-h(\\hat{x}^{-})\\right)\\end{aligned}",
    "The extended Kalman filter linearises the nonlinear observation h at the predicted state using Jacobian H, then forms innovation covariance S, Kalman gain K and a local posterior correction.",
    [
      { symbol: "h", meaning: "nonlinear observation model", siUnit: "measurement unit" },
      { symbol: "H", meaning: "observation Jacobian at the prediction", siUnit: "measurement unit per state unit" },
      { symbol: "S", meaning: "innovation covariance", siUnit: "measurement unit squared" },
      { symbol: "K", meaning: "extended Kalman gain", siUnit: "state unit per measurement unit" },
      { symbol: "\\hat{x}^{-}", meaning: "predicted state estimate", siUnit: "state unit" },
      { symbol: "\\hat{x}^{+}", meaning: "posterior state estimate", siUnit: "state unit" }
    ],
    [
      "The nonlinear model is differentiable near the predicted operating point",
      "The local linearisation is credible across the current uncertainty region",
      "Innovation and covariance consistency are checked after the update"
    ],
    [
      "Evaluate the nonlinear predicted measurement at the predicted state.",
      "Evaluate the observation Jacobian at that same operating point.",
      "Use the local model to form innovation covariance, gain and posterior correction."
    ],
    "state unit = state unit + state-unit-per-measurement-unit multiplied by measurement unit",
    [
      worked(
        "A scalar EKF uses observation h(x) = x^2, prediction 2.0 m, variance 0.25 m^2, measurement 5.0 m^2 and measurement variance 1.0 m^4.",
        "Linearise the observation at the prediction.",
        "H = 2 x 2.0 = 4.0 m and S = 4^2 x 0.25 + 1.0 = 5.0 m^4.",
        "Use gain 0.20 per metre on the 1.0 m^2 innovation.",
        "x posterior = 2.2 m",
        "Substituting 2.2 m into the nonlinear observation gives 4.84 m^2, close to the 5.0 m^2 measurement."
      ),
      worked(
        "The same observation uses prediction 3.0 m, variance 0.16 m^2, measurement 8.5 m^2 and measurement variance 0.36 m^4.",
        "Evaluate the local Jacobian and innovation covariance.",
        "H = 6.0 m, S = 6^2 x 0.16 + 0.36 = 6.12 m^4 and K = 0.1569 per metre.",
        "Apply the gain to the negative 0.50 m^2 innovation.",
        "x posterior = 2.922 m",
        "The corrected nonlinear prediction is about 8.536 m^2, consistent with the measurement at the stated approximation."
      )
    ],
    "A scalar EKF uses h(x) = x^2, prediction 2.0 m, variance 0.25 m^2, measurement 5.0 m^2 and measurement variance 1.0 m^4. Find the posterior state.",
    2.2,
    "m",
    { cm: 0.01, mm: 0.001 },
    0.001
  )
} satisfies Record<string, FormulaTemplate>;

export type AcademyFormulaKey = keyof typeof academyFormulaTemplates;

type AcademyAuthoredInstructionPart =
  | {
      readonly kind: "text";
      readonly text: string;
    }
  | {
      readonly kind: "math";
      readonly plainText: string;
      readonly latex: string;
      readonly spoken: string;
      readonly displayMode?: boolean;
    };

const authoredText = (text: string): AcademyAuthoredInstructionPart => ({
  kind: "text",
  text
});

const authoredMath = (
  plainText: string,
  latex: string,
  spoken = plainText,
  displayMode = true
): AcademyAuthoredInstructionPart => ({
  kind: "math",
  plainText,
  latex,
  spoken,
  displayMode
});

const authoredMathOnly = (
  plainText: string,
  latex: string,
  spoken = plainText
): readonly AcademyAuthoredInstructionPart[] => [
  authoredMath(plainText, latex, spoken)
];

const authoredStatement = (
  before: string,
  plainText: string,
  latex: string,
  spoken: string,
  after = ""
): readonly AcademyAuthoredInstructionPart[] => [
  ...(before ? [authoredText(before)] : []),
  authoredMath(plainText, latex, spoken),
  ...(after ? [authoredText(after)] : [])
];

const authoredExpression = (
  before: string,
  plainText: string,
  latex: string,
  after = ""
): readonly AcademyAuthoredInstructionPart[] =>
  authoredStatement(before, plainText, latex, plainText, after);

const academyAuthoredInstructionParts = new Map<
  string,
  readonly AcademyAuthoredInstructionPart[]
>([
  [
    "unit(q_total) = unit(q_i)",
    authoredMathOnly(
      "unit(q_total) = unit(q_i)",
      String.raw`\operatorname{unit}(q_{\mathrm{total}})=\operatorname{unit}(q_i)`,
      "The unit of the total quantity equals the unit of every component quantity."
    )
  ],
  [
    "Add 10 + 15 + 20 + 5.",
    authoredStatement(
      "Add ",
      "10 + 15 + 20 + 5",
      "10+15+20+5",
      "ten plus fifteen plus twenty plus five",
      "."
    )
  ],
  [
    "q_total = 50 min",
    authoredMathOnly(
      "q_total = 50 min",
      String.raw`q_{\mathrm{total}}=50\,\mathrm{min}`,
      "The total quantity is fifty minutes."
    )
  ],
  [
    "Group the terms as (10 + 20) + (15 + 5) = 30 + 20 = 50 min.",
    authoredStatement(
      "Group the terms as ",
      "(10 + 20) + (15 + 5) = 30 + 20 = 50 min",
      String.raw`(10+20)+(15+5)=30+20=50\,\mathrm{min}`,
      "ten plus twenty, plus fifteen plus five, equals thirty plus twenty, which equals fifty minutes",
      "."
    )
  ],
  [
    "Add 180 + 240 + 300 = 720 s.",
    authoredStatement(
      "Add ",
      "180 + 240 + 300 = 720 s",
      String.raw`180+240+300=720\,\mathrm{s}`,
      "one hundred eighty plus two hundred forty plus three hundred equals seven hundred twenty seconds",
      "."
    )
  ],
  [
    "Convert with 60 s = 1 min.",
    authoredStatement(
      "Convert with ",
      "60 s = 1 min",
      String.raw`60\,\mathrm{s}=1\,\mathrm{min}`,
      "sixty seconds equals one minute",
      "."
    )
  ],
  [
    "720 / 60 = 12 min.",
    authoredStatement(
      "",
      "720 / 60 = 12 min",
      String.raw`\frac{720\,\mathrm{s}}{60\,\mathrm{s\,min^{-1}}}=12\,\mathrm{min}`,
      "seven hundred twenty seconds divided by sixty seconds per minute equals twelve minutes",
      "."
    )
  ],
  [
    "q_total = 720 s = 12 min",
    authoredMathOnly(
      "q_total = 720 s = 12 min",
      String.raw`q_{\mathrm{total}}=720\,\mathrm{s}=12\,\mathrm{min}`,
      "The total quantity is seven hundred twenty seconds, or twelve minutes."
    )
  ],
  [
    "3 min + 4 min + 5 min = 12 min.",
    authoredStatement(
      "",
      "3 min + 4 min + 5 min = 12 min",
      String.raw`3\,\mathrm{min}+4\,\mathrm{min}+5\,\mathrm{min}=12\,\mathrm{min}`,
      "three minutes plus four minutes plus five minutes equals twelve minutes",
      "."
    )
  ],
  [
    "1 = unit(a) / unit(b)",
    authoredMathOnly(
      "1 = unit(a) / unit(b)",
      String.raw`1=\frac{\operatorname{unit}(a)}{\operatorname{unit}(b)}`,
      "A dimensionless ratio has the unit of a divided by the matching unit of b."
    )
  ],
  [
    "Substitute r = 0.30 / 0.10.",
    authoredStatement(
      "Substitute ",
      "r = 0.30 / 0.10",
      String.raw`r=\frac{0.30\,\mathrm{m}}{0.10\,\mathrm{m}}`,
      "r equals zero point three zero metres divided by zero point one zero metres",
      "."
    )
  ],
  [
    "r = 3.0",
    authoredMathOnly("r = 3.0", "r=3.0", "The motion ratio r is three point zero.")
  ],
  [
    "0.10 m multiplied by 3.0 returns 0.30 m.",
    authoredMathOnly(
      "0.10 m multiplied by 3.0 returns 0.30 m.",
      String.raw`0.10\,\mathrm{m}\times3.0=0.30\,\mathrm{m}`,
      "Zero point one zero metres multiplied by three point zero equals zero point three zero metres."
    )
  ],
  [
    "Set a = 45 and b = 50.",
    [
      authoredText("Set "),
      authoredMath("a = 45", "a=45", "a equals forty-five", false),
      authoredText(" and "),
      authoredMath("b = 50", "b=50", "b equals fifty", false),
      authoredText(".")
    ]
  ],
  [
    "Substitute r = 45 / 50.",
    authoredStatement(
      "Substitute ",
      "r = 45 / 50",
      String.raw`r=\frac{45}{50}`,
      "r equals forty-five divided by fifty",
      "."
    )
  ],
  [
    "r = 0.90",
    authoredMathOnly("r = 0.90", "r=0.90", "The acceptable fraction r is zero point nine zero.")
  ],
  [
    "0.90 x 50 = 45 samples.",
    authoredStatement(
      "",
      "0.90 x 50 = 45 samples",
      String.raw`0.90\times50=45\,\text{samples}`,
      "zero point nine zero multiplied by fifty equals forty-five samples",
      "."
    )
  ],
  [
    "Start from a constant sensitivity dy/dx = m.",
    authoredStatement(
      "Start from a constant sensitivity ",
      "dy/dx = m",
      String.raw`\frac{\mathrm{d}y}{\mathrm{d}x}=m`,
      "d y by d x equals m",
      "."
    )
  ],
  [
    "unit(y) = unit(m) unit(x) = unit(c)",
    authoredMathOnly(
      "unit(y) = unit(m) unit(x) = unit(c)",
      String.raw`\operatorname{unit}(y)=\operatorname{unit}(m)\operatorname{unit}(x)=\operatorname{unit}(c)`,
      "The unit of y equals the unit of m times the unit of x, and equals the unit of c."
    )
  ],
  [
    "A sensor has m = 2.0 mV/kPa, c = 10 mV and x = 40 kPa.",
    [
      authoredText("A sensor has "),
      authoredMath(
        "m = 2.0 mV/kPa",
        String.raw`m=2.0\,\mathrm{mV\,kPa^{-1}}`,
        "sensitivity m equals two point zero millivolts per kilopascal",
        false
      ),
      authoredText(", "),
      authoredMath("c = 10 mV", String.raw`c=10\,\mathrm{mV}`, "intercept c equals ten millivolts", false),
      authoredText(" and "),
      authoredMath("x = 40 kPa", String.raw`x=40\,\mathrm{kPa}`, "input x equals forty kilopascals", false),
      authoredText(".")
    ]
  ],
  [
    "Substitute y = (2.0 mV/kPa)(40 kPa) + 10 mV.",
    authoredStatement(
      "Substitute ",
      "y = (2.0 mV/kPa)(40 kPa) + 10 mV",
      String.raw`y=\left(2.0\,\mathrm{mV\,kPa^{-1}}\right)\left(40\,\mathrm{kPa}\right)+10\,\mathrm{mV}`,
      "y equals two point zero millivolts per kilopascal times forty kilopascals, plus ten millivolts",
      "."
    )
  ],
  [
    "Add 80 mV + 10 mV.",
    authoredStatement(
      "Add ",
      "80 mV + 10 mV",
      String.raw`80\,\mathrm{mV}+10\,\mathrm{mV}`,
      "eighty millivolts plus ten millivolts",
      "."
    )
  ],
  [
    "y = 90 mV",
    authoredMathOnly("y = 90 mV", String.raw`y=90\,\mathrm{mV}`, "y is ninety millivolts.")
  ],
  [
    "Subtract the 10 mV intercept, then 80 mV / 2.0 mV/kPa = 40 kPa.",
    authoredStatement(
      "Subtract the 10 mV intercept, then ",
      "80 mV / 2.0 mV/kPa = 40 kPa",
      String.raw`\frac{80\,\mathrm{mV}}{2.0\,\mathrm{mV\,kPa^{-1}}}=40\,\mathrm{kPa}`,
      "eighty millivolts divided by two point zero millivolts per kilopascal equals forty kilopascals",
      "."
    )
  ],
  [
    "Substitute y = (0.50 V/kg)(6.0 kg) + 0.20 V.",
    authoredStatement(
      "Substitute ",
      "y = (0.50 V/kg)(6.0 kg) + 0.20 V",
      String.raw`y=\left(0.50\,\mathrm{V\,kg^{-1}}\right)\left(6.0\,\mathrm{kg}\right)+0.20\,\mathrm{V}`,
      "y equals zero point five zero volts per kilogram times six point zero kilograms, plus zero point two zero volts",
      "."
    )
  ],
  [
    "Add 3.0 V + 0.20 V.",
    authoredStatement(
      "Add ",
      "3.0 V + 0.20 V",
      String.raw`3.0\,\mathrm{V}+0.20\,\mathrm{V}`,
      "three point zero volts plus zero point two zero volts",
      "."
    )
  ],
  [
    "y = 3.2 V",
    authoredMathOnly("y = 3.2 V", String.raw`y=3.2\,\mathrm{V}`, "y is three point two volts.")
  ],
  [
    "(3.2 V - 0.20 V) / 0.50 V/kg = 6.0 kg.",
    authoredStatement(
      "",
      "(3.2 V - 0.20 V) / 0.50 V/kg = 6.0 kg",
      String.raw`\frac{3.2\,\mathrm{V}-0.20\,\mathrm{V}}{0.50\,\mathrm{V\,kg^{-1}}}=6.0\,\mathrm{kg}`,
      "three point two volts minus zero point two zero volts, divided by zero point five zero volts per kilogram, equals six point zero kilograms",
      "."
    )
  ],
  [
    "A scale gives 0.50 V/kg with a 0.20 V offset for a 6.0 kg load.",
    authoredMathOnly(
      "A scale gives 0.50 V/kg with a 0.20 V offset for a 6.0 kg load.",
      String.raw`m=0.50\,\mathrm{V\,kg^{-1}},\qquad c=0.20\,\mathrm{V},\qquad x=6.0\,\mathrm{kg}`
    )
  ],
  [
    "Apply Pythagoras: r^2 = x^2 + y^2.",
    authoredStatement(
      "Apply Pythagoras: ",
      "r^2 = x^2 + y^2",
      "r^2=x^2+y^2",
      "r squared equals x squared plus y squared",
      "."
    )
  ],
  [
    "m = sqrt(m^2 + m^2)",
    authoredMathOnly(
      "m = sqrt(m^2 + m^2)",
      String.raw`\mathrm{m}=\sqrt{\mathrm{m^2}+\mathrm{m^2}}`,
      "Metres equal the square root of metres squared plus metres squared."
    )
  ],
  [
    "A displacement has components x = 3.0 m and y = 4.0 m.",
    [
      authoredText("A displacement has components "),
      authoredMath("x = 3.0 m", String.raw`x=3.0\,\mathrm{m}`, "x equals three point zero metres", false),
      authoredText(" and "),
      authoredMath("y = 4.0 m", String.raw`y=4.0\,\mathrm{m}`, "y equals four point zero metres", false),
      authoredText(".")
    ]
  ],
  [
    "Substitute sqrt((3.0 m)^2 + (4.0 m)^2).",
    authoredStatement(
      "Substitute ",
      "sqrt((3.0 m)^2 + (4.0 m)^2)",
      String.raw`\sqrt{\left(3.0\,\mathrm{m}\right)^2+\left(4.0\,\mathrm{m}\right)^2}`,
      "the square root of three point zero metres squared plus four point zero metres squared",
      "."
    )
  ],
  [
    "Add 9.0 m^2 + 16.0 m^2.",
    authoredStatement(
      "Add ",
      "9.0 m^2 + 16.0 m^2",
      String.raw`9.0\,\mathrm{m^2}+16.0\,\mathrm{m^2}`,
      "nine point zero square metres plus sixteen point zero square metres",
      "."
    )
  ],
  [
    "Take sqrt(25.0 m^2).",
    authoredStatement(
      "Take ",
      "sqrt(25.0 m^2)",
      String.raw`\sqrt{25.0\,\mathrm{m^2}}`,
      "the square root of twenty-five point zero square metres",
      "."
    )
  ],
  [
    "|r| = 5.0 m",
    authoredMathOnly(
      "|r| = 5.0 m",
      String.raw`\lVert\mathbf{r}\rVert=5.0\,\mathrm{m}`,
      "The magnitude of r is five point zero metres."
    )
  ],
  [
    "Add 0.0144 m^2 + 0.0025 m^2 = 0.0169 m^2.",
    authoredStatement(
      "Add ",
      "0.0144 m^2 + 0.0025 m^2 = 0.0169 m^2",
      String.raw`0.0144\,\mathrm{m^2}+0.0025\,\mathrm{m^2}=0.0169\,\mathrm{m^2}`,
      "zero point zero one four four square metres plus zero point zero zero two five square metres equals zero point zero one six nine square metres",
      "."
    )
  ],
  [
    "|r| = 0.13 m",
    authoredMathOnly(
      "|r| = 0.13 m",
      String.raw`\lVert\mathbf{r}\rVert=0.13\,\mathrm{m}`,
      "The magnitude of r is zero point one three metres."
    )
  ],
  [
    "0.13^2 = 0.0169 m^2.",
    authoredStatement(
      "",
      "0.13^2 = 0.0169 m^2",
      String.raw`\left(0.13\,\mathrm{m}\right)^2=0.0169\,\mathrm{m^2}`,
      "zero point one three metres squared equals zero point zero one six nine square metres",
      "."
    )
  ],
  [
    "dimensionless vector = dimensionless scale x dimensionless vector",
    authoredMathOnly(
      "dimensionless vector = dimensionless scale x dimensionless vector",
      String.raw`\mathbf{v}=\lambda\mathbf{v}`,
      "A dimensionless vector equals a dimensionless scale multiplied by a dimensionless vector."
    )
  ],
  [
    "For A = diag(2, 3), test v = [1, 0]^T.",
    [
      authoredText("For "),
      authoredMath(
        "A = diag(2, 3)",
        String.raw`A=\begin{bmatrix}2&0\\0&3\end{bmatrix}`,
        "A is the diagonal matrix with entries two and three",
        false
      ),
      authoredText(", test "),
      authoredMath(
        "v = [1, 0]^T",
        String.raw`\mathbf{v}=\begin{bmatrix}1\\0\end{bmatrix}`,
        "vector v is the column vector one, zero",
        false
      ),
      authoredText(".")
    ]
  ],
  [
    "Multiply A by v to obtain [2, 0]^T.",
    authoredStatement(
      "Multiply ",
      "A by v to obtain [2, 0]^T",
      String.raw`A\mathbf{v}=\begin{bmatrix}2\\0\end{bmatrix}`,
      "A times vector v equals the column vector two, zero",
      "."
    )
  ],
  [
    "Compare [2, 0]^T with [1, 0]^T.",
    authoredStatement(
      "Compare ",
      "[2, 0]^T with [1, 0]^T",
      String.raw`\begin{bmatrix}2\\0\end{bmatrix}\quad\text{with}\quad\begin{bmatrix}1\\0\end{bmatrix}`,
      "the column vector two, zero with the column vector one, zero",
      "."
    )
  ],
  [
    "lambda = 2",
    authoredMathOnly("lambda = 2", "\\lambda=2", "The eigenvalue lambda is two.")
  ],
  [
    "A v - 2 v = [0, 0]^T.",
    authoredStatement(
      "",
      "A v - 2 v = [0, 0]^T",
      String.raw`A\mathbf{v}-2\mathbf{v}=\begin{bmatrix}0\\0\end{bmatrix}`,
      "A times v minus two v equals the zero vector",
      "."
    )
  ],
  [
    "For A = diag(4, 1), test v = [0, 1]^T.",
    [
      authoredText("For "),
      authoredMath(
        "A = diag(4, 1)",
        String.raw`A=\begin{bmatrix}4&0\\0&1\end{bmatrix}`,
        "A is the diagonal matrix with entries four and one",
        false
      ),
      authoredText(", test "),
      authoredMath(
        "v = [0, 1]^T",
        String.raw`\mathbf{v}=\begin{bmatrix}0\\1\end{bmatrix}`,
        "vector v is the column vector zero, one",
        false
      ),
      authoredText(".")
    ]
  ],
  [
    "Multiply A by v to obtain [0, 1]^T.",
    authoredStatement(
      "Multiply ",
      "A by v to obtain [0, 1]^T",
      String.raw`A\mathbf{v}=\begin{bmatrix}0\\1\end{bmatrix}`,
      "A times vector v equals the column vector zero, one",
      "."
    )
  ],
  [
    "lambda = 1",
    authoredMathOnly("lambda = 1", "\\lambda=1", "The eigenvalue lambda is one.")
  ],
  [
    "A v - 1 v = [0, 0]^T.",
    authoredStatement(
      "",
      "A v - 1 v = [0, 0]^T",
      String.raw`A\mathbf{v}-\mathbf{v}=\begin{bmatrix}0\\0\end{bmatrix}`,
      "A times v minus v equals the zero vector",
      "."
    )
  ],
  [
    "Write the identity x = f^{-1}(f(x)).",
    authoredStatement(
      "Write the identity ",
      "x = f^{-1}(f(x))",
      String.raw`x=f^{-1}\!\left(f(x)\right)`,
      "x equals f inverse of f of x",
      "."
    )
  ],
  [
    "(input/output) = 1 / (output/input)",
    authoredMathOnly(
      "(input/output) = 1 / (output/input)",
      String.raw`\frac{\text{input}}{\text{output}}=\frac{1}{\text{output}/\text{input}}`,
      "Input per output equals the reciprocal of output per input."
    )
  ],
  [
    "For y = 2x + 3, find the derivative of the inverse.",
    authoredStatement(
      "For ",
      "y = 2x + 3",
      "y=2x+3",
      "y equals two x plus three",
      ", find the derivative of the inverse."
    )
  ],
  [
    "Differentiate the original mapping: dy/dx = 2.",
    authoredStatement(
      "Differentiate the original mapping: ",
      "dy/dx = 2",
      String.raw`\frac{\mathrm{d}y}{\mathrm{d}x}=2`,
      "d y by d x equals two",
      "."
    )
  ],
  [
    "dx/dy = 0.5",
    authoredMathOnly(
      "dx/dy = 0.5",
      String.raw`\frac{\mathrm{d}x}{\mathrm{d}y}=0.5`,
      "d x by d y is zero point five."
    )
  ],
  [
    "The inverse is x = (y - 3)/2, whose derivative is 0.5.",
    [
      authoredText("The inverse is "),
      authoredMath(
        "x = (y - 3)/2",
        String.raw`x=\frac{y-3}{2}`,
        "x equals y minus three divided by two",
        false
      ),
      authoredText(", whose derivative is "),
      authoredMath("0.5", "0.5", "zero point five", false),
      authoredText(".")
    ]
  ],
  [
    "For y = x^2 on x > 0, find inverse slope at x = 3.",
    [
      authoredText("For "),
      authoredMath("y = x^2", "y=x^2", "y equals x squared", false),
      authoredText(" on "),
      authoredMath("x > 0", "x>0", "x greater than zero", false),
      authoredText(", find inverse slope at "),
      authoredMath("x = 3", "x=3", "x equals three", false),
      authoredText(".")
    ]
  ],
  [
    "Differentiate: dy/dx = 2x.",
    authoredStatement(
      "Differentiate: ",
      "dy/dx = 2x",
      String.raw`\frac{\mathrm{d}y}{\mathrm{d}x}=2x`,
      "d y by d x equals two x",
      "."
    )
  ],
  [
    "At x = 3, dy/dx = 6.",
    [
      authoredText("At "),
      authoredMath("x = 3", "x=3", "x equals three", false),
      authoredText(", "),
      authoredMath(
        "dy/dx = 6",
        String.raw`\frac{\mathrm{d}y}{\mathrm{d}x}=6`,
        "d y by d x equals six",
        false
      ),
      authoredText(".")
    ]
  ],
  [
    "dx/dy = 1/6",
    authoredMathOnly(
      "dx/dy = 1/6",
      String.raw`\frac{\mathrm{d}x}{\mathrm{d}y}=\frac{1}{6}`,
      "d x by d y is one sixth."
    )
  ],
  [
    "The inverse x = sqrt(y) has derivative 1/(2 sqrt(y)); at y = 9 this is 1/6.",
    [
      authoredText("The inverse "),
      authoredMath(
        "x = sqrt(y)",
        String.raw`x=\sqrt{y}`,
        "x equals the square root of y",
        false
      ),
      authoredText(" has derivative "),
      authoredMath(
        "1/(2 sqrt(y))",
        String.raw`\frac{1}{2\sqrt{y}}`,
        "one divided by two times the square root of y",
        false
      ),
      authoredText("; at "),
      authoredMath("y = 9", "y=9", "y equals nine", false),
      authoredText(" this is "),
      authoredMath("1/6", String.raw`\frac{1}{6}`, "one sixth", false),
      authoredText(".")
    ]
  ],
  [
    "Take a position change Delta x over interval Delta t.",
    [
      authoredText("Take a position change "),
      authoredMath("Delta x", String.raw`\Delta x`, "delta x", false),
      authoredText(" over interval "),
      authoredMath("Delta t", String.raw`\Delta t`, "delta t", false),
      authoredText(".")
    ]
  ],
  [
    "The limiting quotient is dx/dt.",
    authoredStatement(
      "The limiting quotient is ",
      "dx/dt",
      String.raw`\frac{\mathrm{d}x}{\mathrm{d}t}`,
      "d x by d t",
      "."
    )
  ],
  [
    "m/s = m / s",
    authoredMathOnly(
      "m/s = m / s",
      String.raw`\mathrm{m\,s^{-1}}=\frac{\mathrm{m}}{\mathrm{s}}`,
      "Metres per second equal metres divided by seconds."
    )
  ],
  [
    "For x = 2t^(2) m, find velocity at t = 3 s.",
    [
      authoredText("For "),
      authoredMath(
        "x = 2t^(2) m",
        String.raw`x=2t^2\,\mathrm{m}`,
        "x equals two t squared metres",
        false
      ),
      authoredText(", find velocity at "),
      authoredMath("t = 3 s", String.raw`t=3\,\mathrm{s}`, "t equals three seconds", false),
      authoredText(".")
    ]
  ],
  [
    "Differentiate x to obtain v = 4t m/s.",
    authoredStatement(
      "Differentiate x to obtain ",
      "v = 4t m/s",
      String.raw`v=4t\,\mathrm{m\,s^{-1}}`,
      "v equals four t metres per second",
      "."
    )
  ],
  [
    "Substitute t = 3 s.",
    authoredStatement(
      "Substitute ",
      "t = 3 s",
      String.raw`t=3\,\mathrm{s}`,
      "t equals three seconds",
      "."
    )
  ],
  [
    "Evaluate (4 x 3) m/s.",
    authoredStatement(
      "Evaluate ",
      "(4 x 3) m/s",
      String.raw`4\times3\,\mathrm{m\,s^{-1}}`,
      "four times three metres per second",
      "."
    )
  ],
  [
    "v = 12 m/s",
    authoredMathOnly(
      "v = 12 m/s",
      String.raw`v=12\,\mathrm{m\,s^{-1}}`,
      "Velocity v is twelve metres per second."
    )
  ],
  [
    "A centred difference around 3 s approaches 12 m/s as the interval shrinks.",
    authoredMathOnly(
      "A centred difference around 3 s approaches 12 m/s as the interval shrinks.",
      String.raw`\lim_{\Delta t\to0}\frac{x(3+\Delta t)-x(3-\Delta t)}{2\Delta t}=12\,\mathrm{m\,s^{-1}}`
    )
  ],
  [
    "Find Delta x = 0.8 m.",
    authoredStatement(
      "Find ",
      "Delta x = 0.8 m",
      String.raw`\Delta x=0.8\,\mathrm{m}`,
      "delta x equals zero point eight metres",
      "."
    )
  ],
  [
    "Use v_avg = Delta x / Delta t.",
    authoredStatement(
      "Use ",
      "v_avg = Delta x / Delta t",
      String.raw`v_{\mathrm{avg}}=\frac{\Delta x}{\Delta t}`,
      "average velocity equals delta x divided by delta t",
      "."
    )
  ],
  [
    "v_avg = 4.0 m/s",
    authoredMathOnly(
      "v_avg = 4.0 m/s",
      String.raw`v_{\mathrm{avg}}=4.0\,\mathrm{m\,s^{-1}}`,
      "Average velocity is four point zero metres per second."
    )
  ],
  [
    "4.0 m/s x 0.20 s = 0.8 m.",
    authoredStatement(
      "",
      "4.0 m/s x 0.20 s = 0.8 m",
      String.raw`\left(4.0\,\mathrm{m\,s^{-1}}\right)\left(0.20\,\mathrm{s}\right)=0.8\,\mathrm{m}`,
      "four point zero metres per second times zero point two zero seconds equals zero point eight metres",
      "."
    )
  ],
  [
    "Approximate each contribution as q Delta t.",
    authoredStatement(
      "Approximate each contribution as ",
      "q Delta t",
      String.raw`q\,\Delta t`,
      "q times delta t",
      "."
    )
  ],
  [
    "unit(Q) = unit(q) s",
    authoredMathOnly(
      "unit(Q) = unit(q) s",
      String.raw`\operatorname{unit}(Q)=\operatorname{unit}(q)\,\mathrm{s}`,
      "The unit of Q equals the unit of q multiplied by seconds."
    )
  ],
  [
    "A constant flow of 0.20 L/s lasts 30 s.",
    authoredMathOnly(
      "A constant flow of 0.20 L/s lasts 30 s.",
      String.raw`q=0.20\,\mathrm{L\,s^{-1}},\qquad\Delta t=30\,\mathrm{s}`
    )
  ],
  [
    "For constant q, Q = q Delta t.",
    authoredStatement(
      "For constant q, ",
      "Q = q Delta t",
      String.raw`Q=q\,\Delta t`,
      "Q equals q times delta t",
      "."
    )
  ],
  [
    "Substitute 0.20 L/s x 30 s.",
    authoredStatement(
      "Substitute ",
      "0.20 L/s x 30 s",
      String.raw`\left(0.20\,\mathrm{L\,s^{-1}}\right)\left(30\,\mathrm{s}\right)`,
      "zero point two zero litres per second times thirty seconds",
      "."
    )
  ],
  [
    "Q = 6.0 L",
    authoredMathOnly("Q = 6.0 L", String.raw`Q=6.0\,\mathrm{L}`, "Q is six point zero litres.")
  ],
  [
    "A rate of 0.20 L/s sustained for 30 s totals 6.0 L.",
    authoredMathOnly(
      "A rate of 0.20 L/s sustained for 30 s totals 6.0 L.",
      String.raw`\left(0.20\,\mathrm{L\,s^{-1}}\right)\left(30\,\mathrm{s}\right)=6.0\,\mathrm{L}`
    )
  ],
  [
    "Use E = integral P dt = P Delta t.",
    authoredStatement(
      "Use ",
      "E = integral P dt = P Delta t",
      String.raw`E=\int P\,\mathrm{d}t=P\,\Delta t`,
      "Energy E equals the integral of power with respect to time, which equals P times delta t for constant power",
      "."
    )
  ],
  [
    "Substitute 50 J/s x 120 s.",
    authoredStatement(
      "Substitute ",
      "50 J/s x 120 s",
      String.raw`\left(50\,\mathrm{J\,s^{-1}}\right)\left(120\,\mathrm{s}\right)`,
      "fifty joules per second times one hundred twenty seconds",
      "."
    )
  ],
  [
    "E = 6000 J",
    authoredMathOnly("E = 6000 J", String.raw`E=6000\,\mathrm{J}`, "Energy E is six thousand joules.")
  ],
  [
    "6.0 kJ / 120 s = 50 W.",
    authoredStatement(
      "",
      "6.0 kJ / 120 s = 50 W",
      String.raw`\frac{6.0\,\mathrm{kJ}}{120\,\mathrm{s}}=50\,\mathrm{W}`,
      "six point zero kilojoules divided by one hundred twenty seconds equals fifty watts",
      "."
    )
  ],
  [
    "Momentum is p = mv.",
    authoredStatement("Momentum is ", "p = mv", "p=mv", "p equals m v", ".")
  ],
  [
    "For constant mass, dp/dt = m dv/dt.",
    authoredStatement(
      "For constant mass, ",
      "dp/dt = m dv/dt",
      String.raw`\frac{\mathrm{d}p}{\mathrm{d}t}=m\frac{\mathrm{d}v}{\mathrm{d}t}`,
      "d p by d t equals m times d v by d t",
      "."
    )
  ],
  [
    "Recognise dv/dt as acceleration a.",
    authoredStatement(
      "Recognise ",
      "dv/dt",
      String.raw`\frac{\mathrm{d}v}{\mathrm{d}t}`,
      "d v by d t",
      " as acceleration a."
    )
  ],
  [
    "N = kg m/s^2",
    authoredMathOnly(
      "N = kg m/s^2",
      String.raw`\mathrm{N}=\mathrm{kg\,m\,s^{-2}}`,
      "A newton equals a kilogram metre per second squared."
    )
  ],
  [
    "A 12 kg rover accelerates at 0.50 m/s^2.",
    authoredMathOnly(
      "A 12 kg rover accelerates at 0.50 m/s^2.",
      String.raw`m=12\,\mathrm{kg},\qquad a=0.50\,\mathrm{m\,s^{-2}}`
    )
  ],
  [
    "Substitute F = (12 kg)(0.50 m/s^2).",
    authoredStatement(
      "Substitute ",
      "F = (12 kg)(0.50 m/s^2)",
      String.raw`F=\left(12\,\mathrm{kg}\right)\left(0.50\,\mathrm{m\,s^{-2}}\right)`,
      "F equals twelve kilograms times zero point five zero metres per second squared",
      "."
    )
  ],
  [
    "F = 6.0 N",
    authoredMathOnly("F = 6.0 N", String.raw`F=6.0\,\mathrm{N}`, "Force F is six point zero newtons.")
  ],
  [
    "Express kg m/s^2 as newtons.",
    authoredMathOnly(
      "Express kg m/s^2 as newtons.",
      String.raw`\mathrm{kg\,m\,s^{-2}}=\mathrm{N}`
    )
  ],
  [
    "6.0 N / 12 kg = 0.50 m/s^2.",
    authoredStatement(
      "",
      "6.0 N / 12 kg = 0.50 m/s^2",
      String.raw`\frac{6.0\,\mathrm{N}}{12\,\mathrm{kg}}=0.50\,\mathrm{m\,s^{-2}}`,
      "six point zero newtons divided by twelve kilograms equals zero point five zero metres per second squared",
      "."
    )
  ],
  [
    "Rearrange a = F/m.",
    authoredStatement(
      "Rearrange ",
      "a = F/m",
      String.raw`a=\frac{F}{m}`,
      "a equals F divided by m",
      "."
    )
  ],
  [
    "Substitute 10 N / 2.5 kg.",
    authoredStatement(
      "Substitute ",
      "10 N / 2.5 kg",
      String.raw`\frac{10\,\mathrm{N}}{2.5\,\mathrm{kg}}`,
      "ten newtons divided by two point five kilograms",
      "."
    )
  ],
  [
    "a = 4.0 m/s^2",
    authoredMathOnly(
      "a = 4.0 m/s^2",
      String.raw`a=4.0\,\mathrm{m\,s^{-2}}`,
      "Acceleration a is four point zero metres per second squared."
    )
  ],
  [
    "2.5 kg x 4.0 m/s^2 = 10 N.",
    authoredStatement(
      "",
      "2.5 kg x 4.0 m/s^2 = 10 N",
      String.raw`\left(2.5\,\mathrm{kg}\right)\left(4.0\,\mathrm{m\,s^{-2}}\right)=10\,\mathrm{N}`,
      "two point five kilograms times four point zero metres per second squared equals ten newtons",
      "."
    )
  ],
  [
    "Pa = N/m^2",
    authoredMathOnly(
      "Pa = N/m^2",
      String.raw`\mathrm{Pa}=\mathrm{N\,m^{-2}}`,
      "A pascal equals a newton per square metre."
    )
  ],
  [
    "A 2000 N load acts on 400 mm^2.",
    authoredStatement(
      "A 2000 N load acts on ",
      "400 mm^2",
      String.raw`400\,\mathrm{mm^2}`,
      "four hundred square millimetres",
      "."
    )
  ],
  [
    "Convert 400 mm^2 to 4.00e-4 m^2.",
    authoredStatement(
      "Convert ",
      "400 mm^2 to 4.00e-4 m^2",
      String.raw`400\,\mathrm{mm^2}=4.00\times10^{-4}\,\mathrm{m^2}`,
      "four hundred square millimetres equals four point zero zero times ten to the minus four square metres",
      "."
    )
  ],
  [
    "Substitute sigma = 2000 N / 4.00e-4 m^2.",
    authoredStatement(
      "Substitute ",
      "sigma = 2000 N / 4.00e-4 m^2",
      String.raw`\sigma=\frac{2000\,\mathrm{N}}{4.00\times10^{-4}\,\mathrm{m^2}}`,
      "sigma equals two thousand newtons divided by four point zero zero times ten to the minus four square metres",
      "."
    )
  ],
  [
    "sigma = 5.00 MPa",
    authoredMathOnly(
      "sigma = 5.00 MPa",
      String.raw`\sigma=5.00\,\mathrm{MPa}`,
      "Stress sigma is five point zero zero megapascals."
    )
  ],
  [
    "5.00 N/mm^2 equals 5.00 MPa.",
    authoredMathOnly(
      "5.00 N/mm^2 equals 5.00 MPa.",
      String.raw`5.00\,\mathrm{N\,mm^{-2}}=5.00\,\mathrm{MPa}`,
      "Five point zero zero newtons per square millimetre equals five point zero zero megapascals."
    )
  ],
  [
    "Area = 50 mm^2.",
    authoredStatement(
      "",
      "Area = 50 mm^2",
      String.raw`A=50\,\mathrm{mm^2}`,
      "Area is fifty square millimetres",
      "."
    )
  ],
  [
    "Divide 1500 N by 50 mm^2.",
    authoredStatement(
      "Divide ",
      "1500 N by 50 mm^2",
      String.raw`\frac{1500\,\mathrm{N}}{50\,\mathrm{mm^2}}`,
      "one thousand five hundred newtons divided by fifty square millimetres",
      "."
    )
  ],
  [
    "Use 1 N/mm^2 = 1 MPa.",
    authoredStatement(
      "Use ",
      "1 N/mm^2 = 1 MPa",
      String.raw`1\,\mathrm{N\,mm^{-2}}=1\,\mathrm{MPa}`,
      "one newton per square millimetre equals one megapascal",
      "."
    )
  ],
  [
    "sigma = 30 MPa",
    authoredMathOnly(
      "sigma = 30 MPa",
      String.raw`\sigma=30\,\mathrm{MPa}`,
      "Stress sigma is thirty megapascals."
    )
  ],
  [
    "30 MPa x 50 mm^2 = 1500 N.",
    authoredStatement(
      "",
      "30 MPa x 50 mm^2 = 1500 N",
      String.raw`\left(30\,\mathrm{N\,mm^{-2}}\right)\left(50\,\mathrm{mm^2}\right)=1500\,\mathrm{N}`,
      "thirty newtons per square millimetre times fifty square millimetres equals one thousand five hundred newtons",
      "."
    )
  ],
  [
    "Incremental work in rotation is dW = T dtheta.",
    authoredStatement(
      "Incremental work in rotation is ",
      "dW = T dtheta",
      String.raw`\mathrm{d}W=T\,\mathrm{d}\theta`,
      "d W equals torque T times d theta",
      "."
    )
  ],
  [
    "Recognise dtheta/dt as angular speed omega.",
    authoredStatement(
      "Recognise ",
      "dtheta/dt",
      String.raw`\frac{\mathrm{d}\theta}{\mathrm{d}t}`,
      "d theta by d t",
      " as angular speed omega."
    )
  ],
  [
    "W = N m rad/s, with rad dimensionless",
    authoredMathOnly(
      "W = N m rad/s, with rad dimensionless",
      String.raw`\mathrm{W}=\mathrm{N\,m\,rad\,s^{-1}},\qquad[\mathrm{rad}]=1`,
      "Watts equal newton metres times radians per second, with radians dimensionless."
    )
  ],
  [
    "A shaft delivers 8.0 N m at 25 rad/s.",
    authoredMathOnly(
      "A shaft delivers 8.0 N m at 25 rad/s.",
      String.raw`T=8.0\,\mathrm{N\,m},\qquad\omega=25\,\mathrm{rad\,s^{-1}}`
    )
  ],
  [
    "A 600 W motor shaft turns at 100 rad/s.",
    authoredMathOnly(
      "A 600 W motor shaft turns at 100 rad/s.",
      String.raw`P=600\,\mathrm{W},\qquad\omega=100\,\mathrm{rad\,s^{-1}}`
    )
  ],
  [
    "Substitute P = 8.0 N m x 25 rad/s.",
    authoredStatement(
      "Substitute ",
      "P = 8.0 N m x 25 rad/s",
      String.raw`P=\left(8.0\,\mathrm{N\,m}\right)\left(25\,\mathrm{rad\,s^{-1}}\right)`,
      "P equals eight point zero newton metres times twenty-five radians per second",
      "."
    )
  ],
  [
    "P = 200 W",
    authoredMathOnly("P = 200 W", String.raw`P=200\,\mathrm{W}`, "Power P is two hundred watts.")
  ],
  [
    "200 W / 25 rad/s = 8.0 N m.",
    authoredStatement(
      "",
      "200 W / 25 rad/s = 8.0 N m",
      String.raw`\frac{200\,\mathrm{W}}{25\,\mathrm{rad\,s^{-1}}}=8.0\,\mathrm{N\,m}`,
      "two hundred watts divided by twenty-five radians per second equals eight point zero newton metres",
      "."
    )
  ],
  [
    "Rearrange T = P/omega.",
    authoredStatement(
      "Rearrange ",
      "T = P/omega",
      String.raw`T=\frac{P}{\omega}`,
      "T equals P divided by omega",
      "."
    )
  ],
  [
    "Substitute 600 W / 100 rad/s.",
    authoredStatement(
      "Substitute ",
      "600 W / 100 rad/s",
      String.raw`\frac{600\,\mathrm{W}}{100\,\mathrm{rad\,s^{-1}}}`,
      "six hundred watts divided by one hundred radians per second",
      "."
    )
  ],
  [
    "T = 6.0 N m",
    authoredMathOnly(
      "T = 6.0 N m",
      String.raw`T=6.0\,\mathrm{N\,m}`,
      "Torque T is six point zero newton metres."
    )
  ],
  [
    "6.0 N m x 100 rad/s = 600 W.",
    authoredStatement(
      "",
      "6.0 N m x 100 rad/s = 600 W",
      String.raw`\left(6.0\,\mathrm{N\,m}\right)\left(100\,\mathrm{rad\,s^{-1}}\right)=600\,\mathrm{W}`,
      "six point zero newton metres times one hundred radians per second equals six hundred watts",
      "."
    )
  ],
  [
    "Resistance is defined as the voltage-current ratio R = V/I.",
    authoredStatement(
      "Resistance is defined as the voltage-current ratio ",
      "R = V/I",
      String.raw`R=\frac{V}{I}`,
      "R equals V divided by I",
      "."
    )
  ],
  [
    "Obtain V = IR.",
    authoredStatement("Obtain ", "V = IR", "V=IR", "V equals I R", ".")
  ],
  [
    "V = A ohm",
    authoredMathOnly(
      "V = A ohm",
      String.raw`\mathrm{V}=\mathrm{A\,\Omega}`,
      "A volt equals an ampere ohm."
    )
  ],
  [
    "Convert 15 mA to 0.015 A.",
    authoredStatement(
      "Convert ",
      "15 mA to 0.015 A",
      String.raw`15\,\mathrm{mA}=0.015\,\mathrm{A}`,
      "fifteen milliamperes equals zero point zero one five amperes",
      "."
    )
  ],
  [
    "Substitute V = 0.015 A x 220 ohm.",
    authoredStatement(
      "Substitute ",
      "V = 0.015 A x 220 ohm",
      String.raw`V=\left(0.015\,\mathrm{A}\right)\left(220\,\Omega\right)`,
      "V equals zero point zero one five amperes times two hundred twenty ohms",
      "."
    )
  ],
  [
    "V = 3.3 V",
    authoredMathOnly("V = 3.3 V", String.raw`V=3.3\,\mathrm{V}`, "Voltage V is three point three volts.")
  ],
  [
    "3.3 V / 220 ohm = 0.015 A.",
    authoredStatement(
      "",
      "3.3 V / 220 ohm = 0.015 A",
      String.raw`\frac{3.3\,\mathrm{V}}{220\,\Omega}=0.015\,\mathrm{A}`,
      "three point three volts divided by two hundred twenty ohms equals zero point zero one five amperes",
      "."
    )
  ],
  [
    "Rearrange R = V/I.",
    authoredStatement(
      "Rearrange ",
      "R = V/I",
      String.raw`R=\frac{V}{I}`,
      "R equals V divided by I",
      "."
    )
  ],
  [
    "Substitute 24 V / 0.50 A.",
    authoredStatement(
      "Substitute ",
      "24 V / 0.50 A",
      String.raw`\frac{24\,\mathrm{V}}{0.50\,\mathrm{A}}`,
      "twenty-four volts divided by zero point five zero amperes",
      "."
    )
  ],
  [
    "R = 48 ohm",
    authoredMathOnly("R = 48 ohm", String.raw`R=48\,\Omega`, "Resistance R is forty-eight ohms.")
  ],
  [
    "0.50 A x 48 ohm = 24 V.",
    authoredStatement(
      "",
      "0.50 A x 48 ohm = 24 V",
      String.raw`\left(0.50\,\mathrm{A}\right)\left(48\,\Omega\right)=24\,\mathrm{V}`,
      "zero point five zero amperes times forty-eight ohms equals twenty-four volts",
      "."
    )
  ],
  [
    "One event lasts 1/f seconds.",
    authoredExpression("One event lasts ", "1/f seconds", String.raw`\frac{1}{f}\,\mathrm{s}`, ".")
  ],
  [
    "N equal events last N times that period.",
    authoredMathOnly(
      "N equal events last N times that period.",
      String.raw`t=N\left(\frac{1}{f}\right)`
    )
  ],
  [
    "Therefore t = N/f.",
    authoredExpression("Therefore ", "t = N/f", String.raw`t=\frac{N}{f}`, ".")
  ],
  [
    "s = 1 / Hz",
    authoredMathOnly("s = 1 / Hz", String.raw`\mathrm{s}=\frac{1}{\mathrm{Hz}}`)
  ],
  [
    "Convert 1 MHz to 1.0e6 Hz.",
    authoredExpression(
      "Convert ",
      "1 MHz to 1.0e6 Hz",
      String.raw`1\,\mathrm{MHz}=1.0\times10^6\,\mathrm{Hz}`,
      "."
    )
  ],
  [
    "Substitute t = 5000 / 1.0e6 Hz.",
    authoredExpression(
      "Substitute ",
      "t = 5000 / 1.0e6 Hz",
      String.raw`t=\frac{5000}{1.0\times10^6\,\mathrm{Hz}}`,
      "."
    )
  ],
  [
    "t = 0.005 s = 5 ms",
    authoredMathOnly(
      "t = 0.005 s = 5 ms",
      String.raw`t=0.005\,\mathrm{s}=5\,\mathrm{ms}`
    )
  ],
  [
    "1 MHz gives 1000 cycles per millisecond; 5000 cycles need 5 ms.",
    authoredMathOnly(
      "1 MHz gives 1000 cycles per millisecond; 5000 cycles need 5 ms.",
      String.raw`\left(1000\,\mathrm{cycles\,ms^{-1}}\right)\left(5\,\mathrm{ms}\right)=5000\,\mathrm{cycles}`
    )
  ],
  [
    "Substitute t = 20 / 10000 Hz.",
    authoredExpression(
      "Substitute ",
      "t = 20 / 10000 Hz",
      String.raw`t=\frac{20}{10000\,\mathrm{Hz}}`,
      "."
    )
  ],
  [
    "t = 0.002 s = 2 ms",
    authoredMathOnly(
      "t = 0.002 s = 2 ms",
      String.raw`t=0.002\,\mathrm{s}=2\,\mathrm{ms}`
    )
  ],
  [
    "Each cycle is 0.1 ms; 20 cycles need 2 ms.",
    authoredMathOnly(
      "Each cycle is 0.1 ms; 20 cycles need 2 ms.",
      String.raw`\left(20\,\mathrm{cycles}\right)\left(0.1\,\mathrm{ms\,cycle^{-1}}\right)=2\,\mathrm{ms}`
    )
  ],
  [
    "Sampling repeats the spectrum at multiples of f_s.",
    authoredExpression(
      "Sampling repeats the spectrum at multiples of ",
      "f_s",
      "f_s",
      "."
    )
  ],
  [
    "Adjacent spectral copies avoid overlap when f_s - f_max is at least f_max.",
    authoredMathOnly(
      "Adjacent spectral copies avoid overlap when f_s - f_max is at least f_max.",
      String.raw`f_s-f_{\max}\geq f_{\max}`
    )
  ],
  [
    "Rearrange to f_s >= 2 f_max.",
    authoredExpression(
      "Rearrange to ",
      "f_s >= 2 f_max",
      String.raw`f_s\geq2f_{\max}`,
      "."
    )
  ],
  [
    "Hz = Hz",
    authoredMathOnly("Hz = Hz", String.raw`\mathrm{Hz}=\mathrm{Hz}`)
  ],
  [
    "Use f_s >= 2 x 80 Hz.",
    authoredExpression(
      "Use ",
      "f_s >= 2 x 80 Hz",
      String.raw`f_s\geq2\left(80\,\mathrm{Hz}\right)`,
      "."
    )
  ],
  [
    "f_s,min = 160 Hz",
    authoredMathOnly(
      "f_s,min = 160 Hz",
      String.raw`f_{s,\min}=160\,\mathrm{Hz}`
    )
  ],
  [
    "At 160 Hz, the Nyquist frequency is 80 Hz.",
    authoredMathOnly(
      "At 160 Hz, the Nyquist frequency is 80 Hz.",
      String.raw`\frac{160\,\mathrm{Hz}}{2}=80\,\mathrm{Hz}`
    )
  ],
  [
    "Rearrange f_max <= f_s/2.",
    authoredExpression(
      "Rearrange ",
      "f_max <= f_s/2",
      String.raw`f_{\max}\leq\frac{f_s}{2}`,
      "."
    )
  ],
  [
    "Substitute 1000 Hz / 2.",
    authoredExpression(
      "Substitute ",
      "1000 Hz / 2",
      String.raw`\frac{1000\,\mathrm{Hz}}{2}`,
      "."
    )
  ],
  [
    "f_max <= 500 Hz",
    authoredMathOnly(
      "f_max <= 500 Hz",
      String.raw`f_{\max}\leq500\,\mathrm{Hz}`
    )
  ],
  [
    "Twice 500 Hz equals the 1000 Hz sampling rate.",
    authoredMathOnly(
      "Twice 500 Hz equals the 1000 Hz sampling rate.",
      String.raw`2\left(500\,\mathrm{Hz}\right)=1000\,\mathrm{Hz}`
    )
  ],
  [
    "Define tracking error e = r - y.",
    authoredExpression("Define tracking error ", "e = r - y", "e=r-y", ".")
  ],
  [
    "Choose output proportional to error: u = Kp e.",
    authoredExpression(
      "Choose output proportional to error: ",
      "u = Kp e",
      "u=K_p e",
      "."
    )
  ],
  [
    "unit(u) = unit(Kp) unit(r-y)",
    authoredMathOnly(
      "unit(u) = unit(Kp) unit(r-y)",
      String.raw`\operatorname{unit}(u)=\operatorname{unit}(K_p)\operatorname{unit}(r-y)`
    )
  ],
  [
    "Reference is 10 rad/s, output is 8 rad/s and Kp = 2 V per rad/s.",
    authoredExpression(
      "Reference is 10 rad/s, output is 8 rad/s and ",
      "Kp = 2 V per rad/s",
      String.raw`K_p=2\,\mathrm{V\,(rad\,s^{-1})^{-1}}`,
      "."
    )
  ],
  [
    "Compute e = 10 - 8 = 2 rad/s.",
    authoredExpression(
      "Compute ",
      "e = 10 - 8 = 2 rad/s",
      String.raw`e=10-8=2\,\mathrm{rad\,s^{-1}}`,
      "."
    )
  ],
  [
    "Substitute u = 2 V/(rad/s) x 2 rad/s.",
    authoredExpression(
      "Substitute ",
      "u = 2 V/(rad/s) x 2 rad/s",
      String.raw`u=\left(2\,\mathrm{V\,(rad\,s^{-1})^{-1}}\right)\left(2\,\mathrm{rad\,s^{-1}}\right)`,
      "."
    )
  ],
  [
    "u = 4 V",
    authoredMathOnly("u = 4 V", String.raw`u=4\,\mathrm{V}`)
  ],
  [
    "u/Kp = 4/2 = 2 rad/s, matching the error.",
    authoredStatement(
      "",
      "u/Kp = 4/2 = 2 rad/s",
      String.raw`\frac{u}{K_p}=\frac{4}{2}=2\,\mathrm{rad\,s^{-1}}`,
      "u divided by K p equals four divided by two, which equals two radians per second",
      ", matching the error."
    )
  ],
  [
    "A temperature loop has r = 50 deg C, y = 47 deg C and Kp = 10 percent per deg C.",
    [
      authoredText("A temperature loop has "),
      authoredMath("r = 50 deg C", String.raw`r=50\,{}^\circ\mathrm{C}`, "r equals fifty degrees Celsius", false),
      authoredText(", "),
      authoredMath("y = 47 deg C", String.raw`y=47\,{}^\circ\mathrm{C}`, "y equals forty-seven degrees Celsius", false),
      authoredText(" and "),
      authoredMath(
        "Kp = 10 percent per deg C",
        String.raw`K_p=10\,\%\,{}^\circ\mathrm{C}^{-1}`,
        "K p equals ten percent per degree Celsius",
        false
      ),
      authoredText(".")
    ]
  ],
  [
    "Compute e = 3 deg C.",
    authoredExpression(
      "Compute ",
      "e = 3 deg C",
      String.raw`e=3\,{}^\circ\mathrm{C}`,
      "."
    )
  ],
  [
    "u = 30 percent",
    authoredMathOnly("u = 30 percent", String.raw`u=30\,\%`)
  ],
  [
    "30 percent / 10 percent per deg C = 3 deg C.",
    authoredExpression(
      "",
      "30 percent / 10 percent per deg C = 3 deg C",
      String.raw`\frac{30\,\%}{10\,\%\,{}^\circ\mathrm{C}^{-1}}=3\,{}^\circ\mathrm{C}`,
      "."
    )
  ],
  [
    "m/s = m/s; rad/s = (m/s)/m",
    authoredMathOnly(
      "m/s = m/s; rad/s = (m/s)/m",
      String.raw`\mathrm{m\,s^{-1}}=\mathrm{m\,s^{-1}},\qquad\mathrm{rad\,s^{-1}}=\frac{\mathrm{m\,s^{-1}}}{\mathrm{m}}`
    )
  ],
  [
    "Both wheels move at 0.60 m/s and L = 0.40 m.",
    authoredExpression(
      "Both wheels move at 0.60 m/s and ",
      "L = 0.40 m",
      String.raw`L=0.40\,\mathrm{m}`,
      "."
    )
  ],
  [
    "v = 0.60 m/s, omega = 0 rad/s",
    authoredMathOnly(
      "v = 0.60 m/s, omega = 0 rad/s",
      String.raw`v=0.60\,\mathrm{m\,s^{-1}},\qquad\omega=0\,\mathrm{rad\,s^{-1}}`
    )
  ],
  [
    "vR = 0.50 m/s, vL = 0.10 m/s and L = 0.40 m.",
    authoredMathOnly(
      "vR = 0.50 m/s, vL = 0.10 m/s and L = 0.40 m.",
      String.raw`v_R=0.50\,\mathrm{m\,s^{-1}},\qquad v_L=0.10\,\mathrm{m\,s^{-1}},\qquad L=0.40\,\mathrm{m}`
    )
  ],
  [
    "Compute v = (0.50 + 0.10)/2.",
    authoredExpression(
      "Compute ",
      "v = (0.50 + 0.10)/2",
      String.raw`v=\frac{0.50+0.10}{2}`,
      "."
    )
  ],
  [
    "Compute omega = (0.50 - 0.10)/0.40.",
    authoredExpression(
      "Compute ",
      "omega = (0.50 - 0.10)/0.40",
      String.raw`\omega=\frac{0.50-0.10}{0.40}`,
      "."
    )
  ],
  [
    "v = 0.30 m/s, omega = 1.0 rad/s",
    authoredMathOnly(
      "v = 0.30 m/s, omega = 1.0 rad/s",
      String.raw`v=0.30\,\mathrm{m\,s^{-1}},\qquad\omega=1.0\,\mathrm{rad\,s^{-1}}`
    )
  ],
  [
    "Reconstruct vR = v + omega L/2 = 0.50 m/s and vL = v - omega L/2 = 0.10 m/s.",
    authoredMathOnly(
      "Reconstruct vR = v + omega L/2 = 0.50 m/s and vL = v - omega L/2 = 0.10 m/s.",
      String.raw`v_R=v+\frac{\omega L}{2}=0.50\,\mathrm{m\,s^{-1}},\qquad v_L=v-\frac{\omega L}{2}=0.10\,\mathrm{m\,s^{-1}}`
    )
  ],
  [
    "unit(xhat) = unit(x)",
    authoredMathOnly(
      "unit(xhat) = unit(x)",
      String.raw`\operatorname{unit}(\hat{x})=\operatorname{unit}(x)`
    )
  ],
  [
    "Compute weighted sum 3 x 2.0 + 1 x 2.4 = 8.4 m.",
    authoredExpression(
      "Compute weighted sum ",
      "3 x 2.0 + 1 x 2.4 = 8.4 m",
      String.raw`3(2.0\,\mathrm{m})+1(2.4\,\mathrm{m})=8.4\,\mathrm{m}`,
      "."
    )
  ],
  [
    "Sum weights 3 + 1 = 4.",
    authoredExpression("Sum weights ", "3 + 1 = 4", "3+1=4", ".")
  ],
  [
    "Divide 8.4 m by 4.",
    authoredExpression(
      "Divide ",
      "8.4 m by 4",
      String.raw`\frac{8.4\,\mathrm{m}}{4}`,
      "."
    )
  ],
  [
    "xhat = 2.1 m",
    authoredMathOnly("xhat = 2.1 m", String.raw`\hat{x}=2.1\,\mathrm{m}`)
  ],
  [
    "Compute weighted sum 10 + 14 = 24 deg.",
    authoredExpression(
      "Compute weighted sum ",
      "10 + 14 = 24 deg",
      String.raw`10^\circ+14^\circ=24^\circ`,
      "."
    )
  ],
  [
    "xhat = 12 deg",
    authoredMathOnly("xhat = 12 deg", String.raw`\hat{x}=12^\circ`)
  ],
  [
    "Use similar triangles: (u-cx)/fx = X/Z.",
    authoredExpression(
      "Use similar triangles: ",
      "(u-cx)/fx = X/Z",
      String.raw`\frac{u-c_x}{f_x}=\frac{X}{Z}`,
      "."
    )
  ],
  [
    "px = px (m/m) + px",
    authoredMathOnly(
      "px = px (m/m) + px",
      String.raw`\mathrm{px}=\mathrm{px}\left(\frac{\mathrm{m}}{\mathrm{m}}\right)+\mathrm{px}`
    )
  ],
  [
    "fx = 500 px, X = 0.20 m, Z = 2.0 m and cx = 320 px.",
    authoredMathOnly(
      "fx = 500 px, X = 0.20 m, Z = 2.0 m and cx = 320 px.",
      String.raw`f_x=500\,\mathrm{px},\quad X=0.20\,\mathrm{m},\quad Z=2.0\,\mathrm{m},\quad c_x=320\,\mathrm{px}`
    )
  ],
  [
    "Compute X/Z = 0.10.",
    authoredExpression(
      "Compute ",
      "X/Z = 0.10",
      String.raw`\frac{X}{Z}=0.10`,
      "."
    )
  ],
  [
    "u = 370 px",
    authoredMathOnly("u = 370 px", String.raw`u=370\,\mathrm{px}`)
  ],
  [
    "(370 - 320)/500 = 0.10 = X/Z.",
    authoredExpression(
      "",
      "(370 - 320)/500 = 0.10 = X/Z",
      String.raw`\frac{370-320}{500}=0.10=\frac{X}{Z}`,
      "."
    )
  ],
  [
    "fx = 600 px, u = 420 px, cx = 300 px and Z = 3.0 m. Find X.",
    authoredMathOnly(
      "fx = 600 px, u = 420 px, cx = 300 px and Z = 3.0 m. Find X.",
      String.raw`f_x=600\,\mathrm{px},\quad u=420\,\mathrm{px},\quad c_x=300\,\mathrm{px},\quad Z=3.0\,\mathrm{m};\qquad\text{find }X`
    )
  ],
  [
    "Rearrange X = (u-cx)Z/fx.",
    authoredExpression(
      "Rearrange ",
      "X = (u-cx)Z/fx",
      String.raw`X=\frac{(u-c_x)Z}{f_x}`,
      "."
    )
  ],
  [
    "Substitute 120 px x 3.0 m / 600 px.",
    authoredExpression(
      "Substitute ",
      "120 px x 3.0 m / 600 px",
      String.raw`\frac{\left(120\,\mathrm{px}\right)\left(3.0\,\mathrm{m}\right)}{600\,\mathrm{px}}`,
      "."
    )
  ],
  [
    "X = 0.60 m",
    authoredMathOnly("X = 0.60 m", String.raw`X=0.60\,\mathrm{m}`)
  ],
  [
    "600 px x 0.60/3.0 + 300 px = 420 px.",
    authoredExpression(
      "",
      "600 px x 0.60/3.0 + 300 px = 420 px",
      String.raw`\left(600\,\mathrm{px}\right)\frac{0.60}{3.0}+300\,\mathrm{px}=420\,\mathrm{px}`,
      "."
    )
  ],
  [
    "1 = count / count",
    authoredMathOnly(
      "1 = count / count",
      String.raw`1=\frac{\text{count}}{\text{count}}`
    )
  ],
  [
    "Compute predicted positives 18 + 2 = 20.",
    authoredExpression(
      "Compute predicted positives ",
      "18 + 2 = 20",
      "18+2=20",
      "."
    )
  ],
  [
    "Divide 18 by 20.",
    authoredExpression("Divide ", "18 by 20", String.raw`\frac{18}{20}`, ".")
  ],
  [
    "precision = 0.90 = 90 percent",
    authoredMathOnly(
      "precision = 0.90 = 90 percent",
      String.raw`\mathrm{precision}=0.90=90\,\%`
    )
  ],
  [
    "10 percent of 20 is 2 false positives, leaving 18 true positives.",
    authoredMathOnly(
      "10 percent of 20 is 2 false positives, leaving 18 true positives.",
      String.raw`0.10(20)=2,\qquad20-2=18`
    )
  ],
  [
    "Compute 45 + 15 = 60 predicted positives.",
    authoredExpression(
      "Compute ",
      "45 + 15 = 60",
      "45+15=60",
      " predicted positives."
    )
  ],
  [
    "Divide 45 by 60.",
    authoredExpression("Divide ", "45 by 60", String.raw`\frac{45}{60}`, ".")
  ],
  [
    "Convert 0.75 to a percentage.",
    authoredExpression(
      "Convert ",
      "0.75 to a percentage",
      String.raw`0.75=75\,\%`,
      "."
    )
  ],
  [
    "precision = 0.75 = 75 percent",
    authoredMathOnly(
      "precision = 0.75 = 75 percent",
      String.raw`\mathrm{precision}=0.75=75\,\%`
    )
  ],
  [
    "0.75 x 60 = 45 true positives.",
    authoredExpression(
      "",
      "0.75 x 60 = 45 true positives",
      String.raw`0.75(60)=45\ \text{true positives}`,
      "."
    )
  ],
  [
    "unit(u_c) = sqrt(unit(u_i)^2)",
    authoredMathOnly(
      "unit(u_c) = sqrt(unit(u_i)^2)",
      String.raw`\operatorname{unit}(u_c)=\sqrt{\operatorname{unit}(u_i)^2}`
    )
  ],
  [
    "u_c = sqrt(0.30^2 + 0.40^2) mm.",
    authoredExpression(
      "",
      "u_c = sqrt(0.30^2 + 0.40^2) mm",
      String.raw`u_c=\sqrt{0.30^2+0.40^2}\,\mathrm{mm}`,
      "."
    )
  ],
  [
    "Evaluate sqrt(0.25) mm.",
    authoredExpression(
      "Evaluate ",
      "sqrt(0.25) mm",
      String.raw`\sqrt{0.25}\,\mathrm{mm}`,
      "."
    )
  ],
  [
    "u_c = 0.50 mm",
    authoredMathOnly("u_c = 0.50 mm", String.raw`u_c=0.50\,\mathrm{mm}`)
  ],
  [
    "0.50^2 = 0.30^2 + 0.40^2 in square millimetres.",
    authoredExpression(
      "",
      "0.50^2 = 0.30^2 + 0.40^2",
      "0.50^2=0.30^2+0.40^2",
      " in square millimetres."
    )
  ],
  [
    "u_c = sqrt(0.60^2 + 0.80^2) K.",
    authoredExpression(
      "",
      "u_c = sqrt(0.60^2 + 0.80^2) K",
      String.raw`u_c=\sqrt{0.60^2+0.80^2}\,\mathrm{K}`,
      "."
    )
  ],
  [
    "Evaluate sqrt(1.00) K.",
    authoredExpression(
      "Evaluate ",
      "sqrt(1.00) K",
      String.raw`\sqrt{1.00}\,\mathrm{K}`,
      "."
    )
  ],
  [
    "u_c = 1.00 K",
    authoredMathOnly("u_c = 1.00 K", String.raw`u_c=1.00\,\mathrm{K}`)
  ],
  [
    "unit(S_x) = unit(y) / unit(x)",
    authoredMathOnly(
      "unit(S_x) = unit(y) / unit(x)",
      String.raw`\operatorname{unit}(S_x)=\frac{\operatorname{unit}(y)}{\operatorname{unit}(x)}`
    )
  ],
  [
    "Approximate partial sensitivity with Delta y divided by Delta x.",
    authoredMathOnly(
      "Approximate partial sensitivity with Delta y divided by Delta x.",
      String.raw`S_x\approx\frac{\Delta y}{\Delta x}`
    )
  ],
  [
    "S_p = 6 V / 3 kPa.",
    authoredExpression(
      "",
      "S_p = 6 V / 3 kPa",
      String.raw`S_p=\frac{6\,\mathrm{V}}{3\,\mathrm{kPa}}`,
      "."
    )
  ],
  [
    "S_p = 2 V/kPa",
    authoredMathOnly(
      "S_p = 2 V/kPa",
      String.raw`S_p=2\,\mathrm{V\,kPa^{-1}}`
    )
  ],
  [
    "2 V/kPa multiplied by 3 kPa returns the 6 V output change.",
    authoredMathOnly(
      "2 V/kPa multiplied by 3 kPa returns the 6 V output change.",
      String.raw`\left(2\,\mathrm{V\,kPa^{-1}}\right)\left(3\,\mathrm{kPa}\right)=6\,\mathrm{V}`
    )
  ],
  [
    "Hold other inputs fixed and form Delta T divided by Delta P.",
    authoredMathOnly(
      "Hold other inputs fixed and form Delta T divided by Delta P.",
      String.raw`S_P\approx\frac{\Delta T}{\Delta P}`
    )
  ],
  [
    "S_P = 8 K / 4 W.",
    authoredExpression(
      "",
      "S_P = 8 K / 4 W",
      String.raw`S_P=\frac{8\,\mathrm{K}}{4\,\mathrm{W}}`,
      "."
    )
  ],
  [
    "S_P = 2 K/W",
    authoredMathOnly("S_P = 2 K/W", String.raw`S_P=2\,\mathrm{K\,W^{-1}}`)
  ],
  [
    "2 K/W multiplied by 4 W returns the 8 K change.",
    authoredMathOnly(
      "2 K/W multiplied by 4 W returns the 8 K change.",
      String.raw`\left(2\,\mathrm{K\,W^{-1}}\right)\left(4\,\mathrm{W}\right)=8\,\mathrm{K}`
    )
  ],
  [
    "Write tau dy/dt + y = K u0 for a constant step.",
    authoredExpression(
      "Write ",
      "tau dy/dt + y = K u0",
      String.raw`\tau\frac{\mathrm{d}y}{\mathrm{d}t}+y=K u_0`,
      " for a constant step."
    )
  ],
  [
    "Apply y(0) = 0 to obtain the exponential response.",
    authoredExpression(
      "Apply ",
      "y(0) = 0",
      "y(0)=0",
      " to obtain the exponential response."
    )
  ],
  [
    "output unit = output unit x dimensionless exponential",
    authoredMathOnly(
      "output unit = output unit x dimensionless exponential",
      String.raw`\operatorname{unit}(y)=\operatorname{unit}(K u_0)\left(1-e^{-t/\tau}\right)`
    )
  ],
  [
    "A first-order sensor has K u0 = 10 V and tau = 2 s. Find y at t = 2 s.",
    [
      authoredText("A first-order sensor has "),
      authoredMath("K u0 = 10 V", String.raw`K u_0=10\,\mathrm{V}`, "K u nought equals ten volts", false),
      authoredText(" and "),
      authoredMath("tau = 2 s", String.raw`\tau=2\,\mathrm{s}`, "tau equals two seconds", false),
      authoredText(". Find y at "),
      authoredMath("t = 2 s", String.raw`t=2\,\mathrm{s}`, "t equals two seconds", false),
      authoredText(".")
    ]
  ],
  [
    "y = 10(1 - exp(-2/2)) V.",
    authoredExpression(
      "",
      "y = 10(1 - exp(-2/2)) V",
      String.raw`y=10\left(1-e^{-2/2}\right)\,\mathrm{V}`,
      "."
    )
  ],
  [
    "Use exp(-1) = 0.3679.",
    authoredExpression(
      "Use ",
      "exp(-1) = 0.3679",
      String.raw`e^{-1}=0.3679`,
      "."
    )
  ],
  [
    "y = 6.321 V",
    authoredMathOnly("y = 6.321 V", String.raw`y=6.321\,\mathrm{V}`)
  ],
  [
    "At one time constant the output is 63.21 percent of its final value.",
    authoredMathOnly(
      "At one time constant the output is 63.21 percent of its final value.",
      String.raw`1-e^{-1}=0.6321=63.21\,\%`
    )
  ],
  [
    "A thermal output has final value 20 K and tau = 5 s. Find y at t = 10 s.",
    [
      authoredText("A thermal output has final value 20 K and "),
      authoredMath("tau = 5 s", String.raw`\tau=5\,\mathrm{s}`, "tau equals five seconds", false),
      authoredText(". Find y at "),
      authoredMath("t = 10 s", String.raw`t=10\,\mathrm{s}`, "t equals ten seconds", false),
      authoredText(".")
    ]
  ],
  [
    "y = 20(1 - exp(-10/5)) K.",
    authoredExpression(
      "",
      "y = 20(1 - exp(-10/5)) K",
      String.raw`y=20\left(1-e^{-10/5}\right)\,\mathrm{K}`,
      "."
    )
  ],
  [
    "Use exp(-2) = 0.1353.",
    authoredExpression(
      "Use ",
      "exp(-2) = 0.1353",
      String.raw`e^{-2}=0.1353`,
      "."
    )
  ],
  [
    "y = 17.29 K",
    authoredMathOnly("y = 17.29 K", String.raw`y=17.29\,\mathrm{K}`)
  ],
  [
    "The remaining error, 2.71 K, is 13.53 percent of the final change.",
    authoredMathOnly(
      "The remaining error, 2.71 K, is 13.53 percent of the final change.",
      String.raw`\frac{2.71\,\mathrm{K}}{20\,\mathrm{K}}=0.1353=13.53\,\%`
    )
  ],
  [
    "unit(x_bar) = unit(x_i)",
    authoredMathOnly(
      "unit(x_bar) = unit(x_i)",
      String.raw`\operatorname{unit}(\bar{x})=\operatorname{unit}(x_i)`
    )
  ],
  [
    "x_bar = (2 + 4 + 6) V / 3.",
    authoredExpression(
      "",
      "x_bar = (2 + 4 + 6) V / 3",
      String.raw`\bar{x}=\frac{(2+4+6)\,\mathrm{V}}{3}`,
      "."
    )
  ],
  [
    "Divide 12 V by 3.",
    authoredExpression("Divide ", "12 V by 3", String.raw`\frac{12\,\mathrm{V}}{3}`, ".")
  ],
  [
    "x_bar = 4 V",
    authoredMathOnly("x_bar = 4 V", String.raw`\bar{x}=4\,\mathrm{V}`)
  ],
  [
    "Deviations from the mean, -2 V, 0 V and 2 V, sum to zero.",
    authoredMathOnly(
      "Deviations from the mean, -2 V, 0 V and 2 V, sum to zero.",
      String.raw`-2\,\mathrm{V}+0\,\mathrm{V}+2\,\mathrm{V}=0\,\mathrm{V}`
    )
  ],
  [
    "x_bar = (8 + 9 + 10 + 13) s / 4.",
    authoredExpression(
      "",
      "x_bar = (8 + 9 + 10 + 13) s / 4",
      String.raw`\bar{x}=\frac{(8+9+10+13)\,\mathrm{s}}{4}`,
      "."
    )
  ],
  [
    "Divide 40 s by 4.",
    authoredExpression("Divide ", "40 s by 4", String.raw`\frac{40\,\mathrm{s}}{4}`, ".")
  ],
  [
    "x_bar = 10 s",
    authoredMathOnly("x_bar = 10 s", String.raw`\bar{x}=10\,\mathrm{s}`)
  ],
  [
    "The four deviations -2, -1, 0 and 3 s sum to zero.",
    authoredMathOnly(
      "The four deviations -2, -1, 0 and 3 s sum to zero.",
      String.raw`-2\,\mathrm{s}-1\,\mathrm{s}+0\,\mathrm{s}+3\,\mathrm{s}=0\,\mathrm{s}`
    )
  ],
  [
    "Write the free-motion equation m x double-dot plus k x equals zero.",
    authoredMathOnly(
      "Write the free-motion equation m x double-dot plus k x equals zero.",
      String.raw`m\ddot{x}+kx=0`
    )
  ],
  [
    "Compare it with x double-dot plus omega_n squared x equals zero.",
    authoredMathOnly(
      "Compare it with x double-dot plus omega_n squared x equals zero.",
      String.raw`\ddot{x}+\omega_n^2x=0`
    )
  ],
  [
    "Use omega_n = sqrt(k/m) and f_n = omega_n/(2 pi).",
    authoredMathOnly(
      "Use omega_n = sqrt(k/m) and f_n = omega_n/(2 pi).",
      String.raw`\omega_n=\sqrt{\frac{k}{m}},\qquad f_n=\frac{\omega_n}{2\pi}`
    )
  ],
  [
    "Hz = sqrt((N/m)/kg) / (2 pi) = 1/s",
    authoredMathOnly(
      "Hz = sqrt((N/m)/kg) / (2 pi) = 1/s",
      String.raw`\mathrm{Hz}=\frac{\sqrt{\left(\mathrm{N\,m^{-1}}\right)/\mathrm{kg}}}{2\pi}=\mathrm{s^{-1}}`
    )
  ],
  [
    "A 1 kg mass is attached to a 100 N/m spring.",
    authoredMathOnly(
      "A 1 kg mass is attached to a 100 N/m spring.",
      String.raw`m=1\,\mathrm{kg},\qquad k=100\,\mathrm{N\,m^{-1}}`
    )
  ],
  [
    "A 4 kg mass is attached to a 400 N/m spring.",
    authoredMathOnly(
      "A 4 kg mass is attached to a 400 N/m spring.",
      String.raw`m=4\,\mathrm{kg},\qquad k=400\,\mathrm{N\,m^{-1}}`
    )
  ],
  [
    "f_n = sqrt(100/1)/(2 pi) Hz.",
    authoredExpression(
      "",
      "f_n = sqrt(100/1)/(2 pi) Hz",
      String.raw`f_n=\frac{\sqrt{100/1}}{2\pi}\,\mathrm{Hz}`,
      "."
    )
  ],
  [
    "Divide 10 rad/s by 2 pi.",
    authoredExpression(
      "Divide ",
      "10 rad/s by 2 pi",
      String.raw`\frac{10\,\mathrm{rad\,s^{-1}}}{2\pi}`,
      "."
    )
  ],
  [
    "f_n = 1.592 Hz",
    authoredMathOnly("f_n = 1.592 Hz", String.raw`f_n=1.592\,\mathrm{Hz}`)
  ],
  [
    "The corresponding period is 1/1.592 = 0.628 s.",
    authoredExpression(
      "The corresponding period is ",
      "1/1.592 = 0.628 s",
      String.raw`\frac{1}{1.592\,\mathrm{Hz}}=0.628\,\mathrm{s}`,
      "."
    )
  ],
  [
    "f_n = sqrt(400/4)/(2 pi) Hz.",
    authoredExpression(
      "",
      "f_n = sqrt(400/4)/(2 pi) Hz",
      String.raw`f_n=\frac{\sqrt{400/4}}{2\pi}\,\mathrm{Hz}`,
      "."
    )
  ],
  [
    "Again sqrt(100) = 10 rad/s.",
    authoredExpression(
      "Again ",
      "sqrt(100) = 10 rad/s",
      String.raw`\sqrt{100}=10\,\mathrm{rad\,s^{-1}}`,
      "."
    )
  ],
  [
    "Electric-field magnitude from q1 is k_e |q1|/r squared.",
    authoredMathOnly(
      "Electric-field magnitude from q1 is k_e |q1|/r squared.",
      String.raw`E_1=k_e\frac{\lvert q_1\rvert}{r^2}`
    )
  ],
  [
    "Force on q2 is |q2| times field magnitude.",
    authoredMathOnly(
      "Force on q2 is |q2| times field magnitude.",
      String.raw`F=\lvert q_2\rvert E_1`
    )
  ],
  [
    "N = (N m^2/C^2)(C^2)/m^2",
    authoredMathOnly(
      "N = (N m^2/C^2)(C^2)/m^2",
      String.raw`\mathrm{N}=\left(\frac{\mathrm{N\,m^2}}{\mathrm{C^2}}\right)\frac{\mathrm{C^2}}{\mathrm{m^2}}`
    )
  ],
  [
    "F = (8.9875e9 x 1e-6 x 1e-6 / 0.10^2) N.",
    authoredExpression(
      "",
      "F = (8.9875e9 x 1e-6 x 1e-6 / 0.10^2) N",
      String.raw`F=\frac{\left(8.9875\times10^9\,\mathrm{N\,m^2\,C^{-2}}\right)\left(1\times10^{-6}\,\mathrm{C}\right)\left(1\times10^{-6}\,\mathrm{C}\right)}{\left(0.10\,\mathrm{m}\right)^2}`,
      "."
    )
  ],
  [
    "F = 0.8988 N",
    authoredMathOnly("F = 0.8988 N", String.raw`F=0.8988\,\mathrm{N}`)
  ],
  [
    "F = (8.9875e9 x 2e-6 x 1e-6 / 0.20^2) N.",
    authoredExpression(
      "",
      "F = (8.9875e9 x 2e-6 x 1e-6 / 0.20^2) N",
      String.raw`F=\frac{\left(8.9875\times10^9\,\mathrm{N\,m^2\,C^{-2}}\right)\left(2\times10^{-6}\,\mathrm{C}\right)\left(1\times10^{-6}\,\mathrm{C}\right)}{\left(0.20\,\mathrm{m}\right)^2}`,
      "."
    )
  ],
  [
    "F = 0.4494 N",
    authoredMathOnly("F = 0.4494 N", String.raw`F=0.4494\,\mathrm{N}`)
  ],
  [
    "Start from Fourier heat flux q double-dot = -k dT/dx.",
    authoredMathOnly(
      "Start from Fourier heat flux q double-dot = -k dT/dx.",
      String.raw`\ddot{q}=-k\frac{\mathrm{d}T}{\mathrm{d}x}`
    )
  ],
  [
    "Use a linear temperature gradient Delta T/L.",
    authoredExpression(
      "Use a linear temperature gradient ",
      "Delta T/L",
      String.raw`\frac{\Delta T}{L}`,
      "."
    )
  ],
  [
    "W = (W/(m K)) m^2 K / m",
    authoredMathOnly(
      "W = (W/(m K)) m^2 K / m",
      String.raw`\mathrm{W}=\left(\frac{\mathrm{W}}{\mathrm{m\,K}}\right)\frac{\mathrm{m^2\,K}}{\mathrm{m}}`
    )
  ],
  [
    "A plate has k = 200 W/(m K), A = 0.001 m^2, Delta T = 10 K and L = 0.01 m.",
    authoredMathOnly(
      "A plate has k = 200 W/(m K), A = 0.001 m^2, Delta T = 10 K and L = 0.01 m.",
      String.raw`k=200\,\mathrm{W\,m^{-1}\,K^{-1}},\quad A=0.001\,\mathrm{m^2},\quad\Delta T=10\,\mathrm{K},\quad L=0.01\,\mathrm{m}`
    )
  ],
  [
    "Q_dot = (200 x 0.001 x 10 / 0.01) W.",
    authoredExpression(
      "",
      "Q_dot = (200 x 0.001 x 10 / 0.01) W",
      String.raw`\dot{Q}=\frac{200(0.001)(10)}{0.01}\,\mathrm{W}`,
      "."
    )
  ],
  [
    "Q_dot = 200 W",
    authoredMathOnly("Q_dot = 200 W", String.raw`\dot{Q}=200\,\mathrm{W}`)
  ],
  [
    "Thermal resistance L/(kA) is 0.05 K/W, and 10 K / 0.05 K/W = 200 W.",
    authoredMathOnly(
      "Thermal resistance L/(kA) is 0.05 K/W, and 10 K / 0.05 K/W = 200 W.",
      String.raw`R_{\mathrm{th}}=\frac{L}{kA}=0.05\,\mathrm{K\,W^{-1}},\qquad\frac{10\,\mathrm{K}}{0.05\,\mathrm{K\,W^{-1}}}=200\,\mathrm{W}`
    )
  ],
  [
    "An insulator has k = 0.04 W/(m K), A = 2 m^2, Delta T = 20 K and L = 0.10 m.",
    authoredMathOnly(
      "An insulator has k = 0.04 W/(m K), A = 2 m^2, Delta T = 20 K and L = 0.10 m.",
      String.raw`k=0.04\,\mathrm{W\,m^{-1}\,K^{-1}},\quad A=2\,\mathrm{m^2},\quad\Delta T=20\,\mathrm{K},\quad L=0.10\,\mathrm{m}`
    )
  ],
  [
    "Q_dot = (0.04 x 2 x 20 / 0.10) W.",
    authoredExpression(
      "",
      "Q_dot = (0.04 x 2 x 20 / 0.10) W",
      String.raw`\dot{Q}=\frac{0.04(2)(20)}{0.10}\,\mathrm{W}`,
      "."
    )
  ],
  [
    "Q_dot = 16 W",
    authoredMathOnly("Q_dot = 16 W", String.raw`\dot{Q}=16\,\mathrm{W}`)
  ],
  [
    "Thermal resistance is 1.25 K/W, so 20 K / 1.25 K/W = 16 W.",
    authoredMathOnly(
      "Thermal resistance is 1.25 K/W, so 20 K / 1.25 K/W = 16 W.",
      String.raw`R_{\mathrm{th}}=1.25\,\mathrm{K\,W^{-1}},\qquad\frac{20\,\mathrm{K}}{1.25\,\mathrm{K\,W^{-1}}}=16\,\mathrm{W}`
    )
  ],
  [
    "Integrate to obtain F = kx.",
    authoredExpression("Integrate to obtain ", "F = kx", "F=kx", ".")
  ],
  [
    "N = (N/m) m",
    authoredMathOnly(
      "N = (N/m) m",
      String.raw`\mathrm{N}=\left(\mathrm{N\,m^{-1}}\right)\mathrm{m}`
    )
  ],
  [
    "A 500 N/m spring is compressed by 0.020 m.",
    authoredMathOnly(
      "A 500 N/m spring is compressed by 0.020 m.",
      String.raw`k=500\,\mathrm{N\,m^{-1}},\qquad x=0.020\,\mathrm{m}`
    )
  ],
  [
    "F = (500 x 0.020) N.",
    authoredExpression(
      "",
      "F = (500 x 0.020) N",
      String.raw`F=\left(500\,\mathrm{N\,m^{-1}}\right)\left(0.020\,\mathrm{m}\right)`,
      "."
    )
  ],
  [
    "F = 10 N",
    authoredMathOnly("F = 10 N", String.raw`F=10\,\mathrm{N}`)
  ],
  [
    "10 N divided by 500 N/m returns 0.020 m.",
    authoredMathOnly(
      "10 N divided by 500 N/m returns 0.020 m.",
      String.raw`\frac{10\,\mathrm{N}}{500\,\mathrm{N\,m^{-1}}}=0.020\,\mathrm{m}`
    )
  ],
  [
    "k = 30 N / 0.050 m.",
    authoredExpression(
      "",
      "k = 30 N / 0.050 m",
      String.raw`k=\frac{30\,\mathrm{N}}{0.050\,\mathrm{m}}`,
      "."
    )
  ],
  [
    "k = 600 N/m",
    authoredMathOnly("k = 600 N/m", String.raw`k=600\,\mathrm{N\,m^{-1}}`)
  ],
  [
    "600 N/m multiplied by 0.050 m returns 30 N.",
    authoredMathOnly(
      "600 N/m multiplied by 0.050 m returns 30 N.",
      String.raw`\left(600\,\mathrm{N\,m^{-1}}\right)\left(0.050\,\mathrm{m}\right)=30\,\mathrm{N}`
    )
  ],
  [
    "One revolution travels circumference pi D.",
    authoredMathOnly("One revolution travels circumference pi D.", String.raw`C=\pi D`)
  ],
  [
    "n revolutions per minute travel pi D n metres per minute.",
    authoredMathOnly(
      "n revolutions per minute travel pi D n metres per minute.",
      String.raw`v_c=\pi Dn\ \mathrm{m\,min^{-1}}`
    )
  ],
  [
    "m/s = m rev/min x min/(60 s), with revolution dimensionless",
    authoredMathOnly(
      "m/s = m rev/min x min/(60 s), with revolution dimensionless",
      String.raw`\mathrm{m\,s^{-1}}=\mathrm{m\,rev\,min^{-1}}\frac{\mathrm{min}}{60\,\mathrm{s}},\qquad[\mathrm{rev}]=1`
    )
  ],
  [
    "A 20 mm diameter part turns at 1200 rev/min.",
    authoredMathOnly(
      "A 20 mm diameter part turns at 1200 rev/min.",
      String.raw`D=20\,\mathrm{mm},\qquad n=1200\,\mathrm{rev\,min^{-1}}`
    )
  ],
  [
    "A 50 mm cutter turns at 600 rev/min.",
    authoredMathOnly(
      "A 50 mm cutter turns at 600 rev/min.",
      String.raw`D=50\,\mathrm{mm},\qquad n=600\,\mathrm{rev\,min^{-1}}`
    )
  ],
  [
    "v_c = (pi x 0.020 x 1200 / 60) m/s.",
    authoredExpression(
      "",
      "v_c = (pi x 0.020 x 1200 / 60) m/s",
      String.raw`v_c=\frac{\pi\left(0.020\,\mathrm{m}\right)\left(1200\,\mathrm{rev\,min^{-1}}\right)}{60\,\mathrm{s\,min^{-1}}}`,
      "."
    )
  ],
  [
    "v_c = 1.257 m/s",
    authoredMathOnly("v_c = 1.257 m/s", String.raw`v_c=1.257\,\mathrm{m\,s^{-1}}`)
  ],
  [
    "This equals 75.40 m/min, and 75.40/60 = 1.257 m/s.",
    authoredMathOnly(
      "This equals 75.40 m/min, and 75.40/60 = 1.257 m/s.",
      String.raw`75.40\,\mathrm{m\,min^{-1}}\frac{1\,\mathrm{min}}{60\,\mathrm{s}}=1.257\,\mathrm{m\,s^{-1}}`
    )
  ],
  [
    "v_c = (pi x 0.050 x 600 / 60) m/s.",
    authoredExpression(
      "",
      "v_c = (pi x 0.050 x 600 / 60) m/s",
      String.raw`v_c=\frac{\pi\left(0.050\,\mathrm{m}\right)\left(600\,\mathrm{rev\,min^{-1}}\right)}{60\,\mathrm{s\,min^{-1}}}`,
      "."
    )
  ],
  [
    "v_c = 1.571 m/s",
    authoredMathOnly("v_c = 1.571 m/s", String.raw`v_c=1.571\,\mathrm{m\,s^{-1}}`)
  ],
  [
    "The cutter travels pi x 0.05 = 0.1571 m per revolution and 10 revolutions per second.",
    authoredMathOnly(
      "The cutter travels pi x 0.05 = 0.1571 m per revolution and 10 revolutions per second.",
      String.raw`\pi\left(0.05\,\mathrm{m}\right)=0.1571\,\mathrm{m\,rev^{-1}},\qquad600\,\mathrm{rev\,min^{-1}}=10\,\mathrm{rev\,s^{-1}}`
    )
  ],
  [
    "The RC time constant is tau = RC.",
    authoredExpression(
      "The RC time constant is ",
      "tau = RC",
      String.raw`\tau=RC`,
      "."
    )
  ],
  [
    "At cutoff, angular frequency omega_c tau = 1.",
    authoredExpression(
      "At cutoff, angular frequency ",
      "omega_c tau = 1",
      String.raw`\omega_c\tau=1`,
      "."
    )
  ],
  [
    "Use omega_c = 2 pi f_c and rearrange.",
    authoredExpression(
      "Use ",
      "omega_c = 2 pi f_c",
      String.raw`\omega_c=2\pi f_c`,
      " and rearrange."
    )
  ],
  [
    "Hz = 1/(ohm F) = 1/s",
    authoredMathOnly(
      "Hz = 1/(ohm F) = 1/s",
      String.raw`\mathrm{Hz}=\frac{1}{\Omega\,\mathrm{F}}=\mathrm{s^{-1}}`
    )
  ],
  [
    "R = 1.0 kohm and C = 1.0 microfarad.",
    [
      authoredMath("R = 1.0 kohm", String.raw`R=1.0\,\mathrm{k\Omega}`, "R equals one point zero kiloohms", false),
      authoredText(" and "),
      authoredMath("C = 1.0 microfarad", String.raw`C=1.0\,\mathrm{\mu F}`, "C equals one point zero microfarads", false),
      authoredText(".")
    ]
  ],
  [
    "f_c = 1/(2 pi x 1000 x 1e-6) Hz.",
    authoredExpression(
      "",
      "f_c = 1/(2 pi x 1000 x 1e-6) Hz",
      String.raw`f_c=\frac{1}{2\pi\left(1000\,\Omega\right)\left(1\times10^{-6}\,\mathrm{F}\right)}`,
      "."
    )
  ],
  [
    "f_c = 159.15 Hz",
    authoredMathOnly("f_c = 159.15 Hz", String.raw`f_c=159.15\,\mathrm{Hz}`)
  ],
  [
    "The time constant is 1 ms and 1/(2 pi x 0.001 s) = 159.15 Hz.",
    authoredMathOnly(
      "The time constant is 1 ms and 1/(2 pi x 0.001 s) = 159.15 Hz.",
      String.raw`\tau=1\,\mathrm{ms},\qquad\frac{1}{2\pi\left(0.001\,\mathrm{s}\right)}=159.15\,\mathrm{Hz}`
    )
  ],
  [
    "R = 10 kohm and C = 100 nF.",
    [
      authoredMath("R = 10 kohm", String.raw`R=10\,\mathrm{k\Omega}`, "R equals ten kiloohms", false),
      authoredText(" and "),
      authoredMath("C = 100 nF", String.raw`C=100\,\mathrm{nF}`, "C equals one hundred nanofarads", false),
      authoredText(".")
    ]
  ],
  [
    "f_c = 1/(2 pi x 10000 x 100e-9) Hz.",
    authoredExpression(
      "",
      "f_c = 1/(2 pi x 10000 x 100e-9) Hz",
      String.raw`f_c=\frac{1}{2\pi\left(10000\,\Omega\right)\left(100\times10^{-9}\,\mathrm{F}\right)}`,
      "."
    )
  ],
  [
    "Both component pairs have RC = 0.001 s, so their ideal cutoff is equal.",
    authoredExpression(
      "Both component pairs have ",
      "RC = 0.001 s",
      String.raw`RC=0.001\,\mathrm{s}`,
      ", so their ideal cutoff is equal."
    )
  ],
  [
    "An N-bit code has 2 to the N distinct levels.",
    authoredMathOnly(
      "An N-bit code has 2 to the N distinct levels.",
      String.raw`N\text{-bit code}\longrightarrow2^N\text{ levels}`
    )
  ],
  [
    "V = V / dimensionless count",
    authoredMathOnly(
      "V = V / dimensionless count",
      String.raw`\mathrm{V}=\frac{\mathrm{V}}{\text{dimensionless count}}`
    )
  ],
  [
    "Delta V = (3.3 V)/(4096 levels).",
    authoredExpression(
      "",
      "Delta V = (3.3 V)/(4096 levels)",
      String.raw`\Delta V=\frac{3.3\,\mathrm{V}}{4096\ \text{levels}}`,
      "."
    )
  ],
  [
    "Delta V = 0.0008057 V = 0.8057 mV",
    authoredMathOnly(
      "Delta V = 0.0008057 V = 0.8057 mV",
      String.raw`\Delta V=0.0008057\,\mathrm{V}=0.8057\,\mathrm{mV}`
    )
  ],
  [
    "0.8057 mV multiplied by 4096 is approximately 3.3 V.",
    authoredMathOnly(
      "0.8057 mV multiplied by 4096 is approximately 3.3 V.",
      String.raw`\left(0.8057\,\mathrm{mV}\right)(4096)\approx3.3\,\mathrm{V}`
    )
  ],
  [
    "Delta V = (5.0 V)/(256 levels).",
    authoredExpression(
      "",
      "Delta V = (5.0 V)/(256 levels)",
      String.raw`\Delta V=\frac{5.0\,\mathrm{V}}{256\ \text{levels}}`,
      "."
    )
  ],
  [
    "Delta V = 0.01953 V",
    authoredMathOnly("Delta V = 0.01953 V", String.raw`\Delta V=0.01953\,\mathrm{V}`)
  ],
  [
    "0.01953 V multiplied by 256 is approximately 5.0 V.",
    authoredMathOnly(
      "0.01953 V multiplied by 256 is approximately 5.0 V.",
      String.raw`\left(0.01953\,\mathrm{V}\right)(256)\approx5.0\,\mathrm{V}`
    )
  ],
  [
    "1 = s/s",
    authoredMathOnly("1 = s/s", String.raw`1=\frac{\mathrm{s}}{\mathrm{s}}`)
  ],
  [
    "D = 2 ms / 10 ms.",
    authoredExpression(
      "",
      "D = 2 ms / 10 ms",
      String.raw`D=\frac{2\,\mathrm{ms}}{10\,\mathrm{ms}}`,
      "."
    )
  ],
  [
    "D = 0.20 = 20 percent",
    authoredMathOnly("D = 0.20 = 20 percent", String.raw`D=0.20=20\,\%`)
  ],
  [
    "A 20 percent duty uses 2 ms of each 10 ms cycle.",
    authoredMathOnly(
      "A 20 percent duty uses 2 ms of each 10 ms cycle.",
      String.raw`0.20\left(10\,\mathrm{ms}\right)=2\,\mathrm{ms}`
    )
  ],
  [
    "First find period T = 1/f = 1 ms.",
    authoredExpression(
      "First find period ",
      "T = 1/f = 1 ms",
      String.raw`T=\frac{1}{f}=1\,\mathrm{ms}`,
      "."
    )
  ],
  [
    "D = 0.75 ms / 1.00 ms.",
    authoredExpression(
      "",
      "D = 0.75 ms / 1.00 ms",
      String.raw`D=\frac{0.75\,\mathrm{ms}}{1.00\,\mathrm{ms}}`,
      "."
    )
  ],
  [
    "D = 0.75 = 75 percent",
    authoredMathOnly("D = 0.75 = 75 percent", String.raw`D=0.75=75\,\%`)
  ],
  [
    "The low interval is the remaining 0.25 ms.",
    authoredMathOnly(
      "The low interval is the remaining 0.25 ms.",
      String.raw`t_{\mathrm{off}}=1.00\,\mathrm{ms}-0.75\,\mathrm{ms}=0.25\,\mathrm{ms}`
    )
  ],
  [
    "unit(X_k) = unit(x_n)",
    authoredMathOnly(
      "unit(X_k) = unit(x_n)",
      String.raw`\operatorname{unit}(X_k)=\operatorname{unit}(x_n)`
    )
  ],
  [
    "At k = 0 every complex weight equals one.",
    authoredExpression(
      "At ",
      "k = 0",
      "k=0",
      " every complex weight equals one."
    )
  ],
  [
    "X0 = 1 + 2 + 1 + 0 V.",
    authoredExpression(
      "",
      "X0 = 1 + 2 + 1 + 0 V",
      String.raw`X_0=(1+2+1+0)\,\mathrm{V}`,
      "."
    )
  ],
  [
    "X0 = 4 V",
    authoredMathOnly("X0 = 4 V", String.raw`X_0=4\,\mathrm{V}`)
  ],
  [
    "The sample mean is X0/N = 4/4 = 1 V.",
    authoredExpression(
      "The sample mean is ",
      "X0/N = 4/4 = 1 V",
      String.raw`\frac{X_0}{N}=\frac{4}{4}=1\,\mathrm{V}`,
      "."
    )
  ],
  [
    "X0 = 2 + 2 + 2 + 2 V.",
    authoredExpression(
      "",
      "X0 = 2 + 2 + 2 + 2 V",
      String.raw`X_0=(2+2+2+2)\,\mathrm{V}`,
      "."
    )
  ],
  [
    "X0 = 8 V",
    authoredMathOnly("X0 = 8 V", String.raw`X_0=8\,\mathrm{V}`)
  ],
  [
    "state unit/s = (1/s)(state unit) + (state unit/(input unit s))(input unit)",
    authoredMathOnly(
      "state unit/s = (1/s)(state unit) + (state unit/(input unit s))(input unit)",
      String.raw`\frac{\text{state unit}}{\mathrm{s}}=\left(\frac{1}{\mathrm{s}}\right)(\text{state unit})+\left(\frac{\text{state unit}}{\text{input unit}\,\mathrm{s}}\right)(\text{input unit})`
    )
  ],
  [
    "A scalar model has x_dot = -2x + 3u with x = 1 and u = 2.",
    authoredMathOnly(
      "A scalar model has x_dot = -2x + 3u with x = 1 and u = 2.",
      String.raw`\dot{x}=-2x+3u,\qquad x=1,\qquad u=2`
    )
  ],
  [
    "x_dot = -2(1) + 3(2).",
    authoredExpression(
      "",
      "x_dot = -2(1) + 3(2)",
      String.raw`\dot{x}=-2(1)+3(2)`,
      "."
    )
  ],
  [
    "Add -2 and 6.",
    authoredExpression("Add ", "-2 and 6", "-2+6", ".")
  ],
  [
    "x_dot = 4 per second",
    authoredMathOnly("x_dot = 4 per second", String.raw`\dot{x}=4\,\mathrm{s^{-1}}`)
  ],
  [
    "A forward step of 0.01 s predicts x increasing by about 0.04.",
    authoredMathOnly(
      "A forward step of 0.01 s predicts x increasing by about 0.04.",
      String.raw`\Delta x\approx\dot{x}\Delta t=\left(4\,\mathrm{s^{-1}}\right)\left(0.01\,\mathrm{s}\right)=0.04`
    )
  ],
  [
    "A scalar model has x_dot = -x + 2u with x = 4 and u = 1.",
    authoredMathOnly(
      "A scalar model has x_dot = -x + 2u with x = 4 and u = 1.",
      String.raw`\dot{x}=-x+2u,\qquad x=4,\qquad u=1`
    )
  ],
  [
    "x_dot = -4 + 2(1).",
    authoredExpression("", "x_dot = -4 + 2(1)", String.raw`\dot{x}=-4+2(1)`, ".")
  ],
  [
    "x_dot = -2 per second",
    authoredMathOnly("x_dot = -2 per second", String.raw`\dot{x}=-2\,\mathrm{s^{-1}}`)
  ],
  [
    "m = m x dimensionless - m x dimensionless",
    authoredMathOnly(
      "m = m x dimensionless - m x dimensionless",
      String.raw`\mathrm{m}=\mathrm{m}\cdot1-\mathrm{m}\cdot1`
    )
  ],
  [
    "Rotate point x = 2 m, y = 0 m by 60 degrees.",
    authoredMathOnly(
      "Rotate point x = 2 m, y = 0 m by 60 degrees.",
      String.raw`(x,y)=\left(2\,\mathrm{m},0\,\mathrm{m}\right),\qquad\theta=60^\circ`
    )
  ],
  [
    "Use x prime = x cos theta - y sin theta.",
    authoredExpression(
      "Use ",
      "x prime = x cos theta - y sin theta",
      String.raw`x'=x\cos\theta-y\sin\theta`,
      "."
    )
  ],
  [
    "x prime = 2 cos 60 degrees - 0 sin 60 degrees.",
    authoredExpression(
      "",
      "x prime = 2 cos 60 degrees - 0 sin 60 degrees",
      String.raw`x'=\left(2\,\mathrm{m}\right)\cos60^\circ-\left(0\,\mathrm{m}\right)\sin60^\circ`,
      "."
    )
  ],
  [
    "Use cos 60 degrees = 0.5.",
    authoredExpression("Use ", "cos 60 degrees = 0.5", String.raw`\cos60^\circ=0.5`, ".")
  ],
  [
    "x prime = 1 m",
    authoredMathOnly("x prime = 1 m", String.raw`x'=1\,\mathrm{m}`)
  ],
  [
    "The full rotated point is (1, sqrt(3)) m and keeps its original 2 m magnitude.",
    authoredMathOnly(
      "The full rotated point is (1, sqrt(3)) m and keeps its original 2 m magnitude.",
      String.raw`\mathbf{p}'=\begin{bmatrix}1\\\sqrt{3}\end{bmatrix}\mathrm{m},\qquad\lVert\mathbf{p}'\rVert=2\,\mathrm{m}`
    )
  ],
  [
    "Rotate point x = 0 m, y = 3 m by 90 degrees.",
    authoredMathOnly(
      "Rotate point x = 0 m, y = 3 m by 90 degrees.",
      String.raw`(x,y)=\left(0\,\mathrm{m},3\,\mathrm{m}\right),\qquad\theta=90^\circ`
    )
  ],
  [
    "x prime = 0 cos 90 degrees - 3 sin 90 degrees.",
    authoredExpression(
      "",
      "x prime = 0 cos 90 degrees - 3 sin 90 degrees",
      String.raw`x'=\left(0\,\mathrm{m}\right)\cos90^\circ-\left(3\,\mathrm{m}\right)\sin90^\circ`,
      "."
    )
  ],
  [
    "Use sin 90 degrees = 1.",
    authoredExpression("Use ", "sin 90 degrees = 1", String.raw`\sin90^\circ=1`, ".")
  ],
  [
    "x prime = -3 m",
    authoredMathOnly("x prime = -3 m", String.raw`x'=-3\,\mathrm{m}`)
  ],
  [
    "The full point becomes (-3, 0) m and preserves the 3 m magnitude.",
    authoredMathOnly(
      "The full point becomes (-3, 0) m and preserves the 3 m magnitude.",
      String.raw`\mathbf{p}'=\begin{bmatrix}-3\\0\end{bmatrix}\mathrm{m},\qquad\lVert\mathbf{p}'\rVert=3\,\mathrm{m}`
    )
  ],
  [
    "m/s = (m/rad)(rad/s)",
    authoredMathOnly(
      "m/s = (m/rad)(rad/s)",
      String.raw`\mathrm{m\,s^{-1}}=\left(\mathrm{m\,rad^{-1}}\right)\left(\mathrm{rad\,s^{-1}}\right)`
    )
  ],
  [
    "A scalar Jacobian is 0.5 m/rad and joint rate is 2 rad/s.",
    authoredMathOnly(
      "A scalar Jacobian is 0.5 m/rad and joint rate is 2 rad/s.",
      String.raw`J=0.5\,\mathrm{m\,rad^{-1}},\qquad\dot{q}=2\,\mathrm{rad\,s^{-1}}`
    )
  ],
  [
    "v = (0.5 x 2) m/s.",
    authoredExpression(
      "",
      "v = (0.5 x 2) m/s",
      String.raw`v=\left(0.5\,\mathrm{m\,rad^{-1}}\right)\left(2\,\mathrm{rad\,s^{-1}}\right)`,
      "."
    )
  ],
  [
    "v = 1.0 m/s",
    authoredMathOnly("v = 1.0 m/s", String.raw`v=1.0\,\mathrm{m\,s^{-1}}`)
  ],
  [
    "1.0 m/s divided by 2 rad/s returns the 0.5 m/rad local motion ratio.",
    authoredMathOnly(
      "1.0 m/s divided by 2 rad/s returns the 0.5 m/rad local motion ratio.",
      String.raw`\frac{1.0\,\mathrm{m\,s^{-1}}}{2\,\mathrm{rad\,s^{-1}}}=0.5\,\mathrm{m\,rad^{-1}}`
    )
  ],
  [
    "A scalar Jacobian is -0.2 m/rad and joint rate is 3 rad/s.",
    authoredMathOnly(
      "A scalar Jacobian is -0.2 m/rad and joint rate is 3 rad/s.",
      String.raw`J=-0.2\,\mathrm{m\,rad^{-1}},\qquad\dot{q}=3\,\mathrm{rad\,s^{-1}}`
    )
  ],
  [
    "v = (-0.2 x 3) m/s.",
    authoredExpression(
      "",
      "v = (-0.2 x 3) m/s",
      String.raw`v=\left(-0.2\,\mathrm{m\,rad^{-1}}\right)\left(3\,\mathrm{rad\,s^{-1}}\right)`,
      "."
    )
  ],
  [
    "v = -0.6 m/s",
    authoredMathOnly("v = -0.6 m/s", String.raw`v=-0.6\,\mathrm{m\,s^{-1}}`)
  ],
  [
    "Rotational kinetic energy is one half I omega squared.",
    authoredMathOnly(
      "Rotational kinetic energy is one half I omega squared.",
      String.raw`E_k=\frac{1}{2}I\omega^2`
    )
  ],
  [
    "A point mass moving at speed r omega has energy one half m r squared omega squared.",
    authoredMathOnly(
      "A point mass moving at speed r omega has energy one half m r squared omega squared.",
      String.raw`E_k=\frac{1}{2}m r^2\omega^2`
    )
  ],
  [
    "Equate coefficients of one half omega squared.",
    authoredMathOnly(
      "Equate coefficients of one half omega squared.",
      String.raw`\frac{1}{2}I\omega^2=\frac{1}{2}m r^2\omega^2`
    )
  ],
  [
    "kg m^2 = kg x m^2",
    authoredMathOnly(
      "kg m^2 = kg x m^2",
      String.raw`\mathrm{kg\,m^2}=\mathrm{kg}\times\mathrm{m^2}`
    )
  ],
  [
    "I = (2 x 0.30^2) kg m^2.",
    authoredExpression(
      "",
      "I = (2 x 0.30^2) kg m^2",
      String.raw`I=\left(2\,\mathrm{kg}\right)\left(0.30\,\mathrm{m}\right)^2`,
      "."
    )
  ],
  [
    "I = 0.18 kg m^2",
    authoredMathOnly("I = 0.18 kg m^2", String.raw`I=0.18\,\mathrm{kg\,m^2}`)
  ],
  [
    "Moving the mass to 0.60 m would quadruple inertia to 0.72 kg m^2.",
    authoredMathOnly(
      "Moving the mass to 0.60 m would quadruple inertia to 0.72 kg m^2.",
      String.raw`I'=I\left(\frac{0.60}{0.30}\right)^2=4I=0.72\,\mathrm{kg\,m^2}`
    )
  ],
  [
    "I = (0.5 x 0.20^2) kg m^2.",
    authoredExpression(
      "",
      "I = (0.5 x 0.20^2) kg m^2",
      String.raw`I=\left(0.5\,\mathrm{kg}\right)\left(0.20\,\mathrm{m}\right)^2`,
      "."
    )
  ],
  [
    "Evaluate 0.5 x 0.04.",
    authoredExpression("Evaluate ", "0.5 x 0.04", "0.5\\times0.04", ".")
  ],
  [
    "I = 0.020 kg m^2",
    authoredMathOnly("I = 0.020 kg m^2", String.raw`I=0.020\,\mathrm{kg\,m^2}`)
  ],
  [
    "I/m = 0.04 m^2, whose square root returns r = 0.20 m.",
    authoredMathOnly(
      "I/m = 0.04 m^2, whose square root returns r = 0.20 m.",
      String.raw`\frac{I}{m}=0.04\,\mathrm{m^2},\qquad r=\sqrt{\frac{I}{m}}=0.20\,\mathrm{m}`
    )
  ],
  [
    "Write joint probability P(E and H) as likelihood times prior.",
    authoredMathOnly(
      "Write joint probability P(E and H) as likelihood times prior.",
      String.raw`P(E\cap H)=P(E\mid H)P(H)`
    )
  ],
  [
    "Partition total evidence probability over H and not-H.",
    authoredMathOnly(
      "Partition total evidence probability over H and not-H.",
      String.raw`P(E)=P(E\mid H)P(H)+P(E\mid\neg H)P(\neg H)`
    )
  ],
  [
    "1 = (1 x 1)/(1 x 1 + 1 x 1)",
    authoredMathOnly(
      "1 = (1 x 1)/(1 x 1 + 1 x 1)",
      String.raw`1=\frac{1\times1}{1\times1+1\times1}`
    )
  ],
  [
    "Posterior = 0.90 x 0.20 / (0.90 x 0.20 + 0.10 x 0.80).",
    authoredExpression(
      "",
      "Posterior = 0.90 x 0.20 / (0.90 x 0.20 + 0.10 x 0.80)",
      String.raw`P(H\mid E)=\frac{0.90(0.20)}{0.90(0.20)+0.10(0.80)}`,
      "."
    )
  ],
  [
    "Divide 0.18 by 0.26.",
    authoredExpression("Divide ", "0.18 by 0.26", String.raw`\frac{0.18}{0.26}`, ".")
  ],
  [
    "P(fault|alarm) = 0.6923",
    authoredMathOnly(
      "P(fault|alarm) = 0.6923",
      String.raw`P(\mathrm{fault}\mid\mathrm{alarm})=0.6923`
    )
  ],
  [
    "In 1000 cases, expect 180 true alarms and 80 false alarms, so 180/260 = 0.6923.",
    authoredMathOnly(
      "In 1000 cases, expect 180 true alarms and 80 false alarms, so 180/260 = 0.6923.",
      String.raw`\frac{180}{180+80}=\frac{180}{260}=0.6923`
    )
  ],
  [
    "Posterior = 0.95 x 0.01 / (0.95 x 0.01 + 0.05 x 0.99).",
    authoredExpression(
      "",
      "Posterior = 0.95 x 0.01 / (0.95 x 0.01 + 0.05 x 0.99)",
      String.raw`P(H\mid E)=\frac{0.95(0.01)}{0.95(0.01)+0.05(0.99)}`,
      "."
    )
  ],
  [
    "Divide 0.0095 by 0.0590.",
    authoredExpression("Divide ", "0.0095 by 0.0590", String.raw`\frac{0.0095}{0.0590}`, ".")
  ],
  [
    "P(fault|alarm) = 0.1610",
    authoredMathOnly(
      "P(fault|alarm) = 0.1610",
      String.raw`P(\mathrm{fault}\mid\mathrm{alarm})=0.1610`
    )
  ],
  [
    "cost unit = cost unit + cost unit",
    authoredMathOnly(
      "cost unit = cost unit + cost unit",
      String.raw`\operatorname{unit}(f)=\operatorname{unit}(g)+\operatorname{unit}(h)`
    )
  ],
  [
    "Use f = g + h.",
    authoredExpression("Use ", "f = g + h", "f=g+h", ".")
  ],
  [
    "f = 12 m + 5 m.",
    authoredExpression(
      "",
      "f = 12 m + 5 m",
      String.raw`f=12\,\mathrm{m}+5\,\mathrm{m}`,
      "."
    )
  ],
  [
    "f = 17 m",
    authoredMathOnly("f = 17 m", String.raw`f=17\,\mathrm{m}`)
  ],
  [
    "Subtracting h = 5 m from f = 17 m returns g = 12 m.",
    authoredMathOnly(
      "Subtracting h = 5 m from f = 17 m returns g = 12 m.",
      String.raw`g=f-h=17\,\mathrm{m}-5\,\mathrm{m}=12\,\mathrm{m}`
    )
  ],
  [
    "f = 8 + 6.",
    authoredExpression("", "f = 8 + 6", "f=8+6", ".")
  ],
  [
    "f = 14",
    authoredMathOnly("f = 14", "f=14")
  ],
  [
    "1 = sum(1 x 1) + 1",
    authoredMathOnly(
      "1 = sum(1 x 1) + 1",
      String.raw`1=\sum_i(1\times1)+1`
    )
  ],
  [
    "z = 0.5 x 2 + 0.2 x 1 + 0.7.",
    authoredExpression(
      "",
      "z = 0.5 x 2 + 0.2 x 1 + 0.7",
      "z=0.5(2)+0.2(1)+0.7",
      "."
    )
  ],
  [
    "Add 1.0, 0.2 and 0.7.",
    authoredExpression("Add ", "1.0, 0.2 and 0.7", "1.0+0.2+0.7", ".")
  ],
  [
    "z = 1.9",
    authoredMathOnly("z = 1.9", "z=1.9")
  ],
  [
    "Removing the bias leaves the weighted-input contribution 1.2.",
    authoredMathOnly(
      "Removing the bias leaves the weighted-input contribution 1.2.",
      "1.9-0.7=1.2"
    )
  ],
  [
    "z = 3 x 1 + 0.5 x (-2) - 1.",
    authoredExpression(
      "",
      "z = 3 x 1 + 0.5 x (-2) - 1",
      "z=3(1)+0.5(-2)-1",
      "."
    )
  ],
  [
    "Add 3, -1 and -1.",
    authoredExpression("Add ", "3, -1 and -1", "3-1-1", ".")
  ],
  [
    "z = 1",
    authoredMathOnly("z = 1", "z=1")
  ],
  [
    "parameter unit = parameter unit - (parameter unit^2/loss unit)(loss unit/parameter unit)",
    authoredMathOnly(
      "parameter unit = parameter unit - (parameter unit^2/loss unit)(loss unit/parameter unit)",
      String.raw`\operatorname{unit}(\theta)=\operatorname{unit}(\theta)-\left(\frac{\operatorname{unit}(\theta)^2}{\operatorname{unit}(J)}\right)\left(\frac{\operatorname{unit}(J)}{\operatorname{unit}(\theta)}\right)`
    )
  ],
  [
    "theta_next = 4 - 0.1 x 6.",
    authoredExpression(
      "",
      "theta_next = 4 - 0.1 x 6",
      String.raw`\theta_{\mathrm{next}}=4-0.1(6)`,
      "."
    )
  ],
  [
    "theta_next = 3.4",
    authoredMathOnly("theta_next = 3.4", String.raw`\theta_{\mathrm{next}}=3.4`)
  ],
  [
    "theta_next = -1 - 0.05 x (-4).",
    authoredExpression(
      "",
      "theta_next = -1 - 0.05 x (-4)",
      String.raw`\theta_{\mathrm{next}}=-1-0.05(-4)`,
      "."
    )
  ],
  [
    "theta_next = -0.8",
    authoredMathOnly("theta_next = -0.8", String.raw`\theta_{\mathrm{next}}=-0.8`)
  ],
  [
    "1 = byte/byte",
    authoredMathOnly("1 = byte/byte", String.raw`1=\frac{\mathrm{byte}}{\mathrm{byte}}`)
  ],
  [
    "C = 20 MB / 5 MB.",
    authoredExpression(
      "",
      "C = 20 MB / 5 MB",
      String.raw`C=\frac{20\,\mathrm{MB}}{5\,\mathrm{MB}}`,
      "."
    )
  ],
  [
    "C = 4",
    authoredMathOnly("C = 4", "C=4")
  ],
  [
    "The compressed model occupies one quarter of the original size.",
    authoredMathOnly(
      "The compressed model occupies one quarter of the original size.",
      String.raw`\frac{S_{\mathrm{compressed}}}{S_{\mathrm{original}}}=\frac{1}{4}`
    )
  ],
  [
    "C = 120 MB / 80 MB.",
    authoredExpression(
      "",
      "C = 120 MB / 80 MB",
      String.raw`C=\frac{120\,\mathrm{MB}}{80\,\mathrm{MB}}`,
      "."
    )
  ],
  [
    "C = 1.5",
    authoredMathOnly("C = 1.5", "C=1.5")
  ],
  [
    "80 MB multiplied by 1.5 returns 120 MB.",
    authoredMathOnly(
      "80 MB multiplied by 1.5 returns 120 MB.",
      String.raw`\left(80\,\mathrm{MB}\right)(1.5)=120\,\mathrm{MB}`
    )
  ],
  [
    "1 = sum(1 x 1)",
    authoredMathOnly("1 = sum(1 x 1)", String.raw`1=\sum_i(1\times1)`)
  ],
  [
    "S = 0.6 x 8 + 0.4 x 6.",
    authoredExpression("", "S = 0.6 x 8 + 0.4 x 6", "S=0.6(8)+0.4(6)", ".")
  ],
  [
    "Add 4.8 and 2.4.",
    authoredExpression("Add ", "4.8 and 2.4", "4.8+2.4", ".")
  ],
  [
    "S = 7.2",
    authoredMathOnly("S = 7.2", "S=7.2")
  ],
  [
    "Because weights sum to one, the result lies between scores 6 and 8.",
    authoredMathOnly(
      "Because weights sum to one, the result lies between scores 6 and 8.",
      String.raw`0.6+0.4=1,\qquad6\leq7.2\leq8`
    )
  ],
  [
    "S = 0.2 x 4 + 0.3 x 7 + 0.5 x 9.",
    authoredExpression(
      "",
      "S = 0.2 x 4 + 0.3 x 7 + 0.5 x 9",
      "S=0.2(4)+0.3(7)+0.5(9)",
      "."
    )
  ],
  [
    "Add 0.8, 2.1 and 4.5.",
    authoredExpression("Add ", "0.8, 2.1 and 4.5", "0.8+2.1+4.5", ".")
  ],
  [
    "S = 7.4",
    authoredMathOnly("S = 7.4", "S=7.4")
  ],
  [
    "Contributions sum to the same 7.4 total.",
    authoredMathOnly("Contributions sum to the same 7.4 total.", "0.8+2.1+4.5=7.4")
  ],
  [
    "1 = 1 x 1",
    authoredMathOnly("1 = 1 x 1", "1=1\\times1")
  ],
  [
    "R = 3 x 4.",
    authoredExpression("", "R = 3 x 4", "R=3\\times4", ".")
  ],
  [
    "R = 12",
    authoredMathOnly("R = 12", "R=12")
  ],
  [
    "The score retains meaning only with likelihood 3 and consequence 4 recorded.",
    authoredMathOnly(
      "The score retains meaning only with likelihood 3 and consequence 4 recorded.",
      String.raw`R=L\times C=3\times4=12`
    )
  ],
  [
    "R = 2 x 5.",
    authoredExpression("", "R = 2 x 5", "R=2\\times5", ".")
  ],
  [
    "R = 10",
    authoredMathOnly("R = 10", "R=10")
  ],
  [
    "unit(z) = sqrt(unit(a)^2 + unit(b)^2)",
    authoredMathOnly(
      "unit(z) = sqrt(unit(a)^2 + unit(b)^2)",
      String.raw`\operatorname{unit}(z)=\sqrt{\operatorname{unit}(a)^2+\operatorname{unit}(b)^2}`
    )
  ],
  [
    "A phasor is z = 3 + j4 V.",
    authoredExpression(
      "A phasor is ",
      "z = 3 + j4 V",
      String.raw`z=(3+j4)\,\mathrm{V}`,
      "."
    )
  ],
  [
    "|z| = sqrt(3^2 + 4^2) V.",
    authoredExpression(
      "",
      "|z| = sqrt(3^2 + 4^2) V",
      String.raw`\lvert z\rvert=\sqrt{3^2+4^2}\,\mathrm{V}`,
      "."
    )
  ],
  [
    "|z| = 5 V",
    authoredMathOnly("|z| = 5 V", String.raw`\lvert z\rvert=5\,\mathrm{V}`)
  ],
  [
    "An impedance is z = -5 + j12 ohm.",
    authoredExpression(
      "An impedance is ",
      "z = -5 + j12 ohm",
      String.raw`z=(-5+j12)\,\Omega`,
      "."
    )
  ],
  [
    "|z| = sqrt((-5)^2 + 12^2) ohm.",
    authoredExpression(
      "",
      "|z| = sqrt((-5)^2 + 12^2) ohm",
      String.raw`\lvert z\rvert=\sqrt{(-5)^2+12^2}\,\Omega`,
      "."
    )
  ],
  [
    "|z| = 13 ohm",
    authoredMathOnly("|z| = 13 ohm", String.raw`\lvert z\rvert=13\,\Omega`)
  ],
  [
    "Squaring 13 ohm reconstructs 25 + 144 = 169 ohm squared.",
    authoredMathOnly(
      "Squaring 13 ohm reconstructs 25 + 144 = 169 ohm squared.",
      String.raw`\left(13\,\Omega\right)^2=25\,\Omega^2+144\,\Omega^2=169\,\Omega^2`
    )
  ],
  [
    "mm = sum(mm)",
    authoredMathOnly("mm = sum(mm)", String.raw`\mathrm{mm}=\sum_i\mathrm{mm}`)
  ],
  [
    "T_worst = 0.10 + 0.20 + 0.05 mm.",
    authoredExpression(
      "",
      "T_worst = 0.10 + 0.20 + 0.05 mm",
      String.raw`T_{\mathrm{worst}}=(0.10+0.20+0.05)\,\mathrm{mm}`,
      "."
    )
  ],
  [
    "T_worst = 0.35 mm",
    authoredMathOnly(
      "T_worst = 0.35 mm",
      String.raw`T_{\mathrm{worst}}=0.35\,\mathrm{mm}`
    )
  ],
  [
    "The assembly interval is nominal plus or minus 0.35 mm when all limits align.",
    authoredMathOnly(
      "The assembly interval is nominal plus or minus 0.35 mm when all limits align.",
      String.raw`x_{\mathrm{assembly}}=x_{\mathrm{nominal}}\pm0.35\,\mathrm{mm}`
    )
  ],
  [
    "T_worst = 0.25 + 0.15 mm.",
    authoredExpression(
      "",
      "T_worst = 0.25 + 0.15 mm",
      String.raw`T_{\mathrm{worst}}=(0.25+0.15)\,\mathrm{mm}`,
      "."
    )
  ],
  [
    "T_worst = 0.40 mm",
    authoredMathOnly(
      "T_worst = 0.40 mm",
      String.raw`T_{\mathrm{worst}}=0.40\,\mathrm{mm}`
    )
  ],
  [
    "1 = count/count",
    authoredMathOnly("1 = count/count", String.raw`1=\frac{\text{count}}{\text{count}}`)
  ],
  [
    "P(A) = 8/40.",
    authoredExpression("", "P(A) = 8/40", String.raw`P(A)=\frac{8}{40}`, ".")
  ],
  [
    "P(A) = 0.20",
    authoredMathOnly("P(A) = 0.20", "P(A)=0.20")
  ],
  [
    "0.20 multiplied by 40 trials returns 8 event observations.",
    authoredMathOnly(
      "0.20 multiplied by 40 trials returns 8 event observations.",
      String.raw`0.20(40\,\text{trials})=8\,\text{event observations}`
    )
  ],
  [
    "P(A) = 3/12.",
    authoredExpression("", "P(A) = 3/12", String.raw`P(A)=\frac{3}{12}`, ".")
  ],
  [
    "P(A) = 0.25",
    authoredMathOnly("P(A) = 0.25", "P(A)=0.25")
  ],
  [
    "One quarter of 12 outcomes is 3.",
    authoredMathOnly("One quarter of 12 outcomes is 3.", String.raw`\frac{1}{4}(12)=3`)
  ],
  [
    "1 = distance unit/distance unit",
    authoredMathOnly(
      "1 = distance unit/distance unit",
      String.raw`1=\frac{\text{distance unit}}{\text{distance unit}}`
    )
  ],
  [
    "rho = 0.40/0.80.",
    authoredExpression("", "rho = 0.40/0.80", String.raw`\rho=\frac{0.40}{0.80}`, ".")
  ],
  [
    "rho = 0.50",
    authoredMathOnly("rho = 0.50", "\\rho=0.50")
  ],
  [
    "rho = 30/40.",
    authoredExpression("", "rho = 30/40", String.raw`\rho=\frac{30}{40}`, ".")
  ],
  [
    "rho = 0.75",
    authoredMathOnly("rho = 0.75", "\\rho=0.75")
  ],
  [
    "0.75 multiplied by 40 returns the nearest distance 30.",
    authoredMathOnly(
      "0.75 multiplied by 40 returns the nearest distance 30.",
      "0.75(40)=30"
    )
  ],
  [
    "unit(G) = output unit/input unit",
    authoredMathOnly(
      "unit(G) = output unit/input unit",
      String.raw`\operatorname{unit}(G)=\frac{\text{output unit}}{\text{input unit}}`
    )
  ],
  [
    "|G| = 2 V / 5 V.",
    authoredExpression(
      "",
      "|G| = 2 V / 5 V",
      String.raw`\lvert G\rvert=\frac{2\,\mathrm{V}}{5\,\mathrm{V}}`,
      "."
    )
  ],
  [
    "|G| = 0.40",
    authoredMathOnly("|G| = 0.40", String.raw`\lvert G\rvert=0.40`)
  ],
  [
    "0.40 multiplied by the 5 V input predicts the 2 V output amplitude.",
    authoredMathOnly(
      "0.40 multiplied by the 5 V input predicts the 2 V output amplitude.",
      String.raw`0.40\left(5\,\mathrm{V}\right)=2\,\mathrm{V}`
    )
  ],
  [
    "|G| = 0.10 m / 0.20 m.",
    authoredExpression(
      "",
      "|G| = 0.10 m / 0.20 m",
      String.raw`\lvert G\rvert=\frac{0.10\,\mathrm{m}}{0.20\,\mathrm{m}}`,
      "."
    )
  ],
  [
    "|G| = 0.50",
    authoredMathOnly("|G| = 0.50", String.raw`\lvert G\rvert=0.50`)
  ],
  [
    "Define the tracking error e = r - y.",
    authoredExpression(
      "Define the tracking error ",
      "e = r - y",
      "e=r-y",
      "."
    )
  ],
  [
    "actuator unit = actuator unit + actuator unit + actuator unit",
    authoredMathOnly(
      "actuator unit = actuator unit + actuator unit + actuator unit",
      String.raw`\operatorname{unit}(u)=\operatorname{unit}(K_p e)+\operatorname{unit}\!\left(K_i\int e\,\mathrm{d}t\right)+\operatorname{unit}\!\left(K_d\frac{\mathrm{d}e}{\mathrm{d}t}\right)`
    )
  ],
  [
    "Kp = 2, Ki = 0.5, Kd = 0.1, e = 1, integral error = 2 and error rate = 3 in compatible units.",
    authoredMathOnly(
      "Kp = 2, Ki = 0.5, Kd = 0.1, e = 1, integral error = 2 and error rate = 3 in compatible units.",
      String.raw`K_p=2,\quad K_i=0.5,\quad K_d=0.1,\quad e=1,\quad\int e\,\mathrm{d}t=2,\quad\frac{\mathrm{d}e}{\mathrm{d}t}=3`
    )
  ],
  [
    "u = 2 x 1 + 0.5 x 2 + 0.1 x 3.",
    authoredExpression(
      "",
      "u = 2 x 1 + 0.5 x 2 + 0.1 x 3",
      "u=2(1)+0.5(2)+0.1(3)",
      "."
    )
  ],
  [
    "Add 2, 1 and 0.3.",
    authoredExpression("Add ", "2, 1 and 0.3", "2+1+0.3", ".")
  ],
  [
    "u = 3.3 actuator units",
    authoredMathOnly(
      "u = 3.3 actuator units",
      String.raw`u=3.3\ \text{actuator units}`
    )
  ],
  [
    "The three independently calculated terms reconcile to the 3.3 total.",
    authoredMathOnly(
      "The three independently calculated terms reconcile to the 3.3 total.",
      "2+1+0.3=3.3"
    )
  ],
  [
    "Kp = 1.5, Ki = 0.2, Kd = 0, e = 2 and integral error = 5 in compatible units.",
    authoredMathOnly(
      "Kp = 1.5, Ki = 0.2, Kd = 0, e = 2 and integral error = 5 in compatible units.",
      String.raw`K_p=1.5,\quad K_i=0.2,\quad K_d=0,\quad e=2,\quad\int e\,\mathrm{d}t=5`
    )
  ],
  [
    "u = 1.5 x 2 + 0.2 x 5 + 0.",
    authoredExpression(
      "",
      "u = 1.5 x 2 + 0.2 x 5 + 0",
      "u=1.5(2)+0.2(5)+0",
      "."
    )
  ],
  [
    "Add 3 and 1.",
    authoredExpression("Add ", "3 and 1", "3+1", ".")
  ],
  [
    "u = 4 actuator units",
    authoredMathOnly("u = 4 actuator units", String.raw`u=4\ \text{actuator units}`)
  ],
  [
    "Removing the 1 integral unit leaves the 3 proportional units.",
    authoredMathOnly(
      "Removing the 1 integral unit leaves the 3 proportional units.",
      "4-1=3"
    )
  ],
  [
    "1 = product of dimensionless probabilities",
    authoredMathOnly(
      "1 = product of dimensionless probabilities",
      String.raw`1=\prod_i R_i`
    )
  ],
  [
    "Use R = 0.95 x 0.95.",
    authoredExpression("Use ", "R = 0.95 x 0.95", "R=0.95\\times0.95", ".")
  ],
  [
    "R = 0.9025",
    authoredMathOnly("R = 0.9025", "R=0.9025")
  ],
  [
    "Failure probability is 1 - 0.9025 = 0.0975.",
    authoredExpression(
      "Failure probability is ",
      "1 - 0.9025 = 0.0975",
      "1-0.9025=0.0975",
      "."
    )
  ],
  [
    "Multiply 0.99 x 0.98.",
    authoredExpression("Multiply ", "0.99 x 0.98", "0.99\\times0.98", ".")
  ],
  [
    "Multiply the result by 0.97.",
    authoredMathOnly(
      "Multiply the result by 0.97.",
      "0.99\\times0.98\\times0.97"
    )
  ],
  [
    "R = 0.9411",
    authoredMathOnly("R = 0.9411", "R=0.9411")
  ],
  [
    "The result is below 0.97, the least reliable component, as a strict series chain should be.",
    authoredMathOnly(
      "The result is below 0.97, the least reliable component, as a strict series chain should be.",
      "0.9411<0.97"
    )
  ],
  [
    "A = A multiplied by a dimensionless exponential term",
    authoredMathOnly(
      "A = A multiplied by a dimensionless exponential term",
      String.raw`\mathrm{A}=\mathrm{A}\left(e^{V_D/(nV_T)}-1\right)`
    )
  ],
  [
    "I_D = (1 nA)(exp(0.50 V/(2 x 0.025 V)) - 1).",
    authoredExpression(
      "",
      "I_D = (1 nA)(exp(0.50 V/(2 x 0.025 V)) - 1)",
      String.raw`I_D=\left(1\,\mathrm{nA}\right)\left[\exp\!\left(\frac{0.50\,\mathrm{V}}{2\left(0.025\,\mathrm{V}\right)}\right)-1\right]`,
      "."
    )
  ],
  [
    "I_D = 0.0220 mA",
    authoredMathOnly("I_D = 0.0220 mA", String.raw`I_D=0.0220\,\mathrm{mA}`)
  ],
  [
    "Substitution into the same model gives 22.0 microamps, which is 0.0220 mA.",
    authoredMathOnly(
      "Substitution into the same model gives 22.0 microamps, which is 0.0220 mA.",
      String.raw`22.0\,\mathrm{\mu A}=0.0220\,\mathrm{mA}`
    )
  ],
  [
    "I_D = (1 nA)(exp(0.60 V/(2 x 0.025 V)) - 1).",
    authoredExpression(
      "",
      "I_D = (1 nA)(exp(0.60 V/(2 x 0.025 V)) - 1)",
      String.raw`I_D=\left(1\,\mathrm{nA}\right)\left[\exp\!\left(\frac{0.60\,\mathrm{V}}{2\left(0.025\,\mathrm{V}\right)}\right)-1\right]`,
      "."
    )
  ],
  [
    "I_D = 0.1628 mA",
    authoredMathOnly("I_D = 0.1628 mA", String.raw`I_D=0.1628\,\mathrm{mA}`)
  ],
  [
    "state unit = state unit + dimensionless gain multiplied by state unit",
    authoredMathOnly(
      "state unit = state unit + dimensionless gain multiplied by state unit",
      String.raw`\operatorname{unit}(\hat{x}^{+})=\operatorname{unit}(\hat{x}^{-})+1\cdot\operatorname{unit}\!\left(z-\hat{x}^{-}\right)`
    )
  ],
  [
    "A scalar position prediction is 2.0 m with variance 4.0 m^2; a 3.0 m measurement has variance 1.0 m^2.",
    authoredMathOnly(
      "A scalar position prediction is 2.0 m with variance 4.0 m^2; a 3.0 m measurement has variance 1.0 m^2.",
      String.raw`\hat{x}^{-}=2.0\,\mathrm{m},\quad P^{-}=4.0\,\mathrm{m^2},\quad z=3.0\,\mathrm{m},\quad R=1.0\,\mathrm{m^2}`
    )
  ],
  [
    "K = 4.0/(4.0 + 1.0) = 0.80.",
    authoredExpression(
      "",
      "K = 4.0/(4.0 + 1.0) = 0.80",
      String.raw`K=\frac{4.0}{4.0+1.0}=0.80`,
      "."
    )
  ],
  [
    "Correct the prediction by 0.80 times the 1.0 m innovation.",
    authoredMathOnly(
      "Correct the prediction by 0.80 times the 1.0 m innovation.",
      String.raw`\hat{x}^{+}=2.0\,\mathrm{m}+0.80\left(1.0\,\mathrm{m}\right)=2.8\,\mathrm{m}`
    )
  ],
  [
    "x posterior = 2.8 m and P posterior = 0.8 m^2",
    authoredMathOnly(
      "x posterior = 2.8 m and P posterior = 0.8 m^2",
      String.raw`\hat{x}^{+}=2.8\,\mathrm{m},\qquad P^{+}=0.8\,\mathrm{m^2}`
    )
  ],
  [
    "An angular prediction is 10 deg with variance 1 deg^2; a 14 deg measurement has variance 3 deg^2.",
    authoredMathOnly(
      "An angular prediction is 10 deg with variance 1 deg^2; a 14 deg measurement has variance 3 deg^2.",
      String.raw`\hat{x}^{-}=10^\circ,\quad P^{-}=1\,\mathrm{deg^2},\quad z=14^\circ,\quad R=3\,\mathrm{deg^2}`
    )
  ],
  [
    "K = 1/(1 + 3) = 0.25.",
    authoredExpression(
      "",
      "K = 1/(1 + 3) = 0.25",
      String.raw`K=\frac{1}{1+3}=0.25`,
      "."
    )
  ],
  [
    "Apply one quarter of the 4 deg innovation.",
    authoredMathOnly(
      "Apply one quarter of the 4 deg innovation.",
      String.raw`\hat{x}^{+}=10^\circ+\frac{1}{4}\left(4^\circ\right)=11^\circ`
    )
  ],
  [
    "x posterior = 11 deg and P posterior = 0.75 deg^2",
    authoredMathOnly(
      "x posterior = 11 deg and P posterior = 0.75 deg^2",
      String.raw`\hat{x}^{+}=11^\circ,\qquad P^{+}=0.75\,\mathrm{deg^2}`
    )
  ],
  [
    "state unit = state unit + state-unit-per-measurement-unit multiplied by measurement unit",
    authoredMathOnly(
      "state unit = state unit + state-unit-per-measurement-unit multiplied by measurement unit",
      String.raw`\operatorname{unit}(\hat{x}^{+})=\operatorname{unit}(\hat{x}^{-})+\frac{\text{state unit}}{\text{measurement unit}}\left(\text{measurement unit}\right)`
    )
  ],
  [
    "A scalar EKF uses observation h(x) = x^2, prediction 2.0 m, variance 0.25 m^2, measurement 5.0 m^2 and measurement variance 1.0 m^4.",
    authoredMathOnly(
      "A scalar EKF uses observation h(x) = x^2, prediction 2.0 m, variance 0.25 m^2, measurement 5.0 m^2 and measurement variance 1.0 m^4.",
      String.raw`h(x)=x^2,\quad\hat{x}^{-}=2.0\,\mathrm{m},\quad P^{-}=0.25\,\mathrm{m^2},\quad z=5.0\,\mathrm{m^2},\quad R=1.0\,\mathrm{m^4}`
    )
  ],
  [
    "H = 2 x 2.0 = 4.0 m and S = 4^2 x 0.25 + 1.0 = 5.0 m^4.",
    authoredMathOnly(
      "H = 2 x 2.0 = 4.0 m and S = 4^2 x 0.25 + 1.0 = 5.0 m^4.",
      String.raw`H=2(2.0\,\mathrm{m})=4.0\,\mathrm{m},\qquad S=\left(4.0\,\mathrm{m}\right)^2\left(0.25\,\mathrm{m^2}\right)+1.0\,\mathrm{m^4}=5.0\,\mathrm{m^4}`
    )
  ],
  [
    "Use gain 0.20 per metre on the 1.0 m^2 innovation.",
    authoredMathOnly(
      "Use gain 0.20 per metre on the 1.0 m^2 innovation.",
      String.raw`\hat{x}^{+}=2.0\,\mathrm{m}+\left(0.20\,\mathrm{m^{-1}}\right)\left(1.0\,\mathrm{m^2}\right)=2.2\,\mathrm{m}`
    )
  ],
  [
    "x posterior = 2.2 m",
    authoredMathOnly("x posterior = 2.2 m", String.raw`\hat{x}^{+}=2.2\,\mathrm{m}`)
  ],
  [
    "Substituting 2.2 m into the nonlinear observation gives 4.84 m^2, close to the 5.0 m^2 measurement.",
    authoredMathOnly(
      "Substituting 2.2 m into the nonlinear observation gives 4.84 m^2, close to the 5.0 m^2 measurement.",
      String.raw`h\!\left(2.2\,\mathrm{m}\right)=\left(2.2\,\mathrm{m}\right)^2=4.84\,\mathrm{m^2}\approx5.0\,\mathrm{m^2}`
    )
  ],
  [
    "The same observation uses prediction 3.0 m, variance 0.16 m^2, measurement 8.5 m^2 and measurement variance 0.36 m^4.",
    authoredMathOnly(
      "The same observation uses prediction 3.0 m, variance 0.16 m^2, measurement 8.5 m^2 and measurement variance 0.36 m^4.",
      String.raw`\hat{x}^{-}=3.0\,\mathrm{m},\quad P^{-}=0.16\,\mathrm{m^2},\quad z=8.5\,\mathrm{m^2},\quad R=0.36\,\mathrm{m^4}`
    )
  ],
  [
    "H = 6.0 m, S = 6^2 x 0.16 + 0.36 = 6.12 m^4 and K = 0.1569 per metre.",
    authoredMathOnly(
      "H = 6.0 m, S = 6^2 x 0.16 + 0.36 = 6.12 m^4 and K = 0.1569 per metre.",
      String.raw`H=6.0\,\mathrm{m},\qquad S=\left(6.0\,\mathrm{m}\right)^2\left(0.16\,\mathrm{m^2}\right)+0.36\,\mathrm{m^4}=6.12\,\mathrm{m^4},\qquad K=0.1569\,\mathrm{m^{-1}}`
    )
  ],
  [
    "Apply the gain to the negative 0.50 m^2 innovation.",
    authoredMathOnly(
      "Apply the gain to the negative 0.50 m^2 innovation.",
      String.raw`\hat{x}^{+}=3.0\,\mathrm{m}+\left(0.1569\,\mathrm{m^{-1}}\right)\left(-0.50\,\mathrm{m^2}\right)=2.922\,\mathrm{m}`
    )
  ],
  [
    "x posterior = 2.922 m",
    authoredMathOnly("x posterior = 2.922 m", String.raw`\hat{x}^{+}=2.922\,\mathrm{m}`)
  ],
  [
    "The corrected nonlinear prediction is about 8.536 m^2, consistent with the measurement at the stated approximation.",
    authoredMathOnly(
      "The corrected nonlinear prediction is about 8.536 m^2, consistent with the measurement at the stated approximation.",
      String.raw`h\!\left(2.922\,\mathrm{m}\right)=\left(2.922\,\mathrm{m}\right)^2\approx8.536\,\mathrm{m^2}`
    )
  ],
  [
    "A gearbox turns the output 25 times while the input turns 100 times. What is output/input?",
    [
      authoredText("A gearbox turns the output 25 times while the input turns 100 times. What is "),
      authoredMath(
        "output/input",
        String.raw`\frac{\text{output turns}}{\text{input turns}}`,
        "output turns divided by input turns",
        false
      ),
      authoredText("?")
    ]
  ],
  [
    "A sensor uses y = 0.25x + 0.50, with y in volts and x in kilopascals. Find y for x = 10 kPa.",
    authoredMathOnly(
      "A sensor uses y = 0.25x + 0.50, with y in volts and x in kilopascals. Find y for x = 10 kPa.",
      String.raw`y=0.25x+0.50,\qquad x=10\,\mathrm{kPa};\qquad\text{find }y\text{ in volts}`
    )
  ],
  [
    "A position vector has x = 6 m and y = 8 m. What is its magnitude?",
    authoredMathOnly(
      "A position vector has x = 6 m and y = 8 m. What is its magnitude?",
      String.raw`\mathbf{r}=\begin{bmatrix}6\\8\end{bmatrix}\mathrm{m};\qquad\text{find }\lVert\mathbf{r}\rVert`
    )
  ],
  [
    "For A = diag(3, 5) and v = [1, 0]^T, what eigenvalue satisfies A v = lambda v?",
    authoredMathOnly(
      "For A = diag(3, 5) and v = [1, 0]^T, what eigenvalue satisfies A v = lambda v?",
      String.raw`A=\begin{bmatrix}3&0\\0&5\end{bmatrix},\quad\mathbf{v}=\begin{bmatrix}1\\0\end{bmatrix};\qquad A\mathbf{v}=\lambda\mathbf{v}`
    )
  ],
  [
    "If the local slope dy/dx is 4, what is the inverse slope dx/dy?",
    authoredMathOnly(
      "If the local slope dy/dx is 4, what is the inverse slope dx/dy?",
      String.raw`\frac{\mathrm{d}y}{\mathrm{d}x}=4;\qquad\text{find }\frac{\mathrm{d}x}{\mathrm{d}y}`
    )
  ],
  [
    "A constant rate of 3 kg/s lasts 20 s. What mass accumulates?",
    authoredMathOnly(
      "A constant rate of 3 kg/s lasts 20 s. What mass accumulates?",
      String.raw`q=3\,\mathrm{kg\,s^{-1}},\qquad\Delta t=20\,\mathrm{s};\qquad\text{find }m`
    )
  ],
  [
    "What net force accelerates a 20 kg mass at 0.30 m/s^2?",
    authoredMathOnly(
      "What net force accelerates a 20 kg mass at 0.30 m/s^2?",
      String.raw`m=20\,\mathrm{kg},\qquad a=0.30\,\mathrm{m\,s^{-2}};\qquad\text{find }F`
    )
  ],
  [
    "A 1000 N load acts over 200 mm^2. What is the average stress in MPa?",
    authoredMathOnly(
      "A 1000 N load acts over 200 mm^2. What is the average stress in MPa?",
      String.raw`F=1000\,\mathrm{N},\qquad A=200\,\mathrm{mm^2};\qquad\text{find }\sigma\text{ in MPa}`
    )
  ],
  [
    "A shaft provides 4 N m at 50 rad/s. What power is transmitted?",
    authoredMathOnly(
      "A shaft provides 4 N m at 50 rad/s. What power is transmitted?",
      String.raw`T=4\,\mathrm{N\,m},\qquad\omega=50\,\mathrm{rad\,s^{-1}};\qquad\text{find }P`
    )
  ],
  [
    "For Kp = 3 V/m, reference 2.0 m and output 1.5 m, what is u?",
    authoredMathOnly(
      "For Kp = 3 V/m, reference 2.0 m and output 1.5 m, what is u?",
      String.raw`K_p=3\,\mathrm{V\,m^{-1}},\qquad r=2.0\,\mathrm{m},\qquad y=1.5\,\mathrm{m};\qquad\text{find }u`
    )
  ],
  [
    "For vR = 0.8 m/s and vL = 0.4 m/s, what is body linear speed?",
    authoredMathOnly(
      "For vR = 0.8 m/s and vL = 0.4 m/s, what is body linear speed?",
      String.raw`v_R=0.8\,\mathrm{m\,s^{-1}},\qquad v_L=0.4\,\mathrm{m\,s^{-1}};\qquad\text{find }v`
    )
  ],
  [
    "For fx = 400 px, X = 0.5 m, Z = 2 m and cx = 300 px, find u.",
    authoredMathOnly(
      "For fx = 400 px, X = 0.5 m, Z = 2 m and cx = 300 px, find u.",
      String.raw`f_x=400\,\mathrm{px},\quad X=0.5\,\mathrm{m},\quad Z=2\,\mathrm{m},\quad c_x=300\,\mathrm{px};\qquad\text{find }u`
    )
  ],
  [
    "Find natural frequency for k = 100 N/m and m = 1 kg.",
    authoredMathOnly(
      "Find natural frequency for k = 100 N/m and m = 1 kg.",
      String.raw`k=100\,\mathrm{N\,m^{-1}},\qquad m=1\,\mathrm{kg};\qquad\text{find }f_n`
    )
  ],
  [
    "For k = 200 W/(m K), A = 0.001 m^2, Delta T = 10 K and L = 0.01 m, find heat rate.",
    authoredMathOnly(
      "For k = 200 W/(m K), A = 0.001 m^2, Delta T = 10 K and L = 0.01 m, find heat rate.",
      String.raw`k=200\,\mathrm{W\,m^{-1}\,K^{-1}},\quad A=0.001\,\mathrm{m^2},\quad\Delta T=10\,\mathrm{K},\quad L=0.01\,\mathrm{m};\qquad\text{find }\dot{Q}`
    )
  ],
  [
    "A 500 N/m spring is compressed by 0.020 m. Find force magnitude.",
    authoredMathOnly(
      "A 500 N/m spring is compressed by 0.020 m. Find force magnitude.",
      String.raw`k=500\,\mathrm{N\,m^{-1}},\qquad x=0.020\,\mathrm{m};\qquad\text{find }\lvert F\rvert`
    )
  ],
  [
    "Find cutting speed for D = 20 mm and n = 1200 rev/min.",
    authoredMathOnly(
      "Find cutting speed for D = 20 mm and n = 1200 rev/min.",
      String.raw`D=20\,\mathrm{mm},\qquad n=1200\,\mathrm{rev\,min^{-1}};\qquad\text{find }v_c`
    )
  ],
  [
    "Find cutoff frequency for R = 1.0 kohm and C = 1.0 microfarad.",
    authoredMathOnly(
      "Find cutoff frequency for R = 1.0 kohm and C = 1.0 microfarad.",
      String.raw`R=1.0\,\mathrm{k\Omega},\qquad C=1.0\,\mathrm{\mu F};\qquad\text{find }f_c`
    )
  ],
  [
    "For x_dot = -2x + 3u, x = 1 and u = 2, find x_dot.",
    authoredMathOnly(
      "For x_dot = -2x + 3u, x = 1 and u = 2, find x_dot.",
      String.raw`\dot{x}=-2x+3u,\qquad x=1,\qquad u=2;\qquad\text{find }\dot{x}`
    )
  ],
  [
    "Rotate x = 2 m, y = 0 m by 60 degrees. Find x prime.",
    authoredMathOnly(
      "Rotate x = 2 m, y = 0 m by 60 degrees. Find x prime.",
      String.raw`x=2\,\mathrm{m},\qquad y=0\,\mathrm{m},\qquad\theta=60^\circ;\qquad\text{find }x'`
    )
  ],
  [
    "For J = 0.5 m/rad and joint rate 2 rad/s, find task velocity.",
    authoredMathOnly(
      "For J = 0.5 m/rad and joint rate 2 rad/s, find task velocity.",
      String.raw`J=0.5\,\mathrm{m\,rad^{-1}},\qquad\dot{q}=2\,\mathrm{rad\,s^{-1}};\qquad\text{find }v`
    )
  ],
  [
    "A planner node has g = 12 m and h = 5 m. Find f.",
    authoredMathOnly(
      "A planner node has g = 12 m and h = 5 m. Find f.",
      String.raw`g=12\,\mathrm{m},\qquad h=5\,\mathrm{m};\qquad\text{find }f`
    )
  ],
  [
    "For z = 3 + j4 V, find magnitude.",
    authoredMathOnly(
      "For z = 3 + j4 V, find magnitude.",
      String.raw`z=(3+j4)\,\mathrm{V};\qquad\text{find }\lvert z\rvert`
    )
  ],
  [
    "Kp = 2, Ki = 0.5, Kd = 0.1, e = 1, integral error = 2 and error rate = 3. Find PID output.",
    authoredMathOnly(
      "Kp = 2, Ki = 0.5, Kd = 0.1, e = 1, integral error = 2 and error rate = 3. Find PID output.",
      String.raw`K_p=2,\quad K_i=0.5,\quad K_d=0.1,\quad e=1,\quad\int e\,\mathrm{d}t=2,\quad\frac{\mathrm{d}e}{\mathrm{d}t}=3;\qquad\text{find }u`
    )
  ],
  [
    "A scalar position prediction is 5 m with variance 4 m^2; an 8 m measurement has variance 1 m^2. Find the posterior position.",
    authoredMathOnly(
      "A scalar position prediction is 5 m with variance 4 m^2; an 8 m measurement has variance 1 m^2. Find the posterior position.",
      String.raw`\hat{x}^{-}=5\,\mathrm{m},\quad P^{-}=4\,\mathrm{m^2},\quad z=8\,\mathrm{m},\quad R=1\,\mathrm{m^2};\qquad\text{find }\hat{x}^{+}`
    )
  ],
  [
    "A scalar EKF uses h(x) = x^2, prediction 2.0 m, variance 0.25 m^2, measurement 5.0 m^2 and measurement variance 1.0 m^4. Find the posterior state.",
    authoredMathOnly(
      "A scalar EKF uses h(x) = x^2, prediction 2.0 m, variance 0.25 m^2, measurement 5.0 m^2 and measurement variance 1.0 m^4. Find the posterior state.",
      String.raw`h(x)=x^2,\quad\hat{x}^{-}=2.0\,\mathrm{m},\quad P^{-}=0.25\,\mathrm{m^2},\quad z=5.0\,\mathrm{m^2},\quad R=1.0\,\mathrm{m^4};\qquad\text{find }\hat{x}^{+}`
    )
  ],
]);

const rawSourceLikeMathPatterns = [
  /(?:^|\s)[A-Za-z][A-Za-z0-9_]*(?:\s+prime|\s+posterior|\s+average)?\s*(?:=|<=|>=)/u,
  /(?:^|\s)(?:unit|sqrt|exp|diag|integral)\s*\(/u,
  /(?:\^|_|\||\[.*\]\^T)/u,
  /(?:^|\s)(?:Delta|lambda|omega|sigma|rho|theta)(?:\s|$|_)/u,
  /[0-9A-Za-z.)]\s*(?:\/|\+)\s*[0-9A-Za-z.(]/u,
  /[0-9.)]\s+x\s+[-(0-9]/u
] as const;

export const sourceContainsUnreviewedMathNotation = (
  source: string
): boolean => rawSourceLikeMathPatterns.some((pattern) => pattern.test(source));

export const buildAcademyReviewedInstruction = (
  id: string,
  source: string,
  context: string,
  requireMath = false
): AcademyInstruction => {
  const authoredParts = academyAuthoredInstructionParts.get(source);
  if (!authoredParts) {
    if (requireMath || sourceContainsUnreviewedMathNotation(source)) {
      throw new Error(
        `Missing explicit semantic mathematics authoring for ${context}: "${source}".`
      );
    }
    return reviewedTextInstruction(source);
  }

  const reconstructedSource = authoredParts
    .map((part) => part.kind === "text" ? part.text : part.plainText)
    .join("");
  if (reconstructedSource !== source) {
    throw new Error(
      `Semantic mathematics authoring drifted for ${context}: expected "${source}", received "${reconstructedSource}".`
    );
  }

  let mathIndex = 0;
  const instruction = authoredParts.map((part) => {
    if (part.kind === "text") return { kind: "text" as const, text: part.text };
    mathIndex += 1;
    return {
      kind: "math" as const,
      expression: reviewedMath(
        `${id}-MATH-${String(mathIndex).padStart(2, "0")}`,
        part.plainText,
        part.latex,
        `${context}: ${part.spoken}`,
        part.displayMode ?? true
      )
    };
  });

  if (mathIndex === 0) {
    throw new Error(
      `Semantic mathematics authoring for ${context} contains no reviewed math.`
    );
  }
  return instruction;
};

interface FormulaExampleVerificationOutputSeed {
  outputId: string;
  value: number;
  canonicalUnit: string;
}

const verificationOutput = (
  outputId: string,
  value: number,
  canonicalUnit: string
): FormulaExampleVerificationOutputSeed => ({
  outputId,
  value,
  canonicalUnit
});

const academyWorkedExampleVerificationOutputs = {
  sum: [
    [verificationOutput("totalMinutes", 50, "min")],
    [
      verificationOutput("totalSeconds", 720, "s"),
      verificationOutput("totalMinutes", 12, "min")
    ]
  ],
  ratio: [
    [verificationOutput("ratio", 3, "1")],
    [verificationOutput("ratio", 0.9, "1")]
  ],
  linear: [
    [verificationOutput("output", 90, "mV")],
    [verificationOutput("output", 3.2, "V")]
  ],
  vector: [
    [verificationOutput("magnitude", 5, "m")],
    [verificationOutput("magnitude", 0.13, "m")]
  ],
  eigen: [
    [verificationOutput("eigenvalue", 2, "1")],
    [verificationOutput("eigenvalue", 1, "1")]
  ],
  inverseDerivative: [
    [verificationOutput("inverseSlope", 0.5, "1")],
    [verificationOutput("inverseSlope", 1 / 6, "1")]
  ],
  derivative: [
    [verificationOutput("velocity", 12, "m/s")],
    [verificationOutput("velocity", 4, "m/s")]
  ],
  integral: [
    [verificationOutput("accumulatedVolume", 6, "L")],
    [verificationOutput("energy", 6000, "J")]
  ],
  force: [
    [verificationOutput("force", 6, "N")],
    [verificationOutput("acceleration", 4, "m/s^2")]
  ],
  stress: [
    [verificationOutput("stress", 5, "MPa")],
    [verificationOutput("stress", 30, "MPa")]
  ],
  power: [
    [verificationOutput("power", 200, "W")],
    [verificationOutput("torque", 6, "N m")]
  ],
  ohm: [
    [verificationOutput("voltage", 3.3, "V")],
    [verificationOutput("resistance", 48, "ohm")]
  ],
  timing: [
    [
      verificationOutput("durationSeconds", 0.005, "s"),
      verificationOutput("durationMilliseconds", 5, "ms")
    ],
    [
      verificationOutput("durationSeconds", 0.002, "s"),
      verificationOutput("durationMilliseconds", 2, "ms")
    ]
  ],
  sampling: [
    [verificationOutput("minimumSamplingFrequency", 160, "Hz")],
    [verificationOutput("maximumFrequency", 500, "Hz")]
  ],
  control: [
    [verificationOutput("command", 4, "V")],
    [verificationOutput("commandPercent", 30, "percent")]
  ],
  robot: [
    [
      verificationOutput("linearSpeed", 0.6, "m/s"),
      verificationOutput("angularSpeed", 0, "rad/s")
    ],
    [
      verificationOutput("linearSpeed", 0.3, "m/s"),
      verificationOutput("angularSpeed", 1, "rad/s")
    ]
  ],
  estimate: [
    [verificationOutput("estimate", 2.1, "m")],
    [verificationOutput("estimate", 12, "deg")]
  ],
  pinhole: [
    [verificationOutput("pixelCoordinate", 370, "px")],
    [verificationOutput("horizontalCoordinate", 0.6, "m")]
  ],
  metric: [
    [
      verificationOutput("precision", 0.9, "1"),
      verificationOutput("precisionPercent", 90, "percent")
    ],
    [
      verificationOutput("precision", 0.75, "1"),
      verificationOutput("precisionPercent", 75, "percent")
    ]
  ],
  uncertainty: [
    [verificationOutput("combinedUncertainty", 0.5, "mm")],
    [verificationOutput("combinedUncertainty", 1, "K")]
  ],
  partialSensitivity: [
    [verificationOutput("sensitivity", 2, "V/kPa")],
    [verificationOutput("sensitivity", 2, "K/W")]
  ],
  firstOrderStep: [
    [verificationOutput("response", 6.321, "V")],
    [verificationOutput("response", 17.29, "K")]
  ],
  mean: [
    [verificationOutput("mean", 4, "V")],
    [verificationOutput("mean", 10, "s")]
  ],
  oscillation: [
    [verificationOutput("naturalFrequency", 1.592, "Hz")],
    [verificationOutput("naturalFrequency", 1.592, "Hz")]
  ],
  coulomb: [
    [verificationOutput("forceMagnitude", 0.8988, "N")],
    [verificationOutput("forceMagnitude", 0.4494, "N")]
  ],
  heatConduction: [
    [verificationOutput("heatRate", 200, "W")],
    [verificationOutput("heatRate", 16, "W")]
  ],
  spring: [
    [verificationOutput("force", 10, "N")],
    [verificationOutput("stiffness", 600, "N/m")]
  ],
  machiningSpeed: [
    [verificationOutput("surfaceSpeed", 1.257, "m/s")],
    [verificationOutput("surfaceSpeed", 1.571, "m/s")]
  ],
  rcCutoff: [
    [verificationOutput("cutoffFrequency", 159.15, "Hz")],
    [verificationOutput("cutoffFrequency", 159.15, "Hz")]
  ],
  adcResolution: [
    [
      verificationOutput("resolutionVolts", 0.0008057, "V"),
      verificationOutput("resolutionMillivolts", 0.8057, "mV")
    ],
    [verificationOutput("resolutionVolts", 0.01953, "V")]
  ],
  pwmDuty: [
    [
      verificationOutput("dutyRatio", 0.2, "1"),
      verificationOutput("dutyPercent", 20, "percent")
    ],
    [
      verificationOutput("periodMilliseconds", 1, "ms"),
      verificationOutput("dutyRatio", 0.75, "1"),
      verificationOutput("dutyPercent", 75, "percent")
    ]
  ],
  fourier: [
    [verificationOutput("dcCoefficient", 4, "V")],
    [verificationOutput("dcCoefficient", 8, "V")]
  ],
  stateSpace: [
    [verificationOutput("stateDerivative", 4, "1/s")],
    [verificationOutput("stateDerivative", -2, "1/s")]
  ],
  rigidTransform: [
    [verificationOutput("rotatedX", 1, "m")],
    [verificationOutput("rotatedX", -3, "m")]
  ],
  jacobian: [
    [verificationOutput("taskVelocity", 1, "m/s")],
    [verificationOutput("taskVelocity", -0.6, "m/s")]
  ],
  inertia: [
    [verificationOutput("inertia", 0.18, "kg m^2")],
    [verificationOutput("inertia", 0.02, "kg m^2")]
  ],
  bayes: [
    [verificationOutput("posterior", 0.6923, "1")],
    [verificationOutput("posterior", 0.161, "1")]
  ],
  pathCost: [
    [verificationOutput("totalCost", 17, "m")],
    [verificationOutput("totalCost", 14, "1")]
  ],
  neuron: [
    [verificationOutput("affineOutput", 1.9, "1")],
    [verificationOutput("affineOutput", 1, "1")]
  ],
  gradientDescent: [
    [verificationOutput("updatedParameter", 3.4, "1")],
    [verificationOutput("updatedParameter", -0.8, "1")]
  ],
  compression: [
    [verificationOutput("compressionRatio", 4, "1")],
    [verificationOutput("compressionRatio", 1.5, "1")]
  ],
  tradeScore: [
    [verificationOutput("weightedScore", 7.2, "1")],
    [verificationOutput("weightedScore", 7.4, "1")]
  ],
  riskScore: [
    [verificationOutput("riskScore", 12, "1")],
    [verificationOutput("riskScore", 10, "1")]
  ],
  complexMagnitude: [
    [verificationOutput("magnitude", 5, "V")],
    [verificationOutput("magnitude", 13, "ohm")]
  ],
  toleranceStack: [
    [verificationOutput("worstCaseTolerance", 0.35, "mm")],
    [verificationOutput("worstCaseTolerance", 0.4, "mm")]
  ],
  probability: [
    [verificationOutput("probability", 0.2, "1")],
    [verificationOutput("probability", 0.25, "1")]
  ],
  featureMatchRatio: [
    [verificationOutput("matchRatio", 0.5, "1")],
    [verificationOutput("matchRatio", 0.75, "1")]
  ],
  transferMagnitude: [
    [verificationOutput("transferMagnitude", 0.4, "1")],
    [verificationOutput("transferMagnitude", 0.5, "1")]
  ],
  pid: [
    [verificationOutput("command", 3.3, "actuator unit")],
    [verificationOutput("command", 4, "actuator unit")]
  ],
  reliability: [
    [verificationOutput("reliability", 0.9025, "1")],
    [verificationOutput("reliability", 0.9411, "1")]
  ],
  diodeShockley: [
    [verificationOutput("diodeCurrent", 0.022, "mA")],
    [verificationOutput("diodeCurrent", 0.1628, "mA")]
  ],
  kalmanUpdate: [
    [
      verificationOutput("gain", 0.8, "1"),
      verificationOutput("posteriorState", 2.8, "m"),
      verificationOutput("posteriorVariance", 0.8, "m^2")
    ],
    [
      verificationOutput("gain", 0.25, "1"),
      verificationOutput("posteriorState", 11, "deg"),
      verificationOutput("posteriorVariance", 0.75, "deg^2")
    ]
  ],
  extendedKalmanUpdate: [
    [
      verificationOutput("observationJacobian", 4, "m"),
      verificationOutput("innovationCovariance", 5, "m^4"),
      verificationOutput("gain", 0.2, "1/m"),
      verificationOutput("posteriorState", 2.2, "m")
    ],
    [
      verificationOutput("observationJacobian", 6, "m"),
      verificationOutput("innovationCovariance", 6.12, "m^4"),
      verificationOutput("gain", 0.1569, "1/m"),
      verificationOutput("posteriorState", 2.922, "m")
    ]
  ]
} satisfies Record<
  AcademyFormulaKey,
  readonly [
    readonly FormulaExampleVerificationOutputSeed[],
    readonly FormulaExampleVerificationOutputSeed[]
  ]
>;

export interface AcademyStageUnitSeed {
  unitId: string;
  focuses: readonly [string, string, string, string, string, string, string];
  formulaKeys: readonly [
    AcademyFormulaKey | null,
    AcademyFormulaKey | null,
    AcademyFormulaKey | null,
    AcademyFormulaKey | null,
    AcademyFormulaKey | null,
    AcademyFormulaKey | null,
    AcademyFormulaKey | null
  ];
}

interface AcademyUnitTeachingContext {
  systemContext: string;
  failurePattern: string;
  applicationTask: string;
  visualModel: string;
}

const academyUnitTeachingContexts: Record<string, AcademyUnitTeachingContext> = {
  "EML-E0-D01": {
    systemContext: "The working system is the learner's evidence loop: a question drives retrieval or practice, feedback exposes a gap and delayed review tests whether the capability persists.",
    failurePattern: "Familiarity is mistaken for recall, or activity is counted without a changed explanation, test result or retained decision.",
    applicationTask: "Design one short retrieval-build-review cycle and compare the later response with the first attempt.",
    visualModel: "A closed loop links question, unaided retrieval, bounded practice, feedback, retained evidence and delayed review."
  },
  "EML-E0-D02": {
    systemContext: "A measurement chain starts with a physical quantity, passes through an instrument and method, and ends as a value, unit, uncertainty and decision.",
    failurePattern: "Resolution, repeatability and accuracy are treated as synonyms, or a converted number loses its unit and justified precision.",
    applicationTask: "Measure or simulate one quantity repeatedly, reconcile units and retain the raw values, reference, calculation and uncertainty boundary.",
    visualModel: "A traceable chain runs from measurand through instrument and calibration model to reported value, uncertainty and acceptance criterion."
  },
  "EML-E0-D03": {
    systemContext: "Algebra and geometry are representations of the same physical relationship; symbols, axes and frames must stay attached to their definitions as the representation changes.",
    failurePattern: "An equation is rearranged without preserving equality, or vector components from different frames are combined as though their axes were identical.",
    applicationTask: "Transform a bounded position or force case between two frames and reconstruct the original result as an independent check.",
    visualModel: "Two labelled coordinate frames show a vector, its components, the transformation and a round-trip consistency check."
  },
  "EML-E1-D04": {
    systemContext: "Mathematical models connect local change, accumulation, coupled variables and sampled evidence to a declared engineering quantity and operating domain.",
    failurePattern: "A symbolic operation is applied without checking domain, initial conditions, dimensions or whether the numerical result matches the modelled trend.",
    applicationTask: "Compare an analytic relationship with a numerical or graphical check at a stated operating point and explain any discrepancy.",
    visualModel: "Linked views show a function, its local slope, accumulated area, matrix transformation and the evidence range over which each interpretation applies."
  },
  "EML-E1-D05": {
    systemContext: "A physical model begins with a body or control volume, identifies exchanges of force, energy, heat, charge or momentum and then applies the relevant conservation law.",
    failurePattern: "The boundary omits an interaction, a scalar calculation hides a vector direction or an ideal law is used outside its material, thermal or field assumptions.",
    applicationTask: "Draw the boundary for one low-energy system, calculate or predict its response and identify the observation that would disconfirm the model.",
    visualModel: "A free-body and energy-flow view labels the system boundary, stored quantities, inputs, losses and observable outputs."
  },
  "EML-E1-D06": {
    systemContext: "Reproducible computing is a dependency graph joining source, data, configuration, environment, command and output under a versioned evidence trail.",
    failurePattern: "An implicit path, mutable dependency, undocumented command or excessive permission makes a result work only on the author's machine.",
    applicationTask: "Re-run one bounded computation from a clean stated starting point and record every input, command, version and output hash or comparison.",
    visualModel: "A provenance graph connects repository state, environment, inputs and command to an output, test result and reviewable record."
  },
  "EML-E1-D07": {
    systemContext: "Engineering software turns requirements into data structures, control flow, state transitions and interfaces whose failures must remain observable and testable.",
    failurePattern: "Hidden state, unchecked input, unclear ownership or timing-dependent behaviour makes the same nominal action produce different outcomes.",
    applicationTask: "Reduce one behaviour to explicit inputs, states and outputs, then preserve a failing case as a deterministic test.",
    visualModel: "A combined data-flow and state diagram shows validated input, pure transformations, controlled state, side effects and test observation points."
  },
  "EML-E1-D08": {
    systemContext: "A design definition joins functional interfaces, datums, parameters, tolerances, material and process limits so geometry remains manufacturable and inspectable.",
    failurePattern: "Nominal geometry looks correct while design intent, datum precedence, tolerance accumulation or tool access makes the part ambiguous or infeasible.",
    applicationTask: "Create or inspect a parametric mount, vary a controlling dimension and verify clearances, tolerance decisions and drawing communication.",
    visualModel: "A datum-led drawing links functional interfaces to constrained parameters, tolerance zones, manufacturing access and inspection points."
  },
  "EML-E2-D09": {
    systemContext: "Mechanical elements form a load path from applied duty through structure, joints and transmission to supports, with deformation, wear and failure limits at each interface.",
    failurePattern: "A component is selected by catalogue label or static rating without reconciling load direction, duty, fatigue, alignment, lubrication or service conditions.",
    applicationTask: "Trace one drivetrain or structure load path, size the governing element and test sensitivity to an uncertain duty or material input.",
    visualModel: "A load-path diagram connects duty, forces and moments to stress, deformation, transmission losses, supports and candidate failure modes."
  },
  "EML-E2-D10": {
    systemContext: "Manufacturing transforms material through a process window whose capability, geometry, quantity, quality checks and lifecycle effects constrain the design.",
    failurePattern: "A process is chosen from shape alone while tolerance, access, shrinkage, anisotropy, workholding, inspection or volume makes it unsuitable.",
    applicationTask: "Compare two credible process routes for one part using explicit geometry, tolerance, quantity, cost and verification criteria.",
    visualModel: "A process-selection matrix connects part requirements to process window, tooling, defects, inspection and lifecycle consequences."
  },
  "EML-E2-D11": {
    systemContext: "An electrical system routes charge and energy through sources, networks, switching devices, loads and protection while node voltages and branch currents obey shared sign conventions.",
    failurePattern: "A memorised device rule replaces a circuit boundary, or voltage, current, phase, power and component ratings are mixed across different operating points.",
    applicationTask: "Analyse or simulate one low-voltage circuit at nominal and fault conditions and reconcile node, loop, power and protection evidence.",
    visualModel: "A circuit-energy view labels source, nodes, branch currents, stored energy, switching states, load and fault-clearing path."
  },
  "EML-E2-D12": {
    systemContext: "Instrumentation maps a measurand through transduction, conditioning, conversion, calibration and timestamped storage, with uncertainty and fault flags propagated along the chain.",
    failurePattern: "A precise digital code is treated as an accurate measurement despite clipping, loading, reference error, aliasing, drift or calibration residuals.",
    applicationTask: "Build or inspect a sensor-logger chain, test endpoints and one injected fault, then report calibration residuals and uncertainty limits.",
    visualModel: "A signal-chain block diagram carries units, range, bandwidth, resolution and uncertainty from measurand to engineering value."
  },
  "EML-E2-D13": {
    systemContext: "A microcontroller system coordinates registers, peripherals, interrupts, tasks and memory ownership against electrical and timing constraints.",
    failurePattern: "An interrupt, buffer or shared peripheral has unclear ownership, unbounded work or an unsafe reset state that appears only under timing stress.",
    applicationTask: "Trace one input event through peripheral, interrupt or polling, state update and output, then measure latency and exercise a boundary case.",
    visualModel: "A timing lane aligns hardware event, register state, interrupt, task, buffer ownership and observable output."
  },
  "EML-E2-D14": {
    systemContext: "Automation and communication systems turn field state into authorised actions through scans, state machines, interlocks, alarms and typed messages.",
    failurePattern: "Only the normal sequence is modelled, leaving reset, timeout, stale data, invalid state, lost communication or de-energised behaviour undefined.",
    applicationTask: "Run a nominal and injected-fault sequence, verify every transition and retain alarm, interlock, timing and recovery evidence.",
    visualModel: "A state-and-message diagram joins field I/O, controller scan, guarded transitions, HMI alarm, network exchange and safe state."
  },
  "EML-E2-D15": {
    systemContext: "A signal-processing chain links a physical bandwidth to sampling, finite records, transforms, filtering and a downstream estimation or control decision.",
    failurePattern: "A smooth plot is accepted without checking aliasing, filter phase, windowing, noise, excitation or whether the signal contains the information needed by the model.",
    applicationTask: "Generate or inspect one bounded signal, vary sample rate or filter choice and compare time, frequency and reconstruction evidence.",
    visualModel: "Parallel time and frequency views connect physical signal, sampler, spectrum, filter response and reconstructed or identified output."
  },
  "EML-E2-D16": {
    systemContext: "A feedback system closes the path from plant state through sensing, estimation and controller to actuator, with delay, saturation, noise and uncertainty inside the loop.",
    failurePattern: "Controller gains are tuned from one attractive response while stability margin, disturbance rejection, sampling, saturation or model error remains untested.",
    applicationTask: "Compare baseline and revised controller cases against stated transient, steady-state, effort and disturbance criteria.",
    visualModel: "A closed-loop block diagram overlays reference, error, controller, actuator limits, plant, sensor, disturbance and measured response."
  },
  "EML-E3-D17": {
    systemContext: "Robot motion emerges from an ordered chain of frames, joints, links, actuators and contacts that connects geometry to velocity, force and power.",
    failurePattern: "Quantities expressed in different frames or sign conventions are combined, or a kinematic result is accepted without singularity, load or actuator checks.",
    applicationTask: "Model one mobile or manipulator motion, reconcile frame transformations and verify a predicted pose, velocity or load against a second method.",
    visualModel: "A robot chain labels base and tool frames, joint variables, Jacobian direction, loads, transmission and reachable safe motion."
  },
  "EML-E3-D18": {
    systemContext: "A ROS 2 system is a distributed typed graph whose packages, interfaces, names, quality of service, frames, robot model and simulated hardware must agree.",
    failurePattern: "Matching topic names are assumed to guarantee communication while type, quality of service, lifecycle, frame, model or simulated-time contracts disagree.",
    applicationTask: "Inspect a small ROS 2 graph or simulation, trace one command-to-observation path and diagnose an injected interface, frame or timing mismatch.",
    visualModel: "A ROS graph connects nodes, typed topics, services or actions, TF frames, URDF links, simulated sensors and diagnostic evidence."
  },
  "EML-E3-D19": {
    systemContext: "State estimation combines a motion model, uncertain prior and timestamped observations while carrying covariance that states how much trust the result deserves.",
    failurePattern: "A visually smooth estimate is called accurate even when noise, covariance, bias, timing or innovation statistics contradict the claimed uncertainty.",
    applicationTask: "Fuse two bounded sensor streams, vary their stated uncertainty and compare estimate, covariance and residual behaviour with held-out truth.",
    visualModel: "A predict-update loop shows prior state and covariance, motion model, observation, innovation, gain, posterior and consistency check."
  },
  "EML-E3-D20": {
    systemContext: "Autonomy closes sensing, estimation, mapping, planning and motion control around a robot moving through uncertain geometry and recoverable failures.",
    failurePattern: "One successful route is treated as robust navigation despite drift, map resolution, cost design, obstacle changes, recovery behaviour or repeatability.",
    applicationTask: "Run repeated bounded missions, compare truth and estimate, retain path and recovery metrics and diagnose at least one failed run.",
    visualModel: "A navigation loop links sensors, pose estimate, map and costmap, planner, trajectory controller, robot motion and recovery state."
  },
  "EML-E3-D21": {
    systemContext: "Vision converts light and scene geometry into sampled pixels, calibrated rays, features, depth or pose and finally a robot decision.",
    failurePattern: "A pixel measurement is treated as a world measurement without calibration, scale, distortion, viewpoint, ambiguity, uncertainty or latency.",
    applicationTask: "Calibrate or simulate a camera geometry case, predict an image or pose quantity and validate residual error across more than one view.",
    visualModel: "A projection diagram traces world point through camera frame and lens model to pixel, feature match, pose estimate and uncertainty."
  },
  "EML-E3-D22": {
    systemContext: "A machine-learning claim is a versioned pipeline from authorised data and labels through features, split, baseline, training and held-out decision metrics.",
    failurePattern: "A high score is assumed to generalise while leakage, class balance, threshold, operating mode, drift or an unreconciled denominator changes its meaning.",
    applicationTask: "Build a transparent baseline on a declared split, reconcile every metric to counts or residuals and state the decision boundary and limitations.",
    visualModel: "A leakage-aware pipeline separates source data, preparation, train and validation work, locked test data, metrics, residuals and deployment limits."
  },
  "EML-E3-D23": {
    systemContext: "A learned robot component sits inside a timed sensing-decision-action loop with model artefacts, compute limits, fallback behaviour and monitored operating conditions.",
    failurePattern: "A notebook metric is treated as deployable capability without testing latency, memory, shift, uncertainty, unsafe outputs or a deterministic fallback.",
    applicationTask: "Benchmark one small model or supplied result for accuracy, latency, memory and a changed-condition case, then define the fallback trigger.",
    visualModel: "An edge-AI loop connects sensor, preprocessing, versioned model, decision threshold, robot action, monitor and safe fallback."
  },
  "EML-E4-D24": {
    systemContext: "Systems engineering maintains traceability from stakeholder need through requirements, architecture and interfaces to risk controls, verification and readiness evidence.",
    failurePattern: "A document, analysis or test is treated as complete because it exists even though identities, interfaces, assumptions, coverage or acceptance results do not reconcile.",
    applicationTask: "Build a small traceability slice from need to requirement, architecture, risk and test, then challenge it with one changed assumption.",
    visualModel: "A traceability graph links need, requirement, function, interface, design element, hazard, verification method, result and unresolved limitation."
  },
  "EML-E4-D25": {
    systemContext: "Professional proof connects a bounded capability claim to personal contribution, decision records, reproducible artefacts, verified results and acknowledged limitations.",
    failurePattern: "A polished narrative inflates participation or intent into competence while scope, authority, evidence, uncertainty or reproducibility remains unclear.",
    applicationTask: "Prepare one capstone or portfolio claim, attach its strongest artefact and test result, then state contribution, limitation and next disconfirming check.",
    visualModel: "An evidence chain runs from project scope and decision through authored artefact and verification result to a bounded capability claim."
  }
};

interface AcademyCodeAnalysisCase {
  language: string;
  code: string;
  prompt: string;
  choices: readonly [string, string, string];
  correctChoice: 0 | 1 | 2;
  explanation: string;
}

interface AcademyCodeAnalysisSeed extends AcademyCodeAnalysisCase {
  retry: AcademyCodeAnalysisCase;
}

const academyCodeChoiceSuffixes = ["A", "B", "C"] as const;

const academyCodeAnalysisSeeds: Record<string, AcademyCodeAnalysisSeed> = {
  "EML-E1-D07-L01": {
    language: "python3",
    code: "samples = [2, 4, 6]\nmean = sum(samples) / len(samples)\nprint(mean)",
    prompt: "What deterministic output does this Python program produce?",
    choices: ["4.0", "6", "A division-by-zero error"],
    correctChoice: 0,
    explanation: "The samples sum to 12, their count is 3 and Python true division returns 4.0.",
    retry: {
      language: "python3",
      code: "samples = [3, 5, 7, 9]\nmean = sum(samples) / len(samples)\nprint(mean)",
      prompt: "What deterministic output does this changed Python case produce?",
      choices: ["5.0", "6.0", "24"],
      correctChoice: 1,
      explanation: "The changed samples sum to 24, their count is 4 and Python true division returns 6.0."
    }
  },
  "EML-E1-D07-L02": {
    language: "cpp17",
    code: "#include <iostream>\n#include <vector>\n\nint main() {\n  const std::vector<int> values{1, 2, 3};\n  int total = 0;\n  for (const int value : values) total += value;\n  std::cout << total;\n}",
    prompt: "Assuming a conforming C++ compiler, what does this program write?",
    choices: ["3", "6", "123"],
    correctChoice: 1,
    explanation: "The range loop adds 1, then 2, then 3 to total, so the emitted integer is 6.",
    retry: {
      language: "cpp17",
      code: "#include <iostream>\n#include <vector>\n\nint main() {\n  const std::vector<int> values{2, 4, 8};\n  int total = 0;\n  for (const int value : values) total += value;\n  std::cout << total;\n}",
      prompt: "Assuming a conforming C++ compiler, what does this changed program write?",
      choices: ["8", "14", "248"],
      correctChoice: 1,
      explanation: "The range loop adds 2, then 4, then 8 to total, so the emitted integer is 14."
    }
  },
  "EML-E1-D07-L05": {
    language: "python3",
    code: "def clamp(value, lower, upper):\n    return max(lower, min(value, upper))\n\nprint(clamp(12, 0, 10))",
    prompt: "Which boundary result is printed by this test case?",
    choices: ["0", "10", "12"],
    correctChoice: 1,
    explanation: "The inner minimum limits 12 to the upper bound 10, and the outer maximum leaves 10 above the lower bound.",
    retry: {
      language: "python3",
      code: "def clamp(value, lower, upper):\n    return max(lower, min(value, upper))\n\nprint(clamp(-4, 0, 10))",
      prompt: "Which boundary result is printed by the changed lower-bound case?",
      choices: ["-4", "0", "10"],
      correctChoice: 1,
      explanation: "The inner minimum leaves -4 below the upper bound, then the outer maximum raises it to the lower bound 0."
    }
  },
  "EML-E1-D07-L06": {
    language: "python3",
    code: "state = \"IDLE\"\nevent = \"START\"\nif state == \"IDLE\" and event == \"START\":\n    state = \"RUN\"\nprint(state)",
    prompt: "Which state is observable after this explicit transition?",
    choices: ["IDLE", "RUN", "START"],
    correctChoice: 1,
    explanation: "Both guard conditions are true, so the assignment changes state from IDLE to RUN before it is printed.",
    retry: {
      language: "python3",
      code: "state = \"RUN\"\nevent = \"STOP\"\nif state == \"RUN\" and event == \"STOP\":\n    state = \"IDLE\"\nprint(state)",
      prompt: "Which state is observable after this changed explicit transition?",
      choices: ["RUN", "IDLE", "STOP"],
      correctChoice: 1,
      explanation: "Both changed guard conditions are true, so the assignment moves the state from RUN to IDLE before printing."
    }
  },
  "EML-E2-D13-L02": {
    language: "c11",
    code: "#include <stdint.h>\n\nuint32_t output_register = 0x2u;\noutput_register |= (1u << 2);",
    prompt: "Under ISO C11 unsigned-integer semantics, what hexadecimal value remains in output_register after the bit-set operation?",
    choices: ["0x2", "0x4", "0x6"],
    correctChoice: 2,
    explanation: "One shifted left by two is hexadecimal 0x4; bitwise OR preserves the existing 0x2 bit and sets the new bit, giving 0x6.",
    retry: {
      language: "c11",
      code: "#include <stdint.h>\n\nuint32_t output_register = 0x8u;\noutput_register |= (1u << 1);",
      prompt: "Under ISO C11 unsigned-integer semantics, what hexadecimal value remains after this changed bit-set operation?",
      choices: ["0x2", "0x8", "0xA"],
      correctChoice: 2,
      explanation: "One shifted left by one is hexadecimal 0x2; bitwise OR preserves 0x8 and sets 0x2, giving 0xA."
    }
  },
  "EML-E2-D13-L03": {
    language: "c11",
    code: "unsigned int on_ticks = 250u;\nunsigned int period_ticks = 1000u;\nunsigned int duty_percent = (on_ticks / period_ticks) * 100u;",
    prompt: "What value does integer arithmetic assign to duty_percent?",
    choices: ["0", "25", "250"],
    correctChoice: 0,
    explanation: "Unsigned integer division evaluates 250/1000 as zero before multiplication, exposing a numeric-representation defect.",
    retry: {
      language: "c11",
      code: "unsigned int on_ticks = 250u;\nunsigned int period_ticks = 1000u;\nunsigned int duty_percent = (100u * on_ticks) / period_ticks;",
      prompt: "What value does the changed integer-expression order assign to duty_percent?",
      choices: ["0", "25", "250"],
      correctChoice: 1,
      explanation: "Multiplication produces 25000 before integer division by 1000, so duty_percent becomes 25."
    }
  },
  "EML-E2-D13-L06": {
    language: "cpp17",
    code: "#include <atomic>\n\nstd::atomic<int> completed{0};\ncompleted.fetch_add(1);\nconst int snapshot = completed.load();",
    prompt: "What deterministic value is stored in snapshot after the atomic increment?",
    choices: ["0", "1", "The value is undefined"],
    correctChoice: 1,
    explanation: "The atomic starts at zero, fetch_add increments it once and load observes the resulting value one.",
    retry: {
      language: "cpp17",
      code: "#include <atomic>\n\nstd::atomic<int> completed{1};\ncompleted.fetch_add(2);\nconst int snapshot = completed.load();",
      prompt: "What deterministic value is stored in snapshot after this changed atomic update?",
      choices: ["1", "2", "3"],
      correctChoice: 2,
      explanation: "The atomic starts at one, fetch_add adds two and load observes the resulting value three."
    }
  }
};

interface AcademyMatchingSeed {
  prompt: string;
  pairs: readonly [
    readonly [left: string, right: string],
    readonly [left: string, right: string],
    readonly [left: string, right: string]
  ];
  explanation: string;
}

const academyMatchingSeeds: Readonly<Record<string, AcademyMatchingSeed>> = {
  "EML-E0-D02-L03": {
    prompt: "Match each engineering quantity to its coherent SI unit.",
    pairs: [
      ["Mass", "kilogram"],
      ["Force", "newton"],
      ["Power", "watt"]
    ],
    explanation: "Mass uses kilograms, force uses newtons and power uses watts in coherent SI notation."
  },
  "EML-E1-D08-L04": {
    prompt: "Match each fit class to the possible relationship between mating feature limits.",
    pairs: [
      ["Clearance fit", "A gap remains across the allowed limits"],
      ["Transition fit", "The limits can produce either clearance or interference"],
      ["Interference fit", "The mating features overlap across the allowed limits"]
    ],
    explanation: "The fit class follows from the relative hole and shaft limit zones, not from nominal size alone."
  },
  "EML-E2-D14-L05": {
    prompt: "Match each communications technology to its characteristic data model.",
    pairs: [
      ["Modbus", "Addressed coils and registers"],
      ["MQTT", "Publish and subscribe topics"],
      ["OPC UA", "Typed interoperable information model"]
    ],
    explanation: "Modbus exchanges addressed values, MQTT routes topic messages and OPC UA carries typed information models."
  },
  "EML-E3-D19-L05": {
    prompt: "Match each Kalman-filter term to its role in one estimate cycle.",
    pairs: [
      ["Prediction", "Propagate the prior state and covariance through the process model"],
      ["Innovation", "Compare the measurement with the predicted observation"],
      ["Update", "Use the gain to form the posterior state and covariance"]
    ],
    explanation: "Prediction establishes the prior, innovation exposes the measurement residual and update produces the posterior."
  },
  "EML-E4-D25-L03": {
    prompt: "Match each professional obligation to the evidence expected in an engineering decision.",
    pairs: [
      ["Competence", "Work within demonstrated capability and seek support beyond it"],
      ["Integrity", "Represent methods, results, limits and contribution truthfully"],
      ["Sustainability", "Account for lifecycle resource and consequence trade-offs"]
    ],
    explanation: "Professional responsibility connects competence, truthful evidence and lifecycle consequences to the decision."
  }
};

const allLessonIds = academyUnits.flatMap((unit) => unit.lessonIds);

interface SeededCalculationAuthoring {
  prompt: string;
  promptMath: AcademyReviewedMath;
  generator: {
    algorithm: "linear-scale";
    minimum: number;
    maximum: number;
    step: number;
    coefficient: number;
    offset: number;
  };
  canonicalUnit: string;
  acceptedUnits: Record<string, number>;
  absoluteTolerance: number;
  resultPlainText: string;
  resultLatex: string;
  resultSpoken: string;
}

const academySeededCalculationAuthoring: Readonly<
  Record<string, SeededCalculationAuthoring>
> = {
  "EML-E0-D02-L07": {
    prompt: "A calibrated pressure sensor receives {{input}} kPa. Its sensitivity is 0.25 volts per kilopascal and its zero-input offset is 0.50 volts. Calculate the output voltage.",
    promptMath: reviewedMath(
      "EML-E0-D02-L07-Q06-PROMPT-MATH",
      "y = (0.25 V/kPa)({{input}} kPa) + 0.50 V",
      String.raw`y=\left(0.25\,\frac{\mathrm{V}}{\mathrm{kPa}}\right)\left({{input}}\,\mathrm{kPa}\right)+0.50\,\mathrm{V}`,
      "The sensor output y equals 0.25 volts per kilopascal multiplied by the generated input {{input}} kilopascals, plus 0.50 volts."
    ),
    generator: {
      algorithm: "linear-scale",
      minimum: 4,
      maximum: 20,
      step: 2,
      coefficient: 0.25,
      offset: 0.5
    },
    canonicalUnit: "V",
    acceptedUnits: { mV: 0.001 },
    absoluteTolerance: 0.001,
    resultPlainText: "y = {{expected}} V",
    resultLatex: String.raw`y={{expected}}\,\mathrm{V}`,
    resultSpoken: "The verified output y is {{expected}} volts."
  },
  "EML-E2-D12-L02": {
    prompt: "An instrumentation chain receives {{input}} kPa from a calibrated pressure reference. Its sensitivity is 0.25 volts per kilopascal and its offset is 0.50 volts. Calculate the recorded voltage.",
    promptMath: reviewedMath(
      "EML-E2-D12-L02-Q06-PROMPT-MATH",
      "y = (0.25 V/kPa)({{input}} kPa) + 0.50 V",
      String.raw`y=\left(0.25\,\frac{\mathrm{V}}{\mathrm{kPa}}\right)\left({{input}}\,\mathrm{kPa}\right)+0.50\,\mathrm{V}`,
      "The instrumentation output y equals 0.25 volts per kilopascal multiplied by the generated input {{input}} kilopascals, plus 0.50 volts."
    ),
    generator: {
      algorithm: "linear-scale",
      minimum: 2,
      maximum: 18,
      step: 2,
      coefficient: 0.25,
      offset: 0.5
    },
    canonicalUnit: "V",
    acceptedUnits: { mV: 0.001 },
    absoluteTolerance: 0.001,
    resultPlainText: "y = {{expected}} V",
    resultLatex: String.raw`y={{expected}}\,\mathrm{V}`,
    resultSpoken: "The verified instrumentation output y is {{expected}} volts."
  },
  "EML-E2-D12-L03": {
    prompt: "A signal-conditioning stage receives {{input}} mV. It produces 0.10 volts per millivolt of input and adds a 0.50 volt offset. Calculate the conditioned output.",
    promptMath: reviewedMath(
      "EML-E2-D12-L03-Q06-PROMPT-MATH",
      "y = (0.10 V/mV)({{input}} mV) + 0.50 V",
      String.raw`y=\left(0.10\,\frac{\mathrm{V}}{\mathrm{mV}}\right)\left({{input}}\,\mathrm{mV}\right)+0.50\,\mathrm{V}`,
      "The conditioned output y equals 0.10 volts per millivolt multiplied by the generated input {{input}} millivolts, plus 0.50 volts."
    ),
    generator: {
      algorithm: "linear-scale",
      minimum: 5,
      maximum: 45,
      step: 5,
      coefficient: 0.1,
      offset: 0.5
    },
    canonicalUnit: "V",
    acceptedUnits: { mV: 0.001 },
    absoluteTolerance: 0.001,
    resultPlainText: "y = {{expected}} V",
    resultLatex: String.raw`y={{expected}}\,\mathrm{V}`,
    resultSpoken: "The verified conditioned output y is {{expected}} volts."
  }
};

const academyNumericResultUnitLatex: Readonly<Record<string, string>> =
  Object.freeze({
    "1": "",
    "1/s": String.raw`\mathrm{s^{-1}}`,
    Hz: String.raw`\mathrm{Hz}`,
    MPa: String.raw`\mathrm{MPa}`,
    N: String.raw`\mathrm{N}`,
    V: String.raw`\mathrm{V}`,
    "V/kPa": String.raw`\mathrm{V\,kPa^{-1}}`,
    W: String.raw`\mathrm{W}`,
    kg: String.raw`\mathrm{kg}`,
    "kg m^2": String.raw`\mathrm{kg\,m^2}`,
    m: String.raw`\mathrm{m}`,
    "m/s": String.raw`\mathrm{m\,s^{-1}}`,
    mA: String.raw`\mathrm{mA}`,
    mm: String.raw`\mathrm{mm}`,
    px: String.raw`\mathrm{px}`,
    s: String.raw`\mathrm{s}`
  });

const reviewedFixedQuestionPromptInstruction = (
  id: string,
  template: FormulaTemplate,
  label: string
): AcademyInstruction => [
  {
    kind: "text",
    text: `${label}:`
  },
  ...buildAcademyReviewedInstruction(
    `${id}-CASE`,
    template.numericPrompt,
    `${label.toLocaleLowerCase("en-AU")} numeric question`
  ),
  ...reviewedFormulaInstruction(`${id}-FORMULA`, template)
];

const reviewedFixedQuestionResultInstruction = (
  id: string,
  value: number,
  canonicalUnit: string
): AcademyInstruction => {
  const unitLatex = academyNumericResultUnitLatex[canonicalUnit];
  if (unitLatex === undefined) {
    throw new Error(
      `Missing explicit numeric-result unit authoring for "${canonicalUnit}".`
    );
  }
  const valueText = String(value);
  if (!/^-?\d+(?:\.\d+)?$/u.test(valueText)) {
    throw new Error(
      `Numeric result "${valueText}" requires explicit scientific-notation authoring.`
    );
  }
  const plainText = canonicalUnit === "1"
    ? valueText
    : `${valueText} ${canonicalUnit}`;
  return [
    { kind: "text", text: "Verified result:" },
    {
      kind: "math",
      expression: reviewedMath(
        id,
        plainText,
        unitLatex ? `${valueText}\\,${unitLatex}` : valueText,
        `The verified result is ${plainText}.`,
        false
      )
    }
  ];
};

const fixedQuestionMathSupport = (
  questionIdValue: string,
  template: FormulaTemplate
): AcademyQuestionMathSupport => ({
  prompt: reviewedFixedQuestionPromptInstruction(
    `${questionIdValue}-PROMPT-MATH`,
    template,
    "Practice case"
  ),
  hints: [
    reviewedFormulaInstruction(`${questionIdValue}-HINT-01-MATH`, template),
    null,
    null
  ],
  solution: [
    reviewedFormulaInstruction(`${questionIdValue}-SOLUTION-01-MATH`, template),
    reviewedFixedQuestionPromptInstruction(
      `${questionIdValue}-SOLUTION-02-MATH`,
      template,
      "Substitution case"
    ),
    reviewedFixedQuestionResultInstruction(
      `${questionIdValue}-SOLUTION-03-MATH`,
      template.numericExpected,
      template.canonicalUnit
    )
  ]
});

const seededQuestionMathSupport = (
  questionIdValue: string,
  template: FormulaTemplate,
  seed: SeededCalculationAuthoring
): AcademyQuestionMathSupport => ({
  prompt: [{ kind: "math", expression: seed.promptMath }],
  hints: [
    reviewedFormulaInstruction(`${questionIdValue}-HINT-01-MATH`, template),
    null,
    null
  ],
  solution: [
    reviewedFormulaInstruction(`${questionIdValue}-SOLUTION-01-MATH`, template),
    [{
      kind: "math",
      expression: {
        ...seed.promptMath,
        id: `${questionIdValue}-SOLUTION-02-MATH`
      }
    }],
    [{
      kind: "math",
      expression: reviewedMath(
        `${questionIdValue}-SOLUTION-03-MATH`,
        seed.resultPlainText,
        seed.resultLatex,
        seed.resultSpoken
      )
    }]
  ]
});

const diagramDistractorLabels = (
  title: string,
  teachingContext: AcademyUnitTeachingContext
) => ({
  basePremature:
    `Premature path for "${title}": ${teachingContext.applicationTask} -> accept the decision before checking the lesson criterion.`,
  baseFailureAsEvidence:
    `Reversed path for "${title}": ${teachingContext.failurePattern} -> treat the failure itself as confirming evidence.`,
  retryPremature:
    `Unchecked retry for "${title}": ${teachingContext.applicationTask} -> retain the decision even when the observation matches this failure: ${teachingContext.failurePattern}`,
  retryModelOnly:
    `Model-only retry for "${title}": ${teachingContext.visualModel} -> remove the observable output and infer acceptance from the diagram alone.`
});

const diagramVariantIndex = (questionIdValue: string, mode: "base" | "retry"): number =>
  (
    Array.from(questionIdValue).reduce(
      (total, character) => total + character.codePointAt(0)!,
      mode === "base" ? 0 : 1
    )
  ) % 3;

const diagramRelationshipLabel = (
  diagram: AcademyDiagramStructure,
  edgeId: string
): string => {
  const edge = diagram.edges.find((candidate) => candidate.id === edgeId);
  if (!edge) throw new Error(`Diagram answer edge ${edgeId} is not defined.`);
  const from = diagram.nodes.find((node) => node.id === edge.fromNodeId);
  const to = diagram.nodes.find((node) => node.id === edge.toNodeId);
  if (!from || !to) {
    throw new Error(`Diagram edge ${edge.id} does not resolve to authored nodes.`);
  }
  const connector = edge.direction === "directed" ? "->" : "<->";
  return `${from.label} ${connector} ${edge.label} ${connector} ${to.label}.`;
};

const diagramTextEquivalent = (
  diagram: AcademyDiagramStructure,
  teachingContext: AcademyUnitTeachingContext,
  mode: "base" | "retry"
): string => {
  const relationships = diagram.edges
    .map((edge) => diagramRelationshipLabel(diagram, edge.id))
    .join(" ");
  return mode === "base"
    ? `${teachingContext.visualModel} The ${diagram.layout} relationship map has ${diagram.nodes.length} labelled nodes. Relationships in reading order: ${relationships}`
    : `${teachingContext.visualModel} The retry map exposes this disconfirming case: ${teachingContext.failurePattern} It has ${diagram.nodes.length} labelled nodes. Relationships in reading order: ${relationships}`;
};

const buildDiagramStructure = (
  questionIdValue: string,
  title: string,
  teachingContext: AcademyUnitTeachingContext,
  mode: "base" | "retry"
): AcademyDiagramStructure => {
  const titleLabel = `"${title}"`;
  const node = (
    role: "system" | "application" | "relationship" | "failure" | "decision",
    label: string,
    detail: string
  ) => ({
    id: `${questionIdValue}-NODE-${role.toLocaleUpperCase("en-AU")}`,
    label,
    detail,
    role
  });
  const availableNodes = {
    system: node(
      "system",
      `${title} system boundary`,
      teachingContext.systemContext
    ),
    application: node(
      "application",
      `${title} bounded application`,
      teachingContext.applicationTask
    ),
    relationship: node(
      "relationship",
      `${title} represented relationship`,
      teachingContext.visualModel
    ),
    failure: node(
      "failure",
      `${title} disconfirming check`,
      teachingContext.failurePattern
    ),
    decision: node(
      "decision",
      `${title} evidence decision`,
      mode === "base"
        ? `${teachingContext.applicationTask} Retain the decision only after comparing the observable result with its criterion.`
        : `Revise the ${titleLabel} decision when the observation exposes this failure: ${teachingContext.failurePattern}`
    )
  } as const;
  const edge = (
    suffix: string,
    fromNodeId: string,
    toNodeId: string,
    label: string,
    direction: "directed" | "undirected" = "directed"
  ) => ({
    id: `${questionIdValue}-EDGE-${suffix}`,
    fromNodeId,
    toNodeId,
    label,
    direction
  });
  const variantIndex = diagramVariantIndex(questionIdValue, mode);

  if (mode === "base" && variantIndex === 0) {
    const nodes = [
      availableNodes.system,
      availableNodes.application,
      availableNodes.relationship
    ];
    const edges = [
      edge(
        "BOUND",
        availableNodes.system.id,
        availableNodes.application.id,
        `bounds the ${titleLabel} check`
      ),
      edge(
        "REPRESENT",
        availableNodes.application.id,
        availableNodes.relationship.id,
        `produces the reviewed ${titleLabel} relationship`
      )
    ];
    return {
      layout: "chain",
      nodes,
      edges,
      answerEdgeId: edges[1].id
    };
  }

  if (mode === "base" && variantIndex === 1) {
    const nodes = [
      availableNodes.system,
      availableNodes.application,
      availableNodes.relationship,
      availableNodes.failure
    ];
    const edges = [
      edge(
        "BOUND",
        availableNodes.system.id,
        availableNodes.application.id,
        `bounds the ${titleLabel} application`
      ),
      edge(
        "REPRESENT",
        availableNodes.application.id,
        availableNodes.relationship.id,
        `creates the observable ${titleLabel} relationship`
      ),
      edge(
        "CHALLENGE",
        availableNodes.relationship.id,
        availableNodes.failure.id,
        `is challenged by the ${titleLabel} disconfirming case`,
        "undirected"
      )
    ];
    return {
      layout: "branch",
      nodes,
      edges,
      answerEdgeId: edges[2].id
    };
  }

  if (mode === "base") {
    const nodes = [
      availableNodes.system,
      availableNodes.application,
      availableNodes.relationship,
      availableNodes.failure,
      availableNodes.decision
    ];
    const edges = [
      edge(
        "BOUND",
        availableNodes.system.id,
        availableNodes.application.id,
        `bounds the ${titleLabel} application`
      ),
      edge(
        "REPRESENT",
        availableNodes.application.id,
        availableNodes.relationship.id,
        `produces the represented ${titleLabel} relationship`
      ),
      edge(
        "CONSTRAIN",
        availableNodes.system.id,
        availableNodes.failure.id,
        `shares the ${titleLabel} operating boundary with`,
        "undirected"
      ),
      edge(
        "DECIDE",
        availableNodes.relationship.id,
        availableNodes.decision.id,
        `supports the retained ${titleLabel} decision`
      ),
      edge(
        "TEST",
        availableNodes.failure.id,
        availableNodes.decision.id,
        `must be checked before the ${titleLabel} decision`
      )
    ];
    return {
      layout: "convergence",
      nodes,
      edges,
      answerEdgeId: edges[4].id
    };
  }

  if (variantIndex === 0) {
    const nodes = [
      availableNodes.application,
      availableNodes.failure,
      availableNodes.decision
    ];
    const edges = [
      edge(
        "OBSERVE",
        availableNodes.application.id,
        availableNodes.failure.id,
        `exposes the ${titleLabel} failed criterion`
      ),
      edge(
        "REVISE",
        availableNodes.failure.id,
        availableNodes.decision.id,
        `requires revision of the ${titleLabel} decision`
      )
    ];
    return {
      layout: "chain",
      nodes,
      edges,
      answerEdgeId: edges[1].id
    };
  }

  if (variantIndex === 1) {
    const nodes = [
      availableNodes.application,
      availableNodes.relationship,
      availableNodes.failure,
      availableNodes.decision
    ];
    const edges = [
      edge(
        "REPRESENT",
        availableNodes.application.id,
        availableNodes.relationship.id,
        `tests the represented ${titleLabel} relationship`
      ),
      edge(
        "OBSERVE",
        availableNodes.application.id,
        availableNodes.failure.id,
        `exposes the ${titleLabel} disconfirming case`
      ),
      edge(
        "REVIEW",
        availableNodes.relationship.id,
        availableNodes.decision.id,
        `marks the ${titleLabel} model for review`
      ),
      edge(
        "REVISE",
        availableNodes.failure.id,
        availableNodes.decision.id,
        `requires revision of the ${titleLabel} decision`
      )
    ];
    return {
      layout: "branch",
      nodes,
      edges,
      answerEdgeId: edges[3].id
    };
  }

  const nodes = [
    availableNodes.system,
    availableNodes.application,
    availableNodes.relationship,
    availableNodes.failure,
    availableNodes.decision
  ];
  const edges = [
    edge(
      "BOUND",
      availableNodes.system.id,
      availableNodes.application.id,
      `bounds the retry ${titleLabel} application`
    ),
    edge(
      "REPRESENT",
      availableNodes.application.id,
      availableNodes.relationship.id,
      `produces the retry ${titleLabel} relationship`
    ),
    edge(
      "CONSTRAIN",
      availableNodes.system.id,
      availableNodes.failure.id,
      `shares the ${titleLabel} failure boundary with`,
      "undirected"
    ),
    edge(
      "OBSERVE",
      availableNodes.relationship.id,
      availableNodes.failure.id,
      `exposes the ${titleLabel} failed criterion`
    ),
    edge(
      "REVISE",
      availableNodes.failure.id,
      availableNodes.decision.id,
      `requires revision of the ${titleLabel} decision`
    )
  ];
  return {
    layout: "convergence",
    nodes,
    edges,
    answerEdgeId: edges[4].id
  };
};

const withAuthoredRetryVariant = (
  question: AcademyQuestion,
  title: string,
  application: string,
  teachingContext: AcademyUnitTeachingContext,
  firstTerm: string,
  formulaTemplate: FormulaTemplate | null,
  codeAnalysisSeed: AcademyCodeAnalysisSeed | undefined
): AcademyQuestion => {
  if (question.type === "seeded-calculation") return question;
  const retryId = `${question.id}-RETRY-01`;
  const retrySeed = question.variantSeed + 1_009;

  switch (question.type) {
    case "single-choice": {
      const options = [
        {
          id: `${retryId}-ACCEPT`,
          label: `Use ${application.toLocaleLowerCase("en-AU")} to check whether this failure occurs: ${teachingContext.failurePattern}`
        },
        {
          id: `${retryId}-VISIT`,
          label: "Accept the decision because the lesson or tool was opened."
        },
        {
          id: `${retryId}-ASSUME`,
          label: "Accept the decision without recording assumptions or a check."
        }
      ];
      return {
        ...question,
        retryVariants: [{
          ...question,
          retryVariants: [],
          variantSeed: retrySeed,
          prompt: `A peer applies "${title}" to ${teachingContext.systemContext}. Which response tests the lesson-specific failure before accepting the decision?`,
          options,
          correctOptionId: `${retryId}-ACCEPT`,
          feedbackCorrect: "Correct. The retry case ties the decision to an observable result and an explicit criterion.",
          feedbackIncorrect: "A defensible response records assumptions, checks an observable result and compares it with a criterion.",
          misconceptionFeedback: {
            [`${retryId}-VISIT`]: "Opening a lesson or tool is activity, not evidence.",
            [`${retryId}-ASSUME`]: "An unbounded assumption cannot support an independently reviewable decision."
          },
          hints: [
            "Look for the response that another engineer could challenge or reproduce.",
            "The accepted response must include both an observation and a criterion."
          ],
          solution: [
            "Reject page visits and unsupported assumptions as completion evidence.",
            `Use ${application.toLocaleLowerCase("en-AU")} to produce an observable result.`,
            "Compare that result with a stated criterion before accepting the decision."
          ]
        }]
      };
    }
    case "multiple-selection": {
      const options = [
        {
          id: `${retryId}-MISSING`,
          label: `The observed case shows this lesson-specific failure: ${teachingContext.failurePattern}`
        },
        {
          id: `${retryId}-OUTSIDE`,
          label: `The result from ${teachingContext.applicationTask.toLocaleLowerCase("en-AU")} lies outside its stated criterion.`
        },
        {
          id: `${retryId}-TRACEABLE`,
          label: "The inputs, method and observed result form a traceable chain."
        },
        {
          id: `${retryId}-AGREES`,
          label: "An independent check agrees within the stated tolerance."
        }
      ];
      return {
        ...question,
        retryVariants: [{
          ...question,
          retryVariants: [],
          variantSeed: retrySeed,
          prompt: `Which two lesson-specific findings require withholding acceptance of the "${title}" result? Select both.`,
          options,
          correctOptionIds: [
            `${retryId}-MISSING`,
            `${retryId}-OUTSIDE`
          ],
          feedbackCorrect: "Correct. Missing foundations or a result outside its criterion both block acceptance.",
          feedbackIncorrect: "Withhold acceptance for missing assumptions or a failed criterion, not for traceable evidence that passes an independent check.",
          misconceptionFeedback: {
            [`${retryId}-TRACEABLE`]: "A traceable reasoning chain supports review rather than blocking it.",
            [`${retryId}-AGREES`]: "Agreement within a stated tolerance is supporting evidence, subject to the declared scope."
          },
          hints: [
            "Choose conditions that make the conclusion unsupported or failed.",
            "A complete trace and an agreeing independent check are positive evidence."
          ],
          solution: [
            "Withhold acceptance when units or governing assumptions are missing.",
            "Withhold acceptance when the observed result falls outside its criterion.",
            "Do not reject a traceable passing result merely because it has been independently checked."
          ]
        }]
      };
    }
    case "numeric": {
      if (!formulaTemplate) {
        throw new Error(
          `Numeric retry authoring requires a formula template for ${question.id}.`
        );
      }
      const retryExample = formulaTemplate.examples[1];
      const options = [
        {
          id: `${retryId}-REVIEWED`,
          label: retryExample.result
        },
        {
          id: `${retryId}-BASE`,
          label: `${question.expectedValue} ${question.canonicalUnit}, unchanged from the first practice case`
        },
        {
          id: `${retryId}-UNKNOWN`,
          label: "The result cannot be bounded from the stated values and governing relation."
        }
      ];
      return {
        ...question,
        retryVariants: [{
          id: question.id,
          skillIds: [...question.skillIds],
          type: "single-choice",
          retryVariants: [],
          variantSeed: retrySeed,
          prompt: `Solve this second reviewed "${title}" case using the same governing relation: ${retryExample.problem}`,
          options,
          correctOptionId: `${retryId}-REVIEWED`,
          feedbackCorrect: "Correct. The second case follows the same governing relation with a different set of stated values.",
          feedbackIncorrect: "Apply the original governing relation to the second case rather than carrying over the first answer.",
          misconceptionFeedback: {
            [`${retryId}-BASE`]: "A changed case requires a fresh substitution; the first practice answer cannot be copied.",
            [`${retryId}-UNKNOWN`]: "The second case supplies the values needed by the reviewed governing relation."
          },
          hints: [
            formulaTemplate.derivationSteps[0]
              ?? "Start from the reviewed governing relation.",
            retryExample.steps[0]
              ?? "Substitute the second case values in compatible units.",
            retryExample.independentCheck
          ],
          solution: [
            ...retryExample.steps,
            `The reviewed second-case result is ${retryExample.result}.`,
            `Independent check: ${retryExample.independentCheck}`
          ]
        }]
      };
    }
    case "ordering": {
      const items = [
        {
          id: `${retryId}-CRITERION`,
          label: `State the "${title}" acceptance criterion`
        },
        {
          id: `${retryId}-OBSERVE`,
          label: `Perform this bounded check: ${teachingContext.applicationTask}`
        },
        {
          id: `${retryId}-COMPARE`,
          label: "Compare the lesson-specific observation with the criterion"
        },
        {
          id: `${retryId}-RETAIN`,
          label: "Retain the bounded decision, evidence and unresolved limitation"
        }
      ];
      return {
        ...question,
        retryVariants: [{
          ...question,
          retryVariants: [],
          variantSeed: retrySeed,
          prompt: `Order an independent verification pass for ${application.toLocaleLowerCase("en-AU")}.`,
          items,
          correctOrder: [
            `${retryId}-CRITERION`,
            `${retryId}-OBSERVE`,
            `${retryId}-COMPARE`,
            `${retryId}-RETAIN`
          ],
          feedbackCorrect: "Correct. The criterion is set before observation, comparison and evidence retention.",
          feedbackIncorrect: "State the criterion before capturing and comparing the observation; retain evidence only after the comparison.",
          misconceptionFeedback: {
            [`${retryId}-OBSERVE`]: "An observation without a prior criterion invites post-hoc acceptance.",
            [`${retryId}-RETAIN`]: "Evidence cannot be retained as an accepted decision before the comparison."
          },
          hints: [
            "Set the acceptance boundary before observing the result.",
            "Comparison precedes the retained decision."
          ],
          solution: [
            "State the acceptance criterion.",
            "Capture an independent observation.",
            "Compare the observation with the criterion.",
            "Retain the decision and supporting evidence."
          ]
        }]
      };
    }
    case "matching": {
      const resolvedPairs = question.left.map((left, index) => {
        const sourceRightId = question.correctPairs[left.id];
        const sourceRight = question.right.find(
          (candidate) => candidate.id === sourceRightId
        );
        if (!sourceRight) {
          throw new Error(`Retry authoring could not resolve match ${question.id}:${left.id}.`);
        }
        return {
          left: {
            id: `${retryId}-LEFT-${index + 1}`,
            label: sourceRight.label
          },
          right: {
            id: `${retryId}-RIGHT-${index + 1}`,
            label: left.label
          }
        };
      });
      return {
        ...question,
        retryVariants: [{
          ...question,
          retryVariants: [],
          variantSeed: retrySeed,
          prompt: `${question.prompt} For this retry, match each evidence or mechanism back to the engineering item it identifies.`,
          left: resolvedPairs.map((pair) => pair.left),
          right: resolvedPairs.map((pair) => pair.right),
          correctPairs: Object.fromEntries(
            resolvedPairs.map((pair) => [pair.left.id, pair.right.id])
          ),
          feedbackCorrect: "Correct. The inverse matching case preserves every reviewed engineering relationship.",
          feedbackIncorrect: "Work from the evidence or mechanism back to the item it uniquely identifies.",
          misconceptionFeedback: Object.fromEntries(
            resolvedPairs.map((pair) => [
              pair.left.id,
              "Match by the reviewed engineering relationship, not by position or surface wording."
            ])
          ),
          hints: [
            "Define what each left-side evidence or mechanism reveals.",
            "Use every right-side engineering item once."
          ],
          solution: resolvedPairs.map(
            (pair) => `${pair.left.label} identifies ${pair.right.label}.`
          )
        }]
      };
    }
    case "short-response":
      return {
        ...question,
        retryVariants: [{
          ...question,
          retryVariants: [],
          variantSeed: retrySeed,
          prompt: `State the criterion that would make you revise the "${title}" decision in this application: ${application}`,
          requiredTerms: [firstTerm, "criterion"],
          minimumTerms: 2,
          feedbackCorrect: "Your retry response names both the lesson concept and a decision criterion.",
          feedbackIncorrect: "Name the lesson concept and an explicit criterion that would trigger revision.",
          misconceptionFeedback: {
            [firstTerm]: `Use "${firstTerm}" in the lesson-specific sense.`,
            criterion: "State a boundary that can be compared with an observable result."
          },
          hints: [
            `Name how ${firstTerm} affects the decision.`,
            "State the observable boundary that would make the decision change."
          ],
          solution: [
            `Describe the role of ${firstTerm} in the application.`,
            "State an observable acceptance criterion.",
            "Explain that a result outside the criterion requires the decision to be revised."
          ]
        }]
      };
    case "diagram": {
      const distractors = diagramDistractorLabels(title, teachingContext);
      const diagram = buildDiagramStructure(
        retryId,
        title,
        teachingContext,
        "retry"
      );
      const options = [
        {
          id: `${retryId}-REVISE`,
          label: diagramRelationshipLabel(diagram, diagram.answerEdgeId)
        },
        {
          id: `${retryId}-VISIT`,
          label: distractors.retryPremature
        },
        {
          id: `${retryId}-HIDDEN`,
          label: distractors.retryModelOnly
        }
      ];
      return {
        ...question,
        retryVariants: [{
          ...question,
          retryVariants: [],
          variantSeed: retrySeed,
          prompt: `Which labelled relationship in the retry diagram exposes this "${title}" failure and the required revision: ${teachingContext.failurePattern}`,
          diagramDescription: diagramTextEquivalent(
            diagram,
            teachingContext,
            "retry"
          ),
          diagram,
          options,
          correctOptionId: `${retryId}-REVISE`,
          feedbackCorrect: "Correct. The retry diagram exposes the failed criterion before revising the decision.",
          feedbackIncorrect: "Choose the path with an observable check, an explicit failed criterion and a justified revision.",
          misconceptionFeedback: {
            [`${retryId}-VISIT`]: "A page visit is not an observable engineering result.",
            [`${retryId}-HIDDEN`]: "Hidden assumptions and an unrecorded result cannot support a reviewable conclusion."
          },
          hints: [
            "Find the path that shows both the failed boundary and the response.",
            "The decision changes only after an observable result is compared with a criterion."
          ],
          solution: [
            "Begin with the assumption and observable check.",
            "Show that the result lies outside the criterion.",
            "Revise the decision and retain the failed evidence."
          ]
        }]
      };
    }
    case "code-analysis": {
      const retryCase = codeAnalysisSeed?.retry;
      if (!retryCase) {
        throw new Error(
          `Code-analysis retry authoring is missing for ${question.id}.`
        );
      }
      const options = retryCase.choices.map((label, index) => ({
        id: `${retryId}-${academyCodeChoiceSuffixes[index]}`,
        label
      }));
      return {
        ...question,
        retryVariants: [{
          ...question,
          retryVariants: [],
          variantSeed: retrySeed,
          language: retryCase.language,
          code: retryCase.code,
          prompt: retryCase.prompt,
          options,
          correctOptionId: `${retryId}-${academyCodeChoiceSuffixes[retryCase.correctChoice]}`,
          feedbackCorrect: `Correct. ${retryCase.explanation}`,
          feedbackIncorrect: "Trace the changed static code in source order and apply its declared language semantics.",
          misconceptionFeedback: Object.fromEntries(
            academyCodeChoiceSuffixes
              .filter((_, index) => index !== retryCase.correctChoice)
              .map((suffix) => [
                `${retryId}-${suffix}`,
                "This option does not match a source-order trace of the changed code case."
              ])
          ),
          hints: [
            "Trace the changed declarations and each subsequent state update without executing the snippet.",
            `Apply ${retryCase.language} types, operators and control flow exactly as written.`
          ],
          solution: [
            "Write the changed initial values.",
            "Trace every statement in source order.",
            retryCase.explanation
          ]
        }]
      };
    }
  }
};

const questionChoices = (
  lessonId: string,
  skillId: string,
  title: string,
  definition: string,
  misconception: string,
  application: string,
  teachingContext: AcademyUnitTeachingContext,
  formulaTemplate: FormulaTemplate | null
): AcademyQuestion[] => {
  const q1 = questionId(lessonId, 1);
  const q2 = questionId(lessonId, 2);
  const q3 = questionId(lessonId, 3);
  const q4 = questionId(lessonId, 4);
  const q5 = questionId(lessonId, 5);
  const q6 = questionId(lessonId, 6);
  const common = {
    skillIds: [skillId],
    variantSeed: Number(lessonId.slice(-2))
  };
  const firstTerm = title.split(/[\s,/]+/).find((term) => term.length > 4)?.toLocaleLowerCase("en-AU") ?? "evidence";
  const codeAnalysisSeed = academyCodeAnalysisSeeds[lessonId];
  const matchingSeed = academyMatchingSeeds[lessonId];
  const diagramDistractors = diagramDistractorLabels(title, teachingContext);
  const baseDiagram = buildDiagramStructure(q5, title, teachingContext, "base");

  const questions: AcademyQuestion[] = [
    {
      ...common,
      id: q1,
      type: "single-choice",
      prompt: `Which statement best captures "${title}"?`,
      options: [
        { id: `${q1}-A`, label: definition },
        { id: `${q1}-B`, label: misconception },
        { id: `${q1}-C`, label: "It is complete once a tool or page has been opened." }
      ],
      correctOptionId: `${q1}-A`,
      feedbackCorrect: `Correct. The definition states the usable boundary of "${title}".`,
      feedbackIncorrect: "Revisit the definition and look for the statement that identifies both the idea and its decision boundary.",
      misconceptionFeedback: {
        [`${q1}-B`]: "That choice repeats the lesson misconception and omits the corrective evidence.",
        [`${q1}-C`]: "Activity is not evidence of understanding or successful application."
      },
      hints: [
        "Find the option that could guide a real engineering decision.",
        "The correct option matches the defined term without claiming automatic completion."
      ],
      solution: [
        "Compare each option with the lesson definition.",
        `The first option is correct because ${definition.charAt(0).toLocaleLowerCase("en-AU")}${definition.slice(1)}`
      ]
    },
    {
      ...common,
      id: q2,
      type: "ordering",
      prompt: `Order a defensible workflow for "${title}" in this system: ${teachingContext.systemContext}`,
      items: [
        { id: `${q2}-OBSERVE`, label: "Observe and bound the need" },
        { id: `${q2}-MODEL`, label: "Select a concept or model" },
        { id: `${q2}-TEST`, label: "Apply a check or test" },
        { id: `${q2}-INTERPRET`, label: "Interpret and retain evidence" }
      ],
      correctOrder: [`${q2}-OBSERVE`, `${q2}-MODEL`, `${q2}-TEST`, `${q2}-INTERPRET`],
      feedbackCorrect: "Correct. The sequence keeps the need ahead of the model and the evidence after the test.",
      feedbackIncorrect: "The model should answer a bounded need, and interpretation must use evidence produced by the check.",
      misconceptionFeedback: {
        [`${q2}-MODEL`]: "Starting with a favoured model risks solving the wrong problem.",
        [`${q2}-INTERPRET`]: "A conclusion before a test is an expectation, not retained evidence."
      },
      hints: [
        "Start with the observation or decision, not the equation or tool.",
        "Testing must happen before interpreting the result."
      ],
      solution: [
        "Observe and bound the need.",
        "Select the smallest suitable concept or model.",
        "Apply a check or test.",
        "Interpret the result and retain the evidence."
      ]
    },
    {
      ...common,
      id: q3,
      type: "multiple-selection",
      prompt: `Which records make an application of "${title}" reviewable? ${teachingContext.applicationTask} Select all that apply.`,
      options: [
        { id: `${q3}-INPUTS`, label: "Inputs, units and assumptions" },
        { id: `${q3}-METHOD`, label: "Method or reasoning chain" },
        { id: `${q3}-EVIDENCE`, label: "Observed result and acceptance boundary" },
        { id: `${q3}-VISIT`, label: "A record that the page was opened" }
      ],
      correctOptionIds: [`${q3}-INPUTS`, `${q3}-METHOD`, `${q3}-EVIDENCE`],
      feedbackCorrect: "Correct. Another person can reconstruct the claim from inputs, method and evidence.",
      feedbackIncorrect: "A visit record is not learning evidence, while inputs, reasoning and an observed result are all required.",
      misconceptionFeedback: {
        [`${q3}-VISIT`]: "Opening an activity says nothing about understanding, calculation or applied success."
      },
      hints: [
        "Choose records needed to reproduce or challenge the result.",
        "Exclude passive activity telemetry."
      ],
      solution: [
        "Keep inputs with units and assumptions.",
        "Keep the method or reasoning chain.",
        "Keep the observed result and acceptance boundary.",
        "Do not count a page visit as mastery evidence."
      ]
    },
    matchingSeed
      ? {
          ...common,
          id: q4,
          type: "matching",
          prompt: matchingSeed.prompt,
          left: matchingSeed.pairs.map(([label], index) => ({
            id: `${q4}-LEFT-${index + 1}`,
            label
          })),
          right: matchingSeed.pairs.map(([, label], index) => ({
            id: `${q4}-RIGHT-${index + 1}`,
            label
          })),
          correctPairs: Object.fromEntries(
            matchingSeed.pairs.map((_, index) => [
              `${q4}-LEFT-${index + 1}`,
              `${q4}-RIGHT-${index + 1}`
            ])
          ),
          feedbackCorrect: `Correct. ${matchingSeed.explanation}`,
          feedbackIncorrect: "Recheck the subject-specific role of every left item before pairing it with the evidence or mechanism on the right.",
          misconceptionFeedback: Object.fromEntries(
            matchingSeed.pairs.map((_, index) => [
              `${q4}-LEFT-${index + 1}`,
              "This item must be paired by its engineering meaning, not by word order or surface similarity."
            ])
          ),
          hints: [
            "Define each left item independently before inspecting the right-side descriptions.",
            "Confirm that every right-side description is used once and preserves the lesson's causal meaning."
          ],
          solution: [
            ...matchingSeed.pairs.map(([left, right]) => `${left} matches ${right}.`),
            matchingSeed.explanation
          ]
        }
      : {
          ...common,
          id: q4,
          type: "short-response",
          prompt: `Explain how applying "${title}" changes the decision in this application: ${application}`,
          requiredTerms: [firstTerm, "evidence"],
          minimumTerms: 2,
          feedbackCorrect: "Your response connects the lesson concept with application evidence.",
          feedbackIncorrect: "Name the concept, the evidence you would inspect and the resulting engineering decision.",
          misconceptionFeedback: {
            [firstTerm]: `Use the term "${firstTerm}" in its lesson-specific sense.`,
            evidence: "State what observable record would support or contradict the decision."
          },
          hints: [
            `First define the role of ${firstTerm}.`,
            "Then identify the evidence and the decision it changes."
          ],
          solution: [
            `Use ${firstTerm} to describe the relevant mechanism or boundary.`,
            `Collect evidence from ${application.toLocaleLowerCase("en-AU")}.`,
            "Compare the evidence with the stated criterion before accepting or revising the decision."
          ]
        },
    codeAnalysisSeed
      ? {
          ...common,
          id: q5,
          type: "code-analysis",
          language: codeAnalysisSeed.language,
          code: codeAnalysisSeed.code,
          prompt: codeAnalysisSeed.prompt,
          options: codeAnalysisSeed.choices.map((label, index) => ({
            id: `${q5}-${academyCodeChoiceSuffixes[index]}`,
            label
          })),
          correctOptionId: `${q5}-${academyCodeChoiceSuffixes[codeAnalysisSeed.correctChoice]}`,
          feedbackCorrect: `Correct. ${codeAnalysisSeed.explanation}`,
          feedbackIncorrect: "Trace the static code in source order, preserve its types and operators, and compare the resulting state with each option.",
          misconceptionFeedback: Object.fromEntries(
            academyCodeChoiceSuffixes
              .filter((_, index) => index !== codeAnalysisSeed.correctChoice)
              .map((suffix) => [
                `${q5}-${suffix}`,
                "This option does not match a source-order trace with the declared language semantics."
              ])
          ),
          hints: [
            "Do not execute the snippet; write the value of each changed variable after every statement.",
            `Apply ${codeAnalysisSeed.language} type, operator and control-flow rules exactly as written.`
          ],
          solution: [
            "Trace each statement from the declared initial values without introducing unstated behaviour.",
            codeAnalysisSeed.explanation
          ]
        }
      : {
          ...common,
          id: q5,
          type: "diagram",
          prompt: `Which labelled relationship is represented by the diagram for "${title}"?`,
          diagramDescription: diagramTextEquivalent(
            baseDiagram,
            teachingContext,
            "base"
          ),
          diagram: baseDiagram,
          options: [
            {
              id: `${q5}-A`,
              label: diagramRelationshipLabel(
                baseDiagram,
                baseDiagram.answerEdgeId
              )
            },
            { id: `${q5}-B`, label: diagramDistractors.basePremature },
            { id: `${q5}-C`, label: diagramDistractors.baseFailureAsEvidence }
          ],
          correctOptionId: `${q5}-A`,
          feedbackCorrect: "Correct. The diagram preserves causal order and exposes the acceptance boundary.",
          feedbackIncorrect: "Choose the path that makes assumptions, observations and the decision criterion inspectable.",
          misconceptionFeedback: {
            [`${q5}-B`]: "Opening a tool is not evidence.",
            [`${q5}-C`]: "A conclusion cannot defensibly precede its assumptions and observations."
          },
          hints: [
            "Look for an observable result before the decision.",
            "The complete path ends with retained evidence."
          ],
          solution: [
            teachingContext.visualModel,
            "Expose the boundary, input, model or mechanism and observable result.",
            "Compare the result with a criterion and retain the evidence."
          ]
        }
  ];

  const seededAuthoring = academySeededCalculationAuthoring[lessonId];
  if (formulaTemplate && seededAuthoring) {
    questions.push({
      ...common,
      id: q6,
      type: "seeded-calculation",
      prompt: seededAuthoring.prompt,
      mathSupport: seededQuestionMathSupport(q6, formulaTemplate, seededAuthoring),
      generator: { ...seededAuthoring.generator },
      canonicalUnit: seededAuthoring.canonicalUnit,
      acceptedUnits: { ...seededAuthoring.acceptedUnits },
      absoluteTolerance: seededAuthoring.absoluteTolerance,
      relativeTolerance: 0.001,
      feedbackCorrect: "Correct. Your generated value and unit match the reviewed relationship.",
      feedbackIncorrect: "Check the generated input, governing relation and compatible units before recomputing.",
      misconceptionFeedback: {
        unit: "Convert the submitted unit to the canonical SI unit before comparing values.",
        sign: "Recheck the reference direction and the sign of every term.",
        zero: "A zero result is only credible when the generated input and offset make it physically possible.",
        magnitude: "Estimate the order of magnitude before finalising the arithmetic."
      },
      hints: [
        "Use the reviewed governing relationship shown below.",
        "Substitute the generated input only after confirming its stated unit.",
        `Express the final result in ${seededAuthoring.canonicalUnit}.`
      ],
      solution: [
        "Start from the governing relationship.",
        "Substitute the generated input and retain the offset before evaluating.",
        "Evaluate the displayed substitution, then confirm the output unit and order of magnitude."
      ]
    });
  } else if (formulaTemplate) {
    questions.push({
      ...common,
      id: q6,
      type: "numeric",
      prompt: "Calculate the requested value for this reviewed engineering practice case.",
      mathSupport: fixedQuestionMathSupport(q6, formulaTemplate),
      expectedValue: formulaTemplate.numericExpected,
      canonicalUnit: formulaTemplate.canonicalUnit,
      acceptedUnits: formulaTemplate.acceptedUnits,
      absoluteTolerance: formulaTemplate.tolerance,
      relativeTolerance: 0.001,
      feedbackCorrect: "Correct. Your value and unit match the worked dimensional path.",
      feedbackIncorrect: "Check the governing relation, convert inputs to compatible units and recompute before rounding.",
      misconceptionFeedback: {
        unit: "Convert the submitted unit to the canonical SI unit before comparing values.",
        sign: "Recheck the reference direction or subtraction order.",
        zero: "A zero result is only credible if the inputs or model make the effect vanish.",
        magnitude: "Estimate the order of magnitude before finalising the arithmetic."
      },
      hints: [
        "Use the reviewed governing relationship shown below.",
        "Substitute values only after making their units compatible.",
        "Use the canonical output unit shown beside the numeric answer field."
      ],
      solution: [
        "Start from the governing relationship.",
        "Substitute the stated practice values after converting them to compatible units, then evaluate without premature rounding.",
        "Use the reviewed result below to complete a back-substitution and dimensional check."
      ]
    });
  } else {
    questions.push({
      ...common,
      id: q6,
      type: "multiple-selection",
      prompt: `Which two lesson-specific records expose a failure in "${title}"? Select both.`,
      options: [
        { id: `${q6}-FAILURE`, label: `Failure pattern: ${teachingContext.failurePattern}` },
        { id: `${q6}-CHECK`, label: `Observable check: ${teachingContext.applicationTask}` },
        { id: `${q6}-VISIT`, label: "A timestamp showing that the lesson page was opened" },
        { id: `${q6}-CLAIM`, label: `An unsupported claim that "${title}" is complete under all conditions` }
      ],
      correctOptionIds: [`${q6}-FAILURE`, `${q6}-CHECK`],
      feedbackCorrect: "Correct. The selected failure is paired with a subject-specific observation capable of revealing it.",
      feedbackIncorrect: "Select the explicit failure pattern and the bounded observable check, not passive activity or an unsupported universal claim.",
      misconceptionFeedback: {
        [`${q6}-VISIT`]: "A visit timestamp does not show whether the subject-specific failure occurred.",
        [`${q6}-CLAIM`]: "An unrestricted completion claim discards the lesson boundary and evidence requirement."
      },
      hints: [
        `The failure option describes what becomes wrong in the system covered by "${title}".`,
        "The check option must produce an observable result that can support or contradict the lesson model."
      ],
      solution: [
        `Select the failure pattern: ${teachingContext.failurePattern}`,
        `Select the observable check: ${teachingContext.applicationTask}`,
        `Apply the check through this activity: ${application} Compare the retained result with its criterion.`
      ]
    });
  }

  return questions.map((question) =>
    withAuthoredRetryVariant(
      question,
      title,
      application,
      teachingContext,
      firstTerm,
      formulaTemplate,
      codeAnalysisSeed
    )
  );
};

const formulaContent = (
  lessonId: string,
  title: string,
  formulaKey: AcademyFormulaKey
): { formulae: FormulaSpec[]; blocks: LessonBlock[] } => {
  const template = academyFormulaTemplates[formulaKey];
  const formulaId = `${lessonId}-F01`;
  const formulaSpec: FormulaSpec = {
    id: formulaId,
    latex: template.latex,
    displayMode: true,
    spoken: template.spoken,
    variables: template.variables.map((variable) => ({ ...variable })),
    assumptions: [...template.assumptions],
    derivationSteps: template.derivationSteps.map((step, index) =>
      buildAcademyReviewedInstruction(
        `${formulaId}-DERIVATION-${String(index + 1).padStart(2, "0")}`,
        step,
        `${formulaKey} derivation step ${index + 1}`
      )
    )
  };
  const examples: WorkedExample[] = template.examples.map((example, index) => ({
    id: `${lessonId}-EX${String(index + 1).padStart(2, "0")}`,
    verificationCaseId: (
      `${formulaKey}-CASE-${String(index + 1).padStart(2, "0")}`
    ),
    verificationOutputs: academyWorkedExampleVerificationOutputs[formulaKey][
      index
    ].map((output) => ({ ...output })),
    title: `${title}: worked example ${index + 1}`,
    problem: buildAcademyReviewedInstruction(
      `${lessonId}-EX${String(index + 1).padStart(2, "0")}-PROBLEM`,
      example.problem,
      `${formulaKey} worked example ${index + 1} problem`
    ),
    assumptions: [...template.assumptions],
    governingFormulaId: formulaId,
    steps: example.steps.map((step, stepIndex) =>
      buildAcademyReviewedInstruction(
        `${lessonId}-EX${String(index + 1).padStart(2, "0")}-STEP-${String(stepIndex + 1).padStart(2, "0")}`,
        step,
        `${formulaKey} worked example ${index + 1} step ${stepIndex + 1}`
      )
    ),
    result: buildAcademyReviewedInstruction(
      `${lessonId}-EX${String(index + 1).padStart(2, "0")}-RESULT`,
      example.result,
      `${formulaKey} worked example ${index + 1} result`,
      true
    ),
    dimensionalCheck: buildAcademyReviewedInstruction(
      `${lessonId}-EX${String(index + 1).padStart(2, "0")}-DIMENSIONAL-CHECK`,
      template.dimensionalCheck,
      `${formulaKey} dimensional check`,
      true
    ),
    independentCheck: buildAcademyReviewedInstruction(
      `${lessonId}-EX${String(index + 1).padStart(2, "0")}-INDEPENDENT-CHECK`,
      example.independentCheck,
      `${formulaKey} worked example ${index + 1} independent check`
    )
  }));
  return {
    formulae: [formulaSpec],
    blocks: [
      {
        id: `${lessonId}-BLOCK-MATH`,
        kind: "display-math",
        formulaId,
        context: `Governing relationship for "${title}".`
      },
      {
        id: `${lessonId}-BLOCK-DERIVATION`,
        kind: "derivation",
        heading: "Where the relationship comes from",
        formulaId,
        steps: formulaSpec.derivationSteps.map((step) =>
          step.map((part) => part.kind === "text"
            ? { ...part }
            : { ...part, expression: { ...part.expression } })
        )
      },
      ...examples.map((example): LessonBlock => ({
        id: `${example.id}-BLOCK`,
        kind: "worked-example",
        example
      }))
    ]
  };
};

const sourceIdsForUnit = (unitId: string): string[] => {
  const sourceIds = academyUnitSourceMap[unitId];
  if (!sourceIds || sourceIds.length === 0) {
    throw new Error(`Missing Academy source mapping for ${unitId}`);
  }
  return [...sourceIds];
};

const buildLesson = (
  seed: AcademyStageUnitSeed,
  lessonNumber: number,
  lessonTeachingProfiles: AcademyLessonTeachingProfileRegistry
): Lesson => {
  const unitSeed = academyUnitSeeds.find((candidate) => candidate.id === seed.unitId);
  const unit = academyUnits.find((candidate) => candidate.id === seed.unitId);
  const unitTeachingContext = academyUnitTeachingContexts[seed.unitId];
  if (!unitSeed || !unit || !unitTeachingContext) throw new Error(`Unknown Academy unit seed ${seed.unitId}`);
  const lessonId = lessonIdsForUnit(seed.unitId)[lessonNumber - 1];
  const title = unitSeed.lessonTitles[lessonNumber - 1];
  const definition = seed.focuses[lessonNumber - 1];
  const lessonTeachingProfile = lessonTeachingProfiles[lessonId];
  if (!lessonTeachingProfile) {
    throw new Error(`Missing Academy lesson teaching profile for ${lessonId}`);
  }
  const teachingContext: AcademyUnitTeachingContext = {
    systemContext: lessonTeachingProfile.systemModel,
    failurePattern: lessonTeachingProfile.failurePattern,
    applicationTask: lessonTeachingProfile.applicationTask,
    visualModel: lessonTeachingProfile.visualExplanation
  };
  const formulaKey = seed.formulaKeys[lessonNumber - 1];
  const formulaTemplate = formulaKey ? academyFormulaTemplates[formulaKey] : null;
  const globalIndex = allLessonIds.indexOf(lessonId);
  const previousLessonId = globalIndex > 0 ? allLessonIds[globalIndex - 1] : null;
  const nextLessonId = globalIndex < allLessonIds.length - 1 ? allLessonIds[globalIndex + 1] : null;
  const prerequisiteLessonIds = lessonNumber > 1
    ? [`${seed.unitId}-L${String(lessonNumber - 1).padStart(2, "0")}`]
    : (academyUnitPrerequisiteMap[seed.unitId] ?? []).map((unitId) => `${unitId}-L07`);
  const skillId = skillIdForUnit(seed.unitId);
  const applicationRoute = unit.laboratoryRoute ?? unit.projectRoute;
  if (!applicationRoute) throw new Error(`Academy unit ${unit.id} has no internal application route`);
  const application = `${teachingContext.applicationTask} Use ${applicationRoute} to retain the result and criterion comparison.`;
  const misconception = `${title}: ${teachingContext.failurePattern}`;
  const correction = `For "${title}", use this corrective model: ${teachingContext.visualModel}`;
  const maths = formulaKey ? formulaContent(lessonId, title, formulaKey) : { formulae: [], blocks: [] };
  const questions = questionChoices(
    lessonId,
    skillId,
    title,
    definition,
    misconception,
    application,
    teachingContext,
    formulaTemplate
  );
  const lessonMediaIds = [...(academyMediaByLessonId[lessonId] ?? [])];
  const sourceIds = sourceIdsForUnit(seed.unitId);
  const imageBlocks: LessonBlock[] = lessonId === "EML-E3-D17-L01"
    ? [{
        id: `${lessonId}-BLOCK-IMAGE`,
        kind: "image",
        src: "./assets/20260730-Engineering-Mastery-Lab-Hero-Rover-Rev00.webp",
        alt: "Four-wheeled mobile robot with exposed chassis electronics, front-facing sensors and a roof-mounted ranging sensor on a dark background.",
        caption: "Mobile robot architecture example: chassis, actuation, onboard electronics and multiple sensing interfaces share one physical platform.",
        width: 512,
        height: 512
      }]
    : [];
  const blocks: LessonBlock[] = [
    {
      id: `${lessonId}-BLOCK-INTRO`,
      kind: "prose",
      heading: "Start from the physical or computational question",
      paragraphs: [
        `${title} uses this lesson-specific system model: ${teachingContext.systemContext}`,
        `The wider unit boundary is: ${unitTeachingContext.systemContext}`,
        definition,
        `${teachingContext.applicationTask} Separate what is known, assumed, calculated or inferred and observed so another person can inspect the evidence and challenge the decision boundary.`
      ]
    },
    {
      id: `${lessonId}-BLOCK-DEFINITION`,
      kind: "definition",
      term: title,
      definition
    },
    ...imageBlocks,
    {
      id: `${lessonId}-BLOCK-EXAMPLE`,
      kind: "prose",
      heading: "Subject-specific example and disconfirming case",
      paragraphs: [
        `Example application: ${teachingContext.applicationTask}`,
        `Relationship to represent: ${teachingContext.visualModel}`,
        `Disconfirming case to seek: ${teachingContext.failurePattern}`
      ]
    },
    {
      id: `${lessonId}-BLOCK-VISUAL`,
      kind: "interactive-visual",
      title: `${title} relationship explorer`,
      description: `${teachingContext.visualModel} Adjust the input, operating assumption and acceptance boundary to inspect how the conclusion changes.`,
      controls: [
        {
          id: `${lessonId}-VISUAL-CONTROL-OBSERVATION`,
          label: "Change the observed condition",
          outcome: `Within this lesson system, ${teachingContext.systemContext} A changed observation propagates through this represented relationship: ${teachingContext.visualModel}`,
          requiredAction: `Repeat this bounded application with one observed condition changed: ${teachingContext.applicationTask}`,
          retainedEvidence: `Keep the before-and-after observation, its unit or state and whether the change exposes this disconfirming case: ${teachingContext.failurePattern}`
        },
        {
          id: `${lessonId}-VISUAL-CONTROL-ASSUMPTION`,
          label: "Challenge the governing assumption",
          outcome: `Changing a governing assumption makes the "${title}" relationship conditional: ${teachingContext.visualModel} The challenged case is: ${teachingContext.failurePattern}`,
          requiredAction: `State the changed assumption, then repeat the relevant reasoning or check in this application: ${teachingContext.applicationTask}`,
          retainedEvidence: `Retain the assumption version, the first affected relationship and the observed result inside this system boundary: ${teachingContext.systemContext}`
        },
        {
          id: `${lessonId}-VISUAL-CONTROL-CRITERION`,
          label: "Move the acceptance boundary",
          outcome: `Changing the criterion can change the "${title}" decision without changing the observation. Interpret the comparison through: ${teachingContext.visualModel}`,
          requiredAction: `Compare the retained result from this application against both the original and revised criteria: ${teachingContext.applicationTask}`,
          retainedEvidence: `Keep both criterion versions, the unchanged observation and the decision transition; explicitly report whether this failure remains: ${teachingContext.failurePattern}`
        }
      ],
      textEquivalent: `${teachingContext.visualModel} Changing an assumption marks the prior "${title}" conclusion for review.`
    },
    ...maths.blocks,
    {
      id: `${lessonId}-BLOCK-CONCEPT`,
      kind: "prose",
      heading: formulaKey ? "Interpret before calculating" : "Build the conceptual model",
      paragraphs: [
        formulaKey
          ? `Before calculating "${title}", predict direction, approximate magnitude and permitted range inside this boundary: ${teachingContext.systemContext}`
          : `Build the causal model explicitly. ${teachingContext.visualModel}`,
        `A credible failure to seek is this: ${teachingContext.failurePattern}`,
        `${teachingContext.applicationTask} Completion requires the observed result, its interpretation, the criterion comparison and retained evidence.`
      ]
    },
    ...lessonMediaIds.map((mediaId, mediaIndex): LessonBlock => ({
      id: `${lessonId}-BLOCK-MEDIA-${String(mediaIndex + 1).padStart(2, "0")}`,
      kind: "media",
      mediaId
    })),
    {
      id: `${lessonId}-BLOCK-MISCONCEPTION`,
      kind: "misconception",
      claim: misconception,
      correction
    },
    {
      id: `${lessonId}-BLOCK-CHECK`,
      kind: "knowledge-check",
      questionIds: questions.slice(0, 2).map((question) => question.id)
    },
    {
      id: `${lessonId}-BLOCK-PRACTICE`,
      kind: "practice-set",
      questionIds: questions.map((question) => question.id)
    },
    {
      id: `${lessonId}-BLOCK-LAB`,
      kind: "laboratory-callout",
      title: `${title} applied activity`,
      route: applicationRoute,
      task: application,
      expectedOutcome: `A retained input, result and criterion comparison that addresses this failure pattern: ${teachingContext.failurePattern}`
    },
    {
      id: `${lessonId}-BLOCK-SUMMARY`,
      kind: "summary",
      points: [
        definition,
        correction,
        "A completed activity contains reasoning and evidence, not only a visit or confidence judgement."
      ]
    },
    {
      id: `${lessonId}-BLOCK-SOURCES`,
      kind: "source-note",
      sourceIds
    }
  ];

  return {
    schemaVersion: ACADEMY_SCHEMA_VERSION,
    contentVersion: ACADEMY_CONTENT_VERSION,
    id: lessonId,
    unitId: seed.unitId,
    title,
    description: `${definition} The lesson combines native explanation, a deterministic visual, guided practice and an internal applied activity.`,
    objectives: [
      `Explain this lesson-specific system model: ${teachingContext.systemContext}`,
      `Complete and evidence this bounded application: ${teachingContext.applicationTask}`,
      `Evaluate an observable result against a criterion capable of exposing this failure: ${teachingContext.failurePattern}`
    ],
    prerequisites: prerequisiteLessonIds,
    estimatedMinutes: academyLessonMinutePattern[lessonNumber - 1],
    skillIds: [skillId],
    blocks,
    formulae: maths.formulae,
    questions,
    mediaIds: lessonMediaIds,
    laboratoryRoute: applicationRoute,
    summary: [
      definition,
      correction,
      `The applied evidence must resolve this task: ${teachingContext.applicationTask}`
    ],
    retrievalPrompts: [
      `Without notes, reconstruct this system model: ${teachingContext.systemContext}`,
      `Sketch this lesson-specific relationship: ${teachingContext.visualModel}`,
      `State how evidence would expose this failure: ${teachingContext.failurePattern}`
    ],
    sourceIds,
    previousLessonId,
    nextLessonId
  };
};

export const buildAcademyStageContent = (
  stage: AcademyStage,
  seeds: AcademyStageUnitSeed[],
  lessonTeachingProfiles: AcademyLessonTeachingProfileRegistry
): AcademyStageContent => {
  const expectedUnitIds = academyUnitSeeds.filter((unit) => unit.stage === stage).map((unit) => unit.id);
  const suppliedUnitIds = seeds.map((seed) => seed.unitId);
  if (
    expectedUnitIds.length !== suppliedUnitIds.length
    || expectedUnitIds.some((unitId, index) => suppliedUnitIds[index] !== unitId)
  ) {
    throw new Error(`Academy stage ${stage} unit seed order does not match the lightweight catalogue`);
  }
  const expectedLessonIds = expectedUnitIds.flatMap(lessonIdsForUnit);
  const lessonTeachingProfileIssues = validateAcademyLessonTeachingProfiles(
    expectedLessonIds,
    lessonTeachingProfiles
  );
  if (lessonTeachingProfileIssues.length > 0) {
    throw new Error(
      `Academy stage ${stage} lesson teaching profiles are invalid: ${lessonTeachingProfileIssues.join(", ")}`
    );
  }
  return {
    schemaVersion: ACADEMY_SCHEMA_VERSION,
    contentVersion: ACADEMY_CONTENT_VERSION,
    stage,
    lessons: seeds.flatMap((seed) =>
      Array.from({ length: 7 }, (_, index) =>
        buildLesson(seed, index + 1, lessonTeachingProfiles)
      )
    )
  };
};
