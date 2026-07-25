import type { Difficulty } from "./pathways";

export interface ProjectMilestone {
  id: string;
  title: string;
  description: string;
  validation: string;
}

export interface EngineeringProject {
  id: string;
  slug: string;
  title: string;
  summary: string;
  disciplines: string[];
  difficulty: Difficulty;
  effortHours: number;
  budgetAud: { minimum: number; maximum: number; basis: string };
  prerequisites: string[];
  outcomes: string[];
  requiredSoftware: string[];
  optionalHardware: string[];
  safetyBoundary: string;
  milestones: ProjectMilestone[];
  validationCriteria: string[];
  portfolioEvidence: string[];
  extensionChallenges: string[];
  linkedLabs: string[];
  linkedTools: string[];
  linkedSkills: string[];
}

const commonSafety = "Use simulation or extra-low-voltage prototypes only. Verify ratings, isolation, guarding, emergency controls, and manufacturer instructions before any physical implementation.";

export const projects: EngineeringProject[] = [
  {
    id: "temperature-controller",
    slug: "temperature-controller",
    title: "Closed-loop temperature controller",
    summary: "Specify, model, tune, and verify a low-energy thermal control loop with measurable response criteria.",
    disciplines: ["Controls", "Electrical", "Embedded"],
    difficulty: "Intermediate",
    effortHours: 14,
    budgetAud: { minimum: 0, maximum: 90, basis: "Estimate for optional extra-low-voltage sensor and heater hardware; simulation costs AUD 0." },
    prerequisites: ["PID response basics", "Voltage and power fundamentals"],
    outcomes: ["Translate thermal requirements into response criteria", "Tune a bounded controller", "Record disturbance and safety evidence"],
    requiredSoftware: ["PID Control Lab", "Spreadsheet or engineering notebook"],
    optionalHardware: ["Low-voltage heater", "Temperature sensor", "Microcontroller"],
    safetyBoundary: commonSafety,
    milestones: [
      { id: "requirements", title: "Define requirements", description: "Set range, settling, overshoot, and disturbance limits.", validation: "Every requirement has a unit and a pass criterion." },
      { id: "model", title: "Model the plant", description: "Identify a first-order thermal approximation.", validation: "State assumptions and reconcile steady-state power." },
      { id: "tune", title: "Tune the loop", description: "Select gains and document the method.", validation: "Response satisfies the stated simulation criteria." },
      { id: "verify", title: "Verify and report", description: "Run nominal, disturbance, and saturation cases.", validation: "Evidence covers all requirements and limitations." }
    ],
    validationCriteria: ["Overshoot and settling meet the learner-defined limits", "Disturbance recovery is measured", "Output saturation is tested", "Safety boundary is explicit"],
    portfolioEvidence: ["Requirements table", "Plant model", "Response plots", "Verification summary"],
    extensionChallenges: ["Add anti-windup reasoning", "Compare two tuning methods"],
    linkedLabs: ["pid", "electrical", "embedded"],
    linkedTools: ["calculator-control", "workbench"],
    linkedSkills: ["controls", "electronics", "embedded"]
  },
  {
    id: "sensor-data-logger",
    slug: "sensor-data-logger",
    title: "Sensor signal chain and data logger",
    summary: "Design a measurable analogue signal path from sensor range through filtering, conversion, and logged engineering units.",
    disciplines: ["Electrical", "Embedded", "Data"],
    difficulty: "Intermediate",
    effortHours: 16,
    budgetAud: { minimum: 0, maximum: 120, basis: "Estimate for optional sensor, microcontroller, passives, and enclosure." },
    prerequisites: ["Voltage divider", "ADC resolution", "Basic firmware"],
    outcomes: ["Allocate an error budget", "Select scaling and filtering", "Validate conversion into engineering units"],
    requiredSoftware: ["Electrical Lab", "Embedded Lab"],
    optionalHardware: ["Sensor", "Microcontroller board", "Passive components"],
    safetyBoundary: commonSafety,
    milestones: [
      { id: "range", title: "Define the measurement range", description: "State input, output, resolution, and sampling needs.", validation: "Ranges and units are internally consistent." },
      { id: "chain", title: "Design the signal chain", description: "Choose scaling, filtering, and ADC assumptions.", validation: "Worst-case voltage remains within ADC limits." },
      { id: "firmware", title: "Implement conversion logic", description: "Convert codes into engineering units with faults.", validation: "Boundary and invalid-input cases are tested." },
      { id: "calibration", title: "Calibrate and report", description: "Compare reference and logged values.", validation: "Error and uncertainty are reported without false precision." }
    ],
    validationCriteria: ["ADC limits are respected", "Filter target is demonstrated", "Conversion endpoints pass", "Calibration residuals are reported"],
    portfolioEvidence: ["Signal-chain diagram", "Error budget", "Firmware test table", "Calibration plot"],
    extensionChallenges: ["Add sensor disconnection detection", "Compare moving-average and RC filtering"],
    linkedLabs: ["electrical", "embedded"],
    linkedTools: ["converter", "calculator-electrical"],
    linkedSkills: ["electronics", "embedded", "data"]
  },
  {
    id: "mobile-robot",
    slug: "mobile-robot",
    title: "Two-motor mobile robot with odometry",
    summary: "Develop and verify a differential-drive motion model, encoder estimate, and waypoint route.",
    disciplines: ["Robotics", "Embedded", "Mechanical"],
    difficulty: "Advanced",
    effortHours: 22,
    budgetAud: { minimum: 0, maximum: 280, basis: "Estimate for optional chassis, motors, encoders, driver, controller, and battery." },
    prerequisites: ["Coordinate geometry", "Embedded timing", "Motor fundamentals"],
    outcomes: ["Convert wheel motion into pose", "Quantify odometry drift", "Verify a bounded autonomous route"],
    requiredSoftware: ["Robotics Lab", "Embedded Lab"],
    optionalHardware: ["Two geared motors", "Encoders", "Motor driver", "Low-voltage battery"],
    safetyBoundary: "Use a low-speed, low-voltage platform in a clear test area. Provide a physical stop method and keep people away from the motion envelope.",
    milestones: [
      { id: "requirements", title: "Specify motion", description: "Define speed, route, accuracy, and stop criteria.", validation: "Every motion requirement is measurable." },
      { id: "kinematics", title: "Build kinematics", description: "Model wheel speeds and pose updates.", validation: "Straight, rotation, and arc cases match analytic expectations." },
      { id: "odometry", title: "Estimate pose", description: "Add encoder-based odometry and noise.", validation: "True and estimated pose are compared." },
      { id: "route", title: "Verify a route", description: "Complete a waypoint course and record errors.", validation: "Goal and safety boundaries are met." }
    ],
    validationCriteria: ["Three canonical motion cases pass", "Odometry error is quantified", "Route reaches the goal", "Stop behaviour is demonstrated"],
    portfolioEvidence: ["Kinematic derivation", "Trajectory plot", "Odometry error table", "Route test record"],
    extensionChallenges: ["Add heading correction", "Compare two localisation assumptions"],
    linkedLabs: ["robotics", "embedded", "mechanical"],
    linkedTools: ["calculator-mechanical"],
    linkedSkills: ["robotics", "embedded", "mechanical"]
  },
  {
    id: "plc-cell",
    slug: "plc-cell",
    title: "PLC conveyor and tank cell",
    summary: "Specify and validate a simulated industrial cell with modes, interlocks, alarms, and acceptance tests.",
    disciplines: ["Automation", "Industrial", "Verification"],
    difficulty: "Intermediate",
    effortHours: 20,
    budgetAud: { minimum: 0, maximum: 180, basis: "Estimate for an optional low-voltage tabletop demonstrator; simulation costs AUD 0." },
    prerequisites: ["Boolean logic", "PLC scan concepts"],
    outcomes: ["Design state and interlock logic", "Define actionable alarms", "Execute a traceable FAT"],
    requiredSoftware: ["PLC and SCADA Lab", "Systems and Professional Practice Lab"],
    optionalHardware: ["Low-voltage switches", "Indicator lamps", "Small pump demonstrator"],
    safetyBoundary: "Keep this project in simulation or an isolated extra-low-voltage demonstrator. It is not a procedure for production machinery or safety-rated control.",
    milestones: [
      { id: "io", title: "Define I/O and modes", description: "Create tags, states, and mode rules.", validation: "Every output has an authorised state source." },
      { id: "sequence", title: "Implement sequence logic", description: "Specify start, run, stop, reset, and fault transitions.", validation: "Illegal transitions are blocked." },
      { id: "alarms", title: "Design alarms and interlocks", description: "Define triggers, latches, reset, and response.", validation: "Each alarm is actionable and tested." },
      { id: "fat", title: "Execute FAT", description: "Run nominal and fault cases against requirements.", validation: "Every requirement has a recorded result." }
    ],
    validationCriteria: ["Normal sequence passes", "Jam restart is blocked", "High-high trip latches", "FAT reconciles to requirements"],
    portfolioEvidence: ["I/O list", "State diagram", "Alarm philosophy", "Completed FAT"],
    extensionChallenges: ["Add maintenance mode", "Create a cause-and-effect matrix"],
    linkedLabs: ["plc", "practice"],
    linkedTools: ["workbench"],
    linkedSkills: ["plc-scada", "safety", "documentation"]
  },
  {
    id: "condition-monitoring",
    slug: "condition-monitoring",
    title: "Vibration condition-monitoring demonstrator",
    summary: "Create a synthetic vibration-monitoring workflow that links frequency features to transparent alarm rules.",
    disciplines: ["Mechanical", "Data", "AI and ML"],
    difficulty: "Intermediate",
    effortHours: 16,
    budgetAud: { minimum: 0, maximum: 140, basis: "Estimate for optional accelerometer and low-voltage data-acquisition hardware." },
    prerequisites: ["Frequency and vibration basics", "Tabular data"],
    outcomes: ["Define a sampling strategy", "Extract interpretable features", "Validate thresholds against labelled conditions"],
    requiredSoftware: ["Mechanical Lab", "AI and ML Lab"],
    optionalHardware: ["Accelerometer", "Microcontroller", "Benchtop rotating demonstrator"],
    safetyBoundary: "Use synthetic data or a fully guarded low-energy demonstrator. Do not instrument operating industrial machinery without authorised risk controls.",
    milestones: [
      { id: "conditions", title: "Define conditions", description: "Create nominal and fault labels.", validation: "Labels and exclusions are explicit." },
      { id: "features", title: "Select features", description: "Calculate amplitude and frequency indicators.", validation: "Feature units and windows are recorded." },
      { id: "threshold", title: "Set alarm logic", description: "Choose thresholds from separated data.", validation: "False positives and misses are counted." },
      { id: "report", title: "Report limitations", description: "State what the demonstrator cannot infer.", validation: "Claims remain bounded to the observed data." }
    ],
    validationCriteria: ["Sampling is adequate for stated frequencies", "Features are reproducible", "Confusion counts reconcile", "Limitations are explicit"],
    portfolioEvidence: ["Data dictionary", "Feature plot", "Threshold test", "Limitations statement"],
    extensionChallenges: ["Compare time and frequency features", "Add a drift condition"],
    linkedLabs: ["mechanical", "ml"],
    linkedTools: ["converter"],
    linkedSkills: ["mechanical", "ai-ml", "data"]
  },
  {
    id: "motor-gearbox",
    slug: "motor-gearbox",
    title: "Motor and gearbox sizing study",
    summary: "Reconcile load, speed, torque, power, ratio, and margin for a defined motion duty.",
    disciplines: ["Mechanical", "Electrical", "Analysis"],
    difficulty: "Foundation",
    effortHours: 10,
    budgetAud: { minimum: 0, maximum: 60, basis: "Estimate for optional sample motor and gearbox only; the study itself costs AUD 0." },
    prerequisites: ["Power and ratio equations", "SI units"],
    outcomes: ["Build a duty-point model", "Check ratio and power consistency", "State margins and missing vendor data"],
    requiredSoftware: ["Mechanical Lab"],
    optionalHardware: ["Small DC motor", "Gearbox"],
    safetyBoundary: commonSafety,
    milestones: [
      { id: "duty", title: "Define duty", description: "State load, speed, cycle, and environment.", validation: "All quantities have units and bounds." },
      { id: "ratio", title: "Select ratio", description: "Calculate motor and load operating points.", validation: "Speed and torque transform consistently." },
      { id: "power", title: "Reconcile power", description: "Check ideal and assumed-efficiency power.", validation: "Loss assumptions are explicit." },
      { id: "selection", title: "Document selection", description: "Record margin and missing data.", validation: "No unsupported vendor claim is made." }
    ],
    validationCriteria: ["Torque and speed requirements pass", "Power balance reconciles", "Efficiency is not assumed as 100 percent", "Margin is stated"],
    portfolioEvidence: ["Duty table", "Ratio calculation", "Power check", "Selection rationale"],
    extensionChallenges: ["Add thermal duty reasoning", "Compare two ratios"],
    linkedLabs: ["mechanical", "electrical"],
    linkedTools: ["calculator-mechanical", "converter"],
    linkedSkills: ["mechanical", "electronics"]
  },
  {
    id: "vibration-rig",
    slug: "vibration-rig",
    title: "Vibration-isolation test rig",
    summary: "Design a bounded test that compares predicted and observed vibration response across isolation choices.",
    disciplines: ["Mechanical", "Verification"],
    difficulty: "Intermediate",
    effortHours: 14,
    budgetAud: { minimum: 15, maximum: 160, basis: "Estimate for optional masses, elastic elements, fasteners, and simple measurement hardware." },
    prerequisites: ["Natural frequency", "Damping ratio"],
    outcomes: ["Predict resonance", "Design a controlled test", "Compare model and measurement"],
    requiredSoftware: ["Mechanical Lab"],
    optionalHardware: ["Masses", "Springs or elastomer", "Phone accelerometer"],
    safetyBoundary: "Contain moving masses, limit amplitude and stored energy, inspect fixtures, and keep hands clear during excitation.",
    milestones: [
      { id: "model", title: "Predict response", description: "Calculate natural frequency and damping cases.", validation: "Dimensions and units are consistent." },
      { id: "rig", title: "Design the rig", description: "Define fixtures, excitation, and measurement.", validation: "Stored-energy and containment risks are addressed." },
      { id: "test", title: "Run the test", description: "Measure at multiple frequencies.", validation: "Raw readings and setup are retained." },
      { id: "compare", title: "Compare and explain", description: "Reconcile model and observation.", validation: "Discrepancies have plausible bounded causes." }
    ],
    validationCriteria: ["Predicted natural frequency is recorded", "At least three operating points are compared", "Fixture safety is documented", "Model discrepancy is quantified"],
    portfolioEvidence: ["Calculation sheet", "Rig sketch", "Test data", "Comparison report"],
    extensionChallenges: ["Estimate damping from decay", "Compare two isolators"],
    linkedLabs: ["mechanical", "practice"],
    linkedTools: ["calculator-mechanical"],
    linkedSkills: ["mechanical", "verification"]
  },
  {
    id: "predictive-maintenance",
    slug: "predictive-maintenance",
    title: "Predictive-maintenance data study",
    summary: "Build an honest local study of degradation, anomaly detection, and remaining-life assumptions.",
    disciplines: ["AI and ML", "Data", "Reliability"],
    difficulty: "Advanced",
    effortHours: 18,
    budgetAud: { minimum: 0, maximum: 0, basis: "Estimate for a synthetic local-data study with no paid service." },
    prerequisites: ["Regression", "Train and test separation"],
    outcomes: ["Prevent leakage", "Quantify detection performance", "Bound remaining-life claims"],
    requiredSoftware: ["AI and ML Lab"],
    optionalHardware: [],
    safetyBoundary: "Use synthetic or authorised de-identified data. Do not use this demonstrator as the sole basis for maintenance or safety decisions.",
    milestones: [
      { id: "question", title: "Define the decision", description: "State the target, horizon, and consequence.", validation: "The decision boundary is explicit." },
      { id: "data", title: "Prepare data", description: "Separate train, validation, and test periods.", validation: "No future information leaks into training." },
      { id: "model", title: "Build transparent baselines", description: "Compare threshold and regression approaches.", validation: "Metrics use the same held-out scope." },
      { id: "limits", title: "Report limitations", description: "Describe uncertainty and operational gaps.", validation: "No causal or safety claim exceeds evidence." }
    ],
    validationCriteria: ["Data split is time-aware", "Counts reconcile to the test set", "Baseline comparison is fair", "RUL assumptions are stated"],
    portfolioEvidence: ["Data scope", "Model notebook or calculations", "Held-out metrics", "Decision limitation"],
    extensionChallenges: ["Test distribution shift", "Add cost-sensitive thresholds"],
    linkedLabs: ["ml", "practice"],
    linkedTools: ["converter"],
    linkedSkills: ["ai-ml", "data", "reliability"]
  },
  {
    id: "pneumatic-concept",
    slug: "pneumatic-concept",
    title: "Pneumatic pick-and-place concept",
    summary: "Create a safe, simulation-first sequence and verification concept for a small pneumatic handling task.",
    disciplines: ["Automation", "Mechanical", "Safety"],
    difficulty: "Advanced",
    effortHours: 18,
    budgetAud: { minimum: 0, maximum: 250, basis: "Estimate for optional training-grade low-pressure components; simulation and documentation cost AUD 0." },
    prerequisites: ["Sequence logic", "Risk assessment"],
    outcomes: ["Define motion states", "Identify stored-energy risks", "Create a cause-and-effect test plan"],
    requiredSoftware: ["PLC and SCADA Lab", "Systems and Practice Lab"],
    optionalHardware: ["Training cylinder", "Low-pressure regulator", "Guarded fixture"],
    safetyBoundary: "This is a concept and simulation project. Pneumatic stored energy, pinch points, exhaust behaviour, and isolation require competent risk assessment before hardware work.",
    milestones: [
      { id: "task", title: "Define the task", description: "State positions, payload, cycle, and fault states.", validation: "The safe state is explicit." },
      { id: "sequence", title: "Design the sequence", description: "Create state and transition logic.", validation: "Every transition has a condition and timeout." },
      { id: "risk", title: "Analyse risk", description: "Create FMEA and safeguards.", validation: "Stored energy and pinch points are covered." },
      { id: "verify", title: "Plan verification", description: "Build nominal and fault tests.", validation: "All requirements map to tests." }
    ],
    validationCriteria: ["Safe state is defined", "Timeout and sensor faults are tested", "FMEA has mitigations", "No live-machine procedure is provided"],
    portfolioEvidence: ["Sequence diagram", "I/O concept", "FMEA", "Verification matrix"],
    extensionChallenges: ["Add manual recovery design", "Compare vacuum and gripper concepts"],
    linkedLabs: ["plc", "practice", "mechanical"],
    linkedTools: ["workbench"],
    linkedSkills: ["plc-scada", "mechanical", "safety"]
  },
  {
    id: "energy-dashboard",
    slug: "energy-dashboard",
    title: "Energy-monitoring dashboard",
    summary: "Transform local synthetic power readings into transparent energy, cost, and anomaly views.",
    disciplines: ["Electrical", "Data", "Software"],
    difficulty: "Intermediate",
    effortHours: 14,
    budgetAud: { minimum: 0, maximum: 100, basis: "Estimate for an optional low-voltage measurement demonstrator; synthetic data costs AUD 0." },
    prerequisites: ["Power and energy units", "Tabular data"],
    outcomes: ["Distinguish power from energy", "Reconcile interval totals", "Design accessible operational indicators"],
    requiredSoftware: ["Electrical Lab", "Local browser tools"],
    optionalHardware: ["Isolated low-voltage sensor demonstrator"],
    safetyBoundary: "Use synthetic data or isolated extra-low-voltage measurements. Do not connect improvised instrumentation to mains circuits.",
    milestones: [
      { id: "schema", title: "Define the data", description: "Specify timestamp, power, energy, and quality fields.", validation: "Units and intervals are unambiguous." },
      { id: "calculate", title: "Calculate energy", description: "Integrate interval power and reconcile totals.", validation: "Independent total agrees within the stated rounding rule." },
      { id: "display", title: "Design the dashboard", description: "Present trend, total, and status.", validation: "Status is not colour-only." },
      { id: "verify", title: "Test edge cases", description: "Cover missing, duplicate, and negative readings.", validation: "Invalid rows are reported, not silently counted." }
    ],
    validationCriteria: ["Power and energy units are correct", "Totals reconcile", "Missing and duplicate data are handled", "Accessible status labels exist"],
    portfolioEvidence: ["Data dictionary", "Calculation method", "Dashboard capture", "Edge-case tests"],
    extensionChallenges: ["Add tariff bands as labelled estimates", "Compare daily profiles"],
    linkedLabs: ["electrical", "ml"],
    linkedTools: ["converter"],
    linkedSkills: ["electronics", "data", "software"]
  },
  {
    id: "parametric-mount",
    slug: "parametric-mount",
    title: "Parametric mounting system concept",
    summary: "Create and verify a dimension-driven 2D mounting concept using the local CAD Studio.",
    disciplines: ["Mechanical", "Design", "Verification"],
    difficulty: "Foundation",
    effortHours: 10,
    budgetAud: { minimum: 0, maximum: 70, basis: "Estimate for optional prototype material and fasteners." },
    prerequisites: ["Basic dimensions", "Hole spacing and clearances"],
    outcomes: ["Drive geometry from parameters", "Check bounds and clearances", "Export a reviewable concept"],
    requiredSoftware: ["Local CAD Studio"],
    optionalHardware: ["Cardboard or sheet prototype", "Fasteners"],
    safetyBoundary: "The SVG output is a concept drawing, not a manufacturing-certified CAD model. Verify material, tolerances, loads, edges, and fabrication constraints independently.",
    milestones: [
      { id: "requirements", title: "Define interfaces", description: "State envelope, holes, thickness, and load assumptions.", validation: "All dimensions use millimetres." },
      { id: "parameters", title: "Create parameters", description: "Set width, height, margin, hole size, and count.", validation: "Inputs remain within local tool bounds." },
      { id: "clearance", title: "Check clearances", description: "Verify holes remain within the envelope.", validation: "Minimum edge distance is recorded." },
      { id: "export", title: "Export and review", description: "Save the SVG and annotate limitations.", validation: "Export dimensions match the visible parameters." }
    ],
    validationCriteria: ["All geometry is parameter-driven", "Hole diameter is smaller than margins", "Dimensions reconcile", "Concept limitation is stated"],
    portfolioEvidence: ["Requirements sketch", "Parameter table", "SVG concept", "Clearance check"],
    extensionChallenges: ["Add a second hole pattern", "Compare two material assumptions"],
    linkedLabs: ["mechanical", "practice"],
    linkedTools: ["cad-studio", "converter"],
    linkedSkills: ["mechanical", "documentation"]
  },
  {
    id: "mechatronic-evidence-pack",
    slug: "mechatronic-evidence-pack",
    title: "Small mechatronic system evidence pack",
    summary: "Create a coherent requirements, FMEA, FAT, decision, and evidence set for a bounded mechatronic concept.",
    disciplines: ["Mechatronics", "Verification", "Professional Practice"],
    difficulty: "Advanced",
    effortHours: 24,
    budgetAud: { minimum: 0, maximum: 120, basis: "Estimate for optional low-voltage prototype materials; documentation can be completed at AUD 0." },
    prerequisites: ["One completed technical lab", "Basic risk reasoning"],
    outcomes: ["Maintain traceability", "Separate claims from evidence", "Produce reviewable completion records"],
    requiredSoftware: ["Systems and Practice Lab", "Project Workbench where desktop capability is available"],
    optionalHardware: ["A bounded extra-low-voltage demonstrator"],
    safetyBoundary: "Keep system boundaries explicit. Learner-generated records do not certify compliance, safety, or professional approval.",
    milestones: [
      { id: "scope", title: "Define scope and requirements", description: "Write measurable requirements and exclusions.", validation: "Every requirement has a unique identifier and test." },
      { id: "risk", title: "Complete FMEA", description: "Identify failure modes and mitigations.", validation: "Highest-priority items have actions." },
      { id: "fat", title: "Execute FAT", description: "Run nominal and fault acceptance tests.", validation: "Results, deviations, and evidence are recorded." },
      { id: "pack", title: "Assemble the evidence pack", description: "Link requirements, tests, files, and decisions.", validation: "No completion claim lacks a record." }
    ],
    validationCriteria: ["Requirements are testable", "FMEA actions are explicit", "FAT covers every requirement", "Evidence links resolve or are clearly unavailable"],
    portfolioEvidence: ["Requirements set", "Traceability matrix", "FMEA", "FAT", "Decision log", "Completion summary"],
    extensionChallenges: ["Add change control", "Create a review checklist"],
    linkedLabs: ["practice", "embedded", "pid"],
    linkedTools: ["workbench", "diagnostics"],
    linkedSkills: ["documentation", "delivery", "safety"]
  }
];

export function projectById(id: string): EngineeringProject | undefined {
  return projects.find((project) => project.id === id || project.slug === id);
}
