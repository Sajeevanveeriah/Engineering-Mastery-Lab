export const MASTERY_CONTENT_SCHEMA_VERSION = 1 as const;
export const MASTERY_CONTENT_VERSION = "2026.07.28" as const;

export type CapabilityStageId = "E0" | "E1" | "E2" | "E3" | "E4";
export type EngineersAustraliaStage1Category =
  | "Knowledge and skill base"
  | "Engineering application ability"
  | "Professional and personal attributes";
export type NumericCheckOperation =
  | "sum"
  | "subtract"
  | "product"
  | "quotient"
  | "mean"
  | "root-sum-squares"
  | "product-quotient"
  | "maximum";

export interface EquationVariable {
  symbol: string;
  meaning: string;
  unit: string;
}

export interface VerifiedEquation {
  expression: string;
  variables: EquationVariable[];
  dimensionalCheck: string;
}

export interface WorkedExample {
  prompt: string;
  substitution: string;
  answer: number;
  unit: string;
  rounding: string;
  check: {
    operation: NumericCheckOperation;
    inputs: number[];
    divisor?: number;
    expected: number;
    tolerance: number;
    independentMethod: string;
  };
}

export interface MasteryModule {
  id: string;
  domainNumber: number;
  stageId: CapabilityStageId;
  contentVersion: string;
  title: string;
  beginnerExplanation: string;
  prerequisites: string[];
  outcomes: string[];
  vocabulary: Array<{ term: string; meaning: string }>;
  equations: VerifiedEquation[];
  workedExample: WorkedExample;
  retrievalTask: string;
  practicalTask: string;
  commonMistakes: string[];
  diagnosticGuidance: string;
  evidenceRequirement: string;
  masteryGate: string;
  resources: Array<{ label: string; url: string; authority: "official" | "primary" | "community" }>;
  provenance: string[];
  textEquivalent: string;
  designReviewQuestion?: string;
  engineersAustraliaStage1: EngineersAustraliaStage1Category[];
}

export const capabilityStages = [
  {
    id: "E0",
    title: "Engineering Starter",
    outcome: "Learn scientific thinking, SI units, measurement, algebra readiness, computing basics, safety and how engineered systems fit together.",
    accent: "signal"
  },
  {
    id: "E1",
    title: "Undergraduate Foundations",
    outcome: "Build first-year competence in mathematics, physics, programming, design communication, CAD, circuits and engineering practice.",
    accent: "vector"
  },
  {
    id: "E2",
    title: "Mechatronics Core",
    outcome: "Integrate mechanics, materials, electronics, sensing, embedded systems, signals, control and manufacturing.",
    accent: "mechanism"
  },
  {
    id: "E3",
    title: "Robotics and AI Specialisation",
    outcome: "Develop robotics software, ROS 2, simulation, estimation, SLAM, planning, perception, computer vision and applied AI/ML.",
    accent: "trajectory"
  },
  {
    id: "E4",
    title: "R&D Mastery and Proof",
    outcome: "Integrate requirements, architecture, verification, reliability, safety, reproducibility, technical communication and a defensible capstone.",
    accent: "evidence"
  }
] as const;

const officialStage1Map: EngineersAustraliaStage1Category[] = [
  "Knowledge and skill base",
  "Engineering application ability",
  "Professional and personal attributes"
];

export const engineersAustraliaMappingNotice =
  "This is non-accrediting educational guidance. It is not an Engineers Australia assessment, accreditation decision or competency claim.";

