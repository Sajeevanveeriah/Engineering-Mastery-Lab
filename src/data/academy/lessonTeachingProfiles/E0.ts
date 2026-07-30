import type { AcademyLessonTeachingProfileRegistry } from "../lessonTeachingProfileValidation";

export const academyLessonTeachingProfilesE0 = {
  "EML-E0-D01-L01": {
    systemModel: "Technical learning operates as an evidence loop in which an unaided explanation exposes a gap, targeted practice changes capability and a delayed attempt tests retention.",
    failurePattern: "Passive rereading can create fluent recognition while the learner still cannot reconstruct the idea, choose a method or produce evidence without prompts.",
    visualExplanation: "A timeline connects an initial question, unaided recall, a bounded practice attempt, corrective feedback, a revised explanation and a delayed retention check.",
    applicationTask: "Choose one small engineering concept, record a no-notes baseline explanation, practise the weakest part and compare a delayed explanation with the original omissions."
  },
  "EML-E0-D01-L02": {
    systemModel: "Retrieval strengthens access to a memory when the answer is reconstructed before feedback, while spacing places later attempts far enough apart to reveal forgetting.",
    failurePattern: "Massed review can produce a strong immediate answer that collapses after a delay because recognition during study was mistaken for durable recall.",
    visualExplanation: "A forgetting curve is interrupted by several unaided retrieval points, with each feedback event correcting the response and extending the next review interval.",
    applicationTask: "Create three spaced prompts for a robotics term, answer each before opening notes and log which details disappear or recover across the intervals."
  },
  "EML-E0-D01-L03": {
    systemModel: "Problem decomposition maps a broad engineering need into functions, interfaces, constraints, unknowns and tests that can later be recombined against the original purpose.",
    failurePattern: "A collection of locally solved parts can still fail when an interface assumption is missing, two boundaries overlap or the system-level acceptance condition is lost.",
    visualExplanation: "A functional tree expands one need into bounded subproblems, while cross-links mark exchanged energy, information, material and evidence between the branches.",
    applicationTask: "Decompose a sensor-logger need into sensing, power, computation, storage and verification responsibilities, then specify one testable interface for every connection."
  },
  "EML-E0-D01-L04": {
    systemModel: "A scientific engineering question links a controlled input, an observable response and a mechanism to a prediction that a credible result could contradict.",
    failurePattern: "A vague hypothesis survives every outcome when it omits direction, boundary conditions or a disconfirming observation and therefore cannot guide a decision.",
    visualExplanation: "A causal diagram runs from changed variable through proposed mechanism to predicted measurement, then branches into supporting and disconfirming result regions.",
    applicationTask: "Write and test a directional hypothesis about motor speed under changed load, including the held conditions, measured response and result that would reject the explanation."
  },
  "EML-E0-D01-L05": {
    systemModel: "A fair comparison isolates an intended factor while controlling credible confounders, repeating observations and retaining enough setup detail to assess variation.",
    failurePattern: "Changing load, supply condition and measurement method together makes the observed difference ambiguous even when the resulting plot looks consistent.",
    visualExplanation: "An experiment matrix holds control columns constant, varies one treatment column and places repeated response measurements beside a declared comparison criterion.",
    applicationTask: "Plan repeated current measurements for two motor loads, keep supply and sampling conditions fixed and record any uncontrolled factor that could change the interpretation."
  },
  "EML-E0-D01-L06": {
    systemModel: "A technical note preserves the chain from dated question and configuration through raw observations, transformations, interpretation and the decision made at that time.",
    failurePattern: "A polished conclusion becomes irreproducible when the underlying data, units, software state, rejected observations or decision authority cannot be recovered.",
    visualExplanation: "A traceability strip links timestamp, question, setup identifier, raw evidence, calculation, uncertainty statement, conclusion and next action without merging their roles.",
    applicationTask: "Document one bench or simulation result with its exact configuration, untouched observations, calculation path, bounded conclusion and a follow-up check that could change the decision."
  },
  "EML-E0-D01-L07": {
    systemModel: "Diagrams describe relationships, datasheets bound component behaviour and procedures prescribe ordered actions, so engineering use depends on reconciling all three document roles.",
    failurePattern: "A design can misuse a component when a typical value is treated as a guaranteed limit or a diagram symbol is read without the procedure's operating conditions.",
    visualExplanation: "Three linked panels trace one component from schematic connection to datasheet rating and then to the procedure step that verifies safe installation.",
    applicationTask: "Select one sensor interface, identify its diagram connections, distinguish absolute and recommended datasheet limits and write a verification step using the stated conditions."
  },
  "EML-E0-D02-L01": {
    systemModel: "Engineering arithmetic combines an exact calculation with scale, sign, bounds and an independent estimate so numerical output is checked against physical possibility.",
    failurePattern: "A misplaced decimal or unit scale can remain unnoticed when calculator output is accepted without a rough range, limiting case or reverse calculation.",
    visualExplanation: "A number line shows an estimated interval, the calculated value, physical lower and upper bounds and a reverse-check arrow back to the original inputs.",
    applicationTask: "Estimate a rover's travel distance from speed and duration, calculate it precisely, compare both values and explain any order-of-magnitude mismatch before accepting the result."
  },
  "EML-E0-D02-L02": {
    systemModel: "Fractions and ratios compare a numerator with a declared reference, percentages rescale that quotient and scientific notation separates significant digits from decimal magnitude.",
    failurePattern: "A ratio reverses meaning when its reference quantity changes, and a percentage becomes wrong by two orders of magnitude when the factor of one hundred is applied twice.",
    visualExplanation: "A proportion table aligns numerator, denominator, unit ratio, decimal fraction, percentage and scientific-notation form while preserving the comparison direction.",
    applicationTask: "Compute a robot test success fraction from counts, express it as a ratio, decimal, percentage and scientific notation, then reconstruct the original successful count."
  },
  "EML-E0-D02-L03": {
    systemModel: "The SI system attaches quantities to seven base dimensions and combines coherent derived units so equations preserve both magnitude and physical meaning.",
    failurePattern: "A bare number or an informal unit abbreviation can hide incompatible quantities, incorrect scale factors or a derived unit that does not match the claimed phenomenon.",
    visualExplanation: "A unit dependency graph expands newtons, joules, watts and volts into their base-unit factors and highlights cancellations through a calculation.",
    applicationTask: "Take a power or force calculation, label every quantity with an SI unit, reduce the result to base units and verify that the derived-unit name is consistent."
  },
  "EML-E0-D02-L04": {
    systemModel: "Dimensional analysis tracks exponents of physical dimensions through conversion factors and equations, providing a necessary plausibility check before numerical evaluation.",
    failurePattern: "A conversion can preserve the digits but change the physical value when a length scale is applied incorrectly to an area, volume or compound unit.",
    visualExplanation: "A factor-label chain cancels source units step by step, while a dimension balance compares the powers of mass, length, time and current on both equation sides.",
    applicationTask: "Convert a loaded area from square millimetres to square metres, use it in a stress expression and reject any result whose dimensions or magnitude are inconsistent."
  },
  "EML-E0-D02-L05": {
    systemModel: "Instrument resolution limits the smallest distinguishable change, while significant figures communicate the precision justified by measurement and calculation inputs.",
    failurePattern: "Reporting every displayed calculator digit implies unsupported precision, whereas aggressive rounding can erase a change that the instrument can actually resolve.",
    visualExplanation: "A graduated scale places repeated readings on discrete increments and follows them through a calculation to a result rounded at the justified precision boundary.",
    applicationTask: "Record repeated dimensions with a stated instrument resolution, calculate a clearance and justify the final digits retained without claiming finer evidence than the readings support."
  },
  "EML-E0-D02-L06": {
    systemModel: "Measurement error is a signed difference from a stated reference, while uncertainty bounds the remaining doubt using repeat observations, instrument effects and calibration knowledge.",
    failurePattern: "A small average error can conceal wide scatter, drift or an uncertain reference, so accuracy cannot be inferred from one close reading.",
    visualExplanation: "A plot separates the reference line, individual readings, sample centre, spread, systematic offset and final uncertainty interval around the reported value.",
    applicationTask: "Collect repeated measurements of one stable quantity, calculate centre and spread, compare them with a reference and state the dominant uncertainty contributors."
  },
  "EML-E0-D02-L07": {
    systemModel: "Calibration maps instrument indication to traceable reference values across range and conditions, then retains residuals and uncertainty for later corrected measurements.",
    failurePattern: "A single-point adjustment can hide nonlinearity, hysteresis or drift and may produce confident corrected values outside the calibrated operating range.",
    visualExplanation: "A calibration graph shows reference points, fitted correction, residuals, uncertainty bands and a clearly marked region where extrapolation is not justified.",
    applicationTask: "Draft a multi-point calibration plan for a temperature or distance sensor, including reference values, repeated directions, residual checks and an explicit valid range."
  },
  "EML-E0-D03-L01": {
    systemModel: "An algebraic expression represents defined engineering quantities through operators whose units, sign conventions and allowed domains travel with every symbol.",
    failurePattern: "Reusing a symbol for two meanings or dropping its unit can turn a syntactically valid expression into an ambiguous or physically impossible model.",
    visualExplanation: "A symbol table connects each algebraic term to its physical meaning, unit, sign direction and permitted range before the terms enter an expression tree.",
    applicationTask: "Annotate a battery-energy expression with symbol definitions, SI units and bounds, then evaluate one case and identify any input that violates its declared domain."
  },
  "EML-E0-D03-L02": {
    systemModel: "Equation rearrangement preserves equality by applying reversible operations to both sides while respecting zero divisors, roots, signs and the target quantity's domain.",
    failurePattern: "Cancelling a term across addition or dividing by a quantity that may be zero creates an apparent solution that is not equivalent to the original relationship.",
    visualExplanation: "A balance diagram pairs each algebraic operation on the left with the same operation on the right and marks domain restrictions introduced along the path.",
    applicationTask: "Rearrange a motor-power relationship for torque, list every non-zero assumption and substitute the answer back into the original equation as an independent check."
  },
  "EML-E0-D03-L03": {
    systemModel: "A function maps an allowed input to one output, and its graph reveals intercept, local slope, curvature, range and regions where the model ceases to apply.",
    failurePattern: "Extrapolating a fitted trend beyond its evidence range can predict impossible outputs even when the algebra and plotted line remain smooth.",
    visualExplanation: "An input-output graph labels measured points, model curve, tangent slope, valid domain, saturation region and an extrapolated segment shown as unsupported.",
    applicationTask: "Plot a sensor transfer relation, estimate a local rate of change at one operating point and mark the input interval outside which the model should not be used."
  },
  "EML-E0-D03-L04": {
    systemModel: "Geometry and trigonometry resolve lengths, angles and orthogonal components within a declared shape and coordinate convention.",
    failurePattern: "Using the wrong reference angle or mixing degrees and radians swaps components or produces a length inconsistent with the physical triangle.",
    visualExplanation: "A labelled right triangle projects a force or displacement onto perpendicular axes and shows which side is opposite, adjacent and hypotenuse for the chosen angle.",
    applicationTask: "Resolve a displacement in metres into horizontal and vertical components using a declared angle, reconstruct the original displacement magnitude and state the angle convention used."
  },
  "EML-E0-D03-L05": {
    systemModel: "A vector represents magnitude and direction through components measured in a coordinate frame whose origin, axis orientation and handedness define their meaning.",
    failurePattern: "Adding components from different frames without transformation can yield a plausible numeric vector that describes no consistent physical direction.",
    visualExplanation: "Two coordinate frames display the same physical arrow with different component pairs, connected by a labelled transformation and a round-trip check.",
    applicationTask: "Express a robot landmark vector in body and world frames, transform it between them and verify that the reconstructed physical distance is unchanged."
  },
  "EML-E0-D03-L06": {
    systemModel: "A transformation matrix maps vector coordinates between representations, and ordered matrix products encode successive rotations and translations that generally cannot be exchanged.",
    failurePattern: "Reversing transformation order or confusing active motion with a passive frame change produces the wrong pose despite dimensionally valid matrix multiplication.",
    visualExplanation: "A frame chain shows an original point passing through two ordered transformations, alongside a contrasting reversed order that reaches a different location.",
    applicationTask: "Apply one explicitly active counter-clockwise planar rotation to a point between frames that share an origin, calculate the transformed coordinates and verify that its distance from the origin is unchanged."
  },
  "EML-E0-D03-L07": {
    systemModel: "A complex number packages orthogonal real and imaginary components so oscillatory magnitude and phase can be manipulated as one engineering representation.",
    failurePattern: "Adding phasor magnitudes while ignoring phase can overstate or cancel a response incorrectly, especially when signals are not aligned.",
    visualExplanation: "An Argand plane displays real and imaginary axes, a rotating phasor, its magnitude, phase angle and the vector sum of two out-of-phase contributions.",
    applicationTask: "Represent one engineering quantity as z = a + jb with same-unit rectangular components, calculate its non-negative magnitude and verify the result from the squared components."
  },
} as const satisfies AcademyLessonTeachingProfileRegistry;

export default academyLessonTeachingProfilesE0;