export const masteryModules: MasteryModule[] = [
  {
    id: "EML-E0-D01",
    domainNumber: 1,
    stageId: "E0",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "Learning practice and engineering questions",
    beginnerExplanation: "Engineering starts by turning an observation into a bounded question, a measurable requirement and a test that could disprove the proposed answer.",
    prerequisites: [],
    outcomes: ["Write a falsifiable engineering question", "Separate observation, assumption, requirement and evidence", "Plan a short retrieval-build-review cycle"],
    vocabulary: [
      { term: "hypothesis", meaning: "A testable proposed explanation" },
      { term: "requirement", meaning: "A measurable statement of needed behaviour" },
      { term: "evidence", meaning: "A retained record that supports or contradicts a claim" }
    ],
    equations: [{
      expression: "t_cycle = t_recall + t_lesson + t_build + t_close",
      variables: [
        { symbol: "t_cycle", meaning: "total learning-cycle duration", unit: "s" },
        { symbol: "t_recall", meaning: "retrieval duration", unit: "s" },
        { symbol: "t_lesson", meaning: "micro-lesson duration", unit: "s" },
        { symbol: "t_build", meaning: "build or test duration", unit: "s" },
        { symbol: "t_close", meaning: "evidence-close duration", unit: "s" }
      ],
      dimensionalCheck: "s = s + s + s + s"
    }],
    workedExample: {
      prompt: "Four 25 min sessions are planned. Find the total learning time.",
      substitution: "4 x 25 min",
      answer: 100,
      unit: "min",
      rounding: "Exact integer minutes",
      check: { operation: "product", inputs: [4, 25], expected: 100, tolerance: 0, independentMethod: "Repeated addition: 25 + 25 + 25 + 25 = 100 min." }
    },
    retrievalTask: "Without notes, name the four parts of a falsifiable engineering question.",
    practicalTask: "Take one rover observation and write a question, hypothesis, measurable requirement, smallest test and disconfirming result.",
    commonMistakes: ["Writing a topic instead of a question", "Treating a plausible explanation as evidence", "Changing the requirement after seeing the result"],
    diagnosticGuidance: "If the test cannot fail, tighten the measurable threshold or identify the observation that would contradict the claim.",
    evidenceRequirement: "A one-page problem frame with assumptions, test method, expected result and disconfirming condition.",
    masteryGate: "A reviewer can run the stated test and decide pass or fail without asking what the requirement means.",
    resources: [{ label: "NIST Engineering Statistics Handbook", url: "https://www.itl.nist.gov/div898/handbook/", authority: "official" }],
    provenance: ["NIST Engineering Statistics Handbook", "Workbook short-session cadence"],
    textEquivalent: "A linear cycle reads: recall, micro-lesson, build or test, evidence and close; a failed test loops back to the problem statement.",
    designReviewQuestion: "What observation would make you abandon your current explanation?",
    engineersAustraliaStage1: officialStage1Map
  },
  {
    id: "EML-E0-D02",
    domainNumber: 2,
    stageId: "E0",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "SI units, measurement and uncertainty",
    beginnerExplanation: "A measurement is a value, unit and stated uncertainty tied to a method. Calibration compares the instrument with a traceable reference and does not make uncertainty disappear.",
    prerequisites: ["EML-E0-D01"],
    outcomes: ["Check dimensional consistency", "Report resolution separately from uncertainty", "Calculate signed measurement error"],
    vocabulary: [
      { term: "calibration", meaning: "Comparison with a reference under stated conditions" },
      { term: "resolution", meaning: "Smallest display or output increment" },
      { term: "uncertainty", meaning: "Quantified doubt associated with a measurement result" }
    ],
    equations: [{
      expression: "e = x_measured - x_reference",
      variables: [
        { symbol: "e", meaning: "signed measurement error", unit: "m" },
        { symbol: "x_measured", meaning: "instrument result", unit: "m" },
        { symbol: "x_reference", meaning: "reference value", unit: "m" }
      ],
      dimensionalCheck: "m = m - m"
    }],
    workedExample: {
      prompt: "A calliper reads 10.02 mm for a 10.00 mm reference. Find signed error.",
      substitution: "10.02 mm - 10.00 mm",
      answer: 0.02,
      unit: "mm",
      rounding: "Two decimal places, matching the stated readings",
      check: { operation: "subtract", inputs: [10.02, 10], expected: 0.02, tolerance: 1e-12, independentMethod: "Convert to micrometres: 10020 - 10000 = 20 micrometres = 0.02 mm." }
    },
    retrievalTask: "Explain why a display resolution of 0.01 mm is not an uncertainty claim of plus or minus 0.01 mm.",
    practicalTask: "Measure one dimension five times, retain raw values, identify the method and report range, resolution and limitations.",
    commonMistakes: ["Dropping units during calculation", "Using excessive significant figures", "Confusing repeatability with accuracy"],
    diagnosticGuidance: "If units do not cancel to the required result, stop and correct the model before calculating.",
    evidenceRequirement: "Measurement table with raw values, instrument resolution, method, error calculation and uncertainty limitation.",
    masteryGate: "All quantities retain units, the signed error is correct, and the uncertainty claim is no stronger than the available evidence.",
    resources: [
      { label: "BIPM SI Brochure", url: "https://www.bipm.org/en/publications/si-brochure", authority: "official" },
      { label: "NIST Measurement Uncertainty", url: "https://www.nist.gov/pml/nist-technical-note-1297", authority: "official" }
    ],
    provenance: ["BIPM SI Brochure", "NIST Technical Note 1297"],
    textEquivalent: "A measurement chain runs from measurand through method and instrument to a value with unit and uncertainty; calibration links the instrument to a reference.",
    designReviewQuestion: "Which part of your measurement chain dominates uncertainty?",
    engineersAustraliaStage1: ["Knowledge and skill base", "Engineering application ability"]
  },
  {
    id: "EML-E0-D03",
    domainNumber: 3,
    stageId: "E0",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "Algebra, vectors and coordinate frames",
    beginnerExplanation: "Algebra preserves equality while vectors add direction. Coordinate frames state where components are expressed, so the same physical vector can have different component values.",
    prerequisites: ["EML-E0-D02"],
    outcomes: ["Rearrange a linear equation", "Calculate a two-dimensional vector magnitude", "Label the source and destination frames of a transform"],
    vocabulary: [
      { term: "scalar", meaning: "A quantity with magnitude only" },
      { term: "vector", meaning: "A quantity with magnitude and direction" },
      { term: "frame", meaning: "An origin and oriented axes used to express coordinates" }
    ],
    equations: [{
      expression: "|v| = sqrt(v_x^2 + v_y^2)",
      variables: [
        { symbol: "|v|", meaning: "vector magnitude", unit: "m/s" },
        { symbol: "v_x", meaning: "x-axis component", unit: "m/s" },
        { symbol: "v_y", meaning: "y-axis component", unit: "m/s" }
      ],
      dimensionalCheck: "m/s = sqrt((m/s)^2 + (m/s)^2)"
    }],
    workedExample: {
      prompt: "A velocity has components 3 m/s and 4 m/s. Find its magnitude.",
      substitution: "sqrt((3 m/s)^2 + (4 m/s)^2)",
      answer: 5,
      unit: "m/s",
      rounding: "Exact for the supplied values",
      check: { operation: "root-sum-squares", inputs: [3, 4], expected: 5, tolerance: 1e-12, independentMethod: "The 3-4-5 Pythagorean triple gives 5 m/s." }
    },
    retrievalTask: "Sketch two frames and state which superscript or prefix identifies the frame of expression.",
    practicalTask: "Measure a displacement on a grid, express it in two translated frames and verify the physical magnitude is unchanged.",
    commonMistakes: ["Adding magnitudes while ignoring direction", "Mixing degrees and radians", "Using an unlabeled frame"],
    diagnosticGuidance: "If a transformed point changes physical distance under a pure translation or rotation, inspect frame order and units.",
    evidenceRequirement: "A labelled frame sketch, component calculation and invariant magnitude check.",
    masteryGate: "The learner rearranges, computes and transforms a vector with correct units and explicit frame labels.",
    resources: [{ label: "MIT OpenCourseWare Linear Algebra", url: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/", authority: "primary" }],
    provenance: ["MIT OpenCourseWare 18.06"],
    textEquivalent: "Two perpendicular axes meet at an origin; a vector arrow has x and y components whose right-triangle hypotenuse is the vector magnitude.",
    designReviewQuestion: "In which frame is each input expressed, and in which frame is the result required?",
    engineersAustraliaStage1: ["Knowledge and skill base", "Engineering application ability"]
  },
  {
    id: "EML-E1-D04",
    domainNumber: 4,
    stageId: "E1",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "Calculus, linear algebra and statistics",
    beginnerExplanation: "Calculus describes change, linear algebra organises coupled quantities, and probability describes uncertainty. Numerical methods approximate results when closed forms are unavailable.",
    prerequisites: ["EML-E0-D03"],
    outcomes: ["Interpret derivative and integral units", "Represent simultaneous equations as a matrix", "Calculate and interpret an arithmetic mean"],
    vocabulary: [
      { term: "derivative", meaning: "Local rate of change" },
      { term: "integral", meaning: "Accumulation over an interval" },
      { term: "distribution", meaning: "A model assigning relative likelihood across values" }
    ],
    equations: [{
      expression: "x_mean = (1/n) sum(x_i)",
      variables: [
        { symbol: "x_mean", meaning: "arithmetic mean", unit: "same as x" },
        { symbol: "x_i", meaning: "sample value", unit: "same as x" },
        { symbol: "n", meaning: "number of samples", unit: "1" }
      ],
      dimensionalCheck: "unit(x) = (1/1) x unit(x)"
    }],
    workedExample: {
      prompt: "Find the mean of 2 s, 4 s and 6 s.",
      substitution: "(2 + 4 + 6) s / 3",
      answer: 4,
      unit: "s",
      rounding: "Exact",
      check: { operation: "mean", inputs: [2, 4, 6], expected: 4, tolerance: 0, independentMethod: "The values are symmetric about 4 s." }
    },
    retrievalTask: "State the units of the derivative and integral of position with respect to time.",
    practicalTask: "Estimate velocity from a five-point position-time table, plot it and compare forward and central differences.",
    commonMistakes: ["Ignoring sample interval", "Treating correlation as causation", "Inverting a singular or ill-conditioned matrix without checking"],
    diagnosticGuidance: "If an estimate changes sharply with a smaller step, examine noise, conditioning and the numerical scheme.",
    evidenceRequirement: "Raw data, matrix or difference equations, calculation, plot with text summary and error discussion.",
    masteryGate: "A second implementation reproduces the reported result within the stated tolerance and units.",
    resources: [
      { label: "MIT OpenCourseWare Calculus", url: "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/", authority: "primary" },
      { label: "NIST Engineering Statistics Handbook", url: "https://www.itl.nist.gov/div898/handbook/", authority: "official" }
    ],
    provenance: ["MIT OpenCourseWare", "NIST Engineering Statistics Handbook"],
    textEquivalent: "A position curve slopes upward; tangent slope represents velocity, while area under a velocity curve represents displacement.",
    designReviewQuestion: "How sensitive is your numerical result to sample interval and measurement noise?",
    engineersAustraliaStage1: ["Knowledge and skill base", "Engineering application ability"]
  },
  {
    id: "EML-E1-D05",
    domainNumber: 5,
    stageId: "E1",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "Physics foundations for engineered systems",
    beginnerExplanation: "Mechanics, electricity, magnetism, waves and thermofluids use conservation laws to connect causes, stored energy and observable motion or flow.",
    prerequisites: ["EML-E1-D04"],
    outcomes: ["Draw a bounded free-body diagram", "Apply an energy balance", "Check whether a result is physically plausible"],
    vocabulary: [
      { term: "momentum", meaning: "Mass multiplied by velocity" },
      { term: "work", meaning: "Energy transferred by force through displacement" },
      { term: "conservation", meaning: "A balance in which accounted inputs, storage and outputs reconcile" }
    ],
    equations: [{
      expression: "E_k = 0.5 m v^2",
      variables: [
        { symbol: "E_k", meaning: "translational kinetic energy", unit: "J" },
        { symbol: "m", meaning: "mass", unit: "kg" },
        { symbol: "v", meaning: "speed", unit: "m/s" }
      ],
      dimensionalCheck: "J = kg x (m/s)^2 = kg m^2/s^2"
    }],
    workedExample: {
      prompt: "Find the kinetic energy of a 2 kg rover travelling at 3 m/s.",
      substitution: "0.5 x 2 kg x (3 m/s)^2",
      answer: 9,
      unit: "J",
      rounding: "Exact for supplied values",
      check: { operation: "product", inputs: [0.5, 2, 3, 3], expected: 9, tolerance: 0, independentMethod: "Mass factor 0.5 x 2 equals 1, leaving 3 squared, or 9 J." }
    },
    retrievalTask: "List the system boundary, energy inputs, stored energy and losses for a moving battery rover.",
    practicalTask: "Build an energy and force budget for a rover accelerating on level ground, including one measured or justified loss.",
    commonMistakes: ["Omitting reaction forces", "Mixing mass and weight", "Assuming energy conservation means no losses"],
    diagnosticGuidance: "If predicted output exceeds accounted input, inspect the boundary, sign convention and unit conversions.",
    evidenceRequirement: "Free-body diagram, energy balance, assumptions, numerical check and plausibility statement.",
    masteryGate: "Forces and energy reconcile within the stated model boundary and no term has an unexplained sign or unit.",
    resources: [{ label: "MIT OpenCourseWare Classical Mechanics", url: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/", authority: "primary" }],
    provenance: ["MIT OpenCourseWare 8.01SC"],
    textEquivalent: "A rover block has labelled force arrows; a separate flow lists electrical input, kinetic and potential storage, and thermal losses.",
    designReviewQuestion: "Which omitted physical effect would most change this model?",
    engineersAustraliaStage1: ["Knowledge and skill base", "Engineering application ability"]
  },
  {
    id: "EML-E1-D06",
    domainNumber: 6,
    stageId: "E1",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "Linux, Git and reproducible computing",
    beginnerExplanation: "A reproducible environment records source, dependencies, configuration, inputs and commands so another person can obtain the same bounded result without guessing.",
    prerequisites: ["EML-E0-D01"],
    outcomes: ["Navigate and inspect files safely", "Use a small Git change-review cycle", "Record an environment and exact reproduction command"],
    vocabulary: [
      { term: "working tree", meaning: "Checked-out files and local changes" },
      { term: "commit", meaning: "A recorded source snapshot with parent history" },
      { term: "environment", meaning: "Runtime, dependency and configuration context" }
    ],
    equations: [{
      expression: "t_saved = t_manual - t_reproduced",
      variables: [
        { symbol: "t_saved", meaning: "time saved by reproducible execution", unit: "s" },
        { symbol: "t_manual", meaning: "manual setup duration", unit: "s" },
        { symbol: "t_reproduced", meaning: "recorded setup duration", unit: "s" }
      ],
      dimensionalCheck: "s = s - s"
    }],
    workedExample: {
      prompt: "Manual setup takes 420 s and the recorded path takes 75 s. Find time saved.",
      substitution: "420 s - 75 s",
      answer: 345,
      unit: "s",
      rounding: "Exact integer seconds",
      check: { operation: "subtract", inputs: [420, 75], expected: 345, tolerance: 0, independentMethod: "75 s + 345 s reconciles to 420 s." }
    },
    retrievalTask: "From memory, name the minimum records needed to reproduce a local calculation.",
    practicalTask: "Create a clean local reproduction using a documented command, fixed input and expected checksum without changing remote state.",
    commonMistakes: ["Running destructive commands from the wrong directory", "Committing generated secrets", "Claiming reproducibility without a fresh run"],
    diagnosticGuidance: "If two runs differ, compare source revision, dependency lock, environment variables, locale, time and random seeds.",
    evidenceRequirement: "Revision, environment summary, exact command, input checksum and fresh-run output.",
    masteryGate: "A fresh directory run produces the expected result without undocumented manual edits.",
    resources: [
      { label: "Git Reference", url: "https://git-scm.com/docs", authority: "official" },
      { label: "Ubuntu Command Line for Beginners", url: "https://ubuntu.com/tutorials/command-line-for-beginners", authority: "official" }
    ],
    provenance: ["Official Git documentation", "Official Ubuntu tutorial"],
    textEquivalent: "A reproducibility chain connects revision, dependency lock, configuration, inputs, command, output and checksum.",
    designReviewQuestion: "Which unrecorded environmental input could make this result drift?",
    engineersAustraliaStage1: ["Engineering application ability", "Professional and personal attributes"]
  },
  {
    id: "EML-E1-D07",
    domainNumber: 7,
    stageId: "E1",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "Programming and software architecture",
    beginnerExplanation: "Programs turn explicit inputs into outputs through data structures and algorithms. Tests define checked behaviour, while architecture keeps dependencies and responsibilities understandable.",
    prerequisites: ["EML-E1-D06"],
    outcomes: ["Implement a bounded algorithm in Python and C or C++", "Write nominal and boundary tests", "Describe module interfaces and build them with CMake"],
    vocabulary: [
      { term: "algorithm", meaning: "A finite sequence of steps for a class of problems" },
      { term: "complexity", meaning: "How resource use grows with input size" },
      { term: "interface", meaning: "The inputs, outputs and obligations between components" }
    ],
    equations: [{
      expression: "B = n_samples x n_channels x bytes_per_sample",
      variables: [
        { symbol: "B", meaning: "payload size", unit: "B" },
        { symbol: "n_samples", meaning: "sample count", unit: "1" },
        { symbol: "n_channels", meaning: "channel count", unit: "1" },
        { symbol: "bytes_per_sample", meaning: "storage per sample", unit: "B" }
      ],
      dimensionalCheck: "B = 1 x 1 x B"
    }],
    workedExample: {
      prompt: "Find the payload for 100 samples, 8 channels and 4 B per sample.",
      substitution: "100 x 8 x 4 B",
      answer: 3200,
      unit: "B",
      rounding: "Exact byte count",
      check: { operation: "product", inputs: [100, 8, 4], expected: 3200, tolerance: 0, independentMethod: "One frame is 8 x 4 = 32 B; 100 frames total 3200 B." }
    },
    retrievalTask: "Explain the difference between a unit test, an integration test and an acceptance test.",
    practicalTask: "Implement and test a ring buffer with capacity, empty, full and wrap-around cases, then expose it through a small CMake target.",
    commonMistakes: ["Ignoring invalid input", "Testing implementation details only", "Allowing ownership and lifetime rules to remain implicit"],
    diagnosticGuidance: "Reproduce the smallest failing input, state the invariant and inspect the first operation that violates it.",
    evidenceRequirement: "Source, interface contract, build command, tests, test output and complexity note.",
    masteryGate: "Nominal, zero, boundary and invalid cases pass in a clean build and the interface has no undocumented side effects.",
    resources: [
      { label: "Python Documentation", url: "https://docs.python.org/3/", authority: "official" },
      { label: "CMake Documentation", url: "https://cmake.org/documentation/", authority: "official" }
    ],
    provenance: ["Official Python documentation", "Official CMake documentation"],
    textEquivalent: "A layered diagram shows input adapters feeding a domain core, with outputs leaving through explicit interfaces and tests surrounding each boundary.",
    designReviewQuestion: "Which invariant must remain true across every public operation?",
    engineersAustraliaStage1: ["Knowledge and skill base", "Engineering application ability"]
  },
  {
    id: "EML-E1-D08",
    domainNumber: 8,
    stageId: "E1",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "Engineering graphics, CAD and tolerances",
    beginnerExplanation: "A technical drawing communicates geometry, interfaces and permitted variation. CAD captures design intent, while tolerances and GD&T fundamentals state what variation still permits function and manufacture.",
    prerequisites: ["EML-E0-D02", "EML-E0-D03"],
    outcomes: ["Read orthographic views and dimensions", "Create a parameter-driven part concept", "Calculate a tolerance span and explain functional fit"],
    vocabulary: [
      { term: "datum", meaning: "A theoretically exact reference used to establish a frame" },
      { term: "tolerance", meaning: "Permitted variation from a stated nominal value" },
      { term: "design intent", meaning: "The functional relationships the model is meant to preserve" }
    ],
    equations: [{
      expression: "T = x_upper - x_lower",
      variables: [
        { symbol: "T", meaning: "total tolerance span", unit: "m" },
        { symbol: "x_upper", meaning: "upper size limit", unit: "m" },
        { symbol: "x_lower", meaning: "lower size limit", unit: "m" }
      ],
      dimensionalCheck: "m = m - m"
    }],
    workedExample: {
      prompt: "A feature may be 19.9 mm to 20.1 mm. Find the tolerance span.",
      substitution: "20.1 mm - 19.9 mm",
      answer: 0.2,
      unit: "mm",
      rounding: "One decimal place",
      check: { operation: "subtract", inputs: [20.1, 19.9], expected: 0.2, tolerance: 1e-12, independentMethod: "The limits are plus and minus 0.1 mm about 20.0 mm, giving a 0.2 mm span." }
    },
    retrievalTask: "State why a dimension should appear once and why a datum is not a physical extra feature.",
    practicalTask: "Create a bounded mounting plate concept with named parameters, interface datums, a tolerance decision and a DFM note.",
    commonMistakes: ["Over-constraining a sketch", "Tolerancing every dimension tightly", "Using a rendered view as a manufacturing drawing"],
    diagnosticGuidance: "If the part cannot be manufactured or inspected unambiguously, revisit datums, functional interfaces and tolerance allocation.",
    evidenceRequirement: "Parameter table, drawing views, tolerance calculation, interface explanation and DFM review.",
    masteryGate: "Geometry regenerates after a parameter change and every critical interface has a measurable, non-conflicting definition.",
    resources: [{ label: "NIST Product Data Standards", url: "https://www.nist.gov/programs-projects/product-data-standards", authority: "official" }],
    provenance: ["NIST product data standards overview", "Engineering Mastery Lab CAD Studio boundary"],
    textEquivalent: "Front, top and side views align; dimensions reference functional datums, and upper and lower limits bound the acceptable feature size.",
    designReviewQuestion: "Which tolerance protects function, and how will it be inspected?",
    engineersAustraliaStage1: ["Knowledge and skill base", "Engineering application ability"]
  },
  {
    id: "EML-E2-D09",
    domainNumber: 9,
    stageId: "E2",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "Mechanics, materials and machine elements",
    beginnerExplanation: "Loads create internal stress and deformation. Material properties, geometry, joints, gears and mechanisms determine whether a machine carries load, moves as intended and survives vibration and fatigue.",
    prerequisites: ["EML-E1-D05", "EML-E1-D08"],
    outcomes: ["Calculate direct stress", "Identify load paths and likely failure modes", "Select a machine element using stated assumptions"],
    vocabulary: [
      { term: "stress", meaning: "Internal force intensity over area" },
      { term: "stiffness", meaning: "Resistance to deformation" },
      { term: "factor of safety", meaning: "Ratio between a limiting capacity and design demand under a stated basis" }
    ],
    equations: [{
      expression: "sigma = F / A",
      variables: [
        { symbol: "sigma", meaning: "normal stress", unit: "Pa" },
        { symbol: "F", meaning: "axial force", unit: "N" },
        { symbol: "A", meaning: "loaded cross-sectional area", unit: "m^2" }
      ],
      dimensionalCheck: "Pa = N/m^2"
    }],
    workedExample: {
      prompt: "Find stress from 1200 N over 0.0002 m^2.",
      substitution: "1200 N / 0.0002 m^2",
      answer: 6000000,
      unit: "Pa",
      rounding: "Two significant figures: 6.0 MPa",
      check: { operation: "quotient", inputs: [1200, 0.0002], expected: 6000000, tolerance: 1e-6, independentMethod: "0.0002 m^2 x 6,000,000 Pa reconciles to 1200 N." }
    },
    retrievalTask: "Draw a load path through a wheel, axle, bearing, housing and chassis.",
    practicalTask: "Size one rover bracket for stress and deflection, then identify vibration, joint and manufacturing limitations.",
    commonMistakes: ["Using the wrong cross-sectional area", "Treating yield as the only failure mode", "Ignoring load direction and joint eccentricity"],
    diagnosticGuidance: "If a result is implausibly low, inspect unit conversion, section geometry and whether bending dominates direct stress.",
    evidenceRequirement: "Free-body diagram, geometry, material source, stress and deflection checks, failure-mode discussion and margin.",
    masteryGate: "Independent calculation reproduces the governing result and the selected element has a traceable capacity above demand under the stated assumptions.",
    resources: [{ label: "NIST Materials Data", url: "https://www.nist.gov/mml/materials-data-repository", authority: "official" }],
    provenance: ["NIST materials data repository", "Engineering Mastery Lab mechanical simulation model"],
    textEquivalent: "Force arrows follow a continuous path from wheel contact through axle and bearings into the chassis; the smallest or most highly bent section is highlighted.",
    designReviewQuestion: "Which failure mode governs, and what evidence supports the chosen allowable value?",
    engineersAustraliaStage1: ["Knowledge and skill base", "Engineering application ability"]
  },
  {
    id: "EML-E2-D10",
    domainNumber: 10,
    stageId: "E2",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "Manufacturing, assembly and lifecycle",
    beginnerExplanation: "A good design can be made, assembled, inspected, maintained and retired safely. Process capability and review evidence matter as much as nominal geometry.",
    prerequisites: ["EML-E1-D08", "EML-E2-D09"],
    outcomes: ["Compare manufacturing processes against requirements", "Plan assembly and inspection order", "Calculate first-pass yield without hiding defects"],
    vocabulary: [
      { term: "DFM", meaning: "Design for manufacture" },
      { term: "DFA", meaning: "Design for assembly" },
      { term: "yield", meaning: "Accepted output divided by attempted output under a stated rule" }
    ],
    equations: [{
      expression: "Y = n_pass / n_total",
      variables: [
        { symbol: "Y", meaning: "first-pass yield", unit: "1" },
        { symbol: "n_pass", meaning: "items passing first inspection", unit: "1" },
        { symbol: "n_total", meaning: "items inspected", unit: "1" }
      ],
      dimensionalCheck: "1 = 1/1"
    }],
    workedExample: {
      prompt: "Ninety-two of 100 parts pass first inspection. Find yield.",
      substitution: "92 / 100",
      answer: 0.92,
      unit: "1",
      rounding: "0.92, equivalent to 92 percent",
      check: { operation: "quotient", inputs: [92, 100], expected: 0.92, tolerance: 0, independentMethod: "Eight failures from 100 imply 100 percent - 8 percent = 92 percent." }
    },
    retrievalTask: "Name one manufacturing, assembly, inspection, maintenance and end-of-life question for a rover chassis.",
    practicalTask: "Review a small assembly for process choice, tool access, mistake-proofing, inspection and replaceable wear parts.",
    commonMistakes: ["Optimising part count without serviceability", "Ignoring inspection access", "Reporting reworked parts as first-pass successes"],
    diagnosticGuidance: "When build variation is high, separate design sensitivity, process variation, material variation and inspection error.",
    evidenceRequirement: "Process decision matrix, assembly sequence, inspection plan, first-pass calculation and lifecycle risks.",
    masteryGate: "A reviewer can assemble, inspect and maintain the design using the stated sequence and acceptance criteria.",
    resources: [{ label: "NIST Manufacturing Extension Partnership", url: "https://www.nist.gov/mep", authority: "official" }],
    provenance: ["NIST Manufacturing Extension Partnership"],
    textEquivalent: "A lifecycle loop moves through material, manufacture, assembly, operation, maintenance, recovery and disposal, with inspection gates at manufacture and assembly.",
    designReviewQuestion: "Where can assembly variation create a hidden functional failure?",
    engineersAustraliaStage1: officialStage1Map
  },
  {
    id: "EML-E2-D11",
    domainNumber: 11,
    stageId: "E2",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "Circuits, power and energy storage",
    beginnerExplanation: "Circuits provide controlled paths for charge and energy. Analogue and digital components shape signals, while supplies, batteries and power electronics must satisfy voltage, current, thermal and protection limits.",
    prerequisites: ["EML-E1-D05"],
    outcomes: ["Apply Ohm's law and power balance", "Read a simple analogue and digital interface", "Create a protected rover power budget"],
    vocabulary: [
      { term: "voltage", meaning: "Electric potential difference" },
      { term: "current", meaning: "Rate of charge flow" },
      { term: "ground", meaning: "Chosen circuit reference, not automatically earth" }
    ],
    equations: [{
      expression: "I = V / R",
      variables: [
        { symbol: "I", meaning: "current", unit: "A" },
        { symbol: "V", meaning: "potential difference", unit: "V" },
        { symbol: "R", meaning: "resistance", unit: "ohm" }
      ],
      dimensionalCheck: "A = V/ohm"
    }],
    workedExample: {
      prompt: "A 6 ohm load is connected across 12 V. Find ideal current.",
      substitution: "12 V / 6 ohm",
      answer: 2,
      unit: "A",
      rounding: "Exact for ideal values",
      check: { operation: "quotient", inputs: [12, 6], expected: 2, tolerance: 0, independentMethod: "2 A x 6 ohm reconciles to 12 V." }
    },
    retrievalTask: "Explain the difference between power, energy and battery charge capacity.",
    practicalTask: "Create a rover power tree with nominal, peak and fault current, wire and fuse assumptions, conversion losses and battery operating limits.",
    commonMistakes: ["Adding currents from mutually exclusive states", "Ignoring inrush and converter efficiency", "Using ground symbols as proof of a safe return path"],
    diagnosticGuidance: "If voltage collapses under load, inspect source impedance, wiring, protection, converter limits and measurement reference.",
    evidenceRequirement: "Schematic, load table, current and energy calculations, protection rationale and thermal limitations.",
    masteryGate: "Nominal and peak demand reconcile through every power-tree branch and protection ratings are traceable to the stated safe boundary.",
    resources: [{ label: "All About Circuits textbook", url: "https://www.allaboutcircuits.com/textbook/", authority: "community" }],
    provenance: ["All About Circuits open textbook", "Engineering Mastery Lab electrical simulation model"],
    textEquivalent: "A battery feeds a fuse and main switch, then branches through converters to compute, sensors and motors; each branch lists voltage, peak current and protection.",
    designReviewQuestion: "Which single fault can remove control while leaving actuator energy available?",
    engineersAustraliaStage1: ["Knowledge and skill base", "Engineering application ability"]
  },
  {
    id: "EML-E2-D12",
    domainNumber: 12,
    stageId: "E2",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "Sensors, instrumentation and calibration",
    beginnerExplanation: "A sensor converts a physical quantity into a signal. Instrumentation must preserve bandwidth and range while controlling noise, calibration error, quantisation and environmental sensitivity.",
    prerequisites: ["EML-E0-D02", "EML-E2-D11"],
    outcomes: ["Build a sensor measurement chain", "Fit and check a linear calibration", "Separate noise, bias, resolution and uncertainty"],
    vocabulary: [
      { term: "sensitivity", meaning: "Change in output per change in input" },
      { term: "bias", meaning: "Systematic offset under stated conditions" },
      { term: "ADC", meaning: "Analogue-to-digital converter" }
    ],
    equations: [{
      expression: "S = delta_y / delta_x",
      variables: [
        { symbol: "S", meaning: "sensor sensitivity", unit: "V/Pa" },
        { symbol: "delta_y", meaning: "change in output voltage", unit: "V" },
        { symbol: "delta_x", meaning: "change in measurand", unit: "Pa" }
      ],
      dimensionalCheck: "V/Pa = V/Pa"
    }],
    workedExample: {
      prompt: "Output changes by 4 V for a 2 kPa input change. Find sensitivity.",
      substitution: "4 V / 2 kPa",
      answer: 2,
      unit: "V/kPa",
      rounding: "Exact for supplied values",
      check: { operation: "quotient", inputs: [4, 2], expected: 2, tolerance: 0, independentMethod: "2 V/kPa x 2 kPa reconciles to 4 V." }
    },
    retrievalTask: "Name the elements between a physical quantity and a timestamped engineering value.",
    practicalTask: "Collect a multi-point calibration, retain raw data, fit a line, inspect residuals and state the valid operating range.",
    commonMistakes: ["Calibrating with too few points", "Extrapolating beyond the tested range", "Filtering away real dynamics"],
    diagnosticGuidance: "A curved residual trend suggests nonlinearity; random spread suggests noise; a stable offset suggests bias.",
    evidenceRequirement: "Measurement-chain diagram, raw calibration data, fitted model, residual view, uncertainty limits and text equivalent.",
    masteryGate: "An independent point inside the calibrated range meets a stated error threshold without hidden manual adjustment.",
    resources: [{ label: "NIST Calibration Services", url: "https://www.nist.gov/calibrations", authority: "official" }],
    provenance: ["NIST calibration guidance"],
    textEquivalent: "The chain is measurand, sensor, conditioning, ADC, timestamp, calibration model and engineering value; noise and bias enter at identified points.",
    designReviewQuestion: "What condition invalidates this calibration model?",
    engineersAustraliaStage1: ["Knowledge and skill base", "Engineering application ability"]
  },
  {
    id: "EML-E2-D13",
    domainNumber: 13,
    stageId: "E2",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "Microcontrollers and real-time design",
    beginnerExplanation: "A microcontroller combines processing, memory and peripherals. Real-time design is about meeting bounded timing obligations, not merely running quickly.",
    prerequisites: ["EML-E1-D07", "EML-E2-D11", "EML-E2-D12"],
    outcomes: ["Configure GPIO, timer and communication peripherals", "Separate interrupt and task responsibilities", "Measure deadline, jitter and worst observed execution time"],
    vocabulary: [
      { term: "interrupt", meaning: "An event that transfers control to a bounded handler" },
      { term: "jitter", meaning: "Variation in event or task timing" },
      { term: "deadline", meaning: "Latest acceptable completion time for an operation" }
    ],
    equations: [{
      expression: "T = 1 / f",
      variables: [
        { symbol: "T", meaning: "period", unit: "s" },
        { symbol: "f", meaning: "frequency", unit: "Hz" }
      ],
      dimensionalCheck: "s = 1/(1/s)"
    }],
    workedExample: {
      prompt: "Find the period of a 1000 Hz timer.",
      substitution: "1 / 1000 Hz",
      answer: 0.001,
      unit: "s",
      rounding: "0.001 s, equivalent to 1 ms",
      check: { operation: "quotient", inputs: [1, 1000], expected: 0.001, tolerance: 0, independentMethod: "1000 cycles/s x 0.001 s/cycle equals one cycle." }
    },
    retrievalTask: "Explain why blocking I/O inside a high-priority interrupt handler is dangerous.",
    practicalTask: "Implement a periodic sensor task on an ESP32 or STM32 model, measure timing and trigger an explicit safe state on stale data.",
    commonMistakes: ["Doing unbounded work in an interrupt", "Sharing data without an atomicity plan", "Calling an average timing result a worst case"],
    diagnosticGuidance: "If deadlines are missed, measure each task and interrupt, then inspect priority inversion, blocking, allocation and shared resources.",
    evidenceRequirement: "Task model, timing budget, firmware or simulation, measured trace, stale-data test and safe-state result.",
    masteryGate: "Nominal and overload tests meet the declared timing and safe-state acceptance criteria with retained traces.",
    resources: [
      { label: "ESP-IDF Programming Guide", url: "https://docs.espressif.com/projects/esp-idf/en/latest/esp32/", authority: "official" },
      { label: "STM32 Documentation", url: "https://www.st.com/en/microcontrollers-microprocessors/stm32-32-bit-arm-cortex-mcus.html", authority: "official" }
    ],
    provenance: ["Espressif ESP-IDF documentation", "STMicroelectronics STM32 documentation"],
    textEquivalent: "A timing lane shows interrupt capture, queue transfer, periodic task processing and actuator update, each bounded by a deadline and stale-data guard.",
    designReviewQuestion: "What is the safe behaviour when this task misses two consecutive deadlines?",
    engineersAustraliaStage1: ["Knowledge and skill base", "Engineering application ability"]
  },
  {
    id: "EML-E2-D14",
    domainNumber: 14,
    stageId: "E2",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "Robust embedded and robotics communication",
    beginnerExplanation: "UART, I2C, SPI, CAN, Ethernet and wireless links trade wiring, speed, reach and fault behaviour. Robust protocols add framing, identity, timing, validation and recovery.",
    prerequisites: ["EML-E2-D13"],
    outcomes: ["Select a link from system constraints", "Calculate ideal transmission time", "Design framing, timeout, retry and stale-data behaviour"],
    vocabulary: [
      { term: "frame", meaning: "A bounded unit of transmitted data" },
      { term: "latency", meaning: "Elapsed time from source event to required observation" },
      { term: "CRC", meaning: "Cyclic redundancy check used to detect many transmission errors" }
    ],
    equations: [{
      expression: "t_tx = N_bits / R_bit",
      variables: [
        { symbol: "t_tx", meaning: "ideal transmission time", unit: "s" },
        { symbol: "N_bits", meaning: "transmitted bit count", unit: "1" },
        { symbol: "R_bit", meaning: "bit rate", unit: "bit/s" }
      ],
      dimensionalCheck: "s = bit/(bit/s)"
    }],
    workedExample: {
      prompt: "Find ideal time for 80 bits at 500000 bit/s.",
      substitution: "80 bit / 500000 bit/s",
      answer: 0.00016,
      unit: "s",
      rounding: "0.00016 s, equivalent to 0.16 ms",
      check: { operation: "quotient", inputs: [80, 500000], expected: 0.00016, tolerance: 1e-15, independentMethod: "500000 bit/s is 500 bit/ms; 80/500 = 0.16 ms." }
    },
    retrievalTask: "Name four protocol fields or behaviours that let a receiver reject stale or malformed data.",
    practicalTask: "Design and test a versioned sensor frame with length, sequence, timestamp, CRC, timeout and recovery behaviour.",
    commonMistakes: ["Equating bit rate with end-to-end throughput", "Retrying forever", "Treating packet arrival as proof that data are current"],
    diagnosticGuidance: "Separate physical-link errors, framing errors, timing faults, congestion, stale data and semantic incompatibility.",
    evidenceRequirement: "Interface control description, timing budget, encoded examples, corruption and timeout tests, and recovery trace.",
    masteryGate: "The receiver safely rejects truncated, corrupted, duplicated, delayed and version-incompatible frames.",
    resources: [{ label: "IETF RFC Index", url: "https://www.rfc-editor.org/rfc-index.html", authority: "official" }],
    provenance: ["RFC Editor index", "Workbook robust robot networking exercises"],
    textEquivalent: "A sender wraps payload with version, length, sequence, timestamp and CRC; the receiver validates each field before updating state.",
    designReviewQuestion: "How does the receiver distinguish missing, delayed, duplicated and incompatible data?",
    engineersAustraliaStage1: ["Knowledge and skill base", "Engineering application ability"]
  },
  {
    id: "EML-E2-D15",
    domainNumber: 15,
    stageId: "E2",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "Signals, sampling and filtering",
    beginnerExplanation: "Signals vary over time or space. Sampling converts a continuous signal into values, while filters deliberately change frequency content and introduce magnitude and phase effects.",
    prerequisites: ["EML-E1-D04", "EML-E2-D12"],
    outcomes: ["Relate sample rate to signal bandwidth", "Identify aliasing", "Compare a time trace and frequency response with units"],
    vocabulary: [
      { term: "bandwidth", meaning: "Frequency range relevant to the signal or system" },
      { term: "aliasing", meaning: "Indistinguishable sampled representation of higher-frequency content" },
      { term: "phase", meaning: "Relative timing expressed as an angle for periodic signals" }
    ],
    equations: [{
      expression: "f_s > 2 f_max",
      variables: [
        { symbol: "f_s", meaning: "sample frequency", unit: "Hz" },
        { symbol: "f_max", meaning: "highest retained signal frequency", unit: "Hz" }
      ],
      dimensionalCheck: "Hz > 1 x Hz"
    }],
    workedExample: {
      prompt: "Find the Nyquist lower bound for a 120 Hz signal component.",
      substitution: "2 x 120 Hz",
      answer: 240,
      unit: "Hz",
      rounding: "Exact lower bound; a practical design requires margin and anti-alias filtering",
      check: { operation: "product", inputs: [2, 120], expected: 240, tolerance: 0, independentMethod: "A 120 Hz cycle sampled twice per cycle requires 240 samples/s." }
    },
    retrievalTask: "Explain why sampling above twice the desired bandwidth does not replace an anti-alias filter.",
    practicalTask: "Generate a two-tone signal, sample it above and below the Nyquist bound, filter it and compare time and frequency views.",
    commonMistakes: ["Using sample rate as bandwidth", "Ignoring phase delay", "Filtering before inspecting saturation and dropouts"],
    diagnosticGuidance: "If a new low-frequency component appears after sampling, test whether it is an alias of higher-frequency input.",
    evidenceRequirement: "Signal definition, sample rates, plots with text equivalents, filter parameters and before-after error metrics.",
    masteryGate: "The learner predicts and demonstrates alias frequency and explains filter magnitude and phase trade-offs.",
    resources: [{ label: "SciPy Signal Reference", url: "https://docs.scipy.org/doc/scipy/reference/signal.html", authority: "official" }],
    provenance: ["Official SciPy signal reference"],
    textEquivalent: "A high-frequency sine wave is sampled sparsely and appears as a slower wave; a denser sample set follows the original oscillation.",
    designReviewQuestion: "What unmeasured high-frequency content could fold into your band of interest?",
    engineersAustraliaStage1: ["Knowledge and skill base", "Engineering application ability"]
  },
  {
    id: "EML-E2-D16",
    domainNumber: 16,
    stageId: "E2",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "System modelling, feedback and motor control",
    beginnerExplanation: "A model predicts how state changes under input and disturbance. Feedback compares a reference with measured output, but saturation, delay and uncertainty limit achievable control.",
    prerequisites: ["EML-E1-D04", "EML-E1-D05", "EML-E2-D15"],
    outcomes: ["Form a bounded dynamic model", "Explain proportional, integral and derivative actions", "Test stability, saturation and disturbance recovery"],
    vocabulary: [
      { term: "feedback", meaning: "Use of measured output to alter input" },
      { term: "stability", meaning: "Bounded response property under stated model and inputs" },
      { term: "saturation", meaning: "An actuator or signal reaching a hard limit" }
    ],
    equations: [{
      expression: "u_P = K_p e",
      variables: [
        { symbol: "u_P", meaning: "proportional control contribution", unit: "same as actuator command" },
        { symbol: "K_p", meaning: "proportional gain", unit: "command/error-unit" },
        { symbol: "e", meaning: "reference minus measured output", unit: "error-unit" }
      ],
      dimensionalCheck: "command = (command/error-unit) x error-unit"
    }],
    workedExample: {
      prompt: "With Kp = 2.5 and error = 0.4 rad, find proportional command.",
      substitution: "2.5 command/rad x 0.4 rad",
      answer: 1,
      unit: "command",
      rounding: "Exact for supplied values",
      check: { operation: "product", inputs: [2.5, 0.4], expected: 1, tolerance: 0, independentMethod: "0.4 is two-fifths; two-fifths of 2.5 is 1." }
    },
    retrievalTask: "Describe what P, I and D actions respond to and one failure each can worsen.",
    practicalTask: "Identify a motor model, tune a bounded controller, then test setpoint, disturbance, noise, delay and saturation cases.",
    commonMistakes: ["Tuning without actuator limits", "Calling one stable trace proof of robust stability", "Allowing integral wind-up"],
    diagnosticGuidance: "When oscillation appears, inspect loop delay, gain, sampling, saturation and sensor noise before retuning.",
    evidenceRequirement: "Model equations, parameter basis, response metrics, saturation trace, disturbance test and limitations.",
    masteryGate: "The controller meets declared rise, overshoot, steady-error and recovery criteria across nominal and named adverse cases.",
    resources: [{ label: "Python Control Systems Library", url: "https://python-control.readthedocs.io/", authority: "official" }],
    provenance: ["Python Control Systems Library documentation", "Engineering Mastery Lab PID simulation"],
    textEquivalent: "Reference and measured output enter a summing point; error drives a controller, actuator and plant, and the sensor closes the loop.",
    designReviewQuestion: "Which unmodelled delay or saturation most threatens the claimed response?",
    engineersAustraliaStage1: ["Knowledge and skill base", "Engineering application ability"]
  },
  {
    id: "EML-E3-D17",
    domainNumber: 17,
    stageId: "E3",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "Robot kinematics, dynamics and actuation",
    beginnerExplanation: "Robot models connect actuator motion and force to body motion in labelled coordinate frames. Mobile robots add wheel constraints, slip and terrain interaction.",
    prerequisites: ["EML-E0-D03", "EML-E2-D09", "EML-E2-D16"],
    outcomes: ["Compose rigid transforms in the correct order", "Derive differential-drive body velocity", "Relate actuator limits to feasible motion"],
    vocabulary: [
      { term: "kinematics", meaning: "Geometry of motion without its force causes" },
      { term: "dynamics", meaning: "Relationship among forces, torques and motion" },
      { term: "actuation", meaning: "Conversion of available energy into controlled force or motion" }
    ],
    equations: [{
      expression: "v_wheel = r omega",
      variables: [
        { symbol: "v_wheel", meaning: "wheel tangential speed", unit: "m/s" },
        { symbol: "r", meaning: "wheel radius", unit: "m" },
        { symbol: "omega", meaning: "wheel angular speed", unit: "rad/s" }
      ],
      dimensionalCheck: "m/s = m x rad/s, with rad dimensionless"
    }],
    workedExample: {
      prompt: "A 0.05 m radius wheel turns at 10 rad/s. Find tangential speed.",
      substitution: "0.05 m x 10 rad/s",
      answer: 0.5,
      unit: "m/s",
      rounding: "Two significant figures",
      check: { operation: "product", inputs: [0.05, 10], expected: 0.5, tolerance: 0, independentMethod: "Ten radians per second covers 0.5 m/s at 0.05 m per radian." }
    },
    retrievalTask: "State the frames and sign convention needed for differential-drive forward and yaw velocity.",
    practicalTask: "Implement forward kinematics for a differential-drive rover, compare predicted and simulated paths and quantify slip-related error.",
    commonMistakes: ["Reversing transform order", "Mixing angular and linear velocity", "Assuming no slip on every surface"],
    diagnosticGuidance: "If straight commands curve, inspect wheel-radius mismatch, encoder sign, timing, track width and slip.",
    evidenceRequirement: "Frame diagram, equations, unit tests, simulated path, error metric and actuator feasibility check.",
    masteryGate: "Forward and inverse calculations agree on valid cases, reject infeasible commands and match a simulated nominal path within a stated tolerance.",
    resources: [{ label: "Modern Robotics", url: "https://modernrobotics.northwestern.edu/", authority: "primary" }],
    provenance: ["Modern Robotics course and textbook"],
    textEquivalent: "Left and right wheels are separated by track width; body x points forward, body y left, and wheel speeds combine into forward and yaw motion.",
    designReviewQuestion: "Which model assumption fails first on the intended terrain?",
    engineersAustraliaStage1: ["Knowledge and skill base", "Engineering application ability"]
  },
  {
    id: "EML-E3-D18",
    domainNumber: 18,
    stageId: "E3",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "ROS 2 and robot simulation integration",
    beginnerExplanation: "ROS 2 connects independently testable robot components through typed interfaces and DDS policies. TF, URDF, ros2_control, Gazebo, RViz, bags and diagnostics make geometry, control and evidence inspectable.",
    prerequisites: ["EML-E1-D07", "EML-E2-D14", "EML-E3-D17"],
    outcomes: ["Design a ROS 2 interface graph", "Configure QoS from delivery needs", "Build and test a simulated robot package with diagnostics"],
    vocabulary: [
      { term: "QoS", meaning: "Policies controlling DDS communication behaviour" },
      { term: "TF", meaning: "Time-indexed coordinate transform graph" },
      { term: "bag", meaning: "Recorded topic data and metadata for replay and analysis" }
    ],
    equations: [{
      expression: "L = t_receive - t_source",
      variables: [
        { symbol: "L", meaning: "message latency", unit: "s" },
        { symbol: "t_receive", meaning: "receiver timestamp", unit: "s" },
        { symbol: "t_source", meaning: "source timestamp on a common clock basis", unit: "s" }
      ],
      dimensionalCheck: "s = s - s"
    }],
    workedExample: {
      prompt: "Observed message latencies are 0.012 s, 0.018 s and 0.015 s. Report the maximum.",
      substitution: "max(0.012, 0.018, 0.015) s",
      answer: 0.018,
      unit: "s",
      rounding: "Three decimal places",
      check: { operation: "maximum", inputs: [0.012, 0.018, 0.015], expected: 0.018, tolerance: 0, independentMethod: "Ordering the values gives 0.012 < 0.015 < 0.018 s." }
    },
    retrievalTask: "Explain why a TF frame name, timestamp and parent-child direction all matter.",
    practicalTask: "Build a simulated rover package with URDF/Xacro, ros2_control, launch tests, a bagged mission and diagnostic status.",
    commonMistakes: ["Using mismatched QoS", "Publishing conflicting TF parents", "Treating a visual RViz result as an automated test"],
    diagnosticGuidance: "Inspect graph, interface types, QoS, clocks, frame tree, lifecycle state and message age in that order.",
    evidenceRequirement: "Package graph, interface contract, TF tree, simulation capture with text equivalent, bag metadata, diagnostics and test output.",
    masteryGate: "A clean workspace build launches deterministically, package tests pass, TF is connected and time-consistent, and stale data produces an explicit degraded state.",
    resources: [
      { label: "ROS 2 Jazzy Documentation", url: "https://docs.ros.org/en/jazzy/", authority: "official" },
      { label: "Gazebo ROS Installation", url: "https://gazebosim.org/docs/jetty/ros_installation/", authority: "official" }
    ],
    provenance: ["Official ROS 2 Jazzy documentation", "Official Gazebo documentation", "Workbook stable and future technology lanes"],
    textEquivalent: "Sensor, state estimation, planning and control nodes exchange typed topics; TF links map, odom, base and sensor frames; diagnostics observe each boundary.",
    designReviewQuestion: "Which QoS and clock assumptions must hold for this data flow to remain valid?",
    engineersAustraliaStage1: ["Knowledge and skill base", "Engineering application ability"]
  },
  {
    id: "EML-E3-D19",
    domainNumber: 19,
    stageId: "E3",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "Bayesian estimation and sensor fusion",
    beginnerExplanation: "Estimation combines a model, uncertain measurements and prior state. Covariance expresses uncertainty and correlation; it is not a decorative tuning value.",
    prerequisites: ["EML-E1-D04", "EML-E2-D12", "EML-E2-D16"],
    outcomes: ["Explain prediction and correction", "Propagate simple independent variance", "Inspect innovation and covariance consistency"],
    vocabulary: [
      { term: "prior", meaning: "State belief before the current measurement" },
      { term: "innovation", meaning: "Measurement minus predicted measurement" },
      { term: "covariance", meaning: "Matrix describing variance and pairwise linear correlation" }
    ],
    equations: [{
      expression: "var(a + b) = var(a) + var(b), for independent a and b",
      variables: [
        { symbol: "var(a + b)", meaning: "variance of the sum", unit: "m^2" },
        { symbol: "var(a)", meaning: "variance of the first independent quantity", unit: "m^2" },
        { symbol: "var(b)", meaning: "variance of the second independent quantity", unit: "m^2" }
      ],
      dimensionalCheck: "m^2 = m^2 + m^2"
    }],
    workedExample: {
      prompt: "Independent position errors have variances 0.04 m^2 and 0.09 m^2. Find variance of their sum.",
      substitution: "0.04 m^2 + 0.09 m^2",
      answer: 0.13,
      unit: "m^2",
      rounding: "Two decimal places",
      check: { operation: "sum", inputs: [0.04, 0.09], expected: 0.13, tolerance: 1e-12, independentMethod: "Thirteen hundredths equals four hundredths plus nine hundredths." }
    },
    retrievalTask: "Describe prior, prediction, measurement, innovation, gain and posterior without using the word filter.",
    practicalTask: "Fuse wheel odometry and a noisy position measurement in a small Kalman or EKF simulation and plot innovation and covariance.",
    commonMistakes: ["Adding standard deviations as variances", "Assuming sensor errors are independent", "Tuning covariance only for a smooth-looking path"],
    diagnosticGuidance: "Persistent innovation bias points to model or sensor bias; excessive normalised innovation suggests understated uncertainty or outliers.",
    evidenceRequirement: "Model, noise assumptions, seeded dataset, state and covariance traces, innovation analysis and failure case.",
    masteryGate: "The filter improves a declared metric on held-back data and detects at least one intentionally inconsistent assumption.",
    resources: [{ label: "FilterPy Documentation", url: "https://filterpy.readthedocs.io/", authority: "community" }],
    provenance: ["FilterPy documentation", "Workbook Kalman and EKF sessions"],
    textEquivalent: "Prediction expands uncertainty, a measurement arrives with its own uncertainty, and correction moves the estimate while reducing uncertainty according to their relative confidence.",
    designReviewQuestion: "What evidence shows the covariance is consistent with actual error?",
    engineersAustraliaStage1: ["Knowledge and skill base", "Engineering application ability"]
  },
  {
    id: "EML-E3-D20",
    domainNumber: 20,
    stageId: "E3",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "Localisation, SLAM and motion planning",
    beginnerExplanation: "Localisation estimates pose in a map; SLAM estimates pose and map together. Planning chooses feasible motion through known and uncertain space, with recovery and mission-level acceptance criteria.",
    prerequisites: ["EML-E3-D17", "EML-E3-D18", "EML-E3-D19"],
    outcomes: ["Explain map, odom and base frame roles", "Evaluate localisation and map quality", "Benchmark a Nav2 mission including recovery"],
    vocabulary: [
      { term: "occupancy grid", meaning: "Cell map representing free, occupied and unknown belief" },
      { term: "localisation", meaning: "Estimation of robot pose relative to a reference map" },
      { term: "recovery", meaning: "Bounded behaviour intended to escape a planning or control failure state" }
    ],
    equations: [{
      expression: "R_success = n_success / n_attempt",
      variables: [
        { symbol: "R_success", meaning: "mission success ratio", unit: "1" },
        { symbol: "n_success", meaning: "missions meeting all criteria", unit: "1" },
        { symbol: "n_attempt", meaning: "valid mission attempts", unit: "1" }
      ],
      dimensionalCheck: "1 = 1/1"
    }],
    workedExample: {
      prompt: "Eighteen of 20 valid missions meet all criteria. Find success ratio.",
      substitution: "18 / 20",
      answer: 0.9,
      unit: "1",
      rounding: "0.90, equivalent to 90 percent",
      check: { operation: "quotient", inputs: [18, 20], expected: 0.9, tolerance: 0, independentMethod: "Two failures in 20 are 10 percent, leaving 90 percent success." }
    },
    retrievalTask: "Explain what must remain continuous in odom and what may jump in map.",
    practicalTask: "Run a repeated simulated mission with localisation perturbation, dynamic obstacle and blocked-path recovery, then retain mission metrics.",
    commonMistakes: ["Counting an invalid launch as a mission failure without classification", "Optimising path length while ignoring collision margin", "Masking TF errors with planner tuning"],
    diagnosticGuidance: "Separate mapping, localisation, global planning, local control, costmap, recovery and mission-orchestration faults.",
    evidenceRequirement: "Map and frame description, seeded scenarios, attempts table, path and clearance metrics, recovery logs and failure taxonomy.",
    masteryGate: "The mission meets stated success, collision, localisation and recovery criteria across repeated nominal and adverse trials.",
    resources: [
      { label: "Nav2 Documentation", url: "https://docs.nav2.org/", authority: "official" },
      { label: "SLAM Toolbox Documentation", url: "https://docs.ros.org/en/jazzy/p/slam_toolbox/", authority: "official" }
    ],
    provenance: ["Official Nav2 documentation", "Official ROS 2 SLAM Toolbox documentation"],
    textEquivalent: "A map contains free, occupied and unknown cells; a global path crosses free space, a local trajectory avoids a new obstacle, and a recovery branch handles blockage.",
    designReviewQuestion: "How are invalid trials, recovery successes and unsafe near-misses represented in the headline metric?",
    engineersAustraliaStage1: ["Knowledge and skill base", "Engineering application ability"]
  },
  {
    id: "EML-E3-D21",
    domainNumber: 21,
    stageId: "E3",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "Computer vision geometry and pose",
    beginnerExplanation: "A camera projects three-dimensional rays onto a two-dimensional image. Calibration estimates the camera model; OpenCV operations then support geometry, feature processing and pose estimation with measurable reprojection error.",
    prerequisites: ["EML-E0-D03", "EML-E1-D04", "EML-E1-D07"],
    outcomes: ["Explain pinhole projection", "Calibrate and validate a camera", "Estimate pose and report reprojection error"],
    vocabulary: [
      { term: "intrinsics", meaning: "Camera parameters mapping rays to image coordinates" },
      { term: "distortion", meaning: "Departure from the ideal projection model" },
      { term: "reprojection error", meaning: "Distance between observed and model-projected image points" }
    ],
    equations: [{
      expression: "u = f_x X / Z",
      variables: [
        { symbol: "u", meaning: "horizontal image coordinate relative to principal point", unit: "px" },
        { symbol: "f_x", meaning: "horizontal focal length", unit: "px" },
        { symbol: "X", meaning: "horizontal camera-frame coordinate", unit: "m" },
        { symbol: "Z", meaning: "forward camera-frame coordinate", unit: "m" }
      ],
      dimensionalCheck: "px = px x m/m"
    }],
    workedExample: {
      prompt: "With fx = 800 px, X = 0.2 m and Z = 2 m, find u.",
      substitution: "800 px x 0.2 m / 2 m",
      answer: 80,
      unit: "px",
      rounding: "Exact pixel-coordinate model value",
      check: { operation: "product-quotient", inputs: [800, 0.2], divisor: 2, expected: 80, tolerance: 0, independentMethod: "X/Z is 0.1, and 10 percent of 800 px is 80 px." }
    },
    retrievalTask: "State the frames, units and distortion assumptions in a calibrated projection.",
    practicalTask: "Calibrate a camera from a retained image set, hold out images, estimate a target pose and analyse reprojection residuals.",
    commonMistakes: ["Evaluating on calibration images only", "Mixing metres and millimetres", "Ignoring rolling shutter, blur and timestamp alignment"],
    diagnosticGuidance: "Spatially patterned residuals suggest model mismatch; large isolated residuals suggest point detection or correspondence errors.",
    evidenceRequirement: "Dataset provenance, calibration settings, intrinsic and distortion values, held-out residuals, pose result and limitations.",
    masteryGate: "Held-out reprojection error meets a declared threshold and a known-distance pose check agrees within stated uncertainty.",
    resources: [{ label: "OpenCV Camera Calibration", url: "https://docs.opencv.org/4.x/dc/dbb/tutorial_py_calibration.html", authority: "official" }],
    provenance: ["Official OpenCV documentation"],
    textEquivalent: "A 3D point connects by a ray through the camera centre to an image pixel; focal length scales X divided by depth Z.",
    designReviewQuestion: "Which dataset condition is absent from the calibration set but expected in operation?",
    engineersAustraliaStage1: ["Knowledge and skill base", "Engineering application ability"]
  },
  {
    id: "EML-E3-D22",
    domainNumber: 22,
    stageId: "E3",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "Machine learning foundations and evaluation",
    beginnerExplanation: "Machine learning fits a model from data. A credible result starts with data quality, leakage control, appropriate baselines and metrics that expose errors relevant to the robot's operating context.",
    prerequisites: ["EML-E1-D04", "EML-E1-D07"],
    outcomes: ["Construct train, validation and held-out test splits", "Compare a baseline with regression, classification or neural models", "Report class-wise errors and limitations"],
    vocabulary: [
      { term: "leakage", meaning: "Information entering training that would not be available at prediction time" },
      { term: "precision", meaning: "True positives divided by predicted positives" },
      { term: "transfer learning", meaning: "Adapting representations learned on another task or dataset" }
    ],
    equations: [{
      expression: "precision = TP / (TP + FP)",
      variables: [
        { symbol: "TP", meaning: "true-positive count", unit: "1" },
        { symbol: "FP", meaning: "false-positive count", unit: "1" },
        { symbol: "precision", meaning: "positive predictive value", unit: "1" }
      ],
      dimensionalCheck: "1 = 1/(1 + 1)"
    }],
    workedExample: {
      prompt: "A detector makes 100 positive predictions and 80 are correct. Find precision.",
      substitution: "80 / 100",
      answer: 0.8,
      unit: "1",
      rounding: "0.80, equivalent to 80 percent",
      check: { operation: "quotient", inputs: [80, 100], expected: 0.8, tolerance: 0, independentMethod: "Twenty false positives from 100 predictions imply 100 percent - 20 percent = 80 percent." }
    },
    retrievalTask: "Explain why a high aggregate accuracy can coexist with dangerous class-specific failure.",
    practicalTask: "Train a transparent baseline and one improved model on a versioned dataset, then evaluate held-out confusion, calibration and edge cases.",
    commonMistakes: ["Tuning on the test set", "Reporting one metric only", "Ignoring duplicate or correlated samples across splits"],
    diagnosticGuidance: "When validation is strong but test performance collapses, inspect leakage, distribution shift, split grain and preprocessing drift.",
    evidenceRequirement: "Dataset card, split manifest, baseline, training configuration, held-out metrics, confusion analysis and model limitations.",
    masteryGate: "The improved model beats the declared baseline on a held-out decision-relevant metric without leakage and with documented failure cases.",
    resources: [
      { label: "scikit-learn Model Evaluation", url: "https://scikit-learn.org/stable/modules/model_evaluation.html", authority: "official" },
      { label: "PyTorch Tutorials", url: "https://pytorch.org/tutorials/", authority: "official" }
    ],
    provenance: ["Official scikit-learn documentation", "Official PyTorch tutorials", "Workbook ML evaluation sessions"],
    textEquivalent: "A dataset is split by independent unit into training, validation and sealed test sets; a confusion matrix counts each actual-predicted class pair.",
    designReviewQuestion: "Which false positive or false negative has the greater system consequence, and does the selected metric reflect it?",
    engineersAustraliaStage1: ["Knowledge and skill base", "Engineering application ability"]
  },
  {
    id: "EML-E3-D23",
    domainNumber: 23,
    stageId: "E3",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "AI/ML integration for robots",
    beginnerExplanation: "A model becomes a robot subsystem only after timestamps, preprocessing, interfaces, latency, compute limits, confidence handling, fallbacks and evidence are engineered together.",
    prerequisites: ["EML-E2-D13", "EML-E2-D14", "EML-E3-D18", "EML-E3-D22"],
    outcomes: ["Budget end-to-end inference latency", "Preserve dataset and model provenance", "Design a safe fallback for low-confidence or stale output"],
    vocabulary: [
      { term: "inference latency", meaning: "Elapsed time from required input availability to usable model output" },
      { term: "provenance", meaning: "Traceable origin and transformations of data, code and model artefacts" },
      { term: "distribution shift", meaning: "Operational data differing materially from development data" }
    ],
    equations: [{
      expression: "L_total = L_capture + L_inference + L_action",
      variables: [
        { symbol: "L_total", meaning: "end-to-end latency", unit: "s" },
        { symbol: "L_capture", meaning: "capture and preprocessing latency", unit: "s" },
        { symbol: "L_inference", meaning: "model inference latency", unit: "s" },
        { symbol: "L_action", meaning: "decision and actuation latency", unit: "s" }
      ],
      dimensionalCheck: "s = s + s + s"
    }],
    workedExample: {
      prompt: "Capture takes 0.012 s, inference 0.028 s and action 0.010 s. Find total latency.",
      substitution: "0.012 s + 0.028 s + 0.010 s",
      answer: 0.05,
      unit: "s",
      rounding: "0.050 s, equivalent to 50 ms",
      check: { operation: "sum", inputs: [0.012, 0.028, 0.01], expected: 0.05, tolerance: 1e-12, independentMethod: "12 ms + 28 ms + 10 ms = 50 ms." }
    },
    retrievalTask: "Name the timestamps needed to distinguish sensor age, queue delay, inference time and actuation delay.",
    practicalTask: "Integrate a bounded perception model into a simulated robot, record latency distribution, stale-output handling and one distribution-shift failure.",
    commonMistakes: ["Measuring inference only", "Treating confidence as calibrated probability", "Silently reusing stale detections"],
    diagnosticGuidance: "Trace source timestamp, preprocessing, queue, device synchronisation, model version, postprocessing and consumer deadline separately.",
    evidenceRequirement: "Interface contract, model and dataset provenance, timing trace, hardware basis, failure taxonomy, fallback test and limitations.",
    masteryGate: "The integrated subsystem meets a percentile latency threshold and reaches a declared safe fallback for stale, invalid and low-confidence output.",
    resources: [{ label: "NIST AI Risk Management Framework", url: "https://www.nist.gov/itl/ai-risk-management-framework", authority: "official" }],
    provenance: ["NIST AI Risk Management Framework", "Workbook robot ML deployment sessions"],
    textEquivalent: "Timestamped sensor data passes through preprocessing, a bounded inference queue, model and postprocessing; a freshness gate selects result use or safe fallback.",
    designReviewQuestion: "What evidence shows the model output remains timely and meaningful at the actuator decision point?",
    engineersAustraliaStage1: officialStage1Map
  },
  {
    id: "EML-E4-D24",
    domainNumber: 24,
    stageId: "E4",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "Systems engineering, safety and verification",
    beginnerExplanation: "Systems engineering keeps needs, requirements, architecture, interfaces, risks and tests traceable. Safety and cybersecurity require explicit boundaries, safe states and evidence, not optimistic labels.",
    prerequisites: ["EML-E2-D10", "EML-E2-D14", "EML-E3-D20", "EML-E3-D23"],
    outcomes: ["Write measurable requirements and interfaces", "Perform a bounded FMEA and threat review", "Build requirements-to-test traceability with retained evidence"],
    vocabulary: [
      { term: "verification", meaning: "Evidence that specified requirements were met" },
      { term: "validation", meaning: "Evidence that the realised system serves the intended use and context" },
      { term: "safe state", meaning: "Defined condition intended to control risk after a fault or uncertainty" },
      { term: "FMEA", meaning: "Structured analysis of failure modes, effects and actions" }
    ],
    equations: [{
      expression: "RPN = S x O x D",
      variables: [
        { symbol: "RPN", meaning: "relative risk-priority number within one stated scoring scheme", unit: "1" },
        { symbol: "S", meaning: "severity rank", unit: "1" },
        { symbol: "O", meaning: "occurrence rank", unit: "1" },
        { symbol: "D", meaning: "detection rank", unit: "1" }
      ],
      dimensionalCheck: "1 = 1 x 1 x 1"
    }],
    workedExample: {
      prompt: "Within one local FMEA scheme, S = 4, O = 3 and D = 2. Find RPN.",
      substitution: "4 x 3 x 2",
      answer: 24,
      unit: "1",
      rounding: "Exact ordinal product; not an absolute risk probability",
      check: { operation: "product", inputs: [4, 3, 2], expected: 24, tolerance: 0, independentMethod: "4 x 3 = 12, and 12 x 2 = 24." }
    },
    retrievalTask: "Explain the distinction among a requirement, verification method, validation evidence and residual risk.",
    practicalTask: "Create a rover system architecture, interface set, FMEA, cybersecurity boundary and bidirectional requirements-to-test matrix.",
    commonMistakes: ["Writing untestable requirements", "Treating RPN as probability", "Closing a risk without verifying the mitigation"],
    diagnosticGuidance: "For every unsupported claim, trace backwards through result, test, requirement, interface and source assumption until the missing record is visible.",
    evidenceRequirement: "Requirements, architecture, interface control, FMEA, threat boundary, test procedures, results and traceability matrix.",
    masteryGate: "Every in-scope requirement has an executed test or an explicit unresolved status, and every high-priority risk has a verified control or documented residual risk.",
    resources: [
      { label: "NIST Cybersecurity Framework", url: "https://www.nist.gov/cyberframework", authority: "official" },
      { label: "NASA Systems Engineering Handbook", url: "https://www.nasa.gov/reference/systems-engineering-handbook/", authority: "official" }
    ],
    provenance: ["NIST Cybersecurity Framework", "NASA Systems Engineering Handbook", "Engineering Mastery Lab evidence kernel"],
    textEquivalent: "Needs trace to requirements, architecture and interfaces; each requirement traces to a test and result, while risks trace to controls and residual decisions.",
    designReviewQuestion: "Which safety or security claim currently has the weakest traceable evidence?",
    engineersAustraliaStage1: officialStage1Map
  },
  {
    id: "EML-E4-D25",
    domainNumber: 25,
    stageId: "E4",
    contentVersion: MASTERY_CONTENT_VERSION,
    title: "Professional engineering and capstone proof",
    beginnerExplanation: "Professional engineering integrates ethics, sustainability, economics, delivery, teamwork and communication. A defensible capstone shows decisions, limitations, verification and learning through reviewable evidence.",
    prerequisites: ["EML-E4-D24"],
    outcomes: ["Make an evidence-led ethical and sustainability decision", "Plan cost, schedule, teamwork and review", "Present a capstone claim with traceable proof and limitations"],
    vocabulary: [
      { term: "stakeholder", meaning: "Person or group affected by or able to affect the system" },
      { term: "earned value", meaning: "Budgeted value of completed work under a defined baseline" },
      { term: "engineering judgement", meaning: "Reasoned decision using evidence, standards, uncertainty and consequences" }
    ],
    equations: [{
      expression: "CV = EV - AC",
      variables: [
        { symbol: "CV", meaning: "cost variance", unit: "AUD" },
        { symbol: "EV", meaning: "earned value", unit: "AUD" },
        { symbol: "AC", meaning: "actual cost", unit: "AUD" }
      ],
      dimensionalCheck: "AUD = AUD - AUD"
    }],
    workedExample: {
      prompt: "Earned value is AUD 9500 and actual cost is AUD 10000. Find cost variance.",
      substitution: "AUD 9500 - AUD 10000",
      answer: -500,
      unit: "AUD",
      rounding: "Exact dollars for supplied values",
      check: { operation: "subtract", inputs: [9500, 10000], expected: -500, tolerance: 0, independentMethod: "Actual cost exceeds earned value by AUD 500, so variance is negative AUD 500." }
    },
    retrievalTask: "State one ethical, sustainability, economic, delivery and communication obligation for a field robot project.",
    practicalTask: "Complete an end-to-end rover capstone review with requirements, architecture, build or simulation, tests, risk, cost, sustainability, reflection and presentation.",
    commonMistakes: ["Presenting activity as outcome", "Hiding failed tests", "Claiming individual ownership of team work without role evidence"],
    diagnosticGuidance: "If a portfolio claim cannot be traced to a dated artefact and acceptance criterion, narrow or remove the claim.",
    evidenceRequirement: "Capstone evidence pack, cost and schedule basis, ethics and sustainability review, contribution record, presentation and question log.",
    masteryGate: "An independent reviewer can trace every material claim to evidence, reproduce a key result and identify limitations without relying on unsupported narrative.",
    resources: [
      { label: "Engineers Australia Stage 1 Competency Standard", url: "https://www.engineersaustralia.org.au/publications/stage-1-competency-standard-professional-engineer", authority: "official" },
      { label: "Engineers Australia Code of Ethics", url: "https://www.engineersaustralia.org.au/about-engineering/code-ethics", authority: "official" }
    ],
    provenance: ["Engineers Australia Stage 1 categories used only as non-accrediting educational guidance", "Engineers Australia Code of Ethics"],
    textEquivalent: "A capstone evidence graph connects stakeholder needs to requirements, decisions, design records, tests, results, risks, costs, reflection and presentation claims.",
    designReviewQuestion: "Which material claim would you withdraw if the reviewer rejected one piece of evidence?",
    engineersAustraliaStage1: officialStage1Map
  }
];

export { masteryContentIdAliases } from "./curriculumMetadata";
